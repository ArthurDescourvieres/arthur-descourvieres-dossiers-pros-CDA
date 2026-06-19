import { useLayoutEffect } from 'react'
import { usePointerParallax, useScrollParallax, useRevealOnScroll } from './useParallax'
import { WindowFrame } from './WindowFrame'
import { AppMockup } from './AppMockup'
import { LandingSections } from './LandingSections'
import { MemoLogo } from '../MemoLogo'

/**
 * La landing garde son identité sombre quel que soit le thème choisi ailleurs :
 * on force `data-theme='dark'` tant qu'elle est affichée, puis on restaure la
 * préférence de l'utilisateur en la quittant (ex. vers Login). useLayoutEffect
 * pour basculer avant le premier paint et éviter tout flash.
 */
function useForcedDarkLanding() {
  useLayoutEffect(() => {
    const root = document.documentElement
    const previous = root.dataset.theme === 'light' ? 'light' : 'dark'
    root.dataset.theme = 'dark'
    return () => {
      root.dataset.theme = previous
    }
  }, [])
}

export type LandingProps = {
  /** Open the auth screen in register mode. */
  onRegister: () => void
  /** Open the auth screen in login mode. */
  onLogin: () => void
}

export function Landing({ onRegister, onLogin }: LandingProps) {
  const scrollRef = useScrollParallax<HTMLDivElement>()
  useRevealOnScroll(scrollRef)
  useForcedDarkLanding()

  return (
    <div className="landing" ref={scrollRef}>
      <LandingNav onRegister={onRegister} onLogin={onLogin} />
      <div className="lp-grid-bg">
        <Hero onRegister={onRegister} />
      </div>
      <LandingSections onRegister={onRegister} />
    </div>
  )
}

function LandingNav({ onRegister, onLogin }: LandingProps) {
  return (
    <header className="lp-nav">
      <div className="lp-nav-inner">
        <span className="lp-brand">
          <MemoLogo size={26} />
          Memo
        </span>
        <nav className="lp-nav-actions">
          <button type="button" className="lp-btn lp-btn-ghost" onClick={onLogin}>
            Se connecter
          </button>
          <button type="button" className="lp-btn lp-btn-primary" onClick={onRegister}>
            Créer un compte
          </button>
        </nav>
      </div>
    </header>
  )
}

function Hero({ onRegister }: { onRegister: () => void }) {
  const visualRef = usePointerParallax<HTMLDivElement>()
  const seeProduct = () =>
    document.getElementById('decouvrir')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <section className="lp-hero">
      <div className="lp-hero-text" data-reveal>
        <h1 className="lp-title">
          Prends tes notes,
          <br />
          pas la tête.
        </h1>
        <p className="lp-subtitle">
          Memo est un espace de notes open source et léger. Tu crées un espace, tu écris, tu glisses
          tes images. Zéro configuration.
        </p>
        <div className="lp-hero-actions">
          <button type="button" className="lp-btn lp-btn-primary lp-btn-lg" onClick={onRegister}>
            Créer mon espace
          </button>
          <button type="button" className="lp-btn lp-btn-ghost lp-btn-lg" onClick={seeProduct}>
            Voir Memo en action
          </button>
        </div>
        <p className="lp-hero-note">Gratuit · Open source · Sans carte bancaire</p>
      </div>

      <div className="lp-hero-visual" data-reveal>
        <div className="lp-hero-frame" ref={visualRef}>
          <WindowFrame className="lp-win-hero">
            <AppMockup />
          </WindowFrame>
        </div>
      </div>
    </section>
  )
}
