## Code Review: HUD-02 PR4 family audio

### Summary
Quiet family ticks land on rising edges with family and reduced-motion gates. CUES caps hold. FX-02 rows are untouched. No blocker or major defects. Remaining notes are duplication and edge-throttle drop.

### What's done well
- Five new CUES keys only; no `playCue()`; `lastEvents` consumer unchanged besides the family skip.
- `hudMechRange` / `hudMechMatch` / `hudMechContact` / `hostileEnter` / `hullBand` match the brief.
- LOW/CRIT text still comes from `makeHull`; hull audio does not replace it.
- Probe pins keys, duration ≤ 0.35, gain ≤ 0.08, and `hudFamily` import.

### Findings

#### 🟡 Minor: Contact emit path duplicates `emitFamilyTick` gates
**Location:** `src/systems/hud.js:1212-1218`
**Issue:** Range / MATCH / hullBand use `emitFamilyTick`. Contact inlines `reducedMotion` + `hudFamily(ctx)` so bio can own the 0.5 s throttle. Two styles can drift.
**Fix:** Not applied. Justification: inline path must not advance `lastHostileEnterAt` on mech or reduced-motion frames; pulling that into the helper would add a return flag for one site.
**Status:** open (accepted)

#### 🟡 Minor: Hull-band throttle stamps even when `emitFamilyTick` no-ops
**Location:** `src/systems/hud.js:1357-1359`
**Issue:** `lastHullBandAt` updates before `emitFamilyTick`. A mech or reduced-motion session consumes the 2 s window without a cue. A later family swap without another band step stays silent.
**Fix:** Not applied. Justification: the step happened under the wrong family / RM; replaying a past step would violate the family gate.
**Status:** open (accepted)

#### 💡 Suggestion: Cue-table comments restate the PR caps
**Location:** `src/systems/song.js:113-114`
**Issue:** Comments restate gain/duration caps already enforced by the probe.
**Fix:** Not applied. Justification: the cap is a non-obvious contract; leaving it next to the rows is cheap.
**Status:** open (accepted)

### Passed
- Rising `.in-range` only (`if (inRange)` after `!== last.inRange`).
- MATCH lamp-on only; falling edge silent.
- `seenHostiles` first-add for contact; bio extra ≤ 1 / 0.5 s; scanner `< 1` cannot emit (arc + site check).
- No per-frame emit; 5 Hz MATCH/hullBand write-on-change.
- No `hullKind` write, no `input.throttle` write, no `main.js` / `hud.css` / `settings.js` edits.
- Rejected cue names absent (`bioMoodSting`, `tendrilWhoosh`, `heartbeatLoop`).
