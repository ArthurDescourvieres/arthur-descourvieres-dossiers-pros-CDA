#!/usr/bin/env bash
# Nightly encrypted backup of the Memo production stack → Hetzner Storage Box.
#
# Runs ON the VPS (DB/Redis are not exposed to the host, so we go through the
# containers). Produces two GPG-encrypted artifacts per run:
#   - db-<ts>.dump.gpg      : pg_dump custom format of the application database
#   - uploads-<ts>.tar.gz.gpg : the attachments volume
# then rsyncs them to the Storage Box over SSH and prunes old local copies.
#
# Restore procedure: docs/runbooks/restore.md
#
# Configuration is read from the same .env as docker-compose.prod.yml, plus the
# backup-specific variables below. Schedule via cron, e.g.:
#   15 3 * * *  cd /opt/memo && bash infra/backup/backup.sh >> /var/log/memo-backup.log 2>&1
set -euo pipefail

# --- Configuration ----------------------------------------------------------
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
BACKUP_DIR="${BACKUP_DIR:-/opt/memo/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

# Load POSTGRES_* and the backup secrets from the deployment env file.
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a && . "$ENV_FILE" && set +a
fi

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is required (symmetric GPG key)}"
: "${STORAGE_BOX_USER:?STORAGE_BOX_USER is required (e.g. u123456)}"
: "${STORAGE_BOX_HOST:?STORAGE_BOX_HOST is required (e.g. u123456.your-storagebox.de)}"
STORAGE_BOX_PORT="${STORAGE_BOX_PORT:-23}"
STORAGE_BOX_PATH="${STORAGE_BOX_PATH:-backups/memo}"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"
DB_FILE="$BACKUP_DIR/db-$TS.dump.gpg"
UP_FILE="$BACKUP_DIR/uploads-$TS.tar.gz.gpg"

dc() { docker compose -f "$COMPOSE_FILE" "$@"; }
encrypt() { gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase "$BACKUP_PASSPHRASE"; }

echo "[$(date -u)] backup start ($TS)"

# --- 1. Database (pg_dump custom format, owner role) ------------------------
dc exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" db \
  pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB" | encrypt > "$DB_FILE"
echo "  db dump   -> $DB_FILE ($(du -h "$DB_FILE" | cut -f1))"

# --- 2. Uploads volume (streamed through the api container) -----------------
dc exec -T api tar -czf - -C /app/uploads . | encrypt > "$UP_FILE"
echo "  uploads   -> $UP_FILE ($(du -h "$UP_FILE" | cut -f1))"

# --- 3. Off-site transfer (Hetzner Storage Box over SSH) --------------------
rsync -av -e "ssh -p $STORAGE_BOX_PORT -o StrictHostKeyChecking=accept-new" \
  "$DB_FILE" "$UP_FILE" \
  "$STORAGE_BOX_USER@$STORAGE_BOX_HOST:$STORAGE_BOX_PATH/"
echo "  off-site  -> $STORAGE_BOX_HOST:$STORAGE_BOX_PATH/"

# --- 4. Local retention -----------------------------------------------------
find "$BACKUP_DIR" -name '*.gpg' -mtime "+$RETENTION_DAYS" -print -delete
echo "[$(date -u)] backup done; local copies older than ${RETENTION_DAYS}d pruned"
