// Edge function: create-checkout
// Creates a Stripe Checkout session for an upgrade. Supports:
//   PRO       — monthly (₹299) or yearly (₹2,499)
//   PRO_PLUS  — monthly (₹599) or yearly (₹5,499)
//   FOUNDER   — one-time tiered pricing based on purchase order:
//     Buyers 1–10  → ₹3,999
//     Buyers 11–30 → ₹4,599
//     Buyers 31–50 → ₹4,999
//   Capped at 50 buyers (atomic check). The price shown at checkout is
//   advisory (based on current sold_count + 1); the authoritative price
//   is resolved in the webhook from the atomic RETURNING position.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import Stripe from "npm:stripe@17.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PRICES = {
  PRO_MONTHLY: 29900,       // ₹299.00 in paise
  PRO_YEARLY: 249900,        // ₹2,499.00
  PRO_PLUS_MONTHLY: 59900,   // ₹599.00
  PRO_PLUS_YEARLY: 549900,   // ₹5,499.00
};

const FOUNDER_CAP = 50;

const FOUNDER_PRICE_TIERS = [
  { minPosition: 1, maxPosition: 10, pricePaise: 399900 },
  { minPosition: 11, maxPosition: 30, pricePaise: 459900 },
  { minPosition: 31, maxPosition: 50, pricePaise: 499900 },
];

function getFounderPricePaiseForPosition(position: number): number {
  const tier = FOUNDER_PRICE_TIERS.find(
    (t) => position >= t.minPosition && position <= t.maxPosition
  );
  if (!tier) throw new Error("Position exceeds Founder Pass cap");
  return tier.pricePaise;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({
        error: "Payments are not yet configured. Add STRIPE_SECRET_KEY to enable checkout.",
      }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const userClient = createClient(supabaseUrl, authHeader.replace("Bearer ", "") || anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;
    const email = userData.user.email ?? "";

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const planKey = body?.plan as string; // "PRO" | "PRO_PLUS" | "FOUNDER"
    const cycle = body?.cycle as string;  // "MONTHLY" | "YEARLY" (ignored for FOUNDER)

    if (!planKey || !["PRO", "PRO_PLUS", "FOUNDER"].includes(planKey)) {
      return new Response(JSON.stringify({ error: "Invalid plan." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await admin.from("profiles").select("plan,is_founder").eq("id", userId).maybeSingle();
    const currentPlan = (profile as any)?.plan ?? "FREE";
    const isFounder = (profile as any)?.is_founder === true;

    if (isFounder || currentPlan === "PRO_PLUS") {
      return new Response(JSON.stringify({ error: "You already have top-tier access." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" as any });
    const origin = req.headers.get("origin") ?? "https://versacareer.ai";

    // Founder Pass: enforce cap BEFORE creating the checkout session.
    // Price is advisory — based on current sold_count + 1. The authoritative
    // price is resolved in the webhook from the atomic RETURNING position.
    if (planKey === "FOUNDER") {
      const { data: counter } = await admin.from("founder_pass_counter").select("sold_count,cap").eq("id", "singleton").maybeSingle();
      const sold = (counter as any)?.sold_count ?? 0;
      const cap = (counter as any)?.cap ?? FOUNDER_CAP;
      if (sold >= cap) {
        return new Response(JSON.stringify({
          error: "The Founder Pass is sold out. Thank you for your interest!",
          code: "FOUNDER_SOLD_OUT",
        }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const expectedPosition = sold + 1;
      const unitAmount = getFounderPricePaiseForPosition(expectedPosition);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{
          price_data: {
            currency: "inr",
            unit_amount: unitAmount,
            product_data: { name: "VersaCareer AI — Founder Pass (Lifetime)" },
          },
          quantity: 1,
        }],
        customer_email: email,
        client_reference_id: userId,
        success_url: `${origin}/billing?status=success`,
        cancel_url: `${origin}/billing?status=cancelled`,
        metadata: {
          user_id: userId,
          plan: "FOUNDER",
          billing_cycle: "LIFETIME",
          expected_position: String(expectedPosition),
        },
      });
      return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Subscription mode (PRO / PRO_PLUS)
    const isYearly = cycle === "YEARLY";
    const unitAmount = planKey === "PRO"
      ? (isYearly ? PRICES.PRO_YEARLY : PRICES.PRO_MONTHLY)
      : (isYearly ? PRICES.PRO_PLUS_YEARLY : PRICES.PRO_PLUS_MONTHLY);
    const productName = planKey === "PRO" ? "VersaCareer AI Pro" : "VersaCareer AI Pro+";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{
        price_data: {
          currency: "inr",
          unit_amount: unitAmount,
          recurring: { interval: isYearly ? "year" : "month" },
          product_data: { name: productName },
        },
        quantity: 1,
      }],
      customer_email: email,
      client_reference_id: userId,
      success_url: `${origin}/billing?status=success`,
      cancel_url: `${origin}/billing?status=cancelled`,
      metadata: {
        user_id: userId,
        plan: planKey,
        billing_cycle: isYearly ? "YEARLY" : "MONTHLY",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Checkout failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
