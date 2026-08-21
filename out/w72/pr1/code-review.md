## Code Review: hangar `grafted` persist (WAVE 72 PR1)

### Summary

PR1 copies a boolean `grafted` flag through sanitize, park, load, sync, and player heal. Living and Unknowables drop it. Starter migrate never sets it. Probe pins the contract. No 🔴 Blocker or 🟠 Major findings.

### What's done well

- Fail-closed own-key test (`graftedOwnTrue`) matches existing `own()` / hullKind style.
- Sanitize still builds a fresh row literal; grafted is stamped after the allowlist, never via `Object.assign(raw)`.
- `packLiveHull` includes `grafted: true` only, then re-enters sanitize so living/Unknowables cannot park the flag.
- `copyGraftedFromRow` deletes the player key on a non-grafted mount, so a prior Abomination does not leak onto a living swap.
- Scope stayed in `hangar.js`. No HUD family change, no standing writes, no mesh/price/desk work.

### Findings

#### 🟡 Minor: unset `hullKind` keeps `grafted`

**Location:** `src/game/hangar.js:93-96`
**Issue:** Drop runs only for `hullKind === 'living'`. An omit-kind row with `grafted: true` keeps the flag. Mesh/HUD treat unset as living.
**Fix:** Optional later: `if (row.hullKind !== 'built') delete row.grafted`. Not required by PR1 §7.2.

#### 💡 Suggestion: Unknowables apply is duplicated on the starter path

**Location:** `src/game/hangar.js:96` and `src/game/hangar.js:261`
**Issue:** `applyGraftedAllowlist` already calls `applyUnknowablesKind`. `buildStarterRow` calls it again after forcing living and deleting grafted.
**Fix:** Leave as belt-and-suspenders, or drop the second call. Behavior is the same.

#### 💡 Suggestion: JSDoc restates the helper

**Location:** `src/game/hangar.js:92`
**Issue:** The comment repeats the living/Unknowables omit rule already in the next three lines.
**Fix:** Keep only if a later reader would miss the boolean-strict rule; otherwise delete.

### Test coverage

`out/w72/pr1/probe.mjs` pins: keep true; omit missing/false/'yes'/1/'grafted'; living drop; Unknowables living+drop; reserved ids null; proto pollution; pack built vs living; switchTo load/clear; sync copy/clear; heal keep/junk/living/unk; mixed hangar; starter/rebuild omit; hangar.js has no `reputation.beautiful` / `HOSTILE_STANDING`.

Command: `node --import ./scripts/with-css-stub.mjs out/w72/pr1/probe.mjs` → PASS.

### Recheck (fix diff)

No HIGH/CRITICAL to land. Probe-only pin `mix.protoGone` no longer reads `byId.__proto__` (plain objects always have that accessor). Hangar.js unchanged after reviews.
