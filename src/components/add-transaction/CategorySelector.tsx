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
        <div className="flex gap-2 overflow-x-auto pb-2 px-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-24 bg-gray-100 rounded-full animate-pulse shrink-0" />
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
      <div
        className="flex gap-2 overflow-x-auto pb-2 px-5 scrollbar-hide"
      >
        {categories.map((cat) => {
          const isSelected = selectedId === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all text-sm shrink-0",
                isSelected
                  ? "text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
              style={isSelected && cat.color ? { backgroundColor: cat.color } : {}}
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="font-medium whitespace-nowrap">{cat.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
