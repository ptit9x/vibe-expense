import { useNavigate } from 'react-router-dom'
import { useWallets } from '@/hooks/useWallets'
import { useCategories } from '@/hooks/useCategories'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useAddTransactionStore } from '@/stores/addTransactionStore'
import {
  AmountDisplay,
  CategorySelector,
  WalletSelector,
  TypeDropdown,
  SaveButton,
} from '@/components/add-transaction'

const transactionTypes = [
  { id: 'expense', label: 'Chi tiền', icon: '➖' },
  { id: 'income', label: 'Thu tiền', icon: '➕' },
  { id: 'lend', label: 'Cho vay', icon: '💸' },
  { id: 'borrow', label: 'Đi vay', icon: '🏦' },
  { id: 'transfer', label: 'Chuyển khoản', icon: '🔄' },
]

export default function AddTransaction() {
  const navigate = useNavigate()
  const createTransaction = useCreateTransaction()
  
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
  const { data: categories } = useCategories(type === 'income' ? 'income' : 'expense')

  const handleSave = () => {
    if (!amount || !walletId) {
      alert('Vui lòng điền đầy đủ thông tin')
      return
    }

    createTransaction.mutate({
      type: type === 'lend' || type === 'borrow' ? 'expense' : type as 'income' | 'expense',
      amount: parseFloat(amount),
      description: description || transactionTypes.find(t => t.id === type)?.label,
      wallet_id: walletId,
      category_id: categoryId || undefined,
      transaction_date: date,
    }, {
      onSuccess: () => {
        useAddTransactionStore.getState().reset()
        navigate(-1)
      },
      onError: () => { /* silent fail for demo */ }
    })
  }

  const filteredCategories = categories?.filter(c => 
    type === 'income' ? c.type === 'income' : c.type === 'expense'
  ) || []

  const today = new Date()
  const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header with Gradient Background */}
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1">
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

      {/* Main Content - Prevent horizontal overflow */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-6">
        <CategorySelector
          categories={filteredCategories}
          selectedId={categoryId}
          onSelect={setCategoryId}
        />

        <WalletSelector
          wallets={wallets || []}
          selectedId={walletId}
          onSelect={setWalletId}
        />

        {/* Date Section */}
        <div className="bg-white mt-2 px-5 py-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Ngày</p>
          <p className="text-base text-gray-700 font-medium">{formattedDate}</p>
        </div>

        {/* Description */}
        <div className="bg-white mt-2 px-5 py-4">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ghi chú"
            className="w-full py-3 text-base text-gray-700 placeholder-gray-300 bg-transparent border-b border-gray-100 focus:outline-none focus:border-blue-400"
          />
        </div>

        <SaveButton onClick={handleSave} isPending={createTransaction.isPending} />
      </div>
    </div>
  )
}
