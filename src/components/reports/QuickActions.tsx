import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import {
  Receipt,
  PiggyBank,
} from 'lucide-react'

interface QuickActionsProps {
  items?: typeof defaultItems
}

const defaultItems = [
  { icon: Receipt, labelKey: 'reports.expenseReport', href: '/reports/expense', color: '#EF4444' },
  { icon: PiggyBank, labelKey: 'reports.incomeReport', href: '/reports/income', color: '#10B981' },
]

export function QuickActions({ items = defaultItems }: QuickActionsProps) {
  const { t } = useI18n()

  return (
    <div className="px-4 py-4">
      <p className="text-sm font-medium text-gray-900 mb-3">{t.reports.reports}</p>
      
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <Link
              key={index}
              to={item.href}
              className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: item.color + '15' }}
              >
                <Icon 
                  className="h-5 w-5" 
                  style={{ color: item.color }}
                />
              </div>
              <span className="text-xs text-gray-700 text-center leading-tight">
                {t.reports[item.labelKey.split('.')[1] as keyof typeof t.reports]}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
