-- 1. Update Founder Pass cap from 27 to 50
UPDATE founder_pass_counter SET cap = 50 WHERE id = 'singleton';

-- 2. Create founder_pass_price_mismatches table for logging race-condition
--    pricing discrepancies (charged price != tier price for final position)
CREATE TABLE IF NOT EXISTS founder_pass_price_mismatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expected_price int NOT NULL,   -- correct tier price in paise
  charged_price int NOT NULL,    -- what Stripe actually charged in paise
  position int NOT NULL,          -- buyer's final atomic position
  direction text NOT NULL CHECK (direction IN ('OVERPAID', 'UNDERPAID')),
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE founder_pass_price_mismatches ENABLE ROW LEVEL SECURITY;

-- Admin-only read access (reuse the same admin-role-check pattern:
-- only service role can read/write; no client policies needed since
-- the admin-api edge function uses the service role which bypasses RLS).
-- No SELECT/INSERT/UPDATE/DELETE policies for authenticated/anon —
-- the table is only accessible via the admin-api edge function.

CREATE INDEX IF NOT EXISTS idx_founder_mismatches_created
  ON founder_pass_price_mismatches (created_at DESC);
