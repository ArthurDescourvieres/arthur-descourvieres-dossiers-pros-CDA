import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth/AuthContext'
import { useFolders, useWorkspaces, useDeleteWorkspace } from '../hooks/useWorkspaces'
import type { WorkspaceWithRole } from '../lib/types'
import { useIsMobile } from '../hooks/useIsMobile'
import { SidebarToggleButton, SidebarOpenButton } from './SidebarToggle'
import { MobileBackButton } from './MobileBackButton'
import { InviteModal } from './InviteSection'
import { InviteAcceptBanner } from './InviteAcceptBanner'
import { MembersModal } from './MembersModal'
import { WorkspaceFormModal } from './WorkspaceFormModal'
import { TrashModal } from './TrashModal'
import { SearchBox } from './sidebar/SearchBox'
import { WorkspaceBar } from './sidebar/WorkspaceBar'
import { FolderTree } from './sidebar/FolderTree'
import { NoteEditor } from './editor/NoteEditor'
import { AccountModal } from './AccountModal'
import { ProfileMenu } from './ProfileMenu'
import { TrashButton } from './TrashButton'
import { BgColorPicker } from './BgColorPicker'

export function WorkspaceShell() {
  const auth = useAuth()
  const user = auth.status === 'authenticated' ? auth.user : null

  const isMobile = useIsMobile()
  const workspaces = useWorkspaces()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [trashOpen, setTrashOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [membersFor, setMembersFor] = useState<WorkspaceWithRole | null>(null)
  const [wsForm, setWsForm] = useState<
    { mode: 'create' } | { mode: 'edit'; workspace: WorkspaceWithRole } | null
  >(null)
  const del = useDeleteWorkspace()
  // Sur mobile, un seul volet à la fois : 'list' = menu (workspaces/dossiers/notes),
  // 'editor' = note ouverte en plein écran. Ignoré sur desktop (les deux cohabitent).
  const [mobilePane, setMobilePane] = useState<'list' | 'editor'>('list')
  // Cible de « révélation » dans l'arbre : seule la recherche la met à jour, via
  // un nonce, pour déplier le chemin sans interférer avec les clics de sélection.
  const [reveal, setReveal] = useState<{ folderId: string | null; nonce: number }>({
    folderId: null,
    nonce: 0,
  })

  // Auto-pick first workspace once loaded.
  useEffect(() => {
    if (!selectedWorkspaceId && workspaces.data && workspaces.data.length > 0) {
      setSelectedWorkspaceId(workspaces.data[0].id)
    }
  }, [workspaces.data, selectedWorkspaceId])

  const folders = useFolders(selectedWorkspaceId)

  // Reset de la sélection au changement de workspace. L'arbre gère ensuite
  // lui-même l'expansion et le chargement paresseux des notes par dossier.
  useEffect(() => {
    setSelectedFolderId(null)
    setSelectedNoteId(null)
    setReveal((r) => ({ folderId: null, nonce: r.nonce }))
  }, [selectedWorkspaceId])

  const currentRole = useMemo(
    () => workspaces.data?.find((w) => w.id === selectedWorkspaceId)?.role ?? null,
    [workspaces.data, selectedWorkspaceId],
  )
  const canEdit = currentRole === 'OWNER' || currentRole === 'EDITOR'
  const isOwner = currentRole === 'OWNER'

  // Ouvre une note (clic explicite) et bascule sur l'éditeur en mobile.
  // id null (ex. après suppression de la note courante) => retour au menu.
  const openNote = (id: string | null) => {
    setSelectedNoteId(id)
    setMobilePane(id ? 'editor' : 'list')
  }

  const onDeleteWorkspace = async (ws: WorkspaceWithRole) => {
    if (
      !window.confirm(
        `Supprimer le workspace « ${ws.name} » ? Tout son contenu (dossiers, notes, pièces jointes) sera définitivement perdu.`,
      )
    )
      return
    try {
      await del.mutateAsync(ws.id)
      if (ws.id === selectedWorkspaceId) setSelectedWorkspaceId(null)
    } catch {
      window.alert('La suppression a échoué.')
    }
  }

  const showSidebar = !isMobile || mobilePane === 'list'
  const showMain = !isMobile || mobilePane === 'editor'

  return (
    <div
      className={`relative flex overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)] ${
        isMobile ? 'h-[100dvh]' : 'h-screen'
      }`}
    >
      {showSidebar && (
        <div
          className={
            isMobile
              ? 'h-full w-full flex-auto overflow-hidden'
              : `my-4 ml-4 h-[calc(100vh-2rem)] flex-none overflow-hidden transition-[width] duration-[320ms] ease-[var(--ease-in-out)] ${
                  collapsed ? 'w-0' : 'w-[280px]'
                }`
          }
        >
          {/* L'arrière-plan de la sidebar (halo radial + couleur) est un effet conservé en CSS. */}
          <aside
            className={`box-border flex h-full min-h-0 flex-col gap-4 overflow-x-hidden p-4 transition-transform duration-[320ms] ease-[var(--ease-in-out)] ${
              isMobile
                ? 'w-full translate-x-0 rounded-r-none border-r-0'
                : `w-[280px] rounded-[24px] border border-[var(--color-line)] ${
                    collapsed ? '-translate-x-full' : 'translate-x-0'
                  }`
            }`}
            style={{ background: 'var(--color-sidebar)' }}
          >
            <header className="flex items-center gap-2">
              {!isMobile && <SidebarToggleButton onClick={() => setCollapsed(true)} />}
              <strong>Memo</strong>
            </header>

            {user && (
              <div className="text-xs opacity-60">
                {user.name} · {user.email}
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
              {selectedWorkspaceId && (
                <SearchBox
                  workspaceId={selectedWorkspaceId}
                  onPick={(hit) => {
                    setSelectedFolderId(hit.folderId)
                    setReveal((r) => ({ folderId: hit.folderId, nonce: r.nonce + 1 }))
                    openNote(hit.id)
                  }}
                />
              )}

              {selectedWorkspaceId && (
                <FolderTree
                  key={selectedWorkspaceId}
                  workspaceId={selectedWorkspaceId}
                  folders={folders.data ?? []}
                  selectedFolderId={selectedFolderId}
                  selectedNoteId={selectedNoteId}
                  onSelectFolder={setSelectedFolderId}
                  onOpenNote={openNote}
                  isLoading={folders.isPending}
                  canEdit={canEdit}
                  revealFolderId={reveal.folderId}
                  revealNonce={reveal.nonce}
                />
              )}
            </div>

            {(isOwner || canEdit) && selectedWorkspaceId && (
              <div className="flex shrink-0 gap-2">
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setInviteOpen(true)}
                    className="h-10 min-w-0 flex-[2] cursor-pointer rounded-xl border border-white bg-[var(--color-surface)] text-sm text-inherit transition-colors hover:bg-[var(--color-surface-strong)]"
                  >
                    Inviter
                  </button>
                )}
                {canEdit && (
                  <TrashButton
                    onClick={() => setTrashOpen(true)}
                    className={`h-10 min-w-0 opacity-100 ${isOwner ? 'flex-1' : 'w-full flex-1'} rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface)] transition-colors hover:bg-[var(--color-surface-strong)]`}
                  />
                )}
              </div>
            )}

            <WorkspaceBar
              workspaces={workspaces.data ?? []}
              selectedId={selectedWorkspaceId}
              onSelect={setSelectedWorkspaceId}
              onCreate={() => setWsForm({ mode: 'create' })}
              onShowMembers={(ws) => setMembersFor(ws)}
              onEdit={(ws) => setWsForm({ mode: 'edit', workspace: ws })}
              onDelete={onDeleteWorkspace}
            />
          </aside>
        </div>
      )}

      {showMain && (
        <main
          className={
            isMobile
              ? 'relative w-full min-w-0 flex-1 overflow-auto px-4 pb-6 pt-16'
              : 'min-w-0 flex-1 overflow-auto p-8'
          }
        >
          {isMobile && <MobileBackButton onClick={() => setMobilePane('list')} />}
          <InviteAcceptBanner />
          {selectedNoteId ? (
            <NoteEditor noteId={selectedNoteId} />
          ) : (
            <div className="mt-20 text-center text-sm opacity-50">
              Sélectionnez ou créez une note pour commencer.
            </div>
          )}
        </main>
      )}

      <div className="absolute right-4 top-4 z-[150]">
        <ProfileMenu
          onSettings={() => setAccountOpen(true)}
          onTrash={canEdit && selectedWorkspaceId ? () => setTrashOpen(true) : undefined}
          onLogout={auth.logout}
        />
      </div>

      <SidebarOpenButton
        visible={collapsed && !isMobile}
        onClick={() => setCollapsed(false)}
        className={!isMobile ? 'left-[30px] top-[30px]' : undefined}
      />
      <BgColorPicker />

      {accountOpen && <AccountModal onClose={() => setAccountOpen(false)} />}

      {trashOpen && selectedWorkspaceId && (
        <TrashModal workspaceId={selectedWorkspaceId} onClose={() => setTrashOpen(false)} />
      )}

      {inviteOpen && selectedWorkspaceId && (
        <InviteModal workspaceId={selectedWorkspaceId} onClose={() => setInviteOpen(false)} />
      )}

      {wsForm && (
        <WorkspaceFormModal
          mode={wsForm.mode}
          workspace={wsForm.mode === 'edit' ? wsForm.workspace : undefined}
          onClose={() => setWsForm(null)}
          onCreated={(id) => setSelectedWorkspaceId(id)}
        />
      )}

      {membersFor && (
        <MembersModal
          workspaceId={membersFor.id}
          canManage={membersFor.role === 'OWNER'}
          currentUserId={user?.id ?? null}
          onClose={() => setMembersFor(null)}
        />
      )}
    </div>
  )
}
