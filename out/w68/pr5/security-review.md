## Security Review: Wave 68 PR5 boot pins

**Scope:** `scripts/boot-test.mjs` (Wave 64 heal pin + WAVE68 weapons block), `out/w68/pr5/probe.mjs`.
**Mode:** Harness audit (no XSS in test, no persist clobber, no live-ctx leak).
**Persona:** security-auditor + orchestrator security-review checklist.
**Pass:** final (no HIGH/CRITICAL to fix).

### Risk Level: Low

### Summary
PR5 only adds boot pins. It does not change `src/**`. WAVE68 uses isolated stub `ctx` objects for persist, papers, and HUD helpers. Digit 8 papers debit on a stub purse, not the live harness world. `purchaseYardHull` on the stub cannot autosave: `requestAutosave` returns false when `ctx.ship.object` is null. Source pins use `readFileSync` and regex, not `eval`. HUD labels are compared as strings; no DOM write.

### Findings

#### 🟢 LOW: stub `purchaseYardHull` still calls `requestAutosave`
**Location:** `scripts/boot-test.mjs` WAVE68 stock pin; `src/game/save.js` `requestAutosave`
**Issue:** Yard buy always requests autosave. A stub with a live `ship.object` would write `localStorage`.
**Impact:** This stub sets `ship: { object: null }`, so autosave returns false. No clobber of the harness autosave key.
**Status:** open — keep `ship.object` null on WAVE68 stubs.
**Justification:** Contract: do not mutate live persist from unit pins.

#### 🟢 LOW: catalog names are not rendered
**Location:** WAVE68 desk/HUD pins
**Issue:** Dart `name` / WPN copy could be HTML if a later pin assigned `innerHTML`.
**Impact:** Pins compare `weaponHudLabel` to `'4 · —'` and papers state. No `innerHTML`.
**Status:** open — harness must keep `textContent` if a live overlay pin is added later.
**Justification:** Desk path uses helpers, not live Digit 8 on the overlay.

### Resolved this pass
Stale Wave 64 pin no longer requires `launcher` to be absent. Invalid `launcher: 1` on a light hull heals to `''`. Nested `loadout` still dropped. Unknown `missiles` still ignored.

### Passed Checks
- [x] No secrets, tokens, or API keys
- [x] No `innerHTML` / `eval` / `document.write` in the new pins
- [x] WAVE68 does not debit live `ctx.world.credits`
- [x] WAVE68 stubs do not write player `launcher` / `turret` / `missileAmmo` onto the live player
- [x] `Object.hasOwn(LAUNCHER_IDS,'dart')` / not `'god'`
- [x] `__proto__` not used as a hangar id in the new pins
- [x] No `missileIncoming` event pin (absence)
- [x] Probe does not edit `src/**`

### Recommendations
1. Keep WAVE68 papers on stub helpers. A live Digit 8 buy on the starter light hull cannot seat dart.
2. Do not give WAVE68 stubs a live `ship.object` unless autosave is mocked.
