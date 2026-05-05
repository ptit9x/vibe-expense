import { useState } from 'react'
import { Plus, PiggyBank, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useSavings, useCreateSavingsGoal } from '@/hooks/useSavings'
import { useI18n, type Language } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'
import { PullToRefreshWrapper } from '@/components/shared'
import type { SavingsGoal } from '@/types'

const LOCALE_MAP: Record<Language, string> = {
  vi: 'vi-VN',
  en: 'en-US',
}

import { PageTransition } from '@/components/shared'

export default function Savings() {
  const { data: goals, isLoading, refetch: refetchGoals } = useSavings()
  const createGoal = useCreateSavingsGoal()
  const [showForm, setShowForm] = useState(false)
  const [goalName, setGoalName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const { t, language } = useI18n()
  const { currency, formatCurrency, showBalance } = useUIStore()

  const goalsData = goals as SavingsGoal[] | undefined
  const totalSaved = goalsData?.reduce((sum, g) => sum + (g.current_amount || 0), 0) || 0
  const totalTarget = goalsData?.reduce((sum, g) => sum + (g.target_amount || 0), 0) || 0

  const handleAddGoal = () => {
    if (!goalName.trim()) {
      toast.error(t.savings.pleaseEnterGoalName)
      return
    }
    const target = parseFloat(targetAmount)
    if (!target || target <= 0) {
      toast.error(t.savings.targetMustBePositive)
      return
    }
    createGoal.mutate(
      {
        name: goalName.trim(),
        target_amount: target,
      },
      {
        onSuccess: () => {
          toast.success(t.savingsPage.goalCreated)
          setShowForm(false)
          setGoalName('')
          setTargetAmount('')
          setCurrentAmount('')
        },
        onError: (err) => {
          toast.error(err.message || t.common.error)
        },
      }
    )
  }

  return (
    <PageTransition>
    <PullToRefreshWrapper className="flex flex-col gap-6 p-4 lg:p-8" onRefresh={async () => { await refetchGoals() }}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.savings.savings}</h1>
          <p className="text-muted-foreground">{t.savings.trackGoals}</p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {t.savings.addGoal}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-white/80 flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              {t.savings.totalSaved}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {showBalance ? `${currency.symbol}${formatCurrency(totalSaved)}` : '••••••'}
            </p>
            <p className="text-sm text-white/70 mt-1">
              {t.savings.target}: {showBalance ? `${currency.symbol}${formatCurrency(totalTarget)}` : '••••••'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-white/80 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t.savings.progress}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}%
            </p>
            <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t.savings.addSavingsGoal}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t.savings.goalName}</label>
              <Input
                placeholder={t.savings.enterGoalName}
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t.savings.targetAmount}</label>
                <Input
                  type="number"
                  placeholder={t.savings.enterTargetAmount}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t.savings.currentAmount}</label>
                <Input
                  type="number"
                  placeholder={t.savings.enterCurrentAmount}
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddGoal} disabled={createGoal.isPending}>
                {createGoal.isPending ? t.savingsPage.processing : t.common.save}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>{t.common.cancel}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">{t.common.loading}</div>
        ) : !goalsData || goalsData.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {t.savings.noSavingsGoals}
          </div>
        ) : (
          goalsData.map((goal) => {
            const percentage = goal.target_amount > 0
              ? (goal.current_amount / goal.target_amount) * 100
              : 0
            const remaining = goal.target_amount - goal.current_amount

            return (
              <Card key={goal.id} className="relative overflow-hidden rounded-2xl border-0 shadow-md">
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
                        {showBalance ? `${currency.symbol}${formatCurrency(goal.current_amount)}` : '••••'}
                      </span>
                      <span className="font-medium" style={{ color: goal.color }}>
                        {showBalance ? `${currency.symbol}${formatCurrency(goal.target_amount)}` : '••••'}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
                    <span className="text-muted-foreground">{t.savings.remaining}</span>
                    <span className="font-medium text-orange-600">
                      {showBalance ? `${currency.symbol}${formatCurrency(remaining)}` : '••••'}
                    </span>
                  </div>
                  {goal.deadline && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{t.savings.deadlineLabel}: {new Date(goal.deadline).toLocaleDateString(LOCALE_MAP[language])}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </PullToRefreshWrapper>
    </PageTransition>
  )
}