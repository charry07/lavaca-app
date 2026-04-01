#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"

echo "[1/4] Running workspace typecheck"
pnpm typecheck

echo "[2/4] Running workspace lint"
pnpm lint

echo "[3/4] Checking required files"
for file in \
  "supabase/migrations/202603050001_initial_schema.sql" \
  "supabase/seed.sql" \
  "frontend/src/services/api.ts"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing required file: $file" >&2
    exit 1
  fi
done

echo "[4/4] Script folder quick audit"
ls -1 script/storage/*.sql > /dev/null

echo "Pre-review checks completed successfully."
