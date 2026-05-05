import { useState } from 'react'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useWallets } from '@/hooks/useWallets'
import { useI18n } from '@/lib/i18n'
import { ReportFilters, SelectFilter, StatCard, MonthlyBarChart, CategoryList, MonthlyList } from '@/components/reports/ReportComponents'

export default function ExpenseReport() {
  const [selectedYear] = useState(() => new Date().getFullYear())
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedWallet, setSelectedWallet] = useState('all')
  const { t } = useI18n()
  
  const { data: transactions } = useTransactions()
  const { data: categories } = useCategories('expense')
  const { data: wallets } = useWallets()

  // Filter expense transactions by year
  const yearStr = selectedYear.toString()
  const expenseTransactions = transactions?.filter(t => {
    if (t.type !== 'expense') return false
    if (!t.transaction_date?.startsWith(yearStr)) return false
    if (selectedCategory !== 'all' && t.category_id !== selectedCategory) return false
    if (selectedWallet !== 'all' && t.wallet_id !== selectedWallet) return false
    return true
  }) || []

  // Calculate totals
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
  const monthsInData = 12
  const avgMonthly = totalExpense / monthsInData

  // Generate monthly data
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0')
    const monthTransactions = expenseTransactions.filter(t => 
      t.transaction_date?.endsWith(`-${month}`)
    )
    const expense = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    return {
      month: `T${i + 1}`,
      value: expense,
    }
  })

  // Category breakdown
  const byCategory = expenseTransactions.reduce((acc: any[], t) => {
    const catName = t.category?.name || 'Khác'
    const existing = acc.find(item => item.name === catName)
    if (existing) {
      existing.value += Number(t.amount)
    } else {
      acc.push({ 
        name: catName, 
        value: Number(t.amount), 
        color: t.category?.color || '#6B7280',
        icon: t.category?.icon || '💰'
      })
    }
    return acc
  }, []).sort((a, b) => b.value - a.value)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <h1 className="text-xl font-semibold text-white mb-1">{t.reports.expenseReport}</h1>
        <p className="text-white/60 text-sm">{t.reports.trackExpenses}</p>
      </div>

      {/* Stats */}
      <div className="bg-white px-5 py-4">
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            label={`${t.reports.totalExpenseYear} ${selectedYear}`} 
            value={totalExpense} 
            color="#3B82F6" 
          />
          <StatCard 
            label={t.reports.avgMonthly} 
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
          placeholder={t.reports.allCategories}
          options={categories?.map(cat => ({ value: cat.id, label: cat.name })) || []}
        />
        <SelectFilter
          value={selectedWallet}
          onChange={setSelectedWallet}
          placeholder={t.reports.allWallets}
          options={wallets?.map(w => ({ value: w.id, label: w.name })) || []}
        />
      </ReportFilters>

      {/* Chart */}
      <div className="bg-white mt-2 px-5 py-4">
        <MonthlyBarChart data={monthlyData} color="#3B82F6" />
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="bg-white mt-2 px-5 py-4">
          <p className="text-sm font-medium text-gray-900 mb-3">{t.reports.expenseByCategory}</p>
          <CategoryList items={byCategory} total={totalExpense} />
        </div>
      )}

      {/* Monthly breakdown */}
      <div className="bg-white mt-2 px-5 py-4">
        <p className="text-sm font-medium text-gray-900 mb-3">{t.reports.expenseByMonth}</p>
        <MonthlyList data={monthlyData} />
      </div>
    </div>
  )
}