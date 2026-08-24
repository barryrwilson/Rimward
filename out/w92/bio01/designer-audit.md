# UI Audit: People sworn gift papers (Beautiful docks)

**Auditor:** `[designer]` (independent of `out/w92/bio01/ui-audit.md`)
**Scope:** Beautiful People desk gift papers (`src/systems/station.js` `renderPeople` / `renderGiftPapers` / gift pending). Related copy. People level-2 Digit 1 while the gift row is offered. Dock level-1 Digit 0 shipyard unchanged. Esc cancel. `hangar.js` / `bio-seed.js` are grant logic, not chrome. Pirate seed has no desk.
**Review file:** `out/w92/bio01/designer-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Source + `src/ui/screens.css`. No Playwright. [NO BROWSER COVERAGE].
**Date:** 2026-08-22
**Product source:** review only (no `src/` edits)

Owner freeze: `out/w86/bio01/shared-contract.md` §2.2. Desk copy: `docs/Bio01ObtainDesign.md`. Worker self-audit was re-checked, not copied.

## UI Audit: People gift papers

### Summary
Gift chrome lives on the Beautiful People desk as a two-step papers row. It reuses yard confirm classes, real buttons, and locked `textContent` strings. Digit 0 on the dock root is still Shipyard. People Digit 1 arms only while the gift is offered and does not confirm. Esc / KeyB cancel without a write. No Blocker. No Major.

### Verdict
**CLEAN.** 0 blockers, 0 majors, 2 minors, 3 suggestions.

### What's done well
- Surface is People, not a new `DOCK_KEY_SERVICES` key (`station.js:180`, `5401-5404`). Dock Digit 0 still maps to the last service, `shipyard` (`station.js:5677-5678, 5782-5784`).
- Two-step: unarmed `1 — Papers` / Digit 1 sets `giftPending`; grant is only `Confirm papers` (`station.js:5377-5397, 5847-5849, 5353-5362`). Matches contract §2.2 and the owner default (Digit 1 arms, does not confirm).
- Confirm is `screen-btn screen-btn-warm`; Cancel is a second real `<button>` (`station.js:5381-5388`; `screens.css:74-112`). Hit target is the full-width dock button (padding 7px 12px), not the compact `.people-actions` chip.
- Esc on People clears gift pending before traffic/launder and before Back (`station.js:5346-5350, 5792-5805`). `Esc — Cancel` on the row does the same. KeyB undocks and `undock()` clears `giftPending` / `giftBusy` with no grant (`station.js:5750-5768, 5807`).
- Locked copy via `GIFT_*` constants (`bio-seed.js:15-19`; `station.js:5358-5359, 5368, 5380`). Price 0: no fake UU. Success / full / already / no gift land on `ui.notice` through `giftNoticeFor`.
- `h()` / `btn()` use `textContent` and `<button type="button">` (`station.js:4238-4248`). No `innerHTML`. No gift class in `screens.css` (reuse only).
- Hide is rank + Beautiful banner + non-hostile (`isSwornGiftVisible`, `bio-seed.js:35-40`). Grant helper still re-checks. Reduced motion: same words, no extra motion.
- Gift sits after rescue and before contacts, so it still paints when the roster is empty (`station.js:5401-5408`). Pirate stays `commLine` only (`bio-seed.js:94-97, 149`).

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Unarmed and pending rows both print the arm line
**Location:** `src/systems/station.js:5377-5393`; `src/game/bio-seed.js:15`
**Severity:** minor
**Status:** open (two-step confirm still holds)
**Issue:** Unarmed meta, pending meta, and the arm notice all use `GIFT_ARM_LINE` (`The berth answers. Confirm the sworn gift.`). The unarmed control is still `1 — Papers`, not Confirm. After a successful grant the same arm line returns next to success notice `A living seed rests in the hangar.` because `isSwornGiftVisible` does not hide on already-owned.
**Fix:** Give the unarmed row a shorter meta (or none). Keep the contract arm line on pending + `ui.notice` only. Optional: after `already` / success, swap the card to a static already line with no Papers button.

#### 🟡 Minor: Gift notice is not a dedicated `aria-live` region
**Location:** `src/systems/station.js:5706`; `src/ui/screens.css:170-176`
**Severity:** minor
**Status:** open (same dock pattern as yard / graft; not gift-only)
**Issue:** Success, full, already, and no-gift copy write `ui.notice`, then `render()` rebuilds `.station-notice` without `aria-live`. HUD toasts already set `aria-live="polite"` (`hud.js:762`). Screen-reader users can miss the grant result.
**Fix:** Set `aria-live="polite"` (and a stable name) on `.station-notice` for the dock overlay. Do not add a second live region only for gift.

#### 💡 Suggestion: Gift row stays offered after the seed is already in the hangar
**Location:** `src/game/bio-seed.js:35-40`; `src/systems/station.js:5372-5398`
**Severity:** suggestion
**Status:** optional (confirm fail-closed still prints `You already carry that gift.`)
**Issue:** Visibility is banner + Sworn only. After a grant, Papers remains on every Beautiful People desk. A second confirm is a dead click into the already line. Contract says UI hide is not a grant gate; hiding the verb after already is still allowed.
**Fix:** If `hull_seed_gift` is already in `hulls`, omit the Papers button (or omit the card). Keep the helper gate.

#### 💡 Suggestion: No hangar `n/8` on the gift row
**Location:** `src/systems/station.js:5377-5393`; contract §1.4 / w86 ui-audit suggestion
**Severity:** suggestion
**Status:** optional
**Issue:** Full hangar still lets the player arm and confirm into `The hangar is full.` Header already shows hold, not hangar count.
**Fix:** Optional meta `Hangar n/8`. Do not skip the two-step or the helper refuse.

#### 💡 Suggestion: Redraw after arm drops keyboard focus
**Location:** `src/systems/station.js:5365-5384, 5659-5708`
**Severity:** suggestion
**Status:** optional (same overlay rebuild as yard Confirm papers)
**Issue:** `render()` replaces the panel. After Digit 1 / Papers, focus is not moved to Confirm papers. Tab starts at Back.
**Fix:** After arm, `focus()` the warm confirm button. Do not bind Digit 1 to confirm.

### Required checks

| Check | Result |
| --- | --- |
| Gift home is People | **Pass.** `renderPeople` calls `renderGiftPapers` (`station.js:5401-5404`). No new dock service. |
| Digit 0 shipyard | **Pass.** `DOCK_KEY_SERVICES` last key is `shipyard` (`station.js:180`). Level-1 Digit 0 selects that last key (`station.js:5782-5784`). Menu hotkey for shipyard is `0` (`station.js:5677-5678`). People Digit 1 is level-2 only (`station.js:5846-5850`). |
| Digit 1 arms only while offered | **Pass.** `n === 1 && isSwornGiftVisible(ctx) && !ui.giftPending` (`station.js:5847-5849`). Pending Digit 1 does not call `confirmGiftPapers`. |
| Two-step Confirm papers | **Pass.** Arm sets pending + arm line (`station.js:5365-5369`). Grant only in `confirmGiftPapers` (`station.js:5353-5362`). |
| Esc / KeyB cancel | **Pass.** Row Cancel, People Escape, Back, `selectService`, dock, undock all clear `giftPending` without `grantSwornGift`. |
| Copy table | **Pass.** Arm / success / full / already / no gift match contract §2.2 (`bio-seed.js:15-19`). Title `Sworn gift` is desk chrome only (`station.js:5379, 5392`). |
| No fake UU | **Pass.** Gift row never interpolates a price. |
| Real buttons + focus ring | **Pass.** `btn()` (`station.js:4245-4248`). `.screen-btn:focus-visible` outline (`screens.css:88-100`). Warm confirm hover/focus (`screens.css:102-112`). |
| Theming | **Pass.** No new gift CSS. Reuses `.shipyard-buy-row` / `.shipyard-confirm` / `.screen-btn-warm`. High-contrast already covers `.shipyard-buy-meta` (`screens.css:595-607`). Hardcoded row colors are existing yard tokens, not a gift palette. |
| Reduced motion | **Pass.** Same words. No extra animation. Traffic desk branches on `reducedMotion`; gift does not need to. |
| Pirate chrome | **Pass.** No People/HUD pirate panel. `commLine` only (`bio-seed.js:149`). |
| textContent | **Pass.** Station `h()` assigns `textContent`. Gift strings are source literals. |
| Empty / error / disabled | **Pass.** Not Beautiful / below Sworn / hostile: row omitted. Confirm fail-closed via helper. `giftBusy` is a sync re-entry lock (`station.js:5354-5361`); no spinner required. |

### Accessibility
- Papers / Confirm papers / Esc — Cancel are real `<button type="button">` with visible names.
- Keyboard: dock Digit 0 = shipyard; People Digit 1 = arm only while offered; Escape cancels pending first; KeyB launches with no grant.
- Copy is words, not a color-only rank pip. Confirm uses warm border **and** the Confirm papers label. `.shipyard-confirm` cyan rule is extra, not the only signal (`screens.css:409-411`).
- Contrast: gift type reuses `.shipyard-buy-name` / `.shipyard-buy-meta` / `.station-notice` (existing dock stack). `body.rw-contrast` already brightens buy meta.
- Focus ring: inherited `.screen-btn:focus-visible`.
- `aria-live` on the grant notice is still missing (Minor above). Do not treat worker “none this wave” as a freeze against a polite live region.

### Keyboard
- Dock level-1 Digit 0 → shipyard (unchanged)
- People level-2 Digit 1 → arm only while `isSwornGiftVisible` and not pending
- Digit 1 while pending does not confirm (button does)
- Esc cancels pending before leaving People
- KeyB undocks; pending is dropped; hangar is not written

### Worker self-audit
`out/w92/bio01/ui-audit.md` is accurate on Digit 0, two-step, Esc, copy, warm confirm, and pirate-no-chrome. It under-states the arm-line reuse on the unarmed (and post-grant) card. The `aria-live` skip is a dock-wide pattern, not a gift exemption; it stays Minor here.

### Method
Independent pass of `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. No product files edited.
