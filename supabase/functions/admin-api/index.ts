// Edge function: admin-api
// Single edge function handling all admin operations. Every request
// verifies the JWT, loads the profile, and rejects with 403 if
// profiles.role !== 'ADMIN'. The action is dispatched by the `action`
// field in the request body. All mutations use the service role client.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const userClient = createClient(supabaseUrl, authHeader.replace("Bearer ", "") || anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    // Permission gate: check role server-side on EVERY request
    const { data: profile } = await admin.from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
    if ((profile as any)?.role !== "ADMIN") {
      return new Response(JSON.stringify({ error: "Forbidden — admin role required." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const action: string = body.action;

    switch (action) {
      case "stats": {
        const [users, analyses, feedback, proUsers, proPlusUsers, founderUsers, founderCounter, aiLogs, mismatches] = await Promise.all([
          admin.from("profiles").select("id, email, name, plan, role, created_at", { count: "exact" }),
          admin.from("resume_analyses").select("id, created_at", { count: "exact" }),
          admin.from("feedback").select("id, rating", { count: "exact" }),
          admin.from("profiles").select("id").eq("plan", "PRO"),
          admin.from("profiles").select("id").eq("plan", "PRO_PLUS"),
          admin.from("profiles").select("id").eq("plan", "FOUNDER"),
          admin.from("founder_pass_counter").select("sold_count,cap").eq("id", "singleton").maybeSingle(),
          admin.from("ai_usage_logs").select("service, feature, tokens_in, tokens_out, estimated_cost_usd, created_at"),
          admin.from("founder_pass_price_mismatches").select("id, user_id, expected_price, charged_price, position, direction, created_at").order("created_at", { ascending: false }).limit(50),
        ]);
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 86400000);
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        const dau = (users.data ?? []).filter((u: any) => new Date(u.created_at) >= dayAgo).length;
        const wau = (users.data ?? []).filter((u: any) => new Date(u.created_at) >= weekAgo).length;
        const totalCost = (aiLogs.data ?? []).reduce((s: number, l: any) => s + Number(l.estimated_cost_usd ?? 0), 0);
        const avgRating = (feedback.data ?? []).length
          ? (feedback.data as any[]).reduce((s, f) => s + f.rating, 0) / feedback.data.length
          : 0;
        const paidCount = (proUsers.data ?? []).length + (proPlusUsers.data ?? []).length + (founderUsers.data ?? []).length;
        return new Response(JSON.stringify({
          stats: {
            totalUsers: users.count ?? 0,
            totalAnalyses: analyses.count ?? 0,
            proUsers: (proUsers.data ?? []).length,
            proPlusUsers: (proPlusUsers.data ?? []).length,
            founderUsers: (founderUsers.data ?? []).length,
            founderSold: (founderCounter.data as any)?.sold_count ?? 0,
            founderCap: (founderCounter.data as any)?.cap ?? 50,
            conversionRate: users.count ? ((paidCount / users.count) * 100).toFixed(1) : "0",
            dau,
            wau,
            avgRating: avgRating.toFixed(2),
            aiCalls: (aiLogs.data ?? []).length,
            aiCostUsd: totalCost.toFixed(4),
            priceMismatches: (mismatches.data ?? []).map((m: any) => ({
              id: m.id,
              user_id: m.user_id,
              expected_price: m.expected_price,
              charged_price: m.charged_price,
              position: m.position,
              direction: m.direction,
              created_at: m.created_at,
            })),
          },
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "list_users": {
        const { data, error } = await admin.from("profiles").select("id, email, name, plan, role, created_at").order("created_at", { ascending: false });
        if (error) throw error;
        // usage per user
        const mk = new Date().toISOString().slice(0, 7);
        const { data: usage } = await admin.from("usage_counters").select("user_id, analyses_count, chat_count, resumes_generations_count").eq("month_key", mk);
        const usageMap = new Map((usage ?? []).map((u: any) => [u.user_id, u]));
        const users = (data ?? []).map((u: any) => ({ ...u, usage: usageMap.get(u.id) ?? null }));
        return new Response(JSON.stringify({ users }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "update_user_plan": {
        const { userId, plan } = body;
        if (!userId || !["FREE", "PRO", "PRO_PLUS", "FOUNDER"].includes(plan)) {
          return new Response(JSON.stringify({ error: "Invalid input." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const patch: any = { plan };
        if (plan === "FOUNDER") { patch.is_founder = true; patch.billing_cycle = "LIFETIME"; patch.plan_renews_at = null; }
        const { error } = await admin.from("profiles").update(patch).eq("id", userId);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "update_user_role": {
        const { userId, role } = body;
        if (!userId || !["USER", "ADMIN"].includes(role)) {
          return new Response(JSON.stringify({ error: "Invalid input." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error } = await admin.from("profiles").update({ role }).eq("id", userId);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "list_resources": {
        const { data, error } = await admin.from("resources").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ resources: data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "create_resource": {
        const { resource } = body;
        if (!resource?.title || !resource?.url || !resource?.type) {
          return new Response(JSON.stringify({ error: "title, url, type required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { data, error } = await admin.from("resources").insert({
          title: resource.title,
          url: resource.url,
          type: resource.type,
          category: resource.category || "General",
          skill_tags: resource.skill_tags ?? [],
          is_published: resource.is_published ?? true,
        }).select("*").single();
        if (error) throw error;
        return new Response(JSON.stringify({ resource: data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "update_resource": {
        const { id, patch } = body;
        if (!id) return new Response(JSON.stringify({ error: "id required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { error } = await admin.from("resources").update(patch).eq("id", id);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "delete_resource": {
        const { id } = body;
        if (!id) return new Response(JSON.stringify({ error: "id required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { error } = await admin.from("resources").delete().eq("id", id);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "list_feedback": {
        const { data, error } = await admin.from("feedback").select("id, user_id, page, rating, comment, created_at").order("created_at", { ascending: false });
        if (error) throw error;
        // join emails
        const userIds = Array.from(new Set((data ?? []).map((f: any) => f.user_id)));
        const { data: profiles } = await admin.from("profiles").select("id, email, name").in("id", userIds);
        const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
        const feedback = (data ?? []).map((f: any) => ({ ...f, user: pMap.get(f.user_id) ?? null }));
        return new Response(JSON.stringify({ feedback }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "list_flags": {
        const { data, error } = await admin.from("feature_flags").select("*").order("key");
        if (error) throw error;
        return new Response(JSON.stringify({ flags: data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "toggle_flag": {
        const { key, is_enabled } = body;
        if (!key) return new Response(JSON.stringify({ error: "key required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { error } = await admin.from("feature_flags").update({ is_enabled, updated_at: new Date().toISOString() }).eq("key", key);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "ai_usage": {
        const { data, error } = await admin.from("ai_usage_logs").select("user_id, service, feature, tokens_in, tokens_out, estimated_cost_usd, created_at").order("created_at", { ascending: false }).limit(200);
        if (error) throw error;
        const userIds = Array.from(new Set((data ?? []).map((l: any) => l.user_id)));
        const { data: profiles } = await admin.from("profiles").select("id, email").in("id", userIds);
        const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p.email]));
        const logs = (data ?? []).map((l: any) => ({ ...l, email: pMap.get(l.user_id) ?? "—" }));
        return new Response(JSON.stringify({ logs }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Internal error." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
