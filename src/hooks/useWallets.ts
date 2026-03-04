import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Wallet, CreateWalletInput, UpdateWalletInput } from '@/types'

const DEFAULT_WALLET = {
  name: 'Cash',
  type: 'cash' as const,
  icon: '💵',
  color: '#3B82F6',
  initial_balance: 0,
}

export function useWallets() {
  return useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockWallets()
      }

      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      // If no wallets, create default Cash wallet
      if (data.length === 0) {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert(DEFAULT_WALLET)
          .select()
          .single()
        
        if (createError) throw createError
        return [{ ...newWallet, balance: newWallet.initial_balance }] as Wallet[]
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

      const { data, error } = await supabase
        .from('wallets')
        .insert(input)
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

      const { data, error } = await supabase
        .from('wallets')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
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
      // Cannot delete default cash wallet
      if (wallet.type === 'cash' && wallet.name === 'Cash') {
        throw new Error('Cannot delete default Cash wallet')
      }

      if (!isSupabaseConfigured()) {
        return { id: wallet.id }
      }

      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', wallet.id)

      if (error) throw error
      return { id: wallet.id }
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}