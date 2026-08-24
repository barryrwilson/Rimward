## UI Audit: NAV-02 in-flight next-gate guidance (Wave 85)

### Summary

Flight HUD names next / dest / jumps / distance in `.rw-side-col` above POS. The off-screen cue is a cyan gate chevron (`.rw-nav-gate-cue`), not the amber lock arrow or contacts arc. The 3D ring marks the routed gate only. Width cap, hide-docked/jumping, and static reduced-motion are in this chrome. One Major remains: `role="status"` on the outer panel makes GATE distance part of an implicit atomic live region.

### What's done well

- Placement is the career column, not rails (`top: 57%`), not lead, not prompt (`bottom: 20%`), not contacts (`bottom: 5.5%`). DOM order is Bio → nav readout → POS (`hud.js` 874–907).
- Width freeze is real: `min-width: 0`; `max-width: 180px`; compact padding `6px 8px` (`hud.css` 844–848). Name values ellipsis + nowrap (`hud.css` 860–867). Type is `calc(11px * var(--rw-text-scale, 1))` on values and `calc(10px * …)` on GATE / status (`hud.css` 860–875).
- Cue class is `.rw-nav-gate-cue` under `#hud`, created once (`hud.js` 706–710). Glyph is two ticks + notch (`hud.css` 886–922). Color is `--rw-accent` (colorblind tokens remap at `hud.css` 1019–1023). Shape is not `.rw-edge-arrow` (amber triangle, `hud.css` 529–548) and not a contacts pip.
- No `@keyframes` on the cue. Transform is `translate3d` + `rotate` only (`hud.js` 1567). `body.rw-reduced-motion #hud *` already kills HUD animation (`hud.css` 1057–1060). World ring spin zeros when `ctx.settings.reducedMotion` (`nav-guidance.js` 180–182).
- Hide while `ctx.flags.docked` or `ctx.gate.jumping` (`hud.js` 1507–1523, 1534–1538). Combat dims the readout via `.rw-aux` (`#hud.in-combat .rw-aux` opacity 0.38), not `.rw-fade`.
- Copy: `NO ROUTE` is a word, not a hop count. `ARRIVED` then hide. Omit hides chrome. Names use `textContent` after allowlist + strip (`nav-guidance.js` 31–46, 86–135; `hud.js` 1788–1793).
- Cue is `pointer-events: none` and `aria-hidden="true"`. GATE distance sits in a sibling of `.rw-nav-readout-live`, not inside that child (`hud.js` 888–902).
- In-world marker is a parked `nav-gate-marker` torus at `RING_RADIUS + 3` (33), under glow rest 96. Empty raycast. Not lock chrome.

### Findings

#### 🔴 Blocker: (none)

#### 🟠 Major: Outer `role="status"` makes GATE distance atomic live

**Location:** `src/systems/hud.js:886–902`, `1760–1793`  
**Issue:** The contract names the instrument `role="status"`, puts next / dest / remaining / status in an `aria-live="polite"` child, and keeps GATE distance **outside** that child with **no** `aria-atomic` on the whole panel (`out/w84/nav02/shared-contract.md` §7). The implementation sets `role="status"` on the outer `<section>`. ARIA maps `status` to implicit `aria-live="polite"` and **`aria-atomic="true"`**. GATE is still a child of that section (`navDistRow` is a sibling of `navLive`, not of the section). Distance writes at 5 Hz (`formatNavDist` integer `u` while closing). Assistive tech can re-read NEXT / DEST / JUMPS / GATE on every unit change. Nested `aria-live` on `navLive` does not cancel the parent atomic region.  
**Fix:** Keep GATE outside the live child. Put `role="status"` on `.rw-nav-readout-live` only, **or** set `aria-live="off"` and `aria-atomic="false"` on the section so only the inner polite region speaks. Do not leave implicit atomic status on the wrapper that contains GATE.

#### 🟡 Minor: Side-col stack height vs combat rails

