import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Wallet,
  Plus,
  BarChart3,
  Menu,
} from 'lucide-react'

import { cn } from '@/lib/utils'

const bottomNavItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
  { icon: Wallet, label: 'Account', href: '/wallets' },
  { icon: Plus, label: 'Add', href: '/add-transaction', isPlus: true },
  { icon: BarChart3, label: 'Report', href: '/reports' },
  { icon: Menu, label: 'Khác', href: '/budgets' },
]

export default function MainLayout() {
  const location = useLocation()
  const { data: user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50/50 dark:bg-zinc-950">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-white dark:bg-zinc-950 lg:hidden">
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
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Sidebar - Hidden on mobile */}
      <DesktopSidebar />
    </div>
  )
}

function DesktopSidebar() {
  const location = useLocation()

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Wallet, label: 'Account', href: '/wallets' },
    { icon: BarChart3, label: 'Report', href: '/reports' },
  ]

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col border-r bg-white dark:bg-zinc-950">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold">💰 Money Keeper</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
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
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}