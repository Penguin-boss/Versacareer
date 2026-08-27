/*
# Add avatar_url to profiles

1. Modified Tables
- `profiles`: add `avatar_url` (text, nullable) to store the OAuth
  provider-supplied avatar image URL for users who sign in with
  Google, GitHub, Microsoft (Azure), or LinkedIn (OIDC).
2. Security
- No RLS policy changes — existing owner-scoped SELECT/INSERT/UPDATE
  policies on profiles already cover the new column (column-level
  privileges default to allow for the table's owning role).
3. Notes
- Nullable so existing email/password profiles are unaffected.
- The frontend profile-creation path populates this from
  user_metadata.avatar_url on first OAuth login.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
