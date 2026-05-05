import { useWallets } from '@/hooks/useWallets'
import { useTransactions } from '@/hooks/useTransactions'
import {
  BalanceOverview,
  QuickActions,
} from '@/components/reports'
import { MonthlyChart } from '@/components/shared'
import { useUIStore } from '@/stores/uiStore'

export default function Reports() {
  const { showBalance, toggleBalance, currentMonth } = useUIStore()
  const { data: wallets } = useWallets()
  const { data: transactions } = useTransactions(currentMonth)

  const totalBalance = wallets?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0
  const debt = 0

  const generateMonthlyData = () => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthKey = d.toISOString().slice(0, 7)
      const monthLabel = `T${d.getMonth() + 1}`

      const monthTransactions = (transactions ?? []).filter((txn: any) => 
        txn.transaction_date?.startsWith(monthKey)
      ) || []

      const income = monthTransactions
        .filter((txn: any) => txn.type === 'income')
        .reduce((sum: number, txn: any) => sum + Number(txn.amount), 0)
      
      const expense = monthTransactions
        .filter((txn: any) => txn.type === 'expense')
        .reduce((sum: number, txn: any) => sum + Number(txn.amount), 0)

      months.push({ month: monthLabel, income, expense })
    }
    return months
  }

  const monthlyData = generateMonthlyData()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <BalanceOverview
        balance={totalBalance}
        debt={debt}
        showBalance={showBalance}
        onToggleBalance={toggleBalance}
      />

      <MonthlyChart data={monthlyData} />

      <QuickActions />
    </div>
  )
}
