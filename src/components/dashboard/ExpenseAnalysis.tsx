import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']

export interface ExpenseItem {
  name: string
  value: number
  icon: string
  color: string
}

interface ExpenseAnalysisProps {
  items: ExpenseItem[]
}

export function ExpenseAnalysis({ items }: ExpenseAnalysisProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  const sortedItems = [...items].sort((a, b) => b.value - a.value)

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2 px-4 pt-3">
        <CardTitle className="text-sm font-medium text-gray-700">
          📊 Phân tích chi tiêu
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-3">
        {sortedItems.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            Chưa có chi tiêu
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedItems.slice(0, 6).map((item, index) => {
              const percent = total > 0 ? Math.round((item.value / total) * 100) : 0
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Intl.NumberFormat('vi-VN').format(item.value)}đ
                      </span>
                      <span className="text-xs font-semibold text-gray-700">{percent}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}