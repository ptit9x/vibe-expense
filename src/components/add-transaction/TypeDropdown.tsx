import { cn } from '@/lib/utils'

export interface TransactionTypeItem {
  id: string
  label: string
  icon: string
  color?: string
}

interface TypeDropdownProps {
  types: TransactionTypeItem[]
  selectedType: string
  onSelect: (type: string) => void
  isOpen: boolean
  onToggle: () => void
}

export function TypeDropdown({ types, selectedType, onSelect, isOpen, onToggle }: TypeDropdownProps) {
  const current = types.find(item => item.id === selectedType) || types[0]

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition-colors"
      >
        <span className="text-base text-white">{current.icon}</span>
        <span className="font-medium text-white text-sm">{current.label}</span>
        <svg className={cn("w-4 h-4 text-white/70 transition-transform", isOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={onToggle}
          />
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-[hsl(224,30%,13%)] rounded-2xl shadow-xl border-0 z-30 overflow-hidden min-w-[170px]">
            {types.map((typeItem) => (
              <button
                key={typeItem.id}
                onClick={() => {
                  onSelect(typeItem.id)
                  onToggle()
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-colors border-b border-gray-100/50 dark:border-white/5 last:border-0"
              >
                <span className="text-lg">{typeItem.icon}</span>
                <span className={cn("font-medium text-sm", selectedType === typeItem.id ? "text-indigo-600" : "text-gray-700 dark:text-gray-300")}>
                  {typeItem.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
