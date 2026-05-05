import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

export interface WalletItem {
  id: string
  name: string
  icon: string
  type: string
  color?: string
}

interface WalletSelectorProps {
  wallets: WalletItem[]
  selectedId: string
  onSelect: (id: string) => void
}

export function WalletSelector({ wallets, selectedId, onSelect }: WalletSelectorProps) {
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

  return (
    <div className="bg-white mt-2 px-5 py-4" ref={ref}>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{t.transaction.wallet}</p>

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
            {selected ? selected.name : 'Select wallet'}
          </span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-400 transition-transform duration-200",
          open && "rotate-180"
        )} />
      </button>

      {open && (
        <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {wallets.map((wallet) => {
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
          })}
        </div>
      )}
    </div>
  )
}
