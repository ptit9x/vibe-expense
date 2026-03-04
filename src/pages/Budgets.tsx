import { Link, useNavigate } from 'react-router-dom'
import { Globe, DollarSign, Tags, Download, ChevronRight, Lock } from 'lucide-react'
import { useLogout } from '@/hooks/useAuth'

const FEATURES = [
  { icon: Lock, label: 'Đổi mật khẩu', href: '/settings/password', color: '#6366F1', description: 'Change password' },
  { icon: Globe, label: 'Ngôn ngữ', href: '/settings/language', color: '#8B5CF6', description: 'Interface' },
  { icon: DollarSign, label: 'Thiết lập tiền tệ', href: '/settings/currency', color: '#10B981', description: 'Currency settings' },
  { icon: Tags, label: 'Danh mục', href: '/wallets', color: '#F59E0B', description: 'Income/expense categories' },
  { icon: Download, label: 'Xuất dữ liệu', href: '/settings/export', color: '#EF4444', description: 'Export data' },
]

export default function Budgets() {
  const navigate = useNavigate()
  const logout = useLogout()

  const handleLogout = async () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
      await logout.mutateAsync()
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-white">Tài khoản</h1>
          <button 
            onClick={handleLogout}
            className="px-3 py-1.5 bg-white/20 rounded-full text-white text-sm hover:bg-white/30 transition-colors"
          >
            Đăng xuất
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Richard</p>
            <p className="text-white/60 text-sm">ngochuynh1991@gmail.com</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3">
        <div className="bg-white rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-lg">🪙</span>
            </div>
            <div>
              <p className="text-gray-900 font-medium">30 coins</p>
              <p className="text-gray-400 text-xs">Tích lũy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">Mã giới thiệu:</span>
            <span className="text-gray-900 font-mono font-medium">2785880</span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-gray-500 mb-3 px-1">Cài đặt</p>
        <div className="bg-white rounded-xl divide-y divide-gray-100">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon
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
                    <p className="text-gray-900 font-medium">{feature.label}</p>
                    <p className="text-gray-400 text-xs">{feature.description}</p>
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
