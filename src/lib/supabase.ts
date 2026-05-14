import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// SECURITY NOTE: Supabase anon key is public (embedded in client bundle by design).
// All data protection MUST rely on Row Level Security (RLS) policies on Supabase.
// Ensure every table has RLS enabled with policies like:
//   CREATE POLICY "Users can only see own data" ON table_name
//     FOR ALL USING (auth.uid() = user_id);
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
  // Production must always use real Supabase — never allow mock fallback
  if (import.meta.env.PROD) return true
  if (!supabaseUrl || !supabaseAnonKey) return false
  return !supabaseUrl.includes('placeholder') && !supabaseAnonKey.includes('placeholder')
}

// Whether mock auth fallback is allowed (development only)
export const isMockAuthAllowed = () => {
  return !import.meta.env.PROD && !isSupabaseConfigured()
}

// Get current authenticated user ID from auth.users
export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return 'dev-user' // mock user for development
  }

  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

// Require authenticated user — throws if not logged in
// Use this in every mutation/query that needs auth
export async function requireAuth() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}