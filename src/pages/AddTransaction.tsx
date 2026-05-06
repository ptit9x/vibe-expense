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
  const { type, amount, walletId, toWalletId, categoryId, description, date, reset } = useTransactionFormStore()

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t.transaction.invalidAmount)
      return
    }
    if (!walletId) {
      toast.error(t.transaction.selectWallet)
      return
    }

    // Transfer-specific validation
    if (type === 'transfer' && !toWalletId) {
      toast.error(t.transaction.selectToWallet || 'Please select destination wallet')
      return
    }
    if (type === 'transfer' && walletId === toWalletId) {
      toast.error(t.transaction.sameWallet || 'Source and destination wallets must be different')
      return
    }

    const amountValue = parseFloat(amount)
    if (Number.isFinite(amountValue) && !Number.isInteger(amountValue * 100)) {
      toast.error(t.transaction.invalidDecimals)
      return
    }

    createTransaction.mutate({
      type: type === 'lend' || type === 'borrow' ? 'expense' : type as 'income' | 'expense' | 'transfer',
      amount: parseFloat(amount),
      description: description || undefined,
      wallet_id: walletId,
      to_wallet_id: type === 'transfer' ? toWalletId : undefined,
      category_id: type !== 'transfer' ? (categoryId || undefined) : undefined,
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
      <TransactionForm onSave={handleSave} isPending={createTransaction.isPending} />
    </div>
  )
}
