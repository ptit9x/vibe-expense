# UI/UX Improvement — Vibe Expense

Ngày: 2026-10-29 · Phase 1 đã code xong (chưa verify build — chạy `npm run build` trên Mac) · Phase 2: xem cuối file

## Bối cảnh

Audit đọc trực tiếp source: `src/index.css` (901 dòng), `App.tsx`, `layouts/MainLayout.tsx`, `pages/Dashboard.tsx`, `pages/Transactions.tsx`, `pages/Budgets.tsx`, dashboard components, `TransactionRow`, `TransactionForm` + add-transaction components, `ui/button|card|input`, `PageHeader`, `stores/uiStore.ts`, `CLAUDE.md`.

Điểm mạnh giữ nguyên: claymorphism nhất quán, mobile-first thật (bottom nav, pull-to-refresh, PWA, safe-area), lazy routes, TanStack Query / Zustand tách bạch.

## Vấn đề đã audit (Phase 1)

1. Performance: `html * { transition: … }` ép mọi element animate mỗi render; PageHeader chồng 3 lớp blur-3xl.
2. Dashboard: không có dòng tiền ròng; không có UI đổi tháng (tháng chỉ nằm trong uiStore); recent chỉ lấy tháng hiện tại nên đầu tháng trống; 2 FAB trùng nhau (bottom-nav + và AnimatedFAB riêng).
3. IA: desktop sidebar chỉ 5 mục như mobile — Budgets/Categories/Savings/Recurring/Financial Health/Transactions bị giấu sau Profile; icon Menu → Profile; main `max-w-3xl` không căn giữa.
4. Accessibility: nút mắt 32×32 + aria-label sai; thiếu :focus-visible; muted-foreground tương phản thấp; pie chỉ onMouseEnter và bỏ qua màu category trong DB.
5. Form: SaveButton ở cuối cuộn, gradient riêng lệch clay system; TransactionForm nền `bg-gray-50` cứng.
6. System: Card p-6 quá to cho mobile; hardcoded gray/white khiến index.css phải chứa ~150 dòng dark override.

## Phase 1 — Đã sửa (11 files)

| File | Thay đổi |
|---|---|
| `src/index.css` | Bỏ global * transition → chỉ html,body; :focus-visible toàn cục; .tap-target 44px; prefers-reduced-motion; muted-foreground 46%→38% |
| `src/layouts/MainLayout.tsx` | main căn giữa max-w-[880px] mx-auto; Profile icon CircleUserRound; bottom nav aria-current + hit 64×56; sidebar thêm section Quản lý (Giao dịch, Ngân sách, Danh mục, Tiết kiệm, Định kỳ, Sức khoẻ TC) |
| `src/pages/Dashboard.tsx` | Month switcher (setCurrentMonth, chặn tương lai, tap về tháng này); nút mắt 44px + aria-label/pressed đúng; bỏ AnimatedFAB trùng; recent fallback lịch sử mới nhất; hooks trước early return |
| `src/components/dashboard/SummaryCards.tsx` | Thẻ dòng tiền ròng + % thu nhập; gradient Thu/Chi 500→600 |
| `src/components/dashboard/ExpenseAnalysis.tsx` | Màu category thật từ DB; onClick cho touch; legend là button chọn slice |
| `src/components/shared/TransactionRow.tsx` | min-h 56px, hover/active feedback |
| `src/components/add-transaction/SaveButton.tsx` | Sticky trên bottom nav, clay-button-primary, min-h 52px |
| `src/components/add-transaction/TransactionForm.tsx` | bg-gray-50 → bg-background |
| `src/components/ui/button.tsx` | Focus ring ring + offset (thay ring/20) |
| `src/components/ui/card.tsx` | Padding p-4 mobile / p-6 sm+ |
| `src/components/PageHeader.tsx` | 3 lớp blur → 1 lớp blur-2xl |

Không đổi: routes, hooks, Supabase queries, i18n keys, store shape. Label mới hardcode vi (default lang) — Phase 2 chuyển i18n.

Verify: `npm run build` (chú ý type của motion.button trong ExpenseAnalysis) + `npm run dev`.

## Phase 2 — ĐÃ LÀM (2026-10-30, chưa verify build)

| Hạng mục | File | Chi tiết |
|---|---|---|
| i18n | `translations.ts`, `MainLayout`, `Dashboard`, `SummaryCards` | Keys mới nav.manage/transactions/budgets/categories/savings/recurring/financialHealth, dashboard.netCashflow/ofIncome/prevMonth/nextMonth/backToCurrentMonth/hideBalance/showBalance, transaction.searchPlaceholder/noSearchResults/clearSearch (vi+en); MainLayout dùng labelKey thay hardcode |
| Transactions search | `pages/Transactions.tsx` | Tìm theo ghi chú/danh mục/ví/ví đích/người liên hệ, không dấu (normalizeVi); loading = SkeletonCard×2, empty = EmptyState trong clay card |
| Charts | `MonthlyChart`, `ExpenseAnalysis` | Tooltip giữ tên series; legend MonthlyChart hiện tổng thu/chi kỳ; pie top 7 + gộp còn lại thành Khác (trước đây slice 8 và mất phần đuôi) |
| Quick amounts | `AmountDisplay` | Chips VND 50k/100k/200k/500k/1tr (tiền tệ khác 10/20/50/100/200), bấm là set số tiền, aria-pressed |
| Icons | `MonthlyChart`, `ExpenseAnalysis`, `RecentTransactions` | Emoji 📈📊📜 → Lucide BarChart3 / PieChart / History |
| Semantic tokens (một phần) | `ExpenseAnalysis`, `RecentTransactions`, `TransactionRow`, `EmptyState` | text-gray-* → text-foreground / text-muted-foreground, bg-gray-100 → bg-muted ở các chỗ đã chạm |

Còn lại (backlog): migrate gray/white ở các page còn lại rồi mới gỡ dark overrides trong index.css; category grid thay dropdown; group Transactions theo ngày; cân nhắc Christmas/Snowfall.

Verify cả Phase 1+2: `npm run build` + `npm run dev` (kiểm tra: đổi EN/VN ở nav Quản lý, search “an uong”, quick amounts, pie khi >8 danh mục).
