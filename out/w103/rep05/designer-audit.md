# UI Audit: REP-05 remaining consequences — player-facing picture (Wave 103)

**Auditor:** `[designer]` (independent of `out/w103/rep05/ui-audit.md`)
**Scope:** Proposed player-facing picture in `docs/Rep05ConsequencesDesign.md` (allies covering + inbound jump refuse). Wave 103 is markdown only. No `src/` lands. No Vite. No product UI this wave.
**Review file:** `out/w103/rep05/designer-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` against the brief, `out/w103/rep05/shared-contract.md` (merge law wins), and live HUD/dock cites. Review only. Do not edit `src/`.
**Date:** 2026-08-23
**Product source:** spec + live chrome. No Playwright. [NO BROWSER COVERAGE].

## UI Audit: covering toast + jump-refuse toast (no new glass)

### Summary

The picture is **no new chrome**. Covering and inbound refuse reuse live `'commLine'` → `pushToast` `textContent` (`src/systems/hud.js` 494–502, 1112–1131). HUD-01 empty 80 px hub stays empty of ally pips and lock boxes. Digit 0/8/9 stay. Police leave copy stays `Leave this space.` No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 2 minors, 2 suggestions.

Later serials fail the picture if they add an ally child on `.rw-reticle`, steal Digit 0/8/9, light the jump fill on refuse, or mint a second toast glass.

### What's done well

- HUD-01 empty hub is named and frozen. `.rw-reticle` is 80×80 (`src/ui/hud.css` 184–191). Live children are pupil, three cilia, and RANGE (`src/systems/hud.js` 709–712). Brief picture: “Do not put a pip on `.rw-reticle`” (`docs/Rep05ConsequencesDesign.md` 260). Contract §0.2 forbids ally pip, cover pip, lock box, and restricted-system disc (`out/w103/rep05/shared-contract.md` 15).
- Channel is **reuse**, not new glass. `'commLine'` already maps to class `comm` (`src/systems/hud.js` 494–502). Toast stack is off the aim column (`src/ui/hud.css` 634–646). Slots use `textContent` (`src/systems/hud.js` 1130). `innerHTML` is absent on hud/station/jump/police-leave.
- Authored lines are short and XOR: `Patrol covering.` / `No passage.` vs live `Leave this space.` (`src/game/police-leave.js` 5) and live `No sale.` Contract §4 (`out/w103/rep05/shared-contract.md` 173–180). Color is not the only cue: all three use `.rw-toast.comm` cyan (`src/ui/hud.css` 734); English strings differ.
- Once-per-visit latches copy police leave and stay **separate** from `firedThisVisit` (`src/game/police-leave.js` 12–16; contract §1.4, §2.3). The toast stack is not a covering klaxon. Live stack has 5 slots and 4 s lifetime (`src/systems/hud.js` 64–65, 775–781).
- Digit 0 stays shipyard: `DOCK_KEY_SERVICES` last row (`src/systems/station.js` 185); Digit 0 selects that last service (`src/systems/station.js` 6023–6025). Digit 8 dock root is launch; Digit 9 dock root is epics (`src/systems/station.js` 185, 5887–5890, 6027–6028). Outfitting Digit 8/9 stay papers (`src/systems/station.js` 6100–6102). First serial PR1 has no Digit bind (`docs/Rep05ConsequencesDesign.md` 232–238; contract §8).
- Jump refuse is fail-closed **before** charge. Live jump box only paints when `ctx.gate.jumping` (`src/systems/hud.js` 1186–1203, 793–796). Contract §2.3: do not set `jumping`; do not paint a lock glyph in `jumpLabel` (`out/w103/rep05/shared-contract.md` 137–142). Player does not see a fake JUMP fill.
- Chart grows no lock box. Hover already shows rank (`src/game/chart-hover.js` 63–65). NAV `blocked` is not reused (contract §0.17, §2.3).
- Dock stays open at range 45 (`src/systems/station.js` 5951–5978, 6181). Risky-run picture is named: Marked still docks; yard still says `No sale.`
- Both HUD families keep the same glance set. `hudFamily` **reads** `player.hullKind` (`src/systems/hud.js` 81–89, 1720–1730). HUD never writes `hullKind` (contract §0.5). Mech hides iris chrome only (`src/ui/hud.css` 1192–1194); it does not add an ally pip.
- Fail-closed missing standing → read 0 → no covering toast, no jump toast (contract §0.13). No lying lock widget.
- Toasts already have `role="status"` `aria-live="polite"` (`src/systems/hud.js` 776–778). No new focus move. `reducedMotion` already kills HUD transitions including toast fades (`src/ui/hud.css` 1183–1188). Contrast already lifts `.rw-toast` (`src/ui/hud.css` 1167–1176).
- No hail card for covering or leave (`src/systems/hail.js` 48 INTENT_ORDER has no leave/cover intent). No `'allyAssist'` event (contract §0.19).
- Mermaid in §8 is sim bands, not a HUD mock (`docs/Rep05ConsequencesDesign.md` 242–257). Player-facing freeze sits in Player outcome (`docs/Rep05ConsequencesDesign.md` 264–270).

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Digit 9 Standing still omits live leave; covering/jump copy waits for PR3

