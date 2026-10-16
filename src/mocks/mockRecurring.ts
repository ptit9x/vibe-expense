import type { RecurringTransaction } from '@/types'
import { periodStart } from '@/lib/budgets'

const today = new Date()

function daysFromNow(n: number): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getMockRecurring(): RecurringTransaction[] {
  return [
    {
      id: 'r1',
      user_id: 'u1',
      wallet_id: '1',
      category_id: '3', // Housing
      type: 'expense',
      amount: 4500000,
      description: 'Tiền nhà',
      frequency: 'monthly',
      interval_count: 1,
      start_date: periodStart(today, 'monthly'),
      end_date: null,
      day_of_week: null,
      day_of_month: 1,
      month_of_year: null,
      next_due_date: daysFromNow(6),
      is_active: true,
      created_at: '',
      updated_at: '',
      wallet: { id: '1', name: 'Cash', icon: '💰', color: '#3B82F6' },
      category: { id: '3', user_id: null, name: 'Housing', type: 'expense', icon: '🏠', color: '#45B7D1', parent_id: null, is_system: true, created_at: '' },
    },
    {
      id: 'r2',
      user_id: 'u1',
      wallet_id: '1',
      category_id: null,
      type: 'income',
      amount: 25000000,
      description: 'Lương',
      frequency: 'monthly',
      interval_count: 1,
      start_date: periodStart(today, 'monthly'),
      end_date: null,
      day_of_week: null,
      day_of_month: 5,
      month_of_year: null,
      next_due_date: daysFromNow(10),
      is_active: true,
      created_at: '',
      updated_at: '',
      wallet: { id: '1', name: 'Cash', icon: '💰', color: '#3B82F6' },
      category: null as unknown as RecurringTransaction['category'],
    },
    {
      id: 'r3',
      user_id: 'u1',
      wallet_id: '1',
      category_id: '4', // Entertainment
      type: 'expense',
      amount: 260000,
      description: 'Netflix',
      frequency: 'monthly',
      interval_count: 1,
      start_date: periodStart(today, 'monthly'),
      end_date: null,
      day_of_week: null,
      day_of_month: 12,
      month_of_year: null,
      next_due_date: daysFromNow(-2), // overdue → catch-up demo
      is_active: true,
      created_at: '',
      updated_at: '',
      wallet: { id: '1', name: 'Cash', icon: '💰', color: '#3B82F6' },
      category: { id: '4', user_id: null, name: 'Entertainment', type: 'expense', icon: '🎮', color: '#96CEB4', parent_id: null, is_system: true, created_at: '' },
    },
  ]
}
