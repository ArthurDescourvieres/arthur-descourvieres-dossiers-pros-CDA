/**
 * Script de purge RGPD à exécuter à la demande ou via cron.
 *
 *   npm run purge                       (en local)
 *   docker compose exec api npm run purge   (en conteneur)
 *
 * Supprime définitivement les comptes désactivés depuis plus de 30 jours
 * (cf. purgeService). Conçu pour être branché sur un cron système / planificateur.
 */
import { purgeService } from '../services/purge.service.js'
import { prisma } from '../lib/prisma.js'
import { redis } from '../lib/redis.js'

async function main() {
  const { purged } = await purgeService.purgeDeactivatedAccounts()
  console.log(`[purge] comptes purgés : ${purged}`)
}

main()
  .catch((err) => {
    console.error('[purge] échec :', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await redis.quit()
  })
