import { useState } from 'react'
import { BottomSheet, BottomSheetFormField } from '@/components/ui/bottom-sheet'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import type { WalletType } from '@/types'

interface WalletTypeOption {
  type: WalletType
  icon: string
  labelKey: 'wallet.cash' | 'wallet.bank' | 'wallet.eWallet'
  color: string
}

const walletTypeOptions: WalletTypeOption[] = [
  { type: 'cash', icon: '💵', labelKey: 'wallet.cash', color: '#3B82F6' },
  { type: 'bank', icon: '🏦', labelKey: 'wallet.bank', color: '#10B981' },
  { type: 'e_wallet', icon: '📱', labelKey: 'wallet.eWallet', color: '#8B5CF6' },
]

interface AddWalletModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; type: WalletType; icon: string; color: string; initial_balance: number }) => void
  isPending: boolean
}

export function AddWalletModal({ isOpen, onClose, onSubmit, isPending }: AddWalletModalProps) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [type, setType] = useState<WalletType>('cash')
  const [initialBalance, setInitialBalance] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const selectedType = walletTypeOptions.find(wt => wt.type === type)
    onSubmit({
      name,
      type,
      icon: selectedType?.icon || '💰',
      color: selectedType?.color || '#3B82F6',
      initial_balance: parseFloat(initialBalance) || 0,
    })
  }

  const handleClose = () => {
    setName('')
    setInitialBalance('')
    setType('cash')
    onClose()
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={t.wallet.addWallet}
      isPending={isPending}
      onSubmit={handleSubmit}
      submitDisabled={!name.trim()}
      submitLabel={t.wallet.addWallet}
    >
      <BottomSheetFormField label={t.wallet.walletName}>
        <Input
          placeholder={t.wallet.walletName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 text-base"
        />
      </BottomSheetFormField>

      <BottomSheetFormField label={t.wallet.walletType}>
        <div className="grid grid-cols-3 gap-2">
          {walletTypeOptions.map((wt) => (
            <button
              key={wt.type}
              type="button"
              onClick={() => setType(wt.type)}
              className={cn(
                "p-3 rounded-xl border text-center transition-all",
                type === wt.type
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-100 hover:border-gray-200"
              )}
            >
              <span className="text-2xl">{wt.icon}</span>
              <p className="text-xs mt-1 font-medium">
                {t[wt.labelKey.split('.')[0] as 'wallet'][wt.labelKey.split('.')[1] as keyof typeof t.wallet]}
              </p>
            </button>
          ))}
        </div>
      </BottomSheetFormField>

      <BottomSheetFormField label={t.wallet.initialBalance}>
        <Input
          type="number"
          placeholder="0"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
          className="h-12 text-base"
        />
      </BottomSheetFormField>
    </BottomSheet>
  )
}