import { Loader2 } from 'lucide-react'
import { useWallets } from '@/hooks/useWallets'
import { useTransactions } from '@/hooks/useTransactions'
import {
  BalanceOverview,
  QuickActions,
  DebtTracker,
} from '@/components/reports'
import { PullToRefreshWrapper, PageTransition, MonthlyChart } from '@/components/shared'
import { computeMonthlyData } from '@/lib/computeMonthlyData'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'
import type { Transaction } from '@/types'

export default function Reports() {
  const { showBalance, toggleBalance, currentMonth } = useUIStore()
  const { t } = useI18n()
  const { data: wallets, isLoading: walletsLoading, error: walletsError, refetch: refetchWallets } = useWallets()
  const { data: transactions, isLoading: txLoading, error: txError, refetch: refetchTransactions } = useTransactions(currentMonth)

  const isLoading = walletsLoading || txLoading
  const error = walletsError || txError

  const totalBalance = wallets?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0

  const debt = (transactions ?? [])
    .filter((t: Transaction) => t.type === 'borrow')
    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)
    -
    (transactions ?? [])
    .filter((t: Transaction) => t.type === 'lend')
    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)

  const monthlyData = computeMonthlyData(transactions ?? [], 6)

  return (
    <PageTransition>
    <PullToRefreshWrapper
      className="min-h-screen bg-gray-50 pb-20"
      onRefresh={async () => { await Promise.all([refetchTransactions(), refetchWallets()]) }}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">{t.common.loading}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <p className="text-sm text-red-500 mb-3">{t.common.error}</p>
          <button
            onClick={() => { void refetchTransactions(); void refetchWallets() }}
            className="text-sm text-indigo-500 font-medium hover:text-indigo-600"
          >
            {t.common.retry || 'Retry'}
          </button>
        </div>
      ) : (
        <>
          <BalanceOverview
            balance={totalBalance}
            debt={Math.max(debt, 0)}
            showBalance={showBalance}
            onToggleBalance={toggleBalance}
          />

          <DebtTracker transactions={transactions ?? []} />

          <MonthlyChart data={monthlyData} />

          <QuickActions />
        </>
      )}
    </PullToRefreshWrapper>
    </PageTransition>
  )
}