**Location:** `src/ui/hud.css:769–787`, `830–848`; `src/systems/hud.js:874–907`  
**Issue:** Bio + nav + POS grow up from the bottom. At `textScale` 1.5 on a short viewport the column can approach `.rw-combat-target` at `top: 57%`. The 180px cap still stops **horizontal** growth into the rail. Contract placement is side-col above POS.  
**Fix:** Keep the cap. Compact padding (6×8) is already in. Do not move the instrument onto the aim glass. Optional later: collapse JUMPS onto DEST, or hide Bio rows first.

#### 🟡 Minor: Nav panel may not right-align with POS at textScale 1.5

**Location:** `src/ui/hud.css:830–848`, `924–929`  
**Issue:** `.rw-side-col` uses `align-items: stretch`. POS coords (`.rw-coords` at 10px × scale, nowrap) can exceed 180px at `textScale` 1.5. Nav `max-width: 180px` then stops stretch. Extra space sits on the **end** of the cross axis, so the readout can sit inset from the right edge while POS stays flush. Hierarchy still reads as one cluster; the right edge no longer stacks.  
**Fix:** `align-self: flex-end` or `margin-left: auto` on `.rw-nav-readout`. Do not raise `max-width` above 180px.

#### 🟡 Minor: Cue and lock arrow can share a corner

**Location:** `src/systems/hud.js:59`, `1550–1568` vs lock arrow `EDGE_MARGIN` 84  
**Issue:** Both use inset 84. Shapes differ (cyan chevron vs amber triangle). Contract optional ~12 px extra inset is not applied. They may paint on top of each other when the routed gate and the lock sit in one quadrant. Cue is later in the tree so it wins the pixel.  
**Fix:** Optional later polish: inset the gate cue ~12px when the lock arrow is also shown. Do not merge classes.

#### 💡 Suggestion: World ring does not follow colorblind tokens

**Location:** `src/systems/nav-guidance.js:141–150`  
**Issue:** HUD cue uses `var(--rw-accent)` and remaps under `body.rw-colorblind`. The torus is hardcoded `0x6ff2e0`. Shape still carries meaning (ring on the routed gate only).  
**Fix:** Optional: match Okabe-Ito sky `#56B4E9` when `ctx.settings` colorblind is on. Not required for this PR if the HUD chevron and readout stay tokenized.

#### 💡 Suggestion: Dim the cue in combat

**Issue:** Readout uses `.rw-aux` 0.38. The cue stays opaque so the player can still find the gate. Contract does not require cue dim.  
**Fix:** None this PR.

### Occupancy

| Surface | Covered by NAV-02? |
|---|---|
| Combat rails | No (center 57%; readout is bottom-right, 180px cap) |
| Lead | No |
| Prompt | No |
| Contacts arc | No (distinct class, not on the SVG) |
| Aim glass | Cue only when off-screen; on-screen cue hides (`hud.js` 1544–1548) |

Hide docked / jumping: yes (`hud.js` 1507–1523).  
Lock chrome distinct: yes (`.rw-edge-arrow` vs `.rw-nav-gate-cue`).  
No `@keyframes` on cue: yes.  
`reducedMotion` static: yes (CSS none; ring spin frozen).

### Contract check (static)

| Freeze | Result |
|---|---|
| 180px cap | Pass (`hud.css` 844–848) |
| Hide docked / jumping | Pass (`hud.js` 1508–1523) |
| Distinct `.rw-nav-gate-cue` | Pass |
| Readout above POS | Pass |
| Not lock chrome | Pass |
| No cue `@keyframes` | Pass |
| `reducedMotion` static in first chrome | Pass |
| GATE outside live **child** | Pass (DOM) |
| No `aria-atomic` on whole panel | **Fail** (implicit via `role="status"` on the section) |

### Verdict

**NEEDS FIX.** Not CLEAN: 1 open 🟠 Major (`role="status"` atomic live region includes GATE). No 🔴 Blocker. Worker self-audit (`out/w85/guide/ui-audit.md`) missed the implicit `aria-atomic` mapping.

Static audit only. Browser / contrast / overlap pins stay with the verifier.
