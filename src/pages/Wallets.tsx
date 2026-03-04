import { useWallets, useCreateWallet, useDeleteWallet } from '@/hooks/useWallets'
import { useWalletsStore } from '@/stores/walletsStore'
import type { Wallet } from '@/types'
import {
  TotalBalanceCard,
  WalletList,
  AddWalletFAB,
  AddWalletModal,
} from '@/components/wallets'

export default function Wallets() {
  const { data: wallets, isLoading } = useWallets()
  const createWallet = useCreateWallet()
  const deleteWallet = useDeleteWallet()

  const { showForm, showBalance, toggleForm, toggleBalance } = useWalletsStore()

  const totalBalance = wallets?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0

  const handleAddWallet = async (data: {
    name: string
    type: 'cash' | 'bank' | 'e_wallet'
    icon: string
    color: string
    initial_balance: number
  }) => {
    await createWallet.mutateAsync(data)
    toggleForm()
  }

  const handleDeleteWallet = (wallet: Wallet) => {
    if (confirm('Bạn có chắc muốn xóa ví này?')) {
      deleteWallet.mutate(wallet)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with Total Balance */}
      <TotalBalanceCard
        totalBalance={totalBalance}
        showBalance={showBalance}
        onToggleBalance={toggleBalance}
      />

      {/* Section Header */}
      <div className="px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Tài khoản chi tiêu</h2>
      </div>

      {/* Wallet List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Đang tải...</div>
      ) : wallets?.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Chưa có ví nào. Nhấn + để tạo ví đầu tiên.
        </div>
      ) : (
        <WalletList
          wallets={wallets || []}
          showBalance={showBalance}
          onDelete={handleDeleteWallet}
        />
      )}

      {/* FAB */}
      <AddWalletFAB onClick={toggleForm} />

      {/* Add Wallet Modal */}
      <AddWalletModal
        isOpen={showForm}
        onClose={toggleForm}
        onSubmit={handleAddWallet}
        isPending={createWallet.isPending}
      />
    </div>
  )
}
