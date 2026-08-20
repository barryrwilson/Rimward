## Status
CLEAN

## What I tested
- Ran `node --import ./scripts/with-css-stub.mjs out/w65/audio/probe.mjs`. Result: PROBE PASS. Five CUES keys. Each row duration ≤ 0.35 and gain ≤ 0.08. FX-02 `playerFire` / `playerHit` / `npcHit` strings and `COMBAT_BED_GAIN` unchanged.
- Static review of `src/systems/hud.js` emit sites:
  - Rising `.in-range` (`inRange !== last.inRange` then `if (inRange)`) calls `emitFamilyTick('mech', 'hudMechRange')`.
  - Rising MATCH (`matchOn !== last.matchLamp` then `if (matchOn)`) calls `emitFamilyTick('mech', 'hudMechMatch')`.
  - Hostile first add to `seenHostiles` emits `hudMechContact` (mech) or `hostileEnter` (bio, 0.5 s throttle) when `scanner >= 1` and not reduced motion.
  - Hull warn/crit band change emits `hullBand` (bio) with `lastHullBandAt` ≥ 2 s.
  - `emitFamilyTick` returns on reduced motion and on family mismatch.
  - Range/contact run on the per-frame path but only on rising/first-add. MATCH/hull sit after the 5 Hz text return and write on change only. No emit on unchanged 5 Hz text.
- `src/core/ctx.js` frozen comment lists all five types: `hudMechRange`, `hudMechMatch`, `hudMechContact`, `hostileEnter`, `hullBand`.
- `src/systems/song.js`: one export (`initSong`). No `playCue`. New CUES rows only. `FAMILY_CUES` skip uses `document.getElementById('hud')?.dataset.family === needFam` (missing `#hud` or missing family is false → skip). Combat cue path still runs when `needFam` is unset. Does not retarget `playerFire` / `playerHit` / `npcHit`. Mute and master volume stay on the existing master-gain line.
- `src/systems/settings.js` and `src/main.js` have no diff. `src/ui/hud.css` is dirty from HUD-02 PR2 mech skin (433 added lines). That is outside the PR4 write-set. PR4 does not add CSS.
- Live browser at `http://localhost:5173/`:
  - Game loaded. `window.__ctx` present. Forced `sessionStorage rw-hud-family = 'mech'` and reload. `#hud[data-family]` = mech.
  - First live pass was paused (`ctx.flags.paused`). HUD `update` does not run while paused. Resumed for emit checks.
  - Planted a live-ship-shaped lock 80 u ahead. Rising RANGE and MATCH each emitted once (`hudMechRange`, `hudMechMatch`). Hold in-range / MATCH-on produced no extra ticks.
  - Second MATCH rising edge emitted one more `hudMechMatch`.
  - With `ctx.settings.reducedMotion = true`, MATCH rise and RANGE re-enter did not emit. `.in-range` class still updated.
  - Key X produced no console errors. Page error list empty.

## Bugs found
None.

## Environmental issues
None that block the verdict. Vite answered HTTP 200. The tab started paused; resume was required for live emit checks. After the check, dummy lock, MATCH flag, reduced-motion flag, and the session family override were cleared.

## Evidence
- Probe command: `node --import ./scripts/with-css-stub.mjs out/w65/audio/probe.mjs` → `PROBE PASS`.
- CUES rows (`src/systems/song.js`):
  - `hudMechRange` 0.04 / 0.05
  - `hudMechMatch` 0.07 / 0.055
  - `hudMechContact` 0.1 / 0.06
  - `hostileEnter` 0.2 / 0.045
  - `hullBand` 0.3 / 0.055
- Fail-closed skip: `const famOk = !needFam || document.getElementById('hud')?.dataset.family === needFam;`
- Live emit log (mech, RM off): one `hudMechRange` at t≈453.19, `hudMechMatch` at t≈453.19, second `hudMechMatch` at t≈844.01. RM-on re-triggers added zero rows.
- Playwright console: 0 errors.
- `git status`: `settings.js` and `main.js` clean.
