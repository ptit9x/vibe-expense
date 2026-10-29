import { useMemo } from 'react'
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { MonthlyChart, PullToRefreshWrapper, PageTransition } from '@/components/shared'
import PageHeader from '@/components/PageHeader'
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
  const showBalance = useUIStore((s) => s.showBalance)
  const toggleBalance = useUIStore((s) => s.toggleBalance)
  const currentMonth = useUIStore((s) => s.currentMonth)
  const setCurrentMonth = useUIStore((s) => s.setCurrentMonth)
  const currency = useUIStore((s) => s.currency)
  const formatCurrency = useUIStore((s) => s.formatCurrency)
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
  const monthLabel = useMemo(() => {
    const [y, m] = currentMonth.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString(getLocale(language), { month: 'long', year: 'numeric' })
  }, [currentMonth, language])

  if (txError || walletError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-2">{txError?.message || walletError?.message || t.common.error}</p>
          <Button onClick={async () => { await Promise.all([refetchTransactions(), refetchWallets()]) }}>
            {t.errors.tryAgain}
          </Button>
        </div>
      </div>
    )
  }

  const shiftMonth = (delta: number) => {
    const [y, m] = currentMonth.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const isCurrentCalendarMonth = currentMonth === new Date().toISOString().slice(0, 7)

  // Recent: prefer current month, fall back to latest overall so a new month isn't empty
  const recentTransactions: TransactionItem[] = (currentMonthTxns.length > 0 ? currentMonthTxns : allTxns).slice(0, RECENT_TRANSACTIONS_LIMIT) as TransactionItem[]

  const displayName = user?.full_name || user?.email?.split('@')[0] || ''

  return (
    <PageTransition>
    <PullToRefreshWrapper
      className="min-h-screen bg-background pb-20"
      onRefresh={async () => { await Promise.all([refetchTransactions(), refetchWallets()]) }}
    >
      {/* Header - Greeting with User Name */}
      <PageHeader className="px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-2xl font-bold tracking-tight">{displayName ? `${t.dashboard.greeting} ${displayName}` : t.dashboard.greeting} 👋</h1>
          <NotificationBell />
        </div>

        {/* Balance Card */}
        <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-5 shadow-lg border border-white/25">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/70 text-sm font-medium">{t.dashboard.totalBalance}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30"
              onClick={toggleBalance}
              aria-label={showBalance ? t.dashboard.hideBalance : t.dashboard.showBalance}
              aria-pressed={showBalance}
            >
              {showBalance ? (
                <Eye className="h-4 w-4 text-white/70" />
              ) : (
                <EyeOff className="h-4 w-4 text-white/70" />
              )}
            </Button>
          </div>
          <p className="text-3xl font-bold text-white tracking-tight tabular-nums">
            {showBalance ? (
              <>
                {currency.symbol}{formatCurrency(totalBalance)}
              </>
            ) : (
              <span className="text-white/50">••••••••</span>
            )}
          </p>
        </div>
      </PageHeader>

      {/* Month switcher — previously dashboard was locked to store month with no UI */}
      <div className="px-4 -mt-4">
        <div className="clay-card flex items-center justify-between px-2 py-1.5 mb-4">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label={t.dashboard.prevMonth} className="tap-target flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 px-3"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" onClick={() => !isCurrentCalendarMonth && setCurrentMonth(new Date().toISOString().slice(0, 7))} className="text-sm font-semibold capitalize px-2 py-2" aria-label={isCurrentCalendarMonth ? monthLabel : t.dashboard.backToCurrentMonth}>{monthLabel}{!isCurrentCalendarMonth && <span className="block text-[11px] font-medium text-muted-foreground normal-case">{t.dashboard.backToCurrentMonth}</span>}</button>
          <button type="button" onClick={() => shiftMonth(1)} disabled={isCurrentCalendarMonth} aria-label={t.dashboard.nextMonth} className="tap-target flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 px-3 disabled:opacity-30"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        <SummaryCards totalBalance={totalBalance} income={income} expense={expense} showBalance={showBalance} />
        <ExpenseAnalysis items={expenseBreakdown} />
        <MonthlyChart data={monthlyData} />
        <RecentTransactions transactions={recentTransactions} />
      </div>

      {/* No duplicate FAB here — the bottom-nav centre + is the single primary action */}
    </PullToRefreshWrapper>
    </PageTransition>
  )
}
