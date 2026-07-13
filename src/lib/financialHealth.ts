/**
 * Financial Health Scoring Engine
 *
 * Pure functions that compute health metrics from raw transaction/wallet/budget data.
 * No side effects, no API calls — testable and deterministic.
 */

import type {
  Transaction,
  Wallet,
  Budget,
  SavingsGoal,
  FinancialHealthMetrics,
  AIAnalysis,
  HealthGrade,
} from '@/types'
import type { TranslationKey } from '@/lib/i18n/translations'

// ── Helpers ──────────────────────────────────────────────────────────

function sumByType(transactions: Transaction[], type: Transaction['type']): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + Number(t.amount), 0)
}

function groupByMonth(transactions: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const month = t.transaction_date.slice(0, 7) // YYYY-MM
    const arr = map.get(month) || []
    arr.push(t)
    map.set(month, arr)
  }
  return map
}

// ── Main compute function ────────────────────────────────────────────

export function computeHealthMetrics(opts: {
  transactions: Transaction[]
  wallets: Wallet[]
  budgets?: Budget[]
  savingsGoals?: SavingsGoal[]
  periodMonths?: number // default 1 (current month)
}): FinancialHealthMetrics {
  const {
    transactions,
    wallets,
    budgets = [],
    savingsGoals = [],
  } = opts

  const totalIncome = sumByType(transactions, 'income')
  const totalExpense = sumByType(transactions, 'expense')
  const totalBorrow = sumByType(transactions, 'borrow')
  const totalLent = sumByType(transactions, 'lend')
  const totalDebt = Math.max(totalBorrow - totalLent, 0)

  // Total assets: sum of all active wallet balances
  const totalAssets = wallets.reduce((sum, w) => {
    const balance = w.balance ?? w.initial_balance ?? 0
    return sum + Number(balance)
  }, 0)

  // Net worth: assets minus outstanding debt
  const netWorth = totalAssets - totalDebt

  // Asset-to-debt ratio: how many times assets cover debt (0 if no debt)
  const assetToDebtRatio =
    totalDebt > 0
      ? Math.round((totalAssets / totalDebt) * 10000) / 100
      : 0

  // Savings rate: (income - expense) / income * 100
  const savingsRate =
    totalIncome > 0
      ? Math.round(((totalIncome - totalExpense) / totalIncome) * 10000) / 100
      : 0

  // Expense-to-income ratio
  const expenseToIncomeRatio =
    totalIncome > 0
      ? Math.round((totalExpense / totalIncome) * 10000) / 100
      : 0

  // Debt-to-income ratio
  const debtToIncomeRatio =
    totalIncome > 0
      ? Math.round((totalDebt / totalIncome) * 10000) / 100
      : 0

  // Spending trend (compare last 3 months)
  const spendingTrend = computeSpendingTrend(transactions)

  // Top expense categories
  const topExpenseCategories = computeTopCategories(transactions)

  // Budget usage
  const budgetUsage = computeBudgetUsage(transactions, budgets)

  // Savings goal progress
  const savingsGoalProgress = savingsGoals.map((g) => ({
    name: g.name,
    target: g.target_amount,
    current: g.current_amount,
    percentage:
      g.target_amount > 0
        ? Math.round((g.current_amount / g.target_amount) * 10000) / 100
        : 0,
  }))

  // Monthly expense comparison (last 6 months)
  const monthlyExpenseComparison = computeMonthlyExpenseComparison(transactions)

  return {
    totalIncome,
    totalExpense,
    totalDebt,
    totalLent,
    totalAssets,
    netWorth,
    assetToDebtRatio,
    savingsRate,
    expenseToIncomeRatio,
    debtToIncomeRatio,
    spendingTrend,
    topExpenseCategories,
    budgetUsage,
    savingsGoalProgress,
    monthlyExpenseComparison,
  }
}

// ── Spending trend ───────────────────────────────────────────────────

