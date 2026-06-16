# Déploiement de Memo

Guide opérationnel de la chaîne de livraison : VPS Hetzner unique, Caddy en
frontal, images publiées sur GHCR, déploiement déclenché par `main`.

## Architecture cible

```
                Internet (443/80)
                       │
                 ┌─────▼─────┐   TLS Let's Encrypt (auto)
                 │   Caddy   │   sert le build Vite (/srv)
                 │  (web)    │   reverse-proxy /api/* et /socket.io/*
                 └─────┬─────┘
        ┌──────────────┼───────────────┐   réseau Docker interne
        │              │               │   (db et redis NON exposés)
   ┌────▼────┐   ┌─────▼─────┐   ┌─────▼─────┐
   │   api   │   │    db     │   │   redis   │
   │  Hono   │──▶│ Postgres  │   │  Redis 7  │
   │ :3000   │   │    16     │   │           │
   └─────────┘   └───────────┘   └───────────┘
```

Seuls les ports **80/443** de Caddy sont publiés. Postgres et Redis ne sont
joignables que par l'API, sur le réseau interne.

## Flux CI/CD

| Étape | Déclencheur | Ce qui se passe |
|---|---|---|
| **CI** (`ci.yml`) | PR + push `main` | typecheck + tests unit + tests d'intégration (PG/Redis éphémères) ; sur `main` : build + push des images sur **GHCR** (tags `latest` et `sha-<commit>`) |
| **Deploy** (`deploy.yml`) | CI verte sur `main` (auto) ou manuel | SSH vers le VPS → `pull` → `prisma migrate deploy` → `up -d` |

Le tag `sha-<commit>` est **immuable** → un rollback = relancer Deploy en
ciblant le SHA précédent.

---

## Mise en place (une seule fois)

### 1 · VPS Hetzner

- Hetzner Cloud → **Add Server** : Ubuntu 24.04, type **CX22** (2 vCPU / 4 Go),
  localisation Falkenstein.
- Ajouter **ta clé SSH personnelle** à la création (pour administrer la machine).
- Noter l'**IP publique**.
- **Firewall** (Hetzner Cloud → Firewalls) : n'autoriser en entrée que **22**,
  **80**, **443** ; tout le reste fermé.

### 2 · Docker sur le VPS

```bash
# connecté en SSH sur le VPS
curl -fsSL https://get.docker.com | sh        # Docker + plugin compose v2
sudo useradd -m -s /bin/bash deploy            # user de déploiement dédié
sudo usermod -aG docker deploy                 # peut piloter Docker sans sudo
sudo mkdir -p /opt/memo && sudo chown deploy:deploy /opt/memo
```

### 3 · Storage Box (backups)

- Commander une **Storage Box BX11** (la plus petite).
- Noter l'hôte et l'utilisateur SSH : ils alimentent `STORAGE_BOX_HOST` /
  `STORAGE_BOX_USER` du script `infra/backup/backup.sh` (cf. *Sauvegarde*).

### 4 · DNS chez Hostinger

Zone DNS de `derroce.com` → ajouter **un seul** enregistrement :

| Type | Nom | Valeur | TTL |
|---|---|---|---|
| A | `memo` | `<IP publique du VPS>` | par défaut |

Le portfolio (`@`, `www`) n'est pas touché. Vérifier la propagation :

```bash
dig +short memo.derroce.com      # doit renvoyer l'IP du VPS
```

### 5 · Fichier d'environnement sur le VPS

```bash
# en tant que `deploy`, dans /opt/memo
# copier .env.prod.example du dépôt → .env, puis remplir TOUTES les valeurs
nano /opt/memo/.env
chmod 600 /opt/memo/.env         # accès restreint, jamais commité
```

Générer un `JWT_SECRET` solide : `openssl rand -base64 48`.

### 6 · Clé SSH de déploiement (GitHub → VPS)

Sur ta machine (ou le VPS), générer une paire **dédiée au CI**, sans passphrase :

```bash
ssh-keygen -t ed25519 -C "github-deploy-memo" -f deploy_key
```

