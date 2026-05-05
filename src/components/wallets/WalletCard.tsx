import { Edit2, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { Wallet, WalletType } from '@/types'
import { cn } from '@/lib/utils'

interface WalletCardProps {
  wallet: Wallet
  showBalance: boolean
  onDelete: (wallet: Wallet) => void
  onEdit: (wallet: Wallet) => void
  onToggleActive: (wallet: Wallet) => void
}

export function WalletCard({ wallet, showBalance, onDelete, onEdit, onToggleActive }: WalletCardProps) {
  const { t } = useI18n()

  const typeLabels: Record<WalletType, string> = {
    cash: t.wallet.cash,
    bank: t.wallet.bank,
    e_wallet: t.wallet.eWallet,
  }

  const isNegative = (wallet.balance || 0) < 0
  const balanceColor = isNegative ? 'text-red-500' : 'text-gray-900'

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm relative overflow-hidden group">
      {/* Colored accent circle - top right */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-5"
        style={{ backgroundColor: wallet.color }}
      />

      <div className="flex items-start justify-between">
        {/* Left: Icon + Name + Type */}
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
            style={{ backgroundColor: wallet.color + '15' }}
          >
            {wallet.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 text-base">{wallet.name}</p>
              {!wallet.is_active && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
                  Inactive
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{typeLabels[wallet.type]}</p>
          </div>
        </div>

        {/* Right: Balance */}
        <div className="text-right">
          <p className={cn("text-xl font-bold", balanceColor)}>
            {showBalance ? (
              <>
                {isNegative && '-'}
                {new Intl.NumberFormat('vi-VN').format(Math.abs(wallet.balance || 0))}
                <span className="text-xs font-normal text-gray-400 ml-0.5">đ</span>
              </>
            ) : (
              <span className="text-gray-300 text-base">••••••</span>
            )}
          </p>
        </div>
      </div>

      {/* Actions - visible on hover, always visible on mobile */}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(wallet)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          title="Edit"
        >
          <Edit2 className="h-3.5 w-3.5" />
          <span>Edit</span>
        </button>

        <button
          onClick={() => onToggleActive(wallet)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors",
            wallet.is_active
              ? "text-gray-500 hover:text-orange-500 hover:bg-orange-50"
              : "text-gray-500 hover:text-green-500 hover:bg-green-50"
          )}
          title={wallet.is_active ? "Hide wallet" : "Show wallet"}
        >
          {wallet.is_active ? (
            <>
              <ToggleRight className="h-3.5 w-3.5" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <ToggleLeft className="h-3.5 w-3.5" />
              <span>Show</span>
            </>
          )}
        </button>

        <button
          onClick={() => onDelete(wallet)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  )
}