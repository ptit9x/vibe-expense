import { describe, it, expect } from 'vitest'
import { computeBudgetSpent, periodStart, periodEnd, categoryDescendantMap } from '@/lib/budgets'
import type { Budget, Category, Transaction } from '@/types'

// ── fixtures ──────────────────────────────────────────────────────────

const catFood: Category = {
  id: 'food', user_id: null, parent_id: null, name: 'Food', type: 'expense',
  icon: '🍔', color: '#FF6B6B', is_system: true, created_at: '', slug: 'food',
}
const catCoffee: Category = {
  id: 'coffee', user_id: null, parent_id: 'food', name: 'Coffee', type: 'expense',
  icon: '☕', color: '#8B4513', is_system: true, created_at: '', slug: 'coffee',
}
const catIncome: Category = {
  id: 'salary', user_id: null, parent_id: null, name: 'Salary', type: 'income',
  icon: '💰', color: '#2ECC71', is_system: true, created_at: '', slug: 'salary',
}
const categories = [catFood, catCoffee, catIncome]

function txn(partial: Partial<Transaction>): Transaction {
  return {
    id: 't', user_id: 'u', wallet_id: null, to_wallet_id: null, category_id: null,
    type: 'expense', amount: 0, description: null, contact_person: null,
    transaction_date: '2026-10-15', created_at: '', updated_at: '',
    ...partial,
  }
}

// Fixed "now": Friday 2026-10-16 (UTC+7 context irrelevant — local methods only)
const now = new Date(2026, 9, 16) // month 9 = October

// ── period boundaries ─────────────────────────────────────────────────

describe('periodStart / periodEnd', () => {
  it('monthly period spans the whole calendar month', () => {
    expect(periodStart(now, 'monthly')).toBe('2026-10-01')
    expect(periodEnd(now, 'monthly')).toBe('2026-10-31')
  })

  it('weekly period is Monday–Sunday of the current week', () => {
    // 2026-10-16 is a Friday → week runs Mon 12 → Sun 18
    expect(periodStart(now, 'weekly')).toBe('2026-10-12')
    expect(periodEnd(now, 'weekly')).toBe('2026-10-18')
  })

  it('handles a Sunday without spilling into the next week', () => {
    const sunday = new Date(2026, 9, 18)
    expect(periodStart(sunday, 'weekly')).toBe('2026-10-12')
    expect(periodEnd(sunday, 'weekly')).toBe('2026-10-18')
  })
})

// ── descendant map ────────────────────────────────────────────────────

describe('categoryDescendantMap', () => {
  it('maps a parent to itself + all descendants', () => {
    const m = categoryDescendantMap(categories)
    expect(m.get('food')).toEqual(new Set(['food', 'coffee']))
    expect(m.get('coffee')).toEqual(new Set(['coffee']))
  })
})

// ── spent computation ─────────────────────────────────────────────────

describe('computeBudgetSpent', () => {
  const budget: Budget = {
    id: 'b1', user_id: 'u', category_id: 'food', amount: 3_000_000,
    period: 'monthly', start_date: '2026-10-01', end_date: null, created_at: '',
  }

  it('sums same-category expenses inside the period', () => {
    const txns = [
      txn({ id: '1', category_id: 'food', amount: 50_000, transaction_date: '2026-10-02' }),
      txn({ id: '2', category_id: 'food', amount: 30_000, transaction_date: '2026-10-20' }),
    ]
    expect(computeBudgetSpent([budget], txns, categories, now)).toEqual({ b1: 80_000 })
  })

  it('rolls subcategory spending up into the parent budget', () => {
    const txns = [
      txn({ id: '1', category_id: 'coffee', amount: 45_000, transaction_date: '2026-10-05' }),
      txn({ id: '2', category_id: 'food', amount: 55_000, transaction_date: '2026-10-06' }),
    ]
    expect(computeBudgetSpent([budget], txns, categories, now).b1).toBe(100_000)
  })

  it('ignores transactions outside the period window', () => {
    const txns = [
      txn({ id: '1', category_id: 'food', amount: 50_000, transaction_date: '2026-09-30' }),
      txn({ id: '2', category_id: 'food', amount: 70_000, transaction_date: '2026-11-01' }),
    ]
    expect(computeBudgetSpent([budget], txns, categories, now)).toEqual({ b1: 0 })
  })

  it('ignores income transactions filed against the same category id', () => {
    const txns = [txn({ id: '1', category_id: 'food', amount: 50_000, type: 'income' })]
    expect(computeBudgetSpent([budget], txns, categories, now).b1).toBe(0)
  })

  it('weekly budget only counts the current week', () => {
    const weekly: Budget = { ...budget, id: 'b2', period: 'weekly' }
    const txns = [
      txn({ id: '1', category_id: 'food', amount: 10_000, transaction_date: '2026-10-12' }), // Mon, in
      txn({ id: '2', category_id: 'food', amount: 20_000, transaction_date: '2026-10-11' }), // Sun before, out
    ]
    expect(computeBudgetSpent([weekly], txns, categories, now)).toEqual({ b2: 10_000 })
  })

  it('handles empty inputs without crashing', () => {
    expect(computeBudgetSpent([], [], [], now)).toEqual({})
  })
})