- La **publique** `deploy_key.pub` → l'ajouter dans
  `/home/deploy/.ssh/authorized_keys` sur le VPS.
- La **privée** `deploy_key` → secret GitHub `VPS_SSH_KEY` (étape suivante).

### 7 · Secrets GitHub

Dépôt → **Settings → Secrets and variables → Actions → New repository secret** :

| Secret | Valeur |
|---|---|
| `VPS_HOST` | IP publique du VPS |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | contenu **intégral** de la clé privée `deploy_key` |

### 8 · Images GHCR en lecture

Au premier push sur `main`, la CI publie les images dans GHCR (privées par
défaut). Pour que le VPS puisse les `pull` sans identifiants :

- GitHub → **Packages** → `…-backend` et `…-web` → **Package settings** →
  **Change visibility → Public**.

> Si tu préfères garder les images privées : crée un PAT `read:packages` et
> ajoute un `docker login ghcr.io` sur le VPS (cf. note en bas).

---

## Première mise en production

1. Fusionner une PR sur `main` → la CI build et pousse les images.
2. Rendre les deux packages **publics** (étape 8).
3. Vérifier que `/opt/memo/.env` est rempli et que `docker-compose.prod.yml` +
   `Caddyfile` y sont (le workflow les y dépose ; pour un tout premier essai
   manuel, tu peux les `scp` toi-même).
4. **Actions → Deploy → Run workflow** (ou attendre le déclenchement auto après
   la CI).
5. Ouvrir **https://memo.derroce.com** : l'app répond, le certificat
   Let's Encrypt est délivré (peut prendre ~30 s au tout premier accès).

Diagnostic sur le VPS :

```bash
cd /opt/memo
docker compose -f docker-compose.prod.yml ps        # tous "healthy" ?
docker compose -f docker-compose.prod.yml logs -f caddy
docker compose -f docker-compose.prod.yml logs -f api
```

## Déploiement courant

`git push` → PR → merge sur `main`. La CI puis le Deploy s'enchaînent seuls.
Aucune action manuelle.

## Rollback

**Actions → Deploy → Run workflow** → renseigner `image_tag` avec le
`sha-<commit>` de la version saine. Compose redescend sur ce tag immuable.

---

## Sauvegarde & restauration

Câblé (piloté en parallèle) : [infra/backup/backup.sh](../../infra/backup/backup.sh)
produit un `pg_dump` chiffré (GPG AES256) + une archive du volume `uploads`, les
transfère sur la Storage Box et applique une rétention locale. À planifier en
cron sur le VPS :

```bash
15 3 * * *  cd /opt/memo && ./infra/backup/backup.sh >> /var/log/memo-backup.log 2>&1
```

Variables à ajouter dans `/opt/memo/.env` : `BACKUP_PASSPHRASE`,
`STORAGE_BOX_USER`, `STORAGE_BOX_HOST` (+ `STORAGE_BOX_PORT` / `STORAGE_BOX_PATH`
au besoin). Restauration : [docs/runbooks/restore.md](../runbooks/restore.md) —
**à dérouler réellement et dater** (exigence du dossier : une sauvegarde jamais
restaurée n'est qu'une présomption de sauvegarde).

## Décisions & notes

- **Deux rôles PostgreSQL** (moindre privilège) : l'API tourne en `memo_app`
  (DML seul, aucun DDL) via `DATABASE_URL`, tandis que les migrations Prisma
  s'exécutent en owner `memo` via `MIGRATE_DATABASE_URL`. Le rôle `memo_app` est
  provisionné au 1er init par
  [infra/postgres/init/10-app-role.sh](../../infra/postgres/init/10-app-role.sh)
  (avec `ALTER DEFAULT PRIVILEGES`, donc l'accès couvre aussi les tables créées
  ensuite par les migrations).
- **Prisma CLI conservé dans l'image de prod** (déplacé en `dependencies`) pour
  que le service one-shot `migrate` puisse exécuter `prisma migrate deploy`.
- **Images privées (option)** : sur le VPS,
  `echo "<PAT>" | docker login ghcr.io -u <user> --password-stdin` une fois ;
  le `pull` du workflow réutilisera alors le login stocké.
