## Security Review: Wave 72 PR2 BIO obtain pins (`out/w72/pr2/probe.mjs`)

### Risk Level: Low

### Summary

Pin-only probe. No `src/` write from this worker. Obtain law is already live in `shipyard.js` / `hangar.js`. XSS is N/A (Node probe, no DOM, no `innerHTML`). No 🔴 CRITICAL or 🟠 HIGH findings.

### Findings

None.

### Passed Checks

- [x] No secrets, API keys, tokens, or credentials in the probe
- [x] No `src/` edit by this worker (`src/game/shipyard.js` and `src/game/origins.js` git-clean; only sibling persist dirties `src/game/hangar.js`)
- [x] No new `localStorage` key; probe sets `ship.object` to `null` so `requestAutosave` returns before storage
- [x] `execSync` git commands are fixed strings (`git diff --name-only -- src`, cached name-only, `git status --porcelain -- src`); no interpolated user input
- [x] `readFileSync` only for `src/game/shipyard.js`, `src/game/hangar.js`, `src/game/origins.js` under repo root
- [x] No `innerHTML`, no `eval`, no new frozen `ctx.js` event
- [x] Mock `reputation` bags use literal faction keys (`beautiful`, `unknowables`, `freehold`); no `for…in` assignment from a blob
- [x] Prototype: `yardStockFor` return is a `slice()`; probe mutates the copy and re-reads catalog
- [x] XSS N/A for this PR (no UI, no world strings)
- [x] N/A: auth, sessions, SQL, RLS, CSP, wallet, admin endpoints (local sim)

### Recommendations

1. Keep gift id `hull_seed_gift` absent until an owner-approved serial PR. Probe pin 12 fails closed if it appears in the three named files.
2. Do not let a later catalog PR add Beautiful / Unknowables `frigate` without a BIO owner sign-off (contract §8). Pins 1, 2, 7, 8 fail that SKU.

### Positive Observations

- Buy success and refuse paths assert hangar length and credits (no silent row, no silent debit on refuse).
- Unknowables force `'living'` is pinned on the purchased row, not only on `hullKindFor`.
- Worker src pin allows sibling PR1 `hangar.js` grafted allowlist and still fails if this worker touches `shipyard.js` or `origins.js`.
