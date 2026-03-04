-- Money Keeper Clone - Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== Users (extends Supabase auth.users) =====
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
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

-- ===== Enable Realtime (optional) =====
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;