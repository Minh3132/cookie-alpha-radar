# Cookie Alpha Radar 🍪📡

Cookie Alpha Radar is a Cookie Chain-native cApp that turns the ecosystem's live market data into an explainable opportunity board, then lets a connected wallet stamp a selected signal on-chain as a verifiable watch proof.

## Why this exists

Most dashboards stop at charts. Cookie Alpha Radar closes the loop:

1. **Discover** — read live token/market data from the CookieScan APIs.
2. **Explain** — rank assets with a transparent score based on liquidity, 24h flow, turnover and volatility.
3. **Verify** — inspect the mint on CookieScan or jump to CookieSwap.
4. **Act** — compare Cookiebox vs Candy Shop routes, sign in your own wallet, simulate, then swap on Cookie Chain.
5. **Prove** — optionally write a compact watch proof using the genesis Memo program.

The app does **not** fabricate market values when an upstream feed is unavailable. A degraded feed is shown explicitly.

## Bounty requirements covered

- ✅ Cookie Chain SVM / official RPC (`https://rpc.cookiescan.io`)
- ✅ Nightly / Wallet Standard wallet connectivity
- ✅ Connected wallet visible via the wallet adapter UI
- ✅ Real Cookie Chain transaction execution capability
- ✅ Confirmation handling and transaction errors surfaced to the user
- ✅ Application-specific live market data and scoring dashboard
- ✅ CookieScan token links
- ✅ Cookiebox + Candy Shop dual-aggregator quote comparison
- ✅ Non-custodial swap build → wallet sign → simulation → broadcast → confirm
- ✅ CookieSwap and bridge routes
- ✅ Evidence journal with JSON/CSV export for confirmed + failed actions
- ✅ Judge-path readiness panel for quick bounty verification
- ✅ Open-source, deployable web app

## Smart swap flow

The app includes a serverless quote/build proxy for the same two Cookie Chain aggregators used by the official `cookie-mcp` project:

- Cookiebox aggregator: `https://agg.cookiebox.app`
- Candy Shop / CookieScan swap API: `https://swap.cookiescan.io/api`

Flow: **quote both → rank net output → server-side re-quote selected route → build unsigned transaction → wallet signs locally → simulate on Cookie Chain RPC → broadcast only after a clean simulation → confirm**.

For Candy Shop, the build endpoint deliberately ignores any route echoed back by the browser and fetches a fresh route server-side before transaction construction. For both aggregators, the browser validates the fresh route identity, output deterioration against the chosen slippage, and the v0 transaction fee payer before wallet signing.

No private key is sent to the site or serverless functions.

## On-chain watch proof

Click **Watch on-chain** for any asset. The app submits a Memo transaction to Cookie Chain's genesis Memo program:

`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`

Memo shape:

```text
cookie-alpha-radar:v1|watch=<TOKEN_MINT>|symbol=<SYMBOL>|score=<0-100>
```

When a user chooses to broadcast and the transaction confirms, the signature is added to the local Activity panel and links to CookieScan.

This is intentionally low-risk: the transaction proves meaningful app interaction without asking the user to hand a private key to the website or forcing a token swap.

## Data sources

- Cookie Chain RPC: `https://rpc.cookiescan.io`
- CookieScan REST/DAS: `https://api.cookiescan.io`
- Primary market candidates: `/v1/assets/trending`, fallback `/api/tokens`
- Health: `/api/status`, fallback direct RPC slot check

The normalizer is defensive because the registry is evolving. Unknown/missing market fields remain `null` and render as `—` rather than being invented.

## Scoring model

The **Alpha score** is intentionally simple and auditable:

- liquidity depth: positive
- 24h trading flow: positive
- liquidity / market-cap ratio: positive or negative
- volume / market-cap turnover: positive
- extreme 24h price volatility: negative

**Risk is calculated separately from Alpha.** It penalizes thin/missing liquidity, weak liquidity-to-cap structure, missing flow and extreme volatility. This prevents a fast-moving token from being labeled “low risk” merely because it has strong momentum. The band is still only a market-structure signal — not a smart-contract audit or investment recommendation.

## Nightly network setup

Cookie Chain requires Nightly support for the bounty. The app uses Wallet Standard discovery and includes a **Set Nightly → Cookie** helper. It requests Nightly to switch to Cookie Chain using the chain's live `getGenesisHash()` plus:

- RPC: `https://rpc.cookiescan.io`
- WebSocket: `https://wss.cookiescan.io`

The user still approves the network switch in Nightly.

## Local development

Requirements: Node 20+.

```bash
npm install
npm run dev

# For local testing of the serverless quote/swap endpoints, use Vercel dev:
# npx vercel dev
```

Open the Vite URL, install Nightly, and add/switch to Cookie Chain when prompted.

### Build

```bash
npm run check
npm run build
npm run preview
```

## Environment

Copy `.env.example` to `.env` only if overriding defaults:

```bash
VITE_COOKIE_RPC=https://rpc.cookiescan.io
VITE_COOKIE_API=https://api.cookiescan.io
VITE_COOKIE_WS=wss://api.cookiescan.io/stream
```

No private keys or server secrets are needed.

## Deploy

The UI is a Vite app and the dual-router quote/build proxy uses `/api` serverless functions. **Vercel is the recommended deployment target** so the Smart Router works in production without exposing cross-origin aggregator assumptions to the browser.

For Vercel:

- Build command: `npm run build`
- Output directory: `dist`

## Evidence journal

Every user-initiated Watch Proof and Smart Swap attempt can be recorded locally in the browser, including success/failure states when execution occurs. The journal can export JSON or CSV for the bounty submission packet. It stores transaction evidence and human-readable errors only — never wallet secrets.

## Security notes

- Never asks for or stores a seed phrase/private key.
- Transaction signing stays in the user's wallet.
- No arbitrary program IDs or transaction payloads come from the market API.
- Watch proofs use a fixed Memo program ID from the Cookie Chain genesis program list.
- No synthetic prices are substituted when CookieScan is unavailable.

## Roadmap before final bounty submission

- [ ] Validate Nightly network-switch + Memo transaction with a funded low-value Cookie Chain wallet.
- [x] Add 5-second CookieScan WebSocket price/volume ticks with automatic reconnect; REST polling remains the fallback.
- [x] Add Cookiebox/Candy Shop quote comparison.
- [x] Add wallet-signed, pre-broadcast simulated swap execution.
- [x] Add submission evidence journal + judge-path readiness panel.
- [ ] Deploy public build.
- [ ] Record demo and publish required X thread.
- [ ] Share X thread in Cookie Chain Telegram.

## Official references

- https://docs.cookiechain.wtf
- https://api.cookiescan.io
- https://cookiescan.io
- https://cookieswap.fun
- https://hyperlane.cookiescan.io
- https://nightly.app

---

Built for the Superteam **Create an App on Cookie Chain** bounty.


## Submission disclosure

The app contains real transaction execution paths, but the project submission does not claim that the author personally broadcast a mainnet transaction unless a real signature is explicitly provided. The demo may stop before broadcast.
