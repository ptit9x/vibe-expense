# Vibe Expense - Project Documentation

## Overview

Personal finance management app (Money Keeper Clone) with Vietnamese UI.

## Tech Stack

- **Frontend**: React 19 + Vite 8 + TypeScript 6 + TailwindCSS v4
- **Backend**: Supabase (PostgreSQL + Auth)
- **State**: TanStack Query v5 (server) + Zustand v5 (UI)

## Architecture

### State Management

| Type | Tool | Location |
|------|------|----------|
| Server State | TanStack Query | `src/hooks/` |
| UI State | Zustand | `src/stores/` |

### Zustand Stores

```typescript
// addTransactionStore - form state for add transaction
interface AddTransactionStore {
  type: 'income' | 'expense' | 'lend' | 'borrow' | 'transfer'
  amount: string
  categoryId: string
  walletId: string
  description: string
  date: string
  showTypeDropdown: boolean
  // actions
  setType, setAmount, setCategoryId, setWalletId, setDescription, toggleTypeDropdown, reset
}

// walletsStore - wallets UI state
interface WalletsStore {
  showForm: boolean      // show add wallet modal
  showBalance: boolean    // show/hide balance
  toggleForm, toggleBalance
}

// dashboardStore - dashboard UI state
interface DashboardStore {
  showBalance: boolean
  currentMonth: string
}

// reportsStore - reports UI state
interface ReportsStore {
  showBalance: boolean
  currentMonth: string
}
```

### Shared UI Components

| Component | Location | Description |
|-----------|----------|-------------|
| `BottomSheet` | `components/ui/bottom-sheet.tsx` | Reusable slide-up modal |
| `BottomSheetFormField` | `components/ui/bottom-sheet.tsx` | Label + children wrapper |
| `IconPicker` | `components/ui/bottom-sheet.tsx` | Grid of icon buttons |
| `ColorPicker` | `components/ui/bottom-sheet.tsx` | Grid of color buttons |
| `Button` | `components/ui/button.tsx` | shadcn/ui button |
| `Input` | `components/ui/input.tsx` | shadcn/ui input |

### BottomSheet Usage

```tsx
<BottomSheet
  isOpen={showModal}
  onClose={closeModal}
  title="Add Category"
  isPending={isPending}
  onSubmit={handleSubmit}
  submitDisabled={!formName.trim()}
  submitLabel="Save"
>
  <BottomSheetFormField label="Name">
    <Input value={name} onChange={(e) => setName(e.target.value)} />
  </BottomSheetFormField>
  <BottomSheetFormField label="Icon">
    <IconPicker value={icon} onChange={setIcon} options={ICON_OPTIONS} />
  </BottomSheetFormField>
  <BottomSheetFormField label="Color">
    <ColorPicker value={color} onChange={setColor} options={COLOR_OPTIONS} />
  </BottomSheetFormField>
</BottomSheet>
```

### Component Structure

```
src/
├── pages/                      # Route pages (compositions only)
├── components/
│   ├── dashboard/              # Dashboard feature
│   ├── add-transaction/       # AddTransaction feature
│   ├── wallets/               # Wallets feature
│   ├── reports/               # Reports feature
│   ├── ui/                    # shadcn/ui + custom components
│   │   ├── bottom-sheet.tsx   # Shared BottomSheet modal
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   └── ErrorBoundary.tsx
└── layouts/
    ├── AuthLayout.tsx
    └── MainLayout.tsx
```

**Principle:** Pages compose components, don't contain logic

## Authentication Flow

### Registration Flow (with DB triggers)

```
User signs up via Supabase Auth
      ↓
auth.users INSERT trigger → handle_new_user()
      ↓
profiles INSERT trigger → handle_profile_created()
      ↓
wallets INSERT trigger → on_profile_created creates default Cash wallet
      ↓
User logs in for first time → seedUserCategories() called
      ↓
user_categories entries created for all system categories
```

### Email Confirmation Flow

```
User signs up → Supabase sends confirmation email
      ↓
getUser() returns user with confirmed=false
      ↓
MainLayout detects !user.confirmed → Redirect to /verify-email
      ↓
User clicks link in email → email_confirmed_at set
      ↓
Next getUser() returns confirmed=true → Normal app flow
```

### Auth Guard Logic

| Condition | Behavior |
|-----------|----------|
| `user && user.confirmed` | Show main app |
| `user && !user.confirmed` | Redirect to `/verify-email` |
| `!user` | Redirect to `/login` |
| `isLoading` | Show loading spinner |

### Mock Auth (Development)

When Supabase is not configured (`VITE_SUPABASE_URL` contains "placeholder"):

```typescript
const MOCK_USERS = {
  'dev@example.com': { id: 'dev-user', email: 'dev@example.com', password: 'password', full_name: 'Dev User' },
}
```

## Categories System

### System vs User Categories

| Type | user_id | is_system | Visibility | Editable |
|------|---------|-----------|------------|----------|
| System | NULL | true | All users (read-only) | Via user_categories override |
| User | auth.uid() | false | Owner only | Full CRUD |

### Category Customization Flow

1. User customizes system category via edit modal
2. `useUpdateCategoryOverride` → INSERT/UPDATE `user_categories` table
3. Display shows `user_categories.custom_name/icon/color` if exists, else system default

### Category i18n

- DB stores name with emoji prefix (e.g., "🍔 Ăn uống")
- `i18n_key` column stores key (e.g., "categories.food")
- `extractI18nKey()` derives key from name for old records
- UI resolves i18n_key to translated label via translations.ts

