import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTransaction } from '@/hooks/useTransactions'
import { useTransactionSave } from '@/hooks/useTransactionSave'
import { useTransactionFormStore } from '@/stores/transactionFormStore'
import { TransactionForm } from '@/components/add-transaction'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import type { UpdateTransactionInput } from '@/types'

export default function EditTransaction() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { saveUpdate, isPending } = useTransactionSave()
  const { t } = useI18n()
  const {
    type, amount, walletId, toWalletId, categoryId,
    description, contactPerson, date, loadTransaction, reset,
  } = useTransactionFormStore()

  const { data: transaction, isLoading, error } = useTransaction(id)

  useEffect(() => {
    if (transaction) {
      loadTransaction({
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        categoryId: transaction.category_id || undefined,
        walletId: transaction.wallet_id || undefined,
        toWalletId: transaction.to_wallet_id || undefined,
        description: transaction.description || undefined,
        contactPerson: (transaction as unknown as Record<string, unknown>).contact_person as string || undefined,
        date: transaction.transaction_date,
      })
    }
    return () => reset()
  }, [transaction, loadTransaction, reset])

  const handleSave = async () => {
    if (!id) return
    if (!amount || parseFloat(amount) <= 0) { toast.error(t.transaction.invalidAmount); return }
    if (!walletId) { toast.error(t.transaction.selectWallet); return }

    const input: UpdateTransactionInput = {
      id,
      type: type as 'income' | 'expense' | 'lend' | 'borrow' | 'transfer',
      amount: parseFloat(amount),
      description: description || undefined,
      contact_person: contactPerson || undefined,
      wallet_id: walletId,
      to_wallet_id: type === 'transfer' ? toWalletId || undefined : undefined,
      category_id: categoryId || undefined,
      transaction_date: date,
    }

    const result = await saveUpdate(input, {
      onSuccess: () => {
        reset()
        toast.success(t.settings.transactionUpdated)
        navigate(-1)
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : t.common.error)
      },
      onOffline: () => {
        reset()
        toast.info(t.transaction.savedOffline)
        navigate(-1)
      },
    })

    if (result.outboxFull) {
      toast.error(t.transaction.outboxFull)
    }
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
          <p className="text-gray-500 mb-2">{t.settings.transactionNotFound}</p>
          <button onClick={() => navigate(-1)} className="text-blue-500 font-medium">
            {t.settings.goBack}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TransactionForm onSave={handleSave} isPending={isPending} />
    </div>
  )
}
