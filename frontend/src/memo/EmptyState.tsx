import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  FilePlus,
  FolderPlus,
  LayoutGrid,
  NotebookPen,
  type LucideIcon,
} from 'lucide-react'
import { api } from '../lib/api'
import { useCreateFolder } from '../hooks/useWorkspaces'
import { useDialog } from './dialog/DialogProvider'
import type { Folder, Note } from '../lib/types'

type Action = {
  key: string
  icon: LucideIcon
  title: string
  description: string
  onClick: () => void
  primary?: boolean
}

/**
 * Écran d'accueil de la zone d'édition quand aucune note n'est ouverte.
 * Propose des actions concrètes (créer une note / un dossier / un workspace)
 * plutôt qu'un simple message. La création de note vise le dossier sélectionné,
 * sinon le premier dossier existant, et en crée un au besoin.
 */
export function EmptyState({
  workspaceId,
  folders,
  selectedFolderId,
  canEdit,
  onCreateWorkspace,
  onSelectFolder,
  onOpenNote,
}: {
  workspaceId: string | null
  folders: Folder[]
  selectedFolderId: string | null
  canEdit: boolean
  onCreateWorkspace: () => void
  onSelectFolder: (id: string) => void
  onOpenNote: (id: string) => void
}) {
  const qc = useQueryClient()
  const dialog = useDialog()
  const createFolder = useCreateFolder(workspaceId)
  // Mutation locale (et non useCreateNote) : le dossier cible n'est connu qu'au
  // clic, parfois créé à la volée — on ne peut pas le figer à l'appel du hook.
  const createNote = useMutation({
    mutationFn: ({ folderId, title }: { folderId: string; title: string }) =>
      api<Note>(`/api/workspaces/${workspaceId}/folders/${folderId}/notes`, {
        method: 'POST',
        json: { folderId, title },
      }),
    onSuccess: (_note, vars) =>
      qc.invalidateQueries({ queryKey: ['notes', workspaceId, vars.folderId] }),
  })

  const busy = createFolder.isPending || createNote.isPending

  const handleNewNote = async () => {
    if (!workspaceId) return
    try {
      let folderId = selectedFolderId ?? folders[0]?.id ?? null
      if (!folderId) {
        const folder = await createFolder.mutateAsync({ name: 'Mes notes' })
        folderId = folder.id
      }
      onSelectFolder(folderId)
      const note = await createNote.mutateAsync({ folderId, title: 'Nouvelle note' })
      onOpenNote(note.id)
    } catch {
      void dialog.alert({ message: 'La création a échoué.', variant: 'danger' })
    }
  }

  const handleNewFolder = async () => {
    if (!workspaceId) return
    try {
      const folder = await createFolder.mutateAsync({ name: 'Nouveau dossier' })
      onSelectFolder(folder.id)
    } catch {
      void dialog.alert({ message: 'La création a échoué.', variant: 'danger' })
    }
  }

  const actions: Action[] = []
  if (workspaceId && canEdit) {
    actions.push({
      key: 'note',
      icon: FilePlus,
      title: 'Nouvelle note',
      description: 'Démarrer une page vierge',
      onClick: handleNewNote,
      primary: true,
    })
    actions.push({
      key: 'folder',
      icon: FolderPlus,
      title: 'Nouveau dossier',
      description: 'Regrouper vos notes',
      onClick: handleNewFolder,
    })
  }
  actions.push({
    key: 'workspace',
    icon: LayoutGrid,
    title: 'Nouveau workspace',
    description: 'Créer un espace de travail',
    onClick: onCreateWorkspace,
    primary: !workspaceId,
  })

  const heading = !workspaceId
    ? 'Bienvenue sur Memo'
    : canEdit
      ? 'Votre espace est prêt'
      : 'Aucune note ouverte'
  const subtitle = !workspaceId
    ? 'Créez votre premier espace de travail pour commencer à organiser vos notes.'
    : canEdit
      ? 'Créez une note, un dossier, ou changez d’espace de travail.'
      : 'Sélectionnez une note dans la barre latérale pour la consulter.'

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-10">
      <div
        className="flex w-full max-w-md flex-col items-center text-center"
        style={{ animation: 'blockEnter 420ms var(--ease-out-expo) both' }}
      >
        <div className="mb-5 grid h-16 w-16 place-items-center rounded-[var(--r-xl)] border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-accent-hi)]">
          <NotebookPen size={28} />
        </div>
        <h2 className="text-xl font-bold">{heading}</h2>
        <p className="mb-7 mt-2 text-sm text-[var(--color-text-dim)]">{subtitle}</p>
        <div className="flex w-full flex-col gap-2.5">
          {actions.map((action) => (
            <ActionCard key={action.key} action={action} disabled={busy} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ActionCard({ action, disabled }: { action: Action; disabled: boolean }) {
  const { icon: Icon, title, description, onClick, primary } = action
  return (
    <button
      type="button"
      data-testid={`empty-action-${action.key}`}
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center gap-3.5 rounded-[var(--r-lg)] border p-3.5 text-left transition-[transform,background-color,border-color] duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 ${
        primary
          ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-soft)]'
          : 'border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface-strong)]'
      }`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--r-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent-hi)]">
        <Icon size={18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold">{title}</span>
        <span className="truncate text-xs text-[var(--color-text-dim)]">{description}</span>
      </span>
      <ArrowRight
        size={16}
        className="shrink-0 text-[var(--color-text-faint)] opacity-0 transition-[opacity,transform] duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:opacity-100"
      />
    </button>
  )
}
