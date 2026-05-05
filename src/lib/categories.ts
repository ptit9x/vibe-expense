import { TRANSACTION_TYPES } from '@/constants/categories'
import { translations } from '@/lib/i18n/translations'

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

export function getTransactionTypes(t: Translations) {
  return TRANSACTION_TYPES.map(type => ({
    id: type.id,
    label: resolveTranslation(t, type.labelKey),
    icon: type.icon,
  }))
}
