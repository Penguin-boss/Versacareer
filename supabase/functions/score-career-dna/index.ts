import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { corsHeaders, isRateLimited, jsonError } from "../_shared/security.ts";
import { scoreAssessment } from "./scoring.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "POST") return jsonError(req, "Method not allowed.", 405);
  if (await isRateLimited(req, "score-career-dna", 20)) return jsonError(req, "Too many requests. Please try again shortly.", 429);
  
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const userClient = createClient(supabaseUrl, authHeader.replace("Bearer ", "") || anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const { answers } = await req.json();
    if (!answers) {
      return new Response(JSON.stringify({ error: "Missing answers." }), { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
    }

    const scored = scoreAssessment(answers);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data, error } = await admin
      .from("career_dna_results")
      .insert({
        user_id: userId,
        trait_vector: scored.traitVector,
        top_matches: scored.topMatches.map((m: any) => ({ career: m.career, match_percent: m.matchPercent })),
        raw_answers: answers
      })
      .select()
      .single();

    if (error) {
       throw error;
    }

    return new Response(JSON.stringify({ result: data }), { status: 200, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders(req), "Content-Type": "application/json" } });
  }
});
