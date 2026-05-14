import { useWallets } from '@/hooks/useWallets'
import { useTransactions } from '@/hooks/useTransactions'
import {
  BalanceOverview,
  QuickActions,
  DebtTracker,
} from '@/components/reports'
import { MonthlyChart, PullToRefreshWrapper } from '@/components/shared'
import { computeMonthlyData } from '@/lib/computeMonthlyData'
import { useUIStore } from '@/stores/uiStore'
import type { Transaction } from '@/types'

export default function Reports() {
  const { showBalance, toggleBalance, currentMonth } = useUIStore()
  const { data: wallets, refetch: refetchWallets } = useWallets()
  const { data: transactions, refetch: refetchTransactions } = useTransactions(currentMonth)

  const totalBalance = wallets?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0

  // Tính nợ thực tế: tiền đi vay (borrow) - tiền cho vay (lend)
  // debt > 0 nghĩa là đang nợ người khác
  const debt = (transactions ?? [])
    .filter((t: Transaction) => t.type === 'borrow')
    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)
    -
    (transactions ?? [])
    .filter((t: Transaction) => t.type === 'lend')
    .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0)

  const monthlyData = computeMonthlyData(transactions ?? [], 6)

  return (
    <PullToRefreshWrapper
      className="min-h-screen bg-gray-50 pb-20"
      onRefresh={async () => { await Promise.all([refetchTransactions(), refetchWallets()]) }}
    >
      <BalanceOverview
        balance={totalBalance}
        debt={Math.max(debt, 0)}
        showBalance={showBalance}
        onToggleBalance={toggleBalance}
      />

      <DebtTracker transactions={transactions ?? []} />

      <MonthlyChart data={monthlyData} />

      <QuickActions />
    </PullToRefreshWrapper>
  )
}
