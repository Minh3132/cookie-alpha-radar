#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

echo "======================================================================"
echo " Cookie Alpha Radar · submission audit"
echo "======================================================================"

NODE_FULL="$(node -p 'process.versions.node')"
NODE_OK="$(node -e 'const [M,m]=process.versions.node.split(".").map(Number); process.stdout.write(String((M===20&&m>=19)||(M===22&&m>=12)||M>22))')"
echo "[1/6] Node: v$NODE_FULL"
if [ "$NODE_OK" != "true" ]; then
  echo "[FAIL] Node 20.19+ or 22.12+ is required by Vite 7."
  exit 1
fi

echo "[2/6] TypeScript check"
npm run check

echo "[3/6] Production build"
npm run build

echo "[4/6] Shell + serverless syntax"
bash -n setup_and_run.command publish_github.command deploy_vercel.command submission_audit.command
node --check api/quote.js
node --check api/swap-tx.js

echo "[5/6] Canonical Cookie Chain endpoint audit"
grep -q "https://rpc.cookiescan.io" src/lib/config.ts
grep -q "https://hyperlane.cookiescan.io" src/lib/config.ts
if grep -R "bridge.cookiescan.io" README.md SUBMISSION.md src --exclude-dir=node_modules >/dev/null 2>&1; then
  echo "[FAIL] Deprecated bridge.cookiescan.io reference remains."
  exit 1
fi
if grep -R "PRIVATE_KEY\|SEED_PHRASE\|SECRET_KEY" src api --exclude-dir=node_modules >/dev/null 2>&1; then
  echo "[WARN] Secret-like identifier found; inspect before publishing."
else
  echo "[OK] No private-key/seed identifiers in app/serverless source."
fi

echo "[6/6] Manual evidence still required"
echo "  □ Connect Nightly on Cookie Chain"
echo "  □ Confirm a low-cost Watch Proof tx"
echo "  □ Confirm one tiny Smart Swap only if you choose to trade"
echo "  □ Export Activity JSON"
echo "  □ Deploy public URL"
echo "  □ Record demo + X thread"
echo "  □ Fill live URL / repo / tx signature in SUBMISSION.md"
echo
echo "[OK] Automated submission audit passed."
