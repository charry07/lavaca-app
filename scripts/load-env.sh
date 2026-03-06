#!/usr/bin/env zsh
set -euo pipefail

ENV_FILE="${1:-.env.cli.local}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

echo "Loaded env from $ENV_FILE"
