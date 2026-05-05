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
  if (metrics.debtToIncomeRatio === 0) score += 10
  else if (metrics.debtToIncomeRatio <= 10) score += 5
  else if (metrics.debtToIncomeRatio <= 30) score -= 5
  else score -= 15

  // Expense-to-income ratio (up to ±10)
  if (metrics.expenseToIncomeRatio <= 50) score += 10
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
  if (score >= 95) return 'A+'
  if (score >= 85) return 'A'
  if (score >= 75) return 'B+'
  if (score >= 65) return 'B'
  if (score >= 55) return 'C+'
  if (score >= 45) return 'C'
  if (score >= 30) return 'D'
  return 'F'
}

// ── Generate mock AI analysis locally ────────────────────────────────

export function generateLocalAnalysis(metrics: FinancialHealthMetrics): AIAnalysis {
  const score = computeLocalScore(metrics)
  const grade = scoreToGrade(score)

  const insights: AIAnalysis['insights'] = []
  const recommendations: AIAnalysis['recommendations'] = []
  const risk_flags: AIAnalysis['risk_flags'] = []

  // Savings insight
  if (metrics.savingsRate >= 20) {
    insights.push({
      icon: '💰',
      title: 'Tỷ lệ tiết kiệm tốt',
      description: `Bạn đang tiết kiệm ${metrics.savingsRate}% thu nhập — vượt mức khuyến nghị 20%!`,
      severity: 'positive',
    })
  } else if (metrics.savingsRate >= 0) {
    insights.push({
      icon: '📊',
      title: 'Tỷ lệ tiết kiệm thấp',
      description: `Tiết kiệm ${metrics.savingsRate}% thu nhập. Nên đạt ít nhất 20%.`,
      severity: 'neutral',
    })
  } else {
    insights.push({
      icon: '⚠️',
      title: 'Chi tiêu vượt thu nhập',
      description: `Bạn đang chi tiêu nhiều hơn thu nhập ${Math.abs(metrics.savingsRate)}%. Cần cắt giảm ngay!`,
      severity: 'negative',
    })
  }

  // Debt insight
  if (metrics.totalDebt > 0) {
    insights.push({
      icon: '💳',
      title: 'Đang có khoản nợ',
      description: `Tổng nợ ${metrics.totalDebt.toLocaleString('vi-VN')}đ (${metrics.debtToIncomeRatio}% thu nhập).`,
      severity: metrics.debtToIncomeRatio > 30 ? 'negative' : 'neutral',
    })
    if (metrics.debtToIncomeRatio > 30) {
      risk_flags.push({
        title: 'Nợ quá cao',
        description: `Tỷ lệ nợ/thu nhập ${metrics.debtToIncomeRatio}% vượt ngưỡng an toàn 30%.`,
        severity: 'danger',
      })
    }
  }

  // Net worth insight
  const fmtAssets = metrics.totalAssets.toLocaleString('vi-VN')
  const fmtNetWorth = metrics.netWorth.toLocaleString('vi-VN')
  if (metrics.totalAssets > 0) {
    if (metrics.netWorth > 0) {
      if (metrics.totalDebt === 0) {
        insights.push({
          icon: '🏦',
          title: 'Tài sản ròng dương',
          description: `Tổng tài sản ${fmtAssets}đ, không có nợ. Tình trạng tài chính rất ổn định!`,
          severity: 'positive',
        })
      } else if (metrics.assetToDebtRatio >= 200) {
        insights.push({
          icon: '🏦',
          title: 'Tài sản đủ mạnh',
          description: `Tổng tài sản ${fmtAssets}đ gấp ${Math.round(metrics.assetToDebtRatio / 100)} lần tổng nợ. Nợ được bảo đảm tốt.`,
          severity: 'positive',
        })
      } else if (metrics.assetToDebtRatio >= 100) {
        insights.push({
          icon: '🏦',
          title: 'Tài sản đủ cover nợ',
          description: `Tổng tài sản ${fmtAssets}đ đủ để trả toàn bộ nợ (${metrics.totalDebt.toLocaleString('vi-VN')}đ).`,
          severity: 'neutral',
        })
      } else {
        insights.push({
          icon: '⚠️',
          title: 'Tài sản chưa đủ cover nợ',
          description: `Tổng tài sản ${fmtAssets}đ thấp hơn tổng nợ ${metrics.totalDebt.toLocaleString('vi-VN')}đ. Tài sản ròng âm.`,
          severity: 'negative',
        })
        risk_flags.push({
          title: 'Tài sản ròng âm',
          description: `Tổng nợ (${metrics.totalDebt.toLocaleString('vi-VN')}đ) vượt tổng tài sản (${fmtAssets}đ). Nợ không được bảo đảm.`,
          severity: 'danger',
        })
      }
    } else {
      insights.push({
        icon: '⚠️',
        title: 'Tài sản ròng âm',
        description: `Tổng nợ vượt tổng tài sản. Tài sản ròng: ${fmtNetWorth}đ.`,
        severity: 'negative',
      })
      risk_flags.push({
        title: 'Tài sản ròng âm',
        description: `Tổng nợ (${metrics.totalDebt.toLocaleString('vi-VN')}đ) vượt tổng tài sản (${fmtAssets}đ).`,
        severity: 'danger',
      })
    }
  } else if (metrics.totalDebt > 0) {
    insights.push({
      icon: '🚨',
      title: 'Không có tài sản, đang có nợ',
      description: `Bạn có nợ ${metrics.totalDebt.toLocaleString('vi-VN')}đ nhưng chưa có tài sản nào. Tạo ví để theo dõi!`,
      severity: 'negative',
    })
    recommendations.push({
      icon: '🏦',
      title: 'Tạo ví và tích lũy tài sản',
      description: 'Tạo ví tiền mặt/ngân hàng để theo dõi tài sản và xây dựng quỹ dự phòng.',
      priority: 'high',
    })
  }

  // Top category insight
  if (metrics.topExpenseCategories.length > 0) {
    const top = metrics.topExpenseCategories[0]
    insights.push({
      icon: top.category_icon,
      title: `Chi nhiều nhất: ${top.category_name}`,
      description: `${top.percentage}% tổng chi tiêu (${top.total.toLocaleString('vi-VN')}đ).`,
      severity: top.percentage > 40 ? 'negative' : 'neutral',
    })
  }

  // Spending trend
  if (metrics.spendingTrend === 'increasing') {
    insights.push({
      icon: '📈',
      title: 'Chi tiêu đang tăng',
      description: 'So với tháng trước, chi tiêu của bạn có xu hướng tăng.',
      severity: 'negative',
    })
    recommendations.push({
      icon: '📋',
      title: 'Lập ngân sách chi tiêu',
      description: 'Tạo budget cho các danh mục chi tiêu chính để kiểm soát tốt hơn.',
      priority: 'high',
    })
  } else if (metrics.spendingTrend === 'decreasing') {
    insights.push({
      icon: '📉',
      title: 'Chi tiêu đang giảm',
      description: 'Tốt! Chi tiêu đang có xu hướng giảm so với trước.',
      severity: 'positive',
    })
  }

  // Budget alerts
  const overBudget = metrics.budgetUsage.filter((b) => b.percentage > 100)
  if (overBudget.length > 0) {
    risk_flags.push({
      title: `${overBudget.length} danh mục vượt ngân sách`,
      description: overBudget.map((b) => `${b.category_name}: ${b.percentage}%`).join(', '),
      severity: 'warning',
    })
  }

  // Recommendations
  if (metrics.savingsRate < 20) {
    recommendations.push({
      icon: '🏦',
      title: 'Tăng tỷ lệ tiết kiệm',
      description: 'Đặt mục tiêu tiết kiệm ít nhất 20% thu nhập hàng tháng.',
      priority: 'high',
    })
  }
  if (metrics.totalDebt > 0) {
    recommendations.push({
      icon: '💳',
      title: 'Lên kế hoạch trả nợ',
      description: 'Ưu tiên trả các khoản nợ lãi suất cao trước.',
      priority: metrics.debtToIncomeRatio > 20 ? 'high' : 'medium',
    })
  }
  recommendations.push({
    icon: '📊',
    title: 'Theo dõi chi tiêu hàng tuần',
    description: 'Kiểm tra báo cáo chi tiêu hàng tuần để phát hiện sớm các khoản bất thường.',
    priority: 'medium',
  })

  // Summary
  const summary =
    score >= 75
      ? `Sức khỏe tài chính của bạn ở mức tốt (điểm ${score}/100, hạng ${grade}). Tiết kiệm ${metrics.savingsRate}% thu nhập. Tiếp tục duy trì!`
      : score >= 50
        ? `Sức khỏe tài chính ở mức trung bình (điểm ${score}/100, hạng ${grade}). Tiết kiệm ${metrics.savingsRate}% thu nhập. Cần cải thiện một số chỉ số.`
        : `Sức khỏe tài chính cần cải thiện (điểm ${score}/100, hạng ${grade}). Chi tiêu vượt thu nhập hoặc nợ quá cao. Hãy xem các đề xuất bên dưới.`

  return {
    overall_score: score,
    grade,
    summary,
    insights,
    recommendations,
    risk_flags,
  }
}
