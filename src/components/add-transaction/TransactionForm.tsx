import { useWallets } from '@/hooks/useWallets'
import { useCategories } from '@/hooks/useCategories'
import { useTransactionFormStore } from '@/stores/transactionFormStore'
import { getTransactionTypes } from '@/lib/categories'
import { useI18n } from '@/lib/i18n'
import type { Category } from '@/types'
import {
  AmountDisplay,
  CategorySelector,
  WalletSelector,
  TypeDropdown,
  SaveButton,
  DateField,
  DescriptionField,
} from '.'

interface TransactionFormProps {
  onSave: () => void
  isPending: boolean
}

export function TransactionForm({ onSave, isPending }: TransactionFormProps) {
  const { t } = useI18n()

  const {
    type,
    amount,
    categoryId,
    walletId,
    description,
    date,
    showTypeDropdown,
    mode,
    setType,
    setAmount,
    setCategoryId,
    setWalletId,
    setDescription,
    setDate,
    toggleTypeDropdown,
  } = useTransactionFormStore()

  const { data: wallets } = useWallets()
  const { data: dbCategories, isLoading: isCategoriesLoading } = useCategories(
    type === 'income' ? 'income' : 'expense'
  )

  const transactionTypes = getTransactionTypes(t)

  const resolveCategoryName = (cat: Category) => {
    return cat.name?.replace(/^(\p{Emoji_Presentation}\p{Extended_Pictographic}*\s*)+/u, '') || cat.name
  }

  const categories = (dbCategories || []).map((cat) => ({
    id: cat.id,
    name: resolveCategoryName(cat),
    icon: cat.icon || '📦',
    type: cat.type as 'income' | 'expense',
    color: cat.color || '#6B7280',
    parentId: cat.parent_id || undefined,
  }))

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10" />
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

      {/* Form fields */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-6">
        <CategorySelector
          categories={categories}
          selectedId={categoryId}
          onSelect={setCategoryId}
          isLoading={isCategoriesLoading}
        />

        <WalletSelector
          wallets={wallets || []}
          selectedId={walletId}
          onSelect={setWalletId}
        />

        <DateField value={date} onChange={setDate} label={t.transaction.date} />

        <DescriptionField
          value={description}
          onChange={setDescription}
          placeholder={t.transaction.note}
        />

        <SaveButton
          onClick={onSave}
          isPending={isPending}
          label={mode === 'edit' ? 'Save Changes' : undefined}
        />
      </div>
    </div>
  )
}
