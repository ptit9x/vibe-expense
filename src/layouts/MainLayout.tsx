import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/lib/i18n'
import {
  LayoutDashboard,
  Wallet,
  Plus,
  BarChart3,
  Menu,
} from 'lucide-react'

import { cn } from '@/lib/utils'

const bottomNavItems = [
  { icon: LayoutDashboard, labelKey: 'nav.home', href: '/dashboard' },
  { icon: Wallet, labelKey: 'nav.account', href: '/wallets' },
  { icon: Plus, labelKey: 'nav.add', href: '/add-transaction', isPlus: true },
  { icon: BarChart3, labelKey: 'nav.report', href: '/reports' },
  { icon: Menu, labelKey: 'nav.profile', href: '/profile' },
]

export default function MainLayout() {
  const location = useLocation()
  const { data: user, isLoading } = useAuth()
  const { t } = useI18n()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!user.confirmed) {
    return <Navigate to="/verify-email" replace />
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Content area with sidebar offset on desktop */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <main className="flex-1 overflow-y-auto pb-20 max-w-3xl">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-white lg:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            const Icon = item.icon

            if (item.isPlus) {
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="relative -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
                >
                  <Icon className="h-7 w-7 text-primary-foreground" />
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-zinc-500 hover:text-zinc-900"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold"
                )}>
                  {t.nav[item.labelKey.split('.')[1] as keyof typeof t.nav]}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      <DesktopSidebar />
    </div>
  )
}

function DesktopSidebar() {
  const location = useLocation()
  const { t } = useI18n()

  return (
    <aside className="hidden lg:flex shrink-0 fixed left-0 top-0 h-full w-60 flex-col border-r bg-white z-40">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold">💰 Money Keeper</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.nav[item.labelKey.split('.')[1] as keyof typeof t.nav]}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
