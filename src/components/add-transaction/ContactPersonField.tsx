import { useI18n } from '@/lib/i18n'

interface ContactPersonFieldProps {
  value: string
  onChange: (value: string) => void
  type: 'lend' | 'borrow'
}

export function ContactPersonField({ value, onChange, type }: ContactPersonFieldProps) {
  const { t } = useI18n()

  const label = type === 'lend'
    ? t.transaction.lender
    : t.transaction.borrower

  const placeholder = type === 'lend'
    ? t.transaction.lenderPlaceholder
    : t.transaction.borrowerPlaceholder

  return (
    <div className="bg-white mt-2 px-5 py-4">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-base font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-blue-50/50 transition-all"
      />
    </div>
  )
}
