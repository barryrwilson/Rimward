# UI Audit: HUD-02 remaining plated / mech class silhouettes (Wave 113, iteration 3)

### Summary

No product chrome ships this wave. Spec picture is a **22×10 facing plate that hints plated class**, not a new HUD widget, not a zoo of Earth tanks. Iteration 3 closes the remaining designer Major: `heavy` stays tall-only (16×8); `freighter` is tall **and** realloc (18×8, nose 3). Overflow and sibling-steal Majors stay closed. Hub stays empty 80 px. FORE/AFT stay. Digit 0/8/9 stay. `reducedMotion` forbids new facing loops.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did **not** spawn `[designer]`. Spec audit, not a running page. Parent designer file: `out/w113/designer/hud02mech-ui-audit.md` (do not overwrite).

### What's done well

- Empty hub freeze: no class pip on `.rw-reticle` (`hud.css` 184–193; RANGE `hud.js` 726–729).
- FORE/AFT words + fill vs hollow stay the data (`hud.js` 353–361).
- Digit 0/8/9 stay shipyard / launch / Standing.
- `reducedMotion` kill-all (`hud.css` 1185–1188). No new facing `@keyframes`.
- Zoo law: plate metrics only; no tanks / jets / wet-navy capitals.
- Sibling bio tokens (`hud.css` 1538–1617) named consume.
- Live fill honesty: nose 5 + body 16 = 21 of 22 px (`hud.css` 1262–1280).

### Findings

No 🔴 Blocker or 🟠 Major (open). Designer Majors **closed** (overflow, sibling-steal, heavy/freighter).

#### 🟠 Major (closed): “Longer” cutter / frigate overflow 22 px

**Location:** live body `left: 5; width: 16` (`hud.css` 1274–1280); contract §0.14.

**Fix landed:** sil `width`/`height`/`flex-basis` never change. `body.left + body.width ≤ 22`. Cutter: nose 4 / body 17. Frigate: nose 3 / body 18, height 4. Unreadable key keeps live generic plate for **that** key. No wet-navy photocopy.

**Status:** closed.

#### 🟠 Major (closed): Fail-closed “generic plate when not mech”

**Location:** live `classKeyToken` omits on non-bio (`hud.js` 101–102); integrator mermaid / deputize; contract §0.12.

**Fix landed:** unknown → live **family** facing. Family not mech → no mech class CSS; do not paint the mechanical plate; do not delete an allowlisted attribute. PR1 extends `classKeyToken` (one writer). Overlay-does-not-read-classKey copy removed (sibling LIVE).

**Status:** closed. Do not reopen.

#### 🟠 Major (closed): Authored `heavy` and `freighter` share one plate

**Location:** contract §0.14; design hint table; player outcome.

**Fix landed:** heavy `16×8` nose 5. Freighter `18×8` nose 3 / left 3 / top 1 (`left+width=21`, `top+height=9`). Still border-triangle + square. No sil grow. No gold/grey fill. No wet-navy photocopy. Unreadable key omits CSS.

**Status:** closed.

#### 🟡 Minor: Self and target facing share the player class token

**Location:** `makeFacing` 864, 875.

**Status:** accepted residual. Do not key off lock classKey.

#### 🟡 Minor: Ace “dart” / cutter “wedge” still invites jets if CSS imports clip-path

**Location:** contract §0.14 “border-triangle + square only.”

**Fix already frozen:** no bio `clip-path` on mech. Ace is a narrower plate (14×4), not a three-point organism nose.

**Status:** documented; PR1 CSS must stay plate metrics.

#### 🟡 Minor: Light plated and unknown key look the same

**Status:** accepted. Light bit-identical plate is pass. Do not put HEAVY on RANGE.

#### 💡 Suggestion: Do not reuse RANGE or the mech tick ring for class

**Location:** `hud.js` 729; tick ring `hud.css` 1197–1222.

**Status:** frozen in contract §0.2.

### Accessibility / theming / layout

- No new controls or hit targets.
- Geometry only; keep existing cyan / `--rw-accent`. Do not make color the class cue.
- Unknown key = live family facing (correct empty/error state).
- Vestibular: no new facing loops.
- Responsive: sil px-frozen; XL text scale must not clip FORE/AFT.

### Digit / hub freeze table

| Surface | Spec | Later serial |
|---|---|---|
| `.rw-reticle` child | none new | forbidden |
| Facing glyph | 22×10 triangle + square | CSS tokens; no sil grow |
| FORE/AFT | words + fill vs hollow | keep |
| Digit 0 / 8 / 9 | shipyard / launch / epics | do not steal |
| Bio clip-path | sibling LIVE 1538–1617 | do not author |
| Earth tanks / wet-navy | forbidden | plate metrics only |

### Re-review

- 🔴 Blocker: **0**
- 🟠 Major: **0** open (3 closed)
- 🟡 Minor: **3** (accepted)
- 💡 Suggestion: **1**
