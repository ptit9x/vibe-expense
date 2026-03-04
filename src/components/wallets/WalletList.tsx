import { Plus } from 'lucide-react'
import { TotalBalanceCard } from './TotalBalanceCard'
import { WalletCard } from './WalletCard'
import type { Wallet } from '@/types'

interface WalletListProps {
  wallets: Wallet[]
  showBalance: boolean
  onDelete: (wallet: Wallet) => void
}

export function WalletList({ wallets, showBalance, onDelete }: WalletListProps) {
  // For now, show all wallets without grouping (premium grouping requires auth check)
  const spendingWallets = wallets.filter(w => w.type === 'cash' || w.type === 'bank')

  return (
    <div className="px-4 space-y-4 pb-6">
      {spendingWallets.map((wallet) => (
        <WalletCard
          key={wallet.id}
          wallet={wallet}
          showBalance={showBalance}
          onDelete={() => onDelete(wallet)}
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
      className="fixed right-4 bottom-24 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors z-20"
    >
      <Plus className="h-6 w-6 text-white" />
    </button>
  )
}

export { TotalBalanceCard }
export { WalletCard }
