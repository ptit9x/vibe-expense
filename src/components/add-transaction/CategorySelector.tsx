import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

export interface CategoryItem {
  id: string
  name: string
  icon: string
  type: string
  color?: string
  parentId?: string
}

interface CategorySelectorProps {
  categories: CategoryItem[]
  selectedId: string
  onSelect: (id: string) => void
  isLoading?: boolean
}

export function CategorySelector({ categories, selectedId, onSelect, isLoading }: CategorySelectorProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)

  const selected = categories.find(c => c.id === selectedId)
  const parents = categories.filter(c => !c.parentId)
  const getSubs = (parentId: string) => categories.filter(c => c.parentId === parentId)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelect = (id: string) => {
    onSelect(id)
    setOpen(false)
  }

  return (
    <div className="bg-white mt-2 px-5 py-4" ref={ref}>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">{t.transaction.category}</p>

      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
          open ? "border-blue-400 bg-blue-50/50" : "border-gray-200 bg-gray-50"
        )}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{selected?.icon || '📦'}</span>
          <span className={cn("text-sm font-medium", selected ? "text-gray-900" : "text-gray-400")}>
            {selected ? selected.name : 'Select category'}
          </span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-400 transition-transform duration-200",
          open && "rotate-180"
        )} />
      </button>

      {open && (
        <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden shadow-sm max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : parents.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400 italic">No categories</div>
          ) : (
            parents.map(parent => {
              const subs = getSubs(parent.id)
              const isExpanded = expandedIds.has(parent.id)
              const isParentSelected = selectedId === parent.id

              return (
                <div key={parent.id}>
                  {/* Parent row */}
                  <div className="flex items-center border-b border-gray-50 last:border-0">
                    <button
                      onClick={() => handleSelect(parent.id)}
                      className={cn(
                        "flex-1 flex items-center gap-2.5 px-4 py-3 text-left transition-colors",
                        isParentSelected
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span className="text-base">{parent.icon}</span>
                      <span className="text-sm font-medium">{parent.name}</span>
                      {isParentSelected && (
                        <svg className="h-4 w-4 ml-auto text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    {subs.length > 0 && (
                      <button
                        onClick={() => toggleExpand(parent.id)}
                        className="px-3 py-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          isExpanded && "rotate-90"
                        )} />
                      </button>
                    )}
                  </div>

                  {/* Subcategories */}
                  {isExpanded && subs.map(sub => {
                    const isSubSelected = selectedId === sub.id
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSelect(sub.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 pl-10 pr-4 py-2.5 text-left border-b border-gray-50 last:border-0 transition-colors",
                          isSubSelected
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        <span className="text-sm">{sub.icon}</span>
                        <span className="text-sm">{sub.name}</span>
                        {isSubSelected && (
                          <svg className="h-3.5 w-3.5 ml-auto text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
