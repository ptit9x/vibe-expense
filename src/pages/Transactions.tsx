import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useWallets } from '@/hooks/useWallets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransactionRow } from '@/components/shared'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'
import PageHeader from '@/components/PageHeader'
import type { Transaction } from '@/types'

export default function Transactions() {
  const [month, setMonth] = useState<string | null>(null)
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

  const filterWallet = wallets?.find(w => w.id === walletFilter)

  // Group transactions by month (keys already in DESC order from query)
  const grouped = useMemo(() => {
    if (!filteredTransactions) return []
    const groups: Record<string, Transaction[]> = {}
    for (const txn of filteredTransactions) {
      const m = txn.transaction_date.slice(0, 7)
      ;(groups[m] ??= []).push(txn)
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredTransactions])

  const clearWalletFilter = () => {
    searchParams.delete('wallet_id')
    setSearchParams(searchParams)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader>
        <h1 className="text-xl font-semibold text-white mb-1">{t.transaction.transactionsTitle}</h1>
        <p className="text-white/60 text-sm">{t.transaction.manageDaily}</p>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-4">
          <input
            type="month"
            value={month ?? ''}
            onChange={(e) => setMonth(e.target.value || null)}
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
        {!month && (
          <p className="text-white/60 text-xs mt-2">Hiển thị 12 tháng gần nhất</p>
        )}
      </PageHeader>

      <div className="px-4 -mt-3 space-y-3">
        {/* Monthly Grouped Transactions */}
        {isLoading ? (
          <Card className="border shadow-sm">
            <CardContent className="p-4 text-center text-gray-400 text-sm">
              {t.common.loading}
            </CardContent>
          </Card>
        ) : grouped.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="p-4 text-center text-gray-400 text-sm">
              {t.transaction.noTransactions}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {grouped.map(([monthKey, txns]) => {
              const monthIncome = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
              const monthExpense = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
              const [year, mon] = monthKey.split('-')
              const monthLabel = new Date(parseInt(year), parseInt(mon) - 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

              return (
                <Card key={monthKey} className="border shadow-sm overflow-hidden px-4 pt-3">
                  <CardHeader className="bg-gray-50 border-b border-gray-100 py-3 -mx-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-700 capitalize">
                        {monthLabel}
                      </CardTitle>
                      <div className="flex gap-4 text-xs">
                        <span className="text-green-600">
                          +{currency.symbol}{formatCurrency(monthIncome)}
                        </span>
                        <span className="text-red-500">
                          -{currency.symbol}{formatCurrency(monthExpense)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-0 py-2 divide-y divide-gray-100">
                    {txns.map(t => (
                      <TransactionRow
                        key={t.id}
                        id={t.id}
                        type={t.type as 'income' | 'expense'}
                        amount={t.amount}
                        description={t.description}
                        transactionDate={t.transaction_date}
                        category={t.category}
                        walletName={t.wallet?.name}
                        variant="compact"
                      />
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}