import { Monitor, Smartphone, Tablet, HelpCircle, MapPin } from 'lucide-react'
import { useAccessLogs } from '@/hooks/useAccessLog'
import { getCurrentAccessId } from '@/lib/accessLog'
import { useI18n } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import PageHeader from '@/components/PageHeader'
import { PageTransition, EmptyState, SkeletonRow } from '@/components/shared'
import type { AccessLog, DeviceType } from '@/types'

function formatTimeAgo(dateStr: string, t: { justNow: string; minutesAgo: string; hoursAgo: string; daysAgo: string }, locale: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.max(0, now - then)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return t.justNow
  if (minutes < 60) return `${minutes} ${t.minutesAgo}`
  if (hours < 24) return `${hours} ${t.hoursAgo}`
  if (days < 7) return `${days} ${t.daysAgo}`
  return new Date(dateStr).toLocaleDateString(locale)
}

const DEVICE_ICONS: Record<DeviceType, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: HelpCircle,
}

const DEVICE_COLORS: Record<DeviceType, string> = {
  desktop: 'bg-indigo-100 text-indigo-600',
  mobile: 'bg-emerald-100 text-emerald-600',
  tablet: 'bg-amber-100 text-amber-600',
  unknown: 'bg-gray-100 text-gray-500',
}

export default function AccessHistory() {
  const { t, language } = useI18n()
  const locale = getLocale(language)
  const { data: logs, isLoading } = useAccessLogs()
  const currentId = getCurrentAccessId()

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader>
          <h1 className="text-xl font-semibold text-white">{t.settings.accessHistory}</h1>
        </PageHeader>

        <div className="bg-white mt-2 px-5 py-4">
          <p className="text-sm font-medium text-gray-500 mb-4">{t.accessHistory.description}</p>

          {isLoading ? (
            <div className="divide-y divide-gray-100">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : !logs || logs.length === 0 ? (
            <EmptyState icon="🕰️" title={t.accessHistory.empty} description={t.accessHistory.emptyHint} />
          ) : (
            <div className="space-y-3">
              {logs.map((log: AccessLog) => {
                const Icon = DEVICE_ICONS[log.device_type] ?? HelpCircle
                const deviceLabel = t.accessHistory.device[log.device_type] ?? t.accessHistory.device.unknown
                const isCurrent = log.id === currentId
                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl border-2 transition-colors ${isCurrent ? 'bg-blue-50/60 border-blue-200' : 'bg-gray-50 border-transparent'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${DEVICE_COLORS[log.device_type] ?? DEVICE_COLORS.unknown}`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-900 font-medium truncate">{log.browser}</span>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[11px] font-medium">
                              📍 {t.accessHistory.currentDevice}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm mt-0.5">
                          {deviceLabel} • {log.os}
                        </p>
                        <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {log.ip_address}
                          {log.country ? ` • ${log.country}` : ''}
                        </p>

                        <div className="flex items-center justify-between gap-2 mt-2 text-xs">
                          <span className="text-gray-400">
                            {t.accessHistory.firstSeen} {new Date(log.first_seen_at).toLocaleDateString(locale)}
                          </span>
                          <span className="text-gray-500 font-medium">
                            {log.login_count} {t.accessHistory.visits}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
                        {formatTimeAgo(log.last_seen_at, t.common, locale)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
