import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import type { WorkspaceWithRole } from '../../lib/types'
import { WorkspaceIcon } from '../WorkspaceIcon'
import { WorkspaceContextMenu, type MenuItem } from '../WorkspaceContextMenu'

type Menu = { ws: WorkspaceWithRole; x: number; y: number }

/**
 * Barre des workspaces en bas de la sidebar : une ligne d'icônes centrée,
 * scrollable horizontalement quand elles sont trop nombreuses. Clic = sélection ;
 * clic droit / appui long = menu contextuel (Membres, Modifier, Supprimer).
 */
export function WorkspaceBar({
  workspaces,
  selectedId,
  onSelect,
  onCreate,
  onShowMembers,
  onEdit,
  onDelete,
}: {
  workspaces: WorkspaceWithRole[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onShowMembers: (ws: WorkspaceWithRole) => void
  onEdit: (ws: WorkspaceWithRole) => void
  onDelete: (ws: WorkspaceWithRole) => void
}) {
  const [menu, setMenu] = useState<Menu | null>(null)

  const openMenu = (ws: WorkspaceWithRole, clientX: number, clientY: number) => {
    setMenu({ ws, x: Math.max(8, Math.min(clientX, window.innerWidth - 180)), y: clientY })
  }

  const menuItems = (ws: WorkspaceWithRole): MenuItem[] => {
    const items: MenuItem[] = [{ label: 'Membres', onClick: () => onShowMembers(ws) }]
    if (ws.role === 'OWNER') {
      items.push({ label: 'Modifier', onClick: () => onEdit(ws) })
      items.push({ label: 'Supprimer', onClick: () => onDelete(ws), danger: true })
    }
    return items
  }

  return (
    <div className="shrink-0 border-t border-[var(--color-line)] pt-3">
      <div className="no-scrollbar overflow-x-auto py-2">
        <div className="mx-auto flex w-max items-center gap-2 px-1">
          {workspaces.map((ws) => (
            <WorkspaceButton
              key={ws.id}
              ws={ws}
              active={ws.id === selectedId}
              onSelect={() => onSelect(ws.id)}
              onMenu={(x, y) => openMenu(ws, x, y)}
            />
          ))}
          <button
            type="button"
            onClick={onCreate}
            title="Nouveau workspace"
            aria-label="Nouveau workspace"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-dashed border-[var(--color-line-strong)] bg-transparent text-inherit opacity-70 transition-colors hover:bg-[var(--color-surface)]"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {menu && (
        <WorkspaceContextMenu
          x={menu.x}
          y={menu.y}
          items={menuItems(menu.ws)}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  )
}

function WorkspaceButton({
  ws,
  active,
  onSelect,
  onMenu,
}: {
  ws: WorkspaceWithRole
  active: boolean
  onSelect: () => void
  onMenu: (x: number, y: number) => void
}) {
  const timer = useRef<number | null>(null)
  const longFired = useRef(false)

  const clearTimer = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        // Après un appui long (menu ouvert), on ignore le clic synthétique.
        if (longFired.current) {
          longFired.current = false
          return
        }
        onSelect()
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        onMenu(e.clientX, e.clientY)
      }}
      onTouchStart={(e) => {
        const t = e.touches[0]
        longFired.current = false
        clearTimer()
        timer.current = window.setTimeout(() => {
          longFired.current = true
          onMenu(t.clientX, t.clientY)
        }, 500)
      }}
      onTouchEnd={clearTimer}
      onTouchMove={clearTimer}
      title={ws.name}
      aria-label={ws.name}
      aria-current={active ? true : undefined}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-[box-shadow,border-color,background-color] duration-300 ease-[var(--ease-out-expo)] ${
        active
          ? 'ws-btn--active border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
          : 'border-[var(--color-line-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-strong)]'
      }`}
    >
      <WorkspaceIcon name={ws.icon} size={20} />
    </button>
  )
}
