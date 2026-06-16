type SpinnerProps = {
  /** Diamètre de la roue en pixels. */
  size?: number
  /** Épaisseur du trait en pixels. */
  stroke?: number
  /** Libellé lu par les lecteurs d'écran. */
  label?: string
}

/**
 * Roue de chargement animée — un arc en accent tournant sur une piste discrète.
 * Couleurs issues des tokens du thème ; animation `spin` définie dans tokens.css.
 */
export function Spinner({ size = 32, stroke = 3, label = 'Chargement' }: SpinnerProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="status"
      aria-label={label}
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--color-line-strong)"
        strokeWidth={stroke}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.72}
      />
    </svg>
  )
}
