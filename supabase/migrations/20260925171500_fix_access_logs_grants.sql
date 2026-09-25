-- Fix 403 on access_logs: tables/functions created by the CI migration runner
-- do NOT inherit the platform's default privileges for anon/authenticated.
-- Explicit grants are this repo's convention (see app_notifications,
-- financial_reports migrations).
-- Deliberate choices:
--   * only SELECT/INSERT/UPDATE (no DELETE) — access history is immutable
--   * nothing for anon — every call comes from a signed-in user

GRANT SELECT, INSERT, UPDATE ON TABLE public.access_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_access(text, text, text, text, text, text) TO authenticated;
