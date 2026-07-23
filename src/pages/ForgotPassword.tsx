import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Mail } from "lucide-react"
import { toast } from "sonner"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useI18n } from "@/lib/i18n"

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { t } = useI18n()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error(t.auth.pleaseFillInfo)
      return
    }

    setIsLoading(true)

    try {
      if (isSupabaseConfigured()) {
        const redirectTo = `${window.location.origin}/reset-password`
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        })
        if (error) throw error
      }

      setEmailSent(true)
      toast.success(t.forgotPassword.emailSent)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.auth.somethingWrong)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {t.forgotPassword.title}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        {t.forgotPassword.description}
      </p>

      {emailSent ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t.forgotPassword.checkYourEmail}
          </h3>
          <p className="text-sm text-gray-500 mb-1">
            {t.forgotPassword.sentTo} <span className="font-medium text-gray-700">{email}</span>
          </p>
          <p className="text-xs text-gray-400 mt-4">
            {t.forgotPassword.spamTip}
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-6 w-full h-12 bg-blue-500 text-white font-semibold text-base rounded-xl hover:bg-blue-600 transition-colors"
          >
            {t.auth.login}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-2 block">
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-blue-500 text-white font-semibold text-base rounded-xl hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
            {t.forgotPassword.sendResetLink}
          </button>
        </form>
      )}
    </>
  )
}
