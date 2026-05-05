import { YearlyReport } from '@/components/reports'
import { useI18n } from '@/lib/i18n'
import { PageTransition } from '@/components/shared'

export default function ExpenseReport() {
  const { t } = useI18n()

  return (
    <PageTransition>
    <YearlyReport
      type="expense"
      title={t.reports.expenseReportTitle}
      subtitle={t.reports.expenseReportSubtitle}
      gradientClass="bg-gradient-to-b from-blue-500 to-blue-600"
      chartColor="#3B82F6"
      totalLabelKey="totalExpenseYear"
      categoryLabelKey="expenseByCategory"
      monthLabelKey="expenseByMonth"
    />
    </PageTransition>
  )
}
