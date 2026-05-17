import { useQuery } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured, requireAuth } from '@/lib/supabase'

export interface MonthlyReport {
  month: string
  total_income: number
  total_expense: number
  net_balance: number
  by_category: CategoryStat[]
}

export interface CategoryStat {
  category_id: string
  category_name: string
  category_icon: string
  category_color: string
  total: number
  count: number
}

export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: ['monthlyReport', month],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockReport(month)
      }

      const user = await requireAuth()

      const { data, error } = await supabase.rpc('get_monthly_report', {
        p_user_id: user.id,
        p_month: month
      })

      if (error) throw error
      return data as MonthlyReport
    },
    staleTime: 2 * 60 * 1000, // 2 min
  })
}

export function useCategoryStats(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['categoryStats', startDate, endDate],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockCategoryStats()
      }

      const user = await requireAuth()

      const { data, error } = await supabase.rpc('get_category_stats', {
        p_user_id: user.id,
        p_start_date: startDate,
        p_end_date: endDate
      })

      if (error) throw error
      return data as CategoryStat[]
    },
    staleTime: 2 * 60 * 1000, // 2 min
  })
}

// Mock data
function getMockReport(month: string): MonthlyReport {
  return {
    month,
    total_income: 25000000,
    total_expense: 15200000,
    net_balance: 9800000,
    by_category: [
      { category_id: 'c1', category_name: 'Food', category_icon: '🍔', category_color: '#EF4444', total: 5200000, count: 26 },
      { category_id: 'c2', category_name: 'Transport', category_icon: '🚗', category_color: '#F59E0B', total: 1800000, count: 18 },
      { category_id: 'c3', category_name: 'Shopping', category_icon: '🛒', category_color: '#8B5CF6', total: 3500000, count: 8 },
      { category_id: 'c4', category_name: 'Entertainment', category_icon: '🎮', category_color: '#06B6D4', total: 1200000, count: 6 },
      { category_id: 'c5', category_name: 'Others', category_icon: '💰', category_color: '#6B7280', total: 3500000, count: 12 },
    ]
  }
}

function getMockCategoryStats(): CategoryStat[] {
  return [
    { category_id: 'c1', category_name: 'Food', category_icon: '🍔', category_color: '#EF4444', total: 5200000, count: 26 },
    { category_id: 'c2', category_name: 'Transport', category_icon: '🚗', category_color: '#F59E0B', total: 1800000, count: 18 },
    { category_id: 'c3', category_name: 'Shopping', category_icon: '🛒', category_color: '#8B5CF6', total: 3500000, count: 8 },
  ]
}