# UI Audit: NAV-07 leftover chart-label a11y (Wave 120)

**Auditor:** `[designer]` (independent of `out/w120/chartlabel/ui-audit.md`)  
**Scope:** Leftover freeze only (markdown). Live `galaxychart.js` labels / hit discs / keys and `hud.css` `.rw-galaxy-label` are census. Later PR1 is spec, not shipped `src/`.  
**Review file:** `out/w120/chartlabel/designer-audit.md`  
**Worker file left untouched:** `out/w120/chartlabel/ui-audit.md`  
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` against `docs/Nav07ChartLabelDesign.md`, `out/w120/chartlabel/shared-contract.md` (merge law wins), `out/w120/chartlabel/current-chartlabel-inventory.md`. Live read of `src/systems/galaxychart.js` and `src/ui/hud.css`. No `src/` edit. Did not start Vite. `[NO BROWSER COVERAGE]`.  
**Date:** 2026-08-25  
**Product source:** live census + freeze. Reduced coverage: live click not run.

## UI Audit: Galaxy Chart labels, hit discs, named dest list

### Summary

The leftover is **real**. Labels do not activate. Plot still uses invisible mouse-only discs. There is no named keyboard dest list. The freeze must **not** CONSUME, and it does not. Later PR1 (named only) is label plot + one labeled HTML `<select>`. That picture is sound for names, hit enlarge, Autopilot/Close, no autofocus trap, no `innerHTML`, and no fight with sibling AP-close. One freeze hole remains: live KeyM **close** has no SELECT typing guard, and the write-set does not name a skip.

### Verdict

**Major remaining in the freeze** (not in unbuilt later `src/`). 0 blockers, 1 open major, 3 minors, 3 suggestions.

Not CLEAN. Not a Blocker. Do not CONSUME. Digit 0/8/9 stay. HUD-01 hub stays empty 80 px. Color is not the only cue in the spec.

### What's done well

- Leftover stays **REAL**. Census matches live: `.rw-galaxy-label` has no `data-system-id` (`galaxychart.js` **283–291**), CSS `pointer-events: none` (`hud.css` **2127–2132**), click/hover require `isHitDisc` (**77–85**, **675–692**), no dest `<select>` (grep 0), SVG `role=img` (**195–201**). Serial is **PR1 chart-label**, not none.
- Keyboard dest is a real labeled HTML `<select>` **outside** the SVG (`shared-contract.md` §0.19). That is the right AT split. `role=img` children stay presentational. Do not tab ~100 discs.
- Names are `textContent` / `destLabel` (`galaxychart.js` **289**, **475–480**). `innerHTML` forbidden later (`shared-contract.md` §0.4). Live file has no `innerHTML`.
- Enlarge is the **label box**, not `HIT_CSS_DIAMETER = 200`. Discs stay 24 CSS px (`galaxychart.js` **46**, **443–460**). Autopilot / Close stay 24×24 (`hud.css` **1974–1987**) with `:focus-visible` (**2003–2013**).
- No autofocus on `setOpen(true)`. No focus trap. Sibling close blur still wins (`galaxychart.js` **432–439**; live AP success also `setOpen(false)` + blur **647–664**). Freeze forbids fighting that branch.
- Hover stays inspect. Plot stays click/`change`. Contract forbids plot-on-hover (`shared-contract.md` §0.20).
- Color is not the only cue live or in spec: gates vs hub routes by dash (`hud.css` **1895–1897**, **2028–2040**); current = thick outline + dashed marker (**2080–2083**, **2135–2143**); plot dest = square + solid stroke + status text (`galaxychart.js` **515–547**). Dest options are names, not faction fill.
- Dialog already named: `role=dialog` `aria-modal=false` `aria-labelledby` / `aria-describedby` (**110–117**). Close has `aria-label` Close galaxy chart (**156–160**). KeyM / Escape stay (**698–713**).
- HUD-01 empty hub stays (`hud.css` **184–193**). No dest pip on `.rw-reticle`. Digit 0 shipyard / 8 launch / 9 epics stay (station Digit map; chart closed while docked **724**). KeyJ cite only.
- `aria-live=polite` on AP line, hover, plot status (**139–142**, **314–317**, **330–331**). Freeze forbids a second live region and `assertive`.
- Partial merge (labels without dest list, or dest list with labels still `pointer-events: none`) is **forbidden**. Generated ~94 unlabeled systems stay in scope.

### Task checklist (player outcome)

| Check | Live / freeze | Result |
|---|---|---|
| Do not CONSUME leftover | labels inert; discs mouse-only; no dest list | **Pass** (REAL) |
| Later: labels plot same path as discs | `activateSystem`; `data-system-id`; pointer-events | **Pass** in freeze |
| Later: enlarge without covering AP/Close | label box; discs stay 24 CSS px | **Pass** in freeze |
| Later: named keyboard dest | labeled `<select>` all charted systems | **Pass** in freeze; KeyM typeahead hole **Fail** (🟠) |
| No steal Autopilot / Close names or hits | keep buttons; no `preventDefault`; no disc grow over chrome | **Pass** in freeze |
| No autofocus trap | no autofocus; no trap; sibling blur wins | **Pass** in freeze |
| No `innerHTML` names | `textContent` only | **Pass** in freeze |
| No fight sibling `setOpen(false)` | labels/select must not call `setOpen`; must not re-focus after close | **Pass** in freeze |
| Color not only cue | stroke / square / copy / names | **Pass** |
| Digit 0/8/9 / hub stay | no new Digit; no hub pip | **Pass** |

### Findings

None at 🔴 Blocker.

Live leftover (inert labels, mouse-only discs, no dest list) is the **inbox bug**. The freeze correctly keeps it open as later PR1. That is **not** scored as an open freeze defect.

#### 🟠 Major: Dest typeahead vs live KeyM close is not frozen

**Location:** freeze `shared-contract.md` §0.3 / §0.7 / §4 (KeyM stays; do **not** add a new KeyM listener; write-set **KeyM remap** forbidden); live `galaxychart.js` **698–709**; `overlay-policy.js` **72–80** `isTypingFocus` (SELECT included). Open-gate uses `playSurfaceBlocked` only on **open** (**705–708**), not on close.

**Issue:** Later PR1 makes Destination a native `<select>` and relies on platform typeahead (`shared-contract.md` §0.1; worker `ui-audit.md` also). Live window KeyM **always** `setOpen(false)` when the chart is open. There is no `activeElement` / `isTypingFocus` skip. `M` is also the chart toggle. A keyboard player who tabs to Destination and types a name that starts with **M** (or presses M as the typeahead key) closes the map. Contract §0.7 talks about not adding a **new** listener and about title/models capture. It does not require the **existing** close branch to skip SELECT. §4 can be read as “do not touch KeyM at all,” so a later serial may ship the dest list with a broken typeahead for KeyM.

This is a freeze hole, not unbuilt taste. Arrow keys on the select still work. Mouse labels still work. The named keyboard search path does not.

**Fix:** Freeze one line of deputize: on the **existing** KeyM handler, if the chart is open **and** `isTypingFocus()` (or `activeElement` is the dest `<select>`), **do not** `setOpen(false)`. Call `isTypingFocus` from `overlay-policy.js`. Do **not** rewrite overlay-policy. Do **not** add a second window listener. Do **not** remap KeyM. Do **not** skip Escape chart close unless playtest proves the native listbox needs it. Name this in contract §0.1 / §4 allowed `galaxychart.js` symbols so PR1 is not scared off as “KeyM remap.”

**Status:** open in the freeze. Must name before later PR1.

#### 🟡 Minor: Header dest control has no layout home that protects Autopilot / Close

**Location:** freeze tab order “before Clear” (`shared-contract.md` §0.1 Focus); live header **123–168**; `hud.css` **1933–1946** one flex row; panel `min(1100px, 92vw)` **1921–1925**; AP/Close `min-height`/`min-width` 24 **1974–1987**.

**Issue:** Title + `#rw-galaxy-ap-live` + Clear + Autopilot + Close already share the header. A visible “Destination” `<label>` + `<select>` (~100 options) on that row can wrap or shrink the action cluster on 92vw. Contract forbids covering those buttons and shrinking them below 24 CSS px, but it does not pick a slot (second header row vs under desc **170–173**).

