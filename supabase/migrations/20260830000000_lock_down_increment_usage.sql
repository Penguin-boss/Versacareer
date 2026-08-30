-- 20260830000000_lock_down_increment_usage.sql
REVOKE EXECUTE ON FUNCTION increment_usage(uuid, text, text, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_usage(uuid, text, text, int) TO service_role;
