import { Trash2, Lock, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { Wallet, WalletType } from '@/types'
import { cn } from '@/lib/utils'

interface WalletCardProps {
  wallet: Wallet
  showBalance: boolean
  isPremium?: boolean
  onDelete: (wallet: Wallet) => void
  onEdit: (wallet: Wallet) => void
  onToggleActive: (wallet: Wallet) => void
}

export function WalletCard({ wallet, showBalance, isPremium = false, onDelete, onEdit, onToggleActive }: WalletCardProps) {
  const { t } = useI18n()

  const typeLabelKeys: Record<WalletType, keyof typeof t.wallet> = {
    cash: 'cash',
    bank: 'bank',
    e_wallet: 'eWallet',
  }

  return (
    <div className={cn(
      "bg-white rounded-xl p-4 shadow-sm relative overflow-hidden",
      !wallet.is_active && "opacity-60"
    )}>
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
        style={{ backgroundColor: wallet.color }}
      />

      <div className="flex items-start justify-between relative">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{wallet.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">{wallet.name}</p>
              {!wallet.is_active && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 text-gray-500 rounded-full">Inactive</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{t.wallet[typeLabelKeys[wallet.type]]}</p>
          </div>
        </div>

        {isPremium ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
            <Lock className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-400">Premium</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {/* Edit button */}
            <button
              onClick={() => onEdit(wallet)}
              className="p-2 text-gray-300 hover:text-blue-400 transition-colors"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>

            {/* Toggle active/inactive */}
            <button
              onClick={() => onToggleActive(wallet)}
              className={cn(
                "p-2 transition-colors",
                wallet.is_active ? "text-gray-300 hover:text-orange-400" : "text-gray-300 hover:text-green-400"
              )}
              title={wallet.is_active ? "Deactivate" : "Activate"}
            >
              {wallet.is_active ? (
                <ToggleRight className="h-4 w-4" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
            </button>

            {/* Delete button (only for wallets without transactions) */}
            <button
              onClick={() => onDelete(wallet)}
              className="p-2 text-gray-300 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <p className="text-xl font-bold mt-3" style={{ color: isPremium ? '#9CA3AF' : wallet.color }}>
        {showBalance || isPremium ? (
          <>
            {new Intl.NumberFormat('vi-VN').format(wallet.balance || 0)} <span className="text-sm text-gray-400">đ</span>
          </>
        ) : (
          <span className="text-gray-300">••••••</span>
        )}
      </p>
    </div>
  )
}