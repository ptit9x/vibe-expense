import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTransaction, useUpdateTransaction } from '@/hooks/useTransactions'
import { useTransactionFormStore } from '@/stores/transactionFormStore'
import { TransactionForm } from '@/components/add-transaction'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'

export default function EditTransaction() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const updateTransaction = useUpdateTransaction()
  const { t } = useI18n()
  const { type, amount, walletId, categoryId, description, date, loadTransaction, reset } = useTransactionFormStore()

  const { data: transaction, isLoading, error } = useTransaction(id)

  // Load transaction data into form once
  useEffect(() => {
    if (transaction) {
      loadTransaction({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        categoryId: transaction.category_id || undefined,
        walletId: transaction.wallet_id || undefined,
        description: transaction.description || undefined,
        date: transaction.transaction_date,
      })
    }
    return () => reset()
  }, [transaction, loadTransaction, reset])

  const handleSave = () => {
    if (!id) return
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t.transaction.invalidAmount)
      return
    }
    if (!walletId) {
      toast.error(t.transaction.selectWallet)
      return
    }

    updateTransaction.mutate({
      id,
      type: type === 'lend' || type === 'borrow' ? 'expense' : type as 'income' | 'expense',
      amount: parseFloat(amount),
      description: description || undefined,
      wallet_id: walletId,
      category_id: categoryId || undefined,
      transaction_date: date,
    }, {
      onSuccess: () => {
        reset()
        toast.success('Transaction updated')
        navigate(-1)
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : t.common.error)
      },
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-2">Transaction not found</p>
          <button onClick={() => navigate(-1)} className="text-blue-500 font-medium">
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">Edit Transaction</h1>
        </div>
      </div>
      <TransactionForm onSave={handleSave} isPending={updateTransaction.isPending} />
    </div>
  )
}
