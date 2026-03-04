import { create } from 'zustand'

interface DashboardState {
  showBalance: boolean
  currentMonth: string
  
  toggleBalance: () => void
  setShowBalance: (show: boolean) => void
  setCurrentMonth: (month: string) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  showBalance: true,
  currentMonth: new Date().toISOString().slice(0, 7),
  
  toggleBalance: () => set((state) => ({ showBalance: !state.showBalance })),
  setShowBalance: (show) => set({ showBalance: show }),
  setCurrentMonth: (month) => set({ currentMonth: month }),
}))
