import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TransactionRow } from '@/components/shared'
import { useI18n } from '@/lib/i18n'

export interface TransactionItem {
  id: string
  type: 'income' | 'expense' | 'transfer' | 'lend' | 'borrow'
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
  to_wallet?: {
    name?: string | null
  } | null
}

interface RecentTransactionsProps {
  transactions: TransactionItem[]
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { t } = useI18n()

  return (
    <Card className="rounded-2xl border-0 shadow-md bg-white overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-xs">📜</span>
          {t.transaction.recentTransactions}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="text-xs text-indigo-500 hover:text-indigo-600 h-9 font-medium">
          <Link to="/transactions">{t.transaction.seeAll} →</Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        {transactions.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            {t.transaction.noTransactions}
          </div>
        ) : (
          <motion.div
            className="space-y-0"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {transactions.map((tx) => (
              <motion.div key={tx.id} variants={itemVariants}>
                <TransactionRow
                  id={tx.id}
                  type={tx.type}
                  amount={tx.amount}
                  description={tx.description}
                  transactionDate={tx.transaction_date}
                  category={tx.category}
                  walletName={tx.wallet?.name}
                  toWalletName={tx.to_wallet?.name}
                  variant="compact"
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
