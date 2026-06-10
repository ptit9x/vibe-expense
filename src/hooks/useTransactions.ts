import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'
import type { 
  Transaction, CreateTransactionInput, UpdateTransactionInput, UUID 
} from '@/types'
import { getMockTransactions } from '@/mocks/mockTransactions'

const TRANSACTION_SELECT = '*, wallet:wallets!transactions_wallet_id_fkey(id, name, icon, color), to_wallet:wallets!transactions_to_wallet_id_fkey(id, name, icon, color), category:categories(id, name, icon, color)'

// Fetch all transactions for current user, optionally filtered by month
// When month is null, fetches last 12 months by default
export function useTransactions(month?: string | null, walletId?: string) {
  return useQuery({
    queryKey: ['transactions', month ?? 'all', walletId],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockTransactions(month ?? undefined)
      }
      
      const user = await requireAuth()
      
      let query = supabase
        .from('transactions')
        .select(TRANSACTION_SELECT)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })

      if (month) {
        // month = 'YYYY-MM', filter from 1st to end of month
        const [year, mon] = month.split('-').map(Number)
        const nextMonth = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, '0')}`
        query = query
          .gte('transaction_date', `${month}-01`)
          .lt('transaction_date', `${nextMonth}-01`)
      } else {
        // No month filter: fetch last 12 months
        const now = new Date()
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
        const startDate = twelveMonthsAgo.toISOString().slice(0, 10)
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10)
        query = query
          .gte('transaction_date', startDate)
          .lt('transaction_date', endDate)
      }

      if (walletId) {
        query = query.eq('wallet_id', walletId)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Transaction[]
    },
    staleTime: 1 * 60 * 1000, // 1 min
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

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('transactions')
        .select(TRANSACTION_SELECT)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data as Transaction
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 min
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

      const user = await requireAuth()

      let query = supabase
        .from('transactions')
        .select(TRANSACTION_SELECT)
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
    staleTime: 2 * 60 * 1000, // 2 min
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

      const user = await requireAuth()

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

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('transactions')
        .update({ ...input, updated_at: new Date().toISOString() })
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

      const user = await requireAuth()

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

