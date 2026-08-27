/*
# Add resume_versions and career_goals tables

1. New Tables
- `resume_versions`: snapshots of resume JSON data on every save, for
  the Resume Version History feature (Pro/Pro+ only). Each row stores
  the full structured resume content at a point in time, linked to a
  resume and its owner.
  - `id` (uuid, primary key)
  - `resume_id` (uuid, FK to resumes, ON DELETE CASCADE)
  - `user_id` (uuid, FK to auth.users, NOT NULL DEFAULT auth.uid())
  - `content` (jsonb, the structured resume sections at snapshot time)
  - `template` (text, which template was active)
  - `created_at` (timestamptz, default now())

- `career_goals`: personal goal tracker for Pro+ users. Simple CRUD
  with optional link to a roadmap milestone.
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to auth.users, NOT NULL DEFAULT auth.uid())
  - `title` (text, not null)
  - `description` (text, nullable)
  - `target_date` (date, nullable)
  - `status` (text, not null default 'IN_PROGRESS' — values:
    IN_PROGRESS / COMPLETED)
  - `milestone_id` (uuid, FK to milestones, ON DELETE SET NULL,
    nullable — optional link to a roadmap milestone)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- RLS enabled on both tables.
- resume_versions: owner-scoped SELECT for authenticated users.
  INSERT is done server-side by edge functions using the service role
  key (bypasses RLS), so only a SELECT policy is needed for the
  frontend to read history. UPDATE/DELETE not exposed to the client.
- career_goals: full owner-scoped CRUD for authenticated users.
3. Indexes
- resume_versions: index on resume_id for fast history lookups.
- career_goals: index on user_id for fast listing.
4. Notes
- Both tables use DEFAULT auth.uid() on user_id so server-side inserts
  that omit user_id still satisfy WITH CHECK constraints.
*/

CREATE TABLE IF NOT EXISTS resume_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content jsonb NOT NULL DEFAULT '{}',
  template text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id ON resume_versions(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id ON resume_versions(user_id);

DROP POLICY IF EXISTS "select_own_resume_versions" ON resume_versions;
CREATE POLICY "select_own_resume_versions" ON resume_versions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS career_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_date date,
  status text NOT NULL DEFAULT 'IN_PROGRESS',
  milestone_id uuid REFERENCES milestones(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE career_goals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_career_goals_user_id ON career_goals(user_id);

DROP POLICY IF EXISTS "select_own_career_goals" ON career_goals;
CREATE POLICY "select_own_career_goals" ON career_goals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_career_goals" ON career_goals;
CREATE POLICY "insert_own_career_goals" ON career_goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_career_goals" ON career_goals;
CREATE POLICY "update_own_career_goals" ON career_goals
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_career_goals" ON career_goals;
CREATE POLICY "delete_own_career_goals" ON career_goals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
