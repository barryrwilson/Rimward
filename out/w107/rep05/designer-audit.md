# UI Audit: Wave 107 REP-05 PR3 Digit 9 Standing LIVE CONSEQUENCES copy

**Auditor:** `[designer]` (independent of `out/w107/rep05/ui-audit.md`)
**Scope:** Digit 9 Standing LIVE CONSEQUENCES copy only. `standingLiveNotes()` plus the existing `h('div', 'screen-note', panel, lives[i])` loop. Review. Do not edit `src/`.
**Review file:** `out/w107/rep05/designer-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` and `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` against live `src/systems/station.js` `standingLiveNotes` / `renderEpics`, Digit 0/8/9 binds, `src/ui/screens.css` `.screen-note`, HUD-01 hub in `src/systems/hud.js` + `src/ui/hud.css`, merge law `out/w103/rep05/shared-contract.md` §4–§8, and `docs/Rep05ConsequencesDesign.md` §7. Worker self-audit `out/w107/rep05/ui-audit.md` is secondary, not the source of truth.
**Date:** 2026-08-24
**Product source:** live `src/`. No Vite. No Playwright. `out/w107/rep05/verify/` is absent. [NO BROWSER COVERAGE] [NO SCREENSHOTS].

## UI Audit: Digit 9 Standing LIVE CONSEQUENCES (`standingLiveNotes`)

### Summary

PR3 adds three authored LIVE lines (police leave, covering, inbound jump refuse) to the existing Digit 9 Standing list. Renderer, class, Digit map, and HUD hub stay the same. Meaning is in words and numbers, not color. The jump note is long but wraps. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 1 minor, 1 suggestion.

### What's done well

- Same heading `LIVE CONSEQUENCES` and same loop `h('div', 'screen-note', panel, lives[i])` (`src/systems/station.js` 5813–5815). `h()` writes `node.textContent = text` (`src/systems/station.js` 4368–4373). No `innerHTML`. No new CSS class.
- Copy uses live constants, not invented strings: `POLICE_LEAVE_LINE` / `POLICE_LEAVE_RADIUS` (`src/systems/station.js` 76, 1181), `COVERING_LINE` / `COVERING_STANDING_MIN` (77, 1184), `JUMP_REFUSE_LINE` / `JUMP_REFUSE_STANDING` / `JUMP_REFUSE_SKIP` (78, 1172–1178, 1191). Authored lines stay `Leave this space.`, `Patrol covering.`, `No passage.` (contract §4).
- Lines stay distinct from yard copy. `No sale.` is not used as jump copy.
- Skip names go through `factionDisplayName` after `Object.hasOwn` (`src/systems/station.js` 1103–1108, 1172–1178). Empty names drop. Live skip join is Unknowables, Hollow Reach, Independent.
- Digit map is unstolen. Digit 0 is last `DOCK_KEY_SERVICES` entry `shipyard` with hotkey `0` (`src/systems/station.js` 188, 5904–5907, 6041–6043). Digit 8 is `launch`. Digit 9 is `epics` / menu label `Standing` (`src/systems/station.js` 188, 5904, 5872, 5771–5774). Outfitting Digit 8/9 stay papers (`src/systems/station.js` 6118–6120). No new Digit. No hail card.
- HUD-01 empty 80 px hub is untouched. `.rw-reticle` is 80×80 (`src/ui/hud.css` 184–191). Live children stay pupil, three cilia, RANGE (`src/systems/hud.js` 709–712). No ally pip. No lock box. This PR does not freeze or steal the hub.
- Contrast class still applies: `body.rw-contrast .screen-note` → `#c3d4e6` (`src/ui/screens.css` 595–607). Default note color `#9fb2c6` on panel `#101826` / `#0a101b` (`src/ui/screens.css` 33, 55–58).
- Keyboard Digit map at dock root is unchanged (`src/systems/station.js` 6039–6047).

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Inbound jump note packs four facts on one wrap line

**Location:** `src/systems/station.js:1191`; wrap: `src/ui/screens.css:26–31, 55–58`
**Issue:** One `screen-note` holds Marked exclusive, skip names, dock-open, and `No passage.`. Approximate live string: `Inbound jump dest standing below -25 (Marked; -25 Suspect does not lock). Skip Unknowables, Hollow Reach, Independent. Dock stays open. No passage.` `.screen-note` has no `white-space: nowrap` (nowrap is only on `.station-credits`, `src/ui/screens.css` 152). Default wrap applies. `.screen-panel` is `max-width: 780px` with `overflow-y: auto`. The locker line at 1187 is already this long. The line wraps; it does not clip. Density is the cost, not overflow.
**Fix:** None this PR. Task asked for three consequence lines and no new CSS. Do not split into a new pane or Digit.
**Status:** accept.

#### 💡 Suggestion: Twelve LIVE lines lengthen Digit 9 scroll

**Location:** Digit 9 Standing LIVE CONSEQUENCES; render `src/systems/station.js:5813–5815`; list `1163–1192`
**Issue:** LIVE CONSEQUENCES is twelve `screen-note` rows (was nine). Each note has `margin: 8px 0`. Standing also paints ladder, HOW STANDING MOVES, restitution, and epic stages above/below. A short dock panel will scroll. `.screen-panel` already scrolls (`max-height: 82vh; overflow-y: auto`). Empty-list freeze does not apply: `standingLiveNotes()` always returns twelve non-empty strings.
**Fix:** Accept. Do not hide live facts. Do not add a hub child or a second pane to “save height.”
**Status:** optional / accept.

### HUD-01 / Digit / a11y / copy checklist

| Check | Spec | Result |
|---|---|---|
| List is still `screen-note` lines | PR3; `station.js` 5813–5815 | Pass |
| Long jump line wraps | `.screen-note` default wrap; panel `overflow-y: auto` | Pass (dense; see Minor) |
| No color-only meaning | All notes share `.screen-note`; facts in English + numbers | Pass |
| Empty hub freeze | HUD-01 80 px; no new child; no pip | Pass (untouched) |
| Digit 9 still Standing, not a new pane | `epics` + `STANDING` heading; no extra Digit | Pass |
| Digit 0 shipyard | `DOCK_KEY_SERVICES` last; Digit 0 bind | Pass |
| Digit 8 launch unstolen | dock Digit 8; outfitting 8/9 papers | Pass |
| Authored `Leave this space.` | contract §4; leave const in note 1181 | Pass |
| Authored `Patrol covering.` | contract §4; cover const in note 1184 | Pass |
| Authored `No passage.` | contract §4; jump const in note 1191 | Pass |
| Do not reuse `No sale.` for jump | contract §4 | Pass |
| `textContent` / `h()` only | `station.js` 4371, 5815 | Pass |
| No new CSS class | `screens.css` `.screen-note` reused | Pass |
| Contrast class still applies | `body.rw-contrast .screen-note` | Pass |
| No hub child / ally pip / lock box | `hud.js` 709–712; this PR does not touch HUD | Pass |
| Keyboard Digit map unchanged | `station.js` 6039–6047, 6118–6120 | Pass |

### Method notes

Independent read of live `src/systems/station.js` 1163–1192, 4368–4373, 5771–5815, 588–5909, 6026–6120; `src/ui/screens.css` 26–58, 145–153, 595–607; `src/systems/hud.js` 709–712; `src/ui/hud.css` 184–191. Compared worker `out/w107/rep05/ui-audit.md` after the source read. Did not edit product source. Did not open a browser. Did not apply a code fix.
