import { useI18n } from '@/lib/i18n'

interface SaveButtonProps {
  onClick: () => void
  isPending: boolean
  label?: string
}

export function SaveButton({ onClick, isPending, label }: SaveButtonProps) {
  const { t } = useI18n()
  const defaultLabel = t.common.save

  return (
    <div className="p-5">
      <button
        onClick={onClick}
        disabled={isPending}
        className="w-full py-4 bg-blue-500 text-white font-semibold text-lg rounded-2xl hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:bg-blue-300 shadow-sm"
      >
        {isPending ? t.common.loading : (label || defaultLabel)}
      </button>
    </div>
  )
}
