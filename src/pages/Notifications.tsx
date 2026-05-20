import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, Trash2, ChevronRight, AlertTriangle, Info, CheckCircle, TrendingUp } from 'lucide-react'
import { useAppNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification } from '@/hooks/useAppNotifications'
import { useI18n } from '@/lib/i18n'
import { PageTransition } from '@/components/shared'
import { cn } from '@/lib/utils'

const NOTIFICATION_ICONS = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  budget_alert: TrendingUp,
  debt_reminder: AlertTriangle,
}

const NOTIFICATION_COLORS = {
  info: 'text-blue-500 bg-blue-50',
  warning: 'text-orange-500 bg-orange-50',
  success: 'text-emerald-500 bg-emerald-50',
  budget_alert: 'text-purple-500 bg-purple-50',
  debt_reminder: 'text-rose-500 bg-rose-50',
}

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useAppNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotif = useDeleteNotification()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleMarkRead = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    await markRead.mutateAsync(id)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDeletingId(id)
    try {
      await deleteNotif.mutateAsync(id)
    } finally {
      setDeletingId(null)
    }
  }

  const handleMarkAll = async () => {
    await markAllRead.mutateAsync()
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white dark:bg-[hsl(224,30%,11%)] px-4 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-gray-100 dark:border-[hsl(224,25%,18%)]">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t.notifications.title}</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500">{unreadCount} {t.notifications.unread}</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              disabled={markAllRead.isPending}
              className="text-sm text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              <Check className="h-4 w-4" />
              {t.notifications.markAllRead}
            </button>
          )}
        </div>

        {/* List */}
        <div className="divide-y divide-gray-100 dark:divide-[hsl(224,25%,18%)]">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[hsl(224,30%,16%)] flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">{t.notifications.empty}</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 text-center">{t.notifications.emptyDesc}</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = NOTIFICATION_ICONS[notif.type] || Bell
              const colorClass = NOTIFICATION_COLORS[notif.type] || NOTIFICATION_COLORS.info

              return (
                <div
                  key={notif.id}
                  className={cn(
                    "relative flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-[hsl(224,30%,11%)]/50 transition-colors cursor-pointer",
                    !notif.is_read && "bg-indigo-50/30 dark:bg-indigo-500/5"
                  )}
                  onClick={() => {
                    if (!notif.is_read) markRead.mutate(notif.id)
                    if (notif.link_url) navigate(notif.link_url)
                  }}
                >
                  {/* Unread dot */}
                  {!notif.is_read && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-500" />
                  )}

                  {/* Icon */}
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 ml-2", colorClass.split(' ')[1])}>
                    <Icon className={cn("h-5 w-5", colorClass.split(' ')[0])} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium text-gray-900 dark:text-gray-100", !notif.is_read && "font-semibold")}>
                      {notif.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.body}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatRelativeTime(notif.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!notif.is_read && (
                      <button
                        onClick={(e) => handleMarkRead(e, notif.id)}
                        disabled={markRead.isPending}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title={t.notifications.markRead}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, notif.id)}
                      disabled={deleteNotif.isPending && deletingId === notif.id}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                      title={t.notifications.delete}
                    >
                      <Trash2 className={cn("h-4 w-4", deletingId === notif.id && "animate-pulse")} />
                    </button>
                    {notif.link_url && (
                      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </PageTransition>
  )
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
}