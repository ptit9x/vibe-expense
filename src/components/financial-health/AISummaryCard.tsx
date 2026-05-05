import { Sparkles, AlertTriangle, CheckCircle } from 'lucide-react'
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

export default function AISummaryCard({ analysis }: Props) {
  const { t } = useI18n()
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-white" />
        <h3 className="text-white font-semibold text-sm">{t.financialHealth.aiAnalysis}</h3>
      </div>

      {/* Summary */}
      <div className="p-4">
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {analysis.summary}
        </p>
      </div>

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <div className="px-4 pt-3 pb-1">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t.financialHealth.findings}
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

      {/* Risk Flags */}
      {analysis.risk_flags.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700">
          <div className="px-4 pt-3 pb-1">
            <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t.financialHealth.riskWarnings}
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
              {t.financialHealth.actionSuggestions}
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
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        rec.priority === 'high'
                          ? 'bg-red-100 text-red-600'
                          : rec.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {rec.priority === 'high' ? t.financialHealth.priorityHigh : rec.priority === 'medium' ? t.financialHealth.priorityMedium : t.financialHealth.priorityLow}
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
    </div>
  )
}
