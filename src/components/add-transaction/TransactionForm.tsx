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
  ContactPersonField,
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
    contactPerson,
    date,
    showTypeDropdown,
    mode,
    setType,
    setAmount,
    setCategoryId,
    setWalletId,
    setToWalletId,
    setDescription,
    setContactPerson,
    setDate,
    toggleTypeDropdown,
  } = useTransactionFormStore()

  const { data: wallets } = useWallets()
  const categoryType = type === 'lend' ? 'expense'
    : type === 'borrow' ? 'income'
    : type === 'income' ? 'income'
    : 'expense'

  const { data: dbCategories, isLoading: isCategoriesLoading } = useCategories()

  const transactionTypes = getTransactionTypes(t)

  // Filter categories by type client-side (single cache key for all types)
  const categories = (dbCategories || [])
    .filter(cat => cat.type === categoryType)
    .map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon || '📦',
    type: cat.type as 'income' | 'expense',
    color: cat.color || '#6B7280',
    parentId: cat.parent_id || undefined,
    slug: cat.slug || undefined,
  }))

  const isTransfer = type === 'transfer'
  const isLendBorrow = type === 'lend' || type === 'borrow'
  const showCategory = !isTransfer && !isLendBorrow

  // When lend/borrow: only show the matching category by slug
  const visibleCategories = isLendBorrow
    ? categories.filter(c => {
        if (type === 'lend') return c.slug === 'lend'
        if (type === 'borrow') return c.slug === 'borrow'
        return true
      })
    : categories

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="w-10" />
          <TypeDropdown
            types={transactionTypes}
            selectedType={type}
            onSelect={(newType) => {
              const wasEmpty = !description
              setType(newType as typeof type)
              // Set localized default description in add mode when description was empty
              if (mode === 'add' && wasEmpty) {
                const defaults: Record<string, string> = {
                  transfer: t.transaction.transfer,
                  lend: t.transaction.lend,
                  borrow: t.transaction.borrow,
                }
                const defaultDesc = defaults[newType] || ''
                if (defaultDesc) setDescription(defaultDesc)
              }
            }}
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
        {showCategory && (
          <CategorySelector
            categories={visibleCategories}
            selectedId={categoryId}
            onSelect={setCategoryId}
            isLoading={isCategoriesLoading}
          />
        )}

        {/* Contact person - only for lend/borrow */}
        {isLendBorrow && (
          <ContactPersonField
            value={contactPerson}
            onChange={setContactPerson}
            type={type as 'lend' | 'borrow'}
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
            className="bg-white mt-2 px-5 py-4"
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
          label={mode === 'edit' ? t.settings.saveChanges : undefined}
        />
      </div>
    </div>
  )
}
