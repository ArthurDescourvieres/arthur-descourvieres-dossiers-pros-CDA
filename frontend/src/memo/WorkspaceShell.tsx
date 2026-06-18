import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth/AuthContext'
import { useFolders, useNotesInFolder, useWorkspaces } from '../hooks/useWorkspaces'
import { useIsMobile } from '../hooks/useIsMobile'
import { SidebarToggleButton, SidebarOpenButton } from './SidebarToggle'
import { MobileBackButton } from './MobileBackButton'
import { InviteSection } from './InviteSection'
import { InviteAcceptBanner } from './InviteAcceptBanner'
import { MembersSection } from './MembersSection'
import { TrashSection } from './TrashSection'
import { SearchBox } from './sidebar/SearchBox'
import { WorkspaceSection } from './sidebar/WorkspaceSection'
import { FolderSection } from './sidebar/FolderSection'
import { NoteSection } from './sidebar/NoteSection'
import { NoteEditor } from './editor/NoteEditor'
import { AccountModal } from './AccountModal'
import { ProfileMenu } from './ProfileMenu'

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
  // Sur mobile, un seul volet à la fois : 'list' = menu (workspaces/dossiers/notes),
  // 'editor' = note ouverte en plein écran. Ignoré sur desktop (les deux cohabitent).
  const [mobilePane, setMobilePane] = useState<'list' | 'editor'>('list')

  // Auto-pick first workspace once loaded.
  useEffect(() => {
    if (!selectedWorkspaceId && workspaces.data && workspaces.data.length > 0) {
      setSelectedWorkspaceId(workspaces.data[0].id)
    }
  }, [workspaces.data, selectedWorkspaceId])

  const folders = useFolders(selectedWorkspaceId)

  // Reset folder/note selection when the workspace changes.
  useEffect(() => {
    setSelectedFolderId(null)
    setSelectedNoteId(null)
  }, [selectedWorkspaceId])

  useEffect(() => {
    if (!selectedFolderId && folders.data && folders.data.length > 0) {
      setSelectedFolderId(folders.data[0].id)
    }
  }, [folders.data, selectedFolderId])

  const notes = useNotesInFolder(selectedWorkspaceId, selectedFolderId)

  useEffect(() => {
    setSelectedNoteId(null)
  }, [selectedFolderId])

  // Auto-sélection de la 1re note : on ne touche pas `mobilePane`, pour rester
  // sur le menu au chargement mobile (la bascule éditeur vient d'un clic explicite).
  useEffect(() => {
    if (!selectedNoteId && notes.data && notes.data.length > 0) {
      setSelectedNoteId(notes.data[0].id)
    }
  }, [notes.data, selectedNoteId])

  const currentRole = useMemo(
    () => workspaces.data?.find((w) => w.id === selectedWorkspaceId)?.role ?? null,
    [workspaces.data, selectedWorkspaceId],
  )
  const canEdit = currentRole === 'OWNER' || currentRole === 'EDITOR'

  // Ouvre une note (clic explicite) et bascule sur l'éditeur en mobile.
  // id null (ex. après suppression de la note courante) => retour au menu.
  const openNote = (id: string | null) => {
    setSelectedNoteId(id)
    setMobilePane(id ? 'editor' : 'list')
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
              : `h-[calc(100vh-62px)] flex-none self-center overflow-hidden transition-[width] duration-[320ms] ease-[var(--ease-in-out)] ${
                  collapsed ? 'w-0' : 'w-[280px]'
                }`
          }
        >
          {/* L'arrière-plan de la sidebar (halo radial + couleur) est un effet conservé en CSS. */}
          <aside
            className={`box-border flex h-full min-h-0 flex-col gap-4 overflow-x-hidden overflow-y-auto p-4 transition-transform duration-[320ms] ease-[var(--ease-in-out)] ${
              isMobile
                ? 'w-full translate-x-0 rounded-r-none border-r-0'
                : `w-[280px] rounded-r-[24px] border-r border-[var(--color-line)] ${
                    collapsed ? '-translate-x-full' : 'translate-x-0'
                  }`
            }`}
            style={{ background: 'var(--color-sidebar)' }}
          >
            <header className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {!isMobile && <SidebarToggleButton onClick={() => setCollapsed(true)} />}
                <strong>Memo</strong>
              </div>
              <ProfileMenu onSettings={() => setAccountOpen(true)} onLogout={auth.logout} />
            </header>

            {user && (
              <div className="text-xs opacity-60">
                {user.name} · {user.email}
              </div>
            )}

            {selectedWorkspaceId && (
              <SearchBox
                workspaceId={selectedWorkspaceId}
                onPick={(hit) => {
                  setSelectedFolderId(hit.folderId)
                  openNote(hit.id)
                }}
              />
            )}

            <WorkspaceSection
              workspaces={workspaces.data ?? []}
              selectedId={selectedWorkspaceId}
              onSelect={setSelectedWorkspaceId}
              isLoading={workspaces.isPending}
            />

            {selectedWorkspaceId && (
              <FolderSection
                workspaceId={selectedWorkspaceId}
                folders={folders.data ?? []}
                selectedId={selectedFolderId}
                onSelect={setSelectedFolderId}
                isLoading={folders.isPending}
                canEdit={canEdit}
              />
            )}

            {selectedFolderId && (
              <NoteSection
                workspaceId={selectedWorkspaceId}
                folderId={selectedFolderId}
                notes={notes.data ?? []}
                selectedId={selectedNoteId}
                onSelect={openNote}
                isLoading={notes.isPending}
                canEdit={canEdit}
              />
            )}

            {selectedWorkspaceId && canEdit && <TrashSection workspaceId={selectedWorkspaceId} />}

            {selectedWorkspaceId && (
              <MembersSection
                workspaceId={selectedWorkspaceId}
                canManage={currentRole === 'OWNER'}
                currentUserId={user?.id ?? null}
              />
            )}

            {selectedWorkspaceId && currentRole === 'OWNER' && (
              <InviteSection workspaceId={selectedWorkspaceId} />
            )}
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

      <SidebarOpenButton visible={collapsed && !isMobile} onClick={() => setCollapsed(false)} />

      {accountOpen && <AccountModal onClose={() => setAccountOpen(false)} />}
    </div>
  )
}
