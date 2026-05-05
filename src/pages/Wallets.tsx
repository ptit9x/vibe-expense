import { useState, useCallback } from 'react'
import { useWallets, useCreateWallet, useDeleteWallet, useToggleWalletActive } from '@/hooks/useWallets'
import { useWalletsStore } from '@/stores/walletsStore'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import {
  TotalBalanceCard,
  WalletList,
  AddWalletFAB,
  WalletSectionHeader,
} from '@/components/wallets'
import { AddWalletModal } from '@/components/wallets/AddWalletModal'
import type { Wallet } from '@/types'
import { BottomSheet, BottomSheetFormField, IconPicker, ColorPicker, Input } from '@/components/ui/bottom-sheet'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const ICON_OPTIONS = ['💵', '💳', '🏦', '📱', '💎', '🎁', '🧧', '💰', '🏠', '🚗', '✈️', '🎓']
const COLOR_OPTIONS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

export default function Wallets() {
  const { data: wallets, isLoading } = useWallets(true) // includeInactive to show all wallets
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
  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({
    open: false, title: '', description: '', onConfirm: () => {},
  })

  const showConfirm = useCallback((title: string, description: string, onConfirm: () => void) => {
    setConfirmState({ open: true, title, description, onConfirm })
  }, [])

  // Group wallets by active status
  const activeWallets = wallets?.filter(w => w.is_active) || []
  const inactiveWallets = wallets?.filter(w => !w.is_active) || []
  const totalBalance = activeWallets.reduce((sum, w) => sum + (w.balance || 0), 0)

  const handleAddWallet = async (data: {
    name: string
    type: 'cash' | 'bank' | 'e_wallet'
    icon: string
    color: string
    initial_balance: number
  }) => {
    await createWallet.mutateAsync(data)
    toggleForm()
    toast.success(t.common.success)
  }

  const handleDeleteWallet = (wallet: Wallet) => {
    if (wallet.type === 'cash' && wallet.name === 'Cash') {
      toast.error(t.wallet.cannotDeleteDefault)
      return
    }

    showConfirm('Delete Wallet', `Are you sure you want to delete "${wallet.name}"? This cannot be undone.`, () => {
      deleteWallet.mutate(wallet, {
        onSuccess: (result) => {
          if (result.deleted) {
            toast.success(t.wallet.deleteSuccess)
          } else {
            toast.success('Wallet deactivated')
          }
        },
        onError: (err) => toast.error(err.message || t.common.error),
      })
    })
  }

  const handleToggleActive = (wallet: Wallet) => {
    if (wallet.is_active) {
      deactivateWallet.mutate(wallet, {
        onSuccess: () => toast.success(`"${wallet.name}" hidden`),
        onError: () => toast.error(t.common.error),
      })
    } else {
      deactivateWallet.mutate(wallet, {
        onSuccess: () => toast.success(`"${wallet.name}" shown`),
        onError: () => toast.error(t.common.error),
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
    // TODO: call useUpdateWallet when hook is ready
    toast.info('Edit wallet coming soon')
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

      {/* Active Wallets Section */}
      <WalletSectionHeader
        title={t.wallet.spendingAccounts}
        subtitle={activeWallets.length > 0 ? `${activeWallets.length} account${activeWallets.length > 1 ? 's' : ''}` : undefined}
      />

      {/* Wallet List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">{t.common.loading}</div>
      ) : activeWallets.length === 0 ? (
        <div className="text-center py-8 px-4">
          <p className="text-gray-400 text-sm">{t.wallet.noWallets}</p>
        </div>
      ) : (
        <WalletList
          wallets={activeWallets}
          showBalance={showBalance}
          onDelete={handleDeleteWallet}
          onEdit={handleEditWallet}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* Inactive Wallets Section */}
      {inactiveWallets.length > 0 && (
        <>
          <WalletSectionHeader title="Hidden Accounts" subtitle={`${inactiveWallets.length} account${inactiveWallets.length > 1 ? 's' : ''}`} />
          <WalletList
            wallets={inactiveWallets}
            showBalance={showBalance}
            onDelete={handleDeleteWallet}
            onEdit={handleEditWallet}
            onToggleActive={handleToggleActive}
          />
        </>
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState(prev => ({ ...prev, open }))}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmState.onConfirm}
      />
    </div>
  )
}