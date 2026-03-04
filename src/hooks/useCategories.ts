import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Category, CreateCategoryInput, TransactionType } from '@/types'

// Fetch all categories (system + user)
export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockCategories(type)
      }

      let query = supabase
        .from('categories')
        .select('*')
        .or('user_id.is_null,user_id.eq.auth.uid()')

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Category[]
    },
  })
}

// Create custom category
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      if (!isSupabaseConfigured()) {
        return { id: crypto.randomUUID(), ...input, created_at: new Date().toISOString() }
      }

      const { data, error } = await supabase
        .from('categories')
        .insert(input)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

// Delete custom category
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured()) {
        return { id }
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .neq('is_system', true) // Can't delete system categories

      if (error) throw error
      return { id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

// Mock data
function getMockCategories(type?: TransactionType): Category[] {
  const all: Category[] = [
    // Expense
    { id: 'c1', user_id: null, name: '🍔 Ăn uống', type: 'expense', icon: '🍔', color: '#EF4444', parent_id: null, is_system: true, created_at: '' },
    { id: 'c2', user_id: null, name: '🚗 Di chuyển', type: 'expense', icon: '🚗', color: '#F59E0B', parent_id: null, is_system: true, created_at: '' },
    { id: 'c3', user_id: null, name: '🛒 Mua sắm', type: 'expense', icon: '🛒', color: '#8B5CF6', parent_id: null, is_system: true, created_at: '' },
    { id: 'c4', user_id: null, name: '🏠 Nhà cửa', type: 'expense', icon: '🏠', color: '#10B981', parent_id: null, is_system: true, created_at: '' },
    { id: 'c5', user_id: null, name: '💊 Y tế', type: 'expense', icon: '💊', color: '#EC4899', parent_id: null, is_system: true, created_at: '' },
    { id: 'c6', user_id: null, name: '🎮 Giải trí', type: 'expense', icon: '🎮', color: '#06B6D4', parent_id: null, is_system: true, created_at: '' },
    { id: 'c7', user_id: null, name: '📚 Học tập', type: 'expense', icon: '📚', color: '#6366F1', parent_id: null, is_system: true, created_at: '' },
    { id: 'c8', user_id: null, name: '💰 Khác', type: 'expense', icon: '💰', color: '#6B7280', parent_id: null, is_system: true, created_at: '' },
    // Income
    { id: 'c9', user_id: null, name: '💵 Lương', type: 'income', icon: '💵', color: '#10B981', parent_id: null, is_system: true, created_at: '' },
    { id: 'c10', user_id: null, name: '🎁 Thưởng', type: 'income', icon: '🎁', color: '#F59E0B', parent_id: null, is_system: true, created_at: '' },
    { id: 'c11', user_id: null, name: '📈 Đầu tư', type: 'income', icon: '📈', color: '#3B82F6', parent_id: null, is_system: true, created_at: '' },
    { id: 'c12', user_id: null, name: '💼 Thêm thu nhập', type: 'income', icon: '💼', color: '#8B5CF6', parent_id: null, is_system: true, created_at: '' },
  ]

  if (!type) return all
  return all.filter(c => c.type === type)
}