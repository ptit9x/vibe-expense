import { useNavigate } from 'react-router-dom'
import { Edit2, ChevronRight, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { Wallet, WalletType } from '@/types'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'

interface WalletCardProps {
  wallet: Wallet
  showBalance: boolean
  onDelete: (wallet: Wallet) => void
  onEdit: (wallet: Wallet) => void
  onToggleActive: (wallet: Wallet) => void
}

export function WalletCard({ wallet, showBalance, onDelete, onEdit, onToggleActive }: WalletCardProps) {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { currency, formatCurrency } = useUIStore()

  const typeLabels: Record<WalletType, string> = {
    cash: t.wallet.cash,
    bank: t.wallet.bank,
    e_wallet: t.wallet.eWallet,
  }

  const isNegative = (wallet.balance || 0) < 0
  const balanceColor = isNegative ? 'text-red-500' : 'text-gray-900'

  return (
    <div
      className="bg-white rounded-2xl shadow-sm relative group cursor-pointer active:scale-[0.99] transition-transform"
      onClick={() => navigate(`/transactions?wallet_id=${wallet.id}`)}
    >
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          {/* Left: Icon + Name + Type */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: wallet.color + '15' }}
            >
              {wallet.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 text-base truncate">{wallet.name}</p>
                {!wallet.is_active && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium shrink-0">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{typeLabels[wallet.type]}</p>
            </div>
          </div>

          {/* Right: Balance + Chevron */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <p className={cn("text-lg font-bold", balanceColor)}>
                {showBalance ? (
                  <>
                    {isNegative && '-'}
                    {currency.symbol}{formatCurrency(Math.abs(wallet.balance || 0))}
                  </>
                ) : (
                  <span className="text-gray-300 text-base">••••••••</span>
                )}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300" />
          </div>
        </div>
      </div>

      {/* Actions - stop propagation so they don't trigger navigation */}
      <div
        className="flex items-center gap-1 px-4 pb-3 pt-1 border-t border-gray-50"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onEdit(wallet)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
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
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  )
}
