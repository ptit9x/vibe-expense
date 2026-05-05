// Category and transaction type helpers with i18n support

import { CATEGORIES, TRANSACTION_TYPES } from '@/constants/categories'
import { translations } from '@/lib/i18n/translations'

export { CATEGORIES, TRANSACTION_TYPES }

type Translations = typeof translations.vi

// Resolve a nested translation key like 'categories.food'
function resolveTranslation(t: Translations, key: string): string {
  const parts = key.split('.')
  if (parts.length === 2) {
    const section = t[parts[0] as keyof Translations]
    if (section && typeof section === 'object') {
      return (section as Record<string, string>)[parts[1]] || key
    }
  }
  return key
}

// Get category name with i18n resolution
export function getCategoryName(t: Translations, category: { nameKey: string }): string {
  return resolveTranslation(t, category.nameKey)
}

// Map categories for display with i18n
export interface DisplayCategory {
  id: string
  name: string
  icon: string
  type: 'income' | 'expense'
  color: string
}

export function getCategoriesForType(type: string, t: Translations): DisplayCategory[] {
  const cats = type === 'income' ? CATEGORIES.income : CATEGORIES.expense
  return cats.map(cat => ({
    id: cat.id,
    name: getCategoryName(t, cat),
    icon: cat.icon,
    type: type as 'income' | 'expense',
    color: cat.color,
  }))
}

export interface DisplayTransactionType {
  id: string
  label: string
  icon: string
}

export function getTransactionTypes(t: Translations): DisplayTransactionType[] {
  return TRANSACTION_TYPES.map(type => ({
    id: type.id,
    label: resolveTranslation(t, type.labelKey),
    icon: type.icon,
  }))
}
