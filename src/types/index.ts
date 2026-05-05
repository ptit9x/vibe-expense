// ===== Base Types =====

export type UUID = string
export type DateString = string

// ===== Enums =====

export type TransactionType = 'income' | 'expense' | 'lend' | 'borrow' | 'transfer'
export type WalletType = 'cash' | 'bank' | 'e_wallet'
export type BudgetPeriod = 'monthly' | 'weekly'

// ===== Database Entities =====

export interface User {
  id: UUID
  email: string
  full_name: string | null
  created_at: DateString
  updated_at: DateString
}

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
  parent_id: UUID | null
  is_system: boolean
  created_at: DateString
}

export interface Transaction {
  id: UUID
  user_id: UUID
  wallet_id: UUID | null
  category_id: UUID | null
  type: TransactionType
  amount: number
  description: string | null
  transaction_date: DateString
  created_at: DateString
  updated_at: DateString
  // Relations
  wallet?: Wallet
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
  category_id?: UUID
  type: TransactionType
  amount: number
  description?: string
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