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
   No policy changes — existing owner-scoped CRUD on usage_counters covers
   the new column.
*/

ALTER TABLE usage_counters ADD COLUMN IF NOT EXISTS resumes_generations_count int NOT NULL DEFAULT 0;
