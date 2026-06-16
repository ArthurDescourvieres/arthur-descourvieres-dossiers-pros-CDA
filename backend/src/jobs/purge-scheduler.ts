import { purgeService } from '../services/purge.service.js'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Planificateur interne du job de purge RGPD. Désactivé par défaut (notamment en
 * test) ; activé via `PURGE_SCHEDULER=on`. En production on peut aussi préférer un
 * cron système branché sur `npm run purge` — les deux appellent le même service.
 */
export function startPurgeScheduler(): void {
  if (process.env.PURGE_SCHEDULER !== 'on') return

  const run = () => {
    void purgeService
      .purgeDeactivatedAccounts()
      .catch((err) => console.error('[purge] échec planifié :', err))
  }

  run() // un premier passage au démarrage
  // `unref` : ce timer n'empêche pas le process de se terminer proprement.
  setInterval(run, DAY_MS).unref()
}
