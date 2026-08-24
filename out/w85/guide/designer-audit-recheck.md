## Designer audit recheck: NAV-02 live region (Wave 85)

**Mode:** static only. No Playwright. Contract: `out/w84/nav02/shared-contract.md` §7.  
**Product source:** read only. No `src/` edits this pass.

### Prior Major (closed)

**Claim:** outer `.rw-nav-readout` `role="status"` implied `aria-live="polite"` + `aria-atomic="true"`, so 5 Hz GATE distance could re-speak NEXT / DEST / JUMPS.

**Current DOM (`src/systems/hud.js` 886–904):**

- Outer `<section class="rw-panel rw-nav-readout rw-aux">` sets `aria-live="off"` and `aria-atomic="false"`. It does **not** set `role="status"`.
- Child `.rw-nav-readout-live` sets `role="status"` and `aria-live="polite"`. It holds NEXT, DEST, JUMPS, and the status word (`NO ROUTE` / `ARRIVED` / `REROUTE`).
- GATE `.rw-nav-readout-dist` is a **sibling** of `.rw-nav-readout-live` under the section, not a descendant of the live child.
- Distance writes stay write-on-change at 5 Hz (`hud.js` 1794–1795). They no longer sit inside an atomic status region.

Implicit `aria-atomic="true"` now applies only to the inner status node (via `role="status"`). GATE is outside that node. Parent `aria-live="off"` does not cancel a descendant live region.

**Result:** prior 🟠 Major is **resolved**. Matches the worker claim and the audit fix path in `out/w85/guide/designer-audit.md`.

### Occupancy / 180px / hide (no regression)

| Freeze | Result |
|---|---|
| Placement: `#hud .rw-nav-readout` in `.rw-side-col` **above** `.rw-pos` | Pass (`hud.js` 874–909) |
| Off rails (`top: 57%`), prompt (`bottom: 20%`), contacts (`bottom: 5.5%`) | Pass |
| `min-width: 0`; **`max-width: 180px`** | Pass (`hud.css` 844–848 on `.rw-nav-readout.rw-aux`) |
| Name ellipsis + nowrap; type 10–11px × `--rw-text-scale` | Pass (`hud.css` 860–875) |
| `pointer-events: none` | Pass (readout CSS; cue CSS + `aria-hidden="true"`) |
| Combat dim `.rw-aux` 0.38, not `.rw-fade` | Pass |
| Hide when `ctx.flags.docked` or `ctx.gate.jumping` | Pass: `navPark` gates readout (`hud.js` 1510–1524) and marker/cue (`hud.js` 1526–1540) |
| Distinct `.rw-nav-gate-cue` (not lock arrow / contacts SVG) | Pass (`hud.js` 706–710) |
| Cue hide on-glass; transform only | Pass (`hud.js` 1546–1569) |
| No `@keyframes` on cue | Pass (`hud.css` 886–922) |
| `reducedMotion` static ring | Pass (`nav-guidance.js` 180–182) |

Occupancy table unchanged from the first designer pass:

| Surface | Covered by NAV-02? |
|---|---|
| Combat rails | No (center 57%; readout bottom-right, 180px cap) |
| Lead | No |
| Prompt | No |
| Contacts arc | No (distinct class, not on the SVG) |
| Aim glass | Cue only when off-screen; on-screen cue hides (`hud.js` 1546–1550) |

### Findings (this recheck)

#### 🔴 Blocker: (none)

#### 🟠 Major: (none)

#### 🟡 Minor: Side-col stack height vs combat rails (open, not a regression)

**Location:** `src/ui/hud.css:769–787`, `830–848`; `src/systems/hud.js:874–909`  
**Issue:** Bio + nav + POS still grow up from the bottom. At `textScale` 1.5 on a short viewport the column can approach `.rw-combat-target` at `top: 57%`. The 180px cap still stops **horizontal** growth into the rail.  
**Fix:** Keep the cap. Do not move the instrument onto the aim glass.

#### 🟡 Minor: Nav panel may not right-align with POS at textScale 1.5 (open, not a regression)

**Location:** `src/ui/hud.css:830–848`, `924–929`  
**Issue:** `.rw-side-col` still uses `align-items: stretch`. POS coords can exceed 180px at `textScale` 1.5. Nav `max-width: 180px` then stops stretch, so the readout can sit inset from the right edge.  
**Fix:** `align-self: flex-end` or `margin-left: auto` on `.rw-nav-readout`. Do not raise `max-width` above 180px.

#### 🟡 Minor: Cue and lock arrow can share a corner (open, not a regression)

**Location:** `src/systems/hud.js:1550–1569` vs lock `EDGE_MARGIN` 84  
**Issue:** Both still use inset 84. Optional ~12 px extra inset is not applied. Shapes still differ (cyan chevron vs amber triangle).  
**Fix:** Optional later polish. Do not merge classes.

#### 💡 Suggestion: World ring does not follow colorblind tokens (unchanged)

**Location:** `src/systems/nav-guidance.js:141–150`  
HUD cue uses `var(--rw-accent)`. Torus stays `0x6ff2e0`. Shape still carries meaning.

#### 💡 Suggestion: Dim the cue in combat (unchanged)

Readout uses `.rw-aux` 0.38. Cue stays opaque. Contract does not require cue dim.

### Contract check (static, §7)

| Freeze | Result |
|---|---|
| 180px cap | Pass |
| Hide docked / jumping | Pass |
| Distinct `.rw-nav-gate-cue` | Pass |
| Readout above POS | Pass |
| Not lock chrome | Pass |
| No cue `@keyframes` | Pass |
| `reducedMotion` static in first chrome | Pass |
| GATE outside live **child** | Pass |
| No `aria-atomic` on whole panel | **Pass** (explicit `aria-atomic="false"` + no `role="status"` on the section) |
| `role="status"` + `aria-live="polite"` on next/dest/remaining/status | Pass (`.rw-nav-readout-live`) |

### Verdict

**CLEAN.** No 🔴 Blocker. Prior 🟠 Major is closed. Open items are 🟡 / 💡 only; they do not reopen occupancy, the 180px cap, or hide-docked/jumping.

Static audit only. Browser / contrast / overlap pins stay with the verifier.
