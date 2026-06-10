#!/bin/sh
set -eu

PROJECT_DIR="${PROJECT_DIR:-/usr/documents/projects/bolaov2}"
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/.env}"
BACKUP_DIR="${BACKUP_DIR:-/usr/documents/backups/bolaov2/postgres}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-bolaov2-db}"

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

POSTGRES_DB="${POSTGRES_DB:-bolaov2}"
POSTGRES_USER="${POSTGRES_USER:-bolaov2}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"

mkdir -p "$BACKUP_DIR"

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_file="$BACKUP_DIR/bolaov2-$timestamp.dump"
tmp_file="$BACKUP_DIR/.bolaov2-$timestamp.dump.tmp"

cleanup() {
  rm -f "$tmp_file"
}
trap cleanup EXIT

docker exec \
  -e "PGPASSWORD=$POSTGRES_PASSWORD" \
  "$POSTGRES_CONTAINER" \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc \
  > "$tmp_file"

mv "$tmp_file" "$backup_file"
chmod 600 "$backup_file"

find "$BACKUP_DIR" \
  -type f \
  -name "bolaov2-*.dump" \
  -mtime "+$BACKUP_RETENTION_DAYS" \
  -delete

echo "Backup salvo em $backup_file"
