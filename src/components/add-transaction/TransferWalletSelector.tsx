import { ArrowDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { WalletItem } from './WalletSelector'
import { WalletSelector } from './WalletSelector'

interface TransferWalletSelectorProps {
  wallets: WalletItem[]
  fromWalletId: string
  toWalletId: string
  onFromSelect: (id: string) => void
  onToSelect: (id: string) => void
}

export function TransferWalletSelector({
  wallets,
  fromWalletId,
  toWalletId,
  onFromSelect,
  onToSelect,
}: TransferWalletSelectorProps) {
  const { t } = useI18n()

  return (
    <div className="bg-white mt-2 px-5 py-4">
      <WalletSelector
        wallets={wallets}
        selectedId={fromWalletId}
        excludeId={toWalletId}
        onSelect={onFromSelect}
        label={t.transaction.fromWallet || 'From Wallet'}
        placeholder={t.transaction.selectWallet || 'Select wallet'}
      />

      {/* Arrow divider */}
      <div className="flex justify-center my-2">
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
          <ArrowDown className="w-4 h-4 text-blue-500" />
        </div>
      </div>

      <WalletSelector
        wallets={wallets}
        selectedId={toWalletId}
        excludeId={fromWalletId}
        onSelect={onToSelect}
        label={t.transaction.toWallet || 'To Wallet'}
        placeholder={t.transaction.selectWallet || 'Select wallet'}
      />
    </div>
  )
}
