import { useMutation } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'

export interface FeedbackInput {
  content: string
}

/**
 * Submit in-app feedback (replaces the old Google Form link on Profile).
 * Insert-only: no read-back, no updates — feedback is immutable.
 */
export function useSubmitFeedback() {
  return useMutation({
    mutationFn: async ({ content }: FeedbackInput) => {
      // Dev fallback without Supabase config: simulate success
      if (!isSupabaseConfigured()) {
        await new Promise((r) => setTimeout(r, 400))
        return { ok: true }
      }
      const user = await requireAuth()
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          content: content.trim(),
          user_agent: navigator.userAgent,
        })
      if (error) throw error
      return { ok: true }
    },
  })
}
