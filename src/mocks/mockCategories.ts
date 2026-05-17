import type { Category, TransactionType } from '@/types'

// Mock categories for development
export function getMockCategories(type?: TransactionType): Category[] {
  const mockData = [
    { id: '1', name: 'Food', icon: '🍔', color: '#FF6B6B', type: 'expense' as const, slug: 'food' },
    { id: '2', name: 'Transport', icon: '🚗', color: '#4ECDC4', type: 'expense' as const, slug: 'transport' },
    { id: '3', name: 'Housing', icon: '🏠', color: '#45B7D1', type: 'expense' as const, slug: 'housing' },
    { id: '4', name: 'Entertainment', icon: '🎮', color: '#96CEB4', type: 'expense' as const, slug: 'entertainment' },
    { id: '5', name: 'Shopping', icon: '🛒', color: '#FFEAA7', type: 'expense' as const, slug: 'shopping' },
    { id: '6', name: 'Health', icon: '💊', color: '#DDA0DD', type: 'expense' as const, slug: 'health' },
    { id: '7', name: 'Other', icon: '📦', color: '#95A5A6', type: 'expense' as const, slug: 'other-expense' },
    { id: '8', name: 'Lend', icon: '🤝', color: '#E74C3C', type: 'expense' as const, slug: 'lend' },
    { id: '10', name: 'Repay Debt', icon: '💳', color: '#C0392B', type: 'expense' as const, slug: 'repay-debt' },
    { id: '101', name: 'Salary', icon: '💰', color: '#2ECC71', type: 'income' as const, slug: 'salary' },
    { id: '102', name: 'Gift', icon: '🎁', color: '#9B59B6', type: 'income' as const, slug: 'gift' },
    { id: '103', name: 'Investment', icon: '📈', color: '#3498DB', type: 'income' as const, slug: 'investment' },
    { id: '104', name: 'Borrow', icon: '📋', color: '#8E44AD', type: 'income' as const, slug: 'borrow' },
    { id: '105', name: 'Collect Debt', icon: '💵', color: '#27AE60', type: 'income' as const, slug: 'collect-debt' },
  ]

  const all = mockData.map(cat => ({
    ...cat,
    user_id: null,
    parent_id: null,
    is_system: true,
    created_at: '',
  }))

  if (!type) return all
  return all.filter(c => c.type === type)
}
