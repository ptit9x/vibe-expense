import { memo } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'
import { useI18n } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import type { TransactionType } from '@/types'

interface TransactionRowProps {
  id: string
  type: TransactionType
  amount: number
  description?: string | null
  transactionDate: string
  category?: {
    name?: string | null
    icon?: string | null
    color?: string | null
  } | null
  walletName?: string | null
  toWalletName?: string | null
  /** Layout variant: compact for dashboard, default for full list */
  variant?: 'default' | 'compact'
}

function getTypeStyle(type: TransactionType): { color: string; prefix: string } {
  switch (type) {
    case 'income':
      return { color: 'text-green-600', prefix: '+' }
    case 'expense':
      return { color: 'text-red-600', prefix: '-' }
    case 'transfer':
      return { color: 'text-blue-600', prefix: '→' }
    case 'lend':
      return { color: 'text-orange-500', prefix: '-' }
    case 'borrow':
      return { color: 'text-amber-500', prefix: '+' }
    default:
      return { color: 'text-gray-600', prefix: '' }
  }
}

export const TransactionRow = memo(function TransactionRow({
  id,
  type,
  amount,
  description,
  transactionDate,
  category,
  walletName,
  toWalletName,
  variant = 'default',
}: TransactionRowProps) {
  const { currency, formatCurrency, showBalance } = useUIStore()
  const { language, t } = useI18n()
  const locale = getLocale(language)

  const isCompact = variant === 'compact'
  const dateLabel = isCompact
    ? formatRelativeDate(transactionDate, locale, t.transaction.today)
    : new Date(transactionDate).toLocaleDateString(locale)

  const { color, prefix } = getTypeStyle(type)

  return (
    <Link
      to={`/edit-transaction/${id}`}
      aria-label={`${prefix}${currency.symbol}${formatCurrency(amount)} - ${description || category?.name || type} - ${dateLabel}`}
      className={cn(
        'flex items-center justify-between transition-colors cursor-pointer',
        isCompact
          ? 'py-2.5 border-b border-gray-100 last:border-0'
          : 'p-4 rounded-3xl border-0 transition-all clay-card hover:shadow-[-4px_-4px_10px_rgba(255,255,255,0.9),4px_4px_10px_rgba(174,174,192,0.3)]'
      )}
    >
      <div className={cn('flex items-center min-w-0', isCompact ? 'gap-2.5 flex-1' : 'gap-3')}>
        <div
          className={cn(
            'rounded-xl flex items-center justify-center shrink-0 clay-icon',
            isCompact ? 'w-9 h-9 text-base' : 'w-10 h-10 text-lg'
          )}
          style={{ backgroundColor: (category?.color || '#6B7280') + (isCompact ? '15' : '20') }}
        >
          {category?.icon || '💰'}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('font-medium truncate', isCompact ? 'text-sm text-gray-800' : '')}>
            {description || (type === 'transfer' && walletName && toWalletName
              ? `${walletName} → ${toWalletName}`
              : category?.name)}
          </p>
          <p className={cn('text-muted-foreground', isCompact ? 'text-sm text-gray-400' : 'text-sm')}>
            {isCompact
              ? dateLabel
              : type === 'transfer'
                ? walletName && toWalletName
                  ? `${walletName} → ${toWalletName}`
                  : walletName || ''
                : `${category?.name || ''}${walletName ? ' • ' + walletName : ''}`
            }
          </p>
        </div>
      </div>
      <div className={cn('shrink-0', isCompact ? 'ml-2' : 'text-right')}>
        <p className={cn(
          'font-semibold',
          isCompact ? 'text-base' : 'font-bold',
          color
        )}>
          {showBalance ? (
            <>{prefix}{currency.symbol}{formatCurrency(amount)}</>
          ) : (
            <span className="text-gray-300">••••••</span>
          )}
        </p>
        {!isCompact && (
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
        )}
      </div>
    </Link>
  )
})

function formatRelativeDate(dateStr: string, locale: string, todayLabel: string): string {
  const today = new Date()
  const d = new Date(dateStr)
  if (d.toDateString() === today.toDateString()) return todayLabel
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}
