import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Globe, DollarSign, Tags, Download, ChevronRight, Lock, MessageSquare, Bell, Sun, Moon, Camera } from 'lucide-react'
import { useAuth, useLogout, useUpdateProfile } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n'
import { useTheme } from '@/components/theme-provider'
import PageHeader from '@/components/PageHeader'
import { Avatar } from '@/components/shared'
import { useUploadAvatar } from '@/hooks/useAvatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'


const FEATURES = [
  { icon: Lock, labelKey: 'settings.password', href: '/settings/password', color: '#6366F1' },
  { icon: Globe, labelKey: 'settings.language', href: '/settings/language', color: '#8B5CF6' },
  { icon: DollarSign, labelKey: 'settings.currency', href: '/settings/currency', color: '#10B981' },
  { icon: Tags, labelKey: 'settings.categories', href: '/categories', color: '#F59E0B' },
  { icon: Download, labelKey: 'settings.export', href: '/settings/export', color: '#EF4444' },
  { icon: Bell, labelKey: 'settings.notifications', href: '/notifications', color: '#06B6D4' },
]

const FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScy98U6vpghurp-dkv5jKOnGlyUm3OkC05UoL82rSL17Biurg/viewform'

import { PageTransition } from '@/components/shared'

export default function Profile() {
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const logout = useLogout()
  const updateProfile = useUpdateProfile()
  const { t } = useI18n()
  const { resolvedMode, toggleMode } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadAvatar = useUploadAvatar()

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [profileName, setProfileName] = useState('')

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
      toast.success(t.auth.logoutSuccess)
      navigate('/login')
    } catch {
      toast.error(t.common.error)
    }
  }

  const openProfileDialog = () => {
    setProfileName(user?.full_name || '')
    setIsProfileDialogOpen(true)
  }

  const saveProfile = async () => {
    const trimmed = profileName.trim()
    if (!trimmed) {
      setIsProfileDialogOpen(false)
      return
    }
    try {
      await updateProfile.mutateAsync({ full_name: trimmed })
      toast.success(t.settings.profileUpdated || 'Cập nhật thông tin thành công')
      setIsProfileDialogOpen(false)
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
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
            aria-label="Change avatar"
          >
            <Avatar src={user?.avatar_url} name={displayName} size="md" />
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                if (file.size > 2 * 1024 * 1024) {
                  toast.error(t.settings.avatarTooLarge || 'File quá lớn. Tối đa 2MB.')
                  return
                }
                uploadAvatar.mutate(file, {
                  onSuccess: () => toast.success(t.settings.avatarUpdated || 'Cập nhật avatar thành công'),
                  onError: () => toast.error(t.common.error),
                })
                e.target.value = ''
              }}
            />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-white truncate">{displayName}</p>
                <button
                  onClick={openProfileDialog}
                  className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                  aria-label="Edit profile"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
              <p className="text-white/60 text-sm truncate">{displayEmail}</p>
            </div>
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
                  {resolvedMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
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

      {/* Profile Edit Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t.settings.editProfile || 'Chỉnh sửa thông tin'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar src={user?.avatar_url} name={profileName || displayName} size="lg" />
            <div className="w-full space-y-2">
              <label className="text-sm font-medium text-gray-700">{t.settings.fullName || 'Họ và tên'}</label>
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveProfile()
                }}
                placeholder={t.settings.fullName || 'Nhập họ và tên'}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)}>
              {t.common.cancel || 'Hủy'}
            </Button>
            <Button onClick={saveProfile} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (t.common.loading || 'Đang tải...') : (t.settings.updateProfile || 'Cập nhật')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for avatar upload in dialog */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          if (file.size > 2 * 1024 * 1024) {
            toast.error(t.settings.avatarTooLarge || 'File quá lớn. Tối đa 2MB.')
            return
          }
          uploadAvatar.mutate(file, {
            onSuccess: () => toast.success(t.settings.avatarUpdated || 'Cập nhật avatar thành công'),
            onError: () => toast.error(t.common.error),
          })
          e.target.value = ''
          setIsProfileDialogOpen(false)
        }}
      />
    </div>
    </PageTransition>
  )
}