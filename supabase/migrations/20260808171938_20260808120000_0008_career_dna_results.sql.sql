/*
# Career DNA Results Table

1. New Tables
- `career_dna_results`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user, FK to auth.users)
  - `created_at` (timestamptz, defaults to now)
  - `trait_vector` (jsonb) — 7-value trait vector with axis labels (AN, CR, SY, CO, ST, SE, OW)
  - `top_matches` (jsonb) — array of {career, match_percent} objects
  - `raw_answers` (jsonb) — question_id -> selected answer, for future re-scoring

2. Security
- Enable RLS on `career_dna_results`.
- Owner-scoped CRUD: each authenticated user can only access their own rows.
- INSERT is owner-scoped so results are written server-side through the authenticated client.
- Multiple rows per user are allowed (retakes create new rows, history preserved).

3. Notes
- This table does NOT overwrite on retake — each assessment is a new insert.
- The trait_vector and top_matches are computed client-side by a deterministic
  scoring engine, then persisted server-side so results can't be tampered with
  before being used to set desired_role.
- Career DNA is free for all plans, unlimited retakes, no server-side plan check.
*/

CREATE TABLE IF NOT EXISTS career_dna_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  trait_vector jsonb NOT NULL,
  top_matches jsonb NOT NULL,
  raw_answers jsonb NOT NULL
);

ALTER TABLE career_dna_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_career_dna" ON career_dna_results;
CREATE POLICY "select_own_career_dna" ON career_dna_results FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_career_dna" ON career_dna_results;
CREATE POLICY "insert_own_career_dna" ON career_dna_results FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_career_dna" ON career_dna_results;
CREATE POLICY "update_own_career_dna" ON career_dna_results FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_career_dna" ON career_dna_results;
CREATE POLICY "delete_own_career_dna" ON career_dna_results FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_career_dna_results_user_id ON career_dna_results(user_id);
CREATE INDEX IF NOT EXISTS idx_career_dna_results_created_at ON career_dna_results(created_at DESC);
