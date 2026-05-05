import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

export interface CategoryItem {
  id: string
  name: string
  icon: string
  type: string
  color?: string
}

interface CategorySelectorProps {
  categories: CategoryItem[]
  selectedId: string
  onSelect: (id: string) => void
  isLoading?: boolean
}

export function CategorySelector({ categories, selectedId, onSelect, isLoading }: CategorySelectorProps) {
  const { t } = useI18n()

  if (isLoading) {
    return (
      <div className="bg-white mt-2 px-5 py-4">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">{t.transaction.category}</p>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 py-2">
              <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
              <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white mt-2 px-5 py-4">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">{t.transaction.category}</p>
        <p className="text-sm text-gray-400 italic">No categories available</p>
      </div>
    )
  }

  return (
    <div className="bg-white mt-2 px-5 py-4">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">{t.transaction.category}</p>
      <div className="grid grid-cols-4 gap-1">
        {categories.map((cat) => {
          const isSelected = selectedId === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all",
                isSelected
                  ? "bg-blue-50"
                  : "hover:bg-gray-50 active:scale-95"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all",
                  isSelected && "ring-2 ring-offset-1"
                )}
                style={{
                  backgroundColor: isSelected ? (cat.color || '#3B82F6') + '20' : '#F3F4F6',
                  ...(isSelected ? { ringColor: cat.color || '#3B82F6' } : {}),
                }}
              >
                <span className="text-lg">{cat.icon}</span>
              </div>
              <span
                className={cn(
                  "text-[11px] leading-tight text-center line-clamp-1 w-full",
                  isSelected ? "text-gray-900 font-medium" : "text-gray-500"
                )}
              >
                {cat.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
