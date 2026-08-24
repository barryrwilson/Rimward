## Security Review: yard-preview

### Risk Level: Low

### Summary
The Yard turntable is a look-only dock widget. It does not debit, remount, or write save state. After the lifecycle fixes, no CRITICAL or HIGH issues remain in the worker scope.

### Findings

#### 🟢 LOW: Asset prime uses dock faction/classKey
**Location:** `src/systems/yard-preview.js:203-224`
**Issue:** `primeShipAsset(spec.faction, spec.classKey, 'trader')` follows the existing NPC asset path. Faction and class come from `listYardOffers` / `dockFactionOf`, not from free-typed HTML. `ship-assets.js` already canonicalizes faction and class. A corrupt save cannot inject markup because the desk uses `textContent` via `h()`.
**Impact:** Extra asset fetches only, not XSS.
**Fix:** None required in this worker. Keep canonicalization in `ship-assets.js`.
**Justification:** Existing asset loader contract; not introduced as a new trust boundary.

### Passed Checks
- [x] No secrets, API keys, or credentials in the new module
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `yard-preview.js` or `shipyard-desk.js`
- [x] Preview hosts and canvases use `textContent` helpers and `aria-hidden`
- [x] Canvas is not focusable (`tabIndex = -1`); Digit keys stay on the station listener
- [x] Buy path is unchanged: Confirm papers still calls `purchaseYardHull`; preview does not debit
- [x] Living SKUs do not load Beautiful NPC GLBs
- [x] Prime failure is swallowed so the desk cannot hang
- [x] Renderer dispose on empty views; in-flight plated builds `releaseShipAsset` if the pane is gone

### Recommendations
1. Keep preview look-only. Do not wire Digit keys to the canvas.
2. Do not call `configureShipAssets` from this module (it would steal the game KTX2 renderer).
