import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className="rounded-2xl border-0 shadow-md bg-white overflow-hidden">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs">📈</span>
          {t.dashboard.monthlyOverview}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-2 pb-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" stopOpacity={1} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FB7185" stopOpacity={1} />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis hide />
              <Tooltip
                formatter={(value) => [currency.symbol + formatCurrency(Number(value)), '']}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '13px',
                  padding: '8px 12px',
                }}
              />
              <Bar
                dataKey="income"
                fill="url(#incomeGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
                name={t.dashboard.income}
              />
              <Bar
                dataKey="expense"
                fill="url(#expenseGrad)"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
                name={t.dashboard.expense}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500" />
            <span className="text-xs text-gray-500 font-medium">{t.dashboard.income}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-b from-rose-400 to-rose-500" />
            <span className="text-xs text-gray-500 font-medium">{t.dashboard.expense}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
