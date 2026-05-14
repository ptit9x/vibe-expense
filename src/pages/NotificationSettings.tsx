import { Bell, BellOff, Clock, Wallet, HandCoins } from 'lucide-react'
import { useNotificationSettings, useUpdateNotificationSettings, useTogglePush, usePushPermission } from '@/hooks/useNotifications'
import { isNotificationSupported } from '@/lib/notifications'
import { toast } from 'sonner'
import PageHeader from '@/components/PageHeader'

export default function NotificationSettings() {
  const { data: settings, isLoading } = useNotificationSettings()
  const updateSettings = useUpdateNotificationSettings()
  const togglePush = useTogglePush()
  const { data: permission } = usePushPermission()

  const supported = isNotificationSupported()

  const handleTogglePush = async (enabled: boolean) => {
    try {
      await togglePush.mutateAsync(enabled)
      toast.success(enabled ? 'Đã bật thông báo' : 'Đã tắt thông báo')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi')
    }
  }

  const handleToggleSetting = (key: 'daily_reminder' | 'budget_alert' | 'debt_reminder', value: boolean) => {
    updateSettings.mutate({ [key]: value })
  }

  const handleTimeChange = (time: string) => {
    updateSettings.mutate({ reminder_time: time })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader>
        <h1 className="text-xl font-semibold text-white">🔔 Thông báo</h1>
      </PageHeader>

      <div className="px-4 py-3 space-y-3">
        {/* Push Notification Toggle */}
        <div className="bg-white rounded-xl p-4">
          {!supported ? (
            <div className="flex items-center gap-3 text-gray-400">
              <BellOff className="h-5 w-5" />
              <div>
                <p className="font-medium text-gray-500">Trình duyệt không hỗ trợ</p>
                <p className="text-sm">Hãy cài app lên điện thoại để nhận thông báo</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Push Notification</p>
                  <p className="text-sm text-gray-400">
                    {permission === 'granted'
                      ? settings?.push_enabled ? 'Đang bật' : 'Đang tắt'
                      : permission === 'denied' ? 'Đã bị chặn — kiểm tra cài đặt trình duyệt'
                      : 'Chưa cấp quyền'}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                checked={settings?.push_enabled === true && permission === 'granted'}
                onChange={handleTogglePush}
                disabled={togglePush.isPending}
              />
            </div>
          )}
        </div>

        {/* Notification Types */}
        <div className="bg-white rounded-xl divide-y divide-gray-100">
          <SettingRow
            icon={<Clock className="h-5 w-5 text-green-500" />}
            iconBg="bg-green-50"
            title="Nhắc nhở hàng ngày"
            description={`Nhắc nhập giao dịch lúc ${settings?.reminder_time || '20:00'}`}
            checked={settings?.daily_reminder ?? true}
            onChange={(v) => handleToggleSetting('daily_reminder', v)}
            disabled={!settings?.push_enabled}
          />
          <SettingRow
            icon={<Wallet className="h-5 w-5 text-orange-500" />}
            iconBg="bg-orange-50"
            title="Cảnh báo ngân sách"
            description="Khi chi tiêu đạt 80% ngân sách"
            checked={settings?.budget_alert ?? true}
            onChange={(v) => handleToggleSetting('budget_alert', v)}
            disabled={!settings?.push_enabled}
          />
          <SettingRow
            icon={<HandCoins className="h-5 w-5 text-purple-500" />}
            iconBg="bg-purple-50"
            title="Nhắc vay nợ"
            description="Nhắc thu nợ và trả nợ"
            checked={settings?.debt_reminder ?? true}
            onChange={(v) => handleToggleSetting('debt_reminder', v)}
            disabled={!settings?.push_enabled}
          />
        </div>

        {/* Reminder Time */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Giờ nhắc nhở</p>
              <p className="text-sm text-gray-400">Thời gian nhận thông báo hàng ngày</p>
            </div>
            <input
              type="time"
              value={settings?.reminder_time || '20:00'}
              onChange={(e) => handleTimeChange(e.target.value)}
              disabled={!settings?.push_enabled}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-600">
            💡 <strong>Mẹo:</strong> Cài app lên màn hình chính (Add to Home Screen) để nhận thông báo tốt nhất. Trên iPhone, mở Safari → chia sẻ → Thêm vào MH chính.
          </p>
        </div>
      </div>
    </div>
  )
}

function SettingRow({
  icon,
  iconBg,
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className={`flex items-center justify-between p-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  )
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:cursor-not-allowed ${
        checked ? 'bg-blue-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
