import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { AuthProvider } from './lib/auth/AuthContext'
import { DialogProvider } from './memo/dialog/DialogProvider'
import { App } from './App'
import { capturePendingInviteFromUrl } from './lib/pendingInvite'
import './index.css'

// Stash any ?invite=<token> before the router/auth redirects can strip it, so a
// not-yet-registered invitee keeps their invitation across the signup detour.
capturePendingInviteFromUrl()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <DialogProvider>
            <App />
          </DialogProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
