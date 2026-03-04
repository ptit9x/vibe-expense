import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface MonthlyData {
  month: string
  income: number
  expense: number
  changePercent?: number
}

interface MonthlyChartProps {
  data: MonthlyData[]
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <div className="bg-white mt-2 px-5 py-4">
      <p className="text-sm font-medium text-gray-900 mb-4">Thu chi theo tháng</p>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis 
              hide 
            />
            <Tooltip 
              formatter={(value) => [new Intl.NumberFormat('vi-VN').format(Number(value)) + ' đ', '']}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            />
            <Bar 
              dataKey="income" 
              fill="#10B981" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={40}
            />
            <Bar 
              dataKey="expense" 
              fill="#EF4444" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-xs text-gray-500">Thu nhập</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-xs text-gray-500">Chi tiêu</span>
        </div>
      </div>
    </div>
  )
}
