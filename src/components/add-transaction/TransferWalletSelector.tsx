import { useState, useRef, useEffect } from 'react'
import { ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import type { WalletItem } from './WalletSelector'

interface TransferWalletSelectorProps {
  wallets: WalletItem[]
  fromWalletId: string
  toWalletId: string
  onFromSelect: (id: string) => void
  onToSelect: (id: string) => void
}

function WalletDropdown({
  wallets,
  selectedId,
  excludeId,
  onSelect,
  label,
  placeholder,
}: {
  wallets: WalletItem[]
  selectedId: string
  excludeId: string
  onSelect: (id: string) => void
  label: string
  placeholder: string
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = wallets.find(w => w.id === selectedId)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const filtered = wallets.filter(w => w.id !== excludeId)

  return (
    <div ref={ref}>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{label}</p>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
          open ? "border-blue-400 bg-blue-50/50" : "border-gray-200 bg-gray-50"
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{selected?.icon || '💵'}</span>
          <span className={cn("text-sm font-medium", selected ? "text-gray-900" : "text-gray-400")}>
            {selected ? selected.name : placeholder}
          </span>
        </div>
        <svg className={cn(
          "h-4 w-4 text-gray-400 transition-transform duration-200",
          open && "rotate-180"
        )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">{t.walletCard.noOtherWallets}</div>
          ) : (
            filtered.map((wallet) => {
              const isSelected = selectedId === wallet.id
              return (
                <button
                  key={wallet.id}
                  onClick={() => {
                    onSelect(wallet.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors",
                    isSelected
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                  )}
                >
                  <span className="text-lg">{wallet.icon}</span>
                  <span className="text-sm font-medium">{wallet.name}</span>
                  {isSelected && (
                    <svg className="h-4 w-4 ml-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export function TransferWalletSelector({
  wallets,
  fromWalletId,
  toWalletId,
  onFromSelect,
  onToSelect,
}: TransferWalletSelectorProps) {
  const { t } = useI18n()

  return (
    <div className="bg-white mt-2 px-5 py-4">
      <WalletDropdown
        wallets={wallets}
        selectedId={fromWalletId}
        excludeId={toWalletId}
        onSelect={onFromSelect}
        label={t.transaction.fromWallet || 'From Wallet'}
        placeholder={t.transaction.selectWallet || 'Select wallet'}
      />

      {/* Arrow divider */}
      <div className="flex justify-center my-2">
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
          <ArrowDown className="w-4 h-4 text-blue-500" />
        </div>
      </div>

      <WalletDropdown
        wallets={wallets}
        selectedId={toWalletId}
        excludeId={fromWalletId}
        onSelect={onToSelect}
        label={t.transaction.toWallet || 'To Wallet'}
        placeholder={t.transaction.selectWallet || 'Select wallet'}
      />
    </div>
  )
}
