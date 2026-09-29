import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'
import PageHeader from '../PageHeader'

interface BalanceOverviewProps {
  balance: number
  debt: number
  showBalance: boolean
  onToggleBalance: () => void
}

export function BalanceOverview({ balance, debt, showBalance, onToggleBalance }: BalanceOverviewProps) {
  const { t } = useI18n()
  const { currency, formatCurrency } = useUIStore()

  return (
    <PageHeader>
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/70 text-sm font-medium">{t.reports.balance}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.15),inset_-2px_-2px_4px_rgba(0,0,0,0.1)] hover:bg-white/30"
          onClick={onToggleBalance}
          aria-label={showBalance ? "Hide balance" : "Show balance"}
        >
          {showBalance ? (
            <Eye className="h-5 w-5 text-white" />
          ) : (
            <EyeOff className="h-5 w-5 text-white" />
          )}
        </Button>
      </div>

      <p className="text-3xl font-bold text-white mb-2 tabular-nums">
        {showBalance ? (
          <>
            {currency.symbol}{formatCurrency(balance)}
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
              {currency.symbol}{formatCurrency(debt)}
            </>
          ) : (
            <span className="text-white/40">••••</span>
          )}
        </p>
      </div>
    </PageHeader>
  )
}