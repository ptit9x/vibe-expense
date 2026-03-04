import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { 
  Transaction, CreateTransactionInput, UpdateTransactionInput, UUID 
} from '@/types'

// Fetch all transactions for current user
export function useTransactions(month?: string) {
  return useQuery({
    queryKey: ['transactions', month],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockTransactions(month)
      }
      
      let query = supabase
        .from('transactions')
        .select('*, wallet:wallets(id, name, icon, color), category:categories(id, name, icon, color)')
        .order('transaction_date', { ascending: false })

      if (month) {
        query = query.like('transaction_date', `${month}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Transaction[]
    },
  })
}

// Create transaction
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      if (!isSupabaseConfigured()) {
        return { id: crypto.randomUUID(), ...input, created_at: new Date().toISOString() }
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(input)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Update transaction
export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTransactionInput) => {
      if (!isSupabaseConfigured()) {
        return { id, ...input }
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Delete transaction
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: UUID) => {
      if (!isSupabaseConfigured()) {
        return { id }
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// Mock data for development
function getMockTransactions(month?: string) {
  const now = new Date()
  const currentMonth = month || now.toISOString().slice(0, 7)
  
  return [
    {
      id: '1',
      user_id: 'user1',
      wallet_id: 'w1',
      category_id: 'c1',
      type: 'expense' as const,
      amount: 150000,
      description: 'Cơm trưa công ty',
      transaction_date: `${currentMonth}-15`,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      wallet: { id: 'w1', name: 'Ví tiền mặt', icon: '💰', color: '#3B82F6' },
      category: { id: 'c1', name: '🍔 Ăn uống', icon: '🍔', color: '#EF4444' },
    },
    {
      id: '2',
      user_id: 'user1',
      wallet_id: 'w1',
      category_id: 'c2',
      type: 'expense' as const,
      amount: 45000,
      description: 'Grab đi làm',
      transaction_date: `${currentMonth}-14`,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      wallet: { id: 'w1', name: 'Ví tiền mặt', icon: '💰', color: '#3B82F6' },
      category: { id: 'c2', name: '🚗 Di chuyển', icon: '🚗', color: '#F59E0B' },
    },
    {
      id: '3',
      user_id: 'user1',
      wallet_id: 'w2',
      category_id: 'c9',
      type: 'income' as const,
      amount: 25000000,
      description: 'Lương tháng',
      transaction_date: `${currentMonth}-10`,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      wallet: { id: 'w2', name: 'Thẻ MB Bank', icon: '🏦', color: '#10B981' },
      category: { id: 'c9', name: '💵 Lương', icon: '💵', color: '#10B981' },
    },
    {
      id: '4',
      user_id: 'user1',
      wallet_id: 'w1',
      category_id: 'c3',
      type: 'expense' as const,
      amount: 599000,
      description: 'Áo phông mới',
      transaction_date: `${currentMonth}-12`,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      wallet: { id: 'w1', name: 'Ví tiền mặt', icon: '💰', color: '#3B82F6' },
      category: { id: 'c3', name: '🛒 Mua sắm', icon: '🛒', color: '#8B5CF6' },
    },
  ] as Transaction[]
}