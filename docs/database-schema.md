# Money Keeper Clone - Database Schema

**Version:** 1.1.0  
**Last Updated:** 2026-04-30

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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `id` | UUID | - | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | User ID - links to Supabase Auth |
| `email` | TEXT | - | NOT NULL | User email address |
| `full_name` | TEXT | NULL | - | User display name |
| `created_at` | TIMESTAMPTZ | `now()` | - | Profile creation timestamp |
| `updated_at` | TIMESTAMPTZ | `now()` | - | Last profile update timestamp |

### Row Level Security
```sql
-- SELECT: Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Triggers
```sql
-- Auto-create profile when user signs up via Supabase Auth
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
```

---

## 2. wallets

Wallet/Account table - stores user's financial accounts

```sql
CREATE TABLE public.wallets (
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
```

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `id` | UUID | `gen_random_uuid()` | PRIMARY KEY | Unique wallet identifier |
| `user_id` | UUID | - | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | Owner user ID |
| `name` | TEXT | - | NOT NULL | Wallet name (e.g., "Cash", "MB Bank", "Momo") |
| `type` | TEXT | - | NOT NULL, CHECK (cash, bank, e_wallet) | Wallet type category |
| `icon` | TEXT | `'💰'` | - | Emoji icon for display |
| `color` | TEXT | `'#3B82F6'` | - | Hex color code for UI theming |
| `initial_balance` | DECIMAL(15,2) | `0` | - | Starting balance when wallet was created |
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
-- ALL: Users can manage their own wallets
CREATE POLICY "Users can manage their own wallets" ON public.wallets
  FOR ALL USING (auth.uid() = user_id);
```

---

## 3. categories

Transaction categories - supports system defaults and custom user categories

```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#6B7280',
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `id` | UUID | `gen_random_uuid()` | PRIMARY KEY | Unique category identifier |
| `user_id` | UUID | NULL | REFERENCES profiles(id) ON DELETE CASCADE | Owner user ID (NULL = system default) |
| `name` | TEXT | - | NOT NULL | Category name |
| `type` | TEXT | - | NOT NULL, CHECK (income, expense) | Transaction type category |
| `icon` | TEXT | `'📦'` | - | Emoji icon for display |
| `color` | TEXT | `'#6B7280'` | - | Hex color code for UI |
| `parent_id` | UUID | NULL | REFERENCES categories(id) ON DELETE SET NULL | Parent category for sub-categories |
| `is_system` | BOOLEAN | `false` | - | TRUE = system default (cannot be deleted by users) |
| `created_at` | TIMESTAMPTZ | `now()` | - | Category creation timestamp |

### Category Types (Enum)
| Value | Description |
|-------|-------------|
| `income` | Categories for incoming money (salary, bonus, etc.) |
| `expense` | Categories for outgoing money (food, transport, etc.) |

### Row Level Security
```sql
-- SELECT: Anyone can view system categories
CREATE POLICY "Users can view system categories" ON public.categories
  FOR SELECT USING (user_id IS NULL);

-- ALL: Users can manage their own custom categories
CREATE POLICY "Users can manage their own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);
```

### System Categories (Pre-seeded)

**Expense Categories:**
| Name | Icon | Color | is_system |
|------|------|-------|-----------|
| 🍔 Ăn uống | 🍔 | #EF4444 | true |
| 🚗 Di chuyển | 🚗 | #F59E0B | true |
| 🛒 Mua sắm | 🛒 | #8B5CF6 | true |
| 🏠 Nhà cửa | 🏠 | #10B981 | true |
| 💊 Y tế | 💊 | #EC4899 | true |
| 🎮 Giải trí | 🎮 | #06B6D4 | true |
| 📚 Học tập | 📚 | #6366F1 | true |
| 💰 Khác | 💰 | #6B7280 | true |

**Income Categories:**
| Name | Icon | Color | is_system |
|------|------|-------|-----------|
| 💵 Lương | 💵 | #10B981 | true |
| 🎁 Thưởng | 🎁 | #F59E0B | true |
| 📈 Đầu tư | 📈 | #3B82F6 | true |
| 💼 Thêm thu nhập | 💼 | #8B5CF6 | true |

---

## 4. transactions

Transaction records - income and expense entries

```sql
CREATE TABLE public.transactions (
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
```

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `id` | UUID | `gen_random_uuid()` | PRIMARY KEY | Unique transaction identifier |
| `user_id` | UUID | - | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | Owner user ID |
| `wallet_id` | UUID | NULL | REFERENCES wallets(id) ON DELETE SET NULL | Target wallet (NULL = no wallet) |
| `category_id` | UUID | NULL | REFERENCES categories(id) ON DELETE SET NULL | Transaction category |
| `type` | TEXT | - | NOT NULL, CHECK (income, expense) | Income or expense |
| `amount` | DECIMAL(15,2) | - | NOT NULL, CHECK (amount > 0) | Transaction amount in VND |
| `description` | TEXT | NULL | - | Transaction note/memo |
| `transaction_date` | DATE | `CURRENT_DATE` | NOT NULL | Date of transaction |
| `created_at` | TIMESTAMPTZ | `now()` | - | Transaction creation timestamp |
| `updated_at` | TIMESTAMPTZ | `now()` | - | Last transaction update timestamp |

### Transaction Types (Enum)
| Value | Description |
|-------|-------------|
| `income` | Money received (salary, bonus, selling items) |
| `expense` | Money spent (food, transport, bills) |

### Indexes
```sql
-- For filtering transactions by user and date range
CREATE INDEX idx_transactions_user_date 
  ON public.transactions(user_id, transaction_date DESC);

-- For wallet balance calculations
CREATE INDEX idx_transactions_wallet 
  ON public.transactions(wallet_id);

-- For category reports
CREATE INDEX idx_transactions_category 
  ON public.transactions(category_id);
```

### Row Level Security
```sql
-- ALL: Users can manage their own transactions
CREATE POLICY "Users can manage their own transactions" ON public.transactions
  FOR ALL USING (auth.uid() = user_id);
```

---

## 5. budgets

Budget limits - spending limits per category

```sql
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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
| `user_id` | UUID | - | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | Owner user ID |
| `category_id` | UUID | - | NOT NULL, REFERENCES categories(id) ON DELETE CASCADE | Target category |
| `amount` | DECIMAL(15,2) | - | NOT NULL, CHECK (amount > 0) | Budget limit amount in VND |
| `period` | TEXT | - | NOT NULL, CHECK (monthly, weekly) | Budget reset period |
| `start_date` | DATE | - | NOT NULL | Budget period start date |
| `end_date` | DATE | NULL | - | Budget period end date (NULL = ongoing/no end) |
| `created_at` | TIMESTAMPTZ | `now()` | - | Budget creation timestamp |

### Budget Periods (Enum)
| Value | Description |
|-------|-------------|
| `monthly` | Budget resets at the start of each month |
| `weekly` | Budget resets at the start of each week (Monday) |

### Indexes
```sql
-- For listing user's budgets
CREATE INDEX idx_budgets_user 
  ON public.budgets(user_id);
```

### Row Level Security
```sql
-- ALL: Users can manage their own budgets
CREATE POLICY "Users can manage their own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);
```

---

## 6. savings_goals

Savings goals - target amounts that users want to save

```sql
CREATE TABLE public.savings_goals (
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
```

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `id` | UUID | `gen_random_uuid()` | PRIMARY KEY | Unique savings goal identifier |
| `user_id` | UUID | - | NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE | Owner user ID |
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
-- ALL: Users can manage their own savings goals
CREATE POLICY "Users can manage their own savings goals" ON public.savings_goals
  FOR ALL USING (auth.uid() = user_id);
```

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
    └── profiles (1:1)
            │
            ├── wallets (1:N) ──────────────── transactions (N:1)
            │                                    │
            ├── categories (1:N) ──── budgets (1:N)
            │                                    │
            ├── transactions (1:N)               │
            │       │                            │
            │       └─── wallets (N:1)           │
            │                                    │
            ├── budgets (1:N) ───────────────────┘
            │
            └── savings_goals (1:N)
```

---

## Changelog

### v1.1.0 (2026-04-30)
- **Removed:** `avatar_url` column from `profiles` table
- Updated profile schema to focus on essential user data

### v1.0.0 (2026-04-29)
- Initial schema design
- All tables: profiles, wallets, categories, transactions, budgets, savings_goals
- Row Level Security (RLS) policies
- System categories pre-seeded
- Helper functions for balance calculations and reports

---

## Notes

1. **Cascade Delete**: When a user is deleted, all their wallets, transactions, budgets, and savings goals are also deleted
2. **Set Null**: When a wallet or category is deleted, transactions keep their wallet_id/category_id as NULL
3. **System Categories**: Have `user_id = NULL` and `is_system = true` - cannot be deleted by users
4. **RLS**: All tables have Row Level Security - users can only access their own data
5. **Timestamps**: All TIMESTAMPTZ fields store UTC time, display should convert to local timezone