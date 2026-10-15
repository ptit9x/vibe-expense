import type { Budget, Category, Transaction, UUID } from '@/types'

export const BUDGETABLE_TYPE = 'expense' as const

function toLocalISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Local-date 'YYYY-MM-DD' for the first day of the month (or ISO week, Monday-start) containing `d`. */
export function periodStart(d: Date, period: 'monthly' | 'weekly'): string {
  if (period === 'monthly') {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  }
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = (date.getDay() + 6) % 7 // Monday = 0
  date.setDate(date.getDate() - day)
  return toLocalISO(date)
}

/** Local-date 'YYYY-MM-DD' for the last day of the period containing `d`. */
export function periodEnd(d: Date, period: 'monthly' | 'weekly'): string {
  if (period === 'monthly') {
    return toLocalISO(new Date(d.getFullYear(), d.getMonth() + 1, 0))
  }
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = (date.getDay() + 6) % 7 // Monday = 0
  date.setDate(date.getDate() - day + 6)
  return toLocalISO(date)
}

/** Map of category id → the set of ids representing that category AND all its descendants. */
export function categoryDescendantMap(categories: Category[]): Map<UUID, Set<UUID>> {
  const childrenOf = new Map<UUID, UUID[]>()
  for (const c of categories) {
    if (c.parent_id) {
      const list = childrenOf.get(c.parent_id) || []
      list.push(c.id)
      childrenOf.set(c.parent_id, list)
    }
  }
  const result = new Map<UUID, Set<UUID>>()
  const collect = (id: UUID, acc: Set<UUID>): void => {
    for (const child of childrenOf.get(id) || []) {
      if (!acc.has(child)) {
        acc.add(child)
        collect(child, acc)
      }
    }
  }
  for (const c of categories) {
    const acc = new Set<UUID>([c.id])
    collect(c.id, acc)
    result.set(c.id, acc)
  }
  return result
}

/**
 * Compute the amount spent in the CURRENT period for each budget.
 * Period window (monthly = current calendar month, weekly = current week
 * starting Monday) is derived from `now` using LOCAL date methods — no UTC drift.
 * String comparison of 'YYYY-MM-DD' dates is safe across the boundary.
 *
 * A budget set on a PARENT category also counts transactions filed under its
 * subcategories (users pick subcategories in the transaction form).
 */
export function computeBudgetSpent(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  now: Date = new Date()
): Record<UUID, number> {
  const descendants = categoryDescendantMap(categories)
  const spent: Record<UUID, number> = {}
  for (const b of budgets) {
    const start = periodStart(now, b.period)
    const end = periodEnd(now, b.period)
    const allowed = descendants.get(b.category_id) || new Set<UUID>([b.category_id])
    spent[b.id] = transactions
      .filter(
        (t) =>
          t.type === BUDGETABLE_TYPE &&
          (t.category_id ? allowed.has(t.category_id) : false) &&
          t.transaction_date >= start &&
          t.transaction_date <= end
      )
      .reduce((sum, t) => sum + t.amount, 0)
  }
  return spent
}

/** Category lookup map helper. */
export function categoryMap(categories: Category[]): Map<UUID, Category> {
  return new Map(categories.map((c) => [c.id, c]))
}
