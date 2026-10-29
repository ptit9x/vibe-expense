# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibe Expense is a personal finance management app (Money Keeper clone) targeting Vietnamese users. Mobile-first SPA with desktop sidebar support. Default language is Vietnamese (`vi`).

**Stack**: React 19 + Vite 8 + TypeScript 6 + TailwindCSS v4 + Supabase (PostgreSQL + Auth + Edge Functions)

**Context docs map:** this file is the primary AI context. `docs/project-docs.md` = long-form product/architecture doc, `docs/ui-ux-improvement-2026-10-29.md` = UI/UX Phase 1 audit + Phase 2 backlog, `README.md` = setup + overview. When code and docs disagree, code wins — fix the doc in the same change. Last context sync: 2026-10-30 (UI/UX Phase 1).

## Commands

```bash
npm run dev              # Start dev server (Vite, port 5173)
npm run build            # TypeScript check + production build
npm run lint             # ESLint with --fix (includes security plugin)
npm run preview          # Preview production build
npm run test             # Run tests (Vitest, jsdom environment)
npm run test:ui          # Vitest UI
npm run test:coverage    # Coverage report (80% threshold enforced)
npm run doctor           # React Doctor diagnostics
```

Run a single test: `npx vitest run src/path/to/file.test.ts`

## Architecture

### Provider Hierarchy (main.tsx)
`StrictMode > QueryClientProvider > ThemeProvider > I18nProvider > ErrorBoundary > Router > App`

### Routing (react-router-dom v7)
- **Auth routes** (`/login`, `/register`, `/forgot-password`, `/reset-password`) → `AuthLayout`
- **Standalone**: `/verify-email` (no layout wrapper)
- **App routes** (`/dashboard`, `/wallets`, `/transactions`, `/add-transaction`, `/edit-transaction/:id`, `/reports/*`, `/categories`, `/savings`, `/financial-health`, `/notifications`, `/settings/*`, `/profile`) → `MainLayout` (auth guard + email confirmation guard, bottom nav on mobile, `DesktopSidebar` on `lg:` breakpoint)
- All pages are lazy-loaded via `React.lazy()`
- SPA routing handled by `vercel.json` rewrite to `index.html`

### State Management Split
- **Zustand** (`src/stores/`) — client-only UI state only. Three stores:
  - `uiStore` — balance visibility toggle, current month, currency selection, `formatCurrency()` and `displayAmount()` helpers (currency persisted to localStorage)
  - `transactionFormStore` — transaction form draft state (add/edit mode, all fields, `reset()` on unmount)
  - `walletsStore` — wallet form visibility toggle
- **TanStack Query v5** (`src/hooks/`) — all server data. Every hook follows the pattern: `isSupabaseConfigured()` → mock fallback | `requireAuth()` → Supabase query. Invalidates related query keys on mutation success.

### Data Flow Pattern
Each data domain (transactions, wallets, categories, notifications, savings) follows:
1. Types in `src/types/index.ts`
2. Mock data in `src/mocks/` (one file per domain: `mockTransactions`, `mockWallets`, `mockCategories`, `mockSavings`, `mockAuth`)
3. TanStack Query hooks in `src/hooks/use*.ts` (queries + mutations)
4. Zustand store only if UI state is needed (form drafts, visibility toggles)
5. Components in `src/components/<feature>/` — each folder has an `index.ts` barrel export
6. Page in `src/pages/<Feature>.tsx` — thin composition, no business logic

### Mock Data Fallback
When `VITE_SUPABASE_URL` is missing or contains "placeholder" (dev only), the app uses mock data from `src/mocks/`. Gated by `isSupabaseConfigured()` and `isMockAuthAllowed()` in `src/lib/supabase.ts`. **Production always uses real Supabase** — `isSupabaseConfigured()` returns `true` when `import.meta.env.PROD`.

