import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'
import { computeWalletBalances } from '@/lib/walletBalance'
import {
  computeHealthMetrics,
  generateLocalAnalysis,
} from '@/lib/financialHealth'

import { getMockTransactions } from '@/mocks/mockTransactions'
import { getMockWallets } from '@/mocks/mockWallets'
import type { FinancialReport, AIAnalysis, FinancialHealthMetrics, Wallet } from '@/types'
import { translations } from '@/lib/i18n/translations'
import type { Language } from '@/lib/i18n'

const REPORT_SELECT =
  'id, user_id, period_type, period_start, period_end, health_data, ai_analysis, overall_score, grade, created_at'

// ── Fetch reports list ───────────────────────────────────────────────

export function useFinancialReports() {
  return useQuery({
    queryKey: ['financialReports'],
    queryFn: async (): Promise<FinancialReport[]> => {
      if (!isSupabaseConfigured()) return getMockReports()

      const user = await requireAuth()
      const { data, error } = await supabase
        .from('financial_reports')
        .select(REPORT_SELECT)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12)

      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ── Generate report (call Edge Function or local fallback) ───────────

export function useGenerateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (opts: {
      periodType: 'weekly' | 'monthly'
      periodStart: string
      periodEnd: string
      locale?: Language
    }): Promise<FinancialReport> => {
      // Compute metrics from current data
      const transactions = isSupabaseConfigured()
        ? await fetchTransactionsForPeriod(opts.periodStart, opts.periodEnd)
        : getMockTransactions()

      // Try to reuse cached wallets from useWallets() instead of re-fetching
      const cachedWallets = queryClient.getQueryData<Wallet[]>(['wallets', false])
      const wallets = cachedWallets
        ? cachedWallets.filter(w => w.is_active)
        : isSupabaseConfigured()
          ? await fetchActiveWallets()
          : getMockWallets()

      const metrics = computeHealthMetrics({
        transactions,
        wallets,
      })

      // Try Edge Function first, fallback to local
      let aiAnalysis: AIAnalysis

      try {
        aiAnalysis = await callAnalysisEdgeFunction(metrics, opts.locale)
      } catch {
        const t = translations[opts.locale || 'vi']
        aiAnalysis = generateLocalAnalysis(metrics, t)
      }

      const report: FinancialReport = {
        id: crypto.randomUUID(),
        user_id: 'local',
        period_type: opts.periodType,
        period_start: opts.periodStart,
        period_end: opts.periodEnd,
        health_data: metrics,
        ai_analysis: aiAnalysis,
        overall_score: aiAnalysis.overall_score,
        grade: aiAnalysis.grade,
        created_at: new Date().toISOString(),
      }

      // Save to Supabase if configured
      if (isSupabaseConfigured()) {
        try {
          const user = await requireAuth()
          const { data, error } = await supabase
            .from('financial_reports')
            .upsert({
              user_id: user.id,
              period_type: opts.periodType,
              period_start: opts.periodStart,
              period_end: opts.periodEnd,
              health_data: metrics,
              ai_analysis: aiAnalysis,
              overall_score: aiAnalysis.overall_score,
              grade: aiAnalysis.grade,
            }, {
              onConflict: 'user_id,period_type,period_start',
            })
            .select(REPORT_SELECT)
            .single()

          if (error) throw error
          return data as FinancialReport
        } catch {
          // Return local report if save fails
        }
      }

      return report
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialReports'] })
      queryClient.invalidateQueries({ queryKey: ['appNotifications'] })
    },
  })
}

// ── Helpers ──────────────────────────────────────────────────────────

async function fetchTransactionsForPeriod(
  start: string,
  end: string
) {
  const user = await requireAuth()
  const { data, error } = await supabase
    .from('transactions')
    .select(
      'id, user_id, type, amount, description, transaction_date, created_at, updated_at, category_id, wallet_id, to_wallet_id, contact_person, wallet:wallets!transactions_wallet_id_fkey(id, name, icon, color), to_wallet:wallets!transactions_to_wallet_id_fkey(id, name, icon, color), category:categories(id, name, icon, color)'
    )
    .eq('user_id', user.id)
    .gte('transaction_date', start)
    .lte('transaction_date', end)
    .order('transaction_date', { ascending: false })

  if (error) throw error
  return (data || []) as unknown as import('@/types').Transaction[]
}

async function fetchActiveWallets(): Promise<Wallet[]> {
  const user = await requireAuth()
  const { data, error } = await supabase
    .from('wallets')
    .select('id, user_id, name, type, icon, color, initial_balance, is_active, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (error) throw error
  return computeWalletBalances(data || [], user.id)
}

async function callAnalysisEdgeFunction(
  metrics: FinancialHealthMetrics,
  locale?: Language
): Promise<AIAnalysis> {
  // Let supabase.functions.invoke() handle auth automatically — it refreshes
  // tokens and sets Authorization header. Manual override can send stale tokens
  // which the gateway rejects (without CORS headers → browser CORS error).
  const { data, error } = await supabase.functions.invoke(
    'analyze-financial-health',
    {
      body: { metrics, locale: locale || 'vi' },
    }
  )

  if (error) throw error
  return data as AIAnalysis
}

// ── Mock reports ─────────────────────────────────────────────────────

function getMockReports(): FinancialReport[] {
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)

  const metrics = computeHealthMetrics({
    transactions: getMockTransactions(),
    wallets: getMockWallets(),
  })

  const analysis = generateLocalAnalysis(metrics, translations.vi)

  return [
    {
      id: 'mock-1',
      user_id: 'user1',
      period_type: 'monthly',
      period_start: `${currentMonth}-01`,
      period_end: `${currentMonth}-${String(now.getDate()).padStart(2, '0')}`,
      health_data: metrics,
      ai_analysis: analysis,
      overall_score: analysis.overall_score,
      grade: analysis.grade,
      created_at: now.toISOString(),
    },
  ]
}
