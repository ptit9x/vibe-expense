# Money Keeper Clone - Database Schema

**Version:** 1.3.0  
**Last Updated:** 2026-05-04

---

## Table of Contents
1. [profiles](#1-profiles)
2. [wallets](#2-wallets)
3. [categories](#3-categories)
4. [user_categories](#4-user_categories)
5. [transactions](#5-transactions)
6. [budgets](#6-budgets)
7. [savings_goals](#7-savings_goals)

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
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- INSERT: Required for trigger to work
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Triggers
```sql
-- Auto-create profile when user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.user_metadata->>'full_name')
  );
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

**Note:** FK references `auth.users(id)` directly instead of `profiles(id)`

```sql
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
| `user_id` | UUID | - | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Owner user ID |
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
CREATE POLICY "wallets_select" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wallets_insert" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wallets_update" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "wallets_delete" ON public.wallets
  FOR DELETE USING (auth.uid() = user_id);
```

### Triggers
```sql
-- Auto-create default Cash wallet when profile is created
CREATE OR REPLACE FUNCTION public.handle_profile_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, name, type, icon, color, initial_balance)
  VALUES (NEW.id, 'Cash', 'cash', '💵', '#3B82F6', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_created();

-- Auto-set user_id from auth.uid() for wallet inserts
CREATE OR REPLACE FUNCTION public.handle_wallet_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_wallet_user_id
  BEFORE INSERT ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.handle_wallet_user_id();
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
  FOR SELECT USING (
    user_id IS NULL OR auth.uid() = user_id
  );

-- INSERT: Only auth.uid() = user_id (user creates their own category)
CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only user's own categories
CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Only user's own categories (cannot delete system categories)
CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);
```

### System Categories (Pre-seeded)

**Expense Categories:**
| Name | Icon | Color |
|------|------|-------|
| 🍔 Ăn uống | 🍔 | #EF4444 |
| ⚡ Dịch vụ sinh hoạt | ⚡ | #F59E0B |
| 🚗 Đi lại | 🚗 | #3B82F6 |
| 💄 Trang phục & Mỹ phẩm | 💄 | #EC4899 |
| 💊 Sức khỏe | 💊 | #10B981 |
| 📚 Giáo dục | 📚 | #6366F1 |
| 🎮 Hưởng thụ | 🎮 | #8B5CF6 |
| 🤝 Giao lưu & Quan hệ | 🤝 | #F43F5E |
| 👶 Con cái | 👶 | #06B6D4 |
| 🏠 Nhà cửa | 🏠 | #6B7280 |
| 📦 Chi tiêu khác | 📦 | #95A5A6 |

**Income Categories:**
| Name | Icon | Color |
|------|------|-------|
| 💰 Lương | 💰 | #2ECC71 |
| 🎁 Quà tặng | 🎁 | #9B59B6 |
| 📈 Đầu tư | 📈 | #3498DB |

---

## 4. user_categories

User-specific category customizations (name, icon, color overrides)

```sql
CREATE TABLE public.user_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  custom_name TEXT,
  custom_icon TEXT,
  custom_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);
```

| Field | Type | Default | Constraints | Description |
|-------|------|---------|-------------|-------------|
| `id` | UUID | `gen_random_uuid()` | PRIMARY KEY | Unique identifier |
| `user_id` | UUID | - | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Owner user ID |
| `category_id` | UUID | - | NOT NULL, REFERENCES categories(id) ON DELETE CASCADE | Category being customized |
| `custom_name` | TEXT | NULL | - | Custom name override |
| `custom_icon` | TEXT | NULL | - | Custom icon override |
| `custom_color` | TEXT | NULL | - | Custom color override |
| `created_at` | TIMESTAMPTZ | `now()` | - | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | `now()` | - | Last update timestamp |

### Row Level Security
```sql
CREATE POLICY "user_categories_select" ON public.user_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_categories_insert" ON public.user_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_categories_update" ON public.user_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_categories_delete" ON public.user_categories
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 5. transactions

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
CREATE POLICY "transactions_select" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "transactions_delete" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);
```

### Indexes
```sql
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
```

---

## 6. budgets

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

### Row Level Security
```sql
CREATE POLICY "budgets_select" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "budgets_insert" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_update" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "budgets_delete" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);
```

### Budget Periods (Enum)
| Value | Description |
|-------|-------------|
| `monthly` | Budget resets at the start of each month |
| `weekly` | Budget resets at the start of each week (Monday) |

---

## 7. savings_goals

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
CREATE POLICY "savings_goals_select" ON public.savings_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "savings_goals_insert" ON public.savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "savings_goals_update" ON public.savings_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "savings_goals_delete" ON public.savings_goals
  FOR DELETE USING (auth.uid() = user_id);
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
            │        │
            │        └─── user_categories (1:N) ──── categories (N:1) -- self-reference
            │                                    │
            ├── transactions (1:N)               │
            │       │                            │
            │       └─── wallets (N:1)            │
            │                                    │
            ├── budgets (1:N) ──────────────────┘
            │
            └── savings_goals (1:N)
```

---

## Key Design Decisions

### 1. User ID References auth.users directly
All tables that need user_id reference `auth.users(id)` instead of `profiles(id)`. This simplifies the trigger chain: `auth.users` → `profiles` → `wallets`.

### 2. Categories: System vs User
- **System categories**: `user_id = NULL`, `is_system = true` - visible to all users, not editable
- **User categories**: `user_id = auth.uid()`, `is_system = false` - visible/editable only by owner

### 3. Category Customization via user_categories
Instead of updating system categories directly, users customize via `user_categories` table which stores overrides (custom_name, custom_icon, custom_color).

### 4. First-time Login Seeding
When a user logs in for the first time, `seedUserCategories()` is called to create `user_categories` entries for all system categories. This allows users to customize system categories without affecting the originals.

---

## Changelog

### v1.3.0 (2026-05-04)
- **Updated:** `wallets.user_id` now references `auth.users(id)` directly instead of `profiles(id)`
- **Added:** `user_categories` table for per-user category customizations
- **Added:** `i18n_key` column to `categories` for translated labels
- **Updated:** Categories RLS - SELECT allows system + owner, INSERT/UPDATE/DELETE owner only

### v1.2.0 (2026-05-04)
- **Removed:** `avatar_url` column from `profiles` table

### v1.1.0 (2026-04-30)
- **Removed:** `avatar_url` column from `profiles` table

### v1.0.0 (2026-04-29)
- Initial schema design
- All tables: profiles, wallets, categories, transactions, budgets, savings_goals

---

## Notes

1. **Cascade Delete**: When a user is deleted, all related data is also deleted
2. **Set Null**: When a wallet or category is deleted, transactions keep their references as NULL
3. **System Categories**: Have `user_id = NULL` and `is_system = true` - cannot be deleted by users
4. **RLS**: All tables have Row Level Security - users can only access their own data
5. **Timestamps**: All TIMESTAMPTZ fields store UTC time, display should convert to local timezone