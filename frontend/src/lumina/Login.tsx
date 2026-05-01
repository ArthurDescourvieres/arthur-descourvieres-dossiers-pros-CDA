import { useState, type FormEvent } from 'react'
import { ApiError, useAuth } from '../lib/auth/AuthContext'

type Mode = 'login' | 'register'

export function Login() {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') await auth.login(email, password)
      else await auth.register(name, email, password)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setError('Email ou mot de passe invalide.')
        else if (err.status === 409) setError('Cet email est déjà utilisé.')
        else if (err.status === 400) setError('Champs invalides.')
        else setError('Une erreur est survenue.')
      } else {
        setError('Impossible de joindre le serveur.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg, #0b0b0f)',
        color: 'var(--fg, #f5f5f5)',
        padding: 24,
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: 'rgba(255,255,255,0.04)',
          padding: 28,
          borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
          {mode === 'login' ? 'Connexion à Lumina' : 'Créer un compte'}
        </h1>

        {mode === 'register' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Nom</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              style={inputStyle}
            />
          </label>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            style={inputStyle}
          />
        </label>

        {error && (
          <div style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</div>
        )}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? '…' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError(null)
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            opacity: 0.6,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {mode === 'login' ? 'Pas encore de compte ? Créez-en un' : "Déjà inscrit ? Connectez-vous"}
        </button>
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: 'inherit',
  padding: '8px 10px',
  fontSize: 14,
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  background: '#5b8cff',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  padding: '10px 12px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  marginTop: 4,
}
