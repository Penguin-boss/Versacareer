// Edge function: mentor-chat
// Receives the user's new message, fetches the latest resume analysis +
// career DNA + recent chat history from Postgres, builds a server-side
// system prompt with that context, calls Claude, stores both the user
// message and the assistant reply, enforces free-tier chat cap.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FREE_CHAT_PER_MONTH = 10;
const ABUSE_CEILING = 500; // internal cap on "Unlimited" — never surfaced in marketing
const HISTORY_MESSAGES = 10;
// Current recommended Claude model per Anthropic docs (Messages API).
const CLAUDE_MODEL = "claude-3-5-sonnet-latest";

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Returns the effective plan for limit checks. FOUNDER → PRO_PLUS limits.
function effectivePlan(plan: string, isFounder: boolean | null): "FREE" | "PRO" | "PRO_PLUS" {
  if (isFounder) return "PRO_PLUS";
  if (plan === "PRO_PLUS") return "PRO_PLUS";
  if (plan === "PRO") return "PRO";
  return "FREE";
}

function chatLimit(plan: string, isFounder: boolean | null): number {
  const eff = effectivePlan(plan, isFounder);
  if (eff === "FREE") return FREE_CHAT_PER_MONTH;
  return ABUSE_CEILING; // PRO and PRO_PLUS
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI mentor service not configured." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    // Plan + chat cap (is_founder gives FOUNDER users PRO_PLUS limits)
    const { data: profile } = await admin.from("profiles").select("plan,is_founder").eq("id", userId).maybeSingle();
    const plan = (profile as any)?.plan ?? "FREE";
    const isFounder = (profile as any)?.is_founder === true;
    const mk = monthKey();
    const { data: counter } = await admin.from("usage_counters").select("chat_count").eq("user_id", userId).eq("month_key", mk).maybeSingle();
    const chatCount = (counter as any)?.chat_count ?? 0;
    if (chatCount >= chatLimit(plan, isFounder)) {
      return new Response(JSON.stringify({
        error: "You've reached your monthly mentor message limit. Upgrade to Pro for unlimited.",
        code: "MENTOR_PROMPT_LIMIT_REACHED",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const payload = await req.json();
    const userMessage: string = payload.message;
    if (!userMessage || !userMessage.trim()) {
      return new Response(JSON.stringify({ error: "Message is empty." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Context: latest resume analysis + career DNA
    const { data: latest } = await admin.from("resume_analyses").select("overall_score,current_skills,missing_skills").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const { data: dna } = await admin.from("career_dna").select("suggested_careers").eq("user_id", userId).maybeSingle();
    const resume = latest as any;
    const careerDna = dna as any;

    const score = resume?.overall_score ?? "N/A";

    const topSkills = (resume?.current_skills ?? []).slice(0, 8).join(", ") || "none detected";
    const missing = (resume?.missing_skills ?? []).slice(0, 8).join(", ") || "none detected";
    const careers = (careerDna?.suggested_careers ?? []).join(", ") || "not yet assessed";

    const systemPrompt =
      "You are VersaCareer AI's career mentor. " +
      `This user's overall resume score is ${score}/100, ` +
      `top skills are ${topSkills}, missing skills are ${missing}, and suggested career paths are ${careers}. ` +
      "Give direct, practical, encouraging career advice. Keep responses under 200 words. Plain text, no markdown.";

    // Recent history
    const { data: history } = await admin.from("chat_messages").select("role,content").eq("user_id", userId).order("created_at", { ascending: false }).limit(HISTORY_MESSAGES);
    const msgs = (history ?? []).reverse().map((m: any) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));

    // Append the new user message
    msgs.push({ role: "user", content: userMessage });

    // Call Claude Messages API
    let assistantText: string;
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 60000);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 400,
          system: systemPrompt,
          messages: msgs,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Claude HTTP ${res.status}: ${txt.slice(0, 300)}`);
      }
      const data = await res.json();
      assistantText = data?.content?.[0]?.text ?? "";
      if (!assistantText) throw new Error("Claude returned no content.");
    } catch (err: any) {
      return new Response(JSON.stringify({ error: `Mentor failed to respond: ${err.message}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Persist both messages
    const { error: insErr } = await admin.from("chat_messages").insert([
      { user_id: userId, role: "user", content: userMessage },
      { user_id: userId, role: "assistant", content: assistantText },
    ]);
    if (insErr) {
      return new Response(JSON.stringify({ error: "Failed to save chat history." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Increment chat counter (counts assistant responses)
    if (counter) {
      await admin.from("usage_counters").update({ chat_count: chatCount + 1 }).eq("user_id", userId).eq("month_key", mk);
    } else {
      await admin.from("usage_counters").insert({ user_id: userId, month_key: mk, analyses_count: 0, chat_count: 1, resumes_generations_count: 0 });
    }

    // Log AI usage for admin cost monitoring
    try {
      const totalTokens = msgs.reduce((s: number, m: any) => s + Math.round(m.content.length / 4), 0) + Math.round(assistantText.length / 4);
      await admin.from("ai_usage_logs").insert({
        user_id: userId, service: "claude", feature: "mentor-chat",
        tokens_in: totalTokens, tokens_out: Math.round(assistantText.length / 4), estimated_cost_usd: 0.01,
      });
    } catch { /* non-critical */ }

    return new Response(JSON.stringify({ reply: assistantText }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Internal error." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
