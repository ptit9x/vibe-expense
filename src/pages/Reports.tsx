import { useWallets } from '@/hooks/useWallets'
import { useTransactions } from '@/hooks/useTransactions'
import { useReportsStore } from '@/stores/reportsStore'
import {
  BalanceOverview,
  MonthlyChart,
  QuickActions,
} from '@/components/reports'

export default function Reports() {
  const { showBalance, toggleBalance, currentMonth } = useReportsStore()
  const { data: wallets } = useWallets()
  const { data: transactions } = useTransactions(currentMonth)

  const totalBalance = wallets?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0
  
  // Mock debt for now - in real app this would come from a debt tracking feature
  const debt = 0

  // Generate monthly data from transactions (last 6 months)
  const generateMonthlyData = () => {
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthKey = d.toISOString().slice(0, 7)
      const monthLabel = `T${d.getMonth() + 1}`

      const monthTransactions = (transactions ?? []).filter((t: any) => 
        t.transaction_date?.startsWith(monthKey)
      ) || []

      const income = monthTransactions
        .filter((t: any) => t.type === 'income')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
      
      const expense = monthTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

      months.push({ month: monthLabel, income, expense })
    }
    return months
  }

  const monthlyData = generateMonthlyData()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Balance Overview Header */}
      <BalanceOverview
        balance={totalBalance}
        debt={debt}
        showBalance={showBalance}
        onToggleBalance={toggleBalance}
      />

      {/* Monthly Chart */}
      <MonthlyChart data={monthlyData} />

      {/* Quick Actions */}
      <QuickActions />
    </div>
  )
}
