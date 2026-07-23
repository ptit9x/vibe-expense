import { useMemo } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTransactions } from '@/hooks/useTransactions'
import { useWallets } from '@/hooks/useWallets'
import { Button } from '@/components/ui/button'
import {
  SummaryCards,
  ExpenseAnalysis,
  RecentTransactions,
  type ExpenseItem,
  type TransactionItem,
} from '@/components/dashboard'
import { MonthlyChart, PullToRefreshWrapper, PageTransition, AnimatedFAB } from '@/components/shared'
import { NotificationBell } from '@/components/notifications'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { computeMonthlyData } from '@/lib/computeMonthlyData'
import type { Transaction } from '@/types'

const RECENT_TRANSACTIONS_LIMIT = 10

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
  // Fetch 12 months for chart + expense breakdown
  const { data: allTransactions, error: txError, refetch: refetchTransactions } = useTransactions(null)
  const { data: wallets, error: walletError, refetch: refetchWallets } = useWallets()
  const { t, language } = useI18n()

  const allTxns = useMemo(() => allTransactions || [], [allTransactions])
  const totalBalance = useMemo(() => wallets?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0, [wallets])
  const currentMonthTxns = useMemo(() => allTxns.filter(t => t.transaction_date?.startsWith(currentMonth)), [allTxns, currentMonth])
  const { income, expense } = useMemo(() => ({
    income: currentMonthTxns.filter(t => t.type === 'income' || t.type === 'borrow').reduce((s, t) => s + Number(t.amount), 0),
    expense: currentMonthTxns.filter(t => t.type === 'expense' || t.type === 'lend').reduce((s, t) => s + Number(t.amount), 0),
  }), [currentMonthTxns])
  const monthlyData = useMemo(() => computeMonthlyData(allTxns, 6, getLocale(language)), [allTxns, language])
  const expenseBreakdown = useMemo(() => computeExpenseBreakdown(currentMonthTxns, t.dashboard.otherCategory), [currentMonthTxns, t.dashboard.otherCategory])

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

  // Recent transactions from current month only
  const recentTransactions: TransactionItem[] = currentMonthTxns.slice(0, RECENT_TRANSACTIONS_LIMIT) as TransactionItem[]

  const displayName = user?.full_name || user?.email?.split('@')[0] || ''

  return (
    <PageTransition>
    <PullToRefreshWrapper
      className="min-h-screen bg-gray-50 pb-20"
      onRefresh={async () => { await Promise.all([refetchTransactions(), refetchWallets()]) }}
    >
      {/* Header - Greeting with User Name */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4 pt-6 pb-8">
        {/* Decorative blur circles */}
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-pink-300/20 rounded-full blur-2xl" />
        <div className="absolute top-10 right-20 w-16 h-16 bg-indigo-300/15 rounded-full blur-xl" />

        <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl font-medium">{displayName ? `${t.dashboard.greeting} ${displayName}` : t.dashboard.greeting} 👋</h1>
          <NotificationBell />
        </div>

        {/* Balance Card */}
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-5 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/80 text-xs font-medium">{t.dashboard.totalBalance}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full hover:bg-white/20"
              onClick={toggleBalance}
              aria-label={showBalance ? t.dashboard.totalBalance : 'hidden'}
            >
              {showBalance ? (
                <Eye className="h-4 w-4 text-white/70" />
              ) : (
                <EyeOff className="h-4 w-4 text-white/70" />
              )}
            </Button>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {showBalance ? (
              <>
                {currency.symbol}{formatCurrency(totalBalance)}
              </>
            ) : (
              <span className="text-white/50">••••••••</span>
            )}
          </p>
        </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 space-y-4">
        <SummaryCards totalBalance={totalBalance} income={income} expense={expense} showBalance={showBalance} />
        <ExpenseAnalysis items={expenseBreakdown} />
        <MonthlyChart data={monthlyData} />
        <RecentTransactions transactions={recentTransactions} />
      </div>

      {/* FAB */}
      <div className="fixed right-4 bottom-24 z-20">
        <AnimatedFAB to="/add-transaction" ariaLabel={t.transaction.add} />
      </div>
    </PullToRefreshWrapper>
    </PageTransition>
  )
}
