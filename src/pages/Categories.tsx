import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCategories, useDeleteCategoryOverride, useUpdateCategoryOverride, useCreateCategory } from '@/hooks/useCategories'
import { useI18n } from '@/lib/i18n'
import type { Category } from '@/types'
import { toast } from 'sonner'
import { BottomSheet, BottomSheetFormField, IconPicker, ColorPicker, Input } from '@/components/ui/bottom-sheet'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'

// Predefined icons and colors for category picker
const ICON_OPTIONS = [
  // Food & Drink
  '🍔', '🍕', '🍜', '🍣', '☕', '🍺', '🧃', '🍰', '🥗', '🍳',
  // Transport
  '🚗', '🚌', '🚕', '🚲', '✈️', '🛵', '⛽', '🅿️',
  // Home & Living
  '🏠', '🛋️', '💡', '🚿', '🧹', '🔑', '🏡',
  // Shopping
  '🛒', '👗', '👟', '💄', '💍', '🧳',
  // Entertainment
  '🎮', '🎬', '🎵', '🎯', '🎲', '🧩', '🎪', '🎭',
  // Health
  '💊', '🏥', '🩺', '🧘', '💪', '🦷',
  // Education
  '📚', '🎓', '✏️', '🏫', '💡', '🔬',
  // Finance
  '💰', '📈', '💳', '🏦', '💵', '📊', '🏧',
  // Work
  '💼', '🖥️', '📱', '📋', '🔧', '🛠️', '⚙️',
  // Social
  '🎁', '🎂', '💌', '💐', '🎊', '🤝',
  // Sports
  '🏋️', '⚽', '🏀', '🎾', '🏊', '🚴', '🏔️',
  // Travel
  '✈️', '🏖️', '🗺️', '📸', '🌍', '🎒',
  // Pets
  '🐾', '🐶', '🐱', '🐟',
  // Kids
  '👶', '🧸', '🍼', '🚸',
  // Other
  '📦', '❓', '⭐', '🏷️', '📌', '🔔', '🧪',
]
const COLOR_OPTIONS = [
  // Red
  '#FF6B6B', '#E74C3C', '#C0392B', '#FF4757',
  // Orange
  '#FF9F43', '#E67E22', '#F39C12', '#FFA502',
  // Yellow
  '#FFEAA7', '#F1C40F', '#FFD93D',
  // Green
  '#2ECC71', '#27AE60', '#96CEB4', '#00B894', '#55E6C1',
  // Teal
  '#4ECDC4', '#1ABC9C', '#00CEC9',
  // Blue
  '#3498DB', '#2980B9', '#45B7D1', '#74B9FF', '#0984E3',
  // Purple
  '#9B59B6', '#8E44AD', '#A29BFE', '#6C5CE7',
  // Pink
  '#DDA0DD', '#FD79A8', '#E84393', '#FF6B81',
  // Gray
  '#95A5A6', '#636E72', '#B2BEC3',
  // Dark
  '#2D3436', '#34495E',
]

interface CategoryFormData {
  name: string
  icon: string
  color: string
  type: 'expense' | 'income'
  parent_id?: string
}

