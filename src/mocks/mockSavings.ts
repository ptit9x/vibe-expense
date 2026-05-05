import type { SavingsGoal } from '@/types'

// Mock data
export function getMockSavings(): SavingsGoal[] {
  return [
    {
      id: 's1',
      user_id: 'user1',
      name: 'Emergency Fund',
      target_amount: 20000000,
      current_amount: 8500000,
      deadline: '2026-12-31',
      icon: '🚨',
      color: '#EF4444',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 's2',
      user_id: 'user1',
      name: 'Vacation',
      target_amount: 15000000,
      current_amount: 5000000,
      deadline: '2026-06-30',
      icon: '✈️',
      color: '#10B981',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 's3',
      user_id: 'user1',
      name: 'New Phone',
      target_amount: 8000000,
      current_amount: 3000000,
      deadline: null,
      icon: '📱',
      color: '#3B82F6',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}
