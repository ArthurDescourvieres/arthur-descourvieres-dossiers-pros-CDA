import { type RefObject } from 'react'
import { usePointerParallax, useScrollParallax, useRevealOnScroll } from './useParallax'
import { Features, Showcase, FinalCta, LandingFooter } from './LandingSections'

export type LandingProps = {
  /** Open the auth screen in register mode. */
  onRegister: () => void
  /** Open the auth screen in login mode. */
  onLogin: () => void
}

export function Landing({ onRegister, onLogin }: LandingProps) {
  const scrollRef = useScrollParallax<HTMLDivElement>()
  const heroRef = usePointerParallax<HTMLElement>()
  useRevealOnScroll(scrollRef)

  return (
    <div className="landing" ref={scrollRef}>
      <LandingNav onRegister={onRegister} onLogin={onLogin} />
      <Hero heroRef={heroRef} onRegister={onRegister} onLogin={onLogin} />
      <Features />
      <Showcase />
      <FinalCta onRegister={onRegister} />
      <LandingFooter />
    </div>
  )
}

function LandingNav({ onRegister, onLogin }: LandingProps) {
  return (
    <header className="lp-nav">
      <div className="lp-nav-inner">
        <span className="lp-brand">
          <span className="lp-brand-mark" aria-hidden />
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

type HeroProps = LandingProps & { heroRef: RefObject<HTMLElement> }

function Hero({ heroRef, onRegister, onLogin }: HeroProps) {
  return (
    <section className="lp-hero" ref={heroRef}>
      <div className="lp-hero-bg" aria-hidden>
        <span className="lp-orb lp-orb-1" />
        <span className="lp-orb lp-orb-2" />
        <span className="lp-orb lp-orb-3" />
        <span className="lp-grid" />
      </div>

      <div className="lp-hero-content" data-reveal>
        <span className="lp-eyebrow">Votre espace de travail pour penser</span>
        <h1 className="lp-title">
          Vos notes,
          <br />
          <span className="lp-title-accent">enfin lumineuses.</span>
        </h1>
        <p className="lp-subtitle">
          Memo réunit un éditeur riche, l’organisation par espaces et la collaboration en temps réel
          dans une interface qui s’efface devant vos idées.
        </p>
        <div className="lp-hero-actions">
          <button type="button" className="lp-btn lp-btn-primary lp-btn-lg" onClick={onRegister}>
            Créer un compte
          </button>
          <button type="button" className="lp-btn lp-btn-ghost lp-btn-lg" onClick={onLogin}>
            J’ai déjà un compte
          </button>
        </div>
        <p className="lp-hero-note">Gratuit · Aucune carte bancaire requise</p>
      </div>

      <span className="lp-scroll-cue" aria-hidden />
    </section>
  )
}
