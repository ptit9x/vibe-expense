import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'

interface TransactionRowProps {
  id: string
  type: 'income' | 'expense'
  amount: number
  description?: string | null
  transactionDate: string
  category?: {
    name?: string | null
    icon?: string | null
    color?: string | null
  } | null
  walletName?: string | null
  /** Layout variant: compact for dashboard, default for full list */
  variant?: 'default' | 'compact'
}

export function TransactionRow({
  id,
  type,
  amount,
  description,
  transactionDate,
  category,
  walletName,
  variant = 'default',
}: TransactionRowProps) {
  const { currency, formatCurrency } = useUIStore()

  const isCompact = variant === 'compact'
  const dateLabel = isCompact
    ? formatRelativeDate(transactionDate)
    : new Date(transactionDate).toLocaleDateString('vi-VN')

  return (
    <Link
      to={`/edit-transaction/${id}`}
      className={cn(
        'flex items-center justify-between transition-colors cursor-pointer',
        isCompact
          ? 'py-2.5 border-b border-gray-100 last:border-0'
          : 'p-3 rounded-lg border hover:bg-muted/50'
      )}
    >
      <div className={cn('flex items-center min-w-0', isCompact ? 'gap-2.5 flex-1' : 'gap-3')}>
        <div
          className={cn(
            'rounded-full flex items-center justify-center shrink-0',
            isCompact ? 'w-9 h-9 text-base' : 'w-10 h-10 text-lg'
          )}
          style={{ backgroundColor: (category?.color || '#6B7280') + (isCompact ? '15' : '20') }}
        >
          {category?.icon || '💰'}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('font-medium truncate', isCompact ? 'text-sm text-gray-800' : '')}>
            {description || category?.name}
          </p>
          <p className={cn('text-muted-foreground', isCompact ? 'text-xs text-gray-400' : 'text-sm')}>
            {isCompact
              ? dateLabel
              : `${category?.name || ''}${walletName ? ' • ' + walletName : ''}`
            }
          </p>
        </div>
      </div>
      <div className={cn('shrink-0', isCompact ? 'ml-2' : 'text-right')}>
        <p className={cn(
          'font-semibold',
          isCompact ? 'text-sm' : 'font-bold',
          type === 'income' ? 'text-green-600' : 'text-red-600'
        )}>
          {type === 'income' ? '+' : '-'}
          {currency.symbol}{formatCurrency(amount)}
        </p>
        {!isCompact && (
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
        )}
      </div>
    </Link>
  )
}

function formatRelativeDate(dateStr: string): string {
  const today = new Date()
  const d = new Date(dateStr)
  if (d.toDateString() === today.toDateString()) return 'Hôm nay'
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
}
