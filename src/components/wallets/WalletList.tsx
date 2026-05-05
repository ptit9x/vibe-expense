import { Plus } from 'lucide-react'
import { WalletCard } from './WalletCard'
import type { Wallet } from '@/types'
import { cn } from '@/lib/utils'

interface WalletListProps {
  wallets: Wallet[]
  showBalance: boolean
  onDelete: (wallet: Wallet) => void
  onEdit: (wallet: Wallet) => void
  onToggleActive: (wallet: Wallet) => void
}

export function WalletList({ wallets, showBalance, onDelete, onEdit, onToggleActive }: WalletListProps) {
  const spendingWallets = wallets.filter(w => w.type === 'cash' || w.type === 'bank' || w.type === 'e_wallet')

  return (
    <div className="px-4 space-y-3 pb-6">
      {spendingWallets.map((wallet) => (
        <WalletCard
          key={wallet.id}
          wallet={wallet}
          showBalance={showBalance}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
        />
      ))}
    </div>
  )
}

// Add Wallet Button - FAB style
export function AddWalletFAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed right-5 bottom-24 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 active:scale-95 transition-all z-20"
    >
      <Plus className="h-6 w-6 text-white" />
    </button>
  )
}

// Section header component
export function WalletSectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className={cn("px-4 py-3", subtitle ? "pb-2" : "")}>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}