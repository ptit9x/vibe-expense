import { Calendar, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import type { FinancialReport } from '@/types'

interface Props {
  reports: FinancialReport[]
  currentId?: string
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-500 bg-emerald-50'
  if (grade.startsWith('B')) return 'text-green-500 bg-green-50'
  if (grade.startsWith('C')) return 'text-yellow-500 bg-yellow-50'
  if (grade === 'D') return 'text-orange-500 bg-orange-50'
  return 'text-red-500 bg-red-50'
}

export default function ReportHistory({ reports, currentId }: Props) {
  const navigate = useNavigate()
  const { t } = useI18n()

  if (reports.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t.financialHealth.history.title}
        </h3>
      </div>

      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
        {reports.map((report) => {
          const isActive = report.id === currentId
          return (
            <button
              key={report.id}
              onClick={() =>
                navigate(`/financial-health?report=${report.id}`)
              }
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-500/10'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              {/* Grade badge */}
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm ${getGradeColor(report.grade)}`}
              >
                {report.grade}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {report.period_type === 'monthly' ? t.financialHealth.history.monthlyReport : t.financialHealth.history.weeklyReport}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {formatDate(report.period_start)} — {formatDate(report.period_end)}
                </p>
              </div>

              {/* Score */}
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {report.overall_score}
                  <span className="text-xs text-gray-400 font-normal">
                    /100
                  </span>
                </p>
              </div>

              <ChevronRight className="h-4 w-4 text-gray-300" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
