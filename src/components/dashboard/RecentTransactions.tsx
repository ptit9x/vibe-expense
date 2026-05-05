import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TransactionRow } from '@/components/shared'
import { useI18n } from '@/lib/i18n'

export interface TransactionItem {
  id: string
  type: 'income' | 'expense'
  amount: number
  description?: string | null
  transaction_date: string
  category?: {
    name?: string | null
    icon?: string | null
    color?: string | null
  } | null
  wallet?: {
    name?: string | null
  } | null
}

interface RecentTransactionsProps {
  transactions: TransactionItem[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { t } = useI18n()

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
          <div className="space-y-0">
            {transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                id={tx.id}
                type={tx.type}
                amount={tx.amount}
                description={tx.description}
                transactionDate={tx.transaction_date}
                category={tx.category}
                walletName={tx.wallet?.name}
                variant="compact"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
