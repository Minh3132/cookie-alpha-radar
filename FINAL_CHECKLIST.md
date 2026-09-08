# Cookie Alpha Radar — final submission checklist

## Automated
- [ ] `./submission_audit.command` passes.
- [ ] `npm run check` passes.
- [ ] `npm run build` passes.
- [ ] Public GitHub repository is accessible.
- [ ] Public Vercel URL loads without local environment variables.

## Nightly / chain capability
- [ ] Nightly appears in Wallet Standard selector.
- [ ] `Set Nightly → Cookie` switches to `https://rpc.cookiescan.io`.
- [ ] Connected COOK balance loads.
- [ ] CookieScan DAS holdings load (or honest degraded state is shown).
- [ ] Watch Proof transaction construction/status UI is demonstrated; broadcasting is optional for this no-tx submission.
- [ ] Smart Swap demonstrates fresh re-quote, fee-payer validation and transaction-ready flow. Do not claim broadcast/confirmation unless it actually occurred.
- [ ] Activity Journal behavior is demonstrated; do not present synthetic or unbroadcast entries as confirmed chain evidence.

## Submission packet
- [ ] Replace every `TBD` in `SUBMISSION.md`.
- [ ] Include live URL.
- [ ] Include GitHub URL.
- [ ] Do not include a transaction URL unless it is a real confirmed transaction.
- [ ] Record a short demo following the numbered demo sequence.
- [ ] Publish the required X thread and include live app + repo.
- [ ] Share required social link with the Cookie Chain community if the bounty page still requires it at submission time.

## Safety
- [ ] Use a separate low-value testing wallet.
- [ ] Verify the official RPC is `https://rpc.cookiescan.io`.
- [ ] Use the current Hyperlane bridge at `https://hyperlane.cookiescan.io`; do not use the deprecated legacy bridge flow.
- [ ] Never paste a seed phrase or private key into the app, terminal scripts, repository, or submission.
