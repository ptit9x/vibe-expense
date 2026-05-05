import { useNavigate } from 'react-router-dom'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useTransactionFormStore } from '@/stores/transactionFormStore'
import { TransactionForm } from '@/components/add-transaction'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'

export default function AddTransaction() {
  const navigate = useNavigate()
  const createTransaction = useCreateTransaction()
  const { t } = useI18n()
  const { type, amount, walletId, categoryId, description, date, reset } = useTransactionFormStore()

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t.transaction.invalidAmount)
      return
    }
    if (!walletId) {
      toast.error(t.transaction.selectWallet)
      return
    }
    const amountValue = parseFloat(amount)
    if (Number.isFinite(amountValue) && !Number.isInteger(amountValue * 100)) {
      toast.error(t.transaction.invalidDecimals)
      return
    }

    createTransaction.mutate({
      type: type === 'lend' || type === 'borrow' ? 'expense' : type as 'income' | 'expense',
      amount: parseFloat(amount),
      description: description || undefined,
      wallet_id: walletId,
      category_id: categoryId || undefined,
      transaction_date: date,
    }, {
      onSuccess: () => {
        reset()
        toast.success(t.transaction.saveSuccess)
        navigate(-1)
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : t.common.error)
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">{t.transaction.add}</h1>
        </div>
      </div>
      <TransactionForm onSave={handleSave} isPending={createTransaction.isPending} />
    </div>
  )
}
