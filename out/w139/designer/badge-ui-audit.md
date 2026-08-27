# CLEAN

## UI Audit: Agent play badge layout leftover freeze (Wave 139)

**Reviewer:** parent `[designer]` pass  
**Scope:** freeze only (`docs/AgentBadgeLayoutDesign.md`, `out/w139/badge/shared-contract.md`, inventory, worker `ui-audit.md`) vs live cite of `.rw-agent-badge`, Manifest / toasts / PWR / RANGE / colorblind. **No `src/` edit. No Vite/Chrome.**  
**Live leftover:** REAL (expected). Named later serial **PR1**. This wave ships no product UI.

### Summary

The integrator freeze is playable and constraint-complete. Live Manifest/toast cover and missing badge palette are **REAL leftover**, not freeze defects. PR1 keeps z-index **40**, body child, 44 px buttons, reduced-motion, and solid/dashed + text ON/OFF. No Blocker or Major remain in the freeze.

### Wave 139 constraint check

| Constraint | Freeze | Live cite | Status |
|---|---|---|---|
| Manifest / toast overlap | Offset `top: 140px` **and** `max-width: min(148px, calc(100vw - 32px))`. Partial merge forbidden. | Badge `style.css` **39–48** `top: 16px` / `max-width: 280px` / `z-index: 40`. Manifest `hud.css` **1172–1176** `top: 14px; right: 14px`. Toasts **710–713** `top: 14px; right: 168px`. `#hud` **10** (`style.css` **28**). | REAL leftover → PR1. Not CONSUME. |
| z-index **40** | Keep **40**. Do not drop below scrim **20**. Do not raise to pause **50**. | Badge **43**. Scrim `screens.css` **16**. | Honored. |
| Do not cover PWR / RANGE | Keep top-right (`bottom: auto; left: auto`). `max-height: calc(100vh - 156px)`. No bottom-right pin. | PWR `hud.css` **1021–1025**; `hud.js` **1223**. RANGE `hud.css` **207–220**; `hud.js` **994**. | Honored. Short-viewport residual = Minor. |
| Not below scrim 20 | Explicit forbid. | Station/death `.screen-overlay` z **20**. | Honored. |
| Colorblind / contrast token mirrors | Copy HUD hex onto `.rw-agent-badge`. Do not parent under `#hud`. | `body.rw-colorblind #hud` `hud.css` **1234–1238**. `body.rw-contrast #hud` **1243–1248**. **No** `body.rw-colorblind .rw-agent-badge` in `src/**/*.css`. | REAL leftover → PR1. |
| Body child stays | No remount. No `agent-api.js` claim. | `body.appendChild` `agent-api.js` **566**, **706**. | Honored. |
| 44 px buttons | Keep `min-width` / `min-height: 44px`. Do not shrink when card narrows. | `style.css` **107–108**; `type="button"` `agent-api.js` **548–556**. `44+8+44=96` fits ~124 px content at 148 px cap. | Honored. |
| `reducedMotion` kept | Unchanged live rules. No new animation that ignores it. | `style.css` **128–132**. | Honored. |
| Color is not the only ON/OFF cue | Keep solid vs dashed **and** `on`/`off` text. | `style.css` **61–67**; `agent-api.js` **571–574**. | Honored. |

### What's done well

- Census is honest: leftover is **REAL** because PWR/RANGE clear is the **old** pin, not this hole (`inventory.md` §7–8).
- Contract §2 forbids offset-only, width-only, palette-only, HUD child, z-drop, and bottom-right. Inbox “offset **or** narrow” is correctly read as **both** knobs to clear **both** Manifest and toasts.
- Token mirrors copy live HUD values (`#56B4E9` / `#E69F00` / `#D55E00` / `#009E73`; contrast `--white` / `--dim` / `--panel` / `--panel-edge`). Specificity `body.rw-colorblind .rw-agent-badge` beats local custom properties on `.rw-agent-badge` (`style.css` **33–37**).
- Body child + authored CSS avoids HUD-01 `pointer-events: none` (`style.css` **27**) and PR5 remount.
- Live controls already meet a11y baseline PR1 must keep: real `button`, 44 px, hover (`style.css` **118–120**), 2 px focus ring (**122–126**), `aria-live="polite"` (`agent-api.js` **530–532**), `textContent` paint (**571–581**), `:empty` error hide (`style.css` **95–97**).
- Fail-closed: missing Manifest is not a crash; missing `document`/`body` returns (`agent-api.js` **522–526**); default `optIn` off unless trusted Enable / `?agent=1` (**48–80**, **640**, **664–680**).
- Write-set is `src/style.css` only. No geometry persist. No `innerHTML`. Digit 0/8/9 and KeyH/J/L/M/P/D stay.