**Fix:** Later CSS: put label+select on a row **below** the title/actions row or under the desc. Keep Autopilot / Close in the top actions cluster. Do not raise z. Do not put the select over the SVG in a way that eats map clicks.

**Status:** later layout. Not a leftover CONSUME question.

#### 🟡 Minor: Label `pointer-events` without shared hover inspect

**Location:** freeze hover “**may** share `isPlotTarget`” (`shared-contract.md` §0.1); live pointerover `isHitDisc` only **686–692**; labels paint above hits **293–295** at `y + HUB_RING_R + 16` **286**.

**Issue:** After labels take pointer-events, the glyph sits on top of the disc offset. Hover on the **name** will miss `isHitDisc` unless PR1 shares `isPlotTarget` for inspect. Plot click can still work via label. The player who aims at the name then gets no hover readout. Inbox asked to enlarge the target; inspect should follow that target.

**Fix:** PR1 should share `isPlotTarget` on `pointerover` **inspect only**. Never `plotRoute` on hover. Do not rewrite `hoverModel`.

**Status:** optional in freeze; should be required for the enlarged target.

#### 🟡 Minor: SVG label glyph may stay shorter than 24 CSS px

**Location:** inbox “enlarge the effective targets”; freeze enlarge via label box, discs stay 24 (`shared-contract.md` §0.1); `hud.css` **2127–2132** `font-size: 15px`; live discs already 24 CSS px on open **443–460**.

