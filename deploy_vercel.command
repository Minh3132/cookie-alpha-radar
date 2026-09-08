#!/bin/zsh
set -euo pipefail
cd "$(dirname "$0")"
echo "This deploys Cookie Alpha Radar to Vercel."
npm install --no-audit --no-fund
npm run build
npx --yes vercel@latest --prod
