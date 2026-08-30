// Edge function: analyze-resume
// Receives a base64-encoded PDF/DOCX file, extracts text server-side,
// calls Gemini 2.5 Flash for structured resume analysis, persists the
// result to Postgres (resume_analyses + usage_counters), and returns it.
// All AI calls happen server-side; no API key is ever sent to the client.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FREE_ANALYSES_PER_MONTH = 3;
const ABUSE_CEILING = 500; // internal cap on "Unlimited" — never surfaced in marketing
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const GEMINI_MODEL = "gemini-2.5-flash";

// Returns the effective plan for limit checks. FOUNDER → PRO_PLUS limits.
function effectivePlan(plan: string, isFounder: boolean | null): "FREE" | "PRO" | "PRO_PLUS" {
  if (isFounder) return "PRO_PLUS";
  if (plan === "PRO_PLUS") return "PRO_PLUS";
  if (plan === "PRO") return "PRO";
  return "FREE";
}

function analysesLimit(plan: string, isFounder: boolean | null): number {
  const eff = effectivePlan(plan, isFounder);
  if (eff === "FREE") return FREE_ANALYSES_PER_MONTH;
  return ABUSE_CEILING; // PRO and PRO_PLUS
}

const SYSTEM_PROMPT =
  "You are an expert career consultant, senior talent acquisition engineer, and ATS optimization coach. " +
  "Analyze the resume text against modern tech industry standards. " +
  "Respond ONLY with clean JSON matching the schema. No markdown fences, no explanation.";

