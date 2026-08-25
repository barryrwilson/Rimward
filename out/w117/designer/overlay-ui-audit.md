# UI Audit: CTL-02 remaining overlay-priority (Wave 117 leftover freeze)

**Auditor:** `[designer]` (independent of `out/w117/overlay/ui-audit.md`)
**Scope:** Overlay-priority leftover freeze (markdown only). Hail / Galaxy Chart / Berth Records stacking while the sim continues, plus resolved "Let them go" reopen. This leftover **is** UI policy — audit not skipped.
**Review file:** `out/w117/designer/overlay-ui-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\assets\designer-persona.md` + `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Pack: `docs/Ctl02OverlayDesign.md`, merge law `out/w117/overlay/shared-contract.md` (wins on conflict). Worker self-audit `out/w117/overlay/ui-audit.md` read, not copied. Live cites (read-only): `src/systems/hail.js`, `src/systems/galaxychart.js`, `src/ui/hud.css`, `src/game/save.js`. No Playwright. No Vite. No Chrome. Did not spawn children. Did not edit `src/` or worker design docs. [NO BROWSER COVERAGE].
**Date:** 2026-08-25
**Product source:** review only

Merge law: `out/w117/overlay/shared-contract.md` wins if the brief forks. This wave does not ship overlay CSS or JS. Findings bind **later PR1 overlay-priority**. Serial is named only.

## UI Audit: Hail / chart / berth exclusive play-card freeze

### Summary

No product chrome ships this wave. The pack freezes leftover as **one exclusive play card** among Hail, Galaxy Chart, and Berth Records: incoming hail **defers** (skip `openCard` only), "Let them go" / salvage "Leave the hulk" **gate** on session `ai.calmUntil`, and those three **never** write `flags.paused`. Keys stay H / M / L. Close stays named (M/L/Escape on chart/berth; numbered hail intents). Color is not the only cue. Digit 0/8/9 stay. Hub stays empty 80 px. Census leftover is **REAL**, not CONSUME.

**Counts:** 🔴 Blocker **0**. 🟠 Major **0** open (**2** addressed in freeze). 🟡 Minor **3**. 💡 Suggestion **3**.

### Verdict

**CLEAN.** Mutex + defer + session calm is the right leftover, not CONSUME. Freeze does not hide hail with color-only cues, does not pause the sim as required PR1, and does not steal NAV-05 `#rw-galaxy-ap-live`. No open Blocker or Major.

---

### Honor / Blocker gate

Flag **Blocker** or **Major** if the freeze would hide hail with color-only cues, pause the sim as required PR1, steal NAV-05 `#rw-galaxy-ap-live` / `showApLive`, or leave stacking unaddressed while claiming CONSUME.

