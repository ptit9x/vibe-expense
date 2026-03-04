import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useWallets } from '@/hooks/useWallets'
import { ReportFilters, SelectFilter, StatCard, MonthlyBarChart, CategoryList, MonthlyList } from '@/components/reports/ReportComponents'

export default function IncomeReport() {
  const [selectedYear] = useState(() => new Date().getFullYear())
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedWallet, setSelectedWallet] = useState('all')
  
  const { data: transactions } = useTransactions()
  const { data: categories } = useCategories('income')
  const { data: wallets } = useWallets()

  // Filter income transactions by year
  const yearStr = selectedYear.toString()
  const incomeTransactions = transactions?.filter(t => {
    if (t.type !== 'income') return false
    if (!t.transaction_date?.startsWith(yearStr)) return false
    if (selectedCategory !== 'all' && t.category_id !== selectedCategory) return false
    if (selectedWallet !== 'all' && t.wallet_id !== selectedWallet) return false
    return true
  }) || []

  // Calculate totals
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const monthsInData = 12
  const avgMonthly = totalIncome / monthsInData

  // Generate monthly data
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0')
    const monthTransactions = incomeTransactions.filter(t => 
      t.transaction_date?.endsWith(`-${month}`)
    )
    const income = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    return {
      month: `T${i + 1}`,
      value: income,
    }
  })

  // Category breakdown
  const byCategory = incomeTransactions.reduce((acc: any[], t) => {
    const catName = t.category?.name || 'Khác'
    const existing = acc.find(item => item.name === catName)
    if (existing) {
      existing.value += Number(t.amount)
    } else {
      acc.push({ 
        name: catName, 
        value: Number(t.amount), 
        color: t.category?.color || '#10B981',
        icon: t.category?.icon || '💰'
      })
    }
    return acc
  }, []).sort((a, b) => b.value - a.value)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-green-500 to-green-600 px-5 pt-4 pb-6">
        <h1 className="text-xl font-semibold text-white mb-1">Báo cáo thu</h1>
        <p className="text-white/60 text-sm">Theo dõi thu nhập</p>
      </div>

      {/* Stats */}
      <div className="bg-white px-5 py-4">
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            label={`Tổng thu năm ${selectedYear}`} 
            value={totalIncome} 
            color="#10B981" 
          />
          <StatCard 
            label="Trung bình tháng" 
            value={avgMonthly} 
            color="#6B7280" 
          />
        </div>
      </div>

      {/* Filters */}
      <ReportFilters>
        <SelectFilter
          value={selectedCategory}
          onChange={setSelectedCategory}
          placeholder="Tất cả danh mục"
          options={categories?.map(cat => ({ value: cat.id, label: cat.name })) || []}
        />
        <SelectFilter
          value={selectedWallet}
          onChange={setSelectedWallet}
          placeholder="Tất cả tài khoản"
          options={wallets?.map(w => ({ value: w.id, label: w.name })) || []}
        />
      </ReportFilters>

      {/* Chart */}
      <div className="bg-white mt-2 px-5 py-4">
        <MonthlyBarChart data={monthlyData} color="#10B981" />
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="bg-white mt-2 px-5 py-4">
          <p className="text-sm font-medium text-gray-900 mb-3">Thu nhập theo danh mục</p>
          <CategoryList items={byCategory} total={totalIncome} />
        </div>
      )}

      {/* Monthly breakdown */}
      <div className="bg-white mt-2 px-5 py-4">
        <p className="text-sm font-medium text-gray-900 mb-3">Thu nhập từng tháng</p>
        <MonthlyList data={monthlyData} />
      </div>
    </div>
  )
}
