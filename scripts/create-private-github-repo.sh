#!/usr/bin/env bash
# 在 GitHub 上从当前项目创建新的私有仓库（需本机 gh 登录且具备 repo 权限）
set -euo pipefail

OWNER="${GITHUB_OWNER:-zhanghaocong}"
REPO_NAME="${GITHUB_REPO_NAME:-homepage-private}"
DESCRIPTION="${GITHUB_REPO_DESCRIPTION:-Private personal homepage (React Router + Cloudflare Workers)}"
REMOTE_NAME="${GIT_REMOTE_NAME:-private}"

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if ! command -v gh >/dev/null 2>&1; then
  echo "请先安装 GitHub CLI: https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "请先登录: gh auth login"
  exit 1
fi

if gh repo view "${OWNER}/${REPO_NAME}" >/dev/null 2>&1; then
  echo "仓库已存在: https://github.com/${OWNER}/${REPO_NAME}"
  exit 1
fi

echo "正在创建私有仓库 ${OWNER}/${REPO_NAME} ..."
gh repo create "${OWNER}/${REPO_NAME}" \
  --private \
  --source="$ROOT" \
  --remote="$REMOTE_NAME" \
  --push \
  --description "$DESCRIPTION"

echo ""
echo "完成: https://github.com/${OWNER}/${REPO_NAME}"
echo "远程名称: ${REMOTE_NAME}（推送: git push ${REMOTE_NAME} main）"
echo ""
echo "若使用 Cloudflare Workers Builds，请在 Dashboard 将构建源改为新仓库。"
