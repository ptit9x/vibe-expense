import type { Wallet } from '@/types'

// Mock data
export function getMockWallets(): Wallet[] {
  return [
    {
      id: 'w1',
      user_id: 'user1',
      name: 'Cash',
      type: 'cash' as const,
      icon: '💵',
      color: '#3B82F6',
      initial_balance: 2000000,
      balance: 3500000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'w2',
      user_id: 'user1',
      name: 'MB Bank',
      type: 'bank' as const,
      icon: '🏦',
      color: '#10B981',
      initial_balance: 50000000,
      balance: 47850000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'w3',
      user_id: 'user1',
      name: 'Momo',
      type: 'e_wallet' as const,
      icon: '📱',
      color: '#A855F7',
      initial_balance: 0,
      balance: 750000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}
