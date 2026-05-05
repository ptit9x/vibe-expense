import { Link, useNavigate } from 'react-router-dom'
import { Globe, DollarSign, Tags, Download, ChevronRight, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLogout } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'

const FEATURES = [
  { icon: Lock, labelKey: 'settings.password', href: '/settings/password', color: '#6366F1' },
  { icon: Globe, labelKey: 'settings.language', href: '/settings/language', color: '#8B5CF6' },
  { icon: DollarSign, labelKey: 'settings.currency', href: '/settings/currency', color: '#10B981' },
  { icon: Tags, labelKey: 'settings.categories', href: '/categories', color: '#F59E0B' },
  { icon: Download, labelKey: 'settings.export', href: '/settings/export', color: '#EF4444' },
]

export default function Budgets() {
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const logout = useLogout()
  const { t } = useI18n()

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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-white">{t.settings.settings}</h1>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-white/20 rounded-full text-white text-sm hover:bg-white/30 transition-colors"
          >
            {t.auth.logout}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{displayName}</p>
            <p className="text-white/60 text-sm">{displayEmail}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="bg-white rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-lg">🪙</span>
            </div>
            <div>
              <p className="text-gray-900 font-medium">30 coins</p>
              <p className="text-gray-400 text-xs">Accumulated</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">Referral code:</span>
            <span className="text-gray-900 font-mono font-medium">2785880</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="text-sm font-medium text-gray-500 mb-3 px-1">{t.settings.settings}</p>
        <div className="bg-white rounded-xl divide-y divide-gray-100">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon
            const label = t.settings[feature.labelKey.split('.')[1] as keyof typeof t.settings] as string

            return (
              <Link
                key={index}
                to={feature.href}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: feature.color + '15' }}
                  >
                    <Icon className="h-5 w-5" style={{ color: feature.color }} />
                  </div>
                  <div className="text-left">
                    <p className="text-gray-900 font-medium">{label}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