| Honor | Brief / contract | Live | Result |
|---|---|---|---|
| Leftover REAL, not CONSUME | Design Status; contract header + §0.1; serial **not** none | No mutex. Hail `openCard` on every `hailOpened` (`hail.js` 421). Chart KeyM ignores hail/berth (`galaxychart.js` 669–675). Berth KeyL ignores hail/chart (`save.js` 1488–1493). Salvage `letGo` writes no calm (`hail.js` 185–186). `openCard` never reads `calmUntil` (326–403). | **Pass.** Worker claims **REAL**. That is the right call. CONSUME would leave hidden hail Digits and salvage reopen live. |
| Do not pause hail/chart/berth | Contract §0.7 / §0.1 pause policy; design Goals 3, Acceptance 5 | Hail header: nothing touches `flags.paused` (`hail.js` 8–9). Chart `aria-modal='false'` (113). Berth hint “records hold while you fly” (`save.js` 1376). Pause skips `system.update` (`main.js` 149–156) and would drop deferred `hailOpened`. | **Pass.** PR1 must **not** pause. Pause-as-exclusivity is forbidden, not required. |
| Do not steal NAV-05 live region | Contract §0.8, §4 forbidden `showApLive` / `#rw-galaxy-ap-live`; chart write-set = KeyM/`setOpen` mutex only | `#rw-galaxy-ap-live` `role='status'` `aria-live='polite'` (`galaxychart.js` 137–141). `showApLive` 572–576; Cancel 623; fly `autopilotDisengaged` 709–718. Chart stays open on `tryEngage` 627–636. | **Pass.** Overlay PR1 must not rewrite that node or close the chart on AP. |
| Color is not the only hail cue | Contract §0.18; design Goal 8 | Hail buttons `[n] ${verb}` (`hail.js` 391). Chart desc names M or Escape (172). Berth hint names L or ESC (`save.js` 1376). Chart gates vs hubs use dash + ring, not color alone (`hud.css` 1894–1896). | **Pass.** Defer skips the card entirely; it does **not** replace hail with a hue pip. Song may still hear `hailOpened` (defer is DOM-only). |
| HUD-01 empty 80 px hub | Contract §0.2; design Honor | `.rw-reticle` 80×80, `pointer-events: none` (`hud.css` 184–193) | **Pass.** No overlay pip. |
| Digit 0/8/9 stay | Contract §0.2 | Hail Digit **1–9** only while `open` (`hail.js` 405–415). Digit 0 unused by hail. | **Pass.** Mutex tightens Digit to exclusive top hail. Do **not** steal Digit 0/8/9. |
| KeyH / KeyM / KeyL stay | Contract §0.3 | KeyH `hailPressed`; KeyM chart; KeyL berth | **Pass.** Refuse while the other play card is open. Do not remap. |
| CTL-01 KeyJ | Contract §0.3 / §0.9 | `controls.js` TRACKED + `pendingDock` | **Pass.** Cite only. Do not remap. |
| P1 toast-flood | Contract §0.10 | `.rw-toasts` under `#hud` z 10 | **Pass.** Call out. Do not dedupe. Do not raise toast z. |
| P2 close-chart-on-AP | Contract §0.8 | Chart stays open on engage | **Pass.** Do not steal. |
| `innerHTML` forbidden | Contract §0.4 | Hail `textContent` / `createElement` (`hail.js` 343, 348–354, 391). Berth `meta.textContent` (`save.js` 1476–1480). Chart `textContent`. | **Pass.** |
| `reducedMotion` | Contract §0.17 | Chart already kills animation (`hud.css` 2265–2268). Hail/berth have no required motion. | **Pass.** No new overlay animation. |

If a later worker pauses the sim under hail/chart/berth, claims CONSUME while the triple-open still compiles, paints deferred hail as a reticle color only, or writes `showApLive` / `#rw-galaxy-ap-live` from overlay-policy, that **violates this freeze**.

Do **not** demand a toast-flood fix, close-chart-on-AP, KeyJ remap, or Digit steal.

---

### Product-focus checks

| Focus | Result | Cite |
|---|---|---|
| Stacking is live | **Fail in product; addressed in freeze.** Three independent openers. Berth z 60 covers hail z 40; hail `open` stays; Digit1–9 still resolve. Chart z 30 sits under hail. Sim continues. | `hail.js` 108, 407–415, 421; `hud.css` 1908; `save.js` 1352, 1488–1493; inventory §7 |
| Mutex set | **Pass in freeze.** At most one of hail / chart / berth. Settings / title / models / pause stay outside the set. | contract §0.1; design §1 |
| Incoming hail vs open chart/berth | **Pass in freeze.** Defer (one session slot). Do not yank the plot. Skip `openCard` only; keep `hailOpened` / `hailClosed`. | contract §0.1 Defer is DOM-only |
| KeyM / KeyL while hail open | **Pass in freeze.** Refuse. Hail has no Escape close today; intents stay the close path. | contract §0.1; `hail.js` 405–416 |
| Calm gate | **Pass in freeze.** `openCard` / KeyH refuse `now < ai.calmUntil`. Salvage `letGo` writes +30 s. Session only. | `hail.js` 185–192 vs 421; contract formulas |
| Pause policy | **Pass.** Never `flags.paused` from these three. Chart `aria-modal=false` stays. Berth fly-copy stays. | `galaxychart.js` 113; `save.js` 1376 |
| Named close | **Pass.** Chart: Close `button` `aria-label='Close galaxy chart'` + M/Escape (`galaxychart.js` 157–159, 172). Berth: L or ESC (`save.js` 1376). Hail: `[n]` + verb (`hail.js` 391). Escape-dismiss-hail is **not** required PR1. | contract §0.18 |
| NAV-05 live region | **Pass.** Overlay does not own `#rw-galaxy-ap-live`. Autopilot `aria-describedby` stays. | `galaxychart.js` 137–152; contract §4 |
| Empty / disabled / error | **Pass (reuse live).** Chart Autopilot `disabled` when no route (`galaxychart.js` 595–599). Berth LOAD `disabled` on empty (`save.js` 1478–1481). Deferred hail whose ship is gone: drop. Helper miss: skip mutex, never throw, never pause. | contract §2 |
| Theming | **Pass for freeze.** PR1 prefers **no** `hud.css` change. Chart already uses tokens + `body.rw-colorblind` / `rw-contrast`. Hail/berth stay live inline cards; leftover adds no new hex. | `hud.css` 1898–1916, 2236–2246; `hail.js` 108–115; `save.js` 1350–1359 |
| Responsive | **Pass (reuse live).** Hail `max-width:min(360px,calc(100vw - 28px))`. Chart panel `min(1100px, 92vw)`. Berth `max-width:92vw; max-height:82vh; overflow-y:auto`. Mutex does not add a fourth overlay. | `hail.js` 113; `hud.css` 1923–1924; `save.js` 1357 |
| Focus / keyboard | **Pass in freeze for policy.** Chart close is a real `button` in tab order. Hail Digit1–9 only while hail is exclusive top and title/settings/models do not own the screen. Title capture stays `systems[0]`. | contract §2 settings row; `galaxychart.js` 27, 157–159 |

