import { YearlyReport } from '@/components/reports'
import { useI18n } from '@/lib/i18n'
import { PageTransition } from '@/components/shared'

export default function IncomeReport() {
  const { t } = useI18n()

  return (
    <PageTransition>
    <YearlyReport
      type="income"
      title={t.reports.incomeReportTitle}
      subtitle={t.reports.incomeReportSubtitle}
      gradientClass="bg-gradient-to-b from-green-500 to-green-600"
      chartColor="#10B981"
      totalLabelKey="totalIncomeYear"
      categoryLabelKey="incomeByCategory"
      monthLabelKey="incomeByMonth"
    />
    </PageTransition>
  )
}
