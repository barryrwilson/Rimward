# UI Audit: NAV-07 leftover chart-label a11y (Wave 120, round 2)

**Auditor:** `[designer]` (independent of `out/w120/chartlabel/ui-audit.md` and of round 1)  
**Scope:** Leftover freeze only (markdown). Re-audit after the worker closed the round-1 KeyM/SELECT Major. Live `galaxychart.js` labels / KeyM and `overlay-policy.js` `isTypingFocus` are census. Later PR1 is spec, not shipped `src/`.  
**Review file:** `out/w120/chartlabel/designer-audit-2.md`  
**Round 1 left untouched:** `out/w120/chartlabel/designer-audit.md`  
**Worker file left untouched:** `out/w120/chartlabel/ui-audit.md`  
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` against `docs/Nav07ChartLabelDesign.md`, `out/w120/chartlabel/shared-contract.md` (merge law wins), live `src/systems/galaxychart.js` and `src/systems/overlay-policy.js` (READ only). No `src/` edit. Did not start Vite. `[NO BROWSER COVERAGE]`.  
**Date:** 2026-08-25  
**Product source:** live census + freeze. Reduced coverage: live click not run.

## UI Audit: Galaxy Chart labels, hit discs, named dest list (round 2)

### Summary

The leftover is still **REAL**. Live labels do not activate. Plot still uses invisible mouse-only discs. There is no dest `<select>`. Live KeyM close still always `setOpen(false)`. That live hole is later **PR1 chart-label**, not a freeze defect this wave. Round-1 🟠 Major (dest typeahead vs KeyM close unnamed in the freeze) is **closed in the freeze**: allowed skip on the **existing** handler via live `isTypingFocus` (SELECT included); not a remap; Escape still closes; dest sits **under the desc**.

### Verdict

**CLEAN.** 0 open Blockers. 0 open Majors in the freeze.

Do not CONSUME. Do not demand `src/` this wave. Digit 0/8/9 stay. HUD-01 hub stays empty 80 px.

### Round-1 Major close (freeze)

| Round-1 demand | Freeze now | Live src (must stay hole this wave) |
|---|---|---|
| Named KeyM close skip via `isTypingFocus` | **Yes** — `shared-contract.md` §0.3, §0.7, §0.1 KeyM row, formulas **148–163**, fail-closed §2, PR1 §3/§4 | **No skip** — `galaxychart.js` **700–704** `if (open) setOpen(false)`; import **5** is `playSurfaceBlocked` only |
| Not a remap | **Yes** — KeyM stays `e.code === 'KeyM'`; skip is **not** a remap and **not** a new listener; remap / second window listener **forbidden** | Bind unchanged **698–713** |
| Escape still closes | **Yes** — §0.7; do not skip Escape for dest typeahead unless playtest; formulas **161–163** | **710–712** still `Escape` → `setOpen(false)` |
| Dest under desc | **Yes** — §0.1 Dest layout; §0.19 after top actions in DOM; Nav07 dest layout row | No dest node in `src/` (grep `rw-galaxy-dest` = 0) |
| Call live helper; do not rewrite overlay-policy | **Yes** — §0.9 call only; SELECT included (`overlay-policy.js` **72–80**) | `isTypingFocus` exported; chart does **not** import it |

Partial merge (dest `<select>` without KeyM typing skip) is **forbidden** (`shared-contract.md` §2). That is the named allowed KeyM close. It is not a KeyM remap.

### What's done well

- Leftover stays **REAL**. Census matches live: labels **283–291** have `textContent` and **no** `data-system-id`; CSS `pointer-events: none` (`hud.css` **2127–2132**); click/hover require `isHitDisc` (**77–85**, **675–688**); SVG `role=img` (**195–201**); no dest `<select>`. Serial is **PR1 chart-label**, not none.
- Round-1 KeyM hole is named as **later** skip on the existing handler, with `#rw-galaxy-dest` fallback if `isTypingFocus` throws, and **close as live** if both miss (`shared-contract.md` §0.7). Fail-closed does not trap the chart.
- Dest home is **under the desc**, not on the title/actions row. Clear / Autopilot / Close stay the top cluster (`galaxychart.js` **123–168**; `hud.css` **1933–1946**, **1974–1987**). Round-1 layout Minor is closed in freeze.
- Hover inspect **must** share `isPlotTarget` (`shared-contract.md` §0.1). Round-1 “may share” hole is closed. Plot on hover stays forbidden.
- Control id is frozen: `id="rw-galaxy-dest"`, visible `<label htmlFor="rw-galaxy-dest">` “Destination” (`shared-contract.md` §0.19). No `tabindex` / `role=button` on SVG labels.
- Keyboard dest stays one labeled HTML `<select>` **outside** `role=img`. No required 100-disc tab loop. No autofocus. No focus trap. Sibling AP success `setOpen(false)` + blur **647–664** still wins.
- Names stay `textContent`. `innerHTML` forbidden. Color is not the only cue (stroke / square / copy / option names).
- `isTypingFocus` live includes `SELECT` (`overlay-policy.js` **72–80**). Chart must **call** that export later. Do not rewrite overlay-policy. Do not invent a second helper.

