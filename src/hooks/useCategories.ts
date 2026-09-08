import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'
import type { Category, TransactionType } from '@/types'
import { CATEGORIES } from '@/constants/categories'
import { getMockCategories } from '@/mocks/mockCategories'

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockCategories(type)
      }

      const user = await requireAuth()

      const { data: allCategories, error } = await supabase
        .from('categories')
        .select('id, user_id, parent_id, name, type, icon, color, slug, is_system, created_at')
        .or(`is_system.eq.true,user_id.eq.${user.id}`)

      if (error) throw error

      // Merge user override rows into their system parents instead of
      // rendering them as extra subcategories (duplicate-looking rows).
      // An override is a user-owned row whose parent is a SYSTEM category.
      // User-created subcategories under user categories are unaffected.
      const systemIds = new Set(allCategories.filter(c => c.is_system).map(c => c.id))
      const overrides = allCategories.filter(c => c.user_id && c.parent_id && systemIds.has(c.parent_id))
      const overridesByParent = new Map(overrides.map(o => [o.parent_id as string, o]))
      const overriddenIds = new Set(overridesByParent.keys())

      const tree = allCategories
        .filter(c => !(c.user_id && overriddenIds.has(c.parent_id)))
        .map(c => {
          if (!overriddenIds.has(c.id)) return c
          const o = overridesByParent.get(c.id)!
          return {
            ...c,
            name: o.name ?? c.name,
            icon: o.icon ?? c.icon,
            color: o.color ?? c.color,
          }
        })

      const filteredCategories = type
        ? tree.filter(c => c.type === type)
        : tree

      return filteredCategories.map(c => ({
        ...c,
        name: stripEmojiPrefix(c.name),
        i18n_key: (c as Record<string, unknown>).i18n_key || extractI18nKey(c.name),
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
        const user = await requireAuth()

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
            .eq('user_id', user.id)
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
        // User category: update with user_id check for safety
        const user = await requireAuth()

        const { error } = await supabase
          .from('categories')
          .update({ name: customName, icon: customIcon, color: customColor })
          .eq('id', categoryId)
          .eq('user_id', user.id)

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
        const user = await requireAuth()

        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('parent_id', categoryId)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // User category: delete with user_id check for safety
        const user = await requireAuth()

        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', categoryId)
          .eq('user_id', user.id)

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

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: input.name,
          icon: input.icon,
          color: input.color,
          type: input.type,
          parent_id: input.parent_id || null,
          user_id: user.id,
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

// Strip leading emoji (+ variation selector/ZWJ/space) from a category name,
// e.g. "🐕 Thú cưng" → "Thú cưng". The emoji already lives in the icon column.
// Emoji/symbol codepoints are >= U+2100 (8448); Vietnamese (Latin Extended
// Additional) tops out at U+1EFF, so this guard never strips Vietnamese letters.
export function stripEmojiPrefix(name: string | null | undefined): string {
  if (!name) return ''
  let i = 0
  while (i < name.length && name.codePointAt(i)! >= 8448) {
    i += String.fromCodePoint(name.codePointAt(i)!).length
  }
  // Skip one space between the emoji and the label
  if (name[i] === ' ') i++
  return name.slice(i) || name
}

function extractI18nKey(name: string): string {
  const nameLower = name.toLowerCase()

  for (const type of ['expense', 'income'] as const) {
    // eslint-disable-next-line security/detect-object-injection
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