import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as authApi from '@/api/auth'
import { getStoredToken, setOnUnauthorized, setStoredToken } from '@/api/client'
import type { AuthUser, LoginResponse } from '@/types'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  mustChangePassword: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<LoginResponse>
  logout: () => void
  refreshMe: () => Promise<void>
  setMustChangePassword: (v: boolean) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [mustChangePassword, setMustChangePassword] = useState(false)

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: authApi.fetchMe,
    enabled: Boolean(token),
    retry: false,
  })

  const user = meQuery.data ?? null
  const loading = Boolean(token) && meQuery.isPending

  useEffect(() => {
    if (user?.mustChangePassword === true) setMustChangePassword(true)
    if (user?.mustChangePassword === false) setMustChangePassword(false)
  }, [user?.mustChangePassword])

  const logout = useCallback(() => {
    setStoredToken(null)
    setToken(null)
    setMustChangePassword(false)
    queryClient.clear()
    navigate('/login', { replace: true })
  }, [navigate, queryClient])

  useEffect(() => {
    setOnUnauthorized(logout)
    return () => setOnUnauthorized(null)
  }, [logout])

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password)
      setStoredToken(data.token)
      setToken(data.token)
      setMustChangePassword(data.mustChangePassword)
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      return data
    },
    [queryClient],
  )

  const refreshMe = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['me'] })
  }, [queryClient])

  const value = useMemo(
    () => ({
      user,
      token,
      mustChangePassword,
      loading,
      login,
      logout,
      refreshMe,
      setMustChangePassword,
    }),
    [
      user,
      token,
      mustChangePassword,
      loading,
      login,
      logout,
      refreshMe,
    ],
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
