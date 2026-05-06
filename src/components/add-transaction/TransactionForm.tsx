import { useWallets } from '@/hooks/useWallets'
import { useCategories } from '@/hooks/useCategories'
import { useTransactionFormStore } from '@/stores/transactionFormStore'
import { getTransactionTypes } from '@/lib/categories'
import { useI18n } from '@/lib/i18n'
import {
  AmountDisplay,
  CategorySelector,
  WalletSelector,
  TransferWalletSelector,
  TypeDropdown,
  SaveButton,
  DateField,
  DescriptionField,
} from '.'
import PageHeader from '../PageHeader'

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
    toWalletId,
    description,
    date,
    showTypeDropdown,
    mode,
    setType,
    setAmount,
    setCategoryId,
    setWalletId,
    setToWalletId,
    setDescription,
    setDate,
    toggleTypeDropdown,
  } = useTransactionFormStore()

  const { data: wallets } = useWallets()
  const { data: dbCategories, isLoading: isCategoriesLoading } = useCategories(
    type === 'income' ? 'income' : 'expense'
  )

  const transactionTypes = getTransactionTypes(t)

  const categories = (dbCategories || []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon || '📦',
    type: cat.type as 'income' | 'expense',
    color: cat.color || '#6B7280',
    parentId: cat.parent_id || undefined,
  }))

  const isTransfer = type === 'transfer'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader>
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
      </PageHeader>

      {/* Form fields */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-6">
        {/* Category selector - hidden for transfer */}
        {!isTransfer && (
          <CategorySelector
            categories={categories}
            selectedId={categoryId}
            onSelect={setCategoryId}
            isLoading={isCategoriesLoading}
          />
        )}

        {/* Wallet selectors */}
        {isTransfer ? (
          <TransferWalletSelector
            wallets={wallets || []}
            fromWalletId={walletId}
            toWalletId={toWalletId}
            onFromSelect={setWalletId}
            onToSelect={setToWalletId}
          />
        ) : (
          <WalletSelector
            wallets={wallets || []}
            selectedId={walletId}
            onSelect={setWalletId}
          />
        )}

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
