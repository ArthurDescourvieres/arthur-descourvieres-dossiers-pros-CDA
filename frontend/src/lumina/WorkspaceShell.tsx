import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth/AuthContext'
import { useFolders, useNotesInFolder, useWorkspaces } from '../hooks/useWorkspaces'
import { SidebarToggleButton, SidebarOpenButton } from './SidebarToggle'
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

export function WorkspaceShell() {
  const auth = useAuth()
  const user = auth.status === 'authenticated' ? auth.user : null

  const workspaces = useWorkspaces()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

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

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        position: 'relative',
      }}
    >
      <div
        style={{
          flex: '0 0 auto',
          width: collapsed ? 0 : 280,
          height: 'calc(100vh - 62px)',
          alignSelf: 'center',
          overflow: 'hidden',
          transition: 'width 0.32s cubic-bezier(0.65, 0, 0.35, 1)',
        }}
      >
        <aside
          aria-hidden={collapsed}
          style={{
            width: 280,
            height: '100%',
            boxSizing: 'border-box',
            transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
            transition: 'transform 0.32s cubic-bezier(0.65, 0, 0.35, 1)',
            borderRight: '1px solid var(--color-line)',
            background: 'var(--color-sidebar)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            minHeight: 0,
            overflowX: 'hidden',
            overflowY: 'auto',
            borderTopRightRadius: 24,
            borderBottomRightRadius: 24,
          }}
        >
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <SidebarToggleButton onClick={() => setCollapsed(true)} />
              <strong>Memo</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setAccountOpen(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-line-strong)',
                  color: 'inherit',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Mon compte
              </button>
              <button
                type="button"
                onClick={auth.logout}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--color-line-strong)',
                  color: 'inherit',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Déconnexion
              </button>
            </div>
          </header>

          {user && (
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {user.name} · {user.email}
            </div>
          )}

          {selectedWorkspaceId && (
            <SearchBox
              workspaceId={selectedWorkspaceId}
              onPick={(hit) => {
                setSelectedFolderId(hit.folderId)
                setSelectedNoteId(hit.id)
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
              onSelect={setSelectedNoteId}
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

      <main style={{ flex: 1, minWidth: 0, padding: 32, minHeight: 0, overflow: 'auto' }}>
        <InviteAcceptBanner />
        {selectedNoteId ? (
          <NoteEditor noteId={selectedNoteId} />
        ) : (
          <div style={{ opacity: 0.5, fontSize: 14, marginTop: 80, textAlign: 'center' }}>
            Sélectionnez ou créez une note pour commencer.
          </div>
        )}
      </main>

      <SidebarOpenButton visible={collapsed} onClick={() => setCollapsed(false)} />

      {accountOpen && <AccountModal onClose={() => setAccountOpen(false)} />}
    </div>
  )
}
