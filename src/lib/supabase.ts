import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'supabase-auth-token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
  },
})

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !supabaseUrl.includes('placeholder') && !supabaseAnonKey.includes('placeholder')
}

// Get current authenticated user ID from auth.users
export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return 'dev-user' // mock user for development
  }

  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}