const USER_PROMPT_TEMPLATE =
  "Analyze the following resume text and return a JSON object with EXACTLY these fields:\n" +
  "{\n" +
  '  "atsScore": number (0-100),\n' +
  '  "technicalScore": number (0-100),\n' +
  '  "experienceScore": number (0-100),\n' +
  '  "projectScore": number (0-100),\n' +
  '  "overallScore": number (0-100, weighted blend of the above),\n' +
  '  "strengths": string[] (3-6 concise bullet points),\n' +
  '  "weaknesses": string[] (3-6 concise bullet points),\n' +
  '  "suggestions": string[] (3-6 actionable, specific improvement suggestions),\n' +
  '  "currentSkills": string[] (technical skills detected in the resume),\n' +
  '  "missingSkills": string[] (important skills for a modern tech role that are absent),\n' +
  '  "suitableRolesText": string (1-2 sentence summary of roles the candidate is currently suited for),\n' +
  '  "atsReport": array of { "type": "formatting"|"missing_keyword"|"structure"|"grammar", "severity": "high"|"medium"|"low", "message": string } (specific ATS findings: formatting issues, missing keywords, structural problems, grammar issues)\n' +
  "}\n" +
  "Score strictly. Do not invent skills that are not in the resume. Return only the JSON.\n\n" +
  "RESUME TEXT:\n\"\"\"\n{RESUME_TEXT}\n\"\"\"";

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function callGeminiWithRetry(resumeText: string, apiKey: string): Promise<any> {
  const body = {
    contents: [
      { role: "user", parts: [{ text: USER_PROMPT_TEMPLATE.replace("{RESUME_TEXT}", resumeText) }] },
    ],
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  let lastErr: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 60000);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Gemini HTTP ${res.status}: ${txt.slice(0, 300)}`);
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini returned no text content.");
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Strip fences if present
        const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        parsed = JSON.parse(cleaned);
      }
      return parsed;
    } catch (err: any) {
      lastErr = err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error(`Gemini failed after 3 attempts: ${lastErr?.message ?? "unknown"}`);
}

function extractTextFromPdfBytes(bytes: Uint8Array): Promise<{ text: string; numPages: number }> {
  // Use pdfjs-dist in Deno via npm import
  return (async () => {
    const pdfjs = await import("npm:pdfjs-dist@4.7.76");
    // Deno-compatible: use the legacy build
    const doc = await (pdfjs as any).getDocument({ data: bytes, isBrowserSupported: false, useSystemFonts: false }).promise;
    let full = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      full += content.items.map((it: any) => it.str).join(" ") + "\n";
    }
    return { text: full.trim(), numPages: doc.numPages };
  })();
}

async function extractTextFromDocxBytes(bytes: Uint8Array): Promise<string> {
  const mammoth = await import("npm:mammoth@1.8.0");
  // mammoth.extractRawText expects a Buffer-like; pass Uint8Array via a Blob
  const blob = new Blob([bytes]);
  const result = await (mammoth as any).extractRawText({ arrayBuffer: await blob.arrayBuffer() });
  return result.value as string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Build a user-scoped client using the user's JWT
    const userClient = createClient(supabaseUrl, authHeader.replace("Bearer ", "") || anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;
    const email = userData.user.email ?? "";

    // Admin client for writes (bypasses RLS safely server-side)
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    // Load profile + plan (is_founder gives FOUNDER users PRO_PLUS limits)
    const { data: profile } = await admin.from("profiles").select("plan,is_founder").eq("id", userId).maybeSingle();
    const plan = (profile as any)?.plan ?? "FREE";
    const isFounder = (profile as any)?.is_founder === true;

    // Enforce plan-tier cap (FREE=3, PRO/PRO_PLUS/FOUNDER=ABUSE_CEILING)
    const mk = monthKey();
    const limit = analysesLimit(plan, isFounder);
    const { data: allowed, error: rpcErr } = await admin.rpc("increment_usage", {
      p_user_id: userId,
      p_month_key: mk,
      p_type: "analyses",
      p_limit: limit
    });
    
    if (rpcErr || !allowed) {
      return new Response(JSON.stringify({
        error: "You've reached your monthly resume analysis limit. Upgrade to Pro for unlimited.",
        code: "RESUME_ANALYSIS_LIMIT_REACHED",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Parse request body
    const payload = await req.json();
    const fileName: string = payload.fileName;
    const mimeType: string = payload.mimeType;
    const base64: string = payload.base64;
    if (!fileName || !mimeType || !base64) {
      return new Response(JSON.stringify({ error: "Missing file data." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Decode + validate size
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    if (bytes.length > MAX_FILE_BYTES) {
      return new Response(JSON.stringify({ error: "File exceeds 5MB limit." }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate type
    const lower = fileName.toLowerCase();
    const isPdf = mimeType === "application/pdf" || lower.endsWith(".pdf");
    const isDocx = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || lower.endsWith(".docx");
    const isTxt = mimeType === "text/plain" || lower.endsWith(".txt");
    if (!isPdf && !isDocx && !isTxt) {
      return new Response(JSON.stringify({ error: "Only PDF, DOCX, and TXT files are supported." }), { status: 415, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Extract text server-side
    let extractedText = "";
    let pdfPageCount = 0;
    try {
      if (isTxt) {
        extractedText = new TextDecoder().decode(bytes);
      } else if (isPdf) {
        const pdf = await extractTextFromPdfBytes(bytes);
        extractedText = pdf.text;
        pdfPageCount = pdf.numPages;
      } else {
        extractedText = await extractTextFromDocxBytes(bytes);
      }
    } catch (err: any) {
      return new Response(JSON.stringify({ error: `Failed to extract text from file: ${err.message}` }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!extractedText || extractedText.trim().length < 20) {
      // Scanned/image-only PDF: pdfjs opened the file and found pages,
      // but the text layer is empty — a strong signal the PDF is a
      // photo/scan rather than a native text PDF.
      if (isPdf && pdfPageCount >= 1) {
        return new Response(JSON.stringify({
          error: "This looks like a scanned or image-based PDF, which we can't read text from yet. Please upload a resume exported directly from Word/Google Docs, or a text-based PDF, rather than a scanned photo or image.",
          code: "SCANNED_PDF_DETECTED",
        }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Could not extract enough text from the file. Is it a valid resume?" }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Call Gemini
    let analysis: any;
    try {
      analysis = await callGeminiWithRetry(extractedText, geminiKey);
    } catch (err: any) {
      return new Response(JSON.stringify({ error: `AI analysis failed: ${err.message}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate the AI output shape — do NOT silently substitute filler
    const required = ["atsScore", "technicalScore", "experienceScore", "projectScore", "overallScore", "strengths", "weaknesses", "suggestions", "currentSkills", "missingSkills", "atsReport"];
    const missing = required.filter((k) => analysis[k] === undefined || analysis[k] === null);
    if (missing.length) {
      return new Response(JSON.stringify({ error: `AI returned incomplete analysis (missing: ${missing.join(", ")}). Please try again.` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Clamp scores
    const clamp = (n: any) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    const overallScore = clamp(analysis.overallScore);



    const row = {
      user_id: userId,
      file_name: fileName,
      extracted_text: extractedText.slice(0, 50000),
      overall_score: overallScore,
      ats_score: clamp(analysis.atsScore),
      technical_score: clamp(analysis.technicalScore),
      experience_score: clamp(analysis.experienceScore),
      project_score: clamp(analysis.projectScore),

      strengths: analysis.strengths ?? [],
      weaknesses: analysis.weaknesses ?? [],
      suggestions: analysis.suggestions ?? [],
      current_skills: analysis.currentSkills ?? [],
      missing_skills: analysis.missingSkills ?? [],
      suitable_roles_text: analysis.suitableRolesText ?? null,
      ats_report: Array.isArray(analysis.atsReport) ? analysis.atsReport : [],
    };

    const { data: inserted, error: insertErr } = await admin.from("resume_analyses").insert(row).select("*").single();
    if (insertErr || !inserted) {
      return new Response(JSON.stringify({ error: "Failed to save analysis." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Log AI usage for admin cost monitoring
    try {
      await admin.from("ai_usage_logs").insert({
        user_id: userId,
        service: "gemini",
        feature: "analyze-resume",
        tokens_in: Math.round(extractedText.length / 4),
        tokens_out: 800,
        estimated_cost_usd: 0.0005,
      });
    } catch { /* non-critical */ }

    return new Response(JSON.stringify({ analysis: inserted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Internal error." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
