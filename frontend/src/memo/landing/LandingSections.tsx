import { Link } from 'react-router-dom'
import { MemoIcon } from '../MemoIcon'

type Feature = { icon: string; title: string; text: string }

const FEATURES: Feature[] = [
  {
    icon: 'feather',
    title: 'Éditeur riche',
    text: 'Titres, listes, blocs de code et images : un éditeur qui suit le fil de votre pensée.',
  },
  {
    icon: 'layers',
    title: 'Tout organisé',
    text: 'Espaces, dossiers et notes pour structurer vos projets sans jamais vous perdre.',
  },
  {
    icon: 'users',
    title: 'En temps réel',
    text: 'Rédigez à plusieurs, voyez qui est présent et suivez chaque modification en direct.',
  },
  {
    icon: 'search',
    title: 'Recherche instantanée',
    text: 'Retrouvez n’importe quelle note en un clin d’œil grâce à la recherche plein texte (⌘K).',
  },
  {
    icon: 'image',
    title: 'Pièces jointes',
    text: 'Glissez vos images et fichiers directement au bon endroit dans vos notes.',
  },
  {
    icon: 'shield',
    title: 'Sécurisé',
    text: 'Comptes protégés, sessions révocables et partage contrôlé par invitation.',
  },
]

export function Features() {
  return (
    <section className="lp-features">
      <div className="lp-section-head" data-reveal>
        <span className="lp-eyebrow">L’essentiel, rien de superflu</span>
        <h2 className="lp-h2">Une boîte à outils complète pour écrire</h2>
        <p className="lp-section-text">
          De la première idée à la note partagée, Memo réunit tout ce qu’il faut dans une interface
          épurée.
        </p>
      </div>
      <div className="lp-grid-cards">
        {FEATURES.map((f, i) => (
          <article
            className="lp-card"
            key={f.title}
            data-reveal
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <span className="lp-card-icon">
              <MemoIcon name={f.icon} size={22} strokeWidth={1.6} />
            </span>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function Showcase() {
  return (
    <section className="lp-showcase">
      <div className="lp-section-head" data-reveal>
        <span className="lp-eyebrow">Pensé pour la concentration</span>
        <h2 className="lp-h2">Une interface qui s’efface devant vos idées</h2>
        <p className="lp-section-text">
          Pas de fioritures, juste vos mots. Memo garde le décor discret pour laisser toute la place
          à l’écriture.
        </p>
      </div>

      <div className="lp-mock" data-reveal>
        <div className="lp-mock-bar">
          <span />
          <span />
          <span />
        </div>
        <div className="lp-mock-body">
          <aside className="lp-mock-side">
            <i className="act" />
            <i />
            <i />
            <i />
            <i />
          </aside>
          <div className="lp-mock-main">
            <div className="lp-mock-title" />
            <div className="lp-mock-line s" />
            <div className="lp-mock-line m" />
            <div className="lp-mock-line s" />
            <div className="lp-mock-chip" />
            <div className="lp-mock-line m" />
            <div className="lp-mock-line x" />
          </div>
        </div>
      </div>
    </section>
  )
}

export function FinalCta({ onRegister }: { onRegister: () => void }) {
  return (
    <section className="lp-cta">
      <div className="lp-cta-inner" data-reveal>
        <span className="lp-eyebrow">Commencez dès aujourd’hui</span>
        <h2 className="lp-h2">Prêt à donner de la clarté à vos idées ?</h2>
        <button type="button" className="lp-btn lp-btn-primary lp-btn-lg" onClick={onRegister}>
          Créer un compte gratuitement
        </button>
      </div>
    </section>
  )
}

export function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-inner">
        <span className="lp-brand lp-brand-sm">
          <span className="lp-brand-mark" aria-hidden />
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
        <span>© 2026 Memo — Vos idées, au clair.</span>
      </div>
    </footer>
  )
}
