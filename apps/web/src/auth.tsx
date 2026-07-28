import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, getToken, setToken, type User } from './api'

type AuthContextValue = {
  user: User | null
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
  applySession: (token: string, user: User) => void
  requireAuth: (redirectPath?: string) => boolean
  authOpen: boolean
  setAuthOpen: (open: boolean) => void
  authRedirect: string | null
  setAuthRedirect: (path: string | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [authRedirect, setAuthRedirect] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await api.me()
      setUser(me)
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signOut = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      /* ignore */
    }
    setToken(null)
    setUser(null)
  }, [])

  const applySession = useCallback((token: string, next: User) => {
    setToken(token)
    setUser(next)
  }, [])

  const requireAuth = useCallback(
    (redirectPath?: string) => {
      if (user) return true
      setAuthRedirect(redirectPath || window.location.pathname)
      setAuthOpen(true)
      return false
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      signOut,
      applySession,
      requireAuth,
      authOpen,
      setAuthOpen,
      authRedirect,
      setAuthRedirect,
    }),
    [user, loading, refresh, signOut, applySession, requireAuth, authOpen, authRedirect],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside provider')
  return ctx
}
