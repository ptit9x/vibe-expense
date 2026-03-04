import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Budget, CreateBudgetInput, UpdateBudgetInput, UUID } from '@/types'

export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockBudgets()
      }

      const { data, error } = await supabase
        .from('budgets')
        .select('*, categories(*)')
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as Budget[]
    },
  })
}

export function useBudgetStatus(budgetId: UUID | null) {
  return useQuery({
    queryKey: ['budgetStatus', budgetId],
    queryFn: async () => {
      if (!budgetId || !isSupabaseConfigured()) {
        return getMockBudgetStatus()
      }

      const { data, error } = await supabase.rpc('get_budget_status', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_budget_id: budgetId
      })

      if (error) throw error
      return data
    },
    enabled: !!budgetId,
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateBudgetInput) => {
      if (!isSupabaseConfigured()) {
        return { id: crypto.randomUUID(), ...input, created_at: new Date().toISOString() }
      }

      const { data, error } = await supabase
        .from('budgets')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateBudgetInput) => {
      if (!isSupabaseConfigured()) {
        return { id, ...input }
      }

      const { data, error } = await supabase
        .from('budgets')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budgetStatus'] })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: UUID) => {
      if (!isSupabaseConfigured()) {
        return { id }
      }

      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budgetStatus'] })
    },
  })
}

// Mock data
function getMockBudgets(): Budget[] {
  return [
    {
      id: 'b1',
      user_id: 'user1',
      category_id: 'c1',
      amount: 5000000,
      period: 'monthly',
      start_date: '2026-04-01',
      end_date: '2026-04-30',
      created_at: new Date().toISOString(),
      categories: {
        id: 'c1',
        user_id: null,
        name: 'Food',
        type: 'expense',
        icon: '🍔',
        color: '#EF4444',
        parent_id: null,
        is_system: true,
        created_at: new Date().toISOString()
      }
    },
    {
      id: 'b2',
      user_id: 'user1',
      category_id: 'c2',
      amount: 2000000,
      period: 'monthly',
      start_date: '2026-04-01',
      end_date: '2026-04-30',
      created_at: new Date().toISOString(),
      categories: {
        id: 'c2',
        user_id: null,
        name: 'Transport',
        type: 'expense',
        icon: '🚗',
        color: '#F59E0B',
        parent_id: null,
        is_system: true,
        created_at: new Date().toISOString()
      }
    },
  ]
}

function getMockBudgetStatus() {
  return {
    budget_amount: 5000000,
    spent: 3200000,
    remaining: 1800000,
    percentage: 64
  }
}