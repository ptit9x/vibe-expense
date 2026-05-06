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
      <TransactionForm onSave={handleSave} isPending={updateTransaction.isPending} />
    </div>
  )
}
