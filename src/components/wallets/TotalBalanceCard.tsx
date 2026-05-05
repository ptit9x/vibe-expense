import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

interface TotalBalanceCardProps {
  totalBalance: number
  showBalance: boolean
  onToggleBalance: () => void
}

export function TotalBalanceCard({ totalBalance, showBalance, onToggleBalance }: TotalBalanceCardProps) {
  const { t } = useI18n()

  return (
    <div className="bg-linear-to-r from-blue-500 to-blue-600 px-5 pt-4 pb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/60 text-xs font-medium uppercase tracking-wide">{t.wallet.totalBalance}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 shrink-0"
          onClick={onToggleBalance}
          aria-label={showBalance ? 'Hide balance' : 'Show balance'}
        >
          {showBalance ? (
            <EyeOff className="h-4 w-4 text-white" />
          ) : (
            <Eye className="h-4 w-4 text-white" />
          )}
        </Button>
      </div>
      <p className="text-3xl font-bold text-white tracking-tight">
        {showBalance ? (
          <>
            {new Intl.NumberFormat('vi-VN').format(totalBalance)}
            <span className="text-lg text-white/60 ml-1">đ</span>
          </>
        ) : (
          <span className="text-white/40 text-2xl">••••••••</span>
        )}
      </p>
    </div>
  )
}