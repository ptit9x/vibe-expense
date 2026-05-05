import { useState } from 'react'
import { ChevronLeft, ChevronDown, Plus, Pencil, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCategories, useDeleteCategoryOverride, useUpdateCategoryOverride, useCreateCategory } from '@/hooks/useCategories'
import { useI18n } from '@/lib/i18n'
import type { Category } from '@/types'
import { toast } from 'sonner'
import { BottomSheet, BottomSheetFormField, IconPicker, ColorPicker, Input } from '@/components/ui/bottom-sheet'
import { cn } from '@/lib/utils'

// Predefined icons and colors for category picker
const ICON_OPTIONS = ['🍔', '🚗', '🏠', '🎮', '🛒', '💊', '📦', '💰', '🎁', '📈', '☕', '🎵', '📚', '🏋️', '🛠️', '💼']
const COLOR_OPTIONS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#95A5A6', '#2ECC71', '#9B59B6', '#3498DB']

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
    setModalMode('add')
    setShowModal(true)
  }

  const openEditModal = (cat: Category) => {
    setFormName(getCategoryDisplayName(cat.name))
    setFormIcon(cat.icon || '📦')
    setFormColor(cat.color || '#95A5A6')
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
      parent_id: editingCategory?.parent_id || undefined,
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

  const handleDeleteSubcategory = (subId: string) => {
    if (confirm('Delete this subcategory?')) {
      deleteOverride.mutate(subId, {
        onSuccess: () => toast.success('Category deleted'),
        onError: () => toast.error('Failed to delete category'),
      })
    }
  }

  const handleResetSubcategory = (subId: string) => {
    deleteOverride.mutate(subId, {
      onSuccess: () => toast.success('Category reset to default'),
      onError: () => toast.error('Failed to reset category'),
    })
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
                  <UserCategoryCard
                    key={cat.id}
                    category={cat}
                    subcategories={children}
                    onEdit={() => openEditModal(cat)}
                    onDelete={() => {
                      if (confirm('Delete this category?')) {
                        deleteOverride.mutate(cat.id, {
                          onSuccess: () => toast.success('Category deleted'),
                          onError: () => toast.error('Failed to delete category'),
                        })
                      }
                    }}
                    onEditSub={openEditModal}
                    onDeleteSub={handleDeleteSubcategory}
                    resolveName={getCategoryDisplayName}
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
                const catWithMeta = cat as Category & { is_customized?: boolean }
                return (
                  <SystemCategoryCard
                    key={cat.id}
                    category={catWithMeta}
                    subcategories={children}
                    resolveName={getCategoryDisplayName}
                    onEdit={() => openEditModal(cat)}
                    onReset={() => {
                      deleteOverride.mutate(cat.id, {
                        onSuccess: () => toast.success('Category reset to default'),
                        onError: () => toast.error('Failed to reset category'),
                      })
                    }}
                    onEditSub={openEditModal}
                    onResetSub={handleResetSubcategory}
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
          <ColorPicker value={formColor} onChange={setFormColor} options={COLOR_OPTIONS} />
        </BottomSheetFormField>
      </BottomSheet>
    </div>
  )
}

interface UserCategoryCardProps {
  category: Category
  subcategories: Category[]
  onEdit: () => void
  onDelete: () => void
  onEditSub: (sub: Category) => void
  onDeleteSub: (subId: string) => void
  resolveName: (name: string | null | undefined) => string
}

function UserCategoryCard({ category, subcategories, onEdit, onDelete, onEditSub, onDeleteSub, resolveName }: UserCategoryCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: (category.color || '#6B7280') + '20' }}
          >
            {category.icon}
          </div>
          <span className="font-medium text-gray-900">{resolveName(category.name)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-500">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
          {subcategories.length > 0 && (
            <button onClick={() => setExpanded(!expanded)} className="p-1">
              <ChevronDown className={cn("h-5 w-5 text-gray-400 transition-transform", expanded && "rotate-180")} />
            </button>
          )}
        </div>
      </div>

      {expanded && subcategories.length > 0 && (
        <div className="px-4 pb-4 pt-0">
          <div className="border-t border-gray-100 pt-3 space-y-2">
            {subcategories.map(sub => (
              <div key={sub.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>{sub.icon}</span>
                  <span className="text-gray-600 text-sm">{resolveName(sub.name)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditSub(sub)}
                    className="p-1.5 text-gray-400 hover:text-blue-500"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {!sub.is_system && (
                    <button
                      onClick={() => onDeleteSub(sub.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface SystemCategoryCardProps {
  category: Category & { is_customized?: boolean }
  subcategories: Category[]
  resolveName: (name: string | null | undefined) => string
  onEdit: () => void
  onReset: () => void
  onEditSub: (sub: Category) => void
  onResetSub: (subId: string) => void
}

function SystemCategoryCard({ category, subcategories, resolveName, onEdit, onReset, onEditSub, onResetSub }: SystemCategoryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isCustomized = !!(category as any).is_customized

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ backgroundColor: (category.color || '#6B7280') + '20' }}
          >
            {category.icon}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{resolveName(category.name)}</span>
              {isCustomized && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full">Customized</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-500">
            <Pencil className="h-4 w-4" />
          </button>
          {isCustomized && (
            <button onClick={onReset} className="p-2 text-gray-400 hover:text-blue-500" title="Reset to default">
              <X className="h-4 w-4" />
            </button>
          )}
          {subcategories.length > 0 && (
            <button onClick={() => setExpanded(!expanded)} className="p-1">
              <ChevronDown className={cn("h-5 w-5 text-gray-400 transition-transform", expanded && "rotate-180")} />
            </button>
          )}
        </div>
      </div>

      {expanded && subcategories.length > 0 && (
        <div className="px-4 pb-4 pt-0">
          <div className="border-t border-gray-100 pt-3 space-y-2">
            {subcategories.map(sub => (
              <div key={sub.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>{sub.icon}</span>
                  <span className="text-gray-600 text-sm">{resolveName(sub.name)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditSub(sub)}
                    className="p-1.5 text-gray-400 hover:text-blue-500"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {isCustomized && (
                    <button
                      onClick={() => onResetSub(sub.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-500"
                      title="Reset to default"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}