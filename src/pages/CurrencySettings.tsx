import { Check } from 'lucide-react'
import { useUpdateProfile } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { useUIStore, CURRENCIES } from '@/stores/uiStore'
import PageHeader from '@/components/PageHeader'

import { PageTransition } from '@/components/shared'

export default function CurrencySettings() {
  const { t } = useI18n()
  const { currency, setCurrency } = useUIStore()
  const updateProfile = useUpdateProfile()

  const handleSelectCurrency = async (code: string) => {
    if (code === currency.code) return

    const newCurrency = CURRENCIES.find(c => c.code === code)
    if (!newCurrency) return

    setCurrency(newCurrency)

    try {
      await updateProfile.mutateAsync({ currency: code })
      toast.success(t.common.success)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error(t.common.error)
    }
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader>
        <h1 className="text-xl font-semibold text-white">{t.settings.currencySettings}</h1>
      </PageHeader>

      <div className="bg-white mt-2 px-5 py-4">
        <p className="text-sm font-medium text-gray-500 mb-3">{t.profile.selectCurrency}</p>
        <div className="space-y-3">
          {CURRENCIES.map((curr) => (
            <button
              key={curr.code}
              onClick={() => handleSelectCurrency(curr.code)}
              disabled={updateProfile.isPending}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${currency.code === curr.code
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{curr.flag}</span>
                <div className="text-left">
                  <span className="text-gray-900 font-medium block">{curr.code}</span>
                  <span className="text-gray-500 text-sm">{curr.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-gray-700">{curr.symbol}</span>
                {currency.code === curr.code && (
                  <Check className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
    </PageTransition>
  )
}