#!/usr/bin/env bash
set -euo pipefail

# Configure Cloudflare Workers Builds for zhanghaocong/homepage -> Worker "homepage"
# Requires a USER-scoped API token with:
# - Workers Builds Configuration: Edit
# - Workers Scripts: Read
#
# Create at: https://dash.cloudflare.com/profile/api-tokens
#
# Prerequisite: Install the Cloudflare GitHub App once via Dashboard:
# Workers > homepage > Settings > Builds > Connect > GitHub

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-8b7eba6c480b84cad297f995413afd14}"
WORKER_TAG="${WORKER_TAG:-966c8ba3fca54315bb8fbaea11368061}"
GITHUB_USER_ID="${GITHUB_USER_ID:-180445}"
GITHUB_USER_NAME="${GITHUB_USER_NAME:-zhanghaocong}"
REPO_ID="${REPO_ID:-1247520791}"
REPO_NAME="${REPO_NAME:-homepage}"

if [[ -z "${CLOUDFLARE_BUILDS_API_TOKEN:-}" ]]; then
  echo "Set CLOUDFLARE_BUILDS_API_TOKEN to a user API token with Workers Builds Configuration: Edit"
  exit 1
fi

API="https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}"
AUTH=(-H "Authorization: Bearer ${CLOUDFLARE_BUILDS_API_TOKEN}" -H "Content-Type: application/json")

echo "Creating repository connection..."
CONNECTION=$(curl -sS -X PUT "${API}/builds/repos/connections" "${AUTH[@]}" \
  -d "{\"provider_type\":\"github\",\"provider_account_id\":\"${GITHUB_USER_ID}\",\"provider_account_name\":\"${GITHUB_USER_NAME}\",\"repo_id\":\"${REPO_ID}\",\"repo_name\":\"${REPO_NAME}\"}")

echo "$CONNECTION" | python3 -c "import sys,json; r=json.load(sys.stdin); print('success:', r.get('success')); print('errors:', r.get('errors')); print('repo_connection_uuid:', (r.get('result') or {}).get('repo_connection_uuid'))"

REPO_CONNECTION_UUID=$(echo "$CONNECTION" | python3 -c "import sys,json; r=json.load(sys.stdin); print((r.get('result') or {}).get('repo_connection_uuid',''))")

if [[ -z "$REPO_CONNECTION_UUID" ]]; then
  echo "Failed to create repository connection."
  exit 1
fi

echo "Listing build tokens..."
TOKENS=$(curl -sS "${API}/builds/tokens" -H "Authorization: Bearer ${CLOUDFLARE_BUILDS_API_TOKEN}")
echo "$TOKENS" | python3 -c "import sys,json; r=json.load(sys.stdin); print('success:', r.get('success')); [print(t.get('build_token_uuid'), t.get('build_token_name')) for t in (r.get('result') or [])]"

BUILD_TOKEN_UUID=$(echo "$TOKENS" | python3 -c "import sys,json; r=json.load(sys.stdin); items=r.get('result') or []; print(items[0]['build_token_uuid'] if items else '')")

if [[ -z "$BUILD_TOKEN_UUID" ]]; then
  echo "No build token found. Create one in Dashboard: Worker homepage > Settings > Builds > API token"
  exit 1
fi

echo "Creating production trigger for main..."
TRIGGER=$(curl -sS -X POST "${API}/builds/triggers" "${AUTH[@]}" \
  -d "{\"external_script_id\":\"${WORKER_TAG}\",\"repo_connection_uuid\":\"${REPO_CONNECTION_UUID}\",\"build_token_uuid\":\"${BUILD_TOKEN_UUID}\",\"trigger_name\":\"Deploy production\",\"build_command\":\"npm run build\",\"deploy_command\":\"npx wrangler deploy\",\"root_directory\":\"/\",\"branch_includes\":[\"main\"],\"branch_excludes\":[],\"path_includes\":[\"*\"],\"path_excludes\":[]}")

echo "$TRIGGER" | python3 -c "import sys,json; r=json.load(sys.stdin); print('success:', r.get('success')); print('errors:', r.get('errors')); print('trigger_uuid:', (r.get('result') or {}).get('trigger_uuid'))"

TRIGGER_UUID=$(echo "$TRIGGER" | python3 -c "import sys,json; r=json.load(sys.stdin); print((r.get('result') or {}).get('trigger_uuid',''))")

if [[ -z "$TRIGGER_UUID" ]]; then
  echo "Failed to create production trigger."
  exit 1
fi

echo "Triggering initial build..."
BUILD=$(curl -sS -X POST "${API}/builds/triggers/${TRIGGER_UUID}/builds" "${AUTH[@]}" \
  -d '{"branch":"main"}')

echo "$BUILD" | python3 -c "import sys,json; r=json.load(sys.stdin); print('success:', r.get('success')); print('errors:', r.get('errors')); print('build_uuid:', (r.get('result') or {}).get('build_uuid'))"

echo "Done. Monitor builds in Dashboard: Workers > homepage > Deployments"
