-- Remove job_readiness_history table
DROP TABLE IF EXISTS job_readiness_history CASCADE;

-- Remove job_readiness from feature_flags
DELETE FROM feature_flags WHERE key = 'job_readiness';

-- Remove job_readiness_score from resume_analyses
ALTER TABLE resume_analyses DROP COLUMN IF EXISTS job_readiness_score;
