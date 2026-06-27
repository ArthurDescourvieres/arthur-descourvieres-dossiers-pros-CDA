# Runbook — Rétention des logs applicatifs (RGPD, 30 jours)

> **Créé le 27/06/2026.** Met en œuvre la rétention de 30 jours des journaux
> conteneur affirmée au chapitre RGPD du dossier. Deux fichiers la portent :
> [`infra/logrotate/memo`](../../infra/logrotate/memo) (borne **temporelle**, 30 j)
> et le bloc `logging` de
> [`docker-compose.prod.yml`](../../docker-compose.prod.yml) (borne **taille**, garde-fou).
>
> ⚠️ **Une rétention n'est crédible que si elle a été installée et testée sur le
> VPS.** Tant que le _journal_ en bas de ce fichier ne contient pas une ligne
> datée, le dossier ne doit pas affirmer que la purge est en place.

## Finalité (RGPD)

Les journaux applicatifs peuvent contenir des **données à caractère personnel**
(adresse IP du client, métadonnées de requête). Le principe de **limitation de
la conservation** (art. 5.1.e RGPD) impose de ne pas les garder indéfiniment :
la politique retenue est **30 jours glissants, puis purge automatique**.

Cette rétention complète les mécanismes déjà en place côté application
(purge des comptes désactivés à 30 j, anonymisation) : ici on borne la **trace
technique**, pas la donnée métier.

## Où vivent les logs (et pourquoi l'infra est le bon niveau)

```
  Pino (backend/src/lib/logger.ts) ──stdout──▶ Docker (json-file driver)
                                                      │
                                                      ▼
                        /var/lib/docker/containers/<id>/<id>-json.log   (HÔTE)
```

L'application **n'écrit jamais ces fichiers** : elle émet un flux d'événements
sur `stdout` (modèle 12-factor). C'est Docker qui les matérialise sur l'hôte.
La rotation/rétention appartient donc à **qui possède les fichiers — l'hôte** :

| Critère | Purge **applicative** (dans l'API) | Rétention **infra** (logrotate sur l'hôte) ✅ |
|---|---|---|
| Accès aux fichiers | l'app ne les possède pas (stdout only) | agit là où les fichiers existent |
| Couverture | logs de l'API seulement | **tous** les conteneurs (api, caddy, db, redis) |
| Cycle de vie | s'arrête si l'app crash / redéploie (image immuable) | indépendant des conteneurs, survit aux deploys |
| Code à maintenir | scheduler + I/O fichiers dans l'app (surface de bug) | **zéro ligne** de code applicatif |
| Conformité 12-factor | viole « logs = flux, pas stockage » | respecte la séparation des responsabilités |
| Démontrabilité | job opaque à auditer | `logrotate -d` + `ls` des archives datées |

> Conclusion : la purge applicative serait partielle, fragile et redondante avec
> le code. La rétention au niveau hôte est exhaustive, robuste et auditable.

## Les deux bornes (défense en profondeur)

| Borne | Outil | Rôle | Promesse |
|---|---|---|---|
| **Temps** | [`infra/logrotate/memo`](../../infra/logrotate/memo) | `daily` + `rotate 30` + `copytruncate` sur le fichier actif | **30 jours** puis purge — c'est la promesse RGPD |
| **Taille** | `logging:` dans [`docker-compose.prod.yml`](../../docker-compose.prod.yml) | `max-size: 10m` × `max-file: 3` par conteneur | garde-fou disque entre deux passes nocturnes |

logrotate seul ne protège pas d'un pic de logs en pleine journée (il ne tourne
qu'une fois/jour) ; Docker seul ne sait pas borner dans le **temps** (rotation à
la taille). Les deux ensemble couvrent les deux dimensions.

## Installation sur le VPS (une seule fois)

En SSH sur le VPS, en `root` (ou via `sudo`) :

```bash
# Depuis le dépôt déployé (ex. /opt/memo), copier le drop-in logrotate :
cp infra/logrotate/memo /etc/logrotate.d/memo
chown root:root /etc/logrotate.d/memo
chmod 0644 /etc/logrotate.d/memo      # logrotate ignore les fichiers world-writable
```

**Aucun cron à ajouter** : sous Ubuntu, logrotate est déjà déclenché chaque jour
par le système (`/etc/cron.daily/logrotate` ou le timer systemd `logrotate.timer`).
Le drop-in `/etc/logrotate.d/memo` est inclus automatiquement par
`/etc/logrotate.conf`. (À l'inverse de [`infra/backup/backup.sh`](../../infra/backup/backup.sh),
lui à planifier explicitement.)

Le garde-fou Docker, lui, s'applique au **prochain `up -d`** (recréation des
conteneurs) après déploiement du `docker-compose.prod.yml` mis à jour.

## Test / démonstration

```bash
# 1. Simulation à blanc : valide la syntaxe et liste ce qui SERAIT fait,
#    sans rien modifier. (option -d = debug/dry-run)
logrotate -d /etc/logrotate.d/memo

# Variante « chemin réel » (exerce l'inclusion depuis logrotate.conf) :
logrotate -d /etc/logrotate.conf 2>&1 | grep -A3 memo

# 2. Forcer une rotation réelle une fois, en mode verbeux :
logrotate -fv /etc/logrotate.d/memo

# 3. Constater les archives datées créées dans le dossier d'un conteneur :
ls -lh /var/lib/docker/containers/*/ | grep -E '\-json\.log(-[0-9]+)?(\.gz)?'
```

Une rotation forcée une **seconde** fois le même jour est un no-op volontaire
(`dateext` : l'archive du jour existe déjà, logrotate la saute). C'est le
comportement attendu, pas une erreur.

## Vérification

- [ ] `/etc/logrotate.d/memo` présent, `root:root`, `0644`.
- [ ] `logrotate -d /etc/logrotate.d/memo` se termine sans erreur de syntaxe.
- [ ] Après `logrotate -fv …`, au moins une archive `…-json.log-YYYYMMDD(.gz)`
      apparaît sous `/var/lib/docker/containers/*/`.
- [ ] `docker compose -f docker-compose.prod.yml config` montre bien le bloc
      `logging` (`max-size`/`max-file`) sur chaque service.
- [ ] L'API journalise toujours normalement (`docker compose … logs -f api`) —
      le code applicatif est inchangé.

## Limites connues

- **`copytruncate`** : Docker garde le `json-file` ouvert et ne sait pas le
  rouvrir sur signal ; on copie puis on tronque le fichier en place. Quelques
  lignes écrites pendant la fenêtre copie→troncature peuvent être perdues, et la
  toute dernière ligne avant troncature peut être coupée. Compromis standard et
  accepté pour les logs Docker (perte marginale, sans impact RGPD).
- **Fichiers de rotation Docker** (`<id>-json.log.1/.2`) : bornés en taille par
  le garde-fou (`max-file: 3`) et recyclés par Docker, mais **non** soumis à la
  purge temporelle de logrotate (qui ne vise que le fichier actif). Volume
  résiduel négligeable (≤ ~20 Mo/conteneur) et borné ; la trace applicative,
  elle, transite par le fichier actif qui est bien purgé à 30 j.

## Journal des vérifications

> À remplir **après installation réelle sur le VPS**. C'est cette ligne datée que
> le dossier pourra citer pour affirmer que la rétention 30 j est effective.

| Date | Opérateur | `logrotate -d` OK | Rotation forcée OK | Archives datées vues | Notes |
|---|---|---|---|---|---|
| _à remplir_ | _à remplir_ | _à remplir_ | _à remplir_ | _à remplir_ | _non encore installé sur le VPS_ |
