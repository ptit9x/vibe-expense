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
  const { currency, formatCurrency } = useUIStore()

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Income */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 p-4 shadow-md shadow-emerald-500/20"
      >
        <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/10 rounded-full blur-lg" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <ArrowUpRight className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-medium text-white/80">{t.dashboard.income}</span>
          </div>
          <p className="text-lg font-bold text-white leading-snug">
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
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 p-4 shadow-md shadow-rose-500/20"
      >
        <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/10 rounded-full blur-lg" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <ArrowDownRight className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-medium text-white/80">{t.dashboard.expense}</span>
          </div>
          <p className="text-lg font-bold text-white leading-snug">
            {formatMoney(expense, showBalance, currency.symbol, formatCurrency)}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
