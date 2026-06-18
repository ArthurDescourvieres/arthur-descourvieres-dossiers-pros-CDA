import type { ComponentProps } from 'react'
import { DynamicIcon } from 'lucide-react/dynamic'

// Nom d'icône accepté par DynamicIcon (union des ~1500 noms Lucide). On le dérive
// des props du composant pour ne pas avoir à importer le type géant nous-mêmes.
export type IconName = ComponentProps<typeof DynamicIcon>['name']

/**
 * Icône d'un workspace, rendue dans la couleur de texte du thème (claire en
 * sombre, sombre en clair) pour rester lisible sur la sidebar quel que soit le
 * thème. Sans nom — ou pendant le lazy-load / pour un nom inconnu — on retombe
 * sur un rond neutre, la solution par défaut. DynamicIcon ne charge que l'icône
 * demandée (code-split), pas tout Lucide.
 */
export function WorkspaceIcon({ name, size = 20 }: { name: string | null; size?: number }) {
  if (!name) return <DefaultDot size={size} />
  return (
    <DynamicIcon
      name={name as IconName}
      size={size}
      color="var(--color-text)"
      fallback={() => <DefaultDot size={size} />}
    />
  )
}

function DefaultDot({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full bg-[var(--color-text)]"
      style={{ width: size, height: size }}
      aria-hidden
    />
  )
}
