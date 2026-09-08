# Changelog

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
