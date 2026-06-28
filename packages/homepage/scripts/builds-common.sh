# Shared helpers for Cloudflare Workers Builds scripts.
# Expects SCRIPT_DIR to be set by the caller.

# shellcheck source=builds-config.sh
source "${SCRIPT_DIR}/builds-config.sh"

resolve_builds_api_token() {
  if [[ -n "${CLOUDFLARE_BUILDS_API_TOKEN:-}" ]]; then
    echo "Using CLOUDFLARE_BUILDS_API_TOKEN"
    return 0
  fi

  if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    CLOUDFLARE_BUILDS_API_TOKEN="${CLOUDFLARE_API_TOKEN}"
    echo "Using CLOUDFLARE_API_TOKEN"
    return 0
  fi

  local wrangler_config="${HOME}/Library/Preferences/.wrangler/config/default.toml"
  if [[ -f "${wrangler_config}" ]]; then
    local api_token
    api_token=$(python3 -c "
import pathlib, re, sys
text = pathlib.Path(sys.argv[1]).read_text()
for key in ('api_token', 'oauth_token'):
    match = re.search(rf'{key}\\s*=\\s*\"([^\"]+)\"', text)
    if match:
        print(match.group(1))
        break
" "${wrangler_config}")

    if [[ -n "${api_token}" ]]; then
      CLOUDFLARE_BUILDS_API_TOKEN="${api_token}"
      echo "Using wrangler token from ${wrangler_config}"
      return 0
    fi
  fi

  echo "No Cloudflare API token found."
  echo "Set CLOUDFLARE_BUILDS_API_TOKEN (recommended) or CLOUDFLARE_API_TOKEN."
  echo "Wrangler OAuth from 'wrangler login' usually lacks Workers Builds Configuration: Edit."
  return 1
}

init_builds_api() {
  resolve_builds_api_token
  API="https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}"
  AUTH=(-H "Authorization: Bearer ${CLOUDFLARE_BUILDS_API_TOKEN}")
}
