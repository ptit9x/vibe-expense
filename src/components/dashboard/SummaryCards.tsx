import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'

interface SummaryCardsProps {
  totalBalance: number
  income: number
  expense: number
  showBalance: boolean
}

function formatMoney(amount: number, show: boolean, symbol: string, formatFn: (n: number) => string): string {
  if (!show) return '••••••'
  return symbol + formatFn(amount)
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
}

export function SummaryCards({ income, expense, showBalance }: SummaryCardsProps) {
  const { t } = useI18n()
  const currency = useUIStore((s) => s.currency)
  const formatCurrency = useUIStore((s) => s.formatCurrency)
  const net = income - expense
  const netIsPositive = net >= 0

  return (
    <div className="space-y-3">
    {/* Net cashflow — the single most important number, previously missing */}
    <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" className="clay-card flex items-center justify-between px-4 py-3.5">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{t.dashboard.netCashflow}</p>
        <p className={`text-xl font-bold tabular-nums ${netIsPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {showBalance ? `${netIsPositive ? '+' : '−'}${currency.symbol}${formatCurrency(Math.abs(net))}` : '••••••'}
        </p>
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${netIsPositive ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>
        {income > 0 ? `${Math.round((net / income) * 100)}% ${t.dashboard.ofIncome}` : '—'}
      </span>
    </motion.div>
    <div className="grid grid-cols-2 gap-3">
      {/* Income */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-3xl p-4
          bg-gradient-to-br from-emerald-500 to-emerald-600
          shadow-[-6px_-6px_14px_rgba(255,255,255,0.9),6px_6px_14px_rgba(16,185,129,0.35)]
          border border-white/40"
      >
        <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/10 rounded-full blur-lg" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <ArrowUpRight className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-medium text-white/80">{t.dashboard.income}</span>
          </div>
          <p className="text-lg font-bold text-white leading-snug tabular-nums">
            {formatMoney(income, showBalance, currency.symbol, formatCurrency)}
          </p>
        </div>
      </motion.div>

      {/* Expense */}
      <motion.div
        custom={1}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-3xl p-4
          bg-gradient-to-br from-rose-500 to-rose-600
          shadow-[-6px_-6px_14px_rgba(255,255,255,0.9),6px_6px_14px_rgba(244,63,94,0.35)]
          border border-white/40"
      >
        <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/10 rounded-full blur-lg" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <ArrowDownRight className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-medium text-white/80">{t.dashboard.expense}</span>
          </div>
          <p className="text-lg font-bold text-white leading-snug tabular-nums">
            {formatMoney(expense, showBalance, currency.symbol, formatCurrency)}
          </p>
        </div>
      </motion.div>
    </div>
    </div>
  )
}