## UI/UX Style Guide

### Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Primary | Blue-500 (#3B82F6) | Headers, buttons |
| Accent | Green-500 (#22C55E) | FAB, add buttons |
| Background | Gray-50 (#F9FAFB) | Page background |
| Cards | White (#FFFFFF) | Content sections |

### Components

- **Headers**: Blue gradient `from-blue-500 to-blue-600`
- **Balance Cards**: White with `rounded-xl` and `shadow-sm`
- **Scrollable Lists**: Horizontal scroll with `scrollbar-hide`
- **Modals**: Slide-up with `rounded-t-3xl` + handle bar
- **FAB Buttons**: Fixed `bottom-24`, `w-14 h-14`, `rounded-full`

### Mobile Patterns

- Bottom navigation bar with 5 tabs
- FAB for primary actions (add transaction, add wallet)
- Modal positioned `bottom-20` to avoid nav bar
- Safe area padding for notched devices

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Email + password login |
| `/register` | Register | Email + password + name registration |
| `/verify-email` | VerifyEmail | Email confirmation pending page |
| `/dashboard` | Dashboard | Main dashboard with balance, charts, recent transactions |
| `/add-transaction` | AddTransaction | Add new transaction form |
| `/edit-transaction/:id` | AddTransaction | Edit existing transaction |
| `/wallets` | Wallets | Wallet management |
| `/transactions` | Transactions | Full transaction list with filters |
| `/reports` | Reports | Balance overview + monthly chart |
| `/reports/expense` | ExpenseReport | Expense detail report |
| `/reports/income` | IncomeReport | Income detail report |
| `/categories` | Categories | Category management (system + custom) |
| `/savings` | Savings | Savings goals |
| `/profile` | Profile | User profile + settings menu |
| `/settings/language` | LanguageSettings | Language selector |
| `/settings/currency` | CurrencySettings | Currency selector |
| `/settings/password` | PasswordSettings | Change password |

### Footer Navigation

| Tab | Route | Label |
|-----|-------|-------|
| Home | /dashboard | Home |
| Account | /wallets | Account |
| Add | /add-transaction | Add (FAB) |
| Report | /reports | Report |
| Khác | /profile | Profile |

## Environment Variables

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
```

## Code Quality

- **TypeScript**: Strict mode with `ignoreDeprecations: "6.0"`
- **No console.debug statements** in production code
- **Build**: Passes with no TypeScript errors

## Error Handling

### ErrorBoundary Component

Located at `src/components/ErrorBoundary.tsx`. Catches React errors and displays friendly error UI with "Reload" button.

### Mutation Error Handling

All mutations have proper `onError` handlers with toast notifications:

```typescript
createTransaction.mutate(data, {
  onSuccess: () => { /* success */ },
  onError: (error) => toast.error(error.message)
})
```

## Form Validation

### AddTransaction

- Amount: Must be positive number, max 2 decimal places
- Wallet: Required
- Category: Optional

### Login/Register

- Email: Valid email format
- Password: Minimum 6 characters
- Full name (register): Required

## Toast Notifications

Position: `top-center` (configurable via sonner provider)

```tsx
// src/components/ui/sonner.tsx
<Sonner
  theme={theme}
  position="top-center"
  toastOptions={{
    classNames: {
      toast: "group toast group-[.toaster]:bg-background ...",
    },
  }}
/>
```

## API Coverage

All pages are connected to Supabase backend via TanStack Query hooks:

| Page | Hooks | Status |
|------|-------|--------|
| Dashboard | useTransactions, useWallets | ✅ Full API |
| Transactions | useTransactions | ✅ Full API |
| AddTransaction | useCategories, useCreateTransaction | ✅ Full API |
| Wallets | useWallets, useCreateWallet, useDeleteWallet | ✅ Full API |
| Categories | useCategories, useCreateCategory, useUpdateCategoryOverride, useDeleteCategoryOverride | ✅ Full API |
| Reports | useTransactions (computed locally) | ✅ Full API |
| ExpenseReport | useTransactions, useCategories | ✅ Full API |
| IncomeReport | useTransactions, useCategories | ✅ Full API |
| Savings | useSavings, useCreateSavingsGoal, useAddToSavings | ✅ Full API |
| Settings (Language, Currency, Export, Password) | Client-side only | N/A |
| Users | Mock data | N/A |

### useSavings Filter

Queries filter by authenticated user:

```typescript
const { data: { user } } = await supabase.auth.getUser()
const { data, error } = await supabase
  .from('savings_goals')
  .select('*')
  .eq('user_id', user.id)  // RLS enforces this
```

## Changelog

### v1.4.0 (2026-05-05)
- **Toast position**: Changed from `bottom` to `top-center`
- **Savings API**: Connected `handleAddGoal` to `useCreateSavingsGoal`
- **useSavings filter**: Added `.eq('user_id', user.id)` for proper user isolation
- **Category edit modal**: Auto-fills current name/icon/color on edit
- **Subcategory actions**: Added edit/delete buttons for subcategories in Categories page
- **Settings pages**: Language, Currency, Export, Password are client-side only (no API needed)
- **Users page**: Admin feature with mock data (not needed for personal finance app)

### v1.3.0 (2026-05-04)
- Added BottomSheet component for reusable modals
- Added user_categories table for category customizations
- Categories API now requires user_id for user categories
- System categories visible to all, user categories private