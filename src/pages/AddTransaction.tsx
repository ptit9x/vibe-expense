import { useNavigate } from 'react-router-dom'
import { useWallets } from '@/hooks/useWallets'
import { useCategories } from '@/hooks/useCategories'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useAddTransactionStore } from '@/stores/addTransactionStore'
import { toast } from 'sonner'
import { getTransactionTypes } from '@/lib/categories'
import {
  AmountDisplay,
  CategorySelector,
  WalletSelector,
  TypeDropdown,
  SaveButton,
} from '@/components/add-transaction'
import { useI18n } from '@/lib/i18n'
import type { Category } from '@/types'

export default function AddTransaction() {
  const navigate = useNavigate()
  const createTransaction = useCreateTransaction()
  const { t } = useI18n()

  const {
    type,
    amount,
    categoryId,
    walletId,
    description,
    date,
    showTypeDropdown,
    setType,
    setAmount,
    setCategoryId,
    setWalletId,
    setDescription,
    toggleTypeDropdown,
  } = useAddTransactionStore()

  const { data: wallets } = useWallets()
  const { data: dbCategories, isLoading: isCategoriesLoading } = useCategories(type === 'income' ? 'income' : 'expense')

  const transactionTypes = getTransactionTypes(t)

  // Transform DB categories to display format
  // Remove emoji prefix from name (e.g., "🍔 Ăn uống" -> "Ăn uống")
  const resolveCategoryName = (cat: Category) => {
    return cat.name?.replace(/^(\p{Emoji_Presentation}\p{Extended_Pictographic}*\s*)+/u, '') || cat.name
  }

  const categories = (dbCategories || []).map((cat) => ({
    id: cat.id,
    name: resolveCategoryName(cat),
    icon: cat.icon || '📦',
    type: cat.type as 'income' | 'expense',
    color: cat.color || '#6B7280',
  }))

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

    const selectedType = transactionTypes.find(tt => tt.id === type)
    createTransaction.mutate({
      type: type === 'lend' || type === 'borrow' ? 'expense' : type as 'income' | 'expense',
      amount: parseFloat(amount),
      description: description || selectedType?.label,
      wallet_id: walletId,
      category_id: categoryId || undefined,
      transaction_date: date,
    }, {
      onSuccess: () => {
        useAddTransactionStore.getState().reset()
        toast.success(t.transaction.saveSuccess)
        navigate(-1)
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : t.common.error)
      },
    })
  }

  const filteredCategories = categories || []

  const today = new Date()
  const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1" aria-label="Back">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <TypeDropdown
            types={transactionTypes}
            selectedType={type}
            onSelect={(t) => setType(t as typeof type)}
            isOpen={showTypeDropdown}
            onToggle={toggleTypeDropdown}
          />

          <div className="w-10" />
        </div>

        <AmountDisplay value={amount} onChange={setAmount} />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-6">
        <CategorySelector
          categories={filteredCategories}
          selectedId={categoryId}
          onSelect={setCategoryId}
          isLoading={isCategoriesLoading}
        />

        <WalletSelector
          wallets={wallets || []}
          selectedId={walletId}
          onSelect={setWalletId}
        />

        <div className="bg-white mt-2 px-5 py-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{t.transaction.date}</p>
          <p className="text-base text-gray-700 font-medium">{formattedDate}</p>
        </div>

        <div className="bg-white mt-2 px-5 py-4">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.transaction.note}
            className="w-full py-3 text-base text-gray-700 placeholder-gray-300 bg-transparent border-b border-gray-100 focus:outline-none focus:border-blue-400"
          />
        </div>

        <SaveButton onClick={handleSave} isPending={createTransaction.isPending} />
      </div>
    </div>
  )
}
