import type { Language } from '@/lib/i18n/translations'

export const LOCALE_MAP: Record<Language, string> = {
  vi: 'vi-VN',
  en: 'en-US',
}

/** Get locale string for a language, defaulting to vi-VN */
export function getLocale(lang: string): string {
  return LOCALE_MAP[lang as Language] || 'vi-VN'
}
