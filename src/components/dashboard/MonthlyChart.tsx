import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface MonthlyData {
  month: string
  income: number
  expense: number
}

interface MonthlyChartProps {
  data: MonthlyData[]
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="text-sm font-medium text-gray-700">
          📈 Thu chi theo tháng
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-3">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={2} barCategoryGap="20%">
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => {
                  if (v >= 1000000) return `${(v / 1000000).toFixed(0)}M`
                  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`
                  return v
                }}
              />
              <Tooltip
                formatter={(value) => new Intl.NumberFormat('vi-VN').format(Number(value)) + ' đ'}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '11px' }}
              />
              <Bar dataKey="expense" fill="#EF4444" name="Chi tiêu" radius={[3, 3, 0, 0]} />
              <Bar dataKey="income" fill="#10B981" name="Thu nhập" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-red-500"></span> Chi tiêu
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-green-500"></span> Thu nhập
          </span>
        </div>
      </CardContent>
    </Card>
  )
}