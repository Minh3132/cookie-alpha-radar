#!/bin/zsh
set -euo pipefail
cd "$(dirname "$0")"
echo "======================================================================"
echo " Cookie Alpha Radar · local build + run"
echo "======================================================================"
command -v node >/dev/null || { echo "[STOP] Node.js is required."; exit 1; }
NODE_OK="$(node -e 'const [M,m]=process.versions.node.split(".").map(Number); process.stdout.write(String((M===20&&m>=19)||M>=22))')"
if [ "$NODE_OK" != "true" ]; then
  echo "[STOP] Vite 7 requires Node 20.19+ or 22.12+. Current: $(node -v)"
  exit 1
fi
echo "[INFO] Node $(node -v) · npm $(npm -v)"
echo "[1/4] Installing dependencies..."
npm install --no-audit --no-fund
echo "[2/4] TypeScript check..."
npm run check
echo "[3/4] Production build..."
if ! npm run build; then
  echo ""
  echo "[HINT] If the error says the esbuild install script was blocked, run:"
  echo "       npm approve-scripts esbuild && npm install && npm run build"
  exit 1
fi
echo "[4/4] Starting local app..."
echo "Open the URL printed by Vite below."
npm run dev
