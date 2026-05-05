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
        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-lg rounded-2xl hover:from-indigo-600 hover:to-purple-700 active:from-indigo-700 active:to-purple-800 transition-colors disabled:opacity-50 shadow-md shadow-indigo-500/20"
      >
        {isPending ? t.common.loading : (label || defaultLabel)}
      </button>
    </div>
  )
}
