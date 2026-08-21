## Security Review: hangar `grafted` persist (WAVE 72 PR1)

**Scope:** `src/game/hangar.js` grafted allowlist; `out/w72/pr1/probe.mjs`.
**Mode:** Deep audit (save-tamper, prototype keys, no innerHTML, no credit debit, reputation not written).
**Pass:** initial + post-probe recheck (no HIGH/CRITICAL code change).

### Risk Level: Low

### Summary

Hangar rows stay fresh allowlisted literals. `grafted` is own-key boolean `true` only. Living and Unknowables drop it. Reserved ids still fail closed. This PR does not write Beautiful standing, debit credits, or touch HUD. No 🔴 CRITICAL or 🟠 HIGH findings.

### Findings

#### 🟡 MEDIUM: unset `hullKind` can keep `grafted`

- **Severity**: medium
- **Category**: save-tamper / contract edge
- **Location**: `src/game/hangar.js:93-96`
- **Description**: Sanitize drops `grafted` only when `row.hullKind === 'living'` or faction is Unknowables. A blob with no `hullKind` and `grafted: true` keeps the flag. Mesh and HUD treat unset kind as living.
- **Impact**: Tamper can store a living-looking row with the Abomination flag. PR3 hostility (not this PR) would then cap Beautiful standing. It cannot skip a later cap.
- **Reproduction**: `sanitizeHangarRecord({ id:'hull_x', classKey:'light', grafted:true })` → no `hullKind`, `grafted: true`.
- **Remediation**: Optional later: drop `grafted` unless `hullKind === 'built'`. PR1 merge law is the living-token drop only.
- **Status**: open (documented; contract-faithful)

#### 🟢 LOW: wholesale `player` extras still persist `grafted` until hangar heal

- **Severity**: low
- **Category**: persist boundary
- **Location**: `src/game/save.js` snapshot `player: ctx.player` (unchanged this PR); `src/game/hangar.js:105-107`
- **Description**: Save still copies the player object wholesale. Junk `grafted: 'yes'` lives on the player until `healPlayerHullKind`. Hangar rows never keep that junk.
- **Impact**: Same class as other player extras. Heal on restore drops it.
- **Status**: open (accepted; heal path pins)

#### 🟢 LOW: no Beautiful standing cap on restore

- **Severity**: informational
- **Category**: threat-model defer
- **Location**: `src/game/hangar.js` (no `reputation.beautiful` / `HOSTILE_STANDING`)
- **Description**: Contract §7.5 hostility is PR3. Save tamper that sets `grafted: true` does not cap standing in this PR. Probe pins that hangar.js does not assign `reputation.beautiful`.
- **Impact**: None for PR1. PR3 must apply the ownership invariant on sanitize/restore.
- **Status**: open (out of PR1)

### Passed Checks

- [x] No secrets in code
- [x] `grafted` only when `Object.prototype.hasOwnProperty.call(obj, 'grafted') && obj.grafted === true`
- [x] `'yes'`, `1`, `'grafted'`, `false`, missing → omit
- [x] Living row deletes `grafted`
- [x] Unknowables: `hullKind = 'living'` and delete `grafted`
- [x] Fresh row literal; no `Object.assign` of a save blob onto a hangar row
- [x] Prototype ids (`__proto__`, `constructor`) still null / dropped
- [x] Proto pollution `Object.prototype.grafted = true` does not stamp rows
- [x] `RESERVED_IDS` / `own()` fail closed
- [x] No `innerHTML`
- [x] No credit debit / `world.credits` write
- [x] No `reputation.beautiful` / `HOSTILE_STANDING` in hangar.js
- [x] HUD / `state.js` / `ctx.js` / shipyard / station / ship.js untouched
- [x] Starter migrate does not set `grafted`
- [x] No new `localStorage` key; `grafted` rides hangar rows
- [x] N/A: auth, sessions, SQL, RLS, CSP, wallet, admin endpoints (local sim)

### Recommendations

1. PR3: scan sanitized hangar for `grafted === true` and cap Beautiful standing at live −10.
2. Optional: fail closed on grafted unless `hullKind === 'built'`.
3. Keep HUD from writing `grafted`.

### Positive Observations

- `graftedOwnTrue` matches hullKind own-key style.
- `packLiveHull` feeds sanitize, so living/Unknowables still drop the flag after park.
- `loadMountedRow` / `syncMountedToPlayer` delete the player key when the mounted row is not grafted.
