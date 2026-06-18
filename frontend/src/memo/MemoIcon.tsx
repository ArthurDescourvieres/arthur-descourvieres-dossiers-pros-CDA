import {
  ArrowLeft,
  Check,
  ChevronDown,
  Feather,
  Image,
  Layers,
  MoreHorizontal,
  PanelLeft,
  Search,
  Shield,
  Users,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'

// Mapping statique name (kebab-case) → composant lucide-react.
// On évite volontairement le barrel `import * as icons from 'lucide-react'`,
// qui embarquait TOUTE la bibliothèque dans le bundle (~894 kB).
// N'ajouter ici que les icônes réellement utilisées par <MemoIcon name="..." />.
const ICONS: Record<string, LucideIcon> = {
  'arrow-left': ArrowLeft,
  check: Check,
  'chevron-down': ChevronDown,
  feather: Feather,
  image: Image,
  layers: Layers,
  'more-horizontal': MoreHorizontal,
  'panel-left': PanelLeft,
  search: Search,
  shield: Shield,
  users: Users,
}

export function MemoIcon({ name, ...rest }: { name: string } & LucideProps) {
  const Cmp = ICONS[name]
  if (!Cmp) return null
  return <Cmp {...rest} />
}
