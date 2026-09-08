#!/bin/zsh
set -euo pipefail
cd "$(dirname "$0")"
command -v gh >/dev/null || { echo "[STOP] GitHub CLI (gh) is required."; exit 1; }
gh auth status >/dev/null
OWNER="$(gh api user --jq .login)"
REPO="$OWNER/cookie-alpha-radar"
if [ ! -d .git ]; then
  git init
  git branch -M main
  git add .
  git commit -m "feat: launch Cookie Alpha Radar cApp"
else
  git add .
  if ! git diff --cached --quiet; then
    git commit -m "feat: harden Cookie Alpha Radar cApp"
  fi
fi
if gh repo view "$REPO" >/dev/null 2>&1; then
  echo "[INFO] $REPO already exists."
  git remote remove origin >/dev/null 2>&1 || true
  git remote add origin "https://github.com/$REPO.git"
  gh auth setup-git >/dev/null 2>&1 || true
  git push -u origin main
else
  echo "[INFO] Creating public GitHub repository $REPO ..."
  gh repo create "$REPO" --public --source=. --remote=origin --push \
    --description "Cookie Chain live alpha radar with Nightly wallet support, dual-router swaps and on-chain watch proofs"
fi
echo "[OK] https://github.com/$REPO"
