import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { 
  Transaction, CreateTransactionInput, UpdateTransactionInput, UUID 
} from '@/types'

// Fetch all transactions for current user
export function useTransactions(month?: string, walletId?: string) {
  return useQuery({
    queryKey: ['transactions', month, walletId],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockTransactions(month)
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      let query = supabase
        .from('transactions')
        .select('*, wallet:wallets(id, name, icon, color), category:categories(id, name, icon, color)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })

      if (month) {
        // month = 'YYYY-MM', filter from 1st to end of month
        const [year, mon] = month.split('-').map(Number)
        const nextMonth = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, '0')}`
        query = query
          .gte('transaction_date', `${month}-01`)
          .lt('transaction_date', `${nextMonth}-01`)
      }

      if (walletId) {
        query = query.eq('wallet_id', walletId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Transaction[]
    },
  })
}

// Fetch single transaction by ID
export function useTransaction(id: string | undefined) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      if (!id) throw new Error('No ID')

      if (!isSupabaseConfigured()) {
        const mocks = getMockTransactions()
        return mocks.find(t => t.id === id) || null
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('transactions')
        .select('*, wallet:wallets(id, name, icon, color), category:categories(id, name, icon, color)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data as Transaction
    },
    enabled: !!id,
  })
}

// Fetch transactions for a whole year, optionally filtered by type
export function useYearTransactions(year: number, type?: 'income' | 'expense') {
  return useQuery({
    queryKey: ['transactions', 'year', year, type],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockTransactions().filter(t => {
          if (type && t.type !== type) return false
          return true
        })
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let query = supabase
        .from('transactions')
        .select('*, wallet:wallets(id, name, icon, color), category:categories(id, name, icon, color)')
        .eq('user_id', user.id)
        .gte('transaction_date', `${year}-01-01`)
        .lt('transaction_date', `${year + 1}-01-01`)
        .order('transaction_date', { ascending: false })

      if (type) {
        query = query.eq('type', type)
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

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...input, user_id: user.id })
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

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('transactions')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
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

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      
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