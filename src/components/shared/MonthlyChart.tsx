import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'

export interface MonthlyData {
  month: string
  income: number
  expense: number
}

interface MonthlyChartProps {
  data: MonthlyData[]
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const { t } = useI18n()
  const { currency, formatCurrency } = useUIStore()

  return (
    <div className="bg-white mt-2 px-5 py-4">
      <p className="text-sm font-medium text-gray-900 mb-4">{t.dashboard.monthlyOverview}</p>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis hide />
            <Tooltip
              formatter={(value) => [currency.symbol + formatCurrency(Number(value)), '']}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            />
            <Bar
              dataKey="income"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              name={t.dashboard.income}
            />
            <Bar
              dataKey="expense"
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              name={t.dashboard.expense}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-xs text-gray-500">{t.dashboard.income}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-xs text-gray-500">{t.dashboard.expense}</span>
        </div>
      </div>
    </div>
  )
}