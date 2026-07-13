import { useQuery } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

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
  /** Present in get_category_stats RPC; absent in get_monthly_report.by_category */
  transaction_type?: string
  /** get_monthly_report uses 'total' */
  total: number
  /** get_category_stats uses 'total_amount' */
  total_amount?: number
  /** get_monthly_report uses 'count' */
  count: number
  /** get_category_stats uses 'transaction_count' */
  transaction_count?: number
}

export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: ['monthlyReport', month],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return getMockReport(month)
      }

      const { data, error } = await supabase.rpc('get_monthly_report', {
        p_month: month
      })

      if (error) throw error
      return data as MonthlyReport
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
      { category_id: 'c1', category_name: 'Ăn uống', category_icon: '🍔', category_color: '#EF4444', total: 5200000, count: 26 },
      { category_id: 'c2', category_name: 'Di chuyển', category_icon: '🚗', category_color: '#F59E0B', total: 1800000, count: 18 },
      { category_id: 'c3', category_name: 'Mua sắm', category_icon: '🛒', category_color: '#8B5CF6', total: 3500000, count: 8 },
      { category_id: 'c4', category_name: 'Giải trí', category_icon: '🎮', category_color: '#06B6D4', total: 1200000, count: 6 },
      { category_id: 'c5', category_name: 'Khác', category_icon: '💰', category_color: '#6B7280', total: 3500000, count: 12 },
    ]
  }
}