function computeSpendingTrend(
  transactions: Transaction[]
): FinancialHealthMetrics['spendingTrend'] {
  const byMonth = groupByMonth(transactions)

  // Get last 3 months sorted
  const months = Array.from(byMonth.keys()).sort().slice(-3)
  if (months.length < 2) return 'insufficient_data'

  const expenses = months.map((m) =>
    sumByType(byMonth.get(m) || [], 'expense')
  )

  const first = expenses[0]
  const last = expenses[expenses.length - 1]
  const change = first > 0 ? ((last - first) / first) * 100 : 0

  if (change > 10) return 'increasing'
  if (change < -10) return 'decreasing'
  return 'stable'
}

// ── Top expense categories ───────────────────────────────────────────

function computeTopCategories(
  transactions: Transaction[]
): FinancialHealthMetrics['topExpenseCategories'] {
  const catMap = new Map<
    string,
    {
      id: string
      name: string
      icon: string
      color: string
      total: number
      count: number
    }
  >()

  for (const t of transactions) {
    if (t.type !== 'expense' || !t.category) continue
    const cat = t.category
    const existing = catMap.get(cat.id) || {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      total: 0,
      count: 0,
    }
    existing.total += Number(t.amount)
    existing.count += 1
    catMap.set(cat.id, existing)
  }

  const totalExpense = sumByType(transactions, 'expense')

  return Array.from(catMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((c) => ({
      category_id: c.id,
      category_name: c.name,
      category_icon: c.icon,
      category_color: c.color,
      total: c.total,
      percentage:
        totalExpense > 0
          ? Math.round((c.total / totalExpense) * 10000) / 100
          : 0,
      count: c.count,
    }))
}

// ── Budget usage ─────────────────────────────────────────────────────

function computeBudgetUsage(
  transactions: Transaction[],
  budgets: Budget[]
): FinancialHealthMetrics['budgetUsage'] {
  return budgets.map((b) => {
    const spent = transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.category_id === b.category_id
      )
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      category_name: b.categories?.name || 'Unknown',
      spent,
      budget: b.amount,
      percentage:
        b.amount > 0
          ? Math.round((spent / b.amount) * 10000) / 100
          : 0,
    }
  })
}

// ── Monthly expense comparison ───────────────────────────────────────

function computeMonthlyExpenseComparison(
  transactions: Transaction[]
): { month: string; total: number }[] {
  const byMonth = groupByMonth(transactions)

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, txs]) => ({
      month,
      total: sumByType(txs, 'expense'),
    }))
}

// ── Local scoring (fallback when no AI) ──────────────────────────────

export function computeLocalScore(metrics: FinancialHealthMetrics): number {
  let score = 50 // base

  // Savings rate contribution (up to ±25)
  if (metrics.savingsRate >= 30) score += 25
  else if (metrics.savingsRate >= 20) score += 20
  else if (metrics.savingsRate >= 10) score += 10
  else if (metrics.savingsRate >= 0) score += 0
  else score -= 15 // negative savings

  // Debt ratio (up to ±15)
  // Note: debtToIncomeRatio is 0 when there's no debt OR when income is 0.
  // Distinguish these cases to avoid false positives at the income=0 boundary.
  if (metrics.totalDebt === 0 && metrics.totalIncome > 0) score += 10
  else if (metrics.totalDebt === 0 && metrics.totalIncome === 0) score += 0 // no debt, no income → neutral
  else if (metrics.totalIncome === 0) score -= 15 // has debt but no income → worst case
  else if (metrics.debtToIncomeRatio <= 10) score += 5
  else if (metrics.debtToIncomeRatio <= 30) score -= 5
  else score -= 15

  // Expense-to-income ratio (up to ±10)
  // H3 fix: when income is 0, the ratio is guarded to 0 which would falsely
  // award +10. Treat zero-income as neutral (no data to assess the ratio).
  if (metrics.totalIncome === 0) score += 0
  else if (metrics.expenseToIncomeRatio <= 50) score += 10
  else if (metrics.expenseToIncomeRatio <= 70) score += 5
  else if (metrics.expenseToIncomeRatio <= 90) score -= 5
  else score -= 10

  // Spending trend (±5)
  if (metrics.spendingTrend === 'decreasing') score += 5
  else if (metrics.spendingTrend === 'increasing') score -= 5

  // Asset strength: positive net worth = bonus, negative = penalty (up to ±10)
  if (metrics.netWorth > 0 && metrics.totalAssets > 0) {
    // Asset-to-debt ratio shows how well assets cover debt
    if (metrics.totalDebt === 0) {
      score += 10 // No debt + positive assets = strongest position
    } else if (metrics.assetToDebtRatio >= 200) {
      score += 8 // Assets cover debt 2x+
    } else if (metrics.assetToDebtRatio >= 100) {
      score += 5 // Assets fully cover debt
    } else {
      score -= 2 // Assets don't fully cover debt
    }
  } else if (metrics.netWorth < 0) {
    score -= 10 // Negative net worth (debt > assets)
  }

  return Math.max(0, Math.min(100, score))
}

