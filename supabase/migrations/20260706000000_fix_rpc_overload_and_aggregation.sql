-- ============================================================================
-- Fix RPC overload bypass + missing ownership + lend/borrow aggregation
-- ============================================================================
-- Problems fixed:
--   C1: Migration 20260519000000 created get_monthly_report(p_month) and
--       get_category_stats(p_start, p_end) but did NOT DROP the original
--       overloads (p_user_id, ...). PostgreSQL keeps BOTH → client calls with
--       p_user_id route to the OLD insecure overload. This migration drops the
--       old overloads so only the secure auth.uid()-based versions exist.
--   C2: get_budget_status(p_user_id, p_budget_id) is SECURITY DEFINER and
--       trusts p_user_id with no auth.uid() check. It is unused by the client
--       (dead code) but still exposed via PostgREST. Drop it entirely.
--   C3: get_monthly_report uses type='income'/'expense' only, but the app
--       model is income+borrow, expense+lend (see Dashboard.tsx, CLAUDE.md).
--       Recreate with the correct aggregation so report totals match the
--       dashboard for the same period.
--   Also fix get_wallet_balance to include lend/borrow/transfer (regressed in
--   20260519000000 which reverted to income/expense only).
-- Idempotent: uses CREATE OR REPLACE and DROP FUNCTION IF EXISTS.
-- MUST be run manually on Supabase SQL Editor — migrations are NOT auto-applied.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- C1 + C3: get_monthly_report — drop BOTH overloads, recreate single secure one
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_monthly_report(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_monthly_report(TEXT);

CREATE OR REPLACE FUNCTION public.get_monthly_report(p_month TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  WITH
  -- income includes 'borrow' (money in) — matches app dashboard aggregation
  income AS (
    SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS cnt
    FROM public.transactions
    WHERE user_id = v_user_id
      AND type IN ('income', 'borrow')
      AND to_char(transaction_date, 'YYYY-MM') = p_month
  ),
  -- expense includes 'lend' (money out) — matches app dashboard aggregation
  expense AS (
    SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS cnt
    FROM public.transactions
    WHERE user_id = v_user_id
      AND type IN ('expense', 'lend')
      AND to_char(transaction_date, 'YYYY-MM') = p_month
  ),
  by_category AS (
    SELECT
      t.category_id,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      SUM(t.amount) AS total,
      COUNT(t.id) AS cnt
    FROM public.transactions t
    LEFT JOIN public.categories c ON t.category_id = c.id
    WHERE t.user_id = v_user_id
      AND to_char(t.transaction_date, 'YYYY-MM') = p_month
      AND t.type IN ('income', 'expense', 'borrow', 'lend')  -- exclude transfers from category breakdown
    GROUP BY t.category_id, c.name, c.icon, c.color
    ORDER BY total DESC
  )
  SELECT json_build_object(
    'month', p_month,
    'total_income', income.total,
    'total_expense', expense.total,
    'net_balance', income.total - expense.total,
    'by_category', COALESCE((SELECT json_agg(row_to_json(by_category.*)) FROM by_category), '[]'::json)
  ) INTO v_result
  FROM income, expense;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.get_monthly_report(TEXT) SET search_path = public;

-- ---------------------------------------------------------------------------
-- C1 + C3: get_category_stats — drop BOTH overloads, recreate single secure one
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_category_stats(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.get_category_stats(DATE, DATE);

CREATE OR REPLACE FUNCTION public.get_category_stats(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(stats.*)), '[]'::json)
    FROM (
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        t.type AS transaction_type,
        SUM(t.amount) AS total_amount,
        COUNT(t.id) AS transaction_count
      FROM public.transactions t
      JOIN public.categories c ON t.category_id = c.id
      WHERE t.user_id = v_user_id
        AND t.transaction_date >= p_start_date
        AND t.transaction_date <= p_end_date
        AND t.type IN ('income', 'expense', 'borrow', 'lend')  -- exclude transfers
      GROUP BY c.id, c.name, c.icon, c.color, t.type
      ORDER BY total_amount DESC
    ) stats
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.get_category_stats(DATE, DATE) SET search_path = public;

-- ---------------------------------------------------------------------------
-- C2: get_budget_status — SECURITY DEFINER trusts p_user_id, never fixed, dead code.
-- Drop both overloads to eliminate the IDOR surface. (Not called by the client.)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_budget_status(UUID, UUID);

-- ---------------------------------------------------------------------------
-- Fix get_wallet_balance regression — re-apply lend/borrow/transfer handling
-- that 20260519000000 reverted. Includes to_wallet_id transfer-in credits.
-- Note: this function is not currently called by the client (useWallets
-- computes balances in JS), but kept correct for consistency / future use.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_wallet_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_initial DECIMAL;
  v_in DECIMAL;   -- money in: income, borrow, transfer-in credits
  v_out DECIMAL;  -- money out: expense, lend, transfer-out debits
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE id = p_wallet_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Wallet not found or access denied';
  END IF;

  SELECT initial_balance INTO v_initial FROM public.wallets WHERE id = p_wallet_id;

  -- Money in: income + borrow on this wallet, plus transfers received (to_wallet_id)
  SELECT COALESCE(SUM(amount), 0) INTO v_in
  FROM public.transactions
  WHERE wallet_id = p_wallet_id AND type IN ('income', 'borrow');

  v_in := v_in + COALESCE((
    SELECT SUM(amount) FROM public.transactions
    WHERE to_wallet_id = p_wallet_id AND type = 'transfer'
  ), 0);

  -- Money out: expense + lend + transfers sent from this wallet
  SELECT COALESCE(SUM(amount), 0) INTO v_out
  FROM public.transactions
  WHERE wallet_id = p_wallet_id AND type IN ('expense', 'lend', 'transfer');

  RETURN COALESCE(v_initial, 0) + v_in - v_out;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.get_wallet_balance(UUID) SET search_path = public;
