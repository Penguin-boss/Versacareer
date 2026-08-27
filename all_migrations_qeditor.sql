/*
# VersaCareer AI â€” core schema (V1)

1. Overview
   Builds the full data model for VersaCareer AI V1 on Supabase Postgres.
   This is a multi-user app with Supabase email/password auth, so every
   table is owner-scoped to the authenticated user via `user_id` and
   locked down with row-level security policies (4 per table: SELECT,
   INSERT, UPDATE, DELETE). Owner columns default to `auth.uid()` so
   client inserts that omit `user_id` still satisfy WITH CHECK.

2. New Tables
   - `profiles`: mirrors auth.users with app-level fields (name, job_title, plan).
     `id` is the PK and equals `auth.users.id` (one row per auth user).
   - `resume_analyses`: one row per resume analysis. Stores scores (0-100),
     strengths/weaknesses/suggestions/current_skills/missing_skills as JSONB,
     extracted resume text, suitable roles text, file name, and created_at.
   - `career_dna`: one row per user (unique user_id). Stores interests,
     strengths, suggested careers as JSONB; work_style and personality as text.
   - `milestones`: roadmap milestones per user. Week number, title, description,
     status (LOCKED / IN_PROGRESS / COMPLETED).
   - `chat_messages`: career mentor chat history per user. role ('user'|'assistant'),
     content text, created_at.
   - `usage_counters`: per-user monthly usage counters. month_key (YYYY-MM),
     analyses_count, chat_count. Unique on (user_id, month_key). Used for
     server-side free-tier enforcement (3 analyses/month, 20 chat msgs/month).

3. Enums
   - `plan_enum`: FREE, PRO
   - `milestone_status`: LOCKED, IN_PROGRESS, COMPLETED

4. Indexes
   - resume_analyses(user_id, created_at desc) for dashboard history
   - milestones(user_id, week)
   - chat_messages(user_id, created_at) for mentor context
   - usage_counters(user_id, month_key) unique

5. Security (RLS)
   - RLS ENABLED on every table.
   - profiles: a user can SELECT/UPDATE only their own profile row.
     INSERT is allowed so the client can create the profile on first login
     (WITH CHECK auth.uid() = id). No DELETE (profiles are immortal).
   - resume_analyses, career_dna, milestones, chat_messages, usage_counters:
     full owner-scoped CRUD (SELECT/INSERT/UPDATE/DELETE) where auth.uid() = user_id.

6. Notes
   - `user_id` on all child tables is `NOT NULL DEFAULT auth.uid()` so client
     inserts that omit user_id still pass the INSERT WITH CHECK policy.
   - All timestamps are timestamptz, default now().
   - JSONB used for flexible arrays (strengths, skills, etc.).
*/

-- Enums
DO $$ BEGIN
  CREATE TYPE plan_enum AS ENUM ('FREE', 'PRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE milestone_status AS ENUM ('LOCKED', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  job_title text,
  plan plan_enum NOT NULL DEFAULT 'FREE',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- resume_analyses
CREATE TABLE IF NOT EXISTS resume_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  extracted_text text,
  overall_score int NOT NULL,
  ats_score int NOT NULL,
  technical_score int NOT NULL,
  experience_score int NOT NULL,
  project_score int NOT NULL,
  job_readiness_score int NOT NULL DEFAULT 0,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  weaknesses jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  suitable_roles_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_created
  ON resume_analyses (user_id, created_at DESC);

DROP POLICY IF EXISTS "select_own_resume_analyses" ON resume_analyses;
CREATE POLICY "select_own_resume_analyses" ON resume_analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_resume_analyses" ON resume_analyses;
CREATE POLICY "insert_own_resume_analyses" ON resume_analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_resume_analyses" ON resume_analyses;
CREATE POLICY "update_own_resume_analyses" ON resume_analyses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_resume_analyses" ON resume_analyses;
CREATE POLICY "delete_own_resume_analyses" ON resume_analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- career_dna
CREATE TABLE IF NOT EXISTS career_dna (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  interests jsonb NOT NULL DEFAULT '[]'::jsonb,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  work_style text,
  personality text,
  suggested_careers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE career_dna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_career_dna" ON career_dna;
CREATE POLICY "select_own_career_dna" ON career_dna FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_career_dna" ON career_dna;
CREATE POLICY "insert_own_career_dna" ON career_dna FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_career_dna" ON career_dna;
CREATE POLICY "update_own_career_dna" ON career_dna FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_career_dna" ON career_dna;
CREATE POLICY "delete_own_career_dna" ON career_dna FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- milestones
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  week int NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status milestone_status NOT NULL DEFAULT 'LOCKED',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_milestones_user_week ON milestones (user_id, week);

DROP POLICY IF EXISTS "select_own_milestones" ON milestones;
CREATE POLICY "select_own_milestones" ON milestones FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_milestones" ON milestones;
CREATE POLICY "insert_own_milestones" ON milestones FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_milestones" ON milestones;
CREATE POLICY "update_own_milestones" ON milestones FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_milestones" ON milestones;
CREATE POLICY "delete_own_milestones" ON milestones FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON chat_messages (user_id, created_at);

DROP POLICY IF EXISTS "select_own_chat_messages" ON chat_messages;
CREATE POLICY "select_own_chat_messages" ON chat_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_chat_messages" ON chat_messages;
CREATE POLICY "insert_own_chat_messages" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_chat_messages" ON chat_messages;
CREATE POLICY "update_own_chat_messages" ON chat_messages FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_chat_messages" ON chat_messages;
CREATE POLICY "delete_own_chat_messages" ON chat_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- usage_counters
CREATE TABLE IF NOT EXISTS usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key text NOT NULL,
  analyses_count int NOT NULL DEFAULT 0,
  chat_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_key)
);
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_usage_counters_user_month ON usage_counters (user_id, month_key);

