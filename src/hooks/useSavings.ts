import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'
import type { SavingsGoal, CreateSavingsGoalInput, UpdateSavingsGoalInput, UUID } from '@/types'
import { getMockSavings } from '@/mocks/mockSavings'

export function useSavings() {
  return useQuery({
    queryKey: ['savings'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockSavings()
      }

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('savings_goals')
        .select('id, user_id, name, target_amount, current_amount, deadline, icon, color, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as SavingsGoal[]
    },
    staleTime: 5 * 60 * 1000, // 5 min
  })
}

export function useAddToSavings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: UUID; amount: number }) => {
      if (!isSupabaseConfigured()) {
        return { id: goalId, current_amount: amount }
      }

      const { data, error } = await supabase.rpc('update_savings_progress', {
        p_goal_id: goalId,
        p_amount: amount
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] })
    },
  })
}

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSavingsGoalInput) => {
      if (!isSupabaseConfigured()) {
        return { id: crypto.randomUUID(), ...input, created_at: new Date().toISOString() }
      }

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('savings_goals')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] })
    },
  })
}

export function useUpdateSavingsGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateSavingsGoalInput) => {
      if (!isSupabaseConfigured()) {
        return { id, ...input }
      }

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('savings_goals')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] })
    },
  })
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: UUID) => {
      if (!isSupabaseConfigured()) {
        return { id }
      }

      const user = await requireAuth()

      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return { id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] })
    },
  })
}

