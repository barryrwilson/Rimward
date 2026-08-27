## Security Review: Org01 origin consequence preview (Wave 142 PR1)

### Risk Level: Low

### Summary

PR1 paints derived origin consequences with `textContent` only. Digit/click/Agent `choose` fail-closed on unknown or reserved ids. `applyEffects` does not throw and does not write `ctx.world.origin` when the record is missing. No HIGH or CRITICAL findings remain.

### Findings

#### 🔴 CRITICAL

None.

#### 🟠 HIGH

None after PR1 guards.

#### 🟡 MEDIUM: Partial `applyEffects` then catch

**Location:** `src/game/origins.js` **96–141**, `choose` **376–382**  
**Issue:** The `try/catch` around `applyEffects` can return `false` after a credit or cargo write if a later step throws. `choose` then skips `world.origin`. A second pick could apply the delta again. Authored effects are well-formed; the path is rare.  
**Impact:** Duplicate credits only if apply throws mid-mutation.  
**Fix (accepted this wave):** keep fail-closed never-throw. Do not write origin when apply returns false. Do not retune credits.

#### 🟢 LOW: Clue scan walks `SYSTEMS`

**Location:** `findClueLine` in `origins.js`  
**Issue:** Overlay init reads authored clue `line` from `SYSTEMS`. `Object.keys(SYSTEMS)` is large. Paint is init-only, not per-frame. Output is `textContent`.  
**Impact:** None for XSS. CPU is boot-only.

### Passed Checks

- [x] No secrets in code
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in `origins.js`
- [x] Name, line, preview, footer, clue cue: `textContent` only
- [x] Prototype / reserved keys (`__proto__`, `constructor`, `prototype`) skipped
- [x] `typeof id === 'string'` and `Object.hasOwn(ORIGINS, id)` and valid record before choose
- [x] Unknown origin id skips the row; Digit labels do not reindex
- [x] Missing `ORIGINS[id]`: `applyEffects` returns false; no `ctx.world.origin` write
- [x] No `for-in` of an origin blob onto `world`
- [x] Reputation merge uses `Object.hasOwn` (not proto keys)
- [x] `startSystem` uses `Object.hasOwn(SYSTEMS, …)`
- [x] Overlay paint wrapped so a bad row cannot throw the card
- [x] Keydown listener still removed on successful pick
- [x] Pause stays until pick; no new persist key
- [x] `state.js` not written
- [x] Agent `chooseOrigin` not rewritten
- [x] Color is not the only cue (Digit index + name + labeled words)

### Recommendations

1. Keep derive-from-effects. Do not add a `preview` table in `state.js`.
2. Verifier still owns Vite / fresh-boot overlay stills.
