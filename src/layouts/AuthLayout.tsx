import { Outlet, Link, useLocation, Navigate } from "react-router-dom"
import { Wallet } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useI18n } from "@/lib/i18n"

export default function AuthLayout() {
  const location = useLocation()
  const { data: user, isLoading } = useAuth()
  const pathname = location.pathname
  const isLogin = pathname === "/login"
  const isRegister = pathname === "/register"
  const isForgot = pathname === "/forgot-password"
  const isReset = pathname === "/reset-password"
  const { t } = useI18n()

  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    )
  }

  // If user is already logged in AND confirmed, redirect to dashboard
  // Unconfirmed users should still be able to access login/register pages
  // Forgot/reset password pages should remain accessible regardless
  if (user && user.confirmed && !isForgot && !isReset) {
    return <Navigate to="/dashboard" replace />
  }

  // Determine subtitle based on page
  const getSubtitle = () => {
    if (isLogin) return t.loginPage.welcomeBack
    if (isRegister) return t.registerPage.createAccount
    if (isForgot) return t.forgotPassword.description
    if (isReset) return t.resetPassword.description
    return ""
  }

  // Determine footer content based on page
  const renderFooter = () => {
    if (isForgot || isReset) {
      return (
        <div className="mt-6 text-center text-sm">
          <Link
            to="/login"
            className="text-white font-medium hover:text-white/90 underline underline-offset-2"
          >
            {t.forgotPassword.backToLogin}
          </Link>
        </div>
      )
    }
    return (
      <div className="mt-6 text-center text-sm">
        <span className="text-white/70">
          {isLogin ? t.auth.dontHaveAccount : t.auth.alreadyHaveAccount}
        </span>{" "}
        <Link
          to={isLogin ? "/register" : "/login"}
          className="text-white font-medium hover:text-white/90 underline underline-offset-2"
        >
          {isLogin ? t.auth.registerNow : t.auth.login}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md">
        {/* Branding - visible on all screens */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t.app.appName}</h1>
          </div>
          <p className="text-white/70 text-sm hidden md:block">
            {getSubtitle()}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl md:shadow-xl px-6 py-8 md:px-8 md:py-10">
          <Outlet />
        </div>

        {/* Footer */}
        {renderFooter()}
      </div>
    </div>
  )
}
