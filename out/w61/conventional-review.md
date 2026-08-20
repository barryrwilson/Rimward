# Code Review: HUD-02 conventional family brief

**Scope:** `out/w61/conventional-family.md`  
**Persona:** reviewer + orchestrator `code-review.md`.  
**Focus:** citation accuracy, locked-contract breaks, instrument existence.  
**Date:** 2026-08-18.

## Code Review: conventional-family.md

### Summary

The brief is an implementable mechanical skin on the existing HUD-01 tree. Citations match `hud.js` / `hud.css` / `song.js` / `settings.js` / `ctx.js`. Locked glance, empty glass, MATCH, scanner, HUD-03, and token rules are held.

### What's done well

- Instrument table names only nodes that `initHud` already builds.
- Hub keep-out (56 px) plus “replace iris, do not grow a second reticle” is testable.
- Switch is hull-derived; HUD-03 `body.rw-*` is left to accessibility.
- Audio is later, uses existing `CUES[typ]` / `ctx.lastEvents`, and names a NEW table without a fake `playCue` API.
- Alternative A (second DOM tree) is rejected for the once-created-node contract (`hud.js` 17–19).

### Findings

#### 🟠 Major: New emit types must join the frozen event comment

**Location:** `out/w61/conventional-family.md` §8.3 (first draft)  
**Issue:** `ctx.js` 30 / 188–210 freeze event types. A later `hudMechRange` emit without that comment would break the cross-system contract.  
**Fix:** Applied. §8.3 and §12 now require the three names in the `ctx.js` comment in the same audio change.  
**Status:** resolved

#### 🟡 Minor: Player hull flag does not exist yet

**Location:** `out/w61/conventional-family.md` §6  
**Issue:** `isBeautiful(faction)` (`organic.js` 67–69) is not a player-hull bit. `ctx.player` is `createShipState('light')` (`ship.js` 398) with `faction: 'independent'` (`state.js` 124). A later implementer must not treat `player.faction === 'beautiful'` as the switch.  
**Fix:** Brief already states the gap and defers the reader to the shared-contract worker.  
**Status:** documented; not a brief defect

#### 🟡 Minor: `rw-breathe` is unused

**Location:** `out/w61/conventional-family.md` §7  
**Issue:** `@keyframes rw-breathe` exists in `hud.css` 326–329 and has no selector. The brief says “do not attach.” Correct.  
**Status:** no change

#### 💡 Suggestion: Prefer CSS ticks so `initHud` stays allocation-free at swap time

**Location:** §4.4 / §10.3  
**Issue:** Optional 8 `span.rw-reticle-tick` nodes are allowed if the mask fails. Creating them once at init is fine. Creating them on hull swap is not.  
**Fix:** Brief already says create once, hide with CSS. Implementer should try `::after` first.  
**Status:** documented

### Citation check

| Brief claim | Verified |
|---|---|
| Rails `top: 57%`, 78 px | `src/ui/hud.css` 769–787 |
| 80×80 hub, −40 px margin | `hud.css` 181–189 |
| Iris `::after` + pupil + 3 cilia | `hud.js` 418–420; `hud.css` 317–357 |
| RANGE class + word | `hud.js` 894–904; `hud.css` 192–217 |
| Contacts bottom arc, scanner ≥ 1 | `hud.js` 489–519, 929–933; `hud.css` 671–679 |
| MATCH lamp; no throttle write | `hud.js` 150–174, 1174; `ctx.js` 28; `ship.js` 443 |
| First-person class only | `hud.js` 14–15, 784 |
| Color + tokens | `hud.js` 30–31; `hud.css` 8–26 |
| HUD-03 body classes / fields | `settings.js` 28–36, 67–70; `hud.css` 936–978 |
| `song.js` CUES + lastEvents + mute/volume | `song.js` 45–113, 400–431 |
| `textContent` helper | `hud.js` 93–98 |
| Facing FORE/AFT + reduced-motion outline | `hud.js` 177–205; `hud.css` 228–305 |
| Contact kind shapes | `hud.js` 207–211; `hud.css` 710–734 |
| Resolve band shape + word | `hud.css` 422–426, 469–472 |
| Frozen events | `ctx.js` 188–210 |

No false instrument names. No invented G/S/E, missiles, wingmen, or comm video.

### Contract check

- [x] Glance path unchanged
- [x] Aim glass empty; ticks on the ring; 56 px keep-out
- [x] No contacts around the reticle
- [x] Iris replaced, not stacked
- [x] One overlay, three cameras
- [x] No CRT green default
- [x] No new HUD-03 setting
- [x] Tendrils out of scope
- [x] No `src/` or `docs/` edit in this wave

### Verdict

Accept. One Major (frozen events) is fixed in the brief. Remaining notes are implementer cautions.

## Re-apply (after brief fix)

Re-read §8.3, §12, instrument table, §4.4 keep-out, §6 switch.

- Frozen-event gap is closed in the spec.
- No new Blocker / Major.
- Citations still match the files listed above.
- Aim glass still empty; no tendrils; no `src/` or `docs/` writes.
