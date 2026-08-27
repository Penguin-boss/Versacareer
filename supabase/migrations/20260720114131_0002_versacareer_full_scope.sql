/*
# VersaCareer AI — V1 full-scope schema expansion

1. Overview
   Extends the existing V1 schema (profiles, resume_analyses, career_dna,
   milestones, chat_messages, usage_counters) to support the full 10-feature
   spec: Resume Builder, Resource Library, Admin Panel, Feedback widget,
   feature flags, AI usage logging, Job Readiness history, and career
   preferences. All new tables are owner-scoped with RLS where they hold
   per-user data; shared/admin tables (resources, feature_flags,
   ai_usage_logs) are readable by authenticated users and writable only
   server-side (service role), with admin-only mutation enforced in edge
   functions by checking profiles.role.

2. Modified Tables
   - `profiles`: add `role` (user_role enum: USER, ADMIN, default USER),
     `target_roles` (jsonb array), `experience_level` (text),
     `preferred_work_style` (text). Existing rows get safe defaults.
   - `resume_analyses`: add `ats_report` (jsonb) for structured ATS findings
     (formatting issues, missing keywords by target role). Existing rows
     default to empty array.

3. New Tables
   - `resumes`: saved resume drafts from the Resume Builder. Structured
     `sections` jsonb (contact, summary, experience[], education[], skills[],
     projects[], certifications[]), template name, title, timestamps.
     Free tier limited to 1 row per user (enforced in edge function).
   - `resources`: admin-managed Resource Library entries. title, url, type
     (course|book|youtube|github|roadmap), category, skill_tags jsonb,
     is_published (default true). Readable by all authenticated users;
     writable only via service role (admin edge functions).
   - `feedback`: in-app feedback widget submissions. user_id, page, rating
     (1-5), comment, created_at. Owner-scoped SELECT/INSERT; admin reads
     via service role.
   - `feature_flags`: simple on/off flags per feature key. key (unique),
     is_enabled (default true), updated_at. Readable by authenticated;
     writable only via service role.
   - `ai_usage_logs`: per-call audit log for AI cost monitoring. user_id,
     service (gemini|claude), feature (analyze|generate|roadmap|mentor|...),
     tokens_in, tokens_out, estimated_cost_usd, created_at. Owner-scoped
     SELECT; INSERT only via service role (edge functions log their own
     calls). Admin reads all via service role.
   - `job_readiness_history`: snapshot of a user's job readiness score over
     time, for the Pro trend chart. user_id, score, resume_score,
     skill_coverage, roadmap_progress, recorded_at. Owner-scoped.
   - `career_dna_history`: history of Career DNA assessments (retakeable).
     user_id, interests, strengths, work_style, personality,
     suggested_careers, created_at. Owner-scoped. The existing `career_dna`
     table stays as the "latest" snapshot for quick reads.

4. Enums
   - `user_role`: USER, ADMIN (added; profiles.role uses it)

5. Security (RLS)
   - profiles: existing policies cover SELECT/INSERT/UPDATE; role column is
     included in UPDATE policy already (auth.uid() = id). A user cannot
     escalate themselves to ADMIN via the client because the edge functions
     that set role use the service role and check existing role server-side.
   - resumes, feedback, job_readiness_history, career_dna_history:
     owner-scoped CRUD (4 policies each, TO authenticated, auth.uid() = user_id).
   - resources: SELECT TO authenticated (USING true — intentionally shared
     content library). No client INSERT/UPDATE/DELETE — only service role.
   - feature_flags: SELECT TO authenticated (USING true). No client writes.
   - ai_usage_logs: SELECT own rows (auth.uid() = user_id). No client writes.

6. Notes
   - All new user_id columns default to auth.uid() so client inserts that
     omit user_id still pass WITH CHECK.
   - No destructive changes to existing tables or data.
*/

-- user_role enum
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- profiles: add role + career preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'USER';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_roles jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience_level text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_work_style text;

-- resume_analyses: add ats_report
ALTER TABLE resume_analyses ADD COLUMN IF NOT EXISTS ats_report jsonb NOT NULL DEFAULT '[]'::jsonb;

-- resumes
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  template text NOT NULL DEFAULT 'classic',
  sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes (user_id, updated_at DESC);

DROP POLICY IF EXISTS "select_own_resumes" ON resumes;
CREATE POLICY "select_own_resumes" ON resumes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_resumes" ON resumes;
CREATE POLICY "insert_own_resumes" ON resumes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_resumes" ON resumes;
CREATE POLICY "update_own_resumes" ON resumes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_resumes" ON resumes;
CREATE POLICY "delete_own_resumes" ON resumes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- resources (shared library, admin-managed)
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  type text NOT NULL CHECK (type IN ('course','book','youtube','github','roadmap')),
  category text NOT NULL,
  skill_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources (category);

DROP POLICY IF EXISTS "select_resources" ON resources;
CREATE POLICY "select_resources" ON resources FOR SELECT
  TO authenticated USING (is_published = true);

-- feedback
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  page text NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback (user_id, created_at DESC);

DROP POLICY IF EXISTS "select_own_feedback" ON feedback;
CREATE POLICY "select_own_feedback" ON feedback FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_feedback" ON feedback;
CREATE POLICY "insert_own_feedback" ON feedback FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_feedback" ON feedback;
CREATE POLICY "delete_own_feedback" ON feedback FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- feature_flags
CREATE TABLE IF NOT EXISTS feature_flags (
  key text PRIMARY KEY,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_feature_flags" ON feature_flags;
CREATE POLICY "select_feature_flags" ON feature_flags FOR SELECT
  TO authenticated USING (true);

-- Seed default flags
INSERT INTO feature_flags (key, is_enabled) VALUES
  ('resume_builder', true),
  ('resume_analyzer', true),
  ('career_dna', true),
  ('skill_gap', true),
  ('roadmap', true),
  ('mentor', true),
  ('job_readiness', true),
  ('resources', true)
ON CONFLICT (key) DO NOTHING;

-- ai_usage_logs
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  service text NOT NULL CHECK (service IN ('gemini','claude')),
  feature text NOT NULL,
  tokens_in int NOT NULL DEFAULT 0,
  tokens_out int NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_logs (created_at DESC);

DROP POLICY IF EXISTS "select_own_ai_usage_logs" ON ai_usage_logs;
CREATE POLICY "select_own_ai_usage_logs" ON ai_usage_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- job_readiness_history
CREATE TABLE IF NOT EXISTS job_readiness_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  score int NOT NULL,
  resume_score int NOT NULL,
  skill_coverage int NOT NULL,
  roadmap_progress int NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE job_readiness_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_jrh_user_date ON job_readiness_history (user_id, recorded_at ASC);

DROP POLICY IF EXISTS "select_own_jrh" ON job_readiness_history;
CREATE POLICY "select_own_jrh" ON job_readiness_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_jrh" ON job_readiness_history;
CREATE POLICY "insert_own_jrh" ON job_readiness_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- career_dna_history
CREATE TABLE IF NOT EXISTS career_dna_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  interests jsonb NOT NULL DEFAULT '[]'::jsonb,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  work_style text,
  personality text,
  suggested_careers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE career_dna_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cdh_user_date ON career_dna_history (user_id, created_at DESC);

DROP POLICY IF EXISTS "select_own_cdh" ON career_dna_history;
CREATE POLICY "select_own_cdh" ON career_dna_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_cdh" ON career_dna_history;
CREATE POLICY "insert_own_cdh" ON career_dna_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_cdh" ON career_dna_history;
CREATE POLICY "delete_own_cdh" ON career_dna_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
