import { useMemo } from 'react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useOutboxStore } from '@/stores/outboxStore'
import { useI18n } from '@/lib/i18n'
import { WifiOff, CloudUpload, RotateCw, AlertTriangle } from 'lucide-react'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const entries = useOutboxStore((s) => s.entries)
  const retryFailed = useOutboxStore((s) => s.retryFailed)

  // Derive counts via useMemo — avoids new-array-in-selector re-render issue
  // (Zustand v5 uses Object.is by default; .filter() returns a new ref each call)
  const pendingCount = useMemo(
    () => entries.filter((e) => e.status === 'pending' || e.status === 'syncing').length,
    [entries]
  )
  const failedCount = useMemo(
    () => entries.filter((e) => e.status === 'failed').length,
    [entries]
  )
  const { t } = useI18n()

  const showOffline = !isOnline
  const showPending = isOnline && (pendingCount > 0 || failedCount > 0)

  if (!showOffline && !showPending) return null

  const totalCount = pendingCount + failedCount

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white ${
        showOffline ? 'bg-amber-500' : failedCount > 0 ? 'bg-red-500' : 'bg-blue-500'
      }`}
      role="status"
    >
      {showOffline ? (
        <>
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{t.common.offlineMode}</span>
          {totalCount > 0 && (
            <span className="opacity-90">· {totalCount} {t.common.pendingSync}</span>
          )}
        </>
      ) : (
        <>
          {failedCount > 0 ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CloudUpload className="w-4 h-4 shrink-0" />
          )}
          <span>
            {pendingCount > 0 && `${pendingCount} ${t.common.pendingSync}`}
            {pendingCount > 0 && failedCount > 0 && ' · '}
            {failedCount > 0 && `${failedCount} ${t.common.syncFailed}`}
          </span>
          {failedCount > 0 && (
            <button
              onClick={retryFailed}
              className="ml-1 inline-flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30 transition-colors"
            >
              <RotateCw className="w-3 h-3" />
              {t.common.retry}
            </button>
          )}
        </>
      )}
    </div>
  )
}
