import { create } from 'zustand'
import type { TransactionType } from '@/types'

interface TransactionFormState {
  mode: 'add' | 'edit'
  transactionId: string | null
  type: TransactionType
  amount: string
  categoryId: string
  walletId: string
  toWalletId: string
  description: string
  contactPerson: string
  date: string
  showTypeDropdown: boolean

  // Actions
  setMode: (mode: 'add' | 'edit') => void
  setType: (type: TransactionType) => void
  setAmount: (amount: string) => void
  setCategoryId: (categoryId: string) => void
  setWalletId: (walletId: string) => void
  setToWalletId: (toWalletId: string) => void
  setDescription: (description: string) => void
  setContactPerson: (contactPerson: string) => void
  setDate: (date: string) => void
  setShowTypeDropdown: (show: boolean) => void
  toggleTypeDropdown: () => void
  loadTransaction: (data: {
    id: string
    type: TransactionType
    amount: number
    categoryId?: string
    walletId?: string
    toWalletId?: string
    description?: string
    contactPerson?: string
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
  toWalletId: '',
  description: '',
  contactPerson: '',
  date: getInitialDate(),
  showTypeDropdown: false,
}

export const useTransactionFormStore = create<TransactionFormState>((set) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),
  setType: (type) => set((state) => {
    // Auto-fill description default when switching type (only in add mode)
    // Note: localized defaults are handled by the component, not the store
    const defaultDesc = state.mode === 'add' && !state.description
      ? ''
      : state.description
    return { type, description: defaultDesc }
  }),
  setAmount: (amount) => set({ amount }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setWalletId: (walletId) => set({ walletId }),
  setToWalletId: (toWalletId) => set({ toWalletId }),
  setDescription: (description) => set({ description }),
  setContactPerson: (contactPerson) => set({ contactPerson }),
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
    toWalletId: data.toWalletId || '',
    description: data.description || '',
    contactPerson: data.contactPerson || '',
    date: data.date,
    showTypeDropdown: false,
  }),
  reset: () => set({
    ...initialState,
    date: getInitialDate(),
  }),
}))
