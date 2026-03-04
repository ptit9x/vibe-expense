import { create } from 'zustand'

interface WalletsState {
  showForm: boolean
  showBalance: boolean
  
  toggleForm: () => void
  toggleBalance: () => void
  setShowForm: (show: boolean) => void
}

export const useWalletsStore = create<WalletsState>((set) => ({
  showForm: false,
  showBalance: true,
  
  toggleForm: () => set((state) => ({ showForm: !state.showForm })),
  toggleBalance: () => set((state) => ({ showBalance: !state.showBalance })),
  setShowForm: (show) => set({ showForm: show }),
}))
