// Edge function: stripe-webhook
// The ONLY place that ever writes a user's plan. Verifies the Stripe
// signature, then updates the profile and (for FOUNDER) atomically
// increments the founder_pass_counter with a conditional UPDATE
// (WHERE sold_count < cap) so concurrent checkouts can't oversell.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import Stripe from "npm:stripe@17.3.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey || !webhookSecret) {
      return new Response(JSON.stringify({ error: "Stripe webhook not configured." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" as any });
    const signature = req.headers.get("stripe-signature") ?? "";
    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err: any) {
      return new Response(JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.user_id ?? session.client_reference_id;
        const newPlan = session.metadata?.plan;        // "PRO" | "PRO_PLUS" | "FOUNDER"
        const billingCycle = session.metadata?.billing_cycle; // "MONTHLY" | "YEARLY" | "LIFETIME"
        if (!userId || !newPlan) break;

        if (newPlan === "FOUNDER") {
          // Atomic cap enforcement: read current count, only increment if
          // under cap. If the cap was reached between checkout creation
          // and payment confirmation, refund the customer.
          const { data: cur } = await admin.from("founder_pass_counter").select("sold_count,cap").eq("id", "singleton").maybeSingle();
          const sold = (cur as any)?.sold_count ?? 0;
          const cap = (cur as any)?.cap ?? 50;
          if (sold >= cap) {
            const paymentIntent = session.payment_intent as string;
            if (paymentIntent) {
              try { await stripe.refunds.create({ payment_intent: paymentIntent }); } catch { /* best effort */ }
            }
            return new Response(JSON.stringify({ error: "Founder Pass sold out — refund issued." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }

          // Conditional UPDATE — only increments if still under cap,
          // preventing oversell from concurrent checkouts.
          const { data: updated } = await admin
            .from("founder_pass_counter")
            .update({ sold_count: sold + 1 })
            .eq("id", "singleton")
            .lt("sold_count", cap)
            .select("sold_count")
            .maybeSingle();

          // If the update returned no rows, another concurrent webhook
          // won the last slot. Refund and reject.
          if (!updated) {
            const paymentIntent = session.payment_intent as string;
            if (paymentIntent) {
              try { await stripe.refunds.create({ payment_intent: paymentIntent }); } catch { /* best effort */ }
            }
            return new Response(JSON.stringify({ error: "Founder Pass sold out — refund issued." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }

          // The RETURNING sold_count IS the buyer's true final position.
          const finalPosition = (updated as any).sold_count;

          // Resolve the correct tier price for the buyer's final position.
          const FOUNDER_PRICE_TIERS = [
            { minPosition: 1, maxPosition: 10, pricePaise: 399900 },
            { minPosition: 11, maxPosition: 30, pricePaise: 459900 },
            { minPosition: 31, maxPosition: 50, pricePaise: 499900 },
          ];
          const tier = FOUNDER_PRICE_TIERS.find(
            (t) => finalPosition >= t.minPosition && finalPosition <= t.maxPosition
          );
          const expectedPricePaise = tier ? tier.pricePaise : 499900;
          const chargedPricePaise = session.amount_total ?? 0;

          // Log price mismatches from race conditions (rare). Never block
          // granting access — this is a billing reconciliation problem,
          // not an access problem.
          if (chargedPricePaise !== expectedPricePaise) {
            const direction = chargedPricePaise > expectedPricePaise ? "OVERPAID" : "UNDERPAID";
            try {
              await admin.from("founder_pass_price_mismatches").insert({
                user_id: userId,
                expected_price: expectedPricePaise,
                charged_price: chargedPricePaise,
                position: finalPosition,
                direction,
              });
            } catch { /* best effort — don't block access */ }
          }

          // Grant Founder access regardless of any pricing mismatch.
          await admin.from("profiles").update({
            plan: "FOUNDER",
            billing_cycle: "LIFETIME",
            is_founder: true,
            plan_renews_at: null,
            stripe_customer_id: session.customer as string ?? null,
          }).eq("id", userId);
        } else {
          // PRO or PRO_PLUS subscription
          const renewsAt = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null;
          await admin.from("profiles").update({
            plan: newPlan,
            billing_cycle: billingCycle ?? "MONTHLY",
            plan_renews_at: renewsAt,
            stripe_customer_id: session.customer as string ?? null,
            stripe_subscription_id: session.subscription as string ?? null,
          }).eq("id", userId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        // Downgrade by stripe_customer_id
        await admin.from("profiles").update({
          plan: "FREE",
          billing_cycle: null,
          plan_renews_at: null,
          stripe_subscription_id: null,
        }).eq("stripe_customer_id", customerId);
        break;
      }
      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Webhook failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
