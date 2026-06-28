#!/usr/bin/env bash
set -euo pipefail

# List successful preview Workers Builds and their preview URLs.
# Requires a USER-scoped API token with Workers Builds Configuration: Read (or Edit).
#
# Usage:
#   ./scripts/list-preview-builds.sh [--branch BRANCH] [--limit N] [--all]
#
# From repo root:
#   pnpm run builds:previews
#   pnpm run builds:previews -- --branch preview/builds-test

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
ENV_FILE="${REPO_ROOT}/.env"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "${ENV_FILE}"
  set +a
fi

# shellcheck source=builds-common.sh
source "${SCRIPT_DIR}/builds-common.sh"

BRANCH_FILTER="${BRANCH:-}"
PER_PAGE="${PER_PAGE:-50}"
ALL_PAGES=0

usage() {
  cat <<'EOF'
Usage: list-preview-builds.sh [--branch BRANCH] [--limit N] [--all]

List successful non-production Workers Builds and fetch preview_url for each.

Options:
  --branch BRANCH   Only show builds for this git branch
  --limit N         Builds per API page (default: 50)
  --all             Fetch all pages (default: first page only)
  -h, --help        Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --)
      shift
      ;;
    --branch)
      BRANCH_FILTER="${2:-}"
      shift 2
      ;;
    --limit)
      PER_PAGE="${2:-}"
      shift 2
      ;;
    --all)
      ALL_PAGES=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

init_builds_api

export ACCOUNT_ID WORKER_TAG PREVIEW_TRIGGER_UUID PRODUCTION_BRANCH
export CLOUDFLARE_BUILDS_API_TOKEN BRANCH_FILTER PER_PAGE ALL_PAGES

python3 <<'PY'
import json
import os
import sys
import urllib.error
import urllib.request

ACCOUNT_ID = os.environ["ACCOUNT_ID"]
WORKER_TAG = os.environ["WORKER_TAG"]
TOKEN = os.environ["CLOUDFLARE_BUILDS_API_TOKEN"]
PREVIEW_TRIGGER_UUID = os.environ.get("PREVIEW_TRIGGER_UUID", "")
PRODUCTION_BRANCH = os.environ.get("PRODUCTION_BRANCH", "main")
BRANCH_FILTER = os.environ.get("BRANCH_FILTER", "")
PER_PAGE = int(os.environ.get("PER_PAGE", "50"))
ALL_PAGES = os.environ.get("ALL_PAGES", "0") == "1"

API = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}


def api_get(url: str) -> dict:
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.load(resp)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"API error {exc.code}: {body}", file=sys.stderr)
        sys.exit(1)

    if not data.get("success", False):
        print(f"API request failed: {json.dumps(data, ensure_ascii=False)}", file=sys.stderr)
        sys.exit(1)
    return data


def list_builds(page: int) -> dict:
    url = f"{API}/builds/workers/{WORKER_TAG}/builds?per_page={PER_PAGE}&page={page}"
    return api_get(url)


def get_build_detail(build_uuid: str) -> dict:
    return api_get(f"{API}/builds/builds/{build_uuid}")


def matches_preview_build(build: dict) -> bool:
    if build.get("build_outcome") != "success":
        return False

    meta = build.get("build_trigger_metadata") or {}
    branch = meta.get("branch", "")
    if branch == PRODUCTION_BRANCH:
        return False
    if BRANCH_FILTER and branch != BRANCH_FILTER:
        return False

    if PREVIEW_TRIGGER_UUID:
        trigger_uuid = (build.get("trigger") or {}).get("trigger_uuid", "")
        if trigger_uuid != PREVIEW_TRIGGER_UUID:
            return False

    return True


rows: list[tuple[str, str, str, str]] = []
page = 1

while True:
    data = list_builds(page)
    builds = data.get("result") or []

    for build in builds:
        if not matches_preview_build(build):
            continue

        build_uuid = build["build_uuid"]
        meta = build.get("build_trigger_metadata") or {}
        branch = meta.get("branch", "")
        created = build.get("created_on", "")

        detail = get_build_detail(build_uuid)
        preview_url = (detail.get("result") or {}).get("preview_url") or ""
        rows.append((created, branch, build_uuid, preview_url))

    info = data.get("result_info") or {}
    if not ALL_PAGES or not info.get("next_page"):
        break
    page += 1

rows.sort(key=lambda row: row[0], reverse=True)

if not rows:
    print("No matching preview builds found.", file=sys.stderr)
    sys.exit(0)

print(f"{'CREATED':<28}  {'BRANCH':<30}  {'PREVIEW_URL'}")
print(f"{'-' * 28}  {'-' * 30}  {'-' * 40}")
for created, branch, build_uuid, preview_url in rows:
    preview = preview_url or "(no preview_url)"
    print(f"{created:<28}  {branch:<30}  {preview}")
PY
