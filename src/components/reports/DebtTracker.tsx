import { HandCoins, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useUIStore } from '@/stores/uiStore'
import type { Transaction } from '@/types'

interface DebtTrackerProps {
  transactions: Transaction[]
}

export function DebtTracker({ transactions }: DebtTrackerProps) {
  const { t } = useI18n()
  const { currency, formatCurrency } = useUIStore()

  const lendTransactions = transactions.filter(tx => tx.type === 'lend')
  const borrowTransactions = transactions.filter(tx => tx.type === 'borrow')

  const totalLent = lendTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0)
  const totalBorrowed = borrowTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0)
  const netDebt = totalBorrowed - totalLent // dương = đang nợ người khác, âm = người khác nợ mình

  return (
    <div className="bg-white mt-2 px-5 py-4">
      <div className="flex items-center gap-2 mb-4">
        <HandCoins className="h-5 w-5 text-indigo-500" />
        <p className="text-sm font-medium text-gray-900">{t.debtTracker.title}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Total Lent - tiền cho vay (người khác nợ mình) */}
        <div className="bg-green-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-700">{t.debtTracker.totalLent}</span>
          </div>
          <p className="text-lg font-bold text-green-600">
            {currency.symbol}{formatCurrency(totalLent)}
          </p>
        </div>

        {/* Total Borrowed - tiền đi vay (mình nợ người khác) */}
        <div className="bg-red-50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-700">{t.debtTracker.totalBorrowed}</span>
          </div>
          <p className="text-lg font-bold text-red-600">
            {currency.symbol}{formatCurrency(totalBorrowed)}
          </p>
        </div>
      </div>

      {/* Net position */}
      <div className={`rounded-xl p-3 mb-4 ${netDebt > 0 ? 'bg-orange-50' : netDebt < 0 ? 'bg-blue-50' : 'bg-gray-50'}`}>
        <p className="text-xs text-gray-500 mb-1">{t.debtTracker.netPosition}</p>
        <p className={`text-lg font-bold ${netDebt > 0 ? 'text-orange-600' : netDebt < 0 ? 'text-blue-600' : 'text-gray-600'}`}>
          {netDebt > 0
            ? `${t.debtTracker.youOwe} ${currency.symbol}${formatCurrency(netDebt)}`
            : netDebt < 0
            ? `${t.debtTracker.owedToYou} ${currency.symbol}${formatCurrency(Math.abs(netDebt))}`
            : t.common.noData
          }
        </p>
      </div>

      {/* Lend list */}
      {lendTransactions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">{t.debtTracker.lendList}</p>
          <div className="space-y-2">
            {lendTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{tx.description || tx.category?.name || '—'}</p>
                  <p className="text-xs text-gray-400">
                    {tx.contact_person && <span className="text-indigo-500">{tx.contact_person} · </span>}
                    {tx.transaction_date?.slice(0, 10)}
                  </p>
                </div>
                <p className="text-sm font-bold text-green-600">+{currency.symbol}{formatCurrency(Number(tx.amount))}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Borrow list */}
      {borrowTransactions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase mb-2">{t.debtTracker.borrowList}</p>
          <div className="space-y-2">
            {borrowTransactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{tx.description || tx.category?.name || '—'}</p>
                  <p className="text-xs text-gray-400">
                    {tx.contact_person && <span className="text-indigo-500">{tx.contact_person} · </span>}
                    {tx.transaction_date?.slice(0, 10)}
                  </p>
                </div>
                <p className="text-sm font-bold text-red-600">-{currency.symbol}{formatCurrency(Number(tx.amount))}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {lendTransactions.length === 0 && borrowTransactions.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-4">{t.common.noData}</p>
      )}
    </div>
  )
}
