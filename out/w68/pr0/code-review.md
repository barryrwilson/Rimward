## Code Review: Wave 68 PR0 weapon catalog

**Scope:** `src/game/state.js`, `src/game/weapon-fit.js`, `out/w68/pr0/probe.mjs`.
**Persona:** reviewer + orchestrator code-review checklist.
**Pass:** final (no Blocker/Major).

### Summary
Serial catalog PR matches the shared contract. Existing `WEAPONS.cannon` / `disruptor` / `mining` stay byte-identical. New missile/turret rows, frozen `MOUNT_TABLE`, and `weapon-fit.js` helpers pin on `node out/w68/pr0/probe.mjs`.

### What's done well
- Mining row still derives from `MINING_LASERS[0]`.
- `applyHit` looks up `family` as the WEAPONS key; `missile` and `turret` keys exist without changing Unknowables law.
- `healMissileAmmo` matches contract §1.2 exactly (no trunc).
- `canSeat` treats unknown `classKey` as `light` at the call site.
- Probe asserts the orchestrator pins plus Unknowable miss, frozen tables, and reserved ids.

### Findings

#### 🟡 Minor: `ID_MAX` is duplicated, not imported
**Location:** `src/game/weapon-fit.js:9-10`
**Issue:** Task text asked to cap with `ID_MAX` from `save.js`. The module copies `64` instead of importing.
**Fix:** Keep the copy for this PR so the probe can run without the CSS stub. PR1 may share the constant if a persist-free ids file exists.
**Status:** open — documented; importing `save.js` would couple catalog helpers to hangar restore.

#### 🟡 Minor: first-impl “one string seat” is not encoded in fit helpers
**Location:** `src/game/weapon-fit.js` (module); `src/game/state.js` `MOUNT_TABLE` counts > 1
**Issue:** Heavy/ace/frigate missile and turret counts are > 1. Helpers only answer “can this class seat this kind?” Persist still owns the single `launcher` / `turret` string (later PR).
**Fix:** Do not add arrays here. PR1 flatten keys stay one string.
**Status:** open — contract: counts reserve the class; first impl seats one id.

#### 💡 Suggestion: freeze `WEAPONS.missile` / `WEAPONS.turret` rows
**Location:** `src/game/state.js:109-118`
**Issue:** `MOUNT_TABLE` freezes; `WEAPONS` does not. Nearby cannon/disruptor are mutable.
**Fix:** Optional later freeze of the whole `WEAPONS` object. Do not freeze only the new keys.
**Status:** open — consistency with shipped guns.

#### 💡 Suggestion: `healMissileAmmo` JSDoc repeats the contract
**Location:** `src/game/weapon-fit.js:77-80`
**Issue:** Comment restates the if/else. It is the copy-paste law PR1 must not drift from.
**Fix:** Keep. This is WHY for persist, not a history dump.
**Status:** open — leave as-is.

### Resolved this pass
None at Blocker/Major. `freezeIds` reserved-id skip is catalog hardening, not a correctness fix.

### Test coverage
- `out/w68/pr0/probe.mjs` covers: existing three WEAPONS rows, missile/turret lookup, Unknowable miss, mount counts, `Object.hasOwn` pins, heal pins, `canSeat` pins, frozen SKUs, no HTML in `line`.
- Did not run `npm run test:boot` (out of scope).
