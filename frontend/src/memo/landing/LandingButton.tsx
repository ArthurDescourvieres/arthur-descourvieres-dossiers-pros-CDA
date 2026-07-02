import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost'
type Size = 'md' | 'lg'

/**
 * Bouton de la landing en Tailwind — remplace les classes `.lp-btn*` du CSS.
 * Les valeurs de couleur/rayon pointent vers les design tokens (tokens.css),
 * donc le rendu suit le thème sans dupliquer les couleurs ici.
 */
const BASE =
  'inline-flex cursor-pointer items-center gap-2 rounded-[var(--r-md)] border border-transparent ' +
  'font-medium transition-[transform,background-color,border-color,box-shadow] duration-200 ' +
  'ease-[cubic-bezier(0.16,1,0.3,1)] active:translate-y-px'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-[0_8px_24px_-12px_var(--color-accent)] ' +
    'hover:-translate-y-0.5 hover:bg-[var(--color-accent-hi)] hover:shadow-[0_16px_34px_-14px_var(--color-accent)]',
  ghost:
    'bg-[var(--color-overlay)] text-[var(--color-text)] border-[var(--color-line-strong)] ' +
    'hover:bg-[var(--color-overlay-hi)]',
}

const SIZES: Record<Size, string> = {
  md: 'px-[18px] py-[10px]',
  lg: 'px-6 py-[14px] text-base',
}

type LandingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function LandingButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: LandingButtonProps) {
  return (
    <button
      type="button"
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
