import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OutboxEntry, CreateTransactionInput, UpdateTransactionInput } from '@/types'

interface OutboxState {
  entries: OutboxEntry[]

  // Actions
  add: {
    (operation: 'create', payload: CreateTransactionInput): string
    (operation: 'update', payload: UpdateTransactionInput): string
  }
  updateStatus: (tempId: string, status: OutboxEntry['status'], lastError?: string) => void
  remove: (tempId: string) => void
  retryFailed: () => void
  clearFailed: () => void
  clearAll: () => void
  getPending: () => OutboxEntry[]
}

const MAX_OFFLINE_ENTRIES = 20

export const useOutboxStore = create<OutboxState>()(
  persist(
    (set, get) => ({
      entries: [],

      add: ((operation: 'create' | 'update', payload: CreateTransactionInput | UpdateTransactionInput) => {
        if (get().entries.length >= MAX_OFFLINE_ENTRIES) {
          throw new Error('OUTBOX_FULL')
        }
        const tempId = crypto.randomUUID()
        const entry = {
          tempId,
          operation,
          payload,
          createdAt: new Date().toISOString(),
          status: 'pending' as const,
          attempts: 0,
        }
        set((state) => ({ entries: [...state.entries, entry as OutboxEntry] }))
        return tempId
      }) as OutboxState['add'],

      updateStatus: (tempId, status, lastError) =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.tempId === tempId
              ? {
                  ...e,
                  status,
                  attempts: status === 'failed' ? e.attempts + 1 : e.attempts,
                  lastError,
                }
              : e
          ),
        })),

      remove: (tempId) =>
        set((state) => ({ entries: state.entries.filter((e) => e.tempId !== tempId) })),

      retryFailed: () =>
        set((state) => ({
          entries: state.entries.map((e) =>
            e.status === 'failed'
              ? { ...e, status: 'pending' as const, lastError: undefined }
              : e
          ),
        })),

      clearFailed: () =>
        set((state) => ({ entries: state.entries.filter((e) => e.status !== 'failed') })),

      clearAll: () => set({ entries: [] }),

      getPending: () => get().entries.filter((e) => e.status === 'pending'),
    }),
    {
      name: 'vibe-expense-outbox',
      partialize: (state) => ({ entries: state.entries }),
    }
  )
)

export { MAX_OFFLINE_ENTRIES }
