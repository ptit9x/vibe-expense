import { Sparkles, AlertTriangle, CheckCircle, TrendingUp, Target, Rocket, PieChart } from 'lucide-react'
import type { AIAnalysis } from '@/types'
import { useI18n } from '@/lib/i18n'

interface Props {
  analysis: AIAnalysis
}

const severityStyles = {
  positive: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  neutral: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  negative: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
}

const riskLevelStyles = {
  low: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  medium_low: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  medium: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
}

const priorityStyles = {
  high: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400',
}

export default function AISummaryCard({ analysis }: Props) {
  const { t } = useI18n()
  const fht = t.financialHealth

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-white" />
        <h3 className="text-white font-semibold text-sm">{fht.aiAnalysis}</h3>
      </div>

      {/* Summary */}
      <div className="p-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {analysis.summary}
        </p>
      </div>

      {/* Financial Runway */}
      {analysis.financial_runway && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <div className="px-4 pt-3 pb-1">
            <h4 className="text-xs font-semibold text-purple-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              {fht.financialRunway}
            </h4>
          </div>
          <div className="px-4 pb-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/10">
              <div className="text-center">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {analysis.financial_runway.months}
                </span>
                <p className="text-[10px] text-purple-500 font-medium">{fht.months}</p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
                {analysis.financial_runway.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <div className="px-4 pt-3 pb-1">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {fht.findings}
            </h4>
          </div>
          <div className="px-4 pb-3 space-y-2">
            {analysis.insights.map((insight, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${severityStyles[insight.severity]}`}
              >
                <span className="text-lg shrink-0">{insight.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {insight.title}
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asset Allocation */}
      {analysis.asset_allocation && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <div className="px-4 pt-3 pb-1">
            <h4 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="h-3.5 w-3.5" />
              {fht.assetAllocation}
            </h4>
          </div>
          <div className="px-4 pb-3 space-y-2">
            {/* Visual bar */}
            <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
              <div
                className="bg-emerald-400 dark:bg-emerald-500 transition-all"
                style={{ width: `${analysis.asset_allocation.emergency_fund.percentage}%` }}
              />
              <div
                className="bg-indigo-400 dark:bg-indigo-500 transition-all"
                style={{ width: `${analysis.asset_allocation.investment_capital.percentage}%` }}
              />
            </div>
            <div className="flex gap-4 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 dark:bg-emerald-500" />
                {fht.emergencyFund}: {analysis.asset_allocation.emergency_fund.percentage}%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 dark:bg-indigo-500" />
                {fht.investCapital}: {analysis.asset_allocation.investment_capital.percentage}%
              </span>
            </div>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
              {analysis.asset_allocation.description}
            </p>
          </div>
        </div>
      )}

      {/* Investment Channels */}
      {analysis.investment_channels && analysis.investment_channels.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <div className="px-4 pt-3 pb-1">
            <h4 className="text-xs font-semibold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" />
              {fht.investmentChannels}
            </h4>
          </div>
          <div className="px-4 pb-3 space-y-2">
            {analysis.investment_channels.map((ch, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{ch.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${riskLevelStyles[ch.risk_level]}`}>
                    {ch.risk_level === 'low' ? fht.riskLow : ch.risk_level === 'medium_low' ? fht.riskMediumLow : fht.riskMedium}
                  </span>
                  <span className="text-[10px] text-gray-500 ml-auto">{ch.suggested_percentage}%</span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  {ch.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Flags */}
      {analysis.risk_flags.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <div className="px-4 pt-3 pb-1">
            <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              {fht.riskWarnings}
            </h4>
          </div>
          <div className="px-4 pb-3 space-y-2">
            {analysis.risk_flags.map((flag, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${
                  flag.severity === 'danger'
                    ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
                    : 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20'
                }`}
              >
                <AlertTriangle
                  className={`h-4 w-4 shrink-0 mt-0.5 ${flag.severity === 'danger' ? 'text-red-500' : 'text-orange-500'}`}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {flag.title}
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                    {flag.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <div className="px-4 pt-3 pb-1">
            <h4 className="text-xs font-semibold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              {fht.actionSuggestions}
            </h4>
          </div>
          <div className="px-4 pb-3 space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10"
              >
                <span className="text-lg shrink-0">{rec.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {rec.title}
                    </p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityStyles[rec.priority]}`}>
                      {rec.priority === 'high' ? fht.priorityHigh : rec.priority === 'medium' ? fht.priorityMedium : fht.priorityLow}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                    {rec.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Plan */}
      {analysis.action_plan && analysis.action_plan.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <div className="px-4 pt-3 pb-1">
            <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
              <Rocket className="h-3.5 w-3.5" />
              {fht.actionPlan}
            </h4>
          </div>
          <div className="px-4 pb-3 space-y-2">
            {analysis.action_plan.map((action, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10"
              >
                <span className="text-lg shrink-0">{action.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                      {action.title}
                    </p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-medium">
                      {action.timeline}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityStyles[action.priority]}`}>
                      {action.priority === 'high' ? fht.priorityHigh : action.priority === 'medium' ? fht.priorityMedium : fht.priorityLow}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
