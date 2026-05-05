import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { AuthUser, LoginInput, RegisterInput } from '@/types'
import { seedUserCategories } from '@/hooks/useCategories'

const MOCK_USERS = {
  'dev@example.com': { id: 'dev-user', email: 'dev@example.com', password: 'password', full_name: 'Dev User' },
} as const

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
        } catch (e) {
          console.warn('Supabase auth failed, using mock auth')
        }
      }

      // Fallback to mock auth from localStorage
      const token = localStorage.getItem('token')
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

        // Seed categories for user if first login
        await seedUserCategories(data.user.id)

        return {
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || null,
          confirmed: emailConfirmed,
        }
      }

      // Mock login for development
      const mockUser = MOCK_USERS[email as keyof typeof MOCK_USERS]
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

      // Mock register for development
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
