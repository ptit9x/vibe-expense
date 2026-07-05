import { useNavigate } from 'react-router-dom'
import { useTransactionSave } from '@/hooks/useTransactionSave'
import { useTransactionFormStore } from '@/stores/transactionFormStore'
import { TransactionForm } from '@/components/add-transaction'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import type { CreateTransactionInput } from '@/types'

import { PageTransition } from '@/components/shared'

export default function AddTransaction() {
  const navigate = useNavigate()
  const { saveCreate, isPending } = useTransactionSave()
  const { t } = useI18n()
  const {
    type, amount, walletId, toWalletId, categoryId,
    description, contactPerson, date, reset,
  } = useTransactionFormStore()

  const handleSave = async () => {
    // --- validation ---
    if (!amount || parseFloat(amount) <= 0) { toast.error(t.transaction.invalidAmount); return }
    if (!walletId) { toast.error(t.transaction.selectWallet); return }
    if (type === 'transfer' && !toWalletId) {
      toast.error(t.transaction.selectToWallet || 'Please select destination wallet'); return
    }
    if (type === 'transfer' && walletId === toWalletId) {
      toast.error(t.transaction.sameWallet || 'Source and destination wallets must be different'); return
    }
    const amountValue = parseFloat(amount)
    if (Number.isFinite(amountValue) && !Number.isInteger(amountValue * 100)) {
      toast.error(t.transaction.invalidDecimals); return
    }

    const input: CreateTransactionInput = {
      type: type as 'income' | 'expense' | 'lend' | 'borrow' | 'transfer',
      amount: parseFloat(amount),
      description: description || undefined,
      contact_person: contactPerson || undefined,
      wallet_id: walletId,
      to_wallet_id: type === 'transfer' ? toWalletId : undefined,
      category_id: type !== 'transfer' ? (categoryId || undefined) : undefined,
      transaction_date: date,
    }

    const result = await saveCreate(input, {
      onSuccess: () => {
        reset()
        toast.success(t.transaction.saveSuccess)
        navigate(-1)
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : t.common.error)
      },
    })

    if (result.offline) {
      toast.dismiss()
      toast.info(t.transaction.savedOffline)
    } else if (result.outboxFull) {
      toast.error(t.transaction.outboxFull)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <TransactionForm onSave={handleSave} isPending={isPending} />
      </div>
    </PageTransition>
  )
}
