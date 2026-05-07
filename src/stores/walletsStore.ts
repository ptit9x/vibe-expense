import { create } from 'zustand'

interface WalletsState {
  showForm: boolean
  
  toggleForm: () => void
  setShowForm: (show: boolean) => void
}

export const useWalletsStore = create<WalletsState>((set) => ({
  showForm: false,
  
  toggleForm: () => set((state) => ({ showForm: !state.showForm })),
  setShowForm: (show) => set({ showForm: show }),
}))
