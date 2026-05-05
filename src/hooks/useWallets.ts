import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Wallet, CreateWalletInput, UpdateWalletInput } from '@/types'

export function useWallets(includeInactive = false) {
  return useQuery({
    queryKey: ['wallets', includeInactive],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockWallets()
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let query = supabase
        .from('wallets')
        .select('*')
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

      // Get balance for each wallet using RPC
      const walletsWithBalance = await Promise.all(
        data.map(async (wallet) => {
          const { data: balanceData } = await supabase.rpc('get_wallet_balance', {
            p_wallet_id: wallet.id
          })
          return { ...wallet, balance: parseFloat(balanceData) || wallet.initial_balance }
        })
      )

      return walletsWithBalance as Wallet[]
    },
  })
}

export function useCreateWallet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateWalletInput) => {
      if (!isSupabaseConfigured()) {
        return { id: crypto.randomUUID(), ...input, created_at: new Date().toISOString() }
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      console.log('[DEBUG] useCreateWallet input:', input)

      const { data, error } = await supabase
        .from('wallets')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()

      console.log('[DEBUG] useCreateWallet result:', { data, error })
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

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

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
          .eq('user_id', wallet.user_id)

        if (error) throw error
        return { id: wallet.id, deleted: false, deactivated: true }
      }

      // No transactions → allow hard delete
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', wallet.id)
        .eq('user_id', wallet.user_id)

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

      const newStatus = !wallet.is_active

      const { error } = await supabase
        .from('wallets')
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq('id', wallet.id)
        .eq('user_id', wallet.user_id)

      if (error) throw error
      return { id: wallet.id, is_active: newStatus }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
  })
}

// Mock data
function getMockWallets(): Wallet[] {
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