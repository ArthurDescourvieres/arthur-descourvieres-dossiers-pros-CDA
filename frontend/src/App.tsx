import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Spinner } from './memo/Spinner'
import { useAuth } from './lib/auth/AuthContext'

// Code splitting (éco-conception) : les écrans lourds sont chargés à la demande.
// WorkspaceShell embarque l'éditeur Tiptap + lowlight + socket.io (gros chunk) et
// n'est utile qu'une fois connecté ; Landing/Login ne servent qu'aux visiteurs.
const WorkspaceShell = lazy(() =>
  import('./memo/WorkspaceShell').then((m) => ({ default: m.WorkspaceShell })),
)
const Landing = lazy(() => import('./memo/landing/Landing').then((m) => ({ default: m.Landing })))
const Login = lazy(() => import('./memo/Login').then((m) => ({ default: m.Login })))
const MentionsLegales = lazy(() =>
  import('./memo/legal/MentionsLegales').then((m) => ({ default: m.MentionsLegales })),
)
const Confidentialite = lazy(() =>
  import('./memo/legal/Confidentialite').then((m) => ({ default: m.Confidentialite })),
)

function CenteredSpinner() {
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--color-bg)]">
      <Spinner size={36} />
    </div>
  )
}

export function App() {
  const auth = useAuth()

  if (auth.status === 'loading') {
    return <CenteredSpinner />
  }

  // Public routes are only mounted for unauthenticated visitors, so the landing
  // page is unreachable once signed in. Suspense covers the lazy-loaded chunks.
  return (
    <Suspense fallback={<CenteredSpinner />}>
      {auth.status === 'guest' ? (
        <PublicRoutes />
      ) : (
        <Routes>
          <Route path="/" element={<WorkspaceShell />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/confidentialite" element={<Confidentialite />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Suspense>
  )
}

/** Routes available to visitors who are not signed in. */
function PublicRoutes() {
  const navigate = useNavigate()

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Landing onRegister={() => navigate('/register')} onLogin={() => navigate('/login')} />
        }
      />
      <Route
        path="/login"
        element={
          <Login
            key="login"
            initialMode="login"
            onBack={() => navigate('/')}
            onSwitchMode={() => navigate('/register')}
          />
        }
      />
      <Route
        path="/register"
        element={
          <Login
            key="register"
            initialMode="register"
            onBack={() => navigate('/')}
            onSwitchMode={() => navigate('/login')}
          />
        }
      />
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/confidentialite" element={<Confidentialite />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
