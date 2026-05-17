import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, ResponsiveContainer, Sector, type PieSectorDataItem } from 'recharts'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'

const COLORS = ['#6366F1', '#F43F5E', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#3B82F6', '#14B8A6']

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
      {isActive && (
        <>
          <text x={cx} y={cy - 8} textAnchor="middle" fill="#374151" fontSize={13} fontWeight={600}>
            {name}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#6B7280" fontSize={12}>
            {currency.symbol}{formatCurrency(value)}
          </text>
          <text x={cx} y={cy + 24} textAnchor="middle" fill="#9CA3AF" fontSize={11}>
            ({(percent * 100).toFixed(0)}%)
          </text>
        </>
      )}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      {isActive && (
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 3}
          outerRadius={outerRadius + 7}
          fill={fill}
          opacity={0.6}
        />
      )}
    </g>
  )
}

const legendVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}
const legendItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
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
    <Card className="rounded-2xl border-0 shadow-md bg-white overflow-hidden">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs">📊</span>
          {t.dashboard.expenseAnalysis}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        {sortedItems.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            {t.dashboard.noExpenses}
          </div>
        ) : (
          <div>
            {/* Pie Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    dataKey="value"
                    paddingAngle={3}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    animationBegin={0}
                    animationDuration={800}
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

            {/* Legend with progress bars */}
            <motion.div
              className="space-y-2 mt-2"
              variants={legendVariants}
              initial="hidden"
              animate="visible"
            >
              {sortedItems.map((item, index) => {
                const percent = total > 0 ? Math.round((item.value / total) * 100) : 0
                const color = COLORS[index % COLORS.length]
                return (
                  <motion.div
                    key={item.name}
                    variants={legendItemVariants}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: color + '15' }}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-gray-700 truncate">{item.name}</span>
                        <span className="text-xs font-semibold text-gray-900 shrink-0 ml-2">
                          {currency.symbol}{formatCurrency(item.value)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.6, delay: index * 0.06, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
