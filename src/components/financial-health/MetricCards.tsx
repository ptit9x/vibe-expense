import { TrendingUp, TrendingDown, Minus, PiggyBank, CreditCard, Activity, Wallet, Landmark } from 'lucide-react'
import type { FinancialHealthMetrics } from '@/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  metrics: FinancialHealthMetrics
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} tỷ`
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} triệu`
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  return value.toLocaleString('vi-VN')
}

export default function MetricCards({ metrics }: Props) {
  const { t } = useI18n()

  const trendIcon = {
    increasing: <TrendingUp className="h-4 w-4 text-red-500" />,
    decreasing: <TrendingDown className="h-4 w-4 text-green-500" />,
    stable: <Minus className="h-4 w-4 text-yellow-500" />,
    insufficient_data: <Activity className="h-4 w-4 text-gray-400" />,
  }

  const trendLabel = {
    increasing: t.financialHealth.trend.increasing,
    decreasing: t.financialHealth.trend.decreasing,
    stable: t.financialHealth.trend.stable,
    insufficient_data: t.financialHealth.trend.insufficient,
  }

  const cards = [
    {
      icon: <PiggyBank className="h-5 w-5" />,
      label: t.financialHealth.metrics.savingsRate,
      value: `${metrics.savingsRate}%`,
      color:
        metrics.savingsRate >= 20
          ? 'text-green-500 bg-green-50'
          : metrics.savingsRate >= 0
            ? 'text-yellow-500 bg-yellow-50'
            : 'text-red-500 bg-red-50',
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: t.financialHealth.metrics.debtToIncome,
      value: `${metrics.debtToIncomeRatio}%`,
      color:
        metrics.debtToIncomeRatio <= 10
          ? 'text-green-500 bg-green-50'
          : metrics.debtToIncomeRatio <= 30
            ? 'text-yellow-500 bg-yellow-50'
            : 'text-red-500 bg-red-50',
    },
    {
      icon: trendIcon[metrics.spendingTrend],
      label: t.financialHealth.metrics.spendingTrend,
      value: trendLabel[metrics.spendingTrend],
      color:
        metrics.spendingTrend === 'decreasing'
          ? 'text-green-500 bg-green-50'
          : metrics.spendingTrend === 'increasing'
            ? 'text-red-500 bg-red-50'
            : 'text-yellow-500 bg-yellow-50',
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: t.financialHealth.metrics.expenseToIncome,
      value: `${metrics.expenseToIncomeRatio}%`,
      color:
        metrics.expenseToIncomeRatio <= 70
          ? 'text-green-500 bg-green-50'
          : metrics.expenseToIncomeRatio <= 90
            ? 'text-yellow-500 bg-yellow-50'
            : 'text-red-500 bg-red-50',
    },
    {
      icon: <Wallet className="h-5 w-5" />,
      label: t.financialHealth.metrics.totalAssets,
      value: `${formatCompact(metrics.totalAssets)}đ`,
      color:
        metrics.totalAssets > 0
          ? 'text-blue-500 bg-blue-50'
          : 'text-gray-400 bg-gray-50',
    },
    {
      icon: <Landmark className="h-5 w-5" />,
      label: t.financialHealth.metrics.netWorth,
      value: `${formatCompact(metrics.netWorth)}đ`,
      color:
        metrics.netWorth > 0
          ? 'text-green-500 bg-green-50'
          : metrics.netWorth === 0
            ? 'text-gray-400 bg-gray-50'
            : 'text-red-500 bg-red-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div
            className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-2 ${card.color}`}
          >
            {card.icon}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {card.label}
          </p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
