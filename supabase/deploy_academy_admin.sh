#!/usr/bin/env bash
set -euo pipefail

project_ref="${1:-}"

if [[ -z "$project_ref" ]]; then
  echo "Usage: ./supabase/deploy_academy_admin.sh <project-ref>"
  exit 1
fi

if [[ ! -f "supabase/functions/.env.local" ]]; then
  echo "Missing supabase/functions/.env.local"
  exit 1
fi

npx --yes supabase@latest secrets set \
  --env-file supabase/functions/.env.local \
  --project-ref "$project_ref"

npx --yes supabase@latest functions deploy academy-admin \
  --project-ref "$project_ref" \
  --no-verify-jwt

echo "Academy admin secrets and Edge Function deployed."
