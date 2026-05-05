import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'

export interface TransactionItem {
  id: string
  type: 'income' | 'expense'
  amount: number
  description?: string
  transaction_date: string
  category?: {
    name: string
    icon: string
    color: string
  }
}

interface RecentTransactionsProps {
  transactions: TransactionItem[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { t } = useI18n()
  const { currency, formatCurrency } = useUIStore()
  const today = new Date()

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-3">
        <CardTitle className="text-sm font-medium text-gray-700">
          📜 {t.transaction.recentTransactions}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="text-xs text-blue-500 h-7">
          <Link to="/transactions">{t.transaction.seeAll}</Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-3">
        {transactions.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            {t.transaction.noTransactions}
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => {
              const txDate = new Date(tx.transaction_date)
              const isToday = txDate.toDateString() === today.toDateString()
              const dateLabel = isToday
                ? t.transaction.today
                : txDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })

              return (
                <Link
                  key={tx.id}
                  to={`/edit-transaction/${tx.id}`}
                  className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: (tx.category?.color || '#6B7280') + '15' }}
                    >
                      {tx.category?.icon || '💰'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {tx.description || tx.category?.name}
                      </p>
                      <p className="text-xs text-gray-400">{dateLabel}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold shrink-0 ml-2",
                      tx.type === 'income' ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {currency.symbol}{formatCurrency(tx.amount)}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}