import { useSearchParams } from 'react-router-dom'
import { RefreshCw, Sparkles, FileText } from 'lucide-react'
import { PageTransition, PullToRefreshWrapper } from '@/components/shared'
import {
  HealthScoreRing,
  MetricCards,
  AISummaryCard,
  ReportHistory,
} from '@/components/financial-health'
import {
  useFinancialReports,
  useGenerateReport,
} from '@/hooks/useFinancialReports'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export default function FinancialHealth() {
  const [searchParams] = useSearchParams()
  const reportIdParam = searchParams.get('report')
  const { t, language } = useI18n()

  const { data: allReports = [], isLoading: loadingReports, refetch } = useFinancialReports()
  const generateReport = useGenerateReport()

  // Derive latest from the list — no separate query needed
  const latestReport = allReports[0] || null

  // If report ID in URL, find it in the list
  const activeReport = reportIdParam
    ? allReports.find((r) => r.id === reportIdParam) || latestReport
    : latestReport

  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const periodStart = `${currentMonth}-01`
  const periodEnd = now.toISOString().slice(0, 10)

  const handleGenerate = () => {
    generateReport.mutate({
      periodType: 'monthly',
      periodStart,
      periodEnd,
      locale: language,
    })
  }

  return (
    <PageTransition>
      <PullToRefreshWrapper
        className="min-h-screen bg-gray-50 pb-20"
        onRefresh={async () => {
          await refetch()
        }}
      >
        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4 pt-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-white">
                {t.financialHealth.title}
              </h1>
              <p className="text-xs text-white/70 mt-0.5">
                {t.financialHealth.subtitle}
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generateReport.isPending}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                generateReport.isPending
                  ? 'bg-white/20 text-white/60 cursor-wait'
                  : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
              )}
            >
              {generateReport.isPending ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {generateReport.isPending ? t.financialHealth.analyzing : t.financialHealth.analyzeNow}
            </button>
          </div>

          {/* Score Ring inside header */}
          {activeReport && (
            <div className="flex justify-center">
              <HealthScoreRing
                score={activeReport.overall_score}
                grade={activeReport.grade}
                size={150}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 -mt-4 space-y-4">
          {loadingReports && !activeReport ? (
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center">
              <RefreshCw className="h-8 w-8 text-gray-300 animate-spin mb-3" />
              <p className="text-sm text-gray-400">{t.financialHealth.loadingReport}</p>
            </div>
          ) : !activeReport ? (
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">
                {t.financialHealth.noReport}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                {t.financialHealth.noReportDesc}
              </p>
              <button
                onClick={handleGenerate}
                disabled={generateReport.isPending}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/25"
              >
                <Sparkles className="h-4 w-4" />
                {t.financialHealth.createFirstReport}
              </button>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <MetricCards metrics={activeReport.health_data} />

              {/* AI Analysis */}
              <AISummaryCard analysis={activeReport.ai_analysis} />
            </>
          )}

          {/* Report History */}
          {!loadingReports && allReports.length > 0 && (
            <ReportHistory reports={allReports} currentId={activeReport?.id} />
          )}

          {/* Bottom spacer */}
          <div className="h-4" />
        </div>
      </PullToRefreshWrapper>
    </PageTransition>
  )
}
