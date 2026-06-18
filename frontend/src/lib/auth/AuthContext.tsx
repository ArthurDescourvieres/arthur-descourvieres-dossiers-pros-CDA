import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, ApiError, getAccessToken, setAccessToken } from '../api'

export type AuthUser = {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

type LoginResponse = { accessToken: string; user: AuthUser }
type RegisterResponse = LoginResponse
type MeResponse = { user: AuthUser }
type RefreshResponse = { accessToken: string }

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: AuthUser }
  | { status: 'guest' }

type AuthContextValue = AuthState & {
  login: (identifier: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    const tryBoot = async () => {
      let token = getAccessToken()
      if (!token) {
        // Attempt silent refresh from cookie before falling back to guest.
        try {
          const res = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          })
          if (res.ok) {
            const data = (await res.json()) as RefreshResponse
            setAccessToken(data.accessToken)
            token = data.accessToken
          }
        } catch {
          /* fall through */
        }
      }
      if (!token) {
        if (!cancelled) setState({ status: 'guest' })
        return
      }
      try {
        const me = await api<MeResponse>('/api/auth/me')
        if (!cancelled) setState({ status: 'authenticated', user: me.user })
      } catch {
        setAccessToken(null)
        if (!cancelled) setState({ status: 'guest' })
      }
    }
    void tryBoot()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await api<LoginResponse>('/api/auth/login', {
      method: 'POST',
      json: { identifier, password },
    })
    setAccessToken(res.accessToken)
    setState({ status: 'authenticated', user: res.user })
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      json: { name, email, password },
    })
    setAccessToken(res.accessToken)
    setState({ status: 'authenticated', user: res.user })
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      /* ignore */
    }
    setAccessToken(null)
    setState({ status: 'guest' })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, register, logout }),
    [state, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export { ApiError }
