// ===== Base Types =====

export type UUID = string
export type DateString = string

// ===== Enums =====

export type TransactionType = 'income' | 'expense' | 'lend' | 'borrow' | 'transfer'
export type WalletType = 'cash' | 'bank' | 'e_wallet'
export type BudgetPeriod = 'monthly' | 'weekly'

// ===== Database Entities =====

export interface Wallet {
  id: UUID
  user_id: UUID
  name: string
  type: WalletType
  icon: string
  color: string
  initial_balance: number
  is_active: boolean  // false = deactivated, hidden from selection but kept for history
  created_at: DateString
  updated_at: DateString
  // Computed
  balance?: number
}

export interface Category {
  id: UUID
  user_id: UUID | null  // null = system default
  name: string
  type: TransactionType
  icon: string
  color: string
  slug?: string          // stable identifier for system categories (e.g. 'lend', 'borrow')
  parent_id: UUID | null
  is_system: boolean
  created_at: DateString
}

export interface Transaction {
  id: UUID
  user_id: UUID
  wallet_id: UUID | null
  to_wallet_id: UUID | null  // Transfer destination wallet
  category_id: UUID | null
  type: TransactionType
  amount: number
  description: string | null
  contact_person: string | null
  transaction_date: DateString
  created_at: DateString
  updated_at: DateString
  // Relations
  wallet?: Wallet
  to_wallet?: Wallet
  category?: Category
}

export interface Budget {
  id: UUID
  user_id: UUID
  category_id: UUID
  amount: number
  period: BudgetPeriod
  start_date: DateString
  end_date: DateString | null
  created_at: DateString
  // Relations
  categories?: Category
}

export interface SavingsGoal {
  id: UUID
  user_id: UUID
  name: string
  target_amount: number
  current_amount: number
  deadline: DateString | null
  icon: string
  color: string
  created_at: DateString
  updated_at: DateString
}

// ===== API Request/Response Types =====

export interface CreateTransactionInput {
  wallet_id?: UUID
  to_wallet_id?: UUID
  category_id?: UUID
  type: TransactionType
  amount: number
  description?: string
  contact_person?: string
  transaction_date: DateString
}

export interface UpdateTransactionInput extends Partial<CreateTransactionInput> {
  id: UUID
}

export interface CreateWalletInput {
  name: string
  type: WalletType
  icon?: string
  color?: string
  initial_balance?: number
}

export interface UpdateWalletInput extends Partial<CreateWalletInput> {
  id: UUID
}

export interface CreateCategoryInput {
  name: string
  type: TransactionType
  icon?: string
  color?: string
  parent_id?: UUID
}

export interface CreateBudgetInput {
  category_id: UUID
  amount: number
  period: BudgetPeriod
  start_date: DateString
  end_date?: DateString
}

export interface UpdateBudgetInput extends Partial<CreateBudgetInput> {
  id: UUID
}

export interface CreateSavingsGoalInput {
  name: string
  target_amount: number
  deadline?: DateString
  icon?: string
  color?: string
}

export interface UpdateSavingsGoalInput extends Partial<CreateSavingsGoalInput> {
  id: UUID
}

// ===== Dashboard Types =====

export interface MonthlyReport {
  month: string  // YYYY-MM
  total_income: number
  total_expense: number
  net_balance: number
  by_category: {
    category_id: UUID
    category_name: string
    category_icon: string
    category_color: string
    total: number
    count: number
  }[]
}

export interface CategorySummary {
  category_id: UUID
  category_name: string
  category_icon: string
  category_color: string
  total: number
  percentage: number
  count: number
}

// ===== Auth Types =====

export interface AuthUser {
  id: UUID
  email: string
  full_name: string | null
  avatar_url: string | null
  confirmed: boolean  // email confirmed flag
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  full_name: string
}

export interface AuthResponse {
  user: AuthUser
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

// ===== Financial Health Report =====

export type ReportPeriod = 'weekly' | 'monthly'
export type HealthGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'

export interface FinancialHealthMetrics {
  totalIncome: number
  totalExpense: number
  totalDebt: number       // borrow - lend (positive = owing)
  totalLent: number       // money lent to others
  totalAssets: number     // sum of all active wallet balances
  netWorth: number        // totalAssets - totalDebt
  assetToDebtRatio: number // totalAssets / totalDebt * 100 (0 if no debt)
  savingsRate: number     // (income - expense) / income * 100
  expenseToIncomeRatio: number  // expense / income * 100
  debtToIncomeRatio: number     // debt / income * 100
  spendingTrend: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data'
  topExpenseCategories: CategorySummary[]
  budgetUsage: { category_name: string; spent: number; budget: number; percentage: number }[]
  savingsGoalProgress: { name: string; target: number; current: number; percentage: number }[]
  monthlyExpenseComparison: { month: string; total: number }[]
}

export interface AIAnalysis {
  overall_score: number   // 0-100
  grade: HealthGrade
  summary: string
  insights: { icon: string; title: string; description: string; severity: 'positive' | 'neutral' | 'negative' }[]
  recommendations: { icon: string; title: string; description: string; priority: 'high' | 'medium' | 'low' }[]
  risk_flags: { title: string; description: string; severity: 'warning' | 'danger' }[]
}

export interface FinancialReport {
  id: UUID
  user_id: UUID
  period_type: ReportPeriod
  period_start: DateString
  period_end: DateString
  health_data: FinancialHealthMetrics
  ai_analysis: AIAnalysis
  overall_score: number
  grade: HealthGrade
  created_at: DateString
}

// ===== In-App Notifications =====

export type NotificationType = 'info' | 'warning' | 'success' | 'budget_alert' | 'debt_reminder' | 'inactivity_reminder' | 'financial_health'

export interface AppNotification {
  id: UUID
  user_id: UUID
  title: string
  body: string
  type: NotificationType
  is_read: boolean
  link_url: string | null
  created_at: DateString
}