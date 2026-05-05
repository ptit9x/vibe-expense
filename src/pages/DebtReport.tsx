import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ArrowUpCircle, ArrowDownCircle, HandCoins, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'
import { useYearTransactions } from '@/hooks/useTransactions'
import { YearPicker, MonthlyBarChart } from '@/components/reports'
import { PullToRefreshWrapper } from '@/components/shared'

import { PageTransition } from '@/components/shared'

export default function DebtReport() {
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const { t, language } = useI18n()
  const { currency, formatCurrency, showBalance } = useUIStore()

  // Fetch all transactions for the year (no type filter) then filter client-side
  const { data: transactions, isLoading, error, refetch: refetchTx } = useYearTransactions(selectedYear)

  const lendTxns = transactions?.filter(tx => tx.type === 'lend') || []
  const borrowTxns = transactions?.filter(tx => tx.type === 'borrow') || []

  const totalLent = lendTxns.reduce((sum, tx) => sum + Number(tx.amount), 0)
  const totalBorrowed = borrowTxns.reduce((sum, tx) => sum + Number(tx.amount), 0)
  const netDebt = totalBorrowed - totalLent

  // Monthly breakdown for chart
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0')
    const monthLent = lendTxns
      .filter(tx => tx.transaction_date?.substring(5, 7) === month)
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
    const monthBorrowed = borrowTxns
      .filter(tx => tx.transaction_date?.substring(5, 7) === month)
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
    const monthLabel = new Date(2000, i).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short' })
    return { month: monthLabel, value: monthLent + monthBorrowed }
  })

  // Group by contact_person
  const contactsMap = new Map<string, { name: string; lent: number; borrowed: number }>()
  const allDebtTxns = [...lendTxns, ...borrowTxns]
  allDebtTxns.forEach(tx => {
    const name = tx.contact_person || t.debtTracker.unknown
    const existing = contactsMap.get(name) || { name, lent: 0, borrowed: 0 }
    if (tx.type === 'lend') existing.lent += Number(tx.amount)
    else existing.borrowed += Number(tx.amount)
    contactsMap.set(name, existing)
  })
  const contacts = Array.from(contactsMap.values()).sort((a, b) => (b.lent + b.borrowed) - (a.lent + a.borrowed))

  return (
    <PageTransition>
    <PullToRefreshWrapper className="min-h-screen bg-gray-50 pb-20" onRefresh={async () => { await refetchTx() }}>
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-500 to-indigo-600 px-5 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/reports" className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <ChevronLeft className="h-5 w-5 text-white" />
          </Link>
          <h1 className="text-xl font-semibold text-white">{t.debtTracker.reportTitle}</h1>
        </div>
        <p className="text-white/60 text-sm">{t.debtTracker.reportSubtitle}</p>
        <YearPicker value={selectedYear} onChange={setSelectedYear} />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">{t.common.loading}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <p className="text-sm text-red-500 mb-3">{t.common.error}</p>
          <button
            onClick={() => { void refetchTx() }}
            className="text-sm text-indigo-500 font-medium hover:text-indigo-600"
          >
            {t.common.retry || 'Retry'}
          </button>
        </div>
      ) : (
      <>

      {/* Summary Stats */}
      <div className="bg-white px-5 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpCircle className="h-4 w-4 text-green-500" />
              <p className="text-sm text-gray-400">{t.debtTracker.totalLent}</p>
            </div>
            <p className="text-xl font-bold text-green-600">
              {currency.symbol}{formatCurrency(totalLent)}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-gray-400">{t.debtTracker.totalBorrowed}</p>
            </div>
            <p className="text-xl font-bold text-red-600">
              {currency.symbol}{formatCurrency(totalBorrowed)}
            </p>
          </div>
        </div>

        {/* Net position */}
        <div className={`mt-4 rounded-xl p-3 ${netDebt > 0 ? 'bg-orange-50' : netDebt < 0 ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-1.5">
            <HandCoins className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">{t.debtTracker.netPosition}</span>
          </div>
          <p className={`text-lg font-bold mt-1 ${netDebt > 0 ? 'text-orange-600' : netDebt < 0 ? 'text-blue-600' : 'text-gray-600'}`}>
            {showBalance ? (
              netDebt > 0
                ? `${t.debtTracker.youOwe} ${currency.symbol}${formatCurrency(netDebt)}`
                : netDebt < 0
                ? `${t.debtTracker.owedToYou} ${currency.symbol}${formatCurrency(Math.abs(netDebt))}`
                : t.common.noData
            ) : '••••••'}
          </p>
        </div>
      </div>

      {/* Monthly chart */}
      <div className="bg-white mt-2 px-5 py-4">
        <p className="text-sm font-medium text-gray-900 mb-3">{t.debtTracker.monthlyDebt}</p>
        <MonthlyBarChart data={monthlyData} color="#6366F1" />
      </div>

      {/* By contact */}
      {contacts.length > 0 && (
        <div className="bg-white mt-2 px-5 py-4">
          <p className="text-sm font-medium text-gray-900 mb-3">{t.debtTracker.byContact}</p>
          <div className="space-y-3">
            {contacts.map((contact) => {
              const balance = contact.borrowed - contact.lent
              return (
                <div key={contact.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{contact.name}</p>
                    <p className="text-xs text-gray-400">
                      {showBalance ? (
                        <>
                          <span className="text-green-500">+{formatCurrency(contact.lent)}</span>
                          {' / '}
                          <span className="text-red-500">-{formatCurrency(contact.borrowed)}</span>
                        </>
                      ) : '•••• / ••••'}
                    </p>
                  </div>
                  <p className={`text-sm font-bold ${balance > 0 ? 'text-orange-600' : balance < 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                    {showBalance ? (
                      balance > 0 ? `${t.debtTracker.youOweShort} ${currency.symbol}${formatCurrency(balance)}`
                        : balance < 0 ? `${t.debtTracker.owedToYouShort} ${currency.symbol}${formatCurrency(Math.abs(balance))}`
                        : '—'
                    ) : '••••••'}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent lend transactions */}
      {lendTxns.length > 0 && (
        <div className="bg-white mt-2 px-5 py-4">
          <p className="text-sm font-medium text-gray-900 mb-3">{t.debtTracker.lendList}</p>
          <div className="space-y-2">
            {lendTxns.slice(0, 10).map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{tx.description || tx.category?.name || '—'}</p>
                  <p className="text-xs text-gray-400">
                    {tx.contact_person && <span className="text-indigo-500">{tx.contact_person} · </span>}
                    {tx.transaction_date?.slice(0, 10)}
                  </p>
                </div>
                <p className="text-sm font-bold text-green-600">{showBalance ? `+${currency.symbol}${formatCurrency(Number(tx.amount))}` : '••••••'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent borrow transactions */}
      {borrowTxns.length > 0 && (
        <div className="bg-white mt-2 px-5 py-4">
          <p className="text-sm font-medium text-gray-900 mb-3">{t.debtTracker.borrowList}</p>
          <div className="space-y-2">
            {borrowTxns.slice(0, 10).map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{tx.description || tx.category?.name || '—'}</p>
                  <p className="text-xs text-gray-400">
                    {tx.contact_person && <span className="text-indigo-500">{tx.contact_person} · </span>}
                    {tx.transaction_date?.slice(0, 10)}
                  </p>
                </div>
                <p className="text-sm font-bold text-red-600">{showBalance ? `-${currency.symbol}${formatCurrency(Number(tx.amount))}` : '••••••'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      )}
    </PullToRefreshWrapper>
    </PageTransition>
  )
}
