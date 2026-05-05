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

      // Fetch categories: RLS handles filtering
      // - System categories (user_id = null) visible to all authenticated users
      // - User categories (user_id = auth.uid()) visible only to owner
      const { data: allCategories, error } = await supabase
        .from('categories')
        .select('*')

      if (error) throw error

      // Filter by type if specified
      const filteredCategories = type
        ? allCategories.filter(c => c.type === type)
        : allCategories

      // Map to include i18n_key for label resolution
      return filteredCategories.map(c => ({
        ...c,
        i18n_key: (c as any).i18n_key || extractI18nKey(c.name),
      })) as (Category & { i18n_key?: string })[]
    },
    staleTime: 1000 * 60 * 60 * 24,
  })
}

// Seed categories for new user on first login
export async function seedUserCategories(userId: string) {
  if (!isSupabaseConfigured()) return

  const { data: systemCategories, error: fetchError } = await supabase
    .from('categories')
    .select('id')
    .is('is_system', true)

  if (fetchError || !systemCategories) return

  const userCategoryEntries = systemCategories.map(cat => ({
    user_id: userId,
    category_id: cat.id,
  }))

  await supabase.from('user_categories').upsert(userCategoryEntries, {
    onConflict: 'user_id,category_id',
    ignoreDuplicates: true,
  })
}

// Update category override for user
export function useUpdateCategoryOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ categoryId, customName, customIcon, customColor }: {
      categoryId: string
      customName?: string
      customIcon?: string
      customColor?: string
    }) => {
      if (!isSupabaseConfigured()) {
        return { categoryId, customName, customIcon, customColor }
      }

      const { error } = await supabase
        .from('user_categories')
        .update({
          custom_name: customName,
          custom_icon: customIcon,
          custom_color: customColor,
          updated_at: new Date().toISOString(),
        })
        .eq('category_id', categoryId)

      if (error) throw error
      return { categoryId, customName, customIcon, customColor }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

// Reset category override (remove customizations)
export function useDeleteCategoryOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryId: string) => {
      if (!isSupabaseConfigured()) {
        return { categoryId }
      }

      const { error } = await supabase
        .from('user_categories')
        .delete()
        .eq('category_id', categoryId)

      if (error) throw error
      return { categoryId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

// Create custom category for user
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

// Extract i18n key from category name (e.g., "🍔 Food" -> "categories.food")
function extractI18nKey(name: string): string {
  // Try to match against known i18n keys in CATEGORIES
  const nameLower = name.toLowerCase()
  
  for (const type of ['expense', 'income'] as const) {
    for (const cat of CATEGORIES[type]) {
      const catNameLower = cat.nameKey.replace('categories.', '').replace(/([A-Z])/g, ' $1').toLowerCase().trim()
      if (nameLower.includes(catNameLower)) {
        return cat.nameKey
      }
      // Also check with spaces removed
      const catNameSlug = cat.nameKey.replace('categories.', '').toLowerCase()
      if (nameLower.replace(/\s+/g, '').includes(catNameSlug)) {
        return cat.nameKey
      }
    }
  }
  
  return 'categories.other'
}