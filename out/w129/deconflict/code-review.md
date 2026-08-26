## Code Review: HUD-07 PR1 (`hud.js` + `hud.css`)

### Summary

Yield runs every frame after lock/home/chart positions, uses scratch AABBs plus `segmentHitsBox`, and toggles `rw-yield` only on change. Cruise quiets RANGE/LEAD words in CSS without a second fade on HOME/GATE/J/POS. Hail02 and galaxy chart CSS stay out of the patch.

### What's done well

- Hide-not-delete: class toggle, no `remove()`.
- Duplicate name: hide `.rw-target-name` when a ship lock shows the rail name.
- RANGE word hides when DIST/meta is up; ring class `in-range` stays on `.rw-reticle`.
- LEAD word yields in cruise and on hub/bracket/path hit; ring node stays.
- Fail-closed try/catch. Zero extra per-frame DOM alloc (scratch boxes at init).
- `HOME_EDGE_INSET` 108 and `EDGE_MARGIN` 84 untouched.
- Rail name now stripped. `innerHTML` still absent.

### Findings

#### 🟡 Minor: Assumed chart/home label widths

**Location:** `src/systems/hud.js` yield block (`56 * ts` / `96 * ts`)
**Issue:** Label AABBs are estimates, not measured text. A long landmark name can still kiss the hub after the assumed box is clear; a short name can yield a few pixels early.
**Fix:** Cache `offsetWidth` on the existing 5 Hz text write if playtest shows misses. Not a hide-nav or hub-child defect.

#### 💡 Suggestion: `last[key]` for yield flags

**Location:** `applyYield`
**Issue:** Computed key on `last`. Call sites pass authored `'yieldName'` / `'yieldRange'` / `'yieldLead'` / `'yieldHome'` only.
**Fix:** None required. Do not take keys from world blobs.

### Verdict

No Blocker/Major. PR1 matches the shared contract.
