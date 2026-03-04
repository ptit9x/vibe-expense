import { Trash2, Lock } from 'lucide-react'
import type { Wallet, WalletType } from '@/types'

interface WalletCardProps {
  wallet: Wallet
  showBalance: boolean
  isPremium?: boolean
  onDelete: (id: string) => void
}

const typeLabels: Record<WalletType, string> = {
  cash: 'Tiền mặt',
  bank: 'Thẻ ngân hàng',
  e_wallet: 'Ví điện tử',
}

export function WalletCard({ wallet, showBalance, isPremium = false, onDelete }: WalletCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10"
        style={{ backgroundColor: wallet.color }}
      />
      
      <div className="flex items-start justify-between relative">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{wallet.icon}</span>
          <div>
            <p className="font-medium text-gray-900">{wallet.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{typeLabels[wallet.type]}</p>
          </div>
        </div>
        
        {isPremium ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
            <Lock className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-400">Premium</span>
          </div>
        ) : (
          <button
            onClick={() => onDelete(wallet.id)}
            className="p-2 text-gray-300 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
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
