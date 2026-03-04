import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function PasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setMessage('Mật khẩu mới không khớp')
      return
    }
    
    if (newPassword.length < 6) {
      setMessage('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }
    
    setIsLoading(true)
    setMessage('')
    
    setTimeout(() => {
      setIsLoading(false)
      setMessage('Đổi mật khẩu thành công!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-b from-blue-500 to-blue-600 px-5 pt-4 pb-6">
        <h1 className="text-xl font-semibold text-white">Đổi mật khẩu</h1>
      </div>
      
      <div className="bg-white mt-2 px-5 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 block">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-12 pr-10"
                placeholder="Nhập mật khẩu hiện tại"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 block">
              Mật khẩu mới
            </label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 pr-10"
                placeholder="Nhập mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 block">
              Xác nhận mật khẩu mới
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>
          
          {message && (
            <p className={`text-sm ${message.includes('thành công') ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </p>
          )}
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-base font-medium"
          >
            {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </Button>
        </form>
      </div>
    </div>
  )
}