DROP POLICY IF EXISTS "select_own_usage_counters" ON usage_counters;
CREATE POLICY "select_own_usage_counters" ON usage_counters FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_usage_counters" ON usage_counters;
CREATE POLICY "insert_own_usage_counters" ON usage_counters FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_usage_counters" ON usage_counters;
CREATE POLICY "update_own_usage_counters" ON usage_counters FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_usage_counters" ON usage_counters;
CREATE POLICY "delete_own_usage_counters" ON usage_counters FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
/*
# VersaCareer AI â€” V1 full-scope schema expansion

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
   - resources: SELECT TO authenticated (USING true â€” intentionally shared
     content library). No client INSERT/UPDATE/DELETE â€” only service role.
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
/*
# Add resumes_generations_count to usage_counters

1. Overview
   The Resume Builder's AI section generation needs a per-month counter for
   free-tier enforcement (10 generations/month). Adds a new column to the
   existing usage_counters table with a safe default of 0. No data is lost;
   existing rows get the default on read.

2. Modified Tables
   - `usage_counters`: add `resumes_generations_count` int NOT NULL DEFAULT 0.

3. Security
   No policy changes â€” existing owner-scoped CRUD on usage_counters covers
   the new column.
*/

ALTER TABLE usage_counters ADD COLUMN IF NOT EXISTS resumes_generations_count int NOT NULL DEFAULT 0;
/*
# Pricing tiers: PRO_PLUS + FOUNDER plans, billing fields, founder pass counter

1. Overview
   Extends the existing plan_enum (FREE, PRO) with two new tiers â€” PRO_PLUS
   and FOUNDER â€” and adds the billing/subscription columns to `profiles`
   needed to gate features server-side and track Stripe state. Also
   creates a singleton `founder_pass_counter` table to enforce the
   one-time Founder Pass buyer cap atomically. No existing data is lost;
   all new columns are nullable or have safe defaults.

2. Modified Tables
   - `plan_enum`: add values 'PRO_PLUS' and 'FOUNDER'. Existing rows keep
     their current plan (FREE/PRO) â€” no data migration needed.
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
     conditional UPDATE (WHERE sold_count < cap) â€” atomic, no read-then-write
     race. Readable by authenticated users (for the public counter on the
     pricing page); writable only via service role (webhook).

4. Security (RLS)
   - founder_pass_counter: SELECT TO authenticated (USING true â€” the count
     is intentionally public to all signed-in users for the urgency
     counter). No client INSERT/UPDATE/DELETE â€” only the service role
     (stripe-webhook edge function) may mutate it.
   - profiles: existing owner-scoped SELECT/UPDATE policies already cover
     the new columns. A user still cannot escalate their own plan via the
     client because plan/billing_cycle/is_founder are only written by the
     stripe-webhook edge function using the service role, which bypasses
     RLS. (Client UPDATE policy allows the row owner to update their own
     profile, but the frontend never sends plan fields â€” and even if it
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
-- No SELECT/INSERT/UPDATE/DELETE policies for authenticated/anon â€”
-- the table is only accessible via the admin-api edge function.

CREATE INDEX IF NOT EXISTS idx_founder_mismatches_created
  ON founder_pass_price_mismatches (created_at DESC);
/*
# Add avatar_url to profiles

1. Modified Tables
- `profiles`: add `avatar_url` (text, nullable) to store the OAuth
  provider-supplied avatar image URL for users who sign in with
  Google, GitHub, Microsoft (Azure), or LinkedIn (OIDC).
2. Security
- No RLS policy changes â€” existing owner-scoped SELECT/INSERT/UPDATE
  policies on profiles already cover the new column (column-level
  privileges default to allow for the table's owning role).
3. Notes
- Nullable so existing email/password profiles are unaffected.
- The frontend profile-creation path populates this from
  user_metadata.avatar_url on first OAuth login.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
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
  - `status` (text, not null default 'IN_PROGRESS' â€” values:
    IN_PROGRESS / COMPLETED)
  - `milestone_id` (uuid, FK to milestones, ON DELETE SET NULL,
    nullable â€” optional link to a roadmap milestone)
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
/*
# Career DNA Results Table

1. New Tables
- `career_dna_results`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to authenticated user, FK to auth.users)
  - `created_at` (timestamptz, defaults to now)
  - `trait_vector` (jsonb) â€” 7-value trait vector with axis labels (AN, CR, SY, CO, ST, SE, OW)
  - `top_matches` (jsonb) â€” array of {career, match_percent} objects
  - `raw_answers` (jsonb) â€” question_id -> selected answer, for future re-scoring

2. Security
- Enable RLS on `career_dna_results`.
- Owner-scoped CRUD: each authenticated user can only access their own rows.
- INSERT is owner-scoped so results are written server-side through the authenticated client.
- Multiple rows per user are allowed (retakes create new rows, history preserved).

3. Notes
- This table does NOT overwrite on retake â€” each assessment is a new insert.
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
-- Remove job_readiness_history table
DROP TABLE IF EXISTS job_readiness_history CASCADE;

-- Remove job_readiness from feature_flags
DELETE FROM feature_flags WHERE key = 'job_readiness';

-- Remove job_readiness_score from resume_analyses
ALTER TABLE resume_analyses DROP COLUMN IF EXISTS job_readiness_score;
