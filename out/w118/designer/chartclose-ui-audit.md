# UI Audit: NAV-06 remaining close-chart-on-AP (Wave 118 designer recheck)

**Scope:** Recheck of the prior designer 🟠 Major (keyboard focus left inside `aria-hidden` chart after later PR1 Autopilot auto-close). Markdown leftover freeze only. No `src/` in this wave.  
**Applied:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` and `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`.  
**Sources:** `docs/Nav06ChartCloseDesign.md` (acceptance); `out/w118/chartclose/shared-contract.md` (merge law, **this file wins**); inventory + notes. Worker `out/w118/chartclose/ui-audit.md` is **not** a substitute.  
**Live re-census (code wins):** `src/systems/galaxychart.js`, `src/ui/hud.css`, `src/game/autopilot.js`, `src/systems/overlay-policy.js`, `src/systems/hail.js`, `src/systems/hud.js`, `src/systems/controls.js`. Overlay mutex **already lives** in `src/`.  
**Browser:** Did not start Vite or Chrome. `[NO BROWSER COVERAGE]`. No process to stop.

### Summary

The freeze now closes the leftover player picture **and** the prior a11y Major. Successful Autopilot **button** engage must call real `setOpen(false)`, then leave the hidden chart (blur; prefer visible HUD `#hud .rw-autopilot-cancel`). Refuse and cancel keep the map and the NAV-05 live line. Sim stays live. Overlay may flush deferred hail. **No 🔴 Blocker. No open 🟠 Major in the freeze.** The prior Major is **closed in freeze** (contract §0.19 / Nav06 acceptance §1). Live `src/` still does not close or blur — leftover stays **REAL**.

### What's done well

- **Prior Major is frozen, not papered over.** Contract §0.19 is merge law: after success close, if `document.activeElement` is inside the chart root, **blur** it; prefer `#hud .rw-autopilot-cancel` only when ancestor `.rw-autopilot` is **not** `is-hidden`; if the chip is still hidden this frame, blur is enough; never throw if `document` / `activeElement` is missing; authored selector only. Explicit non-pick forbids leaving focus inside `aria-hidden`. Formulas (`shared-contract.md` §0.1) and fail-closed table (§2) repeat the same rule.
- **Nav06 acceptance matches the contract.** Acceptance item 1: empty `tryEngage` token → `setOpen(false)` in the same handler, then blur, then prefer visible HUD Cancel; playtest cannot leave the map **or** keyboard focus inside `aria-hidden` (`docs/Nav06ChartCloseDesign.md` 232–234). Player outcome (200–202) and alternatives row “Leave focus in `aria-hidden` chart” (260) agree. Contract wins if they ever drift; they do not drift now.
- **Prefer-focus does not invent chrome.** HUD chip already exists: named `Cancel autopilot` (`hud.js` 1037–1041), unhides when `nav.autopilot` is true (`hud.js` 1714–1717), `display:none` while `.rw-autopilot.is-hidden` (`hud.css` 680–681), `:focus-visible` ring (`hud.css` 707–714), `pointer-events: auto` on the button (`hud.css` 691–705) under an otherwise `pointer-events: none` stack (`hud.css` 648–673). `#hud` is a live id (`hud.js` 739). Freeze forbids writing `hud.js`.
- **Same-frame chip hide is fail-closed, not a trap.** Chip toggle is in HUD **update**, after the click. Freeze says: do not focus a still-`is-hidden` control; blur is enough (`shared-contract.md` §0.19 / §2). That avoids moving focus into `display:none`.
- **Hierarchy still matches the inbox.** Live chart is `position:fixed; inset:0; z-index:30` with dim `rgba(2, 6, 13, 0.82)` (`hud.css` 1898–1916). Flying under that map is a bug. Deputize `setOpen(false)` on empty token (`shared-contract.md` §0.1). Live click still has no close (`galaxychart.js` 633–641). Auto-close is smaller than a lock-until-close banner.
- **States stay distinct.** Success → close + leave hidden chart. Token truthy → chart stays, `showApLive` + `commLine` (`galaxychart.js` 634–637). Flying click → `disengage` + `showApLive(apLine('cancel'))` while open (627–631). Fly `autopilotDisengaged` still paints only while `chartOpen` (719–729). Color is not the only cue: live copy is `textContent` (`showApLive` 578–581).
- **Named close stays KeyM.** Help `M — galaxy chart` (`controls.js` 385). Chart desc `M or Escape closes.` (`galaxychart.js` 173). Close `aria-label` `Close galaxy chart` (159). KeyM/Escape still call `setOpen` (674–687). Freeze does **not** remap KeyM or invent a second closer.
- **Overlay mutex is not fought.** Live `setOpen` gates **open** only (`galaxychart.js` 421–425). Close always writes `flags.chartOpen`, `is-hidden`, `aria-hidden`. Hail flush is already polled (`overlay-policy.js` 157–173; `hail.js` 512–516). Later PR1 should call live `setOpen(false)` only.
- **Sim stays live.** `aria-modal='false'` (`galaxychart.js` 114). Chart does not set `flags.paused`. Close restores fire (`controls.js` 476) and unfreezes steer (`autopilot.js` 155–161) without editing those files. `reducedMotion` already zeros chart motion (`hud.css` 2265–2268); freeze invents no close tween.

