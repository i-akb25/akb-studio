#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" || -z "${BACKUP_ENCRYPTION_PASSPHRASE:-}" ]]; then
  echo "DATABASE_URL and BACKUP_ENCRYPTION_PASSPHRASE are required." >&2
  exit 1
fi

if (( ${#BACKUP_ENCRYPTION_PASSPHRASE} < 24 )); then
  echo "BACKUP_ENCRYPTION_PASSPHRASE must contain at least 24 characters." >&2
  exit 1
fi

backup_name="akb-studio-$(date -u +%Y%m%dT%H%M%SZ).sql.gz.enc"
pg_dump "${DATABASE_URL}" --no-owner --no-privileges \
  | gzip -9 \
  | openssl enc -aes-256-cbc -salt -pbkdf2 \
      -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
      -out "${backup_name}"

echo "${backup_name}"