### Task checklist (player outcome)

| Check | Live / freeze | Result |
|---|---|---|
| Do not CONSUME leftover | labels inert; discs mouse-only; no dest list; KeyM close has no skip | **Pass** (REAL) |
| Round-1 KeyM Major closed **in freeze** | named `isTypingFocus` skip; not remap; Escape closes; dest under desc | **Pass** |
| Do not demand `src/` this wave | skip named for **PR1 chart-label** only | **Pass** |
| Later: labels plot same path as discs | `activateSystem`; `data-system-id`; pointer-events | **Pass** in freeze |
| Later: named keyboard dest | labeled `<select id="rw-galaxy-dest">` all charted systems | **Pass** in freeze |
| Later: typeahead **M** does not close map | existing KeyM + `isTypingFocus`; Escape still closes | **Pass** in freeze; **live still inert** (later PR1) |
| No steal Autopilot / Close | keep top actions; dest under desc; discs stay 24 CSS px | **Pass** in freeze |
| No autofocus trap | no autofocus; no trap; sibling blur wins | **Pass** in freeze |
| No `innerHTML` names | `textContent` only | **Pass** in freeze |
| Digit 0/8/9 / hub stay | no new Digit; no hub pip | **Pass** |

### Findings

None at 🔴 Blocker.  
None at 🟠 Major (open).

Live leftover (inert labels, mouse-only discs, no dest list, KeyM always closes) is the **inbox bug**. The freeze correctly keeps it open as later PR1. That is **not** scored as an open freeze defect. Do not ship `src/` this wave to “close” it.

#### 🟠 Major (closed in freeze): Dest typeahead vs live KeyM close

**Location:** round 1 `designer-audit.md`; freeze `shared-contract.md` §0.1 / §0.3 / §0.7 / §4; Nav07 KeyM dest typeahead + dest layout; live `galaxychart.js` **700–704**; `overlay-policy.js` **72–80**.

**Issue (round 1):** Native dest `<select>` typeahead uses letter keys. **M** is the chart toggle. Live close always `setOpen(false)`. The freeze did not name a skip, and §4 could be read as “do not touch KeyM.”

**Fix landed (markdown):** Existing KeyM handler: if `open` and `isTypingFocus()` (SELECT included), **do not** `setOpen(false)`. Import next to `playSurfaceBlocked`. Fallback `activeElement.id === 'rw-galaxy-dest'`. If both miss, close as live. **Not** a remap. **Not** a new listener. Escape still closes. Dest `<select>` **under the desc**. Overlay-policy body unchanged. Partial merge without the skip is **forbidden**.

**Status:** closed in freeze. Live src still has no skip — later PR1. Do not reopen as freeze Major. Do not CONSUME.

