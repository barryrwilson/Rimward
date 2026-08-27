# CLEAN

## UI Audit: `.rw-agent-badge` layout + a11y tokens (Wave 140 PR1)

**Reviewer:** parent `[designer]` pass  
**Scope:** CSS-only PR1 in `src/style.css` vs merge law `out/w139/badge/shared-contract.md` and `docs/AgentBadgeLayoutDesign.md`. Context: `src/ui/hud.css` Manifest / toasts / PWR / RANGE / colorblind / contrast; worker `out/w140/badge/ui-audit.md`. **No product edit. No Vite/Chrome.**  
**Graph:** `proceed_unmodeled` (`r-mtbl76ui-753957f0`). Mandatory false.

### Summary

PR1 lands the frozen offset, Manifest-column width, PWR-safe max-height, z-index **40**, and Okabe-Ito / contrast token mirrors on the body-child card. Live CSS matches the contract write-set. Focus rings, 44 px hits, reduced-motion, and non-color ON/OFF stay. Residuals are XL Manifest slack, short-viewport PWR inset, and a 4 px toast gap. No Blocker. No Major.

### Wave 140 constraint check

| Constraint | Freeze | Live after PR1 | Status |
|---|---|---|---|
| Offset below Manifest | `top: 140px`; keep `right: 16px`; `bottom: auto; left: auto` | `src/style.css:39-42` | Honored. |
| Toast-clear width | `max-width: min(148px, calc(100vw - 32px))` | `style.css:48` | Honored. Occupancy to 164 px from right; toasts `hud.css:710-713` `right: 168px`. |
| PWR-safe max-height | `calc(100vh - 156px)`; keep `overflow-y: auto`; no bottom-right pin | `style.css:49-50`; pin not `bottom`/`left` | Honored as frozen. Short-viewport residual = Minor. |
| z-index **40** | Keep **40**. Not below scrim **20**. Not pause **50**. | `style.css:43`. `#hud` **10** (`:28`). Scrim `screens.css:16` **20**. Pause `main.js:171` **50**. | Honored. |
| Body child, not `#hud` | CSS-only. No remount. | Selector is `.rw-agent-badge`. Mount still `body.appendChild` (`agent-api.js:566`, cite only). `#hud` stays `pointer-events: none` (`style.css:27`). | Honored. |
| Colorblind mirror | Okabe-Ito hex on `.rw-agent-badge`, same as `hud.css:1234-1238` | `style.css:135-140` `#56B4E9` / `#E69F00` / `#D55E00` / `#009E73` | Honored. Specificity beats local tokens (`:33-37`). |
| Contrast mirror | HUD `--white` / `--dim` / `--panel` / `--panel-edge` on `.rw-agent-badge`, same as `hud.css:1243-1248` | `style.css:142-147` | Honored. |
| Reduced motion | Keep live rules. No new animation that ignores it. | `style.css:128-132` | Honored. No new `@keyframes` on the badge. |
| Color not only ON/OFF | Solid vs dashed **and** ON/OFF text | `style.css:61-67`; paint `agent-api.js:571-574` (cite) | Honored. |
| 44 px buttons | Do not shrink when the card narrows | `style.css:105-108` `min-width`/`min-height: 44px`; `flex-wrap` `:99-103`; `type="button"` `agent-api.js:548-556` | Honored. |
| No `innerHTML` | Paint stays `createElement` + `textContent` | CSS-only PR. No JS write. | Honored. |
| Partial merge | Offset + width + max-height + both palettes + z 40 in one PR | All five live together in `style.css` | Honored. |
| `--rw-text-scale` on badge | Not this leftover | Still on `#hud` only (`hud.css:29-31`) | Honored. |
| Do not cover RANGE | Keep top-right. RANGE is hub-center. | `.rw-reticle-range` `hud.css:207-220` `left: 50%`; `bottom: -16px` on the reticle | Honored. |

### What's done well

