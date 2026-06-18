import { useState, type FormEvent } from 'react'
import { ApiError, useAuth } from '../lib/auth/AuthContext'

type Mode = 'login' | 'register'

type LoginProps = {
  initialMode?: Mode
  onBack?: () => void
  onSwitchMode?: () => void
}

export function Login({ initialMode = 'login', onBack, onSwitchMode }: LoginProps = {}) {
  const auth = useAuth()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') await auth.login(identifier, password)
      else await auth.register(name, identifier, password)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setError('Email ou mot de passe invalide.')
        else if (err.status === 409) {
          const payload = err.payload as { error?: unknown }
          setError(
            typeof payload?.error === 'string'
              ? payload.error
              : 'Cet identifiant est déjà utilisé.',
          )
        } else if (err.status === 400) {
          const payload = err.payload as { error?: unknown }
          setError(typeof payload?.error === 'string' ? payload.error : 'Champs invalides.')
        } else setError('Une erreur est survenue.')
      } else {
        setError('Impossible de joindre le serveur.')
      }
    } finally {
      setLoading(false)
    }
  }

  // RGAA — lie le champ mot de passe à son aide (register) et au message d'erreur.
  const passwordDescribedBy =
    [mode === 'register' ? 'login-pwd-hint' : null, error ? 'login-error' : null]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
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
          background: 'var(--color-surface)',
          padding: 28,
          borderRadius: 12,
          boxShadow: '0 8px 32px var(--color-shadow)',
        }}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: 'none',
              color: 'inherit',
              opacity: 0.6,
              fontSize: 13,
              cursor: 'pointer',
              padding: 0,
              marginBottom: 4,
            }}
          >
            ← Retour à l’accueil
          </button>
        )}

        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
          {mode === 'login' ? 'Connexion à Memo' : 'Créer un compte'}
        </h1>

        {mode === 'register' && (
          <label htmlFor="login-name" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Nom</span>
            <input
              id="login-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-required="true"
              autoComplete="name"
              style={inputStyle}
            />
          </label>
        )}

        <label
          htmlFor="login-identifier"
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {mode === 'login' ? 'Email ou pseudo' : 'Email'}
          </span>
          <input
            id="login-identifier"
            type={mode === 'login' ? 'text' : 'email'}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            aria-required="true"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'login-error' : undefined}
            autoComplete={mode === 'login' ? 'username' : 'email'}
            style={inputStyle}
          />
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label htmlFor="login-password" style={{ fontSize: 12, opacity: 0.7 }}>
            Mot de passe
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-required="true"
              aria-invalid={error ? true : undefined}
              aria-describedby={passwordDescribedBy}
              minLength={mode === 'register' ? 12 : undefined}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{ ...inputStyle, paddingRight: 36, width: '100%', boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={showPassword}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 2,
                color: 'inherit',
                opacity: 0.55,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          {mode === 'register' && (
            <span id="login-pwd-hint" style={{ fontSize: 11, opacity: 0.55 }}>
              12 caractères minimum.
            </span>
          )}
        </div>

        {error && (
          <div id="login-error" role="alert" style={{ color: 'var(--color-danger)', fontSize: 13 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? '…' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
        </button>

        <button
          type="button"
          onClick={() => {
            setError(null)
            if (onSwitchMode) {
              onSwitchMode()
              return
            }
            setMode(mode === 'login' ? 'register' : 'login')
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
          {mode === 'login'
            ? 'Pas encore de compte ? Créez-en un'
            : 'Déjà inscrit ? Connectez-vous'}
        </button>
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--color-surface-strong)',
  border: '1px solid var(--color-line-strong)',
  borderRadius: 6,
  color: 'inherit',
  padding: '8px 10px',
  fontSize: 14,
}

const buttonStyle: React.CSSProperties = {
  background: 'var(--color-accent)',
  color: 'var(--color-on-accent)',
  border: 'none',
  borderRadius: 6,
  padding: '10px 12px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  marginTop: 4,
}

function Eye() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOff() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
