## Code Review: BIO-07 distinct species-inspired living ship bodies design pack (Wave 105)

### Summary

Design-only (this worker). Inventory cites live player CPU sculpt (`ship.js` 274–334, 382–413, 546–560, 624), NPC GLB + GPU (`ship-assets.js` 7–87, 387–470), six class keys (`state.js` 37–44), Wave 95 GLBs on disk, `kit.box` crease floors / hollow wells (`anatomy.py` 834; `organs.py` 454, 492), and live `LIVING_STOCK` six keys (`shipyard.js` 28–30). MERGE LAW deputizes anti-rigidity, light/heavy sibling slices this wave, remaining four later, shared organs serial, fail-closed Wave 95 GLB. No 🔴/🟠 remain after cite fix (`state.js` 173 not 146).

Persona: reviewer (`C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`) + orchestrator `code-review.md`. Self-applied (no `src/` diff). Design-doc review also applied (completeness, live cites, alternatives, serial named only).

### What's done well

- Code wins: live rigid primitives are named with file:line. Charter “no panel lines” (`__init__.py` 7–20) is not treated as done.
- Player bar is a freeze: do not clone `makeLivingHull`; Models Browser `ship:player` stays CPU (`model-catalog.js` 93–113).
- NPC stay GLB + Wave 76 GPU. Generic `BUILDERS['beautiful']` stub is named as forbidden fallback (`build-ship-assets.py` 354–361).
- Fail-closed is **Wave 95** GLB (on disk), not stale Wave 8.
- `LIVING_STOCK` live six is inventoried; BIO-03 “omit ace/frigate/freighter” is not re-applied as a catalog cut. Yard law is **do not add**, not “delete live SKUs.”
- Light = family not clone; heavy = muscle not plates. Ace/cutter/frigate/freighter glance frozen; geometry wait named.
- Shared `surface.py` / `anatomy.py` / `organs.py` / `__init__.py` stay one writer. Class authors must not add `kit.box` in a class `.py`.
- BIO-06 is one line, not a Hz hijack.
- Serial is named only for remaining four + PR7 organs + PR8 pins. Sibling PR1/PR2 may land against this freeze.
- HUD never writes `hullKind`. Digit 0 shipyard. No persist. No UU. No new class keys.

### Findings

No 🔴 Blocker or 🟠 Major after fix.

#### 🟡 Minor: Wave 81 starter-faction line number was stale (fixed)

**Location:** was `state.js` 146 in early draft; live `createShipState` default is `state.js` 173; boot `ship.js` 624.

**Issue:** Wave 81 BIO-03 inventory still says 146. Copying it would have been a false cite.

**Fix:** Contract §0.4 and inventory §1 now cite `state.js` 173 and `ship.js` 624.

**Status:** fixed this pack.

#### 🟡 Minor: `kit.box` replacement is PR7, but PR1/PR2 still call `fold_crease`

**Location:** `light.py` 383–391; `heavy.py` 315–323 → `anatomy.py` 834; contract §3, §0.1.

**Issue:** Sibling light/heavy slices this wave cannot legally rewrite `fold_crease` if they are class-file-only. Box floors can still show unless they bury/overlap.

**Fix:** Contract already: until PR7, hide box reads (bury, overlap flesh). Do not fork `anatomy.py` in PR1/PR2.

**Status:** frozen; acceptable. Sibling authors obey MERGE LAW.

#### 🟡 Minor: Player `livingSilhouette` only special-cases cutter/heavy

**Location:** `ship.js` 258–263.

**Issue:** Ace/frigate/freighter living **player** remounts use restScale only. NPC GLB bodies are BIO-07. Do not “fix” the CPU sculpt in a class bake.

**Fix:** Contract §1: do not rewrite `makeLivingHull`. Inventory §1 names the gap.

**Status:** frozen.

#### 🟡 Minor: Two live copies of 0.5 / 2.3 already exist

**Location:** `ship.js` 144–145; `ship-assets.js` 46–47.

**Issue:** BIO-06 leftover. This pack correctly does not retune them.

**Fix:** None here. Other worker.

**Status:** out of scope.

#### 💡 Suggestion: PR8 should pin silhouette ladder, not only span bands

**Location:** `measure-ships.mjs` 12; wishlist BIO-07 1378–1379.

**Issue:** Span ladder can pass while two classes still share a silhouette.

**Fix:** Later playtest: black-silhouette glance. Do not add a HUD overlay of class names.

**Status:** acceptance direction already requires glance; no code this wave.

### Design-doc completeness

| Check | Result |
|---|---|
| Title table + merge-law pointer + honor | Pass |
| Overview + live inventory + pain (rigid / mech fusion) | Pass |
| Goals / non-goals | Pass |
| Proposed design + deputize anti-rigidity | Pass |
| Serial PR plan (PR1–PR8) | Pass; remaining four later; organs serial |
| Security freeze | Pass |
| Acceptance later | Pass |
| BIO-03 honor without editing Bio03* | Pass |
| BIO-06 one line | Pass |
| Forbidden write-set (`src/`, `light.py`, `heavy.py`) | Pass this worker |

### Recommendations

1. Sibling PR1/PR2: diff only `light.py` / `heavy.py` (+ that class blend/GLB). No shared-module race.
2. Later PR7: replace box well / crease floor **once**, then remaining classes consume it.
3. Later PR8: if measure/validate fail, restore Wave 95 GLB for that class; do not drop `PILOT_CLASSES`.
