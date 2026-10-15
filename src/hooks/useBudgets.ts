import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'
import type { Budget, BudgetPeriod, CreateBudgetInput, UUID } from '@/types'
import { getMockBudgets } from '@/mocks/mockBudgets'

const BUDGET_SELECT = 'id, user_id, category_id, amount, period, start_date, end_date, created_at, category:categories(id, name, icon, color, type)'

function fallbackBudgets(): Budget[] {
  return getMockBudgets()
}

export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return fallbackBudgets()
      }

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('budgets')
        .select(BUDGET_SELECT)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data || []) as unknown as Budget[]
    },
    staleTime: 2 * 60 * 1000, // 2 min — budget rows change rarely, spent is computed client-side
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateBudgetInput) => {
      if (!isSupabaseConfigured()) {
        return { id: crypto.randomUUID(), ...input, created_at: new Date().toISOString() } as Budget
      }

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('budgets')
        .insert({ ...input, user_id: user.id })
        .select(BUDGET_SELECT)
        .single()

      if (error) throw error
      return data as unknown as Budget
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: UUID } & Partial<CreateBudgetInput>) => {
      if (!isSupabaseConfigured()) {
        return { id, ...input }
      }

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('budgets')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(BUDGET_SELECT)
        .single()

      if (error) throw error
      return data as unknown as Budget
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
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

      const user = await requireAuth()

      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return { id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export type { BudgetPeriod }
