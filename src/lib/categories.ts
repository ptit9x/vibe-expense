import { TRANSACTION_TYPES } from '@/constants/categories'
import type { TranslationKey } from '@/lib/i18n/translations'

// Use the widened structural type so translations.en (string literals) is
// assignable alongside translations.vi.
type Translations = TranslationKey

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
