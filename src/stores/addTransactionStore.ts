import { create } from 'zustand'

type TransactionType = 'expense' | 'income' | 'lend' | 'borrow' | 'transfer'

interface AddTransactionState {
  type: TransactionType
  amount: string
  categoryId: string
  walletId: string
  description: string
  date: string
  showTypeDropdown: boolean
  
  // Actions
  setType: (type: TransactionType) => void
  setAmount: (amount: string) => void
  setCategoryId: (categoryId: string) => void
  setWalletId: (walletId: string) => void
  setDescription: (description: string) => void
  setDate: (date: string) => void
  setShowTypeDropdown: (show: boolean) => void
  toggleTypeDropdown: () => void
  reset: () => void
}

const initialDate = new Date().toISOString().split('T')[0]

export const useAddTransactionStore = create<AddTransactionState>((set) => ({
  type: 'expense',
  amount: '',
  categoryId: '',
  walletId: '',
  description: '',
  date: initialDate,
  showTypeDropdown: false,
  
  setType: (type) => set({ type }),
  setAmount: (amount) => set({ amount }),
  setCategoryId: (categoryId) => set({ categoryId }),
  setWalletId: (walletId) => set({ walletId }),
  setDescription: (description) => set({ description }),
  setDate: (date) => set({ date }),
  setShowTypeDropdown: (show) => set({ showTypeDropdown: show }),
  toggleTypeDropdown: () => set((state) => ({ showTypeDropdown: !state.showTypeDropdown })),
  reset: () => set({
    type: 'expense',
    amount: '',
    categoryId: '',
    walletId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    showTypeDropdown: false,
  }),
}))
