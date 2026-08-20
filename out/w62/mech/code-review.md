# Code Review: HUD-02 PR2 conventional (mech) skin

**Method:** Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` + `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`.  
**Scope:** `src/ui/hud.css` `#hud[data-family="mech"]` block; WAVE62 pins; `out/w62/mech/probe.mjs`.  
**Pass:** 1 → 2 (re-apply; no HIGH/CRITICAL).

## Code Review: mech family CSS

### Summary

CSS-only skin on the PR1 `data-family` hook. One `#hud` tree. Rails stay at `top: 57%` / ±78 px. Hub ticks stay outside a 56 px keep-out. Default/bio rules are unchanged.

### What's done well

- Iris pupil/cilia are `display: none` only under the mech hook.
- `.rw-reticle::after` is a masked `repeating-conic-gradient` tick ring; no `--vein`; no new nodes.
- Petals are 6×12, gap 2 px, `border-radius: 0`, `transform: none`; LOW/CRIT classes stay.
- Lead glow dropped; 28 px box kept; MATCH uses `::before` on the existing lamp.
- PR1 `hudFamily` pins remain; WAVE62 only appends source pins.

### Findings

#### 🟡 Minor: RANGE one-shot is class-presence, not JS rising-edge

**Location:** `src/ui/hud.css:1021-1023`  
**Issue:** `animation` on `.in-range::before` plays when the class is applied. It is not wired to `last.inRange` in `hud.js`. A browser that does not restart the animation on re-add would skip a later RANGE enter.  
**Fix:** Accept for PR2 (CSS-only). A later owner may add a one-shot class from the existing 5 Hz edge.  
**Status:** documented — CSS-only path is in law; reduced-motion already kills it.

#### 🟡 Minor: Hostile pip is a 90° triangle, not a hollow plate chevron

**Location:** `src/ui/hud.css:1081-1090`  
**Issue:** Law asked for a sharper 90° chevron. The rule uses equal 4 px borders (90° apex) and keeps fill. It is still a three-side mark and does not grow the 10 px pip box toward the aim column.  
**Fix:** Optional `clip-path` V later. Not a glance-contract break.  
**Status:** documented — shape-vs-civ/lock still holds.

#### 💡 Suggestion: Lead inner crosshair remains

**Location:** `src/ui/hud.css:1117-1121` (does not hide `.rw-lead-ring::before/::after`)  
**Issue:** Ring is 1 px with no glow. The shipped + still paints inside the 28 px box.  
**Fix:** Leave it. A thin circle plus a 1 px cross is not a second lock diamond.  
**Status:** accepted

#### 💡 Suggestion: MATCH tick adds 7 px on the rail, not toward center

**Location:** `src/ui/hud.css:1141-1150`  
**Issue:** `3 px` tick + `4 px` margin sits on the existing lamp. It does not eat the 78 px gap.  
**Status:** accepted — glance overlay budget is toward center.

### Contract checks

| Check | Result |
|---|---|
| Positions unchanged (`57%`, ±78 px) | Pass — mech block does not set rail `top`/`transform` |
| One tree | Pass — no `#hud-mech` / `#hud-bio` |
| 56 px keep-out | Pass — mask transparent through `28px` radius |
| PR1 hook untouched | Pass — `src/systems/hud.js` not edited |
| Tokens `'mech' \| 'bio'` | Pass — no `live` |
| Default/bio look | Pass — all restyles are under `[data-family="mech"]` |

### Severity mapping

- 🔴/🟠: none
- 🟡/💡: documented, no code change
