import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'
import type { RecurringTransaction, CreateRecurringInput, UUID } from '@/types'
import { getMockRecurring } from '@/mocks/mockRecurring'

const RECURRING_SELECT =
  'id, user_id, wallet_id, category_id, type, amount, description, frequency, interval_count, start_date, end_date, day_of_week, day_of_month, month_of_year, next_due_date, is_active, created_at, updated_at, wallet:wallets!recurring_transactions_wallet_id_fkey(id, name, icon, color), category:categories(id, name, icon, color, type)'

export function useRecurringTransactions() {
  return useQuery({
    queryKey: ['recurring'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockRecurring()
      }

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('recurring_transactions')
        .select(RECURRING_SELECT)
        .eq('user_id', user.id)
        .order('next_due_date', { ascending: true })

      if (error) throw error
      return (data || []) as unknown as RecurringTransaction[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

function invalidateRecurring(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['recurring'] })
}

export function useCreateRecurring() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRecurringInput) => {
      if (!isSupabaseConfigured()) {
        return { id: crypto.randomUUID(), ...input, is_active: true, next_due_date: input.start_date, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as RecurringTransaction
      }

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert({ ...input, user_id: user.id, next_due_date: input.start_date })
        .select(RECURRING_SELECT)
        .single()

      if (error) throw error
      return data as unknown as RecurringTransaction
    },
    onSuccess: () => invalidateRecurring(queryClient),
  })
}

export function useUpdateRecurring() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: UUID } & Partial<CreateRecurringInput> & { is_active?: boolean }) => {
      if (!isSupabaseConfigured()) {
        return { id, ...input }
      }

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('recurring_transactions')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select(RECURRING_SELECT)
        .single()

      if (error) throw error
      return data as unknown as RecurringTransaction
    },
    onSuccess: () => invalidateRecurring(queryClient),
  })
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: UUID) => {
      if (!isSupabaseConfigured()) {
        return { id }
      }

      const user = await requireAuth()

      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return { id }
    },
    onSuccess: () => invalidateRecurring(queryClient),
  })
}
