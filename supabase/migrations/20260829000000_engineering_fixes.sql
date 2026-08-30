-- Issue 2: Drop client write access to usage_counters, keep read-only
DROP POLICY IF EXISTS "insert_own_usage_counters" ON usage_counters;
DROP POLICY IF EXISTS "update_own_usage_counters" ON usage_counters;

-- Issue 7: career_dna_results is the single source of truth going forward. Drop the obsolete tables.
-- Also Issue 1: Career DNA results can be spoofed client-side
DROP POLICY IF EXISTS "insert_own_career_dna" ON career_dna_results;

DROP TABLE IF EXISTS career_dna CASCADE;
DROP TABLE IF EXISTS career_dna_history CASCADE;

-- Atomic increment for usage_counters
CREATE OR REPLACE FUNCTION increment_usage(p_user_id uuid, p_month_key text, p_type text, p_limit int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count int;
BEGIN
  -- Ensure row exists
  INSERT INTO usage_counters (user_id, month_key, analyses_count, chat_count, resumes_generations_count)
  VALUES (p_user_id, p_month_key, 0, 0, 0)
  ON CONFLICT (user_id, month_key) DO NOTHING;

  -- Lock row for update
  SELECT
    CASE 
      WHEN p_type = 'analyses' THEN analyses_count
      WHEN p_type = 'chat' THEN chat_count
      WHEN p_type = 'resumes' THEN resumes_generations_count
    END INTO current_count
  FROM usage_counters
  WHERE user_id = p_user_id AND month_key = p_month_key
  FOR UPDATE;

  IF current_count >= p_limit THEN
    RETURN false;
  END IF;

  IF p_type = 'analyses' THEN
    UPDATE usage_counters SET analyses_count = analyses_count + 1 WHERE user_id = p_user_id AND month_key = p_month_key;
  ELSIF p_type = 'chat' THEN
    UPDATE usage_counters SET chat_count = chat_count + 1 WHERE user_id = p_user_id AND month_key = p_month_key;
  ELSIF p_type = 'resumes' THEN
    UPDATE usage_counters SET resumes_generations_count = resumes_generations_count + 1 WHERE user_id = p_user_id AND month_key = p_month_key;
  END IF;

  RETURN true;
END;
$$;
