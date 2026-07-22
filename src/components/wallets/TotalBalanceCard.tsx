import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'
import PageHeader from '../PageHeader'

interface TotalBalanceCardProps {
  totalBalance: number
  showBalance: boolean
  onToggleBalance: () => void
}

export function TotalBalanceCard({ totalBalance, showBalance, onToggleBalance }: TotalBalanceCardProps) {
  const { t } = useI18n()
  const { currency, formatCurrency } = useUIStore()

  return (
    <PageHeader>
      <div className="flex items-center justify-between mb-3">
        <p className="text-white/60 text-sm font-medium uppercase tracking-wide">{t.wallet.totalBalance}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.15),inset_-2px_-2px_4px_rgba(0,0,0,0.1)] hover:bg-white/30 shrink-0"
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
            {currency.symbol}{formatCurrency(totalBalance)}
          </>
        ) : (
          <span className="text-white/40 text-2xl">••••••••</span>
        )}
      </p>
    </PageHeader>
  )
}