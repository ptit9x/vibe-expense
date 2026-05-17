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
import { PullToRefreshWrapper } from '@/components/shared'
import type { Transaction } from '@/types'

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [month, setMonth] = useState<string | null>(() => searchParams.get('month'))
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>(() => {
    const p = searchParams.get('type')
    return (p === 'income' || p === 'expense') ? p : 'all'
  })
  const walletFilter = searchParams.get('wallet_id')

  const { data: transactions, isLoading, refetch: refetchTransactions } = useTransactions(month, walletFilter || undefined)
  const { data: wallets, refetch: refetchWallets } = useWallets()
  const { t, language } = useI18n()
  const { currency, formatCurrency } = useUIStore()

  const localeMap: Record<string, string> = { vi: 'vi-VN', en: 'en-US' }

  const filterWallet = wallets?.find(w => w.id === walletFilter)

  // Group transactions by month (keys already in DESC order from query)
  const grouped = useMemo(() => {
    if (!transactions) return []
    const filtered = typeFilter === 'all' ? transactions : transactions.filter(txn => txn.type === typeFilter)
    const groups: Record<string, Transaction[]> = {}
    for (const txn of filtered) {
      const m = txn.transaction_date.slice(0, 7)
      ;(groups[m] ??= []).push(txn)
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [transactions, typeFilter])

  const clearWalletFilter = () => {
    searchParams.delete('wallet_id')
    setSearchParams(searchParams)
  }

  return (
    <PullToRefreshWrapper
      className="min-h-screen bg-gray-50 pb-20"
      onRefresh={async () => { await Promise.all([refetchTransactions(), refetchWallets()]) }}
    >
      <PageHeader>
        <h1 className="text-xl font-semibold text-white mb-1">{t.transaction.transactionsTitle}</h1>
        <p className="text-white/60 text-sm">{t.transaction.manageDaily}</p>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-4">
          <input
            type="month"
            value={month ?? ''}
            onChange={(e) => setMonth(e.target.value || null)}
            aria-label={t.transaction.selectMonth || 'Select month'}
            className="h-9 px-3 bg-white/20 text-white text-sm rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/30 [color-scheme:dark]"
          />
          <div className="flex gap-1">
            {(['income', 'expense'] as const).map(val => (
              <button
                key={val}
                onClick={() => setTypeFilter(typeFilter === val ? 'all' : val)}
                className={cn(
                  'px-4 py-2.5 rounded-full text-sm font-medium transition-colors',
                  typeFilter === val
                    ? 'bg-white text-blue-500'
                    : 'bg-white/20 text-white hover:bg-white/30'
                )}
              >
                {val === 'income' ? t.transaction.income : t.transaction.expense}
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
              <button onClick={clearWalletFilter} className="ml-1 hover:bg-white/20 rounded-full p-2">
                <X className="h-3 w-3" />
              </button>
            </span>
          </div>
        )}
        {!month && (
          <p className="text-white/60 text-sm mt-2">{t.transaction.showingLast12Months}</p>
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
              const monthIncome = txns.filter(t => t.type === 'income' || t.type === 'borrow').reduce((sum, t) => sum + t.amount, 0)
              const monthExpense = txns.filter(t => t.type === 'expense' || t.type === 'lend').reduce((sum, t) => sum + t.amount, 0)
              const [year, mon] = monthKey.split('-')
              const monthLabel = new Date(parseInt(year), parseInt(mon) - 1).toLocaleDateString(localeMap[language] || 'vi-VN', { month: 'long', year: 'numeric' })

              return (
                <Card key={monthKey} className="border shadow-sm overflow-hidden px-4 pt-3">
                  <CardHeader className="bg-gray-50 border-b border-gray-100 py-3 -mx-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-700 capitalize">
                        {monthLabel}
                      </CardTitle>
                      <div className="flex gap-4 text-sm">
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
                        type={t.type}
                        amount={t.amount}
                        description={t.description}
                        transactionDate={t.transaction_date}
                        category={t.category}
                        walletName={t.wallet?.name}
                        toWalletName={t.to_wallet?.name}
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
    </PullToRefreshWrapper>
  )
}