### Findings

#### 🔴 Blocker: Manifest / toasts under the live card — **accepted leftover, not a freeze defect**

**Location:** live `src/style.css:39-48`; `src/ui/hud.css:1172-1176`, `710-713`; `src/systems/hud.js:1263-1274`  
**Issue:** `?agent=1` pins a 280 px, z-index 40 card at `top: 16px; right: 16px` over Manifest (`top: 14px; right: 14px`) and across toast `right: 168px`. UU / FEAR / CARGO and some chips are hidden. `#hud` is z-index 10.  
**Fix:** Later PR1: `top: 140px` + `max-width: min(148px, calc(100vw - 32px))`. Do not CONSUME. Do not ship src this wave.  
**Status:** leftover REAL. Freeze names PR1. Not a freeze Blocker.

#### 🟠 Major: Colorblind / contrast skip the badge — **accepted leftover, not a freeze defect**

**Location:** live `src/style.css:33-37`; `src/ui/hud.css:1234-1248`; `src/systems/settings.js:70-71`  
**Issue:** Body classes retint `#hud` only. Local custom properties on `.rw-agent-badge` freeze default cyan `#6ff2e0` and default panel. Palette hole is settings parity, not a color-only ON/OFF failure.  
**Fix:** Later PR1 mirrors HUD tokens on `.rw-agent-badge`. Do not move the node under `#hud`.  
**Status:** leftover REAL. Freeze names PR1. Not a freeze Major.

#### 🟠 Major: Forbidden “fixes” (HUD child, z-drop, bottom-right) — **resolved in freeze**

**Location:** contract §0 items 7–9; PWR `src/ui/hud.css:1021-1025`; RANGE `207-220`; scrim `src/ui/screens.css:16`  
**Issue:** Parenting under `#hud` steals pointer-events none and PR5. z-index below 20 buries Enable/Stop under the dock scrim. Bottom-right covers PWR / RANGE / HUD-06 home mark.  
**Fix:** Keep body child, z-index **40**, top-right, retune `max-height` with `top`.  
**Status:** freeze closed. Later PR1 must not reopen.

#### 🟠 Major: Partial merge of offset vs width vs palette vs max-height — **resolved in freeze**

**Location:** `out/w139/badge/shared-contract.md` §2  
**Issue:** Offset alone still covers toasts (280 px crosses `right: 168px`). Width alone still covers Manifest (`top: 16px`). Palette alone leaves P2. Raised `top` with `max-height: calc(100vh - 32px)` can grow into PWR.  
**Fix:** One PR1 lands offset + 148 px cap + `calc(100vh - 156px)` + both palettes + z-index 40 + reduced-motion + solid/dashed.  
**Status:** freeze closed.

Live overlap and missing palette stay until PR1. That is expected. They do **not** keep Blocker/Major open on this integrator.

#### 🟡 Minor: Authored `top: 140px` vs XL Manifest

**Location:** contract §0.1; HUD `--rw-text-scale` 1.5 `src/systems/settings.js:25`; Manifest chrome `src/ui/hud.css:39-86`, `1172-1176`  
**Issue:** Census ~111 px chrome + `top: 14px` + 8 px gap ≈ 133 px. 140 px has ~7 px slack. If Manifest grows (wrap, extra row), CARGO can clip under the card.  
**Suggestion:** Keep 140 px. Optional PR2 still at textScale 1.5. Owner may raise `top` after playtest. No JS measure.  
**Status:** residual. Not required with PR1.

#### 🟡 Minor: 16 px bottom inset is not PWR strip height

**Location:** deputize `max-height: calc(100vh - 156px)` (140 + 16); PWR `src/ui/hud.css:1021-1025` `bottom: 12px` plus `.rw-panel` chrome  
**Issue:** A card that actually hits max-height ends 16 px from the viewport bottom. The PWR / Bio / POS column is taller than 16 px. Short viewports plus wrapped Enable/Stop copy make cover more likely than today’s shorter top pin. Typical ~200 px badge on desktop still clears.  
**Suggestion:** If a still shows PWR clip, raise the bottom inset in that still (not a second required PR). Keep `overflow-y: auto`. Do not pin bottom-right.  
**Status:** residual. Honor still forbids covering PWR.

