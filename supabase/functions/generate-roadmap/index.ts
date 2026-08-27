// Edge function: generate-roadmap
// Receives a target career, fetches the user's latest resume analysis
// (current skills + missing skills), calls Gemini to build a week-by-week
// roadmap, persists milestones to Postgres, returns them.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT =
  "You are a senior engineering manager and career mentor. " +
  "Build a practical, week-by-week learning roadmap for a candidate targeting a specific role. " +
  "Respond ONLY with clean JSON. No markdown fences, no explanation.";

const USER_PROMPT_TEMPLATE =
  "Build a 6-8 week learning roadmap for a candidate targeting: {TARGET_ROLE}\n" +
  "Current skills: {CURRENT_SKILLS}\n" +
  "Missing skills: {MISSING_SKILLS}\n\n" +
  "Return JSON: { \"milestones\": [ { \"week\": number, \"title\": string, \"description\": string } ... ] }\n" +
  "Each week should build on the previous. Descriptions should be concrete and actionable (1-2 sentences). " +
  "Order milestones by week ascending. Return only the JSON.";

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

    const userClient = createClient(supabaseUrl, authHeader.replace("Bearer ", "") || anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const payload = await req.json();
    const targetRole: string = payload.targetRole;
    if (!targetRole) {
      return new Response(JSON.stringify({ error: "targetRole is required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch latest resume analysis for context
    const { data: latest } = await admin.from("resume_analyses").select("current_skills,missing_skills").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const currentSkills: string[] = (latest as any)?.current_skills ?? [];
    const missingSkills: string[] = (latest as any)?.missing_skills ?? [];

    const prompt = USER_PROMPT_TEMPLATE
      .replace("{TARGET_ROLE}", targetRole)
      .replace("{CURRENT_SKILLS}", currentSkills.join(", ") || "(none detected)")
      .replace("{MISSING_SKILLS}", missingSkills.join(", ") || "(none detected)");

    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
    };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`;

    let parsed: any;
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 60000);
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
      clearTimeout(timeout);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Gemini HTTP ${res.status}: ${txt.slice(0, 200)}`);
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini returned no text.");
      try { parsed = JSON.parse(text); }
      catch { parsed = JSON.parse(text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim()); }
    } catch (err: any) {
      return new Response(JSON.stringify({ error: `Roadmap generation failed: ${err.message}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const milestones = parsed?.milestones;
    if (!Array.isArray(milestones) || milestones.length === 0) {
      return new Response(JSON.stringify({ error: "AI returned no milestones." }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Delete existing milestones for this user (regenerating replaces)
    await admin.from("milestones").delete().eq("user_id", userId);

    const rows = milestones.map((m: any) => ({
      user_id: userId,
      week: Number(m.week) || 1,
      title: String(m.title ?? `Week ${m.week}`),
      description: String(m.description ?? ""),
      status: "LOCKED" as const,
    }));

    // First milestone starts IN_PROGRESS
    if (rows.length > 0) rows[0].status = "IN_PROGRESS";

    const { data: inserted, error: insErr } = await admin.from("milestones").insert(rows).select("*").order("week", { ascending: true });
    if (insErr) {
      return new Response(JSON.stringify({ error: "Failed to save roadmap." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Log AI usage for admin cost monitoring
    try {
      await admin.from("ai_usage_logs").insert({
        user_id: userId, service: "gemini", feature: "generate-roadmap",
        tokens_in: Math.round(prompt.length / 4), tokens_out: 600, estimated_cost_usd: 0.0004,
      });
    } catch { /* non-critical */ }

    return new Response(JSON.stringify({ milestones: inserted }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Internal error." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
