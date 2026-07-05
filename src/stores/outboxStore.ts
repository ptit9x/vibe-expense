import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OutboxEntry, OutboxOperation, CreateTransactionInput, UpdateTransactionInput } from '@/types'

interface OutboxState {
  entries: OutboxEntry[]

  // Actions
  add: (operation: OutboxOperation, payload: CreateTransactionInput | UpdateTransactionInput) => string
  updateStatus: (tempId: string, status: OutboxEntry['status'], lastError?: string) => void
  remove: (tempId: string) => void
  clearFailed: () => void
  clearAll: () => void
  getPending: () => OutboxEntry[]
}

const MAX_OFFLINE_ENTRIES = 20

export const useOutboxStore = create<OutboxState>()(
  persist(
    (set, get) => ({
      entries: [],

      add: (operation, payload) => {
        // Giới hạn: không cho phép ghi thêm nếu đã quá MAX_OFFLINE_ENTRIES
        if (get().entries.length >= MAX_OFFLINE_ENTRIES) {
          throw new Error('OUTBOX_FULL')
        }
        const tempId = crypto.randomUUID()
        const entry: OutboxEntry = {
          tempId,
          operation,
          payload,
          createdAt: new Date().toISOString(),
          status: 'pending',
          attempts: 0,
        }
        set((state) => ({ entries: [...state.entries, entry] }))
        return tempId
      },

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
