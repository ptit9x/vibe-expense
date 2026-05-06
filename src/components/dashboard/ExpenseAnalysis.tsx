import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, ResponsiveContainer, Sector, type PieSectorDataItem } from 'recharts'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'

const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6']

export interface ExpenseItem {
  name: string
  value: number
  icon: string
  color: string
}

interface ExpenseAnalysisProps {
  items: ExpenseItem[]
}

interface SectorProps {
  cx: number
  cy: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  fill: string
  percent: number
  name: string
  value: number
  isActive: boolean
  currency: { symbol: string }
  formatCurrency: (v: number) => string
}

function PieSector(props: SectorProps) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, percent, name, value, isActive, currency, formatCurrency } = props

  return (
    <g>
      {/* Center label - only show on active sector */}
      {isActive && (
        <>
          <text x={cx} y={cy - 8} textAnchor="middle" fill="#374151" fontSize={12} fontWeight={600}>
            {name}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#6B7280" fontSize={11}>
            {currency.symbol}{formatCurrency(value)}
          </text>
          <text x={cx} y={cy + 26} textAnchor="middle" fill="#9CA3AF" fontSize={10}>
            ({(percent * 100).toFixed(0)}%)
          </text>
        </>
      )}

      {/* Main sector */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />

      {/* Active ring highlight */}
      {isActive && (
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 4}
          outerRadius={outerRadius + 8}
          fill={fill}
        />
      )}
    </g>
  )
}

export function ExpenseAnalysis({ items }: ExpenseAnalysisProps) {
  const { t } = useI18n()
  const { currency, formatCurrency } = useUIStore()
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const sortedItems = [...items].sort((a, b) => b.value - a.value).slice(0, 8)
  const [activeIndex, setActiveIndex] = useState(0)

  const chartData = sortedItems.map((item, index) => ({
    name: item.name,
    value: item.value,
    icon: item.icon,
    fill: COLORS[index % COLORS.length],
  }))

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="text-sm font-medium text-gray-700">
          📊 {t.dashboard.expenseAnalysis}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-3">
        {sortedItems.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            {t.dashboard.noExpenses}
          </div>
        ) : (
          <div>
            {/* Pie Chart */}
            <div className="h-50">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    dataKey="value"
                    paddingAngle={2}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    shape={(props: PieSectorDataItem & { index: number }) => (
                      <PieSector
                        {...(props as Omit<SectorProps, 'isActive' | 'currency' | 'formatCurrency'>)}
                        isActive={props.index === activeIndex}
                        currency={currency}
                        formatCurrency={formatCurrency}
                      />
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1">
              {sortedItems.map((item, index) => {
                const percent = total > 0 ? Math.round((item.value / total) * 100) : 0
                return (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-gray-600 truncate">{item.icon} {item.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{percent}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}