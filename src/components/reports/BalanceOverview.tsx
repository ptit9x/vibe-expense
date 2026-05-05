import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

interface BalanceOverviewProps {
  balance: number
  debt: number
  showBalance: boolean
  onToggleBalance: () => void
}

export function BalanceOverview({ balance, debt, showBalance, onToggleBalance }: BalanceOverviewProps) {
  const { t } = useI18n()

  return (
    <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/60 text-sm">{t.reports.balance}</p>
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
      
      <p className="text-3xl font-bold text-white mb-2">
        {showBalance ? (
          <>
            {new Intl.NumberFormat('vi-VN').format(balance)} <span className="text-lg text-white/60">đ</span>
          </>
        ) : (
          <span className="text-white/40">••••••••</span>
        )}
      </p>
      
      <div className="flex items-center gap-2">
        <p className="text-white/60 text-sm">{t.reports.debt}</p>
        <p className="text-white font-medium">
          {showBalance ? (
            <>
              {new Intl.NumberFormat('vi-VN').format(debt)} <span className="text-sm text-white/60">đ</span>
            </>
          ) : (
            <span className="text-white/40">••••</span>
          )}
        </p>
      </div>
    </div>
  )
}
