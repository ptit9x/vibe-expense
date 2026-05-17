import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'
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

      // Batch compute balances — single query instead of N+1 RPC calls
      const walletIds = data.map(w => w.id)
      const { data: txData } = await supabase
        .from('transactions')
        .select('wallet_id, to_wallet_id, type, amount')
        .in('wallet_id', walletIds)
        .eq('user_id', user.id)

      // Build balance map
      const balanceMap = new Map<string, number>()
      for (const tx of (txData || [])) {
        const wId = tx.wallet_id
        const prev = balanceMap.get(wId) || 0
        if (tx.type === 'income' || tx.type === 'borrow') {
          balanceMap.set(wId, prev + tx.amount)
        } else if (tx.type === 'expense' || tx.type === 'lend' || tx.type === 'transfer') {
          balanceMap.set(wId, prev - tx.amount)
        }
      }

      // Also credit destination wallets for transfers
      const { data: transferData } = await supabase
        .from('transactions')
        .select('to_wallet_id, amount')
        .in('to_wallet_id', walletIds)
        .eq('user_id', user.id)
        .eq('type', 'transfer')

      for (const tx of (transferData || [])) {
        if (tx.to_wallet_id) {
          const prev = balanceMap.get(tx.to_wallet_id) || 0
          balanceMap.set(tx.to_wallet_id, prev + tx.amount)
        }
      }

      const walletsWithBalance = data.map(wallet => ({
        ...wallet,
        balance: (balanceMap.get(wallet.id) || 0) + (wallet.initial_balance || 0),
      }))

      return walletsWithBalance as Wallet[]
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

