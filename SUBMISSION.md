# Superteam submission packet — draft

## One-line pitch
Cookie Alpha Radar turns Cookie Chain market data into explainable alpha + risk signals, compares Cookiebox and Candy Shop execution, and lets users either swap safely or stamp a signal on-chain as a verifiable watch proof.

## What makes it different
- Not a passive dashboard: discovery can end in a wallet-signed swap or a confirmed on-chain watch proof.
- Dual-router execution: Cookiebox and Candy Shop are compared by output before the user signs.
- Explainable Alpha + separate risk model: momentum is never treated as safety.
- Fail-honest data handling: missing upstream values stay missing.
- Nightly-first flow: explicit Cookie Chain network switch helper.
- Low-risk on-chain UX: demonstrates meaningful transaction execution without forcing a swap.
- Wallet intelligence: native COOK balance, CookieScan DAS holdings and recent on-chain signatures after Nightly connects.
- Outage resilience: a clearly labeled synthetic fixture is opt-in only and cannot execute transactions.

## Required links to fill before submission
- Live app: TBD
- GitHub: TBD
- Program: `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`
- Example confirmed watch transaction: TBD

## Demo sequence
1. Open Alpha Board and show CookieScan-backed token rows.
2. Explain one score: liquidity + flow + turnover − volatility.
3. Click a mint → CookieScan.
4. Connect Nightly.
5. Use “Set Nightly → Cookie” and approve custom network.
6. Click “Watch on-chain”.
7. Approve the Memo transaction.
8. Show confirmed signature in Activity and open it on CookieScan.
9. Show wallet intelligence: COOK balance, DAS assets and recent Cookie Chain signatures.
10. Open Smart Swap, compare Cookiebox vs Candy Shop, and show the build → wallet sign → simulate → broadcast status flow with a tiny test amount.
10. Show the bridge guide for obtaining COOK.

## X thread draft outline
1. Hook: “Dashboards tell you what happened. Cookie Alpha Radar lets you stamp what you spotted on-chain.”
2. Explain live market radar.
3. Explain transparent alpha/risk score.
4. Video/GIF: Nightly connect → watch proof → CookieScan confirmation.
5. Tech: CookieScan APIs + Cookie Chain RPC + Wallet Standard + Memo program.
6. Safety: no private keys, no fake fallback prices, wallet signs locally.
7. Bridge guide: direct users to https://bridge.cookiescan.io before they need COOK for fees.
8. Live app + repo links.

## Smart Router upgrade
The app also compares the same two Cookie Chain aggregation paths used by the official cookie-mcp project:
- Cookiebox Aggregator (`agg.cookiebox.app`)
- Candy Shop / CookieScan Swap API (`swap.cookiescan.io/api`)

Swap safety flow: quote → build unsigned v0 transaction → wallet review/sign → Cookie RPC simulation → only then broadcast and confirm.
