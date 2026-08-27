/*
# VersaCareer AI — core schema (V1)

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