#### 🟡 Minor (closed in freeze): Header dest control layout

**Location:** round 1; now `shared-contract.md` §0.1 Dest layout / Focus; §0.19; live header **123–168**.

**Status:** closed. Dest is under the desc. Autopilot / Close stay top actions at 24 CSS px.

#### 🟡 Minor (closed in freeze): Label hover inspect

**Location:** round 1 “may share `isPlotTarget`”; now `shared-contract.md` §0.1 Hover **Must** share `isPlotTarget` inspect only.

**Status:** closed in freeze.

#### 🟡 Minor: SVG label glyph may stay shorter than 24 CSS px

**Location:** inbox enlarge; freeze enlarge via label box, discs stay 24 (`shared-contract.md` §0.1); `hud.css` **2127–2132** `font-size: 15px`; live discs **443–460**.

**Issue:** SVG `<text>` hit is the glyph. Short names can be under 24 px tall. Discs still meet WCAG 2.5.8. Do **not** grow discs over Autopilot / Close.

**Fix:** Playtest. Optional transparent rect in the **label layer** only if labels stay hard to hit. Dest `<select>` + 24 px discs already unblock keyboard play.

**Status:** playtest. Do not reopen CONSUME. Unchanged from round 1.

#### 💡 Suggestion: Desc copy after PR1

**Location:** `galaxychart.js` **173** “Click a system to plot a route. M or Escape closes.”

**Issue:** After PR1, players also use Destination and labels. Not required if the Destination `<label>` is visible.

**Fix:** Optional later `textContent` tweak. No `innerHTML`. No tween.

**Status:** optional.

#### 💡 Suggestion: Re-census line cites at impl

**Location:** Nav07 inventory table still cites click **659–668**; live click is **675–684**. AP success `setOpen(false)` is live **647–664**.

**Issue:** Stale line cites. Contract already says re-census and do not fight sibling close.

**Fix:** Impl re-grep before edit. Do not treat AP-close as this leftover.

**Status:** already required. Call out only.

### Theming / states / a11y (later PR1 must keep)

- Dest `<select>` uses chart tokens (`--white`, `--panel-edge`, `--rw-accent` on `:focus-visible` matching `hud.css` **2003–2013**). Contrast restyle already hits labels (`hud.css` **2253–2255**); dest text must stay readable there.
- Empty first option (`Plot a system`, value `''`) is idle. Empty `change` is **no-op**. Do not steal Clear.
- `aria-modal=false` stays. Dest pick does not pause the sim.
- Do not add a second live region or `aria-live=assertive`.

### Honor (must not regress)

| Surface | Freeze |
|---|---|
| Digit 0 shipyard | stay |
| Digit 8/9 dock launch / epics | stay |
| HUD-01 80 px empty hub | no dest pip |
| KeyM chart / KeyP pause / KeyO settings | stay bind; later close skip only while `isTypingFocus()` / dest SELECT |
| KeyJ CTL-01 | cite; do not remap; do not edit `controls.js` |
| NAV-05 `showApLive` | do not rewrite |
| Overlay z 30 | do not raise |
| Sibling AP success `setOpen(false)` | do not fight live **647–664** |
| Toast-flood | no extra `commLine` / toast |
| `state.js` / persist dest | none |
| `overlay-policy.js` body | call `isTypingFocus` only |

### Live src still leftover (not this wave)

Do **not** treat these as open freeze Majors:

- Labels **283–291**: no `data-system-id`; `hud.css` **2127–2132** `pointer-events: none`.
- Click **675–677** / hover **686–688**: `isHitDisc` only.
- KeyM **700–704**: always `setOpen(false)` when open. No `isTypingFocus` import (**5**).
- No `#rw-galaxy-dest` in `src/`.

Named later serial: **PR1 chart-label**.

---

**Verdict:** CLEAN. Round-1 KeyM/SELECT Major is closed in the freeze. Leftover stays REAL. Do not CONSUME. Do not demand `src/` this wave.