### Recheck: prior 🟠 Major

#### 🟠 Major (closed in freeze): Autopilot success hides a focused control inside `aria-hidden`

**Location (live hole, later PR1):** Autopilot click `galaxychart.js` 625–642 (empty-token branch 638–641 still has no `setOpen(false)`); `setOpen` 421–433 sets `aria-hidden='true'` with no blur; `.rw-galaxy-chart.is-hidden { display: none }` `hud.css` 1918.

**Location (freeze close):** `out/w118/chartclose/shared-contract.md` §0.19, §0.1 success row, formulas, explicit non-pick “Leave focus inside `aria-hidden` chart after success close”; `docs/Nav06ChartCloseDesign.md` Overview deputize (47), Goals item 10 (117), Picture (194), Player outcome (200–202), Acceptance 1 (232–234), Alternatives (260); serial PR1 lands blur / prefer HUD Cancel (`shared-contract.md` §3).

**Issue (live):** Keyboard path is Tab to `.rw-galaxy-ap`, then Enter. A PR1 that only hid the dialog would leave that button as `document.activeElement` under `aria-hidden` + `display:none`. Invalid for assistive tech. That was the prior designer Major.

**Fix landed (markdown):** After empty token, call `setOpen(false)`, then if `document.activeElement` is inside the chart root, `blur()` it. Prefer already-named `#hud .rw-autopilot-cancel` when that chip is visible. If the chip is still `is-hidden` this frame (`hud.js` 1717), blur is enough. Do not add a KeyM listener. Do not start a close animation. Do not emit a toast. Do not rewrite `showApLive`. Do not write `hud.js`. Never throw.

**Status:** **closed in freeze.** Not live until later PR1. Do **not** reopen as an open Major on this leftover. Worker self-audit now matches.

### Findings

No 🔴 Blocker.

No open 🟠 Major in the freeze.

#### 🟡 Minor: Success has no spoken “Autopilot engaged” line (accepted residual)

**Location:** `galaxychart.js` 638–640 `showApLive('')`; live region is on the chart header (166) and becomes `aria-hidden` on close (430); toast-flood sibling forbids a new HUD toast.

**Issue:** After auto-close, screen-reader users get “dialog gone”, not a phrase. Visual users get map gone + HUD AP chip. Adding `commLine` on empty token would steal P1 toast-flood. Rewriting `showApLive` onto the HUD would steal NAV-05. §0.19 prefer-focus on visible Cancel is the remaining named cue.

**Fix:** Keep silent success. Do not add a toast. Do not rewrite `showApLive`.

**Status:** accepted residual. Call out. Same as prior audit.

#### 🟡 Minor: Deferred hail may paint on the same close that unburies space

**Location:** contract §0.9; `overlay-policy.js` 157–173; `hail.js` 116–125, 512–516.

**Issue:** Real `setOpen(false)` lets `takeDeferredHail` open the hail **card** (z 40, 360px, bottom-left — not full-screen). Player asked to see space after AP; they may also see hail. Skipping flush would leave hail Digits blocked while `chartOpen` is false.

**Fix:** Keep real close. Do not skip flush. Do not treat hail as “still the map”. Hail is a corner card; space stays visible. Overlay Digit/KeyM refuse-while-hail-open is overlay law (`canOpenPlayCard`). Hail focus after flush is **overlay** leftover, not this write-set.

**Status:** accepted coupling. Hierarchy vs **map** is still solved.

#### 🟡 Minor: Prefer-HUD-Cancel often degrades to blur on the click frame (accepted)

**Location:** contract §0.19 / §2 “HUD cancel chip still `is-hidden` this frame”; `hud.js` 1714–1717 vs Autopilot click `galaxychart.js` 633–641.

