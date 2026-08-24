# UI Audit: Wave 104 REP-05 covering + inbound jump — player-facing copy and HUD occupancy

**Auditor:** `[designer]` (independent of `out/w104/rep05/ui-audit.md`)
**Scope:** Live PR1 covering + PR2 inbound jump refuse. Player-facing copy and HUD occupancy only. Review. Do not edit `src/`.
**Review file:** `out/w104/rep05/designer-audit.md`
**Method:** `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` against live `src/game/police-cover.js`, `src/game/jump.js` `beginJump` refuse, `src/systems/hud.js` toast/hub, `src/ui/hud.css`, Digit 0/8/9 in `src/systems/station.js`, merge law `out/w103/rep05/shared-contract.md` §4, and `docs/Rep05ConsequencesDesign.md`.
**Date:** 2026-08-23
**Product source:** live `src/`. No Vite. No Playwright. [NO BROWSER COVERAGE].

## UI Audit: covering toast + jump-refuse toast (no new glass)

### Summary

PR1 and PR2 reuse live `'commLine'` → `pushToast` `textContent`. Authored lines are exactly `Patrol covering.` and `No passage.`. They do not reuse `Leave this space.` or `No sale.`. The 80 px hub still has pupil, three cilia, and RANGE. No ally pip. No lock box. No new Digit. Digit 0/8/9 stay. Digit 9 still omits the new lines (PR3). No extra animation. No `innerHTML`. No 🔴 Blocker. No 🟠 Major.

### Verdict

**CLEAN.** 0 blockers, 0 majors, 1 minor, 2 suggestions.

### What's done well

- Covering copy is the exact contract string: `COVERING_LINE = 'Patrol covering.'` (`src/game/police-cover.js` 6). Emit is `{ text: COVERING_LINE }` (`src/game/police-cover.js` 171–173). Jump copy is the exact contract string: `JUMP_REFUSE_LINE = 'No passage.'` (`src/game/jump.js` 7). Refuse emit is `{ text: JUMP_REFUSE_LINE }` (`src/game/jump.js` 107–109).
- XOR vs live leave and yard copy. Police leave still owns `Leave this space.` (`src/game/police-leave.js` 5). Cover and jump files do not contain that string. They do not contain `No sale.`. Contract §4 (`out/w103/rep05/shared-contract.md` 173–180). Color is not the only cue: all three use `.rw-toast.comm` cyan (`src/ui/hud.css` 734; `src/systems/hud.js` 502). English strings differ.
- Channel is reuse, not new glass. `'commLine'` maps to class `comm` (`src/systems/hud.js` 494–502). Toast slots write `slot.el.textContent = text` (`src/systems/hud.js` 1130). `el()` also uses `textContent` (`src/systems/hud.js` 244–249). No `'allyAssist'` / `'systemLocked'`. No hail card (`src/systems/hail.js` 48 `INTENT_ORDER` has no cover/lock intent).
- HUD-01 empty 80 px hub is untouched. `.rw-reticle` is 80×80 (`src/ui/hud.css` 184–191). Live children stay pupil, three cilia, RANGE (`src/systems/hud.js` 709–712). No cover pip. No lock disc. RANGE stays TGT-01. Toast stack stays off the aim column (`src/ui/hud.css` 634–646).
- Jump refuse is fail-closed **before** charge. `beginJump` returns before `ctx.gate.jumping = true` (`src/game/jump.js` 104–112 vs 113–117). Jump box paints only when `ctx.gate.jumping` (`src/systems/hud.js` 1186–1203). Player does not see a fake JUMP fill.
- Digit map is unstolen. Digit 0 still selects shipyard (`src/systems/station.js` 185, 6026–6030). Digit 8 dock root is launch; Digit 9 dock root is Standing/epics (`src/systems/station.js` 185, 5891, 6026–6034). Outfitting Digit 8/9 stay papers (`src/systems/station.js` 6105–6108). Covering and jump bind no Digit.
- Digit 9 copy of the new lines is correctly **not** this serial. `standingLiveNotes` lists hunt, yards, ace/frigate min-rep, locker, graft, mining/patrol, restitution (`src/systems/station.js` 1160–1179). It does not list `Patrol covering.` or `No passage.` PR3 waits (`docs/Rep05ConsequencesDesign.md` 154, 232–238; contract §8).
- Throttle matches the spec. Covering: module `firedThisVisit`, reset on `systemLoaded`, separate from police-leave `firedThisVisit` (`src/game/police-cover.js` 17–21, 114–123, 161–176; `src/game/police-leave.js` 12–16). Jump: `refusedDestThisVisit` once per dest per visit (`src/game/jump.js` 15–19, 105–111, 189–197). Covering does not spam ticks. Jump does not spam KeyG.
- `reducedMotion`: no new `@keyframes`, no new toast class, no extra HUD motion. Existing toast fade already dies under `body.rw-reduced-motion #hud *` (`src/ui/hud.css` 1183–1188).
- XSS: covering and jump toasts are authored literals only. Faction names are not interpolated into those lines. Grep of `innerHTML` in `jump.js`, `police-cover.js`, `police-leave.js`, `hud.js`, `station.js`, `npc.js` is empty. Standing notes still use `h(..., text)` (`src/systems/station.js` 5797–5802).
- Covering skip while docked or jumping (`src/game/police-cover.js` 92–94). Patrol hunt is additive (`src/systems/npc.js` 1275–1281). `tickPoliceCover(ctx)` sits next to leave (`src/systems/npc.js` 2385–2386). Police leave chrome is unchanged.

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Leave toast and jump-refuse toast can share a visit