**Location:** `src/systems/station.js` 1160–1179; contract §8; `docs/Rep05ConsequencesDesign.md` 154, 232–238
**Issue:** Digit 9 live notes list hunt, yards, locker, restitution. They do not list `Leave this space.` Covering and `No passage.` must not appear here until PR1/PR2 exist. First remaining serial must not steal Digit 9 to paper over that lag.
**Fix:** None this wave. PR3 after PR1/PR2. Use existing `h()` `textContent` notes (`src/systems/station.js` 4350–4355, 5795–5797). Do not add a Digit.
**Status:** frozen; acceptable lag.

#### 🟡 Minor: Jump refuse can share a visit with a leave toast; covering cannot

**Location:** leave band `< 0` and `> −10` (`src/game/police-leave.js`); covering `>= 10`; jump dest `< −25` (`out/w103/rep05/shared-contract.md` 64–70, 113); player outcome `docs/Rep05ConsequencesDesign.md` 264–270
**Issue:** Covering and leave bands never overlap. A player in the leave band who KeyG to a Marked dest can hear `Leave this space.` and later `No passage.` Same `comm` class. Strings already XOR. Do not add hub icons to “explain.”
**Fix:** None this wave. Keep three authored lines. Do not merge with `Leave this space.`
**Status:** accept.

#### 💡 Suggestion: After the first `No passage.`, further KeyG is silent until the dest/visit latch resets

**Location:** contract §2.3 throttle once per dest per `systemLoaded`; live jump request `src/systems/gate.js` 648–649; jump box `src/systems/hud.js` 1186–1203
**Issue:** Same shape as police leave. Autopilot can keep requesting (`src/systems/gate.js` 643–649). Player sits in the zone with no second toast and no JUMP fill. That is the correct fail-closed picture, not a new glass.
**Fix:** Later PR2: keep refuse + throttle. Do not write `world.nav` blocked. Do not light `jumping`. Owner may add a NAV line later; do not park REP-05 on it.
**Status:** optional / named in contract.

#### 💡 Suggestion: Covering has no spatial pip if the patrol is off-screen

**Location:** contract §1.4 “No aim-glass gauge. No ally pip.”; HUD-01 `src/systems/hud.js` 709–712; TGT contacts `src/systems/hud.js` 803–804
**Issue:** The only new player cue is `Patrol covering.` plus existing hunt fire. Off-screen patrols are invisible on the 80 px hub. That is the HUD-01 freeze, not a missing widget.
**Fix:** Do not add an ally child on `.rw-reticle`. Do not steal `.rw-contacts`. Combat brackets stay KeyT/KeyV.
**Status:** optional; do not implement.

### HUD-01 / Digit / a11y checklist

| Check | Spec | Result |
|---|---|---|
| 80 px hub empty of new children | contract §0.2; `hud.css` 184–191; `hud.js` 709–712 | Pass |
| No ally pip / cover pip | brief 34, 78, 260; contract §0.2, §1.4 | Pass |
| No lock box on glass | brief 208–211; contract §2.1 | Pass |
| RANGE stays TGT-01 | `hud.js` 712 | Pass |
| commLine reuse, not new glass | `hud.js` 494–502, 1112–1131; `hud.css` 634–646 | Pass |
| Toast `textContent` | `hud.js` 1130 | Pass |
| No `innerHTML` | contract §0.4; grep hud/station/jump/police-leave = 0 | Pass |
| Digit 0 shipyard | `station.js` 185, 6023–6025 | Pass |
| Digit 8/9 unstolen | dock launch/epics `station.js` 185, 6027–6028; outfitting papers 6100–6102; PR1 no Digit bind | Pass |
| Color not the only cue | three authored English lines, same `comm` class | Pass |
| Keyboard | KeyG still jump; refuse is no-op + toast; no new Digit | Pass |
| Contrast / tokens | reuse `.rw-toast.comm`; `body.rw-contrast` already covers toasts | Pass |
| Focus / hit targets | no new dock button in PR1/PR2 | Pass |
| Empty / error | fail-closed skip vs lying widget (read 0) | Pass |
| `hullKind` write | forbidden; HUD reads only `hud.js` 81–89 | Pass |
| Police leave chrome | unchanged `commLine` `Leave this space.` | Pass |
| Jump fill unused on refuse | do not set `jumping`; box hidden unless jumping | Pass |
| Chart lock box | none; hover rank `chart-hover.js` 63–65 | Pass |
| Hail card | none | Pass |
| `reducedMotion` | existing HUD kill; no new `@keyframes` | Pass |

### Picture vs later serial (fail conditions)

These are not findings in Wave 103. They are the bar for PR1–PR3:

1. Adding a child to `.rw-reticle` (ally pip, cover pip, lock disc) is a 🔴 Blocker (HUD-01).
2. Binding Digit 0/8/9 to Access / Allies / Locks is a 🔴 Blocker.
3. Setting `ctx.gate.jumping` then cancelling so the JUMP bar flashes is a 🟠 Major (false charge).
4. A second toast glass, hail card, or `'allyAssist'` event is a 🟠 Major (new chrome vs `commLine` reuse).
5. Reusing `Leave this space.` or `No sale.` for covering/jump is a 🟠 Major (lying copy).

### Verdict (repeat)

**CLEAN.** Proposed player-facing picture reuses live `commLine` glass, keeps the 80 px hub empty, and leaves Digit 0/8/9 in place.