---

### What's done well

- Census treats live stack + hail-reopen as leftover, not CONSUME. Inventory §7 matches live: no shared gate; berth covers hail; Digit shortcuts still fire (`hail.js` 407–415).
- Smallest additive reuses live hail card (`hail.js` 106–120), live `.rw-galaxy-chart` dialog (`galaxychart.js` 110–116), live berth `role=dialog` (`save.js` 1361–1362). No new widget. No hub pip.
- Pause-the-sim is correctly forbidden. A pause under the chart would flush `hailOpened` (`main.js` 149–156) and freeze combat hail.
- Defer is DOM-only. World events / song cues stay. That is an audio+event cue for a waiting hail, not a color-only pip. Optional `commLine` is **not** required (toast-flood honor).
- Hail close stays numbered intents with verb text (`hail.js` 391, 308). Chart and berth already name M/L/Escape. Freeze does not invent Escape = `keepFiring`.
- NAV-05 `#rw-galaxy-ap-live` stays sibling-owned. Chart-open-on-engage stays. Overlay later write-set is `setOpen` / KeyM open gate only (`galaxychart.js` 420–427, 669–675).
- Digit 0/8/9, KeyJ, `state.js`, persist calm, and `innerHTML` stay out. Settings z 80 remains reachable over play cards (Wave 40).
- Worker self-audit closed stacking and salvage-reopen as Majors **in freeze**. This pass **agrees**. Do not reopen them as CONSUME. Do not reopen toast-flood, close-chart-on-AP, KeyJ remap, or Digit steal.

---

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (closed in freeze): Three play cards stack; hidden hail Digits

**Location:** `hail.js:108` vs `hud.css:1908` vs `save.js:1352`; Digit `hail.js:407–415`; design Pain points; contract §0.1.

**Issue:** Inbox P1. Berth covers hail; Digit1 still resolves tribute / cargo / flee. Chart sits under hail. Sim continues. Z-index accident is not policy.

**Fix landed (markdown):** PR1 mutex. Digit resolve only when hail is the exclusive top play card and title/settings/models do not own the screen. Incoming hail defers instead of painting on the map.

**Status:** closed in contract §0.1 / §2. Do not reopen as CONSUME. Product still stacks until later PR1 — that is the leftover, not a freeze hole.

#### 🟠 Major (closed in freeze): "Let them go" can return on salvage / via `openCard`

**Location:** `hail.js:185–186`, `192`, `421`; salvage label `hail.js:308`.

**Issue:** Live "Let them go" writes 30 s calm, but the DOM opener does not read it. Salvage "Leave the hulk" is the same player intent without calm. KeyH reopens the hulk.

