import * as icons from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

function toPascal(name: string): string {
  return name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

type LucideProps = SVGProps<SVGSVGElement> & { size?: number | string }

export function LuminaIcon({ name, ...rest }: { name: string } & LucideProps) {
  const key = toPascal(name)
  const Cmp = (icons as unknown as Record<string, ComponentType<LucideProps>>)[key]
  if (!Cmp) return null
  return <Cmp {...rest} />
}
