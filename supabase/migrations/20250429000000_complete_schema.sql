-- Money Keeper - Complete Schema
-- Single migration file for fresh Supabase setup
-- Run this in Supabase SQL Editor

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'VND' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CATEGORIES TABLE (system + user)
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = system default
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#6B7280',
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_system BOOLEAN DEFAULT false,
  i18n_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- WALLETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'e_wallet')),
  icon TEXT DEFAULT '💰',
  color TEXT DEFAULT '#3B82F6',
  initial_balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- ============================================
-- BUDGETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly')),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SAVINGS GOALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_active ON public.wallets(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_i18n_key ON public.categories(i18n_key);

-- ============================================
-- TRIGGERS (Auth -> Profile -> Wallet)
-- ============================================

-- Trigger: Create profile + default wallet on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  
  -- Create default Cash wallet
  INSERT INTO public.wallets (user_id, name, type, icon, color, initial_balance)
  VALUES (NEW.id, 'Cash', 'cash', '💵', '#3B82F6', 0)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.handle_new_user() SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get wallet balance
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

ALTER FUNCTION public.get_wallet_balance(p_wallet_id UUID) SET search_path = public;

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

ALTER FUNCTION public.get_wallet_transactions(p_wallet_id UUID, p_start_date DATE, p_end_date DATE) SET search_path = public;

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
      COUNT(t.id) as count
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

ALTER FUNCTION public.get_monthly_report(p_user_id UUID, p_month TEXT) SET search_path = public;

-- Get category stats
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

ALTER FUNCTION public.get_category_stats(p_user_id UUID, p_start_date DATE, p_end_date DATE) SET search_path = public;

-- Get budget status
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

ALTER FUNCTION public.get_budget_status(p_user_id UUID, p_budget_id UUID) SET search_path = public;

-- Update savings progress
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

ALTER FUNCTION public.update_savings_progress(p_goal_id UUID, p_amount DECIMAL) SET search_path = public;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles: user owns their profile
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Wallets: user owns their wallets
DROP POLICY IF EXISTS "wallets_select" ON public.wallets;
DROP POLICY IF EXISTS "wallets_insert" ON public.wallets;
DROP POLICY IF EXISTS "wallets_update" ON public.wallets;
DROP POLICY IF EXISTS "wallets_delete" ON public.wallets;

CREATE POLICY "wallets_select" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallets_insert" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallets_update" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wallets_delete" ON public.wallets FOR DELETE USING (auth.uid() = user_id);

-- Categories: system (user_id=NULL) readable by all, user categories readable by owner
DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_update" ON public.categories;
DROP POLICY IF EXISTS "categories_delete" ON public.categories;

CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Transactions: user owns their transactions
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete" ON public.transactions;

CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Budgets: user owns their budgets
DROP POLICY IF EXISTS "budgets_select" ON public.budgets;
DROP POLICY IF EXISTS "budgets_insert" ON public.budgets;
DROP POLICY IF EXISTS "budgets_update" ON public.budgets;
DROP POLICY IF EXISTS "budgets_delete" ON public.budgets;

CREATE POLICY "budgets_select" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "budgets_delete" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- Savings Goals: user owns their savings goals
DROP POLICY IF EXISTS "savings_goals_select" ON public.savings_goals;
DROP POLICY IF EXISTS "savings_goals_insert" ON public.savings_goals;
DROP POLICY IF EXISTS "savings_goals_update" ON public.savings_goals;
DROP POLICY IF EXISTS "savings_goals_delete" ON public.savings_goals;

CREATE POLICY "savings_goals_select" ON public.savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "savings_goals_insert" ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "savings_goals_update" ON public.savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "savings_goals_delete" ON public.savings_goals FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- SEED SYSTEM CATEGORIES
-- ============================================
DELETE FROM public.categories WHERE is_system = true;

DO $$
DECLARE
  -- Expense Parents
  v_an_uong UUID := gen_random_uuid();
  v_sinh_hoat UUID := gen_random_uuid();
  v_di_lai UUID := gen_random_uuid();
  v_trang_phuc UUID := gen_random_uuid();
  v_suc_khoe UUID := gen_random_uuid();
  v_giao_duc UUID := gen_random_uuid();
  v_huong_thu UUID := gen_random_uuid();
  v_quan_he UUID := gen_random_uuid();
  v_con_cai UUID := gen_random_uuid();
  v_nha_cua UUID := gen_random_uuid();
  -- Income Parents
  v_luong UUID := gen_random_uuid();
  v_kinh_doanh UUID := gen_random_uuid();
  v_khac UUID := gen_random_uuid();
