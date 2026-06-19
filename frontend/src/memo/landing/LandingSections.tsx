import { Link } from 'react-router-dom'
import { WindowFrame, VideoSlot } from './WindowFrame'
import { HoverVideo } from './HoverVideo'
import { MemoLogo } from '../MemoLogo'

const GITHUB_URL = 'https://github.com/ArthurDescourvieres/arthur-descourvieres-dossiers-pros-CDA'

export function LandingSections({ onRegister }: { onRegister: () => void }) {
  return (
    <>
      <Stance />
      <div className="lp-grid-bg">
        <Demo
          id="decouvrir"
          title="Un espace par matière."
          text="Crée autant d'espaces que tu veux — cours, stage, projets perso. Range tes notes en dossiers, retrouve-les d'un coup d'œil."
          videoLabel="Démo : créer un espace et naviguer dans la sidebar"
          video={{ src: '/landing/espaces.mp4' }}
        />
        <Demo
          reverse
          annotate
          title="Écris. Glisse une image. C'est noté."
          text="Un éditeur qui va à l'essentiel — titres, listes, blocs de code. Tes captures se posent directement sous le texte, au bon endroit."
          videoLabel="Démo : écrire une note et y glisser une image"
          video={{ src: '/landing/editeur.mp4' }}
        />
        <AndMore />
      </div>
      <OpenSource />
      <div className="lp-grid-bg">
        <FinalCta onRegister={onRegister} />
      </div>
      <LandingFooter />
    </>
  )
}

function Stance() {
  return (
    <section className="lp-stance">
      <div className="lp-stance-inner" data-reveal>
        <h2 className="lp-stance-title">
          Notion fait tout.
          <br />
          Toi, tu veux juste noter.
        </h2>
        <p className="lp-stance-text">
          Les grosses apps te demandent de tout configurer avant d'écrire la première ligne. Memo
          prend le parti inverse : tu ouvres, tu écris.
        </p>
      </div>
    </section>
  )
}

type DemoProps = {
  title: string
  text: string
  videoLabel: string
  video?: { src: string; webm?: string; poster?: string }
  id?: string
  reverse?: boolean
  annotate?: boolean
}

function Demo({ title, text, videoLabel, video, id, reverse, annotate }: DemoProps) {
  return (
    <section className={`lp-demo${reverse ? ' lp-demo--reverse' : ''}`} id={id}>
      <div className="lp-demo-text" data-reveal>
        <h2 className="lp-h2">{title}</h2>
        <p className="lp-section-text">{text}</p>
      </div>
      <div className="lp-demo-visual" data-reveal>
        <WindowFrame>
          {video ? (
            <HoverVideo
              src={video.src}
              webm={video.webm}
              poster={video.poster}
              label={videoLabel}
            />
          ) : (
            <VideoSlot label={videoLabel} />
          )}
        </WindowFrame>
        {annotate && <Annotation />}
      </div>
    </section>
  )
}

function Annotation() {
  return (
    <span className="lp-anno">
      <svg viewBox="0 0 40 40" fill="none" aria-hidden>
        <path
          d="M31 7C31 23 23 31 9 33"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M9 33l8-2M9 33l2-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      glisse ton image ici
    </span>
  )
}

function AndMore() {
  return (
    <p className="lp-also" data-reveal>
      Et aussi : <span>recherche instantanée ⌘K</span> · <span>collaboration en temps réel</span>
    </p>
  )
}

function OpenSource() {
  return (
    <section className="lp-os">
      <div className="lp-os-inner" data-reveal>
        <svg
          className="lp-os-icon"
          viewBox="0 0 24 24"
          width="32"
          height="32"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.52.1.71-.23.71-.5v-1.96c-2.9.63-3.52-1.23-3.52-1.23-.48-1.2-1.16-1.53-1.16-1.53-.95-.65.07-.63.07-.63 1.05.07 1.6 1.08 1.6 1.08.94 1.6 2.46 1.14 3.06.87.1-.68.37-1.14.66-1.4-2.31-.26-4.74-1.16-4.74-5.14 0-1.14.4-2.06 1.07-2.79-.11-.27-.46-1.32.1-2.75 0 0 .88-.28 2.88 1.07a9.9 9.9 0 0 1 5.24 0c2-1.35 2.87-1.07 2.87-1.07.57 1.43.21 2.48.1 2.75.67.73 1.07 1.65 1.07 2.79 0 3.99-2.43 4.87-4.75 5.13.38.33.71.97.71 1.96v2.9c0 .28.19.62.72.5A10.5 10.5 0 0 0 12 1.5Z" />
        </svg>
        <h2 className="lp-h2">Open source, et ça change tout.</h2>
        <p className="lp-section-text">
          Pas de paywall qui débarque un jour, pas de données revendues. Lis le code, contribue, ou
          héberge Memo sur ton propre serveur.
        </p>
        <a
          className="lp-btn lp-btn-ghost lp-btn-lg"
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
        >
          Voir le code sur GitHub
        </a>
      </div>
    </section>
  )
}

function FinalCta({ onRegister }: { onRegister: () => void }) {
  return (
    <section className="lp-final">
      <div className="lp-final-inner" data-reveal>
        <h2 className="lp-h2">Ton prochain cours commence ici.</h2>
        <button type="button" className="lp-btn lp-btn-primary lp-btn-lg" onClick={onRegister}>
          Créer mon espace gratuitement
        </button>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <span className="lp-brand lp-brand-sm">
          <MemoLogo size={18} />
          Memo
        </span>
        <nav style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Link
            to="/mentions-legales"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}
          >
            Mentions légales
          </Link>
          <Link
            to="/confidentialite"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}
          >
            Politique de confidentialité
          </Link>
        </nav>
        <span>© 2026 Memo · Tes notes, au clair.</span>
      </div>
    </footer>
  )
}
