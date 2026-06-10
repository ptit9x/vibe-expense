import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification } from '@/hooks/useAppNotifications'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { NotificationType } from '@/types'

const typeConfig: Record<NotificationType, { emoji: string; color: string }> = {
  info: { emoji: 'ℹ️', color: 'bg-blue-100 text-blue-600' },
  warning: { emoji: '⚠️', color: 'bg-yellow-100 text-yellow-600' },
  success: { emoji: '✅', color: 'bg-emerald-100 text-emerald-600' },
  budget_alert: { emoji: '💰', color: 'bg-orange-100 text-orange-600' },
  debt_reminder: { emoji: '💳', color: 'bg-purple-100 text-purple-600' },
  inactivity_reminder: { emoji: '⏰', color: 'bg-pink-100 text-pink-600' },
  financial_health: { emoji: '🏥', color: 'bg-indigo-100 text-indigo-600' },
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.max(0, now - then)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  if (days < 7) return `${days} ngày trước`
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const bellRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const navigate = useNavigate()

  const { data: notifications = [] } = useAppNotifications()
  const unreadCount = notifications.filter(n => !n.is_read).length
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotif = useDeleteNotification()

  // Position dropdown relative to bell button, accounting for scroll
  useEffect(() => {
    if (!isOpen || !bellRef.current) return

    const updatePosition = () => {
      const rect = bellRef.current!.getBoundingClientRect()
      const vw = window.innerWidth

      // On small screens, use full-width panel; on larger screens, use fixed width
      if (vw < 400) {
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 8,
          left: 8,
          right: 8,
          zIndex: 9999,
        })
      } else {
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 8,
          right: vw - rect.right,
          zIndex: 9999,
        })
      }
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleNotificationClick = (id: string, linkUrl: string | null, isRead: boolean) => {
    if (!isRead) markRead.mutate(id)
    if (linkUrl) {
      setIsOpen(false)
      navigate(linkUrl)
    }
  }

  return (
    <>
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-white" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown - rendered via portal to avoid overflow clipping */}
      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 z-[9998]" onClick={() => setIsOpen(false)} />

          <AnimatePresence>
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={dropdownStyle}
              className={cn(
                "max-h-[70vh] overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl shadow-black/25 border border-gray-200/50 dark:border-gray-700/50 flex flex-col",
                window.innerWidth >= 400 ? "w-[340px]" : ""
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Thông báo</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead.mutate()}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Đánh dấu đã đọc tất cả"
                    >
                      <CheckCheck className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Không có thông báo</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {notifications.map((notif) => {
                      const config = typeConfig[notif.type] || typeConfig.info
                      return (
                        <div
                          key={notif.id}
                          className={cn(
                            'group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                            notif.is_read
                              ? 'bg-white dark:bg-gray-900'
                              : 'bg-indigo-50/50 dark:bg-indigo-500/5',
                            'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                          )}
                          onClick={() => handleNotificationClick(notif.id, notif.link_url, notif.is_read)}
                        >
                          {/* Unread dot */}
                          {!notif.is_read && (
                            <span className="absolute left-1.5 top-4 h-2 w-2 rounded-full bg-indigo-500" />
                          )}

                          {/* Icon */}
                          <div className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm',
                            config.color
                          )}>
                            {config.emoji}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pr-6">
                            <p className={cn(
                              'text-sm leading-snug',
                              notif.is_read
                                ? 'text-gray-600 dark:text-gray-400'
                                : 'text-gray-900 dark:text-gray-200 font-medium'
                            )}>
                              {notif.title}
                            </p>
                            {notif.body && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                {notif.body}
                              </p>
                            )}
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                              {formatTimeAgo(notif.created_at)}
                            </p>
                          </div>

                          {/* Actions (show on hover) */}
                          <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notif.is_read && (
                              <button
                                onClick={(e) => { e.stopPropagation(); markRead.mutate(notif.id) }}
                                className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                title="Đánh dấu đã đọc"
                              >
                                <Check className="h-3.5 w-3.5 text-gray-400" />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteNotif.mutate(notif.id) }}
                              className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-500/10 transition-colors"
                              title="Xoá"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2.5 text-center shrink-0">
                  <button
                    onClick={() => { setIsOpen(false); navigate('/notifications') }}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors"
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </>,
        document.body
      )}
    </>
  )
}
