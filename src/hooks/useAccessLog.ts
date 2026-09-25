import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, isMockAuthAllowed, requireAuth } from '@/lib/supabase'
import { logAccessOnce } from '@/lib/accessLog'
import { MOCK_ACCESS_LOGS } from '@/mocks/mockAccessLogs'
import type { AccessLog } from '@/types'

/** Access history list — one row per unique device + browser + OS + IP. */
export function useAccessLogs() {
  return useQuery({
    queryKey: ['accessLogs'],
    queryFn: async (): Promise<AccessLog[]> => {
      if (isSupabaseConfigured()) {
        await requireAuth()
        const { data, error } = await supabase
          .from('access_logs')
          .select('*')
          .order('last_seen_at', { ascending: false })
        if (error) throw error
        return data ?? []
      }

      if (!isMockAuthAllowed()) return []
      return MOCK_ACCESS_LOGS
    },
  })
}

/**
 * Records the current device/browser/IP on app start and on sign-in.
 * Throttled client-side (10 min) + deduped server-side — no duplicate rows.
 */
export function useAccessTracker() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    let initialLogged = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return
      if (event === 'SIGNED_IN') {
        void logAccessOnce()
        return
      }
      // INITIAL_SESSION fires once on load with a restored session
      if (event === 'INITIAL_SESSION' && !initialLogged) {
        initialLogged = true
        void logAccessOnce()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])
}
