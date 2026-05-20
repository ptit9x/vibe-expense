import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'
import type { AppNotification } from '@/types'

const NOTIFICATION_SELECT = 'id, user_id, title, body, type, is_read, link_url, created_at'

export function useAppNotifications() {
  return useQuery({
    queryKey: ['appNotifications'],
    queryFn: async (): Promise<AppNotification[]> => {
      if (!isSupabaseConfigured()) return getMockNotifications()

      try {
        const user = await requireAuth()
        const { data, error } = await supabase
          .from('app_notifications')
          .select(NOTIFICATION_SELECT)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        return data || []
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
        return getMockNotifications()
      }
    },
    staleTime: 30 * 1000, // 30s
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['unreadNotificationCount'],
    queryFn: async (): Promise<number> => {
      if (!isSupabaseConfigured()) return 0

      try {
        const user = await requireAuth()
        const { count, error } = await supabase
          .from('app_notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)

        if (error) throw error
        return count || 0
      } catch {
        return 0
      }
    },
    staleTime: 10 * 1000, // 10s
    refetchInterval: 30 * 1000, // poll every 30s
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!isSupabaseConfigured()) return

      const { error } = await supabase
        .from('app_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appNotifications'] })
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!isSupabaseConfigured()) return

      const user = await requireAuth()
      const { error } = await supabase
        .from('app_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appNotifications'] })
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!isSupabaseConfigured()) return

      const { error } = await supabase
        .from('app_notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appNotifications'] })
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] })
    },
  })
}

// Mock data for development
function getMockNotifications(): AppNotification[] {
  return [
    {
      id: 'mock-1',
      user_id: 'mock',
      title: 'Chào mừng đến Vibe Expense!',
      body: 'Bạn đã sẵn sàng quản lý chi tiêu chưa?',
      type: 'info',
      is_read: false,
      link_url: '/dashboard',
      created_at: new Date().toISOString(),
    },
    {
      id: 'mock-2',
      user_id: 'mock',
      title: 'Nhắc nhở ngân sách',
      body: 'Bạn đã chi tiêu 80% ngân sách tháng này.',
      type: 'budget_alert',
      is_read: false,
      link_url: '/reports',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ]
}