import { cn } from '@/lib/utils'

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
}

export function CategorySelector({ categories, selectedId, onSelect }: CategorySelectorProps) {
  return (
    <div className="bg-white mt-2 px-5 py-4">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Danh mục</p>
      <div 
        className="flex gap-2 overflow-x-auto pb-2 px-5 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all text-sm shrink-0",
              selectedId === cat.id
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            <span className="text-lg">{cat.icon}</span>
            <span className="font-medium whitespace-nowrap">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}