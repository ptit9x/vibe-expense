import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Category, TransactionType } from '@/types'
import { CATEGORIES } from '@/constants/categories'

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockCategories(type)
      }

      const { data: allCategories, error } = await supabase
        .from('categories')
        .select('*')

      if (error) throw error

      const filteredCategories = type
        ? allCategories.filter(c => c.type === type)
        : allCategories

      return filteredCategories.map(c => ({
        ...c,
        i18n_key: (c as any).i18n_key || extractI18nKey(c.name),
      })) as (Category & { i18n_key?: string })[]
    },
    staleTime: 1000 * 60 * 60 * 24,
  })
}

export function useUpdateCategoryOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ categoryId, customName, customIcon, customColor, isSystem }: {
      categoryId: string
      customName?: string
      customIcon?: string
      customColor?: string
      isSystem?: boolean
    }) => {
      if (!isSupabaseConfigured()) {
        return { categoryId, customName, customIcon, customColor }
      }

      if (isSystem) {
        // System category: create a user-owned override as child
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Check existing override
        const { data: existing } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', categoryId)
          .eq('user_id', user.id)
          .maybeSingle()

        if (existing) {
          const { error } = await supabase
            .from('categories')
            .update({ name: customName, icon: customIcon, color: customColor })
            .eq('id', existing.id)
          if (error) throw error
        } else {
          // Get original type
          const { data: original } = await supabase
            .from('categories')
            .select('type')
            .eq('id', categoryId)
            .single()

          const { error } = await supabase
            .from('categories')
            .insert({
              name: customName,
              icon: customIcon,
              color: customColor,
              type: original?.type || 'expense',
              parent_id: categoryId,
              user_id: user.id,
              is_system: false,
            })
          if (error) throw error
        }
      } else {
        // User category: update directly
        const { error } = await supabase
          .from('categories')
          .update({ name: customName, icon: customIcon, color: customColor })
          .eq('id', categoryId)

        if (error) throw error
      }

      return { categoryId, customName, customIcon, customColor }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategoryOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ categoryId, isSystem }: { categoryId: string; isSystem?: boolean }) => {
      if (!isSupabaseConfigured()) {
        return { categoryId }
      }

      if (isSystem) {
        // System category: remove user override child
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('parent_id', categoryId)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // User category: delete directly
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryId)

        if (error) throw error
      }

      return { categoryId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      name: string
      icon: string
      color: string
      type: TransactionType
      parent_id?: string
    }) => {
      if (!isSupabaseConfigured()) {
        return { id: crypto.randomUUID(), ...input, created_at: new Date().toISOString() }
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: input.name,
          icon: input.icon,
          color: input.color,
          type: input.type,
          parent_id: input.parent_id || null,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          is_system: false,
        })
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

// Mock categories for development
function getMockCategories(type?: TransactionType): Category[] {
  const mockData = [
    { id: '1', name: 'Food', icon: '🍔', color: '#FF6B6B', type: 'expense' as const },
    { id: '2', name: 'Transport', icon: '🚗', color: '#4ECDC4', type: 'expense' as const },
    { id: '3', name: 'Housing', icon: '🏠', color: '#45B7D1', type: 'expense' as const },
    { id: '4', name: 'Entertainment', icon: '🎮', color: '#96CEB4', type: 'expense' as const },
    { id: '5', name: 'Shopping', icon: '🛒', color: '#FFEAA7', type: 'expense' as const },
    { id: '6', name: 'Health', icon: '💊', color: '#DDA0DD', type: 'expense' as const },
    { id: '7', name: 'Other', icon: '📦', color: '#95A5A6', type: 'expense' as const },
    { id: '101', name: 'Salary', icon: '💰', color: '#2ECC71', type: 'income' as const },
    { id: '102', name: 'Gift', icon: '🎁', color: '#9B59B6', type: 'income' as const },
    { id: '103', name: 'Investment', icon: '📈', color: '#3498DB', type: 'income' as const },
  ]

  const all = mockData.map(cat => ({
    ...cat,
    user_id: null,
    parent_id: null,
    is_system: true,
    created_at: '',
  }))

  if (!type) return all
  return all.filter(c => c.type === type)
}

function extractI18nKey(name: string): string {
  const nameLower = name.toLowerCase()

  for (const type of ['expense', 'income'] as const) {
    for (const cat of CATEGORIES[type]) {
      const catNameLower = cat.nameKey.replace('categories.', '').replace(/([A-Z])/g, ' $1').toLowerCase().trim()
      if (nameLower.includes(catNameLower)) {
        return cat.nameKey
      }
      const catNameSlug = cat.nameKey.replace('categories.', '').toLowerCase()
      if (nameLower.replace(/\s+/g, '').includes(catNameSlug)) {
        return cat.nameKey
      }
    }
  }

  return 'categories.other'
}