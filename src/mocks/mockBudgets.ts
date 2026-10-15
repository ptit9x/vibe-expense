import type { Budget } from '@/types'
import { periodStart } from '@/lib/budgets'

// Mock budgets for development (dev-only, mirrors DB schema shape)
const today = new Date()

export function getMockBudgets(): Budget[] {
  return [
    {
      id: 'b1',
      user_id: 'u1',
      category_id: '1', // Food mock id
      amount: 4000000,
      period: 'monthly',
      start_date: periodStart(today, 'monthly'),
      end_date: null,
      created_at: '',
    },
    {
      id: 'b2',
      user_id: 'u1',
      category_id: '2', // Transport mock id
      amount: 1000000,
      period: 'weekly',
      start_date: periodStart(today, 'weekly'),
      end_date: null,
      created_at: '',
    },
  ]
}
