import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  serializeSubscription,
  getNotificationPermission,
} from '@/lib/notifications'

export interface NotificationSettings {
  user_id: string
  daily_reminder: boolean
  budget_alert: boolean
  debt_reminder: boolean
  reminder_time: string // HH:mm format
  push_enabled: boolean
}

const DEFAULT_SETTINGS: NotificationSettings = {
  user_id: '',
  daily_reminder: true,
  budget_alert: true,
  debt_reminder: true,
  reminder_time: '20:00',
  push_enabled: false,
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notificationSettings'],
    queryFn: async (): Promise<NotificationSettings> => {
      if (!isSupabaseConfigured()) return DEFAULT_SETTINGS

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return DEFAULT_SETTINGS

        const { data, error } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error
        return data || { ...DEFAULT_SETTINGS, user_id: user.id }
      } catch {
        return DEFAULT_SETTINGS
      }
    },
  })
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      if (!isSupabaseConfigured()) return settings

      const user = await requireAuth()

      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] })
    },
  })
}

export function useTogglePush() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!isSupabaseConfigured()) return { enabled }

      const user = await requireAuth()

      if (enabled) {
        // Enable push
        const registration = await registerServiceWorker()
        if (!registration) throw new Error('Failed to register service worker')

        const permission = await requestNotificationPermission()
        if (permission !== 'granted') throw new Error('Notification permission denied')

        const subscription = await subscribeToPush()
        if (!subscription) throw new Error('Failed to subscribe to push')

        // Try to save to DB (non-blocking if table doesn't exist yet)
        try {
          const serialized = serializeSubscription(subscription)
          await supabase
            .from('push_subscriptions')
            .upsert({
              user_id: user.id,
              endpoint: serialized.endpoint,
              p256dh: serialized.p256dh,
              auth: serialized.auth,
            })
          await supabase
            .from('notification_settings')
            .upsert({ user_id: user.id, push_enabled: true })
        } catch (dbError) {
          console.warn('Failed to save push subscription to DB:', dbError)
        }

        return { enabled: true }
      } else {
        // Disable push
        await unsubscribeFromPush()

        try {
          await supabase.from('push_subscriptions').delete().eq('user_id', user.id)
          await supabase.from('notification_settings').upsert({ user_id: user.id, push_enabled: false })
        } catch (dbError) {
          console.warn('Failed to remove push subscription from DB:', dbError)
        }

        return { enabled: false }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] })
      queryClient.invalidateQueries({ queryKey: ['pushPermission'] })
    },
  })
}

export function usePushPermission() {
  return useQuery({
    queryKey: ['pushPermission'],
    queryFn: () => getNotificationPermission(),
    staleTime: 0,
  })
}
