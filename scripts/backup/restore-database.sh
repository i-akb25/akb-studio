#!/usr/bin/env bash
set -euo pipefail

backup_file="${1:-}"
if [[ -z "${backup_file}" || ! -f "${backup_file}" ]]; then
  echo "Usage: restore-database.sh <encrypted-export.sql.gz.enc>" >&2
  exit 1
fi
if [[ -z "${RESTORE_TARGET_URL:-}" || -z "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ]]; then
  echo "RESTORE_TARGET_URL and BACKUP_ENCRYPTION_PASSPHRASE are required." >&2
  exit 1
fi
if [[ "${RESTORE_TARGET_URL}" == "${DATABASE_URL:-}" ]]; then
  echo "Refusing to restore into the source database." >&2
  exit 1
fi
if [[ "${RESTORE_TARGET_URL,,}" != *test* && "${RESTORE_TARGET_URL,,}" != *restore* ]]; then
  echo "Restore targets must be clearly named as a test or restore database." >&2
  exit 1
fi

openssl enc -d -aes-256-cbc -pbkdf2 \
  -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  -in "${backup_file}" \
  | gzip -dc \
  | psql "${RESTORE_TARGET_URL}" --set ON_ERROR_STOP=on

psql "${RESTORE_TARGET_URL}" --set ON_ERROR_STOP=on --tuples-only --command \
  'SELECT COUNT(*) FROM "_prisma_migrations";'

echo "Restore verification completed against the isolated target."
