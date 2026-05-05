import { Outlet, Link, useLocation, Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useI18n } from "@/lib/i18n"

export default function AuthLayout() {
  const location = useLocation()
  const { data: user, isLoading } = useAuth()
  const isLogin = location.pathname === "/login"
  const { t } = useI18n()

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    )
  }

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{t.app.appName}</h1>
          <Link 
            to={isLogin ? "/register" : "/login"}
            className="text-white/80 text-sm font-medium hover:text-white"
          >
            {isLogin ? t.auth.register : t.auth.login}
          </Link>
        </div>
      </div>

      {/* Form Container */}
      <div className="flex-1 bg-white rounded-t-3xl px-5 py-6">
        <Outlet />
      </div>
    </div>
  )
}