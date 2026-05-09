#!/usr/bin/env bash
# Tägliches DB-Backup, gpg-verschlüsselt, hochgeladen zu IONOS Object Storage
# In Cron eintragen: 0 3 * * * /opt/lba/infra/backup.sh

set -euo pipefail

DATE=$(date +%F)
BACKUP_FILE="/opt/lba/infra/backups/lba-$DATE.sql.gz"
ENCRYPTED="$BACKUP_FILE.gpg"

# Dump + gzip
docker exec $(docker ps -qf "name=postgres") \
  pg_dump -U lba lba | gzip > "$BACKUP_FILE"

# gpg-verschlüsseln (öffentlicher Schlüssel muss importiert sein)
gpg --batch --yes --recipient backup@example.de --encrypt "$BACKUP_FILE"
rm "$BACKUP_FILE"

# Upload zu IONOS Object Storage (s3cmd o.ä. konfiguriert)
s3cmd put "$ENCRYPTED" s3://lba-backups/

# Lokale Backups älter als 7 Tage löschen
find /opt/lba/infra/backups -name "*.gpg" -mtime +7 -delete

echo "✓ Backup $DATE abgeschlossen"
