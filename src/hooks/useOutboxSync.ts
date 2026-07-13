import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'
import { useOutboxStore, MAX_ATTEMPTS } from '@/stores/outboxStore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import type { OutboxEntry } from '@/types'

const TRANSACTION_SELECT =
  '*, wallet:wallets!transactions_wallet_id_fkey(id, name, icon, color), to_wallet:wallets!transactions_to_wallet_id_fkey(id, name, icon, color), category:categories(id, name, icon, color)'

/** Sync một entry — throw nếu thất bại. Type narrowing tự động qua discriminated union. */
async function syncEntry(entry: OutboxEntry): Promise<void> {
  if (!isSupabaseConfigured()) return // mock mode: bỏ qua

  const user = await requireAuth()

  if (entry.operation === 'create') {
    const { error } = await supabase
      .from('transactions')
      .insert({ ...entry.payload, user_id: user.id })
      .select(TRANSACTION_SELECT)
      .single()
    if (error) throw error
    return
  }

  // update — payload tự động narrow thành UpdateTransactionInput
  const { id, ...rest } = entry.payload
  const { error } = await supabase
    .from('transactions')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

const FATAL_ERRORS = ['Not authenticated', 'Failed to fetch']

/**
 * Sync engine cho outbox.
 *
 * Design:
 * - `pendingCount` (reactive selector) trong effect deps → trigger khi có entry mới hoặc retryFailed
 * - `syncingRef` ngăn 2 đợt sync chồng nhau
 * - `needsResyncRef` đảm bảo entry thêm trong lúc đang sync không bị kẹt
 * - `isOnlineRef` giữ giá trị online mới nhất trong callback stale closure
 * - Sync cả entry 'failed' (retry tự động khi online/retryFailed), nhưng không trigger effect
 *   khi entry fail → tránh infinite loop
 */
export function useOutboxSync() {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()
  const pendingCount = useOutboxStore((s) => s.entries.filter((e) => e.status === 'pending').length)
  const syncingRef = useRef(false)
  const needsResyncRef = useRef(false)
  const isOnlineRef = useRef(isOnline)

  useEffect(() => {
    isOnlineRef.current = isOnline
  }, [isOnline])

  const doSync = useCallback(async () => {
    if (syncingRef.current) {
      needsResyncRef.current = true
      return
    }
    if (!isOnlineRef.current) return
    syncingRef.current = true

    try {
      // Một pass — xử lý tất cả pending + failed hiện có
      // H2 fix: skip entries that have exhausted MAX_ATTEMPTS — they need manual
      // resolution (user clears them via clearFailed). This prevents infinite
      // retry loops on permanent failures (FK violations, constraint errors).
      const todo = useOutboxStore.getState().entries.filter(
        (e) =>
          (e.status === 'pending' || e.status === 'failed') && e.attempts < MAX_ATTEMPTS
      )

      for (const entry of todo) {
        try {
          useOutboxStore.getState().updateStatus(entry.tempId, 'syncing')
          await syncEntry(entry)
          useOutboxStore.getState().remove(entry.tempId)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          useOutboxStore.getState().updateStatus(entry.tempId, 'failed', msg)
          // Lỗi auth/network nghiêm trọng → dừng sớm
          if (FATAL_ERRORS.some((f) => msg.includes(f))) break
        }
      }

      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } finally {
      syncingRef.current = false
      // Entry mới thêm trong lúc sync → chạy thêm một pass
      if (needsResyncRef.current) {
        needsResyncRef.current = false
        void doSync()
      }
    }
  }, [queryClient])

  // Sync khi: online trở lại, hoặc có entry pending mới (bao gồm retryFailed)
  useEffect(() => {
    if (!isOnline || pendingCount === 0) return
    void doSync()
  }, [isOnline, pendingCount, doSync])
}
