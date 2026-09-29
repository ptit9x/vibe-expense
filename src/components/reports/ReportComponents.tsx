import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { useUIStore } from '@/stores/uiStore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTheme } from '@/components/theme-provider'

interface ReportFiltersProps {
  children: ReactNode
}

export function ReportFilters({ children }: ReportFiltersProps) {
  return (
    <div className="clay-card mt-2 px-5 py-3 flex gap-3">
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
  const defaultPlaceholder = t.common.select

  return (
    <div className="flex-1 relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 pl-3 pr-8 bg-gray-50 rounded-lg text-sm text-gray-900 appearance-none"
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
  const { currency, formatCurrency, showBalance } = useUIStore()
  return (
    <div>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>
        {showBalance ? `${currency.symbol}${formatCurrency(value)}` : '••••••'}
      </p>
    </div>
  )
}

interface MonthlyBarChartProps {
  data: { month: string; value: number; monthNum?: string }[]
  color?: string
}

export function MonthlyBarChart({ data, color = '#3B82F6' }: MonthlyBarChartProps) {
  const { currency, formatCurrency } = useUIStore()
  const { resolvedMode } = useTheme()
  const isDark = resolvedMode === 'dark'

  const tickColor = isDark ? '#94A3B8' : '#9CA3AF'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipColor = isDark ? '#f1f5f9' : '#1f2937'
  const tooltipShadow = isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.1)'

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: tickColor, fontSize: 11 }}
          />
          <YAxis hide />
          <Tooltip 
            formatter={(value: unknown) => [currency.symbol + formatCurrency(Number(value)), '']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: tooltipShadow, backgroundColor: tooltipBg, color: tooltipColor }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((_: unknown, index: number) => (
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
      {items.map((item) => (
        <div key={item.name} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: item.color + '20' }}
            >
              {item.icon}
            </div>
            <span className="text-base font-medium text-gray-700">{item.name}</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">
              {currency.symbol}{formatCurrency(item.value)}
            </p>
            <p className="text-sm text-gray-400">
              {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

interface MonthlyListProps {
  data: { month: string; value: number; monthNum?: string }[]
  year: number
  type: 'income' | 'expense'
}

export function MonthlyList({ data, year, type }: MonthlyListProps) {
  const { currency, formatCurrency } = useUIStore()
  return (
    <div className="space-y-2">
      {data.slice().reverse().map((item) => {
        const monthParam = `${year}-${item.monthNum || (item.month.match(/\d+/)?.[0] || '').padStart(2, '0')}`
        return (
          <Link
            key={item.monthNum || item.month}
            to={`/transactions?month=${monthParam}&type=${type}`}
            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-5 px-5 transition-colors"
          >
            <span className="text-sm text-gray-600">{item.month}</span>
            <span className="text-sm font-medium text-gray-900">
              {currency.symbol}{formatCurrency(item.value)}
            </span>
          </Link>
        )
      })}
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
        className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="text-white font-bold text-lg min-w-[60px] text-center">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}

// ===== Shared YearlyReport =====
import { useAllTypeTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { PullToRefreshWrapper } from '@/components/shared'
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
  const [view, setView] = useState<'years' | 'months'>('years')
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedWallet, setSelectedWallet] = useState('all')
  const { t, language } = useI18n()
  const { currency, formatCurrency, showBalance } = useUIStore()
  const { data: transactions, refetch: refetchTx } = useAllTypeTransactions(type)
  const { data: categories, refetch: refetchCat } = useCategories()
  const { data: wallets } = useWallets()

  // Filter categories by type client-side (single cache key for all types)
  const filteredCategories = categories?.filter(c => c.type === type) ?? []

  // Apply client-side filters for category & wallet (across ALL years)
  const filtered = transactions?.filter(tx => {
    if (selectedCategory !== 'all' && tx.category_id !== selectedCategory) return false
    if (selectedWallet !== 'all' && tx.wallet_id !== selectedWallet) return false
    return true
  }) || []

  // Year-over-year aggregation
  const yearlyData = Object.entries(
    filtered.reduce((acc: Record<string, number>, tx) => {
      const y = tx.transaction_date?.substring(0, 4)
      if (!y) return acc
      acc[y] = (acc[y] || 0) + Number(tx.amount)
      return acc
    }, {})
  ).sort((a, b) => a[0].localeCompare(b[0])).map(([year, value]) => ({ year, value }))

  const totalAllYears = yearlyData.reduce((sum, y) => sum + y.value, 0)
  const avgPerYear = yearlyData.length > 0 ? totalAllYears / yearlyData.length : 0

  // Months view: scope to selected year
  const yearFiltered = view === 'months' ? filtered.filter(tx => tx.transaction_date?.startsWith(String(selectedYear))) : []

  const total = yearFiltered.reduce((sum, tx) => sum + Number(tx.amount), 0)
  const avgMonthly = total / 12

  // Monthly data
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0')
    const monthTotal = yearFiltered
      .filter(tx => tx.transaction_date?.substring(5, 7) === month)
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
    const monthLabel = new Date(2000, i).toLocaleDateString(getLocale(language), { month: 'short' })
    return { month: monthLabel, value: monthTotal, monthNum: month }
  })

  // Category breakdown
  const byCategory = yearFiltered.reduce((acc: { name: string; value: number; color: string; icon: string }[], tx) => {
    const catName = tx.category?.name || t.dashboard.otherCategory
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

  const money = (n: number) => (showBalance ? `${currency.symbol}${formatCurrency(n)}` : '••••••')

  return (
    <PullToRefreshWrapper className="min-h-screen bg-background pb-20" onRefresh={async () => { await Promise.all([refetchTx(), refetchCat()]) }}>
      {/* Header */}
      <div className={`${gradientClass} px-5 pt-4 pb-6`}>
        {view === 'months' && (
          <button
            onClick={() => setView('years')}
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm font-medium mb-2 -ml-1 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            {t.reports.allYears}
          </button>
        )}
        <h1 className="text-xl font-semibold text-white mb-1">{title}</h1>
        <p className="text-white/60 text-sm">{subtitle}</p>
        {view === 'months' && <YearPicker value={selectedYear} onChange={setSelectedYear} />}
      </div>

      {/* Filters (shared) */}
      <ReportFilters>
        <SelectFilter
          value={selectedCategory}
          onChange={setSelectedCategory}
          placeholder={t.reports.allCategories}
          options={filteredCategories.map(cat => ({ value: cat.id, label: cat.name }))}
        />
        <SelectFilter
          value={selectedWallet}
          onChange={setSelectedWallet}
          placeholder={t.reports.allWallets}
          options={wallets?.map(w => ({ value: w.id, label: w.name })) || []}
        />
      </ReportFilters>

      {view === 'years' ? (
        <>
          {/* Chart by year */}
          <div className="clay-card mt-2 px-5 py-4">
            <MonthlyBarChart data={yearlyData.map(y => ({ month: y.year, value: y.value }))} color={chartColor} />
          </div>

          {/* Totals */}
          <div className="clay-card mt-2 px-5 py-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">{type === 'income' ? t.reports.totalAllIncome : t.reports.totalAllExpense}</span>
              <span className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">{money(totalAllYears)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">{type === 'income' ? t.reports.avgIncomeYear : t.reports.avgExpenseYear}</span>
              <span className="text-base font-bold text-gray-900 dark:text-gray-100 tabular-nums">{money(avgPerYear)}</span>
            </div>
          </div>

          {/* Year list */}
          <div className="clay-card mt-2 px-5 py-4">
            {yearlyData.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-4">{t.transaction.noTransactions}</p>
            ) : (
              <div>
                {yearlyData.slice().reverse().map(y => (
                  <button
                    key={y.year}
                    onClick={() => { setSelectedYear(Number(y.year)); setView('months') }}
                    className="flex w-full items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-5 px-5 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{y.year}</span>
                    <span className="flex items-center gap-1">
                      <span className="text-sm font-bold tabular-nums" style={{ color: chartColor }}>{money(y.value)}</span>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Stats */}
          <div className="clay-card mt-2 px-5 py-4">
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

          {/* Chart */}
          <div className="clay-card mt-2 px-5 py-4">
            <MonthlyBarChart data={monthlyData} color={chartColor} />
          </div>

          {/* Category breakdown */}
          {byCategory.length > 0 && (
            <div className="clay-card mt-2 px-5 py-4">
              {/* eslint-disable-next-line security/detect-object-injection */}
              <p className="text-sm font-medium text-gray-900 mb-3">{t.reports[categoryLabelKey]}</p>
              <CategoryList items={byCategory} total={total} />
            </div>
          )}

          {/* Monthly breakdown */}
          <div className="clay-card mt-2 px-5 py-4">
            {/* eslint-disable-next-line security/detect-object-injection */}
            <p className="text-sm font-medium text-gray-900 mb-3">{t.reports[monthLabelKey]}</p>
            <MonthlyList data={monthlyData} year={selectedYear} type={type} />
          </div>
        </>
      )}
    </PullToRefreshWrapper>
  )
}
