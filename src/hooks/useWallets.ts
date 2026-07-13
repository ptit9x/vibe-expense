import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'
import { computeWalletBalances } from '@/lib/walletBalance'
import type { Wallet, CreateWalletInput, UpdateWalletInput } from '@/types'
import { getMockWallets } from '@/mocks/mockWallets'

export function useWallets(includeInactive = false) {
  return useQuery({
    queryKey: ['wallets', includeInactive],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockWallets()
      }

      const user = await requireAuth()

      let query = supabase
        .from('wallets')
        .select('id, user_id, name, type, icon, color, initial_balance, is_active, created_at, updated_at')
        .eq('user_id', user.id)

      // Filter by is_active unless includeInactive is true
      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query.order('created_at', { ascending: true })

      if (error) throw error

      // Note: Default wallet is created during registration via trigger
      if (data.length === 0) {
        return [] as Wallet[]
      }

      // Batch compute balances via shared utility
      return computeWalletBalances(data, user.id)
    },
    staleTime: 5 * 60 * 1000, // 5 min — wallets change rarely
  })
}

export function useCreateWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateWalletInput) => {
      if (!isSupabaseConfigured()) {
        return { id: crypto.randomUUID(), ...input, created_at: new Date().toISOString() }
      }

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('wallets')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
  })
}

export function useUpdateWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateWalletInput) => {
      if (!isSupabaseConfigured()) {
        return { id, ...input }
      }

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('wallets')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
  })
}

export function useDeleteWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (wallet: Wallet) => {
      // Cannot delete default cash wallet (system wallet)
      if (wallet.type === 'cash' && wallet.name === 'Cash') {
        throw new Error('Cannot delete default Cash wallet')
      }

      if (!isSupabaseConfigured()) {
        return { id: wallet.id, deleted: true }
      }

      const user = await requireAuth()

      // Check if wallet has any transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('wallet_id', wallet.id)
        .limit(1)

      // If wallet has transactions, only soft delete (deactivate)
      if (transactions && transactions.length > 0) {
        const { error } = await supabase
          .from('wallets')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', wallet.id)
          .eq('user_id', user.id)

        if (error) throw error
        return { id: wallet.id, deleted: false, deactivated: true }
      }

      // No transactions → allow hard delete
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', wallet.id)
        .eq('user_id', user.id)

      if (error) throw error
      return { id: wallet.id, deleted: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
  })
}

// Toggle wallet active/inactive status
export function useToggleWalletActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (wallet: Wallet) => {
      if (!isSupabaseConfigured()) {
        return { id: wallet.id, is_active: !wallet.is_active }
      }

      const user = await requireAuth()

      const newStatus = !wallet.is_active

      const { error } = await supabase
        .from('wallets')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', wallet.id)
        .eq('user_id', user.id)

      if (error) throw error
      return { id: wallet.id, is_active: newStatus }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
  })
}

