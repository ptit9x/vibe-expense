import { useState } from 'react'
import { useWallets, useCreateWallet, useDeleteWallet, useToggleWalletActive } from '@/hooks/useWallets'
import { useWalletsStore } from '@/stores/walletsStore'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import {
  TotalBalanceCard,
  WalletList,
  AddWalletFAB,
  AddWalletModal,
} from '@/components/wallets'
import type { Wallet } from '@/types'
import { BottomSheet, BottomSheetFormField, IconPicker, ColorPicker, Input } from '@/components/ui/bottom-sheet'

const ICON_OPTIONS = ['💵', '💳', '🏦', '📱', '💎', '🎁', '🧧', '💰', '🏠', '🚗', '✈️', '🎓']
const COLOR_OPTIONS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

export default function Wallets() {
  const { data: wallets, isLoading } = useWallets()
  const createWallet = useCreateWallet()
  const deleteWallet = useDeleteWallet()
  const deactivateWallet = useToggleWalletActive()
  const { showForm, showBalance, toggleForm, toggleBalance } = useWalletsStore()
  const { t } = useI18n()

  // Edit wallet state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('💵')
  const [editColor, setEditColor] = useState('#3B82F6')

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
    if (wallet.type === 'cash' && wallet.name === 'Cash') {
      toast.error('Cannot delete default Cash wallet')
      return
    }

    // Check if wallet has transactions (would need to check via API in real app)
    // For now, show confirmation with info
    const hasTransactions = false // TODO: Check via API

    if (hasTransactions) {
      toast.error('This wallet has transactions. Please deactivate instead.')
      return
    }

    if (confirm(`Delete wallet "${wallet.name}"? This cannot be undone.`)) {
      deleteWallet.mutate(wallet, {
        onSuccess: (result) => {
          if (result.deleted) {
            toast.success('Wallet deleted successfully')
          } else {
            toast.success('Wallet deactivated (has existing transactions)')
          }
        },
        onError: (err) => toast.error(err.message || 'Failed to delete wallet'),
      })
    }
  }

  const handleToggleActive = (wallet: Wallet) => {
    if (wallet.is_active) {
      // Deactivate
      if (confirm(`Deactivate "${wallet.name}"? It will be hidden from transaction forms.`)) {
        deactivateWallet.mutate(wallet, {
          onSuccess: () => toast.success(`"${wallet.name}" has been deactivated`),
          onError: () => toast.error('Failed to deactivate wallet'),
        })
      }
    } else {
      // Activate
      deactivateWallet.mutate(wallet, {
        onSuccess: () => toast.success(`"${wallet.name}" is now active`),
        onError: () => toast.error('Failed to activate wallet'),
      })
    }
  }

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet)
    setEditName(wallet.name)
    setEditIcon(wallet.icon)
    setEditColor(wallet.color)
    setEditModalOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingWallet || !editName.trim()) return

    // TODO: Call useUpdateWallet when hook is ready
    toast.info('Edit wallet feature coming soon')
    setEditModalOpen(false)
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
        <h2 className="text-lg font-semibold text-gray-900">{t.wallet.spendingAccounts}</h2>
      </div>

      {/* Wallet List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">{t.common.loading}</div>
      ) : wallets?.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          {t.wallet.noWallets}
        </div>
      ) : (
        <WalletList
          wallets={wallets || []}
          showBalance={showBalance}
          onDelete={handleDeleteWallet}
          onEdit={handleEditWallet}
          onToggleActive={handleToggleActive}
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

      {/* Edit Wallet Modal */}
      <BottomSheet
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Wallet"
        isPending={false}
        onSubmit={handleSaveEdit}
        submitDisabled={!editName.trim()}
        submitLabel="Save Changes"
      >
        <BottomSheetFormField label="Name">
          <Input
            placeholder="Wallet name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="h-12 text-base"
          />
        </BottomSheetFormField>

        <BottomSheetFormField label="Icon">
          <IconPicker value={editIcon} onChange={setEditIcon} options={ICON_OPTIONS} />
        </BottomSheetFormField>

        <BottomSheetFormField label="Color">
          <ColorPicker value={editColor} onChange={setEditColor} options={COLOR_OPTIONS} />
        </BottomSheetFormField>
      </BottomSheet>
    </div>
  )
}