**Issue:** SVG `<text>` hit is the glyph, not a padded CSS box. Short names (for example “The Hush”) can be under 24 px tall. Discs still meet WCAG 2.5.8. Labels add area but may not be 24×24 by themselves. Do **not** grow discs over Autopilot / Close to “fix” this.

**Fix:** If playtest shows labels still hard to hit, add a transparent rect in the **label layer** sized to the text box, still tied to `data-system-id`, still inside the SVG (not over header chrome). Not required if dest `<select>` + 24 px discs already unblock play.

**Status:** playtest. Do not reopen CONSUME.

#### 💡 Suggestion: Lock a dest control id and keep SVG labels presentational

**Location:** live ids `rw-galaxy-chart-title` **127**, `rw-galaxy-ap-live` **139–140**; contract visible `<label>` + `htmlFor` §0.19; SVG `role=img` **195–201**.

**Issue:** Freeze does not name `id` / `htmlFor`. A later `role=button` + `tabindex` on `text.rw-galaxy-label` inside `role=img` would fight AT and the no-tab-trap rule.

**Fix:** `id="rw-galaxy-dest"` on the select; label `htmlFor` that id. Do not add `tabindex` or `role=button` on SVG labels.

**Status:** optional freeze line.

#### 💡 Suggestion: Re-census live AP-close lines at impl

**Location:** inventory still cites click **659–668** and AP **633–650** with **no** `setOpen(false)` yet; live click is **675–684**; live AP success already `setOpen(false)` + blur + HUD chip focus **647–664**.

**Issue:** Sibling chart-close is **in** `galaxychart.js` at this designer census. This leftover must not revert that branch. Line cites in the pack are stale. Contract already says re-census and do not fight.

**Fix:** Impl re-grep `setOpen(false)` before edit. Do not treat live AP-close as this leftover.

**Status:** already required. Call out only.

#### 💡 Suggestion: `reducedMotion` and desc copy

**Location:** `hud.css` **2266–2270** already zeros chart animation; contract §0.18; desc **173** “Click a system to plot a route. M or Escape closes.”

**Issue:** No new dest/label motion. Desc will be slightly stale after PR1. Not required if the Destination `<label>` is visible.

**Fix:** Optional `textContent` tweak on desc. No `innerHTML`. No tween.

**Status:** optional.

### Theming / states / a11y (later PR1 must keep)

- Dest `<select>` uses chart tokens (`--white`, `--panel-edge`, `--rw-accent` on `:focus-visible`). Do not invent a second palette. Contrast class already restyles labels (`hud.css` **2253–2255**); dest text must stay readable there.
- Empty first option (`Plot a system`, value `''`) is the idle state. Empty `change` is **no-op**. Clear route still clears. Do not steal Clear.
- Disabled dest is not required. Autopilot already disables when no route (`galaxychart.js` **604–614**). Plot via dest must not skip `syncApButton` (live `update` already calls it **741**).
- Hover / focus / current / dest / blocked already use shape, not fill alone. Dest pick must not recode nodes by hue only.
- `aria-modal=false` stays. Dest pick does not pause the sim (`shared-contract.md` §0.7).

### Honor (must not regress)

| Surface | Freeze |
|---|---|
| Digit 0 shipyard | stay |
| Digit 8/9 dock launch / epics | stay |
| HUD-01 80 px empty hub | no dest pip |
| KeyM chart / KeyP pause / KeyO settings | stay (KeyM close skip only while dest SELECT focused — 🟠) |
| KeyJ CTL-01 | cite; do not remap; do not edit `controls.js` |
| NAV-05 `showApLive` | do not rewrite **586–590** |
| Overlay z 30 | do not raise (`hud.css` **1909**) |
| Sibling AP success `setOpen(false)` | do not fight live **647–664** |
| Toast-flood | no extra `commLine` / toast |
| `state.js` / persist dest | none |

### Worker self-audit

`out/w120/chartlabel/ui-audit.md` is correct on CONSUME, dest `<select>` vs SVG tab trap, no autofocus, no `innerHTML`, 24 px discs, color cues, and header wrap as minor. It closed KeyM/typeahead as if native select were already safe. That is the gap this pass keeps **open**.

---

**Verdict:** Major remaining in the freeze. Leftover stays REAL. Do not CONSUME.
