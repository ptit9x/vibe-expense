import { create } from 'zustand'
import type { TransactionType } from '@/types'

interface TransactionFormState {
  mode: 'add' | 'edit'
  transactionId: string | null
  type: TransactionType
  amount: string
  categoryId: string
  walletId: string
  description: string
  date: string
  showTypeDropdown: boolean

  // Actions
  setMode: (mode: 'add' | 'edit') => void
  setType: (type: TransactionType) => void
  setAmount: (amount: string) => void
  setCategoryId: (categoryId: string) => void
  setWalletId: (walletId: string) => void
  setDescription: (description: string) => void
  setDate: (date: string) => void
  setShowTypeDropdown: (show: boolean) => void
  toggleTypeDropdown: () => void
  loadTransaction: (data: {
    id: string
    type: TransactionType
    amount: number
    categoryId?: string
    walletId?: string
    description?: string
    date: string
  }) => void
  reset: () => void
}

const getInitialDate = () => new Date().toISOString().split('T')[0]

const initialState = {
  mode: 'add' as const,
  transactionId: null as string | null,
  type: 'expense' as TransactionType,
  amount: '',
  categoryId: '',
  walletId: '',
  description: '',
  date: getInitialDate(),
  showTypeDropdown: false,
}

export const useTransactionFormStore = create<TransactionFormState>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),
  setType: (type) => set({ type }),
  setAmount: (amount) => set({ amount }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setWalletId: (walletId) => set({ walletId }),
  setDescription: (description) => set({ description }),
  setDate: (date) => set({ date }),
  setShowTypeDropdown: (show) => set({ showTypeDropdown: show }),
  toggleTypeDropdown: () => set((state) => ({ showTypeDropdown: !state.showTypeDropdown })),
  loadTransaction: (data) => set({
    mode: 'edit',
    transactionId: data.id,
    type: data.type,
    amount: String(data.amount),
    categoryId: data.categoryId || '',
    walletId: data.walletId || '',
    description: data.description || '',
    date: data.date,
    showTypeDropdown: false,
  }),
  reset: () => set(initialState),
}))

// Backward-compatible alias
export const useAddTransactionStore = useTransactionFormStore
