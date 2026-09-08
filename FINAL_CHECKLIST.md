# Cookie Alpha Radar — final submission checklist

## Automated
- [ ] `./submission_audit.command` passes.
- [ ] `npm run check` passes.
- [ ] `npm run build` passes.
- [ ] Public GitHub repository is accessible.
- [ ] Public Vercel URL loads without local environment variables.

## Nightly / chain evidence
- [ ] Nightly appears in Wallet Standard selector.
- [ ] `Set Nightly → Cookie` switches to `https://rpc.cookiescan.io`.
- [ ] Connected COOK balance loads.
- [ ] CookieScan DAS holdings load (or honest degraded state is shown).
- [ ] At least one Watch Proof is confirmed and opens on CookieScan.
- [ ] If demonstrating Smart Swap, use a deliberately tiny amount; fresh re-quote, fee-payer validation, simulation, broadcast, and confirmation are all visible.
- [ ] Activity Journal JSON is exported and retained as evidence.

## Submission packet
- [ ] Replace every `TBD` in `SUBMISSION.md`.
- [ ] Include live URL.
- [ ] Include GitHub URL.
- [ ] Include at least one confirmed transaction URL.
- [ ] Record a short demo following the numbered demo sequence.
- [ ] Publish the required X thread and include live app + repo.
- [ ] Share required social link with the Cookie Chain community if the bounty page still requires it at submission time.

## Safety
- [ ] Use a separate low-value testing wallet.
- [ ] Verify the official RPC is `https://rpc.cookiescan.io`.
- [ ] Use the current Hyperlane bridge at `https://hyperlane.cookiescan.io`; do not use the deprecated legacy bridge flow.
- [ ] Never paste a seed phrase or private key into the app, terminal scripts, repository, or submission.
