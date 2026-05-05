import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTransactions } from '@/hooks/useTransactions'
import { useWallets } from '@/hooks/useWallets'
import { Button } from '@/components/ui/button'
import {
  ExpenseAnalysis,
  RecentTransactions,
  type ExpenseItem,
  type TransactionItem,
} from '@/components/dashboard'
import { MonthlyChart, type MonthlyData } from '@/components/shared'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'

const RECENT_TRANSACTIONS_LIMIT = 10

function useMonthlyData(transactions: any[]): MonthlyData[] {
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthKey = d.toISOString().slice(0, 7)
    const monthLabel = `T${d.getMonth() + 1}`

    const monthTransactions = transactions?.filter(t =>
      t.transaction_date?.startsWith(monthKey)
    ) || []

    const income = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

    months.push({ month: monthLabel, income, expense })
  }
  return months
}

function useExpenseBreakdown(transactions: any[]): ExpenseItem[] {
  const expenses = transactions?.filter(t => t.type === 'expense') || []
  const breakdown: Record<string, ExpenseItem> = {}

  expenses.forEach(t => {
    const catName = t.category?.name || 'Khác'
    const catColor = t.category?.color || '#6B7280'
    const catIcon = t.category?.icon || '💰'

    if (!breakdown[catName]) {
      breakdown[catName] = { name: catName, value: 0, color: catColor, icon: catIcon }
    }
    breakdown[catName].value += Number(t.amount)
  })

  return Object.values(breakdown)
}

export default function Dashboard() {
  const { data: user } = useAuth()
  const { showBalance, toggleBalance, currentMonth } = useUIStore()
  const { data: transactions } = useTransactions(currentMonth)
  const { data: wallets } = useWallets()
  const { t } = useI18n()

  const totalBalance = wallets?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0

  const recentTransactions: TransactionItem[] = (transactions || []).slice(0, RECENT_TRANSACTIONS_LIMIT) as TransactionItem[]
  const monthlyData = useMonthlyData(transactions || [])
  const expenseBreakdown = useExpenseBreakdown(transactions || [])

  const displayName = user?.full_name || user?.email?.split('@')[0] || t.dashboard.greeting.replace('!', '')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header - Greeting with User Name */}
      <div className="bg-blue-500 px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl font-medium">{t.dashboard.greeting} {displayName} 👋</h1>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30"
            onClick={toggleBalance}
            aria-label={showBalance ? t.dashboard.totalBalance : 'hidden'}
          >
            {showBalance ? (
              <Eye className="h-5 w-5 text-white" />
            ) : (
              <EyeOff className="h-5 w-5 text-white" />
            )}
          </Button>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <p className="text-gray-500 text-xs mb-1">{t.dashboard.totalBalance}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            {showBalance ? (
              <>
                {new Intl.NumberFormat('vi-VN').format(totalBalance)} <span className="text-base">đ</span>
              </>
            ) : (
              <span className="text-gray-400">••••••••</span>
            )}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 space-y-4">
        {/* Expense Analysis */}
        <ExpenseAnalysis items={expenseBreakdown} />

        {/* Monthly Chart */}
        <MonthlyChart data={monthlyData} />

        {/* Recent Transactions */}
        <RecentTransactions transactions={recentTransactions} />
      </div>

      {/* FAB */}
      <Link
        to="/add-transaction"
        className="fixed right-4 bottom-24 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors z-20"
        aria-label={t.transaction.add}
      >
        <span className="text-white text-2xl font-light">+</span>
      </Link>
    </div>
  )
}
