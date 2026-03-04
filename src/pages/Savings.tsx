import { useState } from 'react'
import { Plus, PiggyBank, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Mock savings goals
const mockGoals = [
  { 
    id: '1', 
    name: 'Quỹ du lịch Nhật Bản', 
    icon: '✈️', 
    color: '#3B82F6',
    target_amount: 50000000, 
    current_amount: 32500000,
    deadline: '2026-12-31'
  },
  { 
    id: '2', 
    name: 'Mua xe máy mới', 
    icon: '🏍️', 
    color: '#10B981',
    target_amount: 40000000, 
    current_amount: 15000000,
    deadline: '2026-06-30'
  },
]

export default function Savings() {
  const [showForm, setShowForm] = useState(false)
  const [goalName, setGoalName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')

  const totalSaved = mockGoals.reduce((sum, g) => sum + g.current_amount, 0)
  const totalTarget = mockGoals.reduce((sum, g) => sum + g.target_amount, 0)

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tiết kiệm</h1>
          <p className="text-muted-foreground">Theo dõi mục tiêu tài chính</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm mục tiêu
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-white/80 flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Tổng đã tiết kiệm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {new Intl.NumberFormat('vi-VN').format(totalSaved)} ₫
            </p>
            <p className="text-sm text-white/70 mt-1">
              Mục tiêu: {new Intl.NumberFormat('vi-VN').format(totalTarget)} ₫
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-white/80 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tiến độ chung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {((totalSaved / totalTarget) * 100).toFixed(1)}%
            </p>
            <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full"
                style={{ width: `${(totalSaved / totalTarget) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Thêm mục tiêu tiết kiệm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tên mục tiêu</label>
              <Input
                placeholder="VD: Quỹ du lịch"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Số tiền mục tiêu</label>
                <Input
                  type="number"
                  placeholder="VD: 50000000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Đã có</label>
                <Input
                  type="number"
                  placeholder="VD: 10000000"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button>Lưu</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockGoals.map((goal) => {
          const percentage = (goal.current_amount / goal.target_amount) * 100
          const remaining = goal.target_amount - goal.current_amount
          
          return (
            <Card key={goal.id} className="relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                style={{ backgroundColor: goal.color }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{goal.icon}</span>
                  <span className="text-2xl font-bold" style={{ color: goal.color }}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
                <CardTitle className="text-lg mt-2">{goal.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      {new Intl.NumberFormat('vi-VN').format(goal.current_amount)} ₫
                    </span>
                    <span className="font-medium" style={{ color: goal.color }}>
                      {new Intl.NumberFormat('vi-VN').format(goal.target_amount)} ₫
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: goal.color
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Còn lại</span>
                  <span className="font-medium text-orange-600">
                    {new Intl.NumberFormat('vi-VN').format(remaining)} ₫
                  </span>
                </div>
                {goal.deadline && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Hạn: {new Date(goal.deadline).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}