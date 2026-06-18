import { useEffect, useState } from 'react'

const DARK_DEFAULTS = { l: 0.3, c: 0.03, h: 256 }
const LIGHT_DEFAULTS = { l: 0.96, c: 0.02, h: 256 }

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

function Slider({ label, value, min, max, step, onChange }: SliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs opacity-70">
        <span>{label}</span>
        <span className="font-mono">{value.toFixed(step < 0.01 ? 3 : 2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-accent)]"
      />
    </div>
  )
}

export function BgColorPicker() {
  const isLight = document.documentElement.dataset.theme === 'light'
  const defaults = isLight ? LIGHT_DEFAULTS : DARK_DEFAULTS

  const [open, setOpen] = useState(false)
  const [l, setL] = useState(defaults.l)
  const [c, setC] = useState(defaults.c)
  const [h, setH] = useState(defaults.h)
  const [copied, setCopied] = useState(false)

  const code = `oklch(${l.toFixed(2)} ${c.toFixed(3)} ${h})`

  useEffect(() => {
    if (!open) return
    document.documentElement.style.setProperty('--color-bg', code)
    return () => {
      document.documentElement.style.removeProperty('--color-bg')
    }
  }, [open, code])

  const copy = () => {
    void navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const reset = () => {
    const d = document.documentElement.dataset.theme === 'light' ? LIGHT_DEFAULTS : DARK_DEFAULTS
    setL(d.l)
    setC(d.c)
    setH(d.h)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Tester la couleur de fond"
        className="fixed bottom-4 right-4 z-50 rounded-full border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-mono opacity-60 transition-opacity hover:opacity-100"
      >
        BG
      </button>

      {open && (
        <div className="fixed bottom-14 right-4 z-50 w-72 rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface-1)] p-4 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold opacity-70">Couleur de fond (--color-bg)</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs opacity-50 hover:opacity-100"
            >
              ✕
            </button>
          </div>

          {/* Aperçu */}
          <div
            className="h-12 w-full rounded-lg border border-[var(--color-line)]"
            style={{ background: code }}
          />

          <div className="flex flex-col gap-3">
            <Slider
              label="L — clarté"
              value={l}
              min={0.05}
              max={0.98}
              step={0.01}
              onChange={setL}
            />
            <Slider
              label="C — saturation"
              value={c}
              min={0}
              max={0.15}
              step={0.001}
              onChange={setC}
            />
            <Slider label="H — teinte" value={h} min={180} max={310} step={1} onChange={setH} />
          </div>

          {/* Code à copier */}
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-2">
            <code className="flex-1 text-xs text-[var(--color-text)]">{code}</code>
            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded px-2 py-1 text-xs transition-colors"
              style={{
                background: copied ? 'var(--color-accent-soft)' : 'var(--color-surface-3)',
                color: copied ? 'var(--color-accent)' : 'inherit',
              }}
            >
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>

          <button
            type="button"
            onClick={reset}
            className="text-center text-xs opacity-40 hover:opacity-80"
          >
            Réinitialiser au défaut
          </button>
        </div>
      )}
    </>
  )
}
