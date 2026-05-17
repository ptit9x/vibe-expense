import { Link, useNavigate } from 'react-router-dom'
import { Globe, DollarSign, Tags, Download, ChevronRight, Lock, MessageSquare, Bell, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLogout } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { useTheme } from '@/components/theme-provider'
import PageHeader from '@/components/PageHeader'

const FEATURES = [
  { icon: Lock, labelKey: 'settings.password', href: '/settings/password', color: '#6366F1' },
  { icon: Globe, labelKey: 'settings.language', href: '/settings/language', color: '#8B5CF6' },
  { icon: DollarSign, labelKey: 'settings.currency', href: '/settings/currency', color: '#10B981' },
  { icon: Tags, labelKey: 'settings.categories', href: '/categories', color: '#F59E0B' },
  { icon: Download, labelKey: 'settings.export', href: '/settings/export', color: '#EF4444' },
  { icon: Bell, labelKey: 'settings.notifications', href: '/settings/notifications', color: '#06B6D4' },
]

const FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScy98U6vpghurp-dkv5jKOnGlyUm3OkC05UoL82rSL17Biurg/viewform'

import { PageTransition } from '@/components/shared'

export default function Profile() {
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const logout = useLogout()
  const { t } = useI18n()
  const { resolvedMode, toggleMode } = useTheme()

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
      toast.success(t.auth.logoutSuccess)
      navigate('/login')
    } catch {
      toast.error(t.common.error)
    }
  }

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User'
  const displayEmail = user?.email || ''

  return (
    <PageTransition>
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-white">{t.settings.settings}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500">
            <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{displayName}</p>
            <p className="text-white/60 text-sm">{displayEmail}</p>
          </div>
        </div>
      </PageHeader>

      <div className="px-4 py-3">
        <p className="text-sm font-medium text-gray-500 mb-3 px-1">{t.settings.settings}</p>
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-100">
          {/* Dark mode toggle — first item */}
          <button
            onClick={toggleMode}
            className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-all"
            aria-label={resolvedMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#F59E0B15' }}
              >
                {resolvedMode === 'dark' ? (
                  <Sun className="h-5 w-5" style={{ color: '#F59E0B' }} />
                ) : (
                  <Moon className="h-5 w-5" style={{ color: '#F59E0B' }} />
                )}
              </div>
              <div className="text-left">
                <p className="text-gray-900 font-medium">
                  {resolvedMode === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>

          {FEATURES.map((feature, index) => {
            const Icon = feature.icon
            const label = t.settings[feature.labelKey.split('.')[1] as keyof typeof t.settings] as string

            return (
              <Link
                key={index}
                to={feature.href}
                className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: feature.color + '15' }}
                  >
                    <Icon className="h-5 w-5" style={{ color: feature.color }} />
                  </div>
                  <div className="text-left">
                    <p className="text-gray-900 font-medium">{label}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            )
          })}

          {/* Feedback */}
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-pink-50">
                <MessageSquare className="h-5 w-5 text-pink-500" />
              </div>
              <div className="text-left">
                <p className="text-gray-900 font-medium">{t.settings.feedback}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </a>
        </div>

        {/* Logout — separate danger card */}
        <div className="mt-3 bg-white rounded-2xl shadow-sm">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-3.5 text-red-500 font-medium hover:bg-red-50 rounded-2xl transition-all"
          >
            {t.auth.logout}
          </button>
        </div>
      </div>
    </div>
    </PageTransition>
  )
}