**Location:** leave band `< 0` and `> −10` (`src/game/police-leave.js`); covering `>= 10` (`src/game/police-cover.js` 8–9, 98–99); jump dest `< −25` (`src/game/jump.js` 9–10, 33)
**Issue:** Covering and leave bands never overlap. A player in the leave band who KeyG to a Marked dest can hear `Leave this space.` and later `No passage.` Same `comm` class. Strings already XOR. Do not add hub icons to “explain.”
**Fix:** None this wave. Keep three authored lines. Do not merge with `Leave this space.`
**Status:** accept.

#### 💡 Suggestion: Digit 9 still does not explain covering or jump refuse (PR3)

**Location:** `src/systems/station.js` 1160–1179; contract §8; `docs/Rep05ConsequencesDesign.md` 154, 232–238
**Issue:** Sim now exists. Standing pane still lists hunt/yards/locker/restitution only. That lag is named PR3. Stealing Digit 9 this serial would be a Blocker.
**Fix:** PR3. Use existing `h()` notes (`src/systems/station.js` 5800–5802). Do not add a Digit.
**Status:** optional / correctly deferred.

#### 💡 Suggestion: After the first `No passage.`, further KeyG is silent until dest/visit reset

**Location:** `src/game/jump.js` 105–111; jump box `src/systems/hud.js` 1186–1203
**Issue:** Same shape as police leave. Player sits in the zone with no second toast and no JUMP fill. That is the fail-closed picture, not missing glass.
**Fix:** Keep refuse + throttle. Do not write `world.nav` blocked. Do not light `jumping`.
**Status:** optional; do not implement extra chrome.

### HUD-01 / Digit / a11y / copy checklist

| Check | Spec | Result |
|---|---|---|
| Authored `Patrol covering.` exact | contract §4; `police-cover.js` 6, 172 | Pass |
| Authored `No passage.` exact | contract §4; `jump.js` 7, 108 | Pass |
| Do not reuse `Leave this space.` | contract §4; leave-only `police-leave.js` 5 | Pass |
| Do not reuse `No sale.` | contract §4; not in cover/jump | Pass |
| 80 px hub empty of new children | contract §0.2; `hud.css` 184–191; `hud.js` 709–712 | Pass |
| No ally pip / cover pip | contract §0.2, §1.4 | Pass |
| No lock box on glass | contract §2.1 | Pass |
| RANGE stays TGT-01 | `hud.js` 712 | Pass |
| commLine reuse, not new glass | `hud.js` 494–502, 1112–1131 | Pass |
| Toast `textContent` | `hud.js` 1130 | Pass |
| No `innerHTML` / no faction name in new lines | contract §0.4; cover/jump literals | Pass |
| Digit 0 shipyard | `station.js` 185, 6026–6030 | Pass |
| Digit 8/9 unstolen | dock launch/epics `station.js` 185, 5891, 6026–6034; outfitting papers 6105–6108 | Pass |
| No new Digit | PR1/PR2 have no Digit bind | Pass |
| Digit 9 copy of new lines not this serial | `standingLiveNotes` 1160–1179; PR3 | Pass |
| Once-per-visit throttle (no spam) | cover `firedThisVisit`; jump per dest Set | Pass |
| Color not the only cue | three authored English lines, same `comm` class | Pass |
| Keyboard | KeyG still jump; refuse is no-op + toast | Pass |
| Contrast / tokens | reuse `.rw-toast.comm`; `body.rw-contrast` covers toasts | Pass |
| Focus / hit targets | no new dock button | Pass |
| Empty / error | fail-closed skip vs lying widget (read 0) | Pass |
| Police leave chrome | unchanged `commLine` `Leave this space.` | Pass |
| Jump fill unused on refuse | do not set `jumping`; box hidden unless jumping | Pass |
| Chart lock box | none | Pass |
| Hail card | none | Pass |
| `reducedMotion` | existing HUD kill; no new `@keyframes` | Pass |

### Picture fail conditions (not findings this serial)

1. Adding a child to `.rw-reticle` (ally pip, cover pip, lock disc) is a 🔴 Blocker (HUD-01).
2. Binding Digit 0/8/9 to Access / Allies / Locks is a 🔴 Blocker.
3. Setting `ctx.gate.jumping` then cancelling so the JUMP bar flashes is a 🟠 Major (false charge).
4. A second toast glass, hail card, or `'allyAssist'` event is a 🟠 Major (new chrome vs `commLine` reuse).
5. Reusing `Leave this space.` or `No sale.` for covering/jump is a 🟠 Major (lying copy).
6. Putting covering / `No passage.` on Digit 9 **this** serial is a 🔴 Blocker (PR3 only).

### Verdict (repeat)

**CLEAN.** Live covering and inbound refuse reuse `commLine` `textContent` toasts, keep the 80 px hub empty, leave Digit 0/8/9 in place, and keep Digit 9 copy for PR3.
