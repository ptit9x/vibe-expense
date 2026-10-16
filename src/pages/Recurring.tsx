import { useMemo, useState } from 'react'
import { Plus, Trash2, Power, CalendarClock, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useRecurringTransactions, useCreateRecurring, useUpdateRecurring, useDeleteRecurring } from '@/hooks/useRecurringTransactions'
import { useWallets } from '@/hooks/useWallets'
import { useCategories } from '@/hooks/useCategories'
import { useI18n } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { useUIStore } from '@/stores/uiStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import PageHeader from '@/components/PageHeader'
import { PullToRefreshWrapper, PageTransition, EmptyState, SkeletonCard } from '@/components/shared'
import { toast } from 'sonner'
import type { RecurringTransaction, RecurringFrequency, Category, Wallet } from '@/types'

type TxnType = 'income' | 'expense'

const FREQUENCIES: RecurringFrequency[] = ['daily', 'weekly', 'monthly', 'yearly']
const WEEKDAYS_SHORT: Record<number, string> = { 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7', 0: 'CN' }

function toLocalISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Human label for the schedule, e.g. "Hàng tháng, ngày 1" / "Hàng tuần, T2". */
function scheduleLabel(r: RecurringTransaction, t: ReturnType<typeof useI18n>['t']): string {
  const freq =
    r.interval_count > 1
      ? `${t.recurring.every} ${r.interval_count} ${t.recurring['freq' + r.frequency.charAt(0).toUpperCase() + r.frequency.slice(1) as 'freqDaily']}`
      : t.recurring[r.frequency]
  let anchor = ''
  if (r.frequency === 'weekly' && r.day_of_week !== null) anchor = `, ${WEEKDAYS_SHORT[r.day_of_week]}`
  if (r.frequency === 'monthly' && r.day_of_month !== null) anchor = `, ${t.recurring.day} ${r.day_of_month}`
  if (r.frequency === 'yearly' && r.day_of_month !== null && r.month_of_year !== null) {
    anchor = `, ${r.day_of_month}/${r.month_of_year}`
  }
  return `${freq}${anchor}`
}

export default function Recurring() {
  const { t, language } = useI18n()
  const displayAmount = useUIStore((s) => s.displayAmount)

  const { data: recurring, isLoading, refetch } = useRecurringTransactions()
  const { data: wallets } = useWallets(false)
  const { data: allCategories } = useCategories()

  const createRecurring = useCreateRecurring()
  const updateRecurring = useUpdateRecurring()
  const deleteRecurring = useDeleteRecurring()

  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<TxnType>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [walletId, setWalletId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [deleteTarget, setDeleteTarget] = useState<RecurringTransaction | null>(null)

  const walletsData = (wallets || []) as Wallet[]
  const categoriesData = useMemo(
    () => ((allCategories || []) as Category[]).filter((c) => c.type === type),
    [allCategories, type]
  )

  const monthlyOutlook = useMemo(() => {
    const list = (recurring || []).filter((r) => r.is_active)
    const perMonth = (r: RecurringTransaction): number => {
      switch (r.frequency) {
        case 'daily': return r.amount * 30 / Math.max(r.interval_count, 1)
        case 'weekly': return r.amount * 4.33 / Math.max(r.interval_count, 1)
        case 'monthly': return r.amount / Math.max(r.interval_count, 1)
        case 'yearly': return r.amount / 12 / Math.max(r.interval_count, 1)
      }
    }
    const income = list.filter((r) => r.type === 'income').reduce((s, r) => s + perMonth(r), 0)
    const expense = list.filter((r) => r.type === 'expense').reduce((s, r) => s + perMonth(r), 0)
    return { income, expense }
  }, [recurring])

  const handleCreate = () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      toast.error(t.recurring.amountMustBePositive)
      return
    }
    if (!walletId) {
      toast.error(t.recurring.selectWalletFirst)
      return
    }
    const dom = frequency === 'monthly' ? Math.min(Math.max(parseInt(dayOfMonth) || 1, 1), 31) : null
    createRecurring.mutate(
      {
        type,
        amount: amt,
        description: description.trim() || null,
        wallet_id: walletId,
        category_id: categoryId || null,
        frequency,
        interval_count: 1,
        start_date: toLocalISO(new Date()),
        day_of_month: dom,
      },
      {
        onSuccess: () => {
          toast.success(t.recurring.created)
          setShowForm(false)
          setAmount('')
          setDescription('')
          setCategoryId('')
        },
        onError: (err) => toast.error(err.message || t.common.error),
      }
    )
  }

  const toggleActive = (r: RecurringTransaction) => {
    updateRecurring.mutate(
      { id: r.id, is_active: !r.is_active },
      {
        onError: (err) => toast.error(err.message || t.common.error),
      }
    )
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteRecurring.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(t.recurring.deleted)
        setDeleteTarget(null)
      },
      onError: (err) => toast.error(err.message || t.common.error),
    })
  }

  const list = recurring || []

  return (
    <PageTransition>
      <PullToRefreshWrapper className="flex flex-col gap-6 p-4 lg:p-8" onRefresh={async () => { await refetch() }}>
        {/* Header */}
        <PageHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{t.recurring.title}</h1>
              <p className="text-sm text-white/70">{t.recurring.subtitle}</p>
            </div>
            <Button className="clay-button-primary" onClick={() => setShowForm((v) => !v)}>
              <Plus className="mr-1 h-4 w-4" />
              {t.recurring.add}
            </Button>
          </div>
        </PageHeader>

        {/* Monthly outlook */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="clay-card flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.recurring.monthlyIncome}</p>
              <p className="text-lg font-bold tabular-nums text-emerald-600">{displayAmount(monthlyOutlook.income)}</p>
            </div>
          </div>
          <div className="clay-card flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.recurring.monthlyExpense}</p>
              <p className="text-lg font-bold tabular-nums text-rose-600">{displayAmount(monthlyOutlook.expense)}</p>
            </div>
          </div>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="clay-card space-y-4 p-5">
            <h2 className="text-base font-semibold">{t.recurring.createNew}</h2>

            {/* type toggle */}
            <div className="grid grid-cols-2 gap-2">
              {(['expense', 'income'] as TxnType[]).map((ty) => (
                <button
                  key={ty}
                  type="button"
                  onClick={() => { setType(ty); setCategoryId('') }}
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                    type === ty
                      ? ty === 'expense'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                        : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {ty === 'expense' ? t.recurring.expense : t.recurring.income}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="rec-amount">{t.recurring.amountLabel}</label>
                <Input id="rec-amount" type="number" inputMode="numeric" placeholder="VD: 3000000" value={amount} onChange={(e) => setAmount(e.target.value)} className="clay-input" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="rec-desc">{t.recurring.descLabel}</label>
                <Input id="rec-desc" placeholder={t.recurring.descPlaceholder} value={description} onChange={(e) => setDescription(e.target.value)} className="clay-input" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="rec-wallet">{t.recurring.wallet}</label>
                <Select value={walletId} onValueChange={setWalletId}>
                  <SelectTrigger id="rec-wallet" className="clay-input"><SelectValue placeholder={t.recurring.selectWallet} /></SelectTrigger>
                  <SelectContent>
                    {walletsData.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        <span className="mr-2">{w.icon}</span>{w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="rec-cat">{t.recurring.category}</label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="rec-cat" className="clay-input"><SelectValue placeholder={t.common.noData} /></SelectTrigger>
                  <SelectContent>
                    {categoriesData.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="mr-2">{c.icon}</span>{c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="rec-freq">{t.recurring.frequencyLabel}</label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringFrequency)}>
                  <SelectTrigger id="rec-freq" className="clay-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f} value={f}>{t.recurring[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {frequency === 'monthly' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="rec-dom">{t.recurring.dayOfMonthLabel}</label>
                  <Input id="rec-dom" type="number" min={1} max={31} value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="clay-input" />
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">{t.recurring.autoNote}</p>
            <div className="flex gap-2">
              <Button className="clay-button-primary" onClick={handleCreate} disabled={createRecurring.isPending}>
                {createRecurring.isPending ? t.common.loading : t.common.save}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>{t.common.cancel}</Button>
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>
        ) : list.length === 0 ? (
          <EmptyState icon="🔁" title={t.recurring.empty} description={t.recurring.emptyDesc} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((r) => {
              const overdue = r.is_active && r.next_due_date < toLocalISO(new Date())
              return (
                <div key={r.id} className={`clay-card relative overflow-hidden p-5 ${!r.is_active ? 'opacity-55' : ''}`}>
                  <div
                    className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10"
                    style={{ backgroundColor: r.type === 'income' ? '#10B981' : (r.category?.color || '#F43F5E') }}
                  />
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${r.type === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}
                      >
                        {r.category?.icon || (r.type === 'income' ? '💰' : '💸')}
                      </div>
                      <div>
                        <p className="font-semibold">{r.description || r.category?.name || t.recurring.transaction}</p>
                        <p className="text-xs text-muted-foreground">{scheduleLabel(r, t)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleActive(r)}
                        aria-label={t.recurring.toggle}
                        className={`rounded-lg p-1.5 transition-colors hover:bg-muted ${r.is_active ? 'text-emerald-500' : 'text-muted-foreground'}`}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        aria-label={t.common.delete}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className={`text-xl font-bold tabular-nums ${r.type === 'income' ? 'text-emerald-600' : ''}`}>
                        {r.type === 'income' ? '+' : '−'}{displayAmount(r.amount)}
                      </p>
                      {r.wallet && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className="mr-1">{r.wallet.icon}</span>{r.wallet.name}
                        </p>
                      )}
                    </div>
                    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${overdue ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                      <CalendarClock className="h-3.5 w-3.5" />
                      {t.recurring.nextDue}: {new Date(r.next_due_date + 'T00:00:00').toLocaleDateString(getLocale(language), { day: 'numeric', month: 'short' })}
                      {overdue && <span className="font-semibold">· {t.recurring.overdue}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={t.recurring.deleteTitle}
          description={t.recurring.deleteDesc}
          confirmLabel={t.common.delete}
          cancelLabel={t.common.cancel}
          variant="destructive"
        />
      </PullToRefreshWrapper>
    </PageTransition>
  )
}
