import { useQueryClient } from '@tanstack/react-query'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useOutboxStore } from '@/stores/outboxStore'
import { isSupabaseConfigured } from '@/lib/supabase'
import type {
  Transaction, CreateTransactionInput, UpdateTransactionInput,
} from '@/types'

interface SaveResult {
  offline: boolean
  outboxFull?: boolean
  tempId?: string
}

/**
 * Encapsulates add/edit transaction với offline support.
 * - Online: gọi Supabase mutation như cũ.
 * - Offline (và Supabase configured): ghi outbox + optimistic cache.
 * - Mock mode (no Supabase): luôn online path (mutation trả object giả).
 */
export function useTransactionSave() {
  const isOnline = useOnlineStatus()
  const createTx = useCreateTransaction()
  const updateTx = useUpdateTransaction()
  const queryClient = useQueryClient()
  const addToOutbox = useOutboxStore((s) => s.add)

  async function saveCreate(
    input: CreateTransactionInput,
    callbacks?: { onSuccess?: () => void; onError?: (e: Error) => void }
  ): Promise<SaveResult> {
    // Mock mode → dùng mutation bình thường
    if (!isSupabaseConfigured()) {
      createTx.mutate(input, {
        onSuccess: callbacks?.onSuccess,
        onError: (e) => callbacks?.onError?.(e),
      })
      return { offline: false }
    }

    // Online → Supabase
    if (isOnline) {
      createTx.mutate(input, {
        onSuccess: callbacks?.onSuccess,
        onError: (e) => callbacks?.onError?.(e),
      })
      return { offline: false }
    }

    // Offline → outbox + optimistic
    let tempId: string
    try {
      tempId = addToOutbox('create', input)
    } catch {
      return { offline: false, outboxFull: true }
    }
    const tempTx = buildTempTransaction(tempId, input)
    queryClient.setQueriesData<Transaction[]>(
      { queryKey: ['transactions'] },
      (old) => (old ? [tempTx, ...old] : old)
    )
    callbacks?.onSuccess?.()
    return { offline: true, tempId }
  }

  async function saveUpdate(
    input: UpdateTransactionInput,
    callbacks?: { onSuccess?: () => void; onError?: (e: Error) => void }
  ): Promise<SaveResult> {
    if (!isSupabaseConfigured() || isOnline) {
      updateTx.mutate(input, {
        onSuccess: callbacks?.onSuccess,
        onError: (e) => callbacks?.onError?.(e),
      })
      return { offline: false }
    }

    // Offline update → outbox + optimistic patch
    let tempId: string
    try {
      tempId = addToOutbox('update', input)
    } catch {
      return { offline: false, outboxFull: true }
    }
    const { id, ...changes } = input
    queryClient.setQueriesData<Transaction[]>(
      { queryKey: ['transactions'] },
      (old) => (old ? old.map((t) => (t.id === id ? { ...t, ...changes } : t)) : old)
    )
    queryClient.setQueryData<Transaction>(['transaction', id], (old) =>
      old ? { ...old, ...changes } : old
    )
    callbacks?.onSuccess?.()
    return { offline: true, tempId }
  }

  return {
    saveCreate,
    saveUpdate,
    isPending: createTx.isPending || updateTx.isPending,
  }
}

/** Build optimistic temp Transaction từ input create */
function buildTempTransaction(tempId: string, input: CreateTransactionInput): Transaction {
  return {
    id: tempId,
    user_id: '',
    wallet_id: input.wallet_id ?? null,
    to_wallet_id: input.to_wallet_id ?? null,
    category_id: input.category_id ?? null,
    type: input.type,
    amount: input.amount,
    description: input.description ?? null,
    contact_person: input.contact_person ?? null,
    transaction_date: input.transaction_date,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

export type { SaveResult }
