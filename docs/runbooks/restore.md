# Runbook — Restauration de la production Memo

> **Créé le 16/06/2026.** Procédure de restauration des sauvegardes produites par
> [`infra/backup/backup.sh`](../../infra/backup/backup.sh) (pg_dump chiffré +
> volume `uploads`, déposés sur la Hetzner Storage Box).
>
> ⚠️ **Une procédure de restauration n'est crédible que si elle a été déroulée pour de
> vrai.** Tant que le _journal_ en bas de ce fichier ne contient pas une ligne datée,
> le dossier ne doit **pas** affirmer qu'une restauration a été testée.

## Pré-requis

- Accès SSH au VPS et au compte Storage Box (port 23).
- Le fichier `.env` de prod présent dans `/opt/memo` (contient `BACKUP_PASSPHRASE`,
  `POSTGRES_*`, `MIGRATE_DATABASE_URL`).
- `gpg` installé sur la machine qui déchiffre.

> **Drill local (stack jetable)** — pour valider la procédure sans VPS ni Storage Box,
> remplacer `docker-compose.prod.yml` par `docker-compose.yml` dans toutes les commandes
> ci-dessous et démarrer une stack isolée :
> ```bash
> docker compose -p memo-restoredrill -f docker-compose.yml up -d db redis api
> ```
> Sauter les étapes 1 (rsync Storage Box) et 2 (déchiffrement GPG) : produire le
> dump directement avec `pg_dump … -f /tmp/db.dump` dans le conteneur, puis
> `docker cp` pour le rapatrier sur l'hôte. La vérification health utilise
> `http://localhost:3000/api/health` au lieu de `https://$DOMAIN/api/health`.
> Détruire la stack une fois terminé : `docker compose -p memo-restoredrill down -v`.

## Objectifs de reprise

| Indicateur | Cible | Justification |
|---|---|---|
| RPO (perte de données max) | ≤ 24 h | sauvegarde nocturne quotidienne |
| RTO (temps de remise en service) | ≤ 1 h | restauration manuelle déroulée ci-dessous |

## Procédure

Toutes les commandes se lancent depuis `/opt/memo` sur le VPS, sauf indication contraire.

### 1. Récupérer les artefacts depuis la Storage Box

```bash
# Lister les sauvegardes disponibles
ssh -p 23 "$STORAGE_BOX_USER@$STORAGE_BOX_HOST" ls -1 backups/memo/

# Rapatrier le couple voulu (même horodatage <ts>)
TS=20260616T030000Z   # ← choisir l'horodatage à restaurer
rsync -e 'ssh -p 23' \
  "$STORAGE_BOX_USER@$STORAGE_BOX_HOST:backups/memo/db-$TS.dump.gpg" \
  "$STORAGE_BOX_USER@$STORAGE_BOX_HOST:backups/memo/uploads-$TS.tar.gz.gpg" .
```

### 2. Déchiffrer

```bash
gpg --batch --decrypt --passphrase "$BACKUP_PASSPHRASE" "db-$TS.dump.gpg"      > db.dump
gpg --batch --decrypt --passphrase "$BACKUP_PASSPHRASE" "uploads-$TS.tar.gz.gpg" > uploads.tar.gz
```

### 3. Restaurer la base

> Couper l'API d'abord pour éviter les écritures concurrentes.

```bash
docker compose -f docker-compose.prod.yml stop api

# pg_restore se connecte en propriétaire (DDL nécessaire) → MIGRATE_DATABASE_URL.
# --clean --if-exists remet le schéma à plat avant de réinjecter les données.
docker compose -f docker-compose.prod.yml exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" db \
  pg_restore --clean --if-exists --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < db.dump
```

### 4. Restaurer les uploads

```bash
# Réinjecte le contenu du tar dans le volume monté par l'API.
docker compose -f docker-compose.prod.yml run --rm -T \
  -v "$PWD/uploads.tar.gz:/restore/uploads.tar.gz:ro" api \
  sh -c 'rm -rf /app/uploads/* && tar -xzf /restore/uploads.tar.gz -C /app/uploads'
```

### 5. Redémarrer et vérifier

```bash
docker compose -f docker-compose.prod.yml up -d api
curl -fsS https://$DOMAIN/api/health        # doit répondre {"status":"ok"}
```

- [ ] `/api/health` répond `ok`.
- [ ] Connexion à un compte existant OK (la base utilisateurs est revenue).
- [ ] Une note connue s'ouvre avec son contenu.
- [ ] Une pièce jointe connue se télécharge (les uploads sont revenus).

### 6. Nettoyage

```bash
shred -u db.dump uploads.tar.gz db-$TS.dump.gpg uploads-$TS.tar.gz.gpg
```

## Journal des restaurations testées

> À remplir **après avoir réellement déroulé** la procédure (idéalement sur un VPS
> jetable ou une stack locale). C'est cette ligne datée que le dossier pourra citer.

| Date | Opérateur | Source (`<ts>`) | RTO mesuré | Résultat | Notes |
|---|---|---|---|---|---|
| 2026-06-23 | Arthur Descourvieres | drill local | 51 s | ✅ OK | Drill local stack jetable (`-p memo-restoredrill`, `docker-compose.yml`) ; GPG + rsync Storage Box sautés (non disponibles en local) ; checklist 4/4 : health `ok`, login OK, note + contenu sentinel retrouvés, pièce jointe téléchargeable. |