#### 🟡 Minor: 4 px toast gap at 148 px width

**Location:** badge `right: 16px` + `max-width: 148px` → occupancy to 164 px from right; toasts `src/ui/hud.css:710-713` `right: 168px`  
**Issue:** 4 px between badge left edge and toast container right edge. Shadow (`style.css:58`) can visually kiss chips. Layout boxes do not overlap.  
**Suggestion:** 148 px matches `.rw-panel` `min-width` (`hud.css:45`). Keep it. Optional still. Do not claim `hud.css` to move toasts.  
**Status:** residual.

#### 🟡 Minor: Narrow 148 px wraps title and button copy

**Location:** later `max-width` 148 px; live buttons `src/style.css:105-116`; `overflow-wrap: anywhere` **92**; `flex-wrap` **101-102**  
**Issue:** `Agent play` / `Enable agent play` wrap more. Hit targets stay ≥ 44 px. Two 44 px buttons plus 8 px gap fit the ~124 px content box.  
**Suggestion:** Keep 44 px. Do not shrink padding to un-wrap. Inbox allows narrow.  
**Status:** accepted cost of toast-clear width.

#### 🟡 Minor: Error line shares `--white` with hint

**Location:** `src/style.css:87-93`; freeze colorblind sets `--rw-bad` but error paint stays prefix + `--white`  
**Issue:** Failures rely on `Error: ` (`agent-api.js:471,581`). Colorblind `--rw-bad` will not retint the error row unless a later rule uses it.  
**Suggestion:** Not this leftover (inbox P3 is palette tokens, not error chrome). If a later rule colors error with `--rw-bad`, keep the `Error: ` prefix so it is not color-only.  
**Status:** out of leftover. Documented.

#### 💡 Suggestion: Optional PR2 still

One still: `?agent=1` flight, Manifest UU/FEAR/CARGO readable, toast chip at `right: 168px` readable, PWR and RANGE word clear, colorblind title `#56B4E9`, contrast panel `rgba(4, 8, 17, 0.94)`, z-index 40, buttons 44 px, hub empty, no pause. Optional skip with PR1.

#### 💡 Suggestion: Landmark name

Root is a `div` (`agent-api.js:528`) with visible title text. Optional `aria-label="Agent play"` on the card would name the region without a remount. Not required; do not claim `agent-api.js` this leftover.

#### 💡 Suggestion: Focus ring vs `overflow-y: auto`

`outline-offset: 2px` (`style.css:125`) vs padding 10/12 px. Unlikely clip. No change unless a short-viewport still shows it.

### States checklist (live; PR1 keeps / adds)

| State | Present | Notes |
| --- | --- | --- |
| Hover | yes | `style.css:118-120` |
| Focus | yes | `122-126` |
| Disabled | n/a | do not demand JS |
| Empty | yes | `:empty` hides error `95-97` |
| Error | partial | `Error: ` prefix; color role optional later |
| Loading | n/a | not a fetch surface |
| Colorblind | **no** on badge | PR1 adds token override |
| Contrast | **no** on badge | PR1 adds token override |
| Reduced motion | yes | `128-132` — keep |
| ON/OFF non-color | yes | solid vs dashed + text — keep |

### Theming / contrast

- Default badge tokens match HUD roles (`style.css:33-37` vs `hud.css:12-21`).
- Title and button chrome use `--rw-accent` on dark `--panel` / `--void`. Colorblind swap to `#56B4E9` keeps a non-green cyan vs panel.
- Contrast override darkens `--panel` to `rgba(4, 8, 17, 0.94)` and strengthens `--panel-edge`. `--rw-accent` stays (HUD contrast also leaves accent).
- `--rw-text-scale` stays on `#hud` only (`settings.js:73`). Inbox P3 is palette. Do not claim `settings.js`.

### Responsive / hierarchy

- `max-width: min(…, calc(100vw - 32px))` already exists; PR1 only lowers the 280 px cap.
- `flex-wrap` + 44 px keeps tap targets when the column narrows.
- Visual order stays title → state → last/error → Enable/Stop → hint. Narrow wrap does not invert that order.

### Re-review

Live overlap and missing palette remain until PR1 (expected REAL). Freeze still forbids HUD child, z-index below 20, bottom-right pin, color-only ON/OFF, and shrinking 44 px targets. Worker `out/w139/badge/ui-audit.md` agrees: no Blocker/Major in the integrator. This parent pass matches that verdict.

**Verdict: CLEAN**
