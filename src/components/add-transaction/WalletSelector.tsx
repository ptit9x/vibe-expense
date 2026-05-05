import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

export interface WalletItem {
  id: string
  name: string
  icon: string
  type: string
  color?: string
}

interface WalletSelectorProps {
  wallets: WalletItem[]
  selectedId: string
  onSelect: (id: string) => void
}

export function WalletSelector({ wallets, selectedId, onSelect }: WalletSelectorProps) {
  const { t } = useI18n()
  return (
    <div className="bg-white mt-2 px-5 py-4">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">{t.transaction.wallet}</p>
      <div 
        className="flex gap-2 overflow-x-auto pb-2 px-5 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {wallets?.map((wallet) => (
          <button
            key={wallet.id}
            onClick={() => onSelect(wallet.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full transition-all text-sm shrink-0",
              selectedId === wallet.id
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <span className="text-lg">{wallet.icon}</span>
            <span className="font-medium whitespace-nowrap">{wallet.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}