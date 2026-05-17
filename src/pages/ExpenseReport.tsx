import { YearlyReport } from '@/components/reports'

import { PageTransition } from '@/components/shared'

export default function ExpenseReport() {
  return (
    <PageTransition>
    <YearlyReport
      type="expense"
      title="Báo cáo chi tiêu"
      subtitle="Theo dõi chi tiêu theo năm"
      gradientClass="bg-gradient-to-b from-blue-500 to-blue-600"
      chartColor="#3B82F6"
      totalLabelKey="totalExpenseYear"
      categoryLabelKey="expenseByCategory"
      monthLabelKey="expenseByMonth"
    />
    </PageTransition>
  )
}
