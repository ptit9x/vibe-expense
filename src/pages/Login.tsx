import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { useLogin } from "@/hooks/useAuth"
import { useI18n } from "@/lib/i18n"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useI18n()

  const login = useLogin()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error(t.auth.pleaseFillInfo)
      return
    }

    if (password.length < 6) {
      toast.error(t.auth.passwordMinLength)
      return
    }

    setIsLoading(true)

    try {
      await login.mutateAsync({ email, password })
      toast.success(t.auth.loginSuccess)
      navigate("/dashboard")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.auth.somethingWrong)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">
        {t.loginPage.welcomeBack}
      </h2>
      <p className="text-gray-500 text-sm mb-6">
        {t.loginPage.loginDescription}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 block">
            {t.auth.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full h-12 px-4 bg-gray-50 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2 block">
            {t.auth.password}
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.loginPage.enterPassword}
              className="w-full h-12 px-4 pr-12 bg-gray-50 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-label={showPassword ? t.loginPage.hidePassword : t.loginPage.showPassword}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="text-right">
          <button type="button" className="text-sm text-blue-500 hover:text-blue-600">
            {t.auth.forgotPassword}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-blue-500 text-white font-semibold text-base rounded-xl hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          {t.auth.login}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        {t.auth.dontHaveAccount}{" "}
        <Link
          to="/register"
          className="text-blue-500 font-medium hover:text-blue-600"
        >
          {t.auth.registerNow}
        </Link>
      </div>
    </>
  )
}