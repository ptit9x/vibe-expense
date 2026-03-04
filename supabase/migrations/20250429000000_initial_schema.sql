-- Money Keeper Clone - Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== Users (extends Supabase auth.users) =====
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== Wallets =====
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'e_wallet')),
  icon TEXT DEFAULT '💰',
  color TEXT DEFAULT '#3B82F6',
  initial_balance DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wallets" ON public.wallets
  FOR ALL USING (auth.uid() = user_id);

-- ===== Categories =====
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL = system default
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#6B7280',
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view system categories" ON public.categories
  FOR SELECT USING (user_id IS NULL);

CREATE POLICY "Users can manage their own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- Insert system categories
INSERT INTO public.categories (id, user_id, name, type, icon, color, is_system) VALUES
  -- Expense categories
  (gen_random_uuid(), NULL, '🍔 Ăn uống', 'expense', '#EF4444', NULL, true),
  (gen_random_uuid(), NULL, '🚗 Di chuyển', 'expense', '#F59E0B', NULL, true),
  (gen_random_uuid(), NULL, '🛒 Mua sắm', 'expense', '#8B5CF6', NULL, true),
  (gen_random_uuid(), NULL, '🏠 Nhà cửa', 'expense', '#10B981', NULL, true),
  (gen_random_uuid(), NULL, '💊 Y tế', 'expense', '#EC4899', NULL, true),
  (gen_random_uuid(), NULL, '🎮 Giải trí', 'expense', '#06B6D4', NULL, true),
  (gen_random_uuid(), NULL, '📚 Học tập', 'expense', '#6366F1', NULL, true),
  (gen_random_uuid(), NULL, '💰 Khác', 'expense', '#6B7280', NULL, true),
  -- Income categories
  (gen_random_uuid(), NULL, '💵 Lương', 'income', '#10B981', NULL, true),
  (gen_random_uuid(), NULL, '🎁 Thưởng', 'income', '#F59E0B', NULL, true),
  (gen_random_uuid(), NULL, '📈 Đầu tư', 'income', '#3B82F6', NULL, true),
  (gen_random_uuid(), NULL, '💼 Thêm thu nhập', 'income', '#8B5CF6', NULL, true)
ON CONFLICT DO NOTHING;

-- ===== Transactions =====
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
  ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet 
  ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category 
  ON public.transactions(category_id);

-- ===== Budgets =====
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly')),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_budgets_user 
  ON public.budgets(user_id);

-- ===== Savings Goals =====
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(15,2) DEFAULT 0 CHECK (current_amount >= 0),
  deadline DATE,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#10B981',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own savings goals" ON public.savings_goals
  FOR ALL USING (auth.uid() = user_id);

-- ===== Helper Functions =====

-- Get wallet balance (initial + all transactions)
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_wallet_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_initial DECIMAL;
  v_income DECIMAL;
  v_expense DECIMAL;
BEGIN
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

-- Get monthly report
CREATE OR REPLACE FUNCTION public.get_monthly_report(p_user_id UUID, p_month TEXT)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH income AS (
    SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM public.transactions
    WHERE user_id = p_user_id 
      AND type = 'income'
      AND to_char(transaction_date, 'YYYY-MM') = p_month
  ),
  expense AS (
    SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
    FROM public.transactions
    WHERE user_id = p_user_id 
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
      COUNT(*) as count
    FROM public.transactions t
    LEFT JOIN public.categories c ON t.category_id = c.id
    WHERE t.user_id = p_user_id 
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

-- Get wallet transactions within date range
CREATE OR REPLACE FUNCTION public.get_wallet_transactions(
  p_wallet_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS SETOF public.transactions AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.transactions
  WHERE wallet_id = p_wallet_id
    AND transaction_date >= p_start_date
    AND transaction_date <= p_end_date
  ORDER BY transaction_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get category stats within date range
CREATE OR REPLACE FUNCTION public.get_category_stats(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON AS $$
BEGIN
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
      WHERE t.user_id = p_user_id
        AND t.transaction_date >= p_start_date
        AND t.transaction_date <= p_end_date
      GROUP BY c.id, c.name, c.icon, c.color, t.type
      ORDER BY total_amount DESC
    ) stats
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update savings goal progress
CREATE OR REPLACE FUNCTION public.update_savings_progress(
  p_goal_id UUID,
  p_amount DECIMAL
)
RETURNS public.savings_goals AS $$
DECLARE
  v_updated savings_goals;
BEGIN
  UPDATE public.savings_goals
  SET 
    current_amount = current_amount + p_amount,
    updated_at = now()
  WHERE id = p_goal_id
  RETURNING * INTO v_updated;
  
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get budget status (spent vs limit)
CREATE OR REPLACE FUNCTION public.get_budget_status(
  p_user_id UUID,
  p_budget_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_budget budgets%ROWTYPE;
  v_spent DECIMAL;
  v_percentage DECIMAL;
BEGIN
  SELECT * INTO v_budget FROM public.budgets WHERE id = p_budget_id AND user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Budget not found');
  END IF;
  
  -- Calculate spent amount for the budget period
  SELECT COALESCE(SUM(amount), 0) INTO v_spent
  FROM public.transactions
  WHERE user_id = p_user_id
    AND category_id = v_budget.category_id
    AND type = 'expense'
    AND transaction_date >= v_budget.start_date
    AND (v_budget.end_date IS NULL OR transaction_date <= v_budget.end_date);
  
  v_percentage := CASE WHEN v_budget.amount > 0 THEN (v_spent / v_budget.amount) * 100 ELSE 0 END;
  
  RETURN json_build_object(
    'budget_id', v_budget.id,
    'budget_amount', v_budget.amount,
    'spent', v_spent,
    'remaining', v_budget.amount - v_spent,
    'percentage', ROUND(v_percentage, 2),
    'category_id', v_budget.category_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== Enable Realtime (optional) =====
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;