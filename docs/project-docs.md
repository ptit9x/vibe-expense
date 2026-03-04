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

**Zustand Stores:**

```typescript
// src/stores/addTransactionStore.ts
type: TransactionType
amount: string
categoryId: string
walletId: string
description: string
date: string
showTypeDropdown: boolean

// src/stores/dashboardStore.ts
showBalance: boolean
currentMonth: string

// src/stores/walletsStore.ts
showForm: boolean
showBalance: boolean

// src/stores/reportsStore.ts
showBalance: boolean
currentMonth: string
```

### Component Structure

```
src/
├── pages/                      # Route pages (compositions only)
├── components/
│   ├── dashboard/              # Dashboard feature
│   │   ├── SummaryCards.tsx
│   │   ├── ExpenseAnalysis.tsx
│   │   ├── MonthlyChart.tsx
│   │   ├── RecentTransactions.tsx
│   │   └── QuickActions.tsx
│   ├── add-transaction/       # AddTransaction feature
│   │   ├── AmountDisplay.tsx
│   │   ├── CategorySelector.tsx
│   │   ├── WalletSelector.tsx
│   │   ├── TypeDropdown.tsx
│   │   └── SaveButton.tsx
│   ├── wallets/               # Wallets feature
│   │   ├── TotalBalanceCard.tsx
│   │   ├── WalletCard.tsx
│   │   ├── WalletList.tsx
│   │   ├── AddWalletModal.tsx
│   │   └── AddWalletFAB.tsx
│   └── reports/               # Reports feature
│       ├── BalanceOverview.tsx
│       ├── MonthlyChart.tsx
│       ├── QuickActions.tsx
│       ├── ReportComponents.tsx  # Shared components
│       └── index.ts
└── stores/                    # Zustand stores
```

### Principle: Pages compose components, don't contain logic

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
- Safe area padding for notched devices (`env(safe-area-inset-bottom)`)
- Horizontal scroll sections use `-mx-5 px-5` padding trick

## Pages & Routes

| Route | Page | Components | Store |
|-------|------|-----------|-------|
| `/dashboard` | Dashboard | SummaryCards, ExpenseAnalysis, MonthlyChart, RecentTransactions | dashboardStore |
| `/add-transaction` | AddTransaction | AmountDisplay, CategorySelector, WalletSelector, TypeDropdown, SaveButton | addTransactionStore |
| `/wallets` | Wallets | TotalBalanceCard, WalletCard, WalletList, AddWalletModal, AddWalletFAB | walletsStore |
| `/reports` | Reports | BalanceOverview, MonthlyChart, QuickActions | reportsStore |
| `/reports/expense` | ExpenseReport | StatCard, MonthlyBarChart, CategoryList, MonthlyList | - |
| `/reports/income` | IncomeReport | StatCard, MonthlyBarChart, CategoryList, MonthlyList | - |
| `/settings/language` | LanguageSettings | Language selector | - |
| `/settings/currency` | CurrencySettings | Currency selector | - |
| `/settings/password` | PasswordSettings | Change password form | - |
| `/settings/export` | ExportData | Export format options | - |
| `/budgets` | Profile | User info, stats, settings list | - |

### Footer Navigation

| Tab | Route | Label |
|-----|-------|-------|
| Home | /dashboard | Home |
| Account | /wallets | Account |
| Add | /add-transaction | Add (FAB) |
| Report | /reports | Report |
| Khác | /budgets | Profile |

## Environment Variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## GitHub Secrets (for schema deploy)

- `SUPABASE_ACCESS_TOKEN`
- `POSTGRES_PASSWORD`
- `PROJECT_REF`

## Code Quality

- **TypeScript**: Strict mode with `ignoreDeprecations: "6.0"`
- **No console.debug statements** in production code
- **No unused components** (dead code removed)
- **Build**: Passes with no TypeScript errors

See `docs/code-review.md` for detailed review report.
