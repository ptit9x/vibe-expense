import { useI18n } from '@/lib/i18n'

interface AmountDisplayProps {
  value: string
  onChange: (value: string) => void
}

export function AmountDisplay({ value, onChange }: AmountDisplayProps) {
  const { t } = useI18n()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      onChange(val)
    }
  }

  return (
    <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
      <p className="text-white/60 text-sm mb-1 text-center">{t.transaction.amount}</p>
      <div className="flex items-center justify-center">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder="0"
          className="text-center text-5xl font-bold text-white placeholder-white/40 bg-transparent focus:outline-none w-full max-w-[280px]"
        />
        <span className="text-2xl text-white/60 ml-1">đ</span>
      </div>
    </div>
  )
}
