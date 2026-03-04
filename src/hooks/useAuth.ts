import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { AuthUser, LoginInput, RegisterInput } from '@/types'

export function useAuth() {
  return useQuery({
    queryKey: ['auth'],
    queryFn: async (): Promise<AuthUser | null> => {
      if (!isSupabaseConfigured()) {
        // Mock auth for development
        const token = localStorage.getItem('token')
        if (token) {
          return {
            id: 'dev-user',
            email: 'dev@example.com',
            full_name: 'Dev User',
          }
        }
        return null
      }

      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return null

      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || null,
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password }: LoginInput): Promise<AuthUser> => {
      if (!isSupabaseConfigured()) {
        // Mock login for development
        if (email === 'dev@example.com' && password === 'password') {
          const mockUser: AuthUser = {
            id: 'dev-user',
            email: 'dev@example.com',
            full_name: 'Dev User',
          }
          localStorage.setItem('token', 'mock-jwt-token')
          return mockUser
        }
        throw new Error('Invalid credentials')
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return {
        id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name || null,
      }
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
      if (!isSupabaseConfigured()) {
        // Mock register for development
        const mockUser: AuthUser = {
          id: crypto.randomUUID(),
          email,
          full_name,
        }
        localStorage.setItem('token', 'mock-jwt-token')
        return mockUser
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name },
        },
      })

      if (error) throw error
      if (!data.user) throw new Error('Registration failed')

      return {
        id: data.user.id,
        email: data.user.email || '',
        full_name: full_name,
      }
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
      if (!isSupabaseConfigured()) {
        localStorage.removeItem('token')
        return
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      localStorage.removeItem('token')
      queryClient.clear() // Clear all queries on logout
    },
  })
}