import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { supabase, isSupabaseConfigured, isMockAuthAllowed } from '@/lib/supabase'
import type { AuthUser, LoginInput, RegisterInput } from '@/types'

// Mock users only loaded in development — tree-shaken from production builds
const getMockUsers = (): Record<string, { id: string; email: string; password: string; full_name: string }> => ({
  'dev@example.com': { id: 'dev-user', email: 'dev@example.com', password: 'password', full_name: 'Dev User' },
})

export function useAuth() {
  return useQuery({
    queryKey: ['auth'],
    queryFn: async (): Promise<AuthUser | null> => {
      if (isSupabaseConfigured()) {
        try {
          const { data: { user }, error } = await supabase.auth.getUser()
          if (error || !user) return null

          // Check if email is confirmed
          const emailConfirmed = !!user.email_confirmed_at || !!user.confirmed_at

          return {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || null,
            confirmed: emailConfirmed,
          }
        } catch {
          console.warn('Supabase auth failed, using mock auth')
        }
      }

      // Fallback to mock auth from localStorage (dev only)
      if (!isMockAuthAllowed()) return null

      const token = localStorage.getItem('token')
      // eslint-disable-next-line security/detect-possible-timing-attacks
      if (token === 'mock-jwt-token') {
        return {
          id: 'dev-user',
          email: 'dev@example.com',
          full_name: 'Dev User',
          confirmed: true,
        }
      }
      return null
    },
    staleTime: 1000 * 60 * 5,
  })
}

// Listen to Supabase auth state changes for realtime session sync
export function useAuthListener() {
  const queryClient = useQueryClient()
  const subscriptionRef = useRef<ReturnType<typeof supabase.auth.onAuthStateChange>['data'] | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        queryClient.invalidateQueries({ queryKey: ['auth'] })
      }
    })

    subscriptionRef.current = { subscription }

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient])
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password }: LoginInput): Promise<AuthUser> => {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        const emailConfirmed = !!data.user?.email_confirmed_at || !!data.user?.confirmed_at

        // Login successful

        return {
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || null,
          confirmed: emailConfirmed,
        }
      }

      // Mock login for development only
      if (!isMockAuthAllowed()) {
        throw new Error('Authentication service unavailable')
      }

      const mockUser = getMockUsers()[email as string]
      if (mockUser && mockUser.password === password) {
        localStorage.setItem('token', 'mock-jwt-token')
        return {
          id: mockUser.id,
          email: mockUser.email,
          full_name: mockUser.full_name,
          confirmed: true,
        }
      }
      throw new Error('Email hoặc mật khẩu không đúng')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password, full_name }: RegisterInput): Promise<AuthUser> => {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name },
          },
        })

        if (error) throw error
        if (!data.user) throw new Error('Registration failed')

        // Profile and default wallet are created by DB triggers on auth.users insert
        // No manual API calls needed here

        return {
          id: data.user.id,
          email: data.user.email || '',
          full_name: full_name,
          confirmed: false, // Registration doesn't auto-confirm email
        }
      }

      // Mock register for development only
      if (!isMockAuthAllowed()) {
        throw new Error('Authentication service unavailable')
      }

      const mockUser: AuthUser = {
        id: crypto.randomUUID(),
        email,
        full_name,
        confirmed: true, // Mock always confirmed
      }
      localStorage.setItem('token', 'mock-jwt-token')
      return mockUser
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      }
      localStorage.removeItem('token')
    },
    onSuccess: () => {
      localStorage.removeItem('token')
      queryClient.clear()
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: { currency?: string; full_name?: string }) => {
      if (!isSupabaseConfigured()) {
        return { success: true }
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}
