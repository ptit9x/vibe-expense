import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ReportFiltersProps {
  children: ReactNode
}

export function ReportFilters({ children }: ReportFiltersProps) {
  return (
    <div className="bg-white mt-2 px-5 py-3 flex gap-3">
      {children}
    </div>
  )
}

interface SelectFilterProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectFilter({ value, onChange, options, placeholder }: SelectFilterProps) {
  const { t } = useI18n()
  const defaultPlaceholder = t.common.select as string || 'Chọn...'

  return (
    <div className="flex-1 relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 pl-3 pr-8 bg-gray-50 rounded-lg text-sm appearance-none"
      >
        <option value="all">{placeholder || defaultPlaceholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <svg className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  color?: string
}

export function StatCard({ label, value, color = '#3B82F6' }: StatCardProps) {
  const { currency, formatCurrency } = useUIStore()
  return (
    <div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>
        {currency.symbol}{formatCurrency(value)}
      </p>
    </div>
  )
}

interface MonthlyBarChartProps {
  data: { month: string; value: number }[]
  color?: string
}

export function MonthlyBarChart({ data, color = '#3B82F6' }: MonthlyBarChartProps) {
  const { currency, formatCurrency } = useUIStore()
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
          />
          <YAxis hide />
          <Tooltip 
            formatter={(value: any) => [currency.symbol + formatCurrency(Number(value)), '']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((_: any, index: number) => (
              <Cell key={`cell-${index}`} fill={color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface CategoryItem {
  name: string
  value: number
  color: string
  icon: string
}

interface CategoryListProps {
  items: CategoryItem[]
  total: number
}

export function CategoryList({ items, total }: CategoryListProps) {
  const { currency, formatCurrency } = useUIStore()
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: item.color + '20' }}
            >
              {item.icon}
            </div>
            <span className="text-sm font-medium text-gray-700">{item.name}</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">
              {currency.symbol}{formatCurrency(item.value)}
            </p>
            <p className="text-xs text-gray-400">
              {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

interface MonthlyListProps {
  data: { month: string; value: number }[]
}

export function MonthlyList({ data }: MonthlyListProps) {
  const { currency, formatCurrency } = useUIStore()
  return (
    <div className="space-y-2">
      {data.slice().reverse().map((item, index) => (
        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <span className="text-sm text-gray-600">{item.month}</span>
          <span className="text-sm font-medium text-gray-900">
            {currency.symbol}{formatCurrency(item.value)}
          </span>
        </div>
      ))}
    </div>
  )
}
interface YearPickerProps {
  value: number
  onChange: (year: number) => void
}

export function YearPicker({ value, onChange }: YearPickerProps) {
  return (
    <div className="flex items-center justify-center gap-3 mt-3">
      <button
        onClick={() => onChange(value - 1)}
        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="text-white font-bold text-lg min-w-[60px] text-center">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}

// ===== Shared YearlyReport =====
import { useYearTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useWallets } from '@/hooks/useWallets'

interface YearlyReportProps {
  type: 'income' | 'expense'
  title: string
  subtitle: string
  gradientClass: string
  chartColor: string
  totalLabelKey: 'totalIncomeYear' | 'totalExpenseYear'
  categoryLabelKey: 'incomeByCategory' | 'expenseByCategory'
  monthLabelKey: 'incomeByMonth' | 'expenseByMonth'
}

export function YearlyReport({
  type,
  title,
  subtitle,
  gradientClass,
  chartColor,
  totalLabelKey,
  categoryLabelKey,
  monthLabelKey,
}: YearlyReportProps) {
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedWallet, setSelectedWallet] = useState('all')
  const { t } = useI18n()
  const { data: transactions } = useYearTransactions(selectedYear, type)
  const { data: categories } = useCategories(type)
  const { data: wallets } = useWallets()

  // Apply client-side filters for category & wallet
  const filtered = transactions?.filter(tx => {
    if (selectedCategory !== 'all' && tx.category_id !== selectedCategory) return false
    if (selectedWallet !== 'all' && tx.wallet_id !== selectedWallet) return false
    return true
  }) || []

  const total = filtered.reduce((sum, tx) => sum + Number(tx.amount), 0)
  const avgMonthly = total / 12

  // Monthly data
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0')
    const monthTotal = filtered
      .filter(tx => tx.transaction_date?.endsWith(`-${month}`))
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
    return { month: `T${i + 1}`, value: monthTotal }
  })

  // Category breakdown
  const byCategory = filtered.reduce((acc: { name: string; value: number; color: string; icon: string }[], tx) => {
    const catName = tx.category?.name || 'Khác'
    const existing = acc.find(item => item.name === catName)
    if (existing) {
      existing.value += Number(tx.amount)
    } else {
      acc.push({
        name: catName,
        value: Number(tx.amount),
        color: tx.category?.color || (type === 'income' ? '#10B981' : '#6B7280'),
        icon: tx.category?.icon || '💰',
      })
    }
    return acc
  }, []).sort((a, b) => b.value - a.value)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className={`${gradientClass} px-5 pt-4 pb-6`}>
        <h1 className="text-xl font-semibold text-white mb-1">{title}</h1>
        <p className="text-white/60 text-sm">{subtitle}</p>
        <YearPicker value={selectedYear} onChange={setSelectedYear} />
      </div>

      {/* Stats */}
      <div className="bg-white px-5 py-4">
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label={`${t.reports[totalLabelKey]} ${selectedYear}`}
            value={total}
            color={chartColor}
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
        <MonthlyBarChart data={monthlyData} color={chartColor} />
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div className="bg-white mt-2 px-5 py-4">
          <p className="text-sm font-medium text-gray-900 mb-3">{t.reports[categoryLabelKey]}</p>
          <CategoryList items={byCategory} total={total} />
        </div>
      )}

      {/* Monthly breakdown */}
      <div className="bg-white mt-2 px-5 py-4">
        <p className="text-sm font-medium text-gray-900 mb-3">{t.reports[monthLabelKey]}</p>
        <MonthlyList data={monthlyData} />
      </div>
    </div>
  )
}
