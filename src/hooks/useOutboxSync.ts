import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'
import { useOutboxStore } from '@/stores/outboxStore'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import type { OutboxEntry, CreateTransactionInput, UpdateTransactionInput } from '@/types'

const TRANSACTION_SELECT =
  '*, wallet:wallets!transactions_wallet_id_fkey(id, name, icon, color), to_wallet:wallets!transactions_to_wallet_id_fkey(id, name, icon, color), category:categories(id, name, icon, color)'

/** Sync một entry — throw nếu thất bại */
async function syncEntry(entry: OutboxEntry): Promise<void> {
  if (!isSupabaseConfigured()) return // mock mode: bỏ qua

  const user = await requireAuth()

  if (entry.operation === 'create') {
    const payload = entry.payload as CreateTransactionInput
    const { error } = await supabase
      .from('transactions')
      .insert({ ...payload, user_id: user.id })
      .select(TRANSACTION_SELECT)
      .single()
    if (error) throw error
    return
  }

  // update
  const payload = entry.payload as UpdateTransactionInput
  const { id, ...rest } = payload
  const { error } = await supabase
    .from('transactions')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

export function useOutboxSync() {
  const queryClient = useQueryClient()
  const isOnline = useOnlineStatus()
  const entries = useOutboxStore((s) => s.entries)
  const updateStatus = useOutboxStore((s) => s.updateStatus)
  const remove = useOutboxStore((s) => s.remove)
  const syncingRef = useRef(false)

  useEffect(() => {
    if (!isOnline) return
    if (syncingRef.current) return
    const pending = entries.filter((e) => e.status === 'pending')
    if (pending.length === 0) return

    syncingRef.current = true

    ;(async () => {
      for (const entry of pending) {
        try {
          updateStatus(entry.tempId, 'syncing')
          await syncEntry(entry)
          remove(entry.tempId)
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          updateStatus(entry.tempId, 'failed', msg)
          // Lỗi auth/network nghiêm trọng → dừng sớm
          if (msg.includes('Not authenticated') || msg.includes('Failed to fetch')) break
        }
      }
      // Invalidate cache để fetch dữ liệu thật từ server
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      syncingRef.current = false
    })()
  }, [isOnline, entries, queryClient, updateStatus, remove])
}