- Inbox P2 needs **both** offset and width. Live `top: 140px` (`style.css:39`) clears Manifest `top: 14px; right: 14px` (`hud.css:1172-1176`). Live 148 px cap (`style.css:48`) keeps the card in the Manifest column and does not cross toast `right: 168px`.
- Inbox P3 is settings parity on a body child. `body.rw-colorblind .rw-agent-badge` and `body.rw-contrast .rw-agent-badge` copy HUD hex/rgba. The node does not move under `#hud`, so HUD `pointer-events: none` does not steal Enable/Stop.
- Combined `rw-colorblind` + `rw-contrast` do not fight: accent/warn/bad/good vs white/dim/panel/edge.
- Title uses `--rw-accent` (`style.css:76-79`). Colorblind title becomes `#56B4E9` without a color-only ON cue.
- Hit math at 148 px, `box-sizing: border-box` (`style.css:2-5`): padding 12+12, ON/OFF left border 4 px, right border 1 px → inner ~119 px. `44+8+44=96` fits. `flex-wrap` keeps 44 px when `100vw - 32px` drops below 148 px (viewport under 180 px).
- Hover (`:118-120`) and 2 px focus ring (`:122-126`) stay. `:empty` hides a blank error (`:95-97`). `overflow-wrap: anywhere` (`:87-93`) keeps long intent names inside the narrow card.
- Visual order stays title → state → last/error → actions → hint. Wrap does not invert hierarchy.
- Fail-closed CSS: missing `.rw-resources` is not a crash. Rules still match `.rw-agent-badge`.

### Findings

No 🔴 Blocker. No 🟠 Major.

#### 🟡 Minor: XL textScale Manifest may still meet `top: 140px`

**Location:** `src/style.css:39`; Manifest chrome `src/ui/hud.css:39-86`, `1172-1176`; scale on `#hud` `hud.css:29-31`  
**Issue:** 140 px is the freeze for HUD textScale **1.5**. `--rw-text-scale` does not apply to the badge. If Manifest grows (wrap, extra row), CARGO can meet the card.  
**Suggestion:** Keep 140 px. Optional PR2 still at scale 1.5. Owner may raise `top` after playtest. Do not JS-measure `.rw-resources`. Do not claim `settings.js`.  
**Status:** documented. Contract freeze.

#### 🟡 Minor: 16 px bottom inset is not PWR strip height

**Location:** `src/style.css:49` `max-height: calc(100vh - 156px)` (140 + 16); PWR `src/ui/hud.css:1021-1025` `.rw-bottom` `bottom: 12px` plus `.rw-panel` chrome  
**Issue:** A card that hits max-height ends 16 px from the viewport bottom. The PWR / Bio / POS column is taller than 16 px. Short viewports plus wrapped Enable/Stop make cover more likely than the old `top: 16px` pin. Typical ~200 px badge on desktop still clears. `overflow-y: auto` (`style.css:50`) stops unbounded growth.  
**Suggestion:** If a still shows PWR clip, raise the bottom inset in that still. Do not pin bottom-right. Do not drop z-index.  
**Status:** documented. Honor still forbids covering PWR; freeze chose this inset.

#### 🟡 Minor: 4 px toast gap at 148 px width

**Location:** badge `src/style.css:40,48` `right: 16px` + `max-width: 148px` → occupancy to 164 px from right; toasts `src/ui/hud.css:710-713` `right: 168px`; shadow `style.css:58`  
**Issue:** 4 px between badge left edge and toast container right edge. Box-shadow can visually kiss chips. Layout boxes do not overlap.  
**Suggestion:** 148 px matches `.rw-panel` `min-width` (`hud.css:45`). Keep it. Optional still. Do not claim `hud.css` to move toasts.  
**Status:** documented. Inbox width freeze.

#### 🟡 Minor: Dock credits overlap at z-index 40

**Location:** `src/style.css:43`; station overlay `src/ui/screens.css:16` z **20**  
**Issue:** Same as orch-fable t2. Card stays above dock overlay text so Enable/Stop stay clickable over scrim 20.  
**Suggestion:** Do not drop z-index. Flight/dock control reach beats credit-label overlap.  
**Status:** documented. Contract §0 item 8.

#### 🟡 Minor: Narrow 148 px wraps title and button copy

**Location:** `src/style.css:48`, `76-80`, `105-116`; `overflow-wrap` `:92`; `flex-wrap` `:101-102`  
**Issue:** `Agent play` / Enable/Stop labels wrap more than at 280 px. Hit targets stay ≥ 44 px. Two 44 px buttons plus 8 px gap still fit the content box.  
**Suggestion:** Keep 44 px. Do not shrink padding to un-wrap. Inbox allows narrow.  
**Status:** accepted cost of toast-clear width.

#### 💡 Suggestion: `--dim` and Okabe-Ito warn/bad/good are unused in badge paint

