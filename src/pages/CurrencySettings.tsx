import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateProfile } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'

const CURRENCIES = [
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
]

export default function CurrencySettings() {
  const { t } = useI18n()
  const { data: user } = useAuth()
  const updateProfile = useUpdateProfile()
  const [selectedCurrency, setSelectedCurrency] = useState('VND')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // Get current currency from user metadata or default to VND
    const currentCurrency = (user as any)?.currency || 'VND'
    setSelectedCurrency(currentCurrency)
  }, [user])

  const handleSelectCurrency = async (code: string) => {
    if (code === selectedCurrency) return

    setSelectedCurrency(code)
    setIsUpdating(true)

    try {
      await updateProfile.mutateAsync({ currency: code })
      toast.success('Currency updated successfully')
    } catch (error) {
      toast.error('Failed to update currency')
      setSelectedCurrency(selectedCurrency) // Revert on error
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <h1 className="text-xl font-semibold text-white">{t.settings.currencySettings}</h1>
      </div>

      <div className="bg-white mt-2 px-5 py-4">
        <p className="text-sm font-medium text-gray-500 mb-3">Select your preferred currency</p>
        <div className="space-y-3">
          {CURRENCIES.map((currency) => (
            <button
              key={currency.code}
              onClick={() => handleSelectCurrency(currency.code)}
              disabled={isUpdating}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                selectedCurrency === currency.code
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currency.flag}</span>
                <div className="text-left">
                  <span className="text-gray-900 font-medium block">{currency.code}</span>
                  <span className="text-gray-500 text-sm">{currency.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-gray-700">{currency.symbol}</span>
                {selectedCurrency === currency.code && (
                  <Check className="h-5 w-5 text-blue-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}