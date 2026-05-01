import { WorkspaceShell } from './lumina/WorkspaceShell';
import { Login } from './lumina/Login';
import { useAuth } from './lib/auth/AuthContext';

export function App() {
  const auth = useAuth();

  if (auth.status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--bg, #0b0b0f)',
          color: 'var(--fg, #f5f5f5)',
          opacity: 0.6,
          fontSize: 13,
        }}
      >
        Chargement…
      </div>
    );
  }

  if (auth.status === 'guest') {
    return <Login />;
  }

  return <WorkspaceShell />;
}