export default function Categories() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formName, setFormName] = useState('')
  const [formIcon, setFormIcon] = useState('📦')
  const [formColor, setFormColor] = useState('#95A5A6')
  const [formParentId, setFormParentId] = useState<string | undefined>(undefined)
  const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; description: string; onConfirm: () => void }>({
    open: false, title: '', description: '', onConfirm: () => {},
  })

  const showConfirm = useCallback((title: string, description: string, onConfirm: () => void) => {
    setConfirmState({ open: true, title, description, onConfirm })
  }, [])

  const { data: categories, isLoading } = useCategories()
  const deleteOverride = useDeleteCategoryOverride()
  const updateOverride = useUpdateCategoryOverride()
  const createCategory = useCreateCategory()
  const { t } = useI18n()

  // Strip emoji + space prefix from category name (e.g., "🍔 Ăn uống" -> "Ăn uống")
  const getCategoryDisplayName = (name: string | null | undefined) => {
    if (!name) return ''
    return name.replace(/^[\p{Emoji}\p{Extended_Pictographic}]+\s*/u, '') || name
  }

  // Group categories by parent
  const categoriesForType = (categories || []).filter(c => c.type === activeTab)
  const parentCategories = categoriesForType.filter(c => !c.parent_id)
  const subcategories = categoriesForType.filter(c => c.parent_id)

  const getSubcategories = (parentId: string) =>
    subcategories.filter(c => c.parent_id === parentId)

  // Separate system vs user categories
  const systemCategories = parentCategories.filter(c => c.is_system)
  const userCategories = parentCategories.filter(c => !c.is_system)

  const openAddModal = () => {
    setFormName('')
    setFormIcon('📦')
    setFormColor('#95A5A6')
    setFormParentId(undefined)
    setModalMode('add')
    setShowModal(true)
  }

  const openAddSubModal = (parentId: string) => {
    setFormName('')
    setFormIcon('📦')
    setFormColor('#95A5A6')
    setFormParentId(parentId)
    setModalMode('add')
    setShowModal(true)
  }

  const openEditModal = (cat: Category) => {
    setFormName(getCategoryDisplayName(cat.name))
    setFormIcon(cat.icon || '📦')
    setFormColor(cat.color || '#95A5A6')
    setFormParentId(cat.parent_id || undefined)
    setEditingCategory(cat)
    setModalMode('edit')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return

    const data: CategoryFormData = {
      name: formIcon + ' ' + formName.trim(),
      icon: formIcon,
      color: formColor,
      type: activeTab,
      parent_id: formParentId || undefined,
    }

    if (modalMode === 'add') {
      createCategory.mutate(data, {
        onSuccess: () => {
          toast.success('Category created')
          closeModal()
        },
        onError: () => toast.error('Failed to create category'),
      })
    } else if (modalMode === 'edit' && editingCategory) {
      updateOverride.mutate(
        {
          categoryId: editingCategory.id,
          customName: data.name,
          customIcon: data.icon,
          customColor: data.color,
          isSystem: editingCategory.is_system,
        },
        {
          onSuccess: () => {
            toast.success('Category updated')
            closeModal()
          },
          onError: () => toast.error('Failed to update category'),
        }
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/profile')}
            className="p-2 -ml-2 text-white/80 hover:text-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold text-white">{t.categories.categoriesTitle}</h1>
        </div>

        {/* Type Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'expense'
                ? 'bg-white text-blue-500'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {t.transaction.expense}
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === 'income'
                ? 'bg-white text-blue-500'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {t.transaction.income}
          </button>
        </div>
      </div>

      {/* Add Button */}
      <div className="px-5 py-4">
        <button
          onClick={openAddModal}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Category
        </button>
      </div>

      <div className="px-5 space-y-6">
        {/* User Categories Section */}
        {userCategories.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              My Categories ({userCategories.length})
            </h2>
            <div className="space-y-2">
              {userCategories.map(cat => {
                const children = getSubcategories(cat.id)
                return (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    subcategories={children}
                    resolveName={getCategoryDisplayName}
                    onEdit={() => openEditModal(cat)}
                    onDelete={() => {
                      showConfirm('Delete Category', `Are you sure you want to delete "${getCategoryDisplayName(cat.name)}"? This cannot be undone.`, () => {
                        deleteOverride.mutate({ categoryId: cat.id, isSystem: false }, {
                          onSuccess: () => toast.success('Category deleted'),
                          onError: () => toast.error('Failed to delete category'),
                        })
                      })
                    }}
                    onAddSub={() => openAddSubModal(cat.id)}
                    onEditSub={openEditModal}
                    onDeleteSub={(subId) => {
                      showConfirm('Delete Subcategory', 'Are you sure you want to delete this subcategory?', () => {
                        deleteOverride.mutate({ categoryId: subId, isSystem: false }, {
                          onSuccess: () => toast.success('Subcategory deleted'),
                          onError: () => toast.error('Failed to delete subcategory'),
                        })
                      })
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* System Categories Section */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            System Categories ({systemCategories.length})
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl h-16 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {systemCategories.map(cat => {
                const children = getSubcategories(cat.id)
                return (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    subcategories={children}
                    resolveName={getCategoryDisplayName}
                    isSystem
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      <BottomSheet
        isOpen={showModal}
        onClose={closeModal}
        title={modalMode === 'add' ? t.categories.addCategory : 'Edit Category'}
        isPending={createCategory.isPending || updateOverride.isPending}
        onSubmit={handleSubmit}
        submitDisabled={!formName.trim()}
        submitLabel={modalMode === 'add' ? t.categories.addCategory : 'Save Changes'}
      >
        <BottomSheetFormField label="Name">
          <Input
            placeholder="Category name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="h-12 text-base"
          />
        </BottomSheetFormField>

        <BottomSheetFormField label="Icon">
          <IconPicker value={formIcon} onChange={setFormIcon} options={ICON_OPTIONS} />
        </BottomSheetFormField>

        <BottomSheetFormField label="Color">
          <ColorPicker value={formColor} onChange={setFormColor} options={COLOR_OPTIONS} previewIcon={formIcon} />
        </BottomSheetFormField>

        <BottomSheetFormField label="Parent Category">
          <select
            value={formParentId || ''}
            onChange={(e) => setFormParentId(e.target.value || undefined)}
            className="w-full h-12 px-3 bg-gray-50 rounded-lg text-base appearance-none"
          >
            <option value="">None (Top-level)</option>
            {parentCategories.map(p => (
              <option key={p.id} value={p.id}>
                {p.icon} {getCategoryDisplayName(p.name)}
              </option>
            ))}
          </select>
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


interface CategoryCardProps {
  category: Category
  subcategories: Category[]
  resolveName: (name: string | null | undefined) => string
  isSystem?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onAddSub?: () => void
  onEditSub?: (sub: Category) => void
  onDeleteSub?: (subId: string) => void
}

function CategoryCard({
  category,
  subcategories,
  resolveName,
  isSystem = false,
  onEdit,
  onDelete,
  onAddSub,
  onEditSub,
  onDeleteSub,
}: CategoryCardProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = subcategories.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Parent row */}
      <div className="flex items-center justify-between p-4">
        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: (category.color || '#6B7280') + '20' }}
          >
            {category.icon}
          </div>
          <span className="font-medium text-gray-900 truncate">{resolveName(category.name)}</span>
          {hasChildren && (
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full shrink-0">
              {subcategories.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isSystem && onAddSub && (
            <button onClick={onAddSub} className="p-2 text-gray-400 hover:text-green-500 rounded-lg" title="Add subcategory">
              <Plus className="h-4 w-4" />
            </button>
          )}
          {!isSystem && onEdit && (
            <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {!isSystem && onDelete && (
            <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 rounded-lg">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform duration-200",
                expanded && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {/* Subcategories */}
      {expanded && (
        <div className="border-t border-gray-100">
          {subcategories.map(sub => (
            <div
              key={sub.id}
              className="flex items-center justify-between py-3 px-4 pl-8 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base">{sub.icon}</span>
                <span className="text-sm text-gray-700 truncate">{resolveName(sub.name)}</span>
              </div>
              {!isSystem && (
                <div className="flex items-center gap-0.5 shrink-0">
                  {onEditSub && (
                    <button
                      onClick={() => onEditSub(sub)}
                      className="p-1.5 text-gray-300 hover:text-blue-500 rounded-lg"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {onDeleteSub && (
                    <button
                      onClick={() => onDeleteSub(sub.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add subcategory row */}
          {!isSystem && onAddSub && (
            <button
              onClick={onAddSub}
              className="w-full flex items-center gap-2.5 py-3 px-4 pl-8 text-gray-400 hover:text-blue-500 hover:bg-blue-50/50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add subcategory</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
