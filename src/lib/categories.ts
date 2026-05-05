// Category and transaction type helpers with i18n support

import { CATEGORIES, TRANSACTION_TYPES } from '@/constants/categories'

export { CATEGORIES, TRANSACTION_TYPES }

// Resolve a nested translation key like 'categories.food'
function resolveTranslation(t: Record<string, unknown>, key: string): string {
  const parts = key.split('.')
  if (parts.length === 2) {
    const section = t[parts[0]]
    if (section && typeof section === 'object') {
      return (section as Record<string, string>)[parts[1]] || key
    }
  }
  return t[key] as string || key
}

// Get category name with i18n resolution
export function getCategoryName(t: Record<string, unknown>, category: { nameKey: string }): string {
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

export function getCategoriesForType(
  type: string,
  t: Record<string, unknown>
): DisplayCategory[] {
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

export function getTransactionTypes(t: Record<string, unknown>): DisplayTransactionType[] {
  return TRANSACTION_TYPES.map(type => ({
    id: type.id,
    label: resolveTranslation(t, type.labelKey),
    icon: type.icon,
  }))
}
