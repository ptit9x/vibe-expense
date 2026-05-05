import type { ReactNode } from 'react'
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