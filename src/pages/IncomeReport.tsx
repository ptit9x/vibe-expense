import { YearlyReport } from '@/components/reports'

import { PageTransition } from '@/components/shared'

export default function IncomeReport() {
  return (
    <PageTransition>
    <YearlyReport
      type="income"
      title="Báo cáo thu nhập"
      subtitle="Theo dõi thu nhập theo năm"
      gradientClass="bg-gradient-to-b from-green-500 to-green-600"
      chartColor="#10B981"
      totalLabelKey="totalIncomeYear"
      categoryLabelKey="incomeByCategory"
      monthLabelKey="incomeByMonth"
    />
    </PageTransition>
  )
}
