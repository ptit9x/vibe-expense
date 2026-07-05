import { useQueryClient } from '@tanstack/react-query'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useOutboxStore } from '@/stores/outboxStore'
import { isSupabaseConfigured } from '@/lib/supabase'
import type {
  Transaction, Wallet, Category,
  CreateTransactionInput, UpdateTransactionInput,
} from '@/types'

interface SaveResult {
  offline: boolean
  outboxFull?: boolean
  tempId?: string
}

interface SaveCallbacks {
  onSuccess?: () => void
  onError?: (e: Error) => void
  onOffline?: () => void
}

/**
 * Encapsulates add/edit transaction với offline support.
 * - Online: await mutateAsync → onSuccess/onError.
 * - Offline: ghi outbox + optimistic cache → onOffline (KHÔNG gọi onSuccess).
 * - Mock mode (no Supabase): luôn online path.
 */
export function useTransactionSave() {
  const isOnline = useOnlineStatus()
  const createTx = useCreateTransaction()
  const updateTx = useUpdateTransaction()
  const queryClient = useQueryClient()
  const addToOutbox = useOutboxStore((s) => s.add)

  async function saveCreate(
    input: CreateTransactionInput,
    callbacks?: SaveCallbacks
  ): Promise<SaveResult> {
    // Mock mode hoặc online → Supabase
    if (!isSupabaseConfigured() || isOnline) {
      try {
        await createTx.mutateAsync(input)
        callbacks?.onSuccess?.()
      } catch (e) {
        callbacks?.onError?.(e instanceof Error ? e : new Error(String(e)))
      }
      return { offline: false }
    }

    // Offline → outbox + optimistic
    let tempId: string
    try {
      tempId = addToOutbox('create', input)
    } catch {
      return { offline: false, outboxFull: true }
    }
    const tempTx = buildTempTransaction(tempId, input, queryClient)
    queryClient.setQueriesData<Transaction[]>(
      { queryKey: ['transactions'] },
      (old) => (old ? [tempTx, ...old] : old)
    )
    callbacks?.onOffline?.()
    return { offline: true, tempId }
  }

  async function saveUpdate(
    input: UpdateTransactionInput,
    callbacks?: SaveCallbacks
  ): Promise<SaveResult> {
    if (!isSupabaseConfigured() || isOnline) {
      try {
        await updateTx.mutateAsync(input)
        callbacks?.onSuccess?.()
      } catch (e) {
        callbacks?.onError?.(e instanceof Error ? e : new Error(String(e)))
      }
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
    callbacks?.onOffline?.()
    return { offline: true, tempId }
  }

  return {
    saveCreate,
    saveUpdate,
    isPending: createTx.isPending || updateTx.isPending,
  }
}

// ===== Helpers =====

type QC = ReturnType<typeof useQueryClient>

/** Look up wallet từ TanStack Query cache by ID */
function lookupWallet(qc: QC, walletId: string | null | undefined): Wallet | undefined {
  if (!walletId) return undefined
  for (const [, data] of qc.getQueriesData<Wallet[]>({ queryKey: ['wallets'] })) {
    const found = data?.find((w) => w.id === walletId)
    if (found) return found
  }
  return undefined
}

/** Look up category từ TanStack Query cache by ID */
function lookupCategory(qc: QC, categoryId: string | null | undefined): Category | undefined {
  if (!categoryId) return undefined
  for (const [, data] of qc.getQueriesData<Category[]>({ queryKey: ['categories'] })) {
    const found = data?.find((c) => c.id === categoryId)
    if (found) return found
  }
  return undefined
}

/** Build optimistic temp Transaction, fill relation data từ cache để UI không hiện undefined */
function buildTempTransaction(tempId: string, input: CreateTransactionInput, qc: QC): Transaction {
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
    // Relations — lookup từ cache để UI render đúng tên/icon/màu
    wallet: lookupWallet(qc, input.wallet_id),
    to_wallet: lookupWallet(qc, input.to_wallet_id),
    category: lookupCategory(qc, input.category_id),
  }
}

export type { SaveResult }
