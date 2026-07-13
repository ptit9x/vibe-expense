-- ============================================================================
-- Idempotent safety net: ensure ALL insecure RPC overloads are gone.
-- The fix migration 20260706000000 drops these, but if it was not applied
-- (e.g., manual SQL editor was used for a subset), these overloads persist.
-- ============================================================================

-- Drop insecure overloads that trust p_user_id (auth.uid() bypass)
DROP FUNCTION IF EXISTS public.get_monthly_report(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_category_stats(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.get_budget_status(UUID, UUID);

-- Verification query (run manually on Supabase SQL Editor to confirm):
-- SELECT proname, pg_get_function_arguments(oid) as args
-- FROM pg_proc
-- WHERE proname IN ('get_monthly_report', 'get_category_stats', 'get_budget_status', 'get_wallet_balance')
-- ORDER BY proname;
-- Expected: NO rows with UUID as first arg for get_monthly_report/get_category_stats
