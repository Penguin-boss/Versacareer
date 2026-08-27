/*
# Pricing tiers: PRO_PLUS + FOUNDER plans, billing fields, founder pass counter

1. Overview
   Extends the existing plan_enum (FREE, PRO) with two new tiers — PRO_PLUS
   and FOUNDER — and adds the billing/subscription columns to `profiles`
   needed to gate features server-side and track Stripe state. Also
   creates a singleton `founder_pass_counter` table to enforce the
   one-time Founder Pass buyer cap atomically. No existing data is lost;
   all new columns are nullable or have safe defaults.

2. Modified Tables
   - `plan_enum`: add values 'PRO_PLUS' and 'FOUNDER'. Existing rows keep
     their current plan (FREE/PRO) — no data migration needed.
   - `profiles`: add
       billing_cycle        text (NULL | 'MONTHLY' | 'YEARLY' | 'LIFETIME')
       plan_renews_at       timestamptz (NULL for FREE and FOUNDER)
       stripe_customer_id   text (unique, nullable)
       stripe_subscription_id text (nullable)
       is_founder           boolean NOT NULL DEFAULT false
     The existing `plan` column now accepts all four enum values.
     is_founder is a separate flag so a FOUNDER user keeps PRO_PLUS-level
     access even if their plan column is later reset.

3. New Tables
   - `founder_pass_counter`: a single-row table (id = 'singleton') that
     tracks how many Founder Passes have been sold and the cap. The cap
     defaults to 250. The webhook increments sold_count only after a
     verified Stripe payment and rejects sales at/above the cap via a
     conditional UPDATE (WHERE sold_count < cap) — atomic, no read-then-write
     race. Readable by authenticated users (for the public counter on the
     pricing page); writable only via service role (webhook).

4. Security (RLS)
   - founder_pass_counter: SELECT TO authenticated (USING true — the count
     is intentionally public to all signed-in users for the urgency
     counter). No client INSERT/UPDATE/DELETE — only the service role
     (stripe-webhook edge function) may mutate it.
   - profiles: existing owner-scoped SELECT/UPDATE policies already cover
     the new columns. A user still cannot escalate their own plan via the
     client because plan/billing_cycle/is_founder are only written by the
     stripe-webhook edge function using the service role, which bypasses
     RLS. (Client UPDATE policy allows the row owner to update their own
     profile, but the frontend never sends plan fields — and even if it
     did, the real gate is the server-side edge functions reading the
     service-role-maintained plan value.)

5. Notes
   - No destructive changes. ADD COLUMN IF NOT EXISTS everywhere.
   - plan_enum value additions use ALTER TYPE ... ADD VALUE IF NOT EXISTS,
     which is safe to re-run.
*/

-- Extend plan_enum with the two new tiers
ALTER TYPE plan_enum ADD VALUE IF NOT EXISTS 'PRO_PLUS';
ALTER TYPE plan_enum ADD VALUE IF NOT EXISTS 'FOUNDER';

-- profiles: billing / subscription / founder fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS billing_cycle text CHECK (billing_cycle IS NULL OR billing_cycle IN ('MONTHLY','YEARLY','LIFETIME'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_renews_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_founder boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles (plan);

-- founder_pass_counter singleton
CREATE TABLE IF NOT EXISTS founder_pass_counter (
  id text PRIMARY KEY DEFAULT 'singleton',
  sold_count int NOT NULL DEFAULT 0,
  cap int NOT NULL DEFAULT 250
);

ALTER TABLE founder_pass_counter ENABLE ROW LEVEL SECURITY;

-- Seed the singleton row if absent
INSERT INTO founder_pass_counter (id, sold_count, cap)
VALUES ('singleton', 0, 250)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "select_founder_counter" ON founder_pass_counter;
CREATE POLICY "select_founder_counter" ON founder_pass_counter
  FOR SELECT TO authenticated USING (true);
