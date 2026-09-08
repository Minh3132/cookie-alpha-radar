# Changelog

## 0.4.1

- Replaced deprecated legacy bridge links with the current Hyperlane bridge (`hyperlane.cookiescan.io`) per official Cookie Chain docs.
- Added `submission_audit.command` for build, syntax, endpoint, and secret-string checks.
- Added `FINAL_CHECKLIST.md` for Nightly, chain-evidence, deployment, and submission steps.

## 0.4.0

- Added judge-path readiness panel for live feed, wallet, watch proof, and swap evidence.
- Added local evidence journal with JSON/CSV export for confirmed and failed actions.
- Smart Swap now re-quotes server-side immediately before build and returns a fresh quote summary.
- Client validates fresh route identity, quote deterioration, and versioned transaction fee payer before wallet signing.
- Added explicit signature-status polling after broadcast and better timeout guidance.
- Removed unused raw aggregator route payloads from the browser quote response.


## 0.3.1
- Added wallet intelligence: native COOK balance, CookieScan DAS holdings and recent RPC signatures.
- Added high-risk acknowledgement before enabling swaps on HIGH risk rows.
- Added an explicit, clearly labeled demo fixture for upstream outages; demo rows cannot trade or write proofs.
- Tightened Node runtime requirement to Vite 7's supported range.

## 0.2.2
- Added dual-router quote/swap flow using Cookiebox and Candy Shop.
- Server-side Candy Shop re-quote before transaction build.
- Exact decimal-to-raw integer conversion and separated alpha/risk models.
- CookieScan live price-stream merge with polling fallback.
