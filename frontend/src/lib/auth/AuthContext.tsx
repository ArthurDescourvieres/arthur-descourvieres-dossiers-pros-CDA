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

type LoginResponse = { token: string; user: AuthUser }
type RegisterResponse = LoginResponse
type MeResponse = { user: AuthUser }

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: AuthUser }
  | { status: 'guest' }

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setState({ status: 'guest' })
      return
    }
    api<MeResponse>('/api/auth/me')
      .then((res) => setState({ status: 'authenticated', user: res.user }))
      .catch(() => {
        setAccessToken(null)
        setState({ status: 'guest' })
      })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<LoginResponse>('/api/auth/login', {
      method: 'POST',
      json: { email, password },
    })
    setAccessToken(res.token)
    setState({ status: 'authenticated', user: res.user })
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await api<RegisterResponse>('/api/auth/register', {
      method: 'POST',
      json: { name, email, password },
    })
    setAccessToken(res.token)
    setState({ status: 'authenticated', user: res.user })
  }, [])

  const logout = useCallback(() => {
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
