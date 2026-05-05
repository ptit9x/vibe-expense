import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { SavingsGoal, CreateSavingsGoalInput, UpdateSavingsGoalInput, UUID } from '@/types'

export function useSavings() {
  return useQuery({
    queryKey: ['savings'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockSavings()
      }

      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as SavingsGoal[]
    },
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

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

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

      const { data, error } = await supabase
        .from('savings_goals')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
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

      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] })
    },
  })
}

// Mock data
function getMockSavings(): SavingsGoal[] {
  return [
    {
      id: 's1',
      user_id: 'user1',
      name: 'Emergency Fund',
      target_amount: 20000000,
      current_amount: 8500000,
      deadline: '2026-12-31',
      icon: '🚨',
      color: '#EF4444',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 's2',
      user_id: 'user1',
      name: 'Vacation',
      target_amount: 15000000,
      current_amount: 5000000,
      deadline: '2026-06-30',
      icon: '✈️',
      color: '#10B981',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 's3',
      user_id: 'user1',
      name: 'New Phone',
      target_amount: 8000000,
      current_amount: 3000000,
      deadline: null,
      icon: '📱',
      color: '#3B82F6',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}