import { useI18n } from '@/lib/i18n'

const LANGUAGES = [
  { code: 'vi' as const, name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en' as const, name: 'English', flag: '🇺🇸' },
]

export default function LanguageSettings() {
  const { language, setLanguage, t } = useI18n()

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <h1 className="text-xl font-semibold text-white">{t.settings.language}</h1>
      </div>

      <div className="bg-white mt-2 px-5 py-4">
        <p className="text-sm font-medium text-gray-500 mb-3">{t.settings.language}</p>
        <div className="space-y-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-gray-900 font-medium">{lang.name}</span>
              </div>
              {language === lang.code && (
                <span className="text-blue-500 text-xl">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