**Issue:** `tryEngage` sets `nav.autopilot` in the click handler (`autopilot.js` 209–222). The chip unhides in a later HUD update. Same-tick “prefer visible Cancel” will usually see `.rw-autopilot.is-hidden`. Freeze already forbids focusing `display:none` and says blur is enough.

**Fix:** Do not write `hud.js`. Do not `focus()` a hidden chip. Do not add a close tween or a new rAF “animation”. Blur closes the `aria-hidden` trap. Player Tabs to Cancel after the chip paints.

**Status:** accepted residual of §0.19. Not a freeze hole.

#### 💡 Suggestion: Do not invent a “close the chart to resume” lock banner as required PR1

**Location:** wishlist alternate; contract explicit non-picks; `docs/Nav06ChartCloseDesign.md` alternatives.

**Issue:** A lock keeps the dim over space until the player finds M. Auto-close shows flight immediately and keeps KeyM as named close for reopen.

**Status:** frozen. Owner may override after playtest.

#### 💡 Suggestion: `reducedMotion` needs no new rule

**Location:** contract §0.17; `hud.css` 2265–2268.

**Status:** no close tween. Instant `display:none` is the close.

#### 💡 Suggestion: Do not make chart labels into hit targets

**Location:** P2 chart-label a11y inbox; `galaxychart.js` 651–654 hit discs only.

**Status:** frozen. This leftover does not touch labels.

#### 💡 Suggestion: KeyM / Escape / × still do not blur (not this leftover)

**Location:** `setOpen(false)` at `galaxychart.js` 644, 680, 687; overlay designer Minor.

**Issue:** Player-chosen close can leave focus in the hidden chart. Overlay leftover already called that Minor. This leftover write-set is **engage-success only**. Do not expand PR1 to all `setOpen(false)` paths.

**Status:** out of scope. Do not steal overlay.

#### 💡 Suggestion: Later pin retune must keep refuse/cancel readable

**Location:** `scripts/boot-test.mjs` 23550, 23624–23633; contract §0.1 WAVE pins.

**Issue:** Today `chartStayOpen` / `chartEngageStay` call imported `tryEngage`, not `.rw-galaxy-ap`. Product close is the **button**. `chartCancelLive` clicks the button on the **flying** branch while the chart is still open.

**Fix:** Later: not-flying Autopilot **click** → `chartOpen === false` && `autopilot === true`. Then KeyM reopen (if hail mutex allows) or a still-open cancel path → keep `chartCancelLive`. Overlay **this wave** must not retune those pins.

**Status:** serial test coupling, not a Wave 118 chrome defect.

### Keyboard / states / hierarchy / regression checklist

| Check | Freeze | Live now | Later PR1 |
|---|---|---|---|
| Success | Close map; leave hidden chart | Chart stays (`galaxychart.js` 638–641); no blur in `setOpen` 421–433 | `setOpen(false)` after empty token; §0.19 blur / prefer visible HUD Cancel |
| Focus after success | Must not stay in `aria-hidden` root | N/A until close lands | Closed in freeze §0.19 / Nav06 acceptance 1 |
| Chip still `is-hidden` this frame | Blur only | Chip toggles in HUD update 1717 | Do not focus `display:none` |
| Refuse | Keep map + live line | Live (634–637) | Do not close |
| Cancel while open | Keep map + `apLine('cancel')` | Live (627–631) | Do not close; do not rewrite `showApLive` |
| KeyM named close | Keep | Desc 173; help 385; listener 676–685 | Do not remap; overlay may still refuse **open** |
| Do not bury fly after success | Auto-close | Map still covers (`hud.css` 1898–1916) | Real close; HUD chip stays |
| NAV-05 live line | Call only | 578–581, 629, 719–729 | Do not rewrite |
| Overlay mutex | Real close; flush hail | Open-gate in `setOpen` 422–425; flush in `hail.js` 512–516 | Do not block close; do not skip flush |
| Pause / teleport / jump emit | Forbidden | Chart does not pause; `gate.js` sole emit | Keep |

### Verdict

**Player freeze is sound.** Prior 🟠 Major (focus inside hidden chart after Autopilot auto-close) is **closed in freeze** (contract §0.19; Nav06 acceptance 1). **No remaining 🔴 Blocker or open 🟠 Major in the freeze.** Leftover stays **REAL** (live success does not close or blur). Serial name **PR1 chart-close-on-AP**. Do not freeze CONSUME because NAV-05 / WAVE117 stay-open pins exist. `[NO BROWSER COVERAGE]`.
