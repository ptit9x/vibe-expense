import { useMemo, useState } from 'react'
import { Plus, Target, Trash2, CalendarDays, TrendingUp } from 'lucide-react'
import { useBudgets, useCreateBudget, useDeleteBudget } from '@/hooks/useBudgets'
import { useCategories } from '@/hooks/useCategories'
import { useAllTypeTransactions } from '@/hooks/useTransactions'
import { computeBudgetSpent, periodStart, periodEnd, categoryMap } from '@/lib/budgets'
import { useI18n } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import PageHeader from '@/components/PageHeader'
import { PullToRefreshWrapper, PageTransition, EmptyState, SkeletonCard } from '@/components/shared'
import { toast } from 'sonner'
import type { Budget, BudgetPeriod, Category } from '@/types'
import type { Language } from '@/lib/i18n'

/** 'YYYY-MM-DD' → short localized date like '16 thg 10' / 'Oct 16'. */
function formatShortDate(iso: string, language: Language): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(getLocale(language), {
    day: 'numeric',
    month: 'short',
  })
}

export default function Budgets() {
  const { t, language } = useI18n()
  const displayAmount = useUIStore((s) => s.displayAmount)

  const { data: budgets, isLoading: budgetsLoading, refetch: refetchBudgets } = useBudgets()
  // All categories (parent + sub) — parent ids are budgetable, subs roll up into parents
  const { data: allCategories } = useCategories()
  const categoriesData = useMemo(() => ((allCategories || []) as Category[]).filter((c) => c.type === 'expense'), [allCategories])
  const { data: transactions } = useAllTypeTransactions()

  const createBudget = useCreateBudget()
  const deleteBudget = useDeleteBudget()

  const [showForm, setShowForm] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState<BudgetPeriod>('monthly')
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null)

  const budgetsData = budgets as Budget[] | undefined

  // Spent per budget in the current period (client-side, local dates)
  const spentMap = useMemo(
    () => computeBudgetSpent(budgetsData || [], transactions || [], categoriesData, new Date()),
    [budgetsData, transactions, categoriesData]
  )

  const catMap = useMemo(() => categoryMap(categoriesData), [categoriesData])

  const budgetedCategories = useMemo(
    () => new Set((budgetsData || []).map((b) => b.category_id)),
    [budgetsData]
  )
  // Only allow budgeting categories that don't have one yet (1 budget per category)
  // Only top-level expense categories are budgetable (subs roll up into them)
  const availableCategories = useMemo(
    () => categoriesData.filter((c) => !c.parent_id && !budgetedCategories.has(c.id)),
    [categoriesData, budgetedCategories]
  )

  const totals = useMemo(() => {
    const list = budgetsData || []
    const totalBudget = list.reduce((s, b) => s + b.amount, 0)
    const totalSpent = list.reduce((s, b) => s + (spentMap[b.id] || 0), 0)
    return { totalBudget, totalSpent, pct: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0 }
  }, [budgetsData, spentMap])

  const handleCreate = () => {
    if (!categoryId) {
      toast.error(t.budgets.selectCategoryFirst)
      return
    }
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      toast.error(t.budgets.amountMustBePositive)
      return
    }
    createBudget.mutate(
      {
        category_id: categoryId,
        amount: amt,
        period,
        start_date: periodStart(new Date(), period),
      },
      {
        onSuccess: () => {
          toast.success(t.budgets.budgetCreated)
          setShowForm(false)
          setCategoryId('')
          setAmount('')
          setPeriod('monthly')
        },
        onError: (err) => toast.error(err.message || t.common.error),
      }
    )
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteBudget.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(t.budgets.budgetDeleted)
        setDeleteTarget(null)
      },
      onError: (err) => toast.error(err.message || t.common.error),
    })
  }

  const isLoading = budgetsLoading

  return (
    <PageTransition>
      <PullToRefreshWrapper
        className="flex flex-col gap-6 p-4 lg:p-8"
        onRefresh={async () => {
          await refetchBudgets()
        }}
      >
        {/* Header */}
        <PageHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{t.budgets.title}</h1>
              <p className="text-sm text-white/70">{t.budgets.subtitle}</p>
            </div>
            <Button
              className="clay-button-primary"
              onClick={() => setShowForm((v) => !v)}
              aria-label={t.budgets.addBudget}
            >
              <Plus className="mr-1 h-4 w-4" />
              {t.budgets.addBudget}
            </Button>
          </div>
        </PageHeader>

        {/* Summary card */}
        <div className="clay-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
              <Target className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{t.budgets.totalBudget}</p>
              <p className="text-2xl font-bold tabular-nums">
                {displayAmount(totals.totalBudget)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{t.budgets.spent}</p>
              <p className="text-2xl font-bold tabular-nums text-rose-500">
                {displayAmount(totals.totalSpent)}
              </p>
            </div>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                totals.pct > 100
                  ? 'bg-rose-500'
                  : totals.pct > 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(totals.pct, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t.budgets.usedOf}: {totals.pct.toFixed(0)}%
          </p>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="clay-card space-y-4 p-5">
            <h2 className="text-base font-semibold">{t.budgets.createNew}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="budget-category">
                  {t.budgets.category}
                </label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="budget-category" className="clay-input">
                    <SelectValue placeholder={t.budgets.selectCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="mr-2">{c.icon}</span>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="budget-amount">
                  {t.budgets.amountLimit}
                </label>
                <Input
                  id="budget-amount"
                  type="number"
                  inputMode="numeric"
                  placeholder="VD: 3000000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="clay-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="budget-period">
                  {t.budgets.periodLabel}
                </label>
                <Select value={period} onValueChange={(v) => setPeriod(v as BudgetPeriod)}>
                  <SelectTrigger id="budget-period" className="clay-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t.budgets.monthly}</SelectItem>
                    <SelectItem value="weekly">{t.budgets.weekly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="clay-button-primary" onClick={handleCreate} disabled={createBudget.isPending}>
                {createBudget.isPending ? t.common.loading : t.common.save}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                {t.common.cancel}
              </Button>
            </div>
          </div>
        )}

        {/* Budget list */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : !budgetsData || budgetsData.length === 0 ? (
          <EmptyState
            icon="🎯"
            title={t.budgets.empty}
            description={t.budgets.emptyDesc}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {budgetsData.map((b) => {
              const cat = b.category || catMap.get(b.category_id)
              const spent = spentMap[b.id] || 0
              const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0
              const remaining = b.amount - spent
              const start = periodStart(new Date(), b.period)
              const end = periodEnd(new Date(), b.period)

              return (
                <div key={b.id} className="clay-card relative overflow-hidden p-5">
                  <div
                    className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10"
                    style={{ backgroundColor: cat?.color || '#6366F1' }}
                  />
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                        style={{ backgroundColor: `${cat?.color || '#6366F1'}22` }}
                      >
                        {cat?.icon || '📦'}
                      </div>
                      <div>
                        <p className="font-semibold">{cat?.name || '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.period === 'monthly' ? t.budgets.monthly : t.budgets.weekly}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteTarget(b)}
                      aria-label={t.common.delete}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-end justify-between">
                      <span className={`text-xl font-bold tabular-nums ${pct > 100 ? 'text-rose-500' : ''}`}>
                        {displayAmount(spent)}
                      </span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        / {displayAmount(b.amount)}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct > 100 ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatShortDate(start, language)} → {formatShortDate(end, language)}
                      </span>
                      <span className={remaining < 0 ? 'font-semibold text-rose-500' : ''}>
                        {remaining >= 0
                          ? `${t.budgets.remaining}: ${displayAmount(remaining)}`
                          : `${t.budgets.overBy} ${displayAmount(Math.abs(remaining))}`}
                      </span>
                    </div>
                  </div>

                  {pct > 100 && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-rose-500">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {t.budgets.exceeded}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={t.budgets.deleteTitle}
          description={t.budgets.deleteDesc}
          confirmLabel={t.common.delete}
          cancelLabel={t.common.cancel}
          variant="destructive"
        />
      </PullToRefreshWrapper>
    </PageTransition>
  )
}
