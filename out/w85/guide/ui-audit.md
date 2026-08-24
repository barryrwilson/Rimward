## UI Audit: NAV-02 in-flight next-gate guidance (Wave 85)

### Summary

Flight HUD names next/dest/jumps/distance in `.rw-side-col` above POS. Off-screen cue is a cyan gate chevron, not the lock arrow or contacts arc. The 3D ring marks the routed gate only. Combat dims the readout via `.rw-aux` (0.38). Docked and jumping hide the chrome in this PR.

### What's done well

- Placement is the career column, not rails (`top: 57%`), not lead, not prompt (`bottom: 20%`), not contacts (`bottom: 5.5%`).
- `max-width: 180px`; `min-width: 0`; name ellipsis nowrap (`hud.css` 844–867).
- Type is `calc(10–11px * var(--rw-text-scale, 1))`.
- Cue shape is two ticks + notch; color is `--rw-accent` (colorblind tokens remap).
- No `@keyframes` on the cue. Transform rotate+translate only.
- `role="status"` + `aria-live="polite"` sit on `.rw-nav-readout-live` (next/dest/remaining/status). The outer section is `aria-live="off"` and `aria-atomic="false"`. GATE distance is a sibling, not in that child.
- `pointer-events: none` on readout and cue.
- `NO ROUTE` is a word, not a hop count. `ARRIVED` then hide. Omit hides chrome.

### Findings

#### 🔴 Blocker: (none)

#### 🟠 Major: (none)

#### 🟡 Minor: Side-col stack height vs combat rails

**Location:** `hud.css` 769–787, 830–848; `hud.js` 887–904  
**Issue:** Bio + nav + POS grow up from the bottom. At `textScale` 1.5 on a short viewport the column can approach `.rw-combat-target` at `top: 57%`. Horizontal cap 180px still stops growth into the rail. Contract placement is side-col above POS.  
**Fix:** Keep the cap. Compact padding (6×8) is already in. Do not move the instrument onto the aim glass.

#### 🟡 Minor: Cue and lock arrow can share a corner

**Location:** `hud.js` 1550–1570 vs lock arrow `EDGE_MARGIN` 84  
**Issue:** Both use inset 84. Shapes differ (chevron vs amber triangle). Optional 12 px extra inset is not applied.  
**Fix:** Optional later polish. Do not merge classes.

#### 💡 Suggestion: Dim the cue in combat

**Issue:** Readout uses `.rw-aux` 0.38. The cue stays opaque so the player can still find the gate.  
**Fix:** None this PR.

### Occupancy

| Surface | Covered by NAV-02? |
|---|---|
| Combat rails | No (center 57%; readout is bottom-right, 180px cap) |
| Lead | No |
| Prompt | No |
| Contacts arc | No (distinct class, not on the SVG) |
| Aim glass | Cue only when off-screen; on-screen cue hides |

Hide docked / jumping: yes (`hud.js` 1507–1523).

### Re-review

Designer Major (outer `role="status"` made GATE distance atomic live) is **resolved**. `role="status"` is on `.rw-nav-readout-live` only (`hud.js` 886–902). The section sets `aria-live="off"` and `aria-atomic="false"`. Distance stays outside the live child. No Blocker/Major remain. Width cap, hide rules, and static reduced-motion stay in this chrome.
