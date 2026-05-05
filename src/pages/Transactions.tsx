import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useWallets } from '@/hooks/useWallets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionRow } from '@/components/shared'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'

export default function Transactions() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [searchParams, setSearchParams] = useSearchParams()
  const walletFilter = searchParams.get('wallet_id')

  const { data: transactions, isLoading } = useTransactions(month, walletFilter || undefined)
  const { data: wallets } = useWallets()
  const { t } = useI18n()
  const { currency, formatCurrency } = useUIStore()

  const filteredTransactions = transactions?.filter(txn =>
    typeFilter === 'all' || txn.type === typeFilter
  )

  const totalIncome = filteredTransactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0
  const totalExpense = filteredTransactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0

  const filterWallet = wallets?.find(w => w.id === walletFilter)

  const clearWalletFilter = () => {
    searchParams.delete('wallet_id')
    setSearchParams(searchParams)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <h1 className="text-xl font-semibold text-white mb-1">{t.transaction.transactionsTitle}</h1>
        <p className="text-white/60 text-sm">{t.transaction.manageDaily}</p>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-4">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-9 px-3 bg-white/20 text-white text-sm rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/30 [color-scheme:dark]"
          />
          <div className="flex gap-1">
            {(['all', 'income', 'expense'] as const).map(val => (
              <button
                key={val}
                onClick={() => setTypeFilter(val)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                  typeFilter === val
                    ? 'bg-white text-blue-500'
                    : 'bg-white/20 text-white hover:bg-white/30'
                )}
              >
                {val === 'all' ? t.transaction.all : val === 'income' ? t.transaction.income : t.transaction.expense}
              </button>
            ))}
          </div>
        </div>

        {/* Wallet filter badge */}
        {walletFilter && filterWallet && (
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              <span>{filterWallet.icon}</span>
              <span>{filterWallet.name}</span>
              <button onClick={clearWalletFilter} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      <div className="px-4 -mt-3 space-y-3">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-green-50 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-green-600">{t.transaction.totalIncome}</CardTitle>
              <span className="text-green-500 text-sm">📈</span>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-lg font-bold text-green-700">
                {currency.symbol}{formatCurrency(totalIncome)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
              <CardTitle className="text-xs font-medium text-red-600">{t.transaction.totalExpense}</CardTitle>
              <span className="text-red-500 text-sm">📉</span>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="text-lg font-bold text-red-700">
                {currency.symbol}{formatCurrency(totalExpense)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction List */}
        <Card className="border shadow-sm">
          <CardContent className="p-0 divide-y divide-gray-100">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400 text-sm">{t.common.loading}</div>
            ) : filteredTransactions?.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">{t.transaction.noTransactions}</div>
            ) : (
              filteredTransactions?.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  id={tx.id}
                  type={tx.type as 'income' | 'expense'}
                  amount={tx.amount}
                  description={tx.description}
                  transactionDate={tx.transaction_date}
                  category={tx.category}
                  walletName={tx.wallet?.name}
                  variant="compact"
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
