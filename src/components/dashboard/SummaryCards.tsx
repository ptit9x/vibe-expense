import { Card, CardContent } from '@/components/ui/card'
import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SummaryCardsProps {
  totalBalance: number
  income: number
  expense: number
  showBalance: boolean
}

function formatMoney(amount: number, show: boolean): string {
  if (!show) return '••••••'
  return new Intl.NumberFormat('vi-VN').format(amount)
}

export function SummaryCards({ totalBalance, income, expense, showBalance }: SummaryCardsProps) {
  const remaining = income - expense

  return (
    <div className="grid grid-cols-4 gap-2">
      {/* Total Balance */}
      <Card className="bg-blue-50 border-0 shadow-sm">
        <CardContent className="p-2 text-center">
          <div className="flex justify-center mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <p className="text-[10px] text-blue-600 font-medium mb-0.5">Tổng dư</p>
          <p className="text-sm font-bold text-blue-700 leading-tight">
            {formatMoney(totalBalance, showBalance)}
          </p>
          <p className="text-[9px] text-blue-400">đ</p>
        </CardContent>
      </Card>

      {/* Income */}
      <Card className="bg-green-50 border-0 shadow-sm">
        <CardContent className="p-2 text-center">
          <div className="flex justify-center mb-1">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <p className="text-[10px] text-green-600 font-medium mb-0.5">Thu nhập</p>
          <p className="text-sm font-bold text-green-700 leading-tight">
            {formatMoney(income, showBalance)}
          </p>
          <p className="text-[9px] text-green-400">đ</p>
        </CardContent>
      </Card>

      {/* Expense */}
      <Card className="bg-red-50 border-0 shadow-sm">
        <CardContent className="p-2 text-center">
          <div className="flex justify-center mb-1">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            </div>
          </div>
          <p className="text-[10px] text-red-600 font-medium mb-0.5">Chi tiêu</p>
          <p className="text-sm font-bold text-red-700 leading-tight">
            {formatMoney(expense, showBalance)}
          </p>
          <p className="text-[9px] text-red-400">đ</p>
        </CardContent>
      </Card>

      {/* Remaining */}
      <Card className={cn(
        "border-0 shadow-sm",
        remaining >= 0 ? "bg-teal-50" : "bg-orange-50"
      )}>
        <CardContent className="p-2 text-center">
          <div className="flex justify-center mb-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              remaining >= 0 ? "bg-teal-100" : "bg-orange-100"
            )}>
              <svg className={cn("h-4 w-4", remaining >= 0 ? "text-teal-600" : "text-orange-600")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points={remaining >= 0 ? "23 6 13.5 15.5 8.5 10.5 1 18" : "23 18 13.5 15.5 8.5 10.5 1 6"} />
              </svg>
            </div>
          </div>
          <p className={cn("text-[10px] font-medium mb-0.5", remaining >= 0 ? "text-teal-600" : "text-orange-600")}>Còn lại</p>
          <p className={cn("text-sm font-bold leading-tight", remaining >= 0 ? "text-teal-700" : "text-orange-700")}>
            {formatMoney(Math.abs(remaining), showBalance)}
          </p>
          <p className={cn("text-[9px]", remaining >= 0 ? "text-teal-400" : "text-orange-400")}>đ</p>
        </CardContent>
      </Card>
    </div>
  )
}