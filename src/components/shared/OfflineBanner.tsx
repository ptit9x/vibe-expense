import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useOutboxStore } from '@/stores/outboxStore'
import { useI18n } from '@/lib/i18n'
import { WifiOff, CloudUpload } from 'lucide-react'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const pendingCount = useOutboxStore((s) => s.entries.filter((e) => e.status !== 'syncing').length)
  const { t } = useI18n()

  const showOffline = !isOnline
  const showPending = isOnline && pendingCount > 0

  if (!showOffline && !showPending) return null

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white ${
        showOffline ? 'bg-amber-500' : 'bg-blue-500'
      }`}
      role="status"
    >
      {showOffline ? (
        <>
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{t.common.offlineMode}</span>
          {pendingCount > 0 && (
            <span className="opacity-90">· {pendingCount} {t.common.pendingSync}</span>
          )}
        </>
      ) : (
        <>
          <CloudUpload className="w-4 h-4 shrink-0" />
          <span>{pendingCount} {t.common.pendingSync}</span>
        </>
      )}
    </div>
  )
}
