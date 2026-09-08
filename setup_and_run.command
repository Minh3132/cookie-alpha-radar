#!/bin/zsh
set -euo pipefail
cd "$(dirname "$0")"
echo "======================================================================"
echo " Cookie Alpha Radar · local build + run"
echo "======================================================================"
command -v node >/dev/null || { echo "[STOP] Node.js 20+ is required."; exit 1; }
echo "[1/4] Installing dependencies..."
npm install --no-audit --no-fund
echo "[2/4] TypeScript check..."
npm run check
echo "[3/4] Production build..."
npm run build
echo "[4/4] Starting local app..."
echo "Open the URL printed by Vite below."
npm run dev