**Fix landed:** `openCard` / KeyH read `calmUntil`. Salvage `letGo` writes +30 s. Session only. No `WORLD_FIELDS`.

**Status:** closed in contract formulas. Do not persist calm.

#### 🟡 Minor: Players who open M to plot then miss the hail card

**Location:** defer policy contract §0.1; worker self-audit Minor.

**Issue:** Incoming hail waits behind the chart. Combat continues (`aria-modal=false`). The player may not see the card until they close the map. Freeze keeps `hailOpened` for song; it does **not** add a toast or a hub pip.

**Fix:** Later PR1: **keep** `hailOpened` emit; **defer only `openCard`**. Flush on chart/berth close; drop if the ship is gone or still in calm. Do **not** add a new toast (P1 toast-flood). Do **not** add a color-only waiting cue.

**Status:** accepted residual. Call out only.

#### 🟡 Minor: Hail has no Escape close; mutex makes hail the only exit

**Location:** `hail.js:405–416` Digit only; contract §0.18.

**Issue:** Mutex that blocks KeyM/KeyL while hail is open leaves **intents** as the only close. That is live today. Adding Escape-dismiss would look like `keepFiring`.

**Fix:** Do not add Escape-dismiss as required PR1. Keep `[n]` + verb. Player outcome already says resolve the numbered intent.

**Status:** accepted; frozen.

#### 🟡 Minor: Hail and berth do not inherit `body.rw-contrast` / `rw-colorblind` `.screen-overlay` restyle

**Location:** hail inline hex `hail.js:108–115, 347–390`; berth inline `save.js:1350–1377`; contrast rules `screens.css:561+` apply to `.screen-overlay`; chart does react (`hud.css:2236–2246`).

**Issue:** Worker self-audit correctly cites chart + `.screen-overlay` restyle. Hail and berth are **not** those surfaces. Mutex does not make color the only cue (`[n]` + verb; L/ESC copy), so this is not a Blocker. Later PR1 must not assume hail “already” follows contrast tokens.

**Fix:** Prefer **no** new `hud.css` (contract §0.1). If playtest needs contrast on hail/berth, that is optional stills — not overlay-priority law. Do not invent a color-only waiting pip to “fix” defer.

**Status:** accepted pre-existing; not a freeze inversion.

#### 💡 Suggestion: Do not restack z-index if mutex holds

**Location:** contract §0.1 z-index prefer none; Wave 40 ladder; pause z 50 vs berth z 60 (`save.js:1352` vs `main.js` pause banner).

**Issue:** Raising hail over berth without mutex keeps hidden-key bugs. Raising play cards over settings (80) or `#fatal` (99) breaks Wave 40 / crash. Pause-under-berth is live and confusing; restack is not leftover law.

**Status:** frozen. Prefer no `hud.css` edit.

#### 💡 Suggestion: `reducedMotion` needs no new rule

**Location:** contract §0.17; `hud.css:2265–2268`.

**Status:** no new overlay animation; do not add one.

#### 💡 Suggestion: Hail card has no `role` today; mutex does not require a new dialog

**Location:** hail root/card `hail.js:106–115` — no `role` / `aria-label`. Chart already `role=dialog` `aria-modal=false` (`galaxychart.js:112–113`). Berth panel `role=dialog` (`save.js:1361–1362`).

**Issue:** After mutex, hail exclusive-blocks M/L without being a modal. Live copy and numbered buttons remain the name. A new `role=dialog` is optional chrome, not PR1.

**Status:** optional. Do not block PR1 on new hail ARIA.

---

### Worker self-audit

Read `out/w117/overlay/ui-audit.md`. Agree: leftover **is** UI policy; no open Blocker/Major; stacking and salvage-reopen closed **in freeze**; defer residual and no-Escape hail accepted; no toast-flood / close-chart-on-AP / KeyJ / Digit steal. This file does **not** overwrite that worker audit.

Independent check: REAL vs CONSUME, pause-forbidden, NAV-05 live region, and non-color hail cues all **pass**.

### Recheck after review

No UI product fix this wave. Later PR1 must land mutex **and** calm gate together (contract §2 partial-merge row). Re-grep: no hail+chart+berth triple open; `openCard` reads `calmUntil`; salvage `letGo` writes calm; `showApLive` untouched.
