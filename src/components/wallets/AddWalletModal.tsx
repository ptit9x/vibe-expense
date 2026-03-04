import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { WalletType } from '@/types'

const walletTypes: { type: WalletType; icon: string; label: string; color: string }[] = [
  { type: 'cash', icon: '💵', label: 'Tiền mặt', color: '#3B82F6' },
  { type: 'bank', icon: '🏦', label: 'Thẻ ngân hàng', color: '#10B981' },
  { type: 'e_wallet', icon: '📱', label: 'Ví điện tử', color: '#8B5CF6' },
]

interface AddWalletModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; type: WalletType; icon: string; color: string; initial_balance: number }) => void
  isPending: boolean
}

export function AddWalletModal({ isOpen, onClose, onSubmit, isPending }: AddWalletModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<WalletType>('cash')
  const [initialBalance, setInitialBalance] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const selectedType = walletTypes.find(t => t.type === type)
    onSubmit({
      name,
      type,
      icon: selectedType?.icon || '💰',
      color: selectedType?.color || '#3B82F6',
      initial_balance: parseFloat(initialBalance) || 0,
    })
  }

  const resetAndClose = () => {
    setName('')
    setInitialBalance('')
    setType('cash')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50">
      <div className="absolute bottom-20 left-0 right-0 bg-white rounded-t-3xl p-5 pb-8">
        {/* Handle bar */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900">Thêm ví mới</h3>
          <button onClick={resetAndClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 block">Tên ví</label>
            <Input
              placeholder="VD: Ví tiền mặt"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>

          {/* Type Selection */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 block">Loại ví</label>
            <div className="grid grid-cols-3 gap-2">
              {walletTypes.map((wt) => (
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
                  <p className="text-xs mt-1 font-medium">{wt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Initial Balance */}
          <div className="mb-5">
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 block">Số dư ban đầu</label>
            <Input
              type="number"
              placeholder="0"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="h-12 text-base"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 text-base font-medium"
          >
            {isPending ? 'Đang lưu...' : 'Thêm ví'}
          </Button>
        </form>
      </div>
    </div>
  )
}
