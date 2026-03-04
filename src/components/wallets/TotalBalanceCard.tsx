import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TotalBalanceCardProps {
  totalBalance: number
  showBalance: boolean
  onToggleBalance: () => void
}

export function TotalBalanceCard({ totalBalance, showBalance, onToggleBalance }: TotalBalanceCardProps) {
  return (
    <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/60 text-sm">Tổng tài sản</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30"
          onClick={onToggleBalance}
        >
          {showBalance ? (
            <Eye className="h-5 w-5 text-white" />
          ) : (
            <EyeOff className="h-5 w-5 text-white" />
          )}
        </Button>
      </div>
      <p className="text-3xl font-bold text-white">
        {showBalance ? (
          <>
            {new Intl.NumberFormat('vi-VN').format(totalBalance)} <span className="text-lg text-white/60">đ</span>
          </>
        ) : (
          <span className="text-white/40">••••••••</span>
        )}
      </p>
    </div>
  )
}