export function scoreToGrade(score: number): HealthGrade {
  if (score >= 90) return 'A+'
  if (score >= 80) return 'A'
  if (score >= 70) return 'B+'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C+'
  if (score >= 40) return 'C'
  if (score >= 25) return 'D'
  return 'F'
}

// ── Template helper for i18n placeholders ───────────────────────────

function tmpl(str: string, params: Record<string, string | number>): string {
  return str.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''))
}

// ── Generate mock AI analysis locally ────────────────────────────────

export function generateLocalAnalysis(metrics: FinancialHealthMetrics, t: TranslationKey, curSym = 'đ'): AIAnalysis {
  const score = computeLocalScore(metrics)
  const grade = scoreToGrade(score)
  const la = t.localAnalysis

  const insights: AIAnalysis['insights'] = []
  const recommendations: AIAnalysis['recommendations'] = []
  const risk_flags: AIAnalysis['risk_flags'] = []

  // Savings insight
  if (metrics.savingsRate >= 20) {
    insights.push({
      icon: '💰',
      title: la.savingsGood_title,
      description: tmpl(la.savingsGood_desc, { rate: metrics.savingsRate }),
      severity: 'positive',
    })
  } else if (metrics.savingsRate >= 0) {
    insights.push({
      icon: '📊',
      title: la.savingsLow_title,
      description: tmpl(la.savingsLow_desc, { rate: metrics.savingsRate }),
      severity: 'neutral',
    })
  } else {
    insights.push({
      icon: '⚠️',
      title: la.overspending_title,
      description: tmpl(la.overspending_desc, { rate: Math.abs(metrics.savingsRate) }),
      severity: 'negative',
    })
  }

  // Debt insight
  if (metrics.totalDebt > 0) {
    insights.push({
      icon: '💳',
      title: la.hasDebt_title,
      description: tmpl(la.hasDebt_desc, { debt: `${metrics.totalDebt.toLocaleString()}${curSym}`, ratio: metrics.debtToIncomeRatio }),
      severity: metrics.debtToIncomeRatio > 30 ? 'negative' : 'neutral',
    })
    if (metrics.debtToIncomeRatio > 30) {
      risk_flags.push({
        title: la.debtTooHigh_title,
        description: tmpl(la.debtTooHigh_desc, { ratio: metrics.debtToIncomeRatio }),
        severity: 'danger',
      })
    }
  }

  // Net worth insight
  const fmtAssets = metrics.totalAssets.toLocaleString()
  const fmtNetWorth = metrics.netWorth.toLocaleString()
  if (metrics.totalAssets > 0) {
    if (metrics.netWorth > 0) {
      if (metrics.totalDebt === 0) {
        insights.push({
          icon: '🏦',
          title: la.netWorthPositive_title,
          description: tmpl(la.netWorthPositive_desc, { assets: `${fmtAssets}${curSym}` }),
          severity: 'positive',
        })
      } else if (metrics.assetToDebtRatio >= 200) {
        insights.push({
          icon: '🏦',
          title: la.assetsStrong_title,
          description: tmpl(la.assetsStrong_desc, { assets: `${fmtAssets}${curSym}`, multiple: Math.round(metrics.assetToDebtRatio / 100) }),
          severity: 'positive',
        })
      } else if (metrics.assetToDebtRatio >= 100) {
        insights.push({
          icon: '🏦',
          title: la.assetsCoverDebt_title,
          description: tmpl(la.assetsCoverDebt_desc, { assets: `${fmtAssets}${curSym}`, debt: `${metrics.totalDebt.toLocaleString()}${curSym}` }),
          severity: 'neutral',
        })
      } else {
        insights.push({
          icon: '⚠️',
          title: la.assetsInsufficient_title,
          description: tmpl(la.assetsInsufficient_desc, { assets: `${fmtAssets}${curSym}`, debt: `${metrics.totalDebt.toLocaleString()}${curSym}` }),
          severity: 'negative',
        })
        risk_flags.push({
          title: la.negativeNetWorth_title,
          description: tmpl(la.negativeNetWorth_riskDesc, { debt: `${metrics.totalDebt.toLocaleString()}${curSym}`, assets: `${fmtAssets}${curSym}` }),
          severity: 'danger',
        })
      }
    } else {
      insights.push({
        icon: '⚠️',
        title: la.negativeNetWorth_title,
        description: tmpl(la.negativeNetWorth_insightDesc, { netWorth: `${fmtNetWorth}${curSym}` }),
        severity: 'negative',
      })
      risk_flags.push({
        title: la.negativeNetWorth_title,
        description: tmpl(la.negativeNetWorth_riskDescShort, { debt: `${metrics.totalDebt.toLocaleString()}${curSym}`, assets: `${fmtAssets}${curSym}` }),
        severity: 'danger',
      })
    }
  } else if (metrics.totalDebt > 0) {
    insights.push({
      icon: '🚨',
      title: la.noAssetsHasDebt_title,
      description: tmpl(la.noAssetsHasDebt_desc, { debt: `${metrics.totalDebt.toLocaleString()}${curSym}` }),
      severity: 'negative',
    })
    recommendations.push({
      icon: '🏦',
      title: la.createWallet_title,
      description: la.createWallet_desc,
      priority: 'high',
    })
  }

  // Top category insight
  if (metrics.topExpenseCategories.length > 0) {
    const top = metrics.topExpenseCategories[0]
    insights.push({
      icon: top.category_icon,
      title: tmpl(la.topCategory_title, { name: top.category_name }),
      description: tmpl(la.topCategory_desc, { percentage: top.percentage, amount: `${top.total.toLocaleString()}${curSym}` }),
      severity: top.percentage > 40 ? 'negative' : 'neutral',
    })
  }

  // Spending trend
  if (metrics.spendingTrend === 'increasing') {
    insights.push({
      icon: '📈',
      title: la.spendingIncreasing_title,
      description: la.spendingIncreasing_desc,
      severity: 'negative',
    })
    recommendations.push({
      icon: '📋',
      title: la.createBudget_title,
      description: la.createBudget_desc,
      priority: 'high',
    })
  } else if (metrics.spendingTrend === 'decreasing') {
    insights.push({
      icon: '📉',
      title: la.spendingDecreasing_title,
      description: la.spendingDecreasing_desc,
      severity: 'positive',
    })
  }

  // Budget alerts
  const overBudget = metrics.budgetUsage.filter((b) => b.percentage > 100)
  if (overBudget.length > 0) {
    risk_flags.push({
      title: tmpl(la.overBudget_title, { count: overBudget.length }),
      description: overBudget.map((b) => `${b.category_name}: ${b.percentage}%`).join(', '),
      severity: 'warning',
    })
  }

  // Recommendations
  if (metrics.savingsRate < 20) {
    recommendations.push({
      icon: '🏦',
      title: la.increaseSavings_title,
      description: la.increaseSavings_desc,
      priority: 'high',
    })
  }
  if (metrics.totalDebt > 0) {
    recommendations.push({
      icon: '💳',
      title: la.debtPlan_title,
      description: la.debtPlan_desc,
      priority: metrics.debtToIncomeRatio > 20 ? 'high' : 'medium',
    })
  }
  recommendations.push({
    icon: '📊',
    title: la.weeklyTracking_title,
    description: la.weeklyTracking_desc,
    priority: 'medium',
  })

  // Summary
  const summary =
    score >= 75
      ? tmpl(la.summary_good, { score, grade, savingsRate: metrics.savingsRate })
      : score >= 50
        ? tmpl(la.summary_average, { score, grade, savingsRate: metrics.savingsRate })
        : tmpl(la.summary_poor, { score, grade })

  // Financial Runway
  // Use monthly expense comparison data for a more accurate average when available
  const monthlyExpenses = metrics.monthlyExpenseComparison || []
  const avgMonthlyExpense = monthlyExpenses.length > 0
    ? Math.round(monthlyExpenses.reduce((sum, m) => sum + m.total, 0) / monthlyExpenses.length)
    : metrics.totalExpense
  const runwayMonths = avgMonthlyExpense > 0 && metrics.netWorth > 0
    ? Math.round(metrics.netWorth / avgMonthlyExpense)
    : 0

  const financial_runway = {
    months: runwayMonths,
    description: runwayMonths >= 6
      ? tmpl(la.runway_safe, { netWorth: `${fmtNetWorth}${curSym}`, months: runwayMonths })
      : runwayMonths >= 3
        ? tmpl(la.runway_ok, { netWorth: `${fmtNetWorth}${curSym}`, months: runwayMonths })
        : runwayMonths > 0
          ? tmpl(la.runway_short, { months: runwayMonths })
          : la.runway_none,
  }

  // Asset Allocation
  const asset_allocation = {
    emergency_fund: {
      percentage: metrics.netWorth > 0 ? Math.min(Math.round((avgMonthlyExpense * 6 / metrics.netWorth) * 100), 80) : 100,
      amount: Math.round(avgMonthlyExpense * 6),
      description: la.emergencyFund_desc,
    },
    investment_capital: {
      percentage: metrics.netWorth > 0 ? Math.max(100 - Math.min(Math.round((avgMonthlyExpense * 6 / metrics.netWorth) * 100), 80), 20) : 0,
      amount: metrics.netWorth > 0 ? Math.max(metrics.netWorth - avgMonthlyExpense * 6, 0) : 0,
      description: la.investmentCapital_desc,
    },
    description: metrics.netWorth > avgMonthlyExpense * 6
      ? la.allocation_strong
      : la.allocation_weak,
  }

  // Investment Channels
  const investment_channels = [
    {
      name: la.channel_savings,
      risk_level: 'low' as const,
      suggested_percentage: 40,
      description: la.channel_savings_desc,
    },
    {
      name: la.channel_etf,
      risk_level: 'medium_low' as const,
      suggested_percentage: 30,
      description: la.channel_etf_desc,
    },
    {
      name: la.channel_gold,
      risk_level: 'medium_low' as const,
      suggested_percentage: 20,
      description: la.channel_gold_desc,
    },
    {
      name: la.channel_selfInvest,
      risk_level: 'medium' as const,
      suggested_percentage: 10,
      description: la.channel_selfInvest_desc,
    },
  ]

  // Action Plan
  const action_plan = [
    {
      icon: '🏦',
      title: la.action_emergency_title,
      description: tmpl(la.action_emergency_desc, { target: `${Math.round(avgMonthlyExpense * 6).toLocaleString()}${curSym}` }),
      timeline: la.timeline_1_3_months,
      priority: 'high' as const,
    },
    {
      icon: '📊',
      title: la.weeklyTracking_title,
      description: la.action_weeklyTracking_desc,
      timeline: la.timeline_ongoing,
      priority: 'medium' as const,
    },
    {
      icon: '🎯',
      title: la.action_savingsGoal_title,
      description: la.action_savingsGoal_desc,
      timeline: la.timeline_1_month,
      priority: 'high' as const,
    },
    metrics.totalDebt > 0
      ? {
          icon: '💳',
          title: la.debtPlan_title,
          description: tmpl(la.action_debtPlan_desc, { debt: `${metrics.totalDebt.toLocaleString()}${curSym}` }),
          timeline: la.timeline_3_6_months,
          priority: 'high' as const,
        }
      : {
          icon: '📈',
          title: la.action_startInvesting_title,
          description: la.action_startInvesting_desc,
          timeline: la.timeline_3_6_months,
          priority: 'medium' as const,
        },
  ].filter(Boolean)

  return {
    overall_score: score,
    grade,
    summary,
    insights,
    recommendations,
    risk_flags,
    financial_runway,
    asset_allocation,
    investment_channels,
    action_plan,
  }
}
