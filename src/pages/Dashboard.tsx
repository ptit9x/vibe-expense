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
import { MonthlyChart, PullToRefreshWrapper } from '@/components/shared'
import { useUIStore } from '@/stores/uiStore'
import { useI18n, type Language } from '@/lib/i18n'
import { computeMonthlyData } from '@/lib/computeMonthlyData'
import type { Transaction } from '@/types'

const RECENT_TRANSACTIONS_LIMIT = 10

const LOCALE_MAP: Record<Language, string> = {
  vi: 'vi-VN',
  en: 'en-US',
}

function computeExpenseBreakdown(transactions: Transaction[], otherCategoryName: string): ExpenseItem[] {
  const expenses = transactions?.filter(t => t.type === 'expense') || []
  const breakdown: Record<string, ExpenseItem> = {}

  expenses.forEach(t => {
    const catName = t.category?.name || otherCategoryName
    const catColor = t.category?.color || '#6B7280'
    const catIcon = t.category?.icon || '💰'

    if (!breakdown[catName]) { // eslint-disable-line security/detect-object-injection
      breakdown[catName] = { name: catName, value: 0, color: catColor, icon: catIcon }
    }
    breakdown[catName].value += Number(t.amount) // eslint-disable-line security/detect-object-injection
  })

  return Object.values(breakdown)
}

export default function Dashboard() {
  const { data: user } = useAuth()
  const { showBalance, toggleBalance, currentMonth, currency, formatCurrency } = useUIStore()
  const { data: transactions, error: txError, refetch: refetchTransactions } = useTransactions(currentMonth)
  const { data: wallets, error: walletError, refetch: refetchWallets } = useWallets()
  const { t, language } = useI18n()

  if (txError || walletError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-2">{txError?.message || walletError?.message || t.common.error}</p>
          <Button onClick={async () => { await Promise.all([refetchTransactions(), refetchWallets()]) }}>
            {t.errors.tryAgain}
          </Button>
        </div>
      </div>
    )
  }

  const totalBalance = wallets?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0

  const recentTransactions: TransactionItem[] = (transactions || []).slice(0, RECENT_TRANSACTIONS_LIMIT) as TransactionItem[]
  const monthlyData = computeMonthlyData(transactions || [], 6, LOCALE_MAP[language])
  const expenseBreakdown = computeExpenseBreakdown(transactions || [], t.dashboard.otherCategory)

  const displayName = user?.full_name || user?.email?.split('@')[0] || t.dashboard.greeting.replace('!', '')

  return (
    <PullToRefreshWrapper
      className="min-h-screen bg-gray-50 pb-20"
      onRefresh={async () => { await Promise.all([refetchTransactions(), refetchWallets()]) }}
    >
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
                {currency.symbol}{formatCurrency(totalBalance)}
              </>
            ) : (
              <span className="text-gray-400">••••••••</span>
            )}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 space-y-4">
        <ExpenseAnalysis items={expenseBreakdown} />
        <MonthlyChart data={monthlyData} />
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
    </PullToRefreshWrapper>
  )
}
