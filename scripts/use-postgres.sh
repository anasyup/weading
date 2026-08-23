#!/usr/bin/env bash
# Switch the platform from SQLite (dev preview) to PostgreSQL (production).
# Usage:  bash scripts/use-postgres.sh <DATABASE_URL>
# Example:
#   bash scripts/use-postgres.sh "postgresql://user:pass@host:5432/noor_bridal?sslmode=require"
set -euo pipefail

URL="${1:?Usage: use-postgres.sh <postgres-url>}"
SCHEMA="prisma/schema.prisma"

if ! grep -q 'provider = "sqlite"' "$SCHEMA"; then
  echo "Schema already on PostgreSQL — pushing only."
else
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA"
  echo "Schema provider switched: sqlite → postgresql"
fi

echo "DATABASE_URL=\"$URL\"" > .env
npx prisma generate
npx prisma db push
echo
echo "✓ PostgreSQL ready. Next: npx tsx prisma/seed.ts   (demo data)"
echo "  To switch back to the dev preview:"
echo "    sed -i 's/provider = \"postgresql\"/provider = \"sqlite\"/' $SCHEMA"
echo "    echo 'DATABASE_URL=\"file:./dev.db\"' > .env && npx prisma generate"
