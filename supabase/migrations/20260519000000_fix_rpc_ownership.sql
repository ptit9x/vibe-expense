-- ============================================
-- RPC SECURITY FIXES — Ownerhship Checks
-- ============================================
-- Fix RPC functions that bypass RLS but don't verify auth.uid():
-- 1. get_wallet_balance — must verify wallet belongs to caller
-- 2. get_wallet_transactions — must verify wallet belongs to caller
-- 3. get_monthly_report — must use auth.uid() instead of trusting p_user_id
-- 4. get_category_stats — must use auth.uid() instead of trusting p_user_id
-- 5. update_savings_progress — must verify goal belongs to caller
-- ============================================

-- 1. get_wallet_balance — add wallet ownership check
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_wallet_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_initial DECIMAL;
  v_income DECIMAL;
  v_expense DECIMAL;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Verify wallet belongs to this user
  IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE id = p_wallet_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Wallet not found or access denied';
  END IF;

  SELECT initial_balance INTO v_initial FROM public.wallets WHERE id = p_wallet_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_income
  FROM public.transactions
  WHERE wallet_id = p_wallet_id AND type = 'income';

  SELECT COALESCE(SUM(amount), 0) INTO v_expense
  FROM public.transactions
  WHERE wallet_id = p_wallet_id AND type = 'expense';

  RETURN COALESCE(v_initial, 0) + v_income - v_expense;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.get_wallet_balance(p_wallet_id UUID) SET search_path = public;

-- 2. get_wallet_transactions — add wallet ownership check
CREATE OR REPLACE FUNCTION public.get_wallet_transactions(
  p_wallet_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS SETOF public.transactions AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Verify wallet belongs to this user
  IF NOT EXISTS (SELECT 1 FROM public.wallets WHERE id = p_wallet_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'Wallet not found or access denied';
  END IF;

  RETURN QUERY
  SELECT * FROM public.transactions
  WHERE wallet_id = p_wallet_id
    AND transaction_date >= p_start_date
    AND transaction_date <= p_end_date
  ORDER BY transaction_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.get_wallet_transactions(p_wallet_id UUID, p_start_date DATE, p_end_date DATE) SET search_path = public;

-- 3. get_monthly_report — use auth.uid() instead of p_user_id
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

  WITH income AS (
    SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM public.transactions
    WHERE user_id = v_user_id
      AND type = 'income'
      AND to_char(transaction_date, 'YYYY-MM') = p_month
  ),
  expense AS (
    SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM public.transactions
    WHERE user_id = v_user_id
      AND type = 'expense'
      AND to_char(transaction_date, 'YYYY-MM') = p_month
  ),
  by_category AS (
    SELECT
      t.category_id,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      SUM(t.amount) as total,
      COUNT(t.id) as count
    FROM public.transactions t
    LEFT JOIN public.categories c ON t.category_id = c.id
    WHERE t.user_id = v_user_id
      AND to_char(t.transaction_date, 'YYYY-MM') = p_month
    GROUP BY t.category_id, c.name, c.icon, c.color
    ORDER BY total DESC
  )
  SELECT json_build_object(
    'month', p_month,
    'total_income', income.total,
    'total_expense', expense.total,
    'net_balance', income.total - expense.total,
    'by_category', (SELECT json_agg(row_to_json(by_category.*)) FROM by_category)
  ) INTO v_result
  FROM income, expense;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.get_monthly_report(p_month TEXT) SET search_path = public;

-- 4. get_category_stats — use auth.uid() instead of p_user_id
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
    SELECT json_agg(row_to_json(stats.*))
    FROM (
      SELECT
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        t.type as transaction_type,
        SUM(t.amount) as total_amount,
        COUNT(t.id) as transaction_count
      FROM public.transactions t
      JOIN public.categories c ON t.category_id = c.id
      WHERE t.user_id = v_user_id
        AND t.transaction_date >= p_start_date
        AND t.transaction_date <= p_end_date
      GROUP BY c.id, c.name, c.icon, c.color, t.type
      ORDER BY total_amount DESC
    ) stats
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.get_category_stats(p_start_date DATE, p_end_date DATE) SET search_path = public;

-- 5. update_savings_progress — add goal ownership check
CREATE OR REPLACE FUNCTION public.update_savings_progress(
  p_goal_id UUID,
  p_amount DECIMAL
)
RETURNS public.savings_goals AS $$
DECLARE
  v_user_id UUID;
  v_updated savings_goals;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Verify goal belongs to this user
  UPDATE public.savings_goals
  SET
    current_amount = current_amount + p_amount,
    updated_at = now()
  WHERE id = p_goal_id AND user_id = v_user_id
  RETURNING * INTO v_updated;

  IF v_updated IS NULL THEN
    RAISE EXCEPTION 'Savings goal not found or access denied';
  END IF;

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.update_savings_progress(p_goal_id UUID, p_amount DECIMAL) SET search_path = public;