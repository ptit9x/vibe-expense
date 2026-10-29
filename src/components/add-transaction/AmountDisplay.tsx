import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'

interface AmountDisplayProps {
  value: string
  onChange: (value: string) => void
}

const QUICK_AMOUNTS: Record<string, number[]> = {
  VND: [50000, 100000, 200000, 500000, 1000000],
  DEFAULT: [10, 20, 50, 100, 200],
}

export function AmountDisplay({ value, onChange }: AmountDisplayProps) {
  const { t } = useI18n()
  const currency = useUIStore((s) => s.currency)
  const formatCurrency = useUIStore((s) => s.formatCurrency)
  const quickAmounts = QUICK_AMOUNTS[currency.code] ?? QUICK_AMOUNTS.DEFAULT

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      onChange(val)
    }
  }

  return (
    <>
      <p className="text-white/60 text-sm mb-1 text-center">{t.transaction.amount}</p>
      <div className="flex items-center justify-center">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          aria-label={t.transaction.amount}
          placeholder="0"
          className="text-center text-5xl font-bold text-white placeholder-white/40 bg-transparent focus:outline-none w-full max-w-[280px]"
        />
        <span className="text-2xl text-white/60 ml-1">{currency.symbol}</span>
      </div>
      {/* Quick amounts — one tap instead of typing long VND numbers */}
      <div className="flex flex-wrap justify-center gap-1.5 mt-3 px-2">
        {quickAmounts.map((amt) => {
          const isActive = Number(value) === amt
          return (
            <button
              key={amt}
              type="button"
              onClick={() => onChange(String(amt))}
              aria-pressed={isActive}
              className={`min-h-[36px] px-3 rounded-full text-xs font-semibold tabular-nums transition-colors ${isActive ? 'bg-white text-indigo-600' : 'bg-white/15 text-white hover:bg-white/25 border border-white/20'}`}
            >
              {formatCurrency(amt)}
            </button>
          )
        })}
      </div>
    </>
  )
}
