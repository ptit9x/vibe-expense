# Money Keeper Clone - Database Schema

**Version:** 2.0.0  
**Last Updated:** 2026-05-05

---

## Table of Contents
1. [profiles](#1-profiles)
2. [wallets](#2-wallets)
3. [categories](#3-categories)
4. [transactions](#4-transactions)
5. [budgets](#5-budgets)
6. [savings_goals](#6-savings_goals)

---

## 1. profiles

User profile table - extends Supabase auth.users

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'VND' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `id` | UUID | - | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | User ID - links to Supabase Auth |
| `email` | TEXT | - | NOT NULL | User email address |
| `full_name` | TEXT | NULL | - | User display name |
| `avatar_url` | TEXT | NULL | - | User avatar URL |
| `currency` | TEXT | `'VND'` | NOT NULL | User's preferred currency |
| `created_at` | TIMESTAMPTZ | `now()` | - | Profile creation timestamp |
| `updated_at` | TIMESTAMPTZ | `now()` | - | Last profile update timestamp |

### Row Level Security
```sql
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

### Triggers
```sql
-- Auto-create profile + default wallet when user signs up
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 2. wallets

Wallet/Account table - stores user's financial accounts

```sql
CREATE TABLE public.wallets (
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
```

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `id` | UUID | `gen_random_uuid()` | PRIMARY KEY | Unique wallet identifier |
| `user_id` | UUID | - | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Owner user ID |
| `name` | TEXT | - | NOT NULL | Wallet name (e.g., "Cash", "MB Bank", "Momo") |
| `type` | TEXT | - | NOT NULL, CHECK (cash, bank, e_wallet) | Wallet type category |
| `icon` | TEXT | `'💰'` | - | Emoji icon for display |
| `color` | TEXT | `'#3B82F6'` | - | Hex color code for UI theming |
| `initial_balance` | DECIMAL(15,2) | `0` | - | Starting balance when wallet was created |
| `is_active` | BOOLEAN | `true` | NOT NULL | Soft delete flag (false = deactivated) |
| `created_at` | TIMESTAMPTZ | `now()` | - | Wallet creation timestamp |
| `updated_at` | TIMESTAMPTZ | `now()` | - | Last wallet update timestamp |

### Wallet Types (Enum)
| Value | Description | Example |
|-------|-------------|---------|
| `cash` | Physical cash | Wallet at home |
| `bank` | Bank account / debit card | MB Bank, Vietcombank |
| `e_wallet` | Digital wallet | Momo, ZaloPay, VNPay |

### Row Level Security
```sql
CREATE POLICY "wallets_select" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wallets_insert" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallets_update" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wallets_delete" ON public.wallets FOR DELETE USING (auth.uid() = user_id);
```

### Indexes
```sql
CREATE INDEX idx_wallets_user_active ON public.wallets(user_id) WHERE is_active = true;
```

---

## 3. categories

Transaction categories - system defaults (user_id = null) and user-created (user_id = auth.uid())

```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#6B7280',
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_system BOOLEAN DEFAULT false,
  i18n_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `id` | UUID | `gen_random_uuid()` | PRIMARY KEY | Unique category identifier |
| `user_id` | UUID | NULL | REFERENCES auth.users(id) ON DELETE CASCADE | Owner user ID (NULL = system default) |
| `name` | TEXT | - | NOT NULL | Category name (with emoji prefix, e.g., "🍔 Ăn uống") |
| `type` | TEXT | - | NOT NULL, CHECK (income, expense) | Transaction type category |
| `icon` | TEXT | `'📦'` | - | Emoji icon for display |
| `color` | TEXT | `'#6B7280'` | - | Hex color code for UI |
| `parent_id` | UUID | NULL | REFERENCES categories(id) ON DELETE SET NULL | Parent category for sub-categories |
| `is_system` | BOOLEAN | `false` | - | TRUE = system default |
| `i18n_key` | TEXT | NULL | - | i18n key for translated labels (e.g., "categories.food") |
| `created_at` | TIMESTAMPTZ | `now()` | - | Category creation timestamp |

### Category Types (Enum)
| Value | Description |
|-------|-------------|
| `income` | Categories for incoming money (salary, bonus, etc.) |
| `expense` | Categories for outgoing money (food, transport, etc.) |

### Row Level Security
```sql
-- SELECT: System categories (user_id = null) OR user's own categories
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

-- INSERT: Only auth.uid() = user_id
CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only user's own categories
CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Only user's own categories
CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);
```

### System Categories (Pre-seeded)

**Expense Categories:**
| Name | i18n_key | Icon | Color | Subcategories |
|------|----------|------|-------|---------------|
| 🍔 Ăn uống | categories.food | 🍔 | #EF4444 | Đi chợ/Siêu thị, Ăn tiệm, Cafe, Tiệc tùng |
| ⚡ Dịch vụ sinh hoạt | categories.utilities | ⚡ | #F59E0B | Tiền điện, Tiền nước, Internet, Truyền hình cáp, Điện thoại, Gas |
| 🚗 Đi lại | categories.transport | 🚗 | #3B82F6 | Đổ xăng, Bảo dưỡng xe, Taxi/Grab, Gửi xe, Xe buýt/Tàu |
| 💄 Trang phục & Mỹ phẩm | categories.shopping | 💄 | #EC4899 | Quần áo, Giày dép, Phụ kiện, Mỹ phẩm, Cắt tóc/Làm đẹp |
| 💊 Sức khỏe | categories.health | 💊 | #10B981 | Thuốc men, Khám chữa bệnh, Bảo hiểm sức khỏe |
| 📚 Giáo dục | categories.education | 📚 | #6366F1 | Học phí, Sách vở, Tài liệu, Khóa học kỹ năng |
| 🎮 Hưởng thụ | categories.entertainment | 🎮 | #8B5CF6 | Du lịch, Xem phim, Nhạc/Sách báo, Đồ chơi/Game |
| 🤝 Giao lưu & Quan hệ | categories.social | 🤝 | #F43F5E | Biếu quà, Đám cưới, Đám tang, Làm từ thiện |
| 👶 Con cái | categories.children | 👶 | #06B6D4 | Sữa, Tã bỉm, Đồ chơi, Học phí cho con |
| 🏠 Nhà cửa | categories.housing | 🏠 | #6B7280 | Tiền thuê nhà, Sửa chữa nhà, Mua sắm đồ gia dụng |

**Income Categories:**
| Name | i18n_key | Icon | Color | Subcategories |
|------|----------|------|-------|---------------|
| 💵 Lương | categories.salary | 💵 | #10B981 | Lương chính thức, Lương làm thêm, Tiền thưởng |
| 📈 Kinh doanh | categories.business | 📈 | #3B82F6 | Doanh thu bán hàng, Tiền lãi đầu tư/Chứng khoán |
| 💰 Khác | categories.otherIncome | 💰 | #F59E0B | Tiền được tặng/biếu, Tiền lãi ngân hàng, Thu nợ, Thu nhập vãng lai |

### Indexes
```sql
CREATE INDEX idx_categories_i18n_key ON public.categories(i18n_key);
```

---

## 4. transactions

Transaction records - income and expense entries

```sql
CREATE TABLE public.transactions (
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
```

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `id` | UUID | `gen_random_uuid()` | PRIMARY KEY | Unique transaction identifier |
| `user_id` | UUID | - | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Owner user ID |
| `wallet_id` | UUID | NULL | REFERENCES wallets(id) ON DELETE SET NULL | Target wallet |
| `category_id` | UUID | NULL | REFERENCES categories(id) ON DELETE SET NULL | Transaction category |
| `type` | TEXT | - | NOT NULL, CHECK (income, expense) | Income or expense |
| `amount` | DECIMAL(15,2) | - | NOT NULL, CHECK (amount > 0) | Transaction amount in VND |
| `description` | TEXT | NULL | - | Transaction note/memo |
| `transaction_date` | DATE | `CURRENT_DATE` | NOT NULL | Date of transaction |
| `created_at` | TIMESTAMPTZ | `now()` | - | Transaction creation timestamp |
| `updated_at` | TIMESTAMPTZ | `now()` | - | Last transaction update timestamp |

### Row Level Security
```sql
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE USING (auth.uid() = user_id);
```

### Indexes
```sql
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
```

---

## 5. budgets

Budget limits - spending limits per category

```sql
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  period TEXT NOT NULL CHECK (period IN ('monthly', 'weekly')),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `id` | UUID | `gen_random_uuid()` | PRIMARY KEY | Unique budget identifier |
| `user_id` | UUID | - | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Owner user ID |
| `category_id` | UUID | - | NOT NULL, REFERENCES categories(id) ON DELETE CASCADE | Target category |
| `amount` | DECIMAL(15,2) | - | NOT NULL, CHECK (amount > 0) | Budget limit amount in VND |
| `period` | TEXT | - | NOT NULL, CHECK (monthly, weekly) | Budget reset period |
| `start_date` | DATE | - | NOT NULL | Budget period start date |
| `end_date` | DATE | NULL | - | Budget period end date |
| `created_at` | TIMESTAMPTZ | `now()` | - | Budget creation timestamp |

### Budget Periods (Enum)
| Value | Description |
|-------|-------------|
| `monthly` | Budget resets at the start of each month |
| `weekly` | Budget resets at the start of each week (Monday) |

### Row Level Security
```sql
CREATE POLICY "budgets_select" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "budgets_delete" ON public.budgets FOR DELETE USING (auth.uid() = user_id);
```

### Indexes
```sql
CREATE INDEX idx_budgets_user ON public.budgets(user_id);
```

---

## 6. savings_goals

Savings goals - target amounts that users want to save

```sql
CREATE TABLE public.savings_goals (
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
```

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `id` | UUID | `gen_random_uuid()` | PRIMARY KEY | Unique savings goal identifier |
| `user_id` | UUID | - | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Owner user ID |
| `name` | TEXT | - | NOT NULL | Savings goal name |
| `target_amount` | DECIMAL(15,2) | - | NOT NULL, CHECK (target_amount > 0) | Target amount to save |
| `current_amount` | DECIMAL(15,2) | `0` | CHECK (current_amount >= 0) | Amount already saved |
| `deadline` | DATE | NULL | - | Target completion date |
| `icon` | TEXT | `'🎯'` | - | Emoji icon for display |
| `color` | TEXT | `'#10B981'` | - | Hex color code for UI theming |
| `created_at` | TIMESTAMPTZ | `now()` | - | Goal creation timestamp |
| `updated_at` | TIMESTAMPTZ | `now()` | - | Last goal update timestamp |

### Row Level Security
```sql
CREATE POLICY "savings_goals_select" ON public.savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "savings_goals_insert" ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "savings_goals_update" ON public.savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "savings_goals_delete" ON public.savings_goals FOR DELETE USING (auth.uid() = user_id);
```

---

## Helper Functions

```sql
-- Get wallet balance
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_wallet_id UUID)
RETURNS DECIMAL AS $$
-- Returns: initial_balance + income - expense
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get wallet transactions within date range
CREATE OR REPLACE FUNCTION public.get_wallet_transactions(
  p_wallet_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS SETOF public.transactions
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get monthly report
CREATE OR REPLACE FUNCTION public.get_monthly_report(p_user_id UUID, p_month TEXT)
RETURNS JSON AS $$
-- Returns: { month, total_income, total_expense, net_balance, by_category[] }
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get category stats
CREATE OR REPLACE FUNCTION public.get_category_stats(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSON AS $$
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get budget status
CREATE OR REPLACE FUNCTION public.get_budget_status(
  p_user_id UUID,
  p_budget_id UUID
)
RETURNS JSON AS $$
-- Returns: { budget_id, budget_amount, spent, remaining, percentage, category_id }
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update savings progress
CREATE OR REPLACE FUNCTION public.update_savings_progress(
  p_goal_id UUID,
  p_amount DECIMAL
)
RETURNS public.savings_goals
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Note:** All SECURITY DEFINER functions have `ALTER FUNCTION ... SET search_path = public` for security.

---

## Data Types Reference

| Type | Format | Example | Range |
|------|--------|---------|-------|
| `UUID` | 32 hex chars + hyphens | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` | 36 chars |
| `TEXT` | Variable length string | `"Hello World"` | Up to 1GB |
| `BOOLEAN` | true / false | `true`, `false` | - |
| `DECIMAL(15,2)` | 15 digits, 2 decimal places | `1234567890.12` | ±999,999,999,999.99 |
| `DATE` | YYYY-MM-DD | `2025-04-29` | - |
| `TIMESTAMPTZ` | YYYY-MM-DD HH:MM:SS+TZ | `2025-04-29 12:00:00+07:00` | - |

---

## Relationships

```
auth.users (external)
    │
    ├── profiles (1:1)
    │
    ├── wallets (1:N) ──────── transactions (N:1)
    │
    ├── categories (1:N) ──── budgets (1:N)
    │
    ├── transactions (1:N)
    │
    ├── budgets (1:N)
    │
    └── savings_goals (1:N)
```

---

## Key Design Decisions

### 1. User ID References auth.users directly
All tables that need user_id reference `auth.users(id)` instead of `profiles(id)`. This simplifies the trigger chain: `auth.users` → `profiles` + `wallets` (both created in single trigger).

### 2. Categories: System vs User
- **System categories**: `user_id = NULL`, `is_system = true` - visible to all users, not editable
- **User categories**: `user_id = auth.uid()`, `is_system = false` - visible/editable only by owner

### 3. Single Migration File
All schema definitions are consolidated into a single migration file `20250429000000_complete_schema.sql` for easy fresh setup.

### 4. Soft Delete for Wallets
Wallets use `is_active` boolean flag instead of hard delete. This preserves transaction history.

---

## Changelog

### v2.0.0 (2026-05-05)
- **Removed:** `user_categories` table (unused)
- **Added:** `currency` column to `profiles` table
- **Added:** `is_active` column to `wallets` table (soft delete)
- **Updated:** Single migration file with all schema, triggers, RLS, indexes, functions
- **Added:** `search_path = public` security fix for all SECURITY DEFINER functions
- **Updated:** Full system categories with i18n keys

### v1.3.0 (2026-05-04)
- **Updated:** `wallets.user_id` now references `auth.users(id)` directly
- **Added:** `user_categories` table for per-user category customizations
- **Added:** `i18n_key` column to `categories`

### v1.0.0 (2026-04-29)
- Initial schema design

---

## Notes

1. **Cascade Delete**: When a user is deleted, all related data is also deleted
2. **Set Null**: When a wallet or category is deleted, transactions keep their references as NULL
3. **System Categories**: Have `user_id = NULL` and `is_system = true` - cannot be deleted by users
4. **RLS**: All tables have Row Level Security - users can only access their own data
5. **Timestamps**: All TIMESTAMPTZ fields store UTC time, display should convert to local timezone
6. **Migration**: Single file `supabase/migrations/20250429000000_complete_schema.sql`