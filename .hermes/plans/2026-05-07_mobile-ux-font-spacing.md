# Plan: Cải thiện Mobile UX — Font & Spacing

## Mục tiêu
Tăng khả năng đọc và dễ thao tác trên mobile (375px) cho app vibe-expense:
- Font nhỏ → tăng lên (minimum 12px, nội dung chính 14-16px)
- Touch target nhỏ → đảm bảo ≥44px height
- iOS zoom issue → tất cả input phải ≥16px font
- Grid chật → responsive layout

## Tổng quan
- **~85 CSS class** cần sửa across **~20 files**
- **3 priority levels**: High (usability), Medium (UX), Low (polish)

---

## Phase 1: Global UI Components (High Priority)

### 1.1 `src/components/ui/input.tsx`
- `h-9` → `h-11` (44px touch target)
- Đảm bảo text trong input luôn `text-base` (16px) để tránh iOS zoom
- Xóa `md:text-sm` nếu có

### 1.2 `src/components/ui/button.tsx`
- `sm` variant: `h-8` → `h-10`, `text-xs` → `text-sm`

### 1.3 `src/components/ui/select.tsx`
- `h-9` → `h-11`, `text-sm` → `text-base`

### 1.4 `src/components/ui/bottom-sheet.tsx`
- Field label: `text-xs` → `text-sm`
- Emoji picker button: `w-8 h-8` → `w-11 h-11`
- Color picker button: `w-8 h-8` → `w-11 h-11`

---

## Phase 2: Dashboard — SummaryCards (High Priority)

### 2.1 `src/components/dashboard/SummaryCards.tsx`
- Grid: `grid-cols-4 gap-2` → `grid-cols-2 gap-3` (mobile) + `md:grid-cols-4` (desktop)
- Labels: `text-[10px]` → `text-xs` (minimum)
- Currency symbols: `text-[9px]` → `text-xs`
- Values: tăng lên `text-base` cho số tiền
- Card padding: `p-2` → `p-3`
- Line height: `leading-tight` → `leading-snug`

### 2.2 `src/components/dashboard/RecentTransactions.tsx`
- Button "See All": `h-7` → `h-9 min-w-[44px]`

### 2.3 `src/components/dashboard/ExpenseAnalysis.tsx`
- SVG text: `fontSize={12}` → `14`, `{11}` → `13`, `{10}` → `12`
- Legend: `text-xs` → `text-sm`
- Legend dots: `w-2.5 h-2.5` → `w-3 h-3`

---

## Phase 3: Wallet Cards (High Priority)

### 3.1 `src/components/wallets/WalletCard.tsx`
- Badge: `text-[10px]` → `text-xs`
- Type label: `text-xs` → `text-sm`
- Action buttons: `px-3 py-1.5 text-xs` → `px-4 py-2.5 text-sm` (44px touch)

### 3.2 `src/components/wallets/TotalBalanceCard.tsx`
- Label: `text-xs` → `text-sm`

### 3.3 `src/components/wallets/WalletList.tsx`
- Subtitle: `text-xs` → `text-sm`

### 3.4 `src/components/wallets/AddWalletModal.tsx`
- Type name: `text-xs` → `text-sm`

---

## Phase 4: Transactions (Medium Priority)

### 4.1 `src/components/shared/TransactionRow.tsx`
- Compact mode category: `text-xs` → `text-sm`
- Date label: `text-xs` → `text-sm`
- Amount (compact): `text-sm` → `text-base`

### 4.2 `src/components/shared/MonthlyChart.tsx`
- Legend labels: `text-xs` → `text-sm`
- Legend dots: `w-3 h-3` → `w-3.5 h-3.5`

### 4.3 `src/pages/Transactions.tsx`
- Filter buttons: `px-3 py-1.5 text-xs` → `px-4 py-2.5 text-sm`
- Close wallet filter: `p-0.5` → `p-2`
- "Showing last 12 months": `text-xs` → `text-sm`
- Monthly summary: `text-xs` → `text-sm`

---

## Phase 5: Categories (Medium Priority)

### 5.1 `src/pages/Categories.tsx`
- Badge: `text-[10px]` → `text-xs`
- Subcategory name: `text-sm` → `text-base`
- Action buttons: `p-2` → `p-2.5 min-w-[44px] min-h-[44px]`
- Chevron: `p-1.5` → `p-2.5`
- Sub edit/delete: `p-1.5` → `p-2.5`

---

## Phase 6: Forms & Auth Pages (Medium Priority)

### 6.1 Tất cả form labels (text-xs → text-sm):
- `src/pages/Login.tsx`
- `src/pages/Register.tsx`
- `src/pages/ResetPassword.tsx`
- `src/pages/PasswordSettings.tsx`
- `src/pages/ForgotPassword.tsx`

### 6.2 `src/pages/CurrencySettings.tsx`
- Description: `text-sm` → giữ nguyên

---

## Phase 7: Reports & Other (Medium Priority)

### 7.1 `src/components/reports/ReportComponents.tsx`
- StatCard label: `text-xs` → `text-sm`
- Category name/amount: `text-sm` → `text-base`
- Percentage: `text-xs` → `text-sm`
- Year nav buttons: `w-8 h-8` → `w-11 h-11`

### 7.2 `src/pages/Budgets.tsx`
- Labels: `text-xs` → `text-sm`

### 7.3 `src/pages/ExportData.tsx`
- Format descriptions: `text-xs` → `text-sm`

---

## Phase 8: Layout & Nav (Low Priority)

### 8.1 `src/layouts/MainLayout.tsx`
- Nav labels: `text-[10px]` → `text-xs`
- Nav height: `h-16 px-2` → `h-18 px-4`

---

## Validation
Sau mỗi phase:
1. `npm run build` — đảm bảo không lỗi
2. Kiểm tra visual trên Chrome DevTools mobile (375px iPhone SE)
3. Test touch targets thực tế trên device

## Files affected (~20):
- `src/components/ui/input.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/bottom-sheet.tsx`
- `src/components/dashboard/SummaryCards.tsx`
- `src/components/dashboard/RecentTransactions.tsx`
- `src/components/dashboard/ExpenseAnalysis.tsx`
- `src/components/wallets/WalletCard.tsx`
- `src/components/wallets/TotalBalanceCard.tsx`
- `src/components/wallets/WalletList.tsx`
- `src/components/wallets/AddWalletModal.tsx`
- `src/components/shared/TransactionRow.tsx`
- `src/components/shared/MonthlyChart.tsx`
- `src/components/reports/ReportComponents.tsx`
- `src/pages/Transactions.tsx`
- `src/pages/Categories.tsx`
- `src/pages/Budgets.tsx`
- `src/pages/ExportData.tsx`
- `src/pages/Login.tsx`, `Register.tsx`, `ResetPassword.tsx`, `PasswordSettings.tsx`, `ForgotPassword.tsx`
- `src/layouts/MainLayout.tsx`
