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
    <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] lg:bottom-4 z-20 px-5 py-3 -mx-0 bg-gradient-to-t from-[var(--color-clay-base)] via-[var(--color-clay-base)]/95 to-transparent dark:from-[var(--color-clay-dark-base)] dark:via-[var(--color-clay-dark-base)]/95">
      <button
        onClick={onClick}
        disabled={isPending}
        className="clay-button-primary w-full min-h-[52px] py-3.5 text-white font-semibold text-base rounded-2xl transition-all disabled:opacity-50"
      >
        {isPending ? t.common.loading : (label || defaultLabel)}
      </button>
    </div>
  )
}