**Location:** `src/style.css:137-139`, `144`; error/last/hint color `style.css:87-93`  
**Issue:** Contrast sets `--dim`. Colorblind sets `--rw-warn` / `--rw-bad` / `--rw-good`. Badge text uses `--white`. Failures rely on `Error: ` prefix (`agent-api.js:581`, cite).  
**Suggestion:** None for this PR. Contract requires the HUD token sets. If a later rule paints error with `--rw-bad`, keep the prefix so it is not color-only.  
**Status:** documented. Inbox P3 is palette tokens, not error chrome.

#### 💡 Suggestion: Focus ring vs `overflow-y: auto`

**Location:** `src/style.css:50`, `122-126` `outline-offset: 2px`; padding `:51` 10/12 px  
**Issue:** A button at the scroll edge can clip the 2 px offset outline. Unlikely on typical badge height.  
**Suggestion:** No change unless a short-viewport still shows clip. Do not shrink 44 px hits.  
**Status:** residual. Pre-existing ring.

#### 💡 Suggestion: Landmark name is JS, not this write-set

**Location:** root `div` `agent-api.js:528` (cite). Visible title `style.css:76-79`.  
**Issue:** Optional `aria-label="Agent play"` would name the region.  
**Suggestion:** Not this leftover. Do not claim `agent-api.js`.  
**Status:** out of write-set.

### States checklist

| State | Present | Notes |
| --- | --- | --- |
| Hover | yes | `style.css:118-120` |
| Focus | yes | `:122-126` (`:focus` and `:focus-visible`) |
| Disabled | n/a | Buttons stay live; do not demand JS |
| Empty | yes | `:empty` hides error `:95-97` |
| Error | partial | `Error: ` prefix; `--rw-bad` token exists, unused in paint |
| Loading | n/a | Not a fetch surface |
| Colorblind | **yes** | `style.css:135-140` |
| Contrast | **yes** | `:142-147` |
| Reduced motion | yes | `:128-132` |
| ON/OFF non-color | yes | Solid vs dashed + text |

### Theming / contrast

| Class | Token | Value | Matches HUD |
|---|---|---|---|
| `body.rw-colorblind .rw-agent-badge` | `--rw-accent` | `#56B4E9` | `hud.css:1235` |
| | `--rw-warn` | `#E69F00` | `:1236` |
| | `--rw-bad` | `#D55E00` | `:1237` |
| | `--rw-good` | `#009E73` | `:1238` |
| `body.rw-contrast .rw-agent-badge` | `--white` | `#ffffff` | `hud.css:1244` |
| | `--dim` | `#aec3d8` | `:1245` |
| | `--panel` | `rgba(4, 8, 17, 0.94)` | `:1246` |
| | `--panel-edge` | `rgba(160, 205, 245, 0.6)` | `:1247` |

- Default badge tokens still match HUD roles (`style.css:33-37` vs `hud.css:12-21`).
- Title and button chrome use `--rw-accent` on dark `--panel` / `--void`. Colorblind `#56B4E9` stays a non-green cyan on navy.
- Contrast darkens `--panel` and strengthens `--panel-edge`. `--rw-accent` stays (HUD contrast also leaves accent).
- Box-shadow `rgba(2, 6, 13, 0.6)` (`style.css:58`) matches `.rw-panel` (`hud.css:46`). Pre-existing, not a new hardcoded theme hole.
- `--rw-text-scale` stays on `#hud`. Inbox P3 is palette.

### Responsive / hierarchy

- `max-width: min(148px, calc(100vw - 32px))` keeps 16 px side inset on viewports under 180 px.
- `flex-wrap` + 44 px keeps tap targets when the column narrows.
- `max-height: calc(100vh - 156px)` plus `overflow-y: auto` is the authored short-viewport valve. RANGE word stays hub-center (`hud.css:207-216`).
- Primary actions stay Enable/Stop. Status is `aria-live="polite"` (`agent-api.js:530-532`, cite). Hierarchy is readable after wrap.

### Worker self-audit

`out/w140/badge/ui-audit.md` agrees: no Blocker/Major. Worker listed XL Manifest and unused `--dim`. This parent pass adds the frozen 16 px PWR inset residual, the 4 px toast gap, dock z-index 40 overlap, and narrow wrap as documented Minors. None reopen PR1.

### Re-review

Static CSS vs contract. Did not start Vite. Did not edit `src/`. No Blocker/Major in live PR1 CSS.

**Verdict: CLEAN**
