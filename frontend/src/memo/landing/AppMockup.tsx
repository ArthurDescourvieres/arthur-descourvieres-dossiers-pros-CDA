import { MemoLogo } from '../MemoLogo'
import { MemoIcon } from '../MemoIcon'

/**
 * Reproduction statique et stylisée de l'interface connectée (sidebar + note),
 * affichée dans le hero pour montrer le produit sans dépendre d'une capture.
 * Calquée sur WorkspaceShell : sidebar (recherche, dossiers, espaces) + éditeur.
 */
export function AppMockup() {
  return (
    <div className="lp-app" aria-hidden>
      <aside className="lp-app-side">
        <div className="lp-app-brand">
          <MemoLogo size={16} />
          <strong>Memo</strong>
        </div>

        <div className="lp-app-search">
          <MemoIcon name="search" size={13} strokeWidth={1.6} />
          <span>Rechercher…</span>
          <kbd>⌘K</kbd>
        </div>

        <div className="lp-app-sec">Dossiers</div>
        <ul className="lp-app-tree">
          <li className="lp-app-folder lp-is-open">
            <MemoIcon name="chevron-down" size={13} strokeWidth={1.8} />
            <MemoIcon name="folder" size={13} strokeWidth={1.6} />
            Cours
          </li>
          <li className="lp-app-note lp-lvl">
            <MemoIcon name="file-text" size={13} strokeWidth={1.6} />
            Merise — MCD
          </li>
          <li className="lp-app-note lp-lvl lp-is-active">
            <MemoIcon name="file-text" size={13} strokeWidth={1.6} />
            React — les hooks
          </li>
          <li className="lp-app-note lp-lvl">
            <MemoIcon name="file-text" size={13} strokeWidth={1.6} />
            Docker Compose
          </li>
          <li className="lp-app-folder">
            <MemoIcon name="chevron-right" size={13} strokeWidth={1.8} />
            <MemoIcon name="folder" size={13} strokeWidth={1.6} />
            Stage
          </li>
          <li className="lp-app-folder">
            <MemoIcon name="chevron-right" size={13} strokeWidth={1.8} />
            <MemoIcon name="folder" size={13} strokeWidth={1.6} />
            Projets perso
          </li>
        </ul>

        <div className="lp-app-spaces">
          <span className="lp-app-space lp-is-active">BTS SIO</span>
          <span className="lp-app-space">Perso</span>
          <span className="lp-app-space lp-app-add">
            <MemoIcon name="plus" size={14} strokeWidth={2} />
          </span>
        </div>
      </aside>

      <main className="lp-app-main">
        <h3 className="lp-app-title">React — les hooks essentiels</h3>
        <p className="lp-app-p">
          useState garde l'état local d'un composant. useEffect synchronise avec l'extérieur :
          requêtes, abonnements, minuteurs.
        </p>
        <figure className="lp-app-fig">
          <div className="lp-app-fig-flow">
            <span>Montage</span>
            <i />
            <span>Rendu</span>
            <i />
            <span>Nettoyage</span>
          </div>
          <figcaption>Cycle de vie d'un composant</figcaption>
        </figure>
        <p className="lp-app-p">
          Règle d'or : un hook ne s'appelle qu'au niveau racine du composant — jamais dans une
          condition.
        </p>
      </main>
    </div>
  )
}