### Path Aliases
`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

### Component Library
shadcn/ui (new-york style, Radix primitives) in `src/components/ui/`. Custom shared components in `src/components/shared/` (AnimatedFAB, Avatar, EmptyState, PageTransition, PullToRefreshWrapper, SkeletonLoader, TransactionRow). Icons: Lucide React. Animations: Framer Motion.

### UI/UX Design System — Claymorphism (updated 2026-10-29, Phase 1)
Full audit + change log: `docs/ui-ux-improvement-2026-10-29.md`. Read it before changing UI.

- **Surfaces:** Claymorphism is the visual system — `clay-card`, `clay-button`, `clay-button-primary`, `clay-input`, `clay-fab`, `clay-navbar`, `clay-nav-active`, `clay-header`, `clay-icon`, `clay-inset`, `clay-badge` in `src/index.css`, driven by `--clay-*` / `--color-clay-*` tokens. Colour themes (indigo default, blue/green/orange/rose/violet, christmas) remap those tokens — do NOT hardcode a brand gradient in a component.
- **Semantic tokens first:** Use `--color-background/foreground/card/muted-foreground/primary/...` (Tailwind: `bg-background`, `text-muted-foreground`, …). Hardcoded `text-gray-*` / `bg-white` / `bg-gray-50` bypass the tokens and force brittle `.dark .bg-*` overrides in `index.css` (~150 lines) — Phase 2 backlog is removing them; do not add new ones.
- **NO global `*` transition:** `index.css` must never re-add `html * { transition: … }` (removed 2026-10-29 — it animated every element on every render: mobile jank/battery). Theme transition is scoped to `html, body` only.
- **Accessibility rules (enforced in Phase 1 components):** global `:focus-visible` ring in `index.css`; minimum tap target 44px (`.tap-target` helper; list rows 56px — `TransactionRow` is `min-h-[56px]`); `prefers-reduced-motion` is respected globally; toggle buttons need a correct `aria-label` + `aria-pressed`, nav links `aria-current="page"` when active. Muted text token is `hsl(220 12% 38%)` (light) for contrast — do not lighten it back.
- **Layout:** `MainLayout` content is centred: `<main>` is `w-full max-w-[880px] mx-auto` with `lg:pl-64` for the sidebar. Mobile bottom nav (5 items, centre `+` is the SINGLE primary add action) vs desktop sidebar are different IA — see Navigation below.
- **Card / Button defaults:** `CardHeader`/`CardContent` pad `p-4` on mobile, `p-6` from `sm:` — do not re-add uniform `p-6`. `Button` focus is `ring-ring` + offset (not `ring/20`). `PageHeader` uses ONE blurred glow layer (blur is GPU-expensive on mobile; do not stack `blur-3xl` layers).

### Navigation (MainLayout)
- **Mobile bottom nav (5):** Dashboard, Wallets, centre `+` → `/add-transaction` (clay FAB, the only primary FAB — Dashboard must NOT render its own `AnimatedFAB`, removed 2026-10-29), Reports, Profile (icon `CircleUserRound`, NOT `Menu`).
- **Desktop sidebar (`lg:`):** the same 5 items PLUS a “Quản lý” section (`desktopExtraItems` in `MainLayout.tsx`): Transactions, Budgets, Categories, Savings, Recurring, Financial Health. These features must stay reachable from the sidebar — do not hide them behind Profile again. Extra-item labels are currently hardcoded Vietnamese (app default `vi`); move them to i18n in Phase 2.

### Dashboard composition (Phase 1)
- Header: greeting + `NotificationBell` + total-balance card with eye toggle (44×44, `aria-label` = “Ẩn/Hiện số dư”).
- **Month switcher** directly under the header: ‹ / › chevrons drive `uiStore.currentMonth` via `setCurrentMonth` (`YYYY-MM`); forward is disabled at the current calendar month; tapping the label returns to the current month.
- `SummaryCards`: net-cashflow card FIRST (`income − expense`, + % of income) above the Income/Expense gradient cards (gradients are `emerald-500→600` / `rose-500→600` for white-text contrast — do not go back to `300→500`). `totalBalance` prop is accepted but currently unused there.
- `ExpenseAnalysis`: pie uses the category's OWN colour from the DB (`category.color`), palette `COLORS` is fallback only; interaction is `onMouseEnter` AND `onClick` (touch), and legend rows are buttons that set the active slice.
- Recent transactions: prefer the selected month, but fall back to the latest transactions overall when that month is empty (a new month must not look like an empty app).
- Hooks rule reminder: all hooks (incl. the month-label `useMemo`) must run BEFORE the `txError || walletError` early return.

### Add/Edit Transaction form (Phase 1)
- Container background is `bg-background` (was hardcoded `bg-gray-50`).
- `SaveButton` is STICKY (`sticky bottom-[calc(72px+safe-area)]`, `lg:bottom-4`) and uses `clay-button-primary`, `min-h-[52px]` — the save action must always be reachable without scrolling to the end of the form.

### Phase 2 additions (2026-10-30)
- **i18n:** Phase 1 labels are real translation keys — `nav.{manage,transactions,budgets,categories,savings,recurring,financialHealth}`, `dashboard.{netCashflow,ofIncome,prevMonth,nextMonth,backToCurrentMonth,hideBalance,showBalance}`, `transaction.{searchPlaceholder,noSearchResults,clearSearch}` (vi + en in `src/lib/i18n/translations.ts`). Add new UI text there, not as hardcoded strings.
- **Transactions search:** header search filters by description / category / wallet / to-wallet / contact_person, accent-insensitive (`normalizeVi` in `Transactions.tsx` — “an uong” matches “Ăn uống”). Loading = `SkeletonCard` ×2, empty/search-empty = `EmptyState` inside a clay card — reuse this pattern on other list pages.
- **Charts:** `MonthlyChart` tooltip keeps the series name and the legend shows period totals for income/expense. `ExpenseAnalysis` shows top 7 categories and groups the rest into `dashboard.otherCategory` (do not slice-and-drop the tail). Card headers use Lucide icons (`BarChart3`, `PieChart`, `History`), not emoji.
- **Quick amounts:** `AmountDisplay` renders quick-amount chips under the amount input (VND: 50k/100k/200k/500k/1tr; other currencies: 10/20/50/100/200) that SET the amount. Chips are `aria-pressed` toggle buttons.
- **Semantic colour cleanup (partial):** dashboard/shared core components (`ExpenseAnalysis`, `RecentTransactions`, `TransactionRow`, `EmptyState`, chart headers) now use `text-foreground` / `text-muted-foreground` / `bg-muted` instead of `text-gray-*`. Remaining hardcoded gray/white elsewhere is still Phase 2 backlog — migrate per-file, and only remove a `.dark` override from `index.css` once no component uses that class.

### Internationalization
Custom i18n in `src/lib/i18n/` — React context provider with `useI18n()` hook returning `{ language, setLanguage, t }`. Translations in `src/lib/i18n/translations.ts`. Default language: Vietnamese (`vi`). Categories in `src/constants/categories.ts` use i18n keys (`nameKey`, `subcategoryKeys`) resolved at render time.

### Build Chunking (vite.config.ts)
Manual chunks split vendor code: `vendor` (react/react-dom/react-router-dom), `charts` (recharts), `supabase`, `ui` (radix), `motion` (framer-motion), `heic2any`.

## Backend (Supabase)

### Database
- Migrations in `supabase/migrations/` — auto-deployed via GitHub Actions on push to `main` when `supabase/**` changes
- RLS (Row Level Security) on all tables — `auth.uid() = user_id` policies
- Monetary values: `DECIMAL(15,2)`
- `feedback` (in-app góp ý): insert-only từ Profile — replaces Google Form. RLS: chỉ INSERT policy (`auth.uid() = user_id`), không có SELECT/UPDATE/DELETE cho client; đọc qua Supabase dashboard. GRANT INSERT cho `authenticated`
- `access_logs` (access history): unique index `(user_id, device_type, browser, os, ip_address)` — same device+browser+IP never creates a duplicate row. `log_access(p_device_type, p_browser, p_os, p_ip, p_country, p_user_agent)` RPC upserts; only bumps `last_seen_at` and `login_count` (visits ≥10 minutes apart count once, so reloads/token refreshes don't inflate). **No DELETE policy by design — access history is immutable**
- DB triggers handle: profile creation on signup, default wallet creation

### Edge Functions
`supabase/functions/analyze-financial-health/` — Deno function that takes `FinancialHealthMetrics`, calls Gemini 3.5 Flash API (fallback: Gemini 2.5 Flash) for AI financial analysis. Returns `AIAnalysis` JSON. All text in Vietnamese.

`supabase/functions/whoami/` — returns the caller's IP + country from proxy headers. Used by access-history tracking to identify devices. JWT required, no secrets involved.

### Access History (client flow)
1. `src/lib/accessLog.ts` — `parseUserAgent()` (ua-parser-js) → device/browser/OS; `getClientInfo()` → IP via `whoami` edge fn (cached per page load); `logAccessOnce()` throttled 10 min via sessionStorage
2. `useAccessTracker()` (mounted in App) logs on `INITIAL_SESSION`/`SIGNED_IN`; RPC `log_access` returns row id → stored in localStorage as "current device" marker
3. `useAccessLogs()` query → page `/settings/access-history` (Profile menu) shows devices with current-device badge. Mock fallback: `src/mocks/mockAccessLogs.ts`

### Local Scoring Fallback
`src/lib/financialHealth.ts` — pure functions (no side effects, no API calls) that compute health metrics and generate analysis locally when the AI edge function is unavailable.

**Financial Health Metrics include:**
- `totalIncome`, `totalExpense`, `totalDebt`, `totalLent` — transaction sums
- `totalAssets` — sum of all active wallet balances
- `netWorth` — totalAssets minus totalDebt
- `assetToDebtRatio` — totalAssets / totalDebt * 100 (0 if no debt)
- `savingsRate` — (income - expense) / income * 100
- `expenseToIncomeRatio`, `debtToIncomeRatio` — percentage ratios
- `spendingTrend` — increasing/decreasing/stable/insufficient_data (last 3 months)

**Local scoring (computeLocalScore)** — base 50, max 100:
- Savings rate: ±25 (≥30% → +25, negative → -15)
- Debt ratio: ±15 (0 debt → +10, >30% → -15)
- Expense/income: ±10 (≤50% → +10, >90% → -10)
- Spending trend: ±5 (decreasing → +5, increasing → -5)
- Asset strength: ±10 (no debt + positive assets → +10, negative net worth → -10)

## Key Types (src/types/index.ts)
- `TransactionType`: `'income' | 'expense' | 'lend' | 'borrow' | 'transfer'`
- `WalletType`: `'cash' | 'bank' | 'e_wallet'`
- `BudgetPeriod`: `'monthly' | 'weekly'`
- `NotificationType`: `'info' | 'warning' | 'success' | 'budget_alert' | 'debt_reminder' | 'inactivity_reminder' | 'financial_health'`
- `DeviceType`: `'mobile' | 'tablet' | 'desktop' | 'unknown'`; `AccessLog`: access history row (device_type, browser, os, ip_address, country, first_seen_at, last_seen_at, login_count)
- Transaction relations: `wallet`, `to_wallet` (for transfers), `category` — fetched via Supabase joins using foreign key aliases in select string (see `TRANSACTION_SELECT` in hooks)

## Wallet Balance Computation
Balances are computed **client-side** in `useWallets` hook — batches all transactions for user's wallets in two queries (source wallets + transfer destinations), applies type-based +/- logic (`income`/`borrow` → +, `expense`/`lend`/`transfer` → -), adds `initial_balance`. Not stored in DB.

## Hook Query Key Conventions
- `['auth']` — current user session
- `['transactions', month?, walletId?]` or `['transactions', 'year', year, type?]` — transaction lists
- `['transaction', id]` — single transaction
- `['wallets', includeInactive?]` — wallet list
- `['appNotifications']` — notification list
- `['accessLogs']` — access history (devices/browsers/IP, ordered by last_seen_at)
- `['dashboard']` — dashboard aggregated data
Mutations invalidate all related keys on success (e.g., transaction mutations invalidate `['transactions']`, `['wallets']`, `['dashboard']`).

## Security
- ESLint security plugin enabled (`eslint-plugin-security`)
- CSP headers in `vercel.json` (strict: self-only scripts, specific `connect-src` for Supabase + GitHub API)
- Security headers: X-Frame-Options DENY, HSTS, nosniff, Referrer-Policy, Permissions-Policy
- Supabase anon key is public by design; all protection via RLS
- `requireAuth()` used in every hook before data access
- Auth state changes (`SIGNED_OUT`) clear the entire TanStack Query cache via `queryClient.clear()`

## Deployment
- **Frontend**: Vercel (SPA rewrite in vercel.json)
- **Database/Edge Functions**: Supabase CLI via GitHub Actions (`.github/workflows/deploy-supabase.yml`)
- CI trigger khi `supabase/**` hoặc `.github/workflows/deploy-supabase.yml` thay đổi trên branch `main`
- Workflow deploy lần lượt 2 edge functions (`analyze-financial-health`, `whoami`) — **thêm function mới thì phải thêm lệnh deploy vào workflow**
- Required GitHub secrets: `SUPABASE_ACCESS_TOKEN`, `POSTGRES_PASSWORD`, `PROJECT_REF`
- Edge function secrets (Supabase dashboard): `GEMINI_API_KEY`

### Supabase Migration Rules (READ BEFORE WRITING MIGRATIONS)

⚠️ Mỗi lần migration lỗi = phải push thêm migration fix = mất thời gian. Phải tuân thủ các quy tắc sau:

#### 1. CHECK Constraint — Luôn cập nhật khi thêm enum value
Các bảng dùng CHECK constraint thay vì ENUM. Khi thêm giá trị mới vào `type`, **phải DROP và recreate constraint**:

```sql
-- ✅ ĐÚNG: Drop + recreate
ALTER TABLE public.app_notifications
  DROP CONSTRAINT IF EXISTS app_notifications_type_check;
ALTER TABLE public.app_notifications
  ADD CONSTRAINT app_notifications_type_check
  CHECK (type IN ('info', 'warning', 'success', 'budget_alert', 'debt_reminder', 'inactivity_reminder', 'financial_health'));
```

**Danh sách CHECK constraints hiện tại:**
- `transactions.type` → `'income' | 'expense' | 'lend' | 'borrow' | 'transfer'`
- `categories.type` → `'income' | 'expense'`
- `wallets.type` → `'cash' | 'bank' | 'e_wallet'`
- `budgets.period` → `'monthly' | 'weekly'`
- `financial_reports.period_type` → `'weekly' | 'monthly'`
- `app_notifications.type` → `'info' | 'warning' | 'success' | 'budget_alert' | 'debt_reminder' | 'inactivity_reminder' | 'financial_health'`

#### 2. Không select cột không tồn tại
- `wallets` bảng **KHÔNG CÓ cột `balance`** — chỉ có `initial_balance`
- Balance được tính **client-side** trong `useWallets` hook (xem section Wallet Balance Computation)
- Mọi chỗ fetch wallets phải dùng logic tương tự `useWallets.ts`, KHÔNG được select `balance`

#### 3. PostgreSQL Extension — Kiểm tra trước khi dùng
Mỗi extension phải được bật thủ công trên Supabase Dashboard trước khi push migration:
1. Dashboard → **Database** → **Extensions** → tìm và Enable
2. Hoặc SQL Editor: `CREATE EXTENSION IF NOT EXISTS pg_cron;`

**Known required extensions:**
- `pg_cron` — `20260520100000_inactivity_reminder_cron.sql` (Pro plan only. Migration đã guard bằng `IF EXISTS` nên Free plan không lỗi, chỉ skip schedule)

**Rule:** Nếu migration mới dùng extension, phải:
- Guard bằng `IF EXISTS` check để không crash nếu extension chưa bật
- Document vào danh sách trên
- Bật extension trên Supabase Dashboard **TRƯỚC** khi push

#### 4. Trigger không được insert data vi phạm constraint
Khi tạo trigger insert vào bảng khác (ví dụ: `financial_reports` trigger insert `app_notifications`):
- Kiểm tra `type` value có trong CHECK constraint của bảng đích chưa
- Nếu chưa → tạo migration thêm vào constraint **trước** migration tạo trigger

#### 5. Migration naming convention
Format: `YYYYMMDDHHMMSS_description.sql`
Ví dụ: `20260610000000_add_financial_health_notification_type.sql`

#### 6. Pre-push checklist
Trước khi `git push` lên `main`:
- [ ] Migration có dùng CHECK constraint mới? → đã DROP + ADD constraint đầy đủ?
- [ ] Migration có dùng extension? → đã bật trên Dashboard? → đã guard bằng IF EXISTS?
- [ ] Migration có tạo trigger insert vào bảng khác? → data có pass CHECK constraint bảng đích?
- [ ] Code có select cột `balance` từ `wallets`? → **KHÔNG** — phải tính client-side
- [ ] Edge function prompt có gửi đủ metrics mới? → cập nhật `buildPrompt()`

## Testing
- Vitest with jsdom environment, setup in `src/test/setup.ts` (imports `@testing-library/jest-dom/vitest`)
- Coverage thresholds: 80% on lines, functions, branches, statements
- Coverage includes `src/**/*.{ts,tsx}`, excludes test files and `src/main.tsx`
