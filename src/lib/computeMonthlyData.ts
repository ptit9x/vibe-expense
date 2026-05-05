import type { Transaction } from '@/types'
import type { MonthlyData } from '@/components/shared'

export interface LocaleMap {
  [language: string]: string
}

/**
 * Compute monthly income/expense data for charting.
 *
 * @param transactions - Array of transactions to aggregate
 * @param numMonths   - How many months back to include (default 6)
 * @param locale      - A BCP-47 locale string (e.g. 'vi-VN', 'en-US') or a simple month-prefix function.
 *                      If a locale is provided the month label is formatted via Intl.DateTimeFormat.
 *                      If omitted, labels fall back to `T{1-12}` Vietnamese shorthand.
 */
export function computeMonthlyData(
  transactions: Transaction[],
  numMonths: number = 6,
  locale?: string,
): MonthlyData[] {
  const months: MonthlyData[] = []
  for (let i = numMonths - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthKey = d.toISOString().slice(0, 7)

    const monthLabel = locale
      ? new Intl.DateTimeFormat(locale, { month: 'short' }).format(d)
      : `T${d.getMonth() + 1}`

    const monthTransactions = (transactions ?? []).filter(t =>
      t.transaction_date?.startsWith(monthKey),
    )

    const income = monthTransactions
      .filter(t => t.type === 'income' || t.type === 'borrow')
      .reduce((s, t) => s + Number(t.amount), 0)

    const expense = monthTransactions
      .filter(t => t.type === 'expense' || t.type === 'lend')
      .reduce((s, t) => s + Number(t.amount), 0)

    months.push({ month: monthLabel, income, expense })
  }
  return months
}