BEGIN
  -- Parent Expenses
  INSERT INTO public.categories (id, user_id, name, type, icon, color, is_system, i18n_key) VALUES
    (v_an_uong, NULL, '🍔 Ăn uống', 'expense', '🍔', '#EF4444', true, 'categories.food'),
    (v_sinh_hoat, NULL, '⚡ Dịch vụ sinh hoạt', 'expense', '⚡', '#F59E0B', true, 'categories.utilities'),
    (v_di_lai, NULL, '🚗 Đi lại', 'expense', '🚗', '#3B82F6', true, 'categories.transport'),
    (v_trang_phuc, NULL, '💄 Trang phục & Mỹ phẩm', 'expense', '💄', '#EC4899', true, 'categories.shopping'),
    (v_suc_khoe, NULL, '💊 Sức khỏe', 'expense', '💊', '#10B981', true, 'categories.health'),
    (v_giao_duc, NULL, '📚 Giáo dục', 'expense', '📚', '#6366F1', true, 'categories.education'),
    (v_huong_thu, NULL, '🎮 Hưởng thụ', 'expense', '🎮', '#8B5CF6', true, 'categories.entertainment'),
    (v_quan_he, NULL, '🤝 Giao lưu & Quan hệ', 'expense', '🤝', '#F43F5E', true, 'categories.social'),
    (v_con_cai, NULL, '👶 Con cái', 'expense', '👶', '#06B6D4', true, 'categories.children'),
    (v_nha_cua, NULL, '🏠 Nhà cửa', 'expense', '🏠', '#6B7280', true, 'categories.housing');

  -- Subcategories Ăn uống
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key) VALUES
    (NULL, 'Đi chợ/Siêu thị', 'expense', '🛒', '#EF4444', v_an_uong, true, 'categories.grocery'),
    (NULL, 'Ăn tiệm', 'expense', '🍜', '#EF4444', v_an_uong, true, 'categories.restaurant'),
    (NULL, 'Cafe', 'expense', '☕', '#EF4444', v_an_uong, true, 'categories.cafe'),
    (NULL, 'Tiệc tùng', 'expense', '🥳', '#EF4444', v_an_uong, true, 'categories.party');

  -- Subcategories Dịch vụ sinh hoạt
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key) VALUES
    (NULL, 'Tiền điện', 'expense', '💡', '#F59E0B', v_sinh_hoat, true, 'categories.electricity'),
    (NULL, 'Tiền nước', 'expense', '💧', '#F59E0B', v_sinh_hoat, true, 'categories.water'),
    (NULL, 'Internet', 'expense', '🌐', '#F59E0B', v_sinh_hoat, true, 'categories.internet'),
    (NULL, 'Truyền hình cáp', 'expense', '📺', '#F59E0B', v_sinh_hoat, true, 'categories.cable'),
    (NULL, 'Điện thoại di động', 'expense', '📱', '#F59E0B', v_sinh_hoat, true, 'categories.phone'),
    (NULL, 'Gas', 'expense', '🔥', '#F59E0B', v_sinh_hoat, true, 'categories.gas');

  -- Subcategories Đi lại
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key) VALUES
    (NULL, 'Đổ xăng', 'expense', '⛽', '#3B82F6', v_di_lai, true, 'categories.fuel'),
    (NULL, 'Thay dầu/Bảo dưỡng xe', 'expense', '🔧', '#3B82F6', v_di_lai, true, 'categories.carMaintenance'),
    (NULL, 'Taxi/Grab', 'expense', '🚕', '#3B82F6', v_di_lai, true, 'categories.rideshare'),
    (NULL, 'Gửi xe', 'expense', '🅿️', '#3B82F6', v_di_lai, true, 'categories.parking'),
    (NULL, 'Vé xe buýt/Tàu hỏa', 'expense', '🎫', '#3B82F6', v_di_lai, true, 'categories.publicTransport');

  -- Subcategories Trang phục & Mỹ phẩm
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key) VALUES
    (NULL, 'Quần áo', 'expense', '👕', '#EC4899', v_trang_phuc, true, 'categories.clothes'),
    (NULL, 'Giày dép', 'expense', '👟', '#EC4899', v_trang_phuc, true, 'categories.shoes'),
    (NULL, 'Phụ kiện', 'expense', '⌚', '#EC4899', v_trang_phuc, true, 'categories.accessories'),
    (NULL, 'Mỹ phẩm', 'expense', '🧴', '#EC4899', v_trang_phuc, true, 'categories.cosmetics'),
    (NULL, 'Cắt tóc/Làm đẹp', 'expense', '✂️', '#EC4899', v_trang_phuc, true, 'categories.salon');

  -- Subcategories Sức khỏe
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key) VALUES
    (NULL, 'Thuốc men', 'expense', '💊', '#10B981', v_suc_khoe, true, 'categories.medicine'),
    (NULL, 'Khám chữa bệnh', 'expense', '🏥', '#10B981', v_suc_khoe, true, 'categories.medical'),
    (NULL, 'Bảo hiểm sức khỏe', 'expense', '🛡️', '#10B981', v_suc_khoe, true, 'categories.insurance');

  -- Subcategories Giáo dục
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key) VALUES
    (NULL, 'Học phí', 'expense', '🎓', '#6366F1', v_giao_duc, true, 'categories.tuition'),
    (NULL, 'Sách vở', 'expense', '📚', '#6366F1', v_giao_duc, true, 'categories.books'),
    (NULL, 'Tài liệu', 'expense', '📄', '#6366F1', v_giao_duc, true, 'categories.supplies'),
    (NULL, 'Khóa học kỹ năng', 'expense', '💡', '#6366F1', v_giao_duc, true, 'categories.courses');

  -- Subcategories Hưởng thụ
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key) VALUES
    (NULL, 'Du lịch', 'expense', '✈️', '#8B5CF6', v_huong_thu, true, 'categories.travel'),
    (NULL, 'Xem phim', 'expense', '🎬', '#8B5CF6', v_huong_thu, true, 'categories.movies'),
    (NULL, 'Nhạc/Sách báo', 'expense', '🎵', '#8B5CF6', v_huong_thu, true, 'categories.entertainmentMedia'),
    (NULL, 'Đồ chơi/Game', 'expense', '🎮', '#8B5CF6', v_huong_thu, true, 'categories.gaming');

  -- Subcategories Giao lưu & Quan hệ
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key) VALUES
    (NULL, 'Biếu quà', 'expense', '🎁', '#F43F5E', v_quan_he, true, 'categories.gifts'),
    (NULL, 'Đám cưới', 'expense', '💍', '#F43F5E', v_quan_he, true, 'categories.wedding'),
    (NULL, 'Đám tang', 'expense', '🕯️', '#F43F5E', v_quan_he, true, 'categories.funeral'),
    (NULL, 'Làm từ thiện', 'expense', '❤️', '#F43F5E', v_quan_he, true, 'categories.charity');

  -- Subcategories Con cái
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key) VALUES
    (NULL, 'Sữa', 'expense', '🥛', '#06B6D4', v_con_cai, true, 'categories.babyMilk'),
    (NULL, 'Tã bỉm', 'expense', '🍼', '#06B6D4', v_con_cai, true, 'categories.diapers'),
    (NULL, 'Đồ chơi cho con', 'expense', '🧸', '#06B6D4', v_con_cai, true, 'categories.babyToys'),
    (NULL, 'Học phí cho con', 'expense', '🎒', '#06B6D4', v_con_cai, true, 'categories.childTuition');

  -- Subcategories Nhà cửa
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key) VALUES
    (NULL, 'Tiền thuê nhà', 'expense', '🔑', '#6B7280', v_nha_cua, true, 'categories.rent'),
    (NULL, 'Sửa chữa nhà', 'expense', '🛠️', '#6B7280', v_nha_cua, true, 'categories.homeRepair'),
    (NULL, 'Mua sắm đồ gia dụng', 'expense', '🛋️', '#6B7280', v_nha_cua, true, 'categories.homeAppliances');

  -- Parent Income
  INSERT INTO public.categories (id, user_id, name, type, icon, color, is_system, i18n_key) VALUES
    (v_luong, NULL, '💵 Lương', 'income', '💵', '#10B981', true, 'categories.salary'),
    (v_kinh_doanh, NULL, '📈 Kinh doanh', 'income', '📈', '#3B82F6', true, 'categories.business'),
    (v_khac, NULL, '💰 Khác', 'income', '💰', '#F59E0B', true, 'categories.otherIncome');

  -- Subcategories Lương
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key) VALUES
    (NULL, 'Lương chính thức', 'income', '💼', '#10B981', v_luong, true, 'categories.salaryMain'),
    (NULL, 'Lương làm thêm', 'income', '🌙', '#10B981', v_luong, true, 'categories.salaryOvertime'),
    (NULL, 'Tiền thưởng', 'income', '🧧', '#10B981', v_luong, true, 'categories.bonus');

  -- Subcategories Kinh doanh
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key) VALUES
    (NULL, 'Doanh thu bán hàng', 'income', '🏪', '#3B82F6', v_kinh_doanh, true, 'categories.sales'),
    (NULL, 'Tiền lãi từ đầu tư/Chứng khoán', 'income', '💹', '#3B82F6', v_kinh_doanh, true, 'categories.investment');

  -- Subcategories Khác
  INSERT INTO public.categories (user_id, name, type, icon, color, parent_id, is_system, i18n_key) VALUES
    (NULL, 'Tiền được tặng/biếu', 'income', '🎁', '#F59E0B', v_khac, true, 'categories.giftMoney'),
    (NULL, 'Tiền lãi ngân hàng', 'income', '🏦', '#F59E0B', v_khac, true, 'categories.interest'),
    (NULL, 'Thu nợ', 'income', '💸', '#F59E0B', v_khac, true, 'categories.debtCollection'),
    (NULL, 'Thu nhập vãng lai', 'income', '🌊', '#F59E0B', v_khac, true, 'categories.freelance');

END $$;
