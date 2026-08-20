# Code Review: Wave 68 PR1 hangar weapon persist

**Scope:** `src/game/hangar.js`, `src/game/save.js`, `src/core/ctx.js`, `out/w68/pr1/probe.mjs`.
**Pass:** 1 (post-impl). Probe: `node out/w68/pr1/probe.mjs` → PASS.

## Code Review: hangar persist (launcher / missileAmmo / turret)

### Summary
PR1 persist matches the merge-law restore order. Sanitize is a fresh literal. World mirrors overwrite from the mounted row. Probe pins 1–12 are true. No blocker or major.

### What's done well
- Heal order is launcher → ammo via `healMissileAmmo`. Empty launcher cannot keep 99.
- `canSeat` is the mass law. Light / cutter / freighter cannot keep `dart`.
- `syncMountedWeaponMirrors` is the single overwrite helper; `restore` calls it after hangar sanitize and player heal.
- `writeMountedGear` is unchanged. Combat spend is not in this PR.
- `ctx.world` defaults sit next to `miningLaser` with a short ownership comment.

### Findings

#### 🟡 Minor: WORLD_FIELDS comment restates the restore law
**Location:** `src/game/save.js` 93–94
**Issue:** First pass used a two-line SHP-03 restatement.
**Fix:** Shortened to one WHY line.
**Status:** resolved

#### 💡 Suggestion: `syncMountedWeaponMirrors` could re-heal
**Location:** `src/game/hangar.js` 372–385
**Issue:** The helper trusts a sanitized row. `restore` already sanitizes first.
**Fix:** Optional wrap through `healLauncher` / `healMissileAmmo` if a later caller skips sanitize.
**Status:** open
**Justification:** Not needed for the restore path this PR owns.

### Findings by severity
- 🔴 **Blocker** — none
- 🟠 **Major** — none
- 🟡 **Minor** — WORLD_FIELDS comment length
- 💡 **Suggestion** — defensive re-heal on the overwrite helper
