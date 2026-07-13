import { supabase } from '@/lib/supabase'
import type { Wallet } from '@/types'

interface RawWallet {
  id: string
  user_id: string
  name: string
  type: string
  icon: string | null
  color: string | null
  initial_balance: number
  is_active: boolean
  created_at: string
  updated_at: string | null
}

/**
 * Compute wallet balances client-side via batch transaction query.
 * Shared by useWallets and useFinancialReports to avoid logic duplication.
 *
 * Money in:  income, borrow, transfer-in (to_wallet_id)
 * Money out: expense, lend, transfer-out (wallet_id)
 */
export async function computeWalletBalances(
  walletData: RawWallet[],
  userId: string
): Promise<Wallet[]> {
  if (walletData.length === 0) return []

  const walletIds = walletData.map((w) => w.id)

  // Fetch all transactions for these wallets
  const { data: txData } = await supabase
    .from('transactions')
    .select('wallet_id, to_wallet_id, type, amount')
    .in('wallet_id', walletIds)
    .eq('user_id', userId)

  // Build balance map
  const balanceMap = new Map<string, number>()
  for (const tx of txData || []) {
    const wId = tx.wallet_id
    const prev = balanceMap.get(wId) || 0
    if (tx.type === 'income' || tx.type === 'borrow') {
      balanceMap.set(wId, prev + tx.amount)
    } else if (tx.type === 'expense' || tx.type === 'lend' || tx.type === 'transfer') {
      balanceMap.set(wId, prev - tx.amount)
    }
  }

  // Credit destination wallets for transfers
  const { data: transferData } = await supabase
    .from('transactions')
    .select('to_wallet_id, amount')
    .in('to_wallet_id', walletIds)
    .eq('user_id', userId)
    .eq('type', 'transfer')

  for (const tx of transferData || []) {
    if (tx.to_wallet_id) {
      const prev = balanceMap.get(tx.to_wallet_id) || 0
      balanceMap.set(tx.to_wallet_id, prev + tx.amount)
    }
  }

  return walletData.map((wallet) => ({
    ...wallet,
    balance: (balanceMap.get(wallet.id) || 0) + (wallet.initial_balance || 0),
  })) as Wallet[]
}
