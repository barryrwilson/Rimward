# UI Audit: Digit 0 Shipyard Hangar — Gilded graft offer + two-step confirm (Wave 82)

**Auditor:** `[designer]` (independent of `out/w82/stand/ui-audit.md`)
**Scope:** Digit 0 Shipyard Hangar graft offer and two-step confirm after `GRAFT_LIST_UU = 4000` debit. Kill standing helper is out of scope. Digit 9 Standing notes are out of scope.
**Review file:** `out/w82/stand/designer-audit.md`
**Method:** `orchestrator/references/ui-audit.md`. Source + `src/ui/screens.css`. No Playwright. [NO BROWSER COVERAGE].
**Date:** 2026-08-21
**Product source:** review only (no `src/` edits)

## UI Audit: Gilded hangar graft desk

### Summary
Hangar graft still uses a two-step mouse arm, then Confirm graft. Price `4000 UU` is visible on the offer row before arm and again on the confirm meta with the Beautiful warning. Esc cancels without debit. Digit 0 is still last hangar row. Hostile Gilded yard still uses `No sale.`; hangar hides the graft card instead. No Blocker. No Major.

### Verdict
**CLEAN.** 0 blockers, 0 majors, 1 minor, 2 suggestions.

### What's done well
- Offer meta prints list price before arm: `` `${GRAFT_LIST_UU} UU · Mounted plated hull.` `` (`src/systems/shipyard-desk.js:269-271`). Constant is `GRAFT_LIST_UU = 4000` (`src/game/shipyard.js:25-26`).
- Confirm meta repeats that UU and the warning in one `textContent` node (`src/systems/shipyard-desk.js:238-243`). Debit is `graftMounted` only after Confirm (`src/systems/shipyard-desk.js:158-176`, `src/game/hangar.js:750-760`).
- Warning is still present: `GRAFT_WARN` (`src/systems/shipyard-desk.js:63-64`) matches BIO-05 (“Beautiful Ones become immediate enemies”) and names the −10 hunt floor (`docs/BioLivingShipsDesign.md:191-195`).
- `reducedMotion === true` swaps to `GRAFT_WARN_REDUCED` (`src/systems/shipyard-desk.js:65, 239-243`). Shorter line, same enemy fact. No extra motion.
- Credits short uses the same player line as yard buy: `credits: 'Not enough credits.'` (`src/systems/shipyard-desk.js:59`, `29-31`). `graftRefuseLine('credits')` feeds `ui.notice` (`src/systems/shipyard-desk.js:67-69, 174`).
- Esc cancel: confirm button `Esc — Cancel` (`src/systems/shipyard-desk.js:248-251`); level-2 `Escape` calls `cancelGraftPending` before Back (`src/systems/station.js:5429-5430`). `cancelGraftPending` clears pending and notice, no debit (`src/systems/shipyard-desk.js:89-94`).
- `h()` assigns `textContent` (`src/systems/station.js:4079-4084`). `btn()` is `<button type="button">` (`src/systems/station.js:4086-4090`). `shipyard-desk.js` has no `innerHTML` / `insertAdjacentHTML`. Overlay rebuild uses `overlay.textContent = ''` (`src/systems/station.js:5309`).
- No Digit remap. Digit 0 still maps to hangar index 7 (`src/systems/shipyard-desk.js:104-113, 325-326`). Graft has no digit label. While `graftPending`, digits 3+ / 0 return true and do not mount (`src/systems/shipyard-desk.js:324`). Digit 1 / 2 still switch panes; leaving Hangar drops pending (`src/systems/shipyard-desk.js:79, 307-316`).
- Hostile Gilded: hangar `graftOfferVisible` requires `dockFactionOf === 'gilded'` and `dockReputation >= 0` (`src/systems/shipyard-desk.js:142-150`). Yard still paints `No sale.` when `rep < 0` (`src/systems/shipyard-desk.js:214-216`). Those paths do not share a card. Confirm-time reputation refuse is also `No sale.` (`src/systems/shipyard-desk.js:58, 174`; `src/game/hangar.js:739`).
- Confirm chrome matches papers: `.shipyard-confirm` cyan rail, `Confirm graft` uses `screen-btn-warm`, Cancel uses default `screen-btn` (`src/systems/shipyard-desk.js:240-251`; `src/ui/screens.css:102-112, 409-411`).
- Offer is gated on mounted plated, not Unknowables, not already grafted (`src/systems/shipyard-desk.js:142-150`). Empty state is hide, not a ghost card.
- Station head already shows `CREDITS n UU` (`src/systems/station.js:5318-5319`), so the player can compare 4000 UU before Confirm.

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: Confirm meta is one long muted line
**Location:** `src/systems/shipyard-desk.js:242-243`; `src/ui/screens.css:400-407`
**Severity:** minor
**Status:** open (acceptable wrap; do not split if the serial needs one meta `textContent`)
**Issue:** Confirm meta is `4000 UU ·` plus the full warning sentence, styled as `.shipyard-buy-meta` (12px, `#8a9db2`). Narrow dock panels wrap. The hostility sentence sits in the same caption class as yard “Confirm papers”, not a louder note.
**Fix:** Keep one meta node. Wrapping is acceptable. Optional later: a second `screen-note` for `GRAFT_WARN` only, still `textContent`.

#### 💡 Suggestion: Redraw after Offer graft drops keyboard focus
**Location:** `src/systems/station.js:5300-5310`; `src/systems/shipyard-desk.js:272-275, 244-247`
**Severity:** suggestion
**Status:** optional (same overlay rebuild as Confirm papers)
**Issue:** `render()` clears the overlay and rebuilds. After Offer graft, focus is not moved to Confirm graft. Tab starts at the top of the station chrome. Buttons remain real controls with `:focus-visible` (`src/ui/screens.css:88-100`).
**Fix:** Optional: after arming graft, `focus()` the Confirm graft button. Do not add a Digit for confirm.

#### 💡 Suggestion: Shipyard legend does not name graft
**Location:** `src/systems/shipyard-desk.js:297-298`
**Severity:** suggestion
**Status:** optional (graft has no Digit by law)
**Issue:** Legend is `1 Hangar · 2 Yard · 3+ hull on Hangar · 3+ papers on Yard · 0 last row · Esc back`. Graft is mouse / Tab only. Esc already cancels pending first. Players who only read the legend will not see graft until they scan the Hangar card.
**Fix:** None required. Do not bind Digit 0 to graft.

### Required checks

| Check | Result |
| --- | --- |
| Price visible before confirm | **Pass.** Offer row `4000 UU · Mounted plated hull.` (`shipyard-desk.js:271`). |
| Warning still present | **Pass.** Confirm shows `GRAFT_WARN` (`shipyard-desk.js:63-64, 242-243`). BIO-05 two-step still holds. |
| 4000 UU on offer and confirm | **Pass.** Both interpolate `GRAFT_LIST_UU` (`shipyard.js:26`; `shipyard-desk.js:243, 271`). Owner freeze `docs/OwnerDecisionsWave82.md:91`. |
| Credits refuse copy | **Pass.** `Not enough credits.` same string as yard `BUY_REFUSE_LINES.credits`. |
| Esc cancel | **Pass.** Button + `cancelGraftPending` on Escape. No write, no debit. |
| reducedMotion shorter warn | **Pass.** `GRAFT_WARN_REDUCED` = `Beautiful Ones become enemies.` |
| textContent | **Pass.** Station `h()` sets `textContent`. Desk copy goes through `h` / `btn`. |
| no innerHTML | **Pass.** None in `shipyard-desk.js`. |
| no Digit remap | **Pass.** Digit 0 remains last hangar / last yard row. Graft is not Digit 0. Pending swallows 3+ / 0 so mount cannot fire under confirm. |
| Hostile Gilded yard No sale vs graft | **Pass.** Yard note `No sale.` (`shipyard-desk.js:214-216`). Hangar hides graft (`graftOfferVisible`). Confirm-time `reputation` is `No sale.` notice, not a yard catalog row. |

### Accessibility
- Offer graft / Confirm graft / Esc — Cancel are real `<button type="button">`.
- Keyboard: Digit 0 opens Shipyard at dock level 1 (`src/systems/station.js:5419-5421`). Level 2 Digit 1 Hangar, Digit 2 Yard. Graft arm and confirm are Tab + click/Enter/Space. Esc cancels pending.
- Focus ring: existing `.screen-btn:focus-visible` 2px `var(--rw-accent)` (`src/ui/screens.css:95-100`).
- Contrast: offer/confirm names `#e6eef7` on `#0d1522`. Meta `#8a9db2` on `#0d1522` is the live yard caption; `body.rw-contrast` lifts `.shipyard-buy-meta` to `#c3d4e6` (`src/ui/screens.css:557-569`).
- Hit target: full-width `.screen-btn` padding `7px 12px` (`src/ui/screens.css:74-86`). Panel scrolls (`max-height: 82vh; overflow-y: auto`).
- `reducedMotion`: shorter warning text only. No animation added for graft.
- Semantic: cards stay `div.shipyard-buy-row` like yard papers. No hull-id interpolation on the graft card (hangar still shows `Mounted id …` above; pre-existing, not graft copy).

### States
- Offer visible: Gilded banner, Gilded standing ≥ 0, mounted `built`, not Unknowables, not `grafted` (`graftOfferVisible`).
- Offer hidden: any of those false. No ghost graft row. Not the yard `No sale.` card.
- Armed (`graftPending`): hangar list replaced by confirm box. Cyan rail. Price + warn. Confirm warm / Esc Cancel.
- Confirm success: notice `Tissue sealed to the hull.` Offer gone (already grafted). Header credits drop by 4000.
- Confirm refuse: notice from `GRAFT_REFUSE_LINES` (credits, reputation `No sale.`, dock, combat, living, already, banner, busy, …).
- Cancel: pending cleared, no `grafted`, no debit.
- Busy: `graftBusy` is a same-tick re-entry fence (`shipyard-desk.js:159-179`), not a spinner. Fine for this desk.
- Hover / focus: existing `.screen-btn` and `.screen-btn-warm` rules.
- Disabled: offer is hidden rather than disabled. Short credits still allow arm, then refuse on confirm (same as papers).

### Visual hierarchy / theming
- Graft reuses yard row chrome (`.shipyard-buy-row`, `.shipyard-buy-name`, `.shipyard-buy-meta`) plus `.shipyard-confirm` on the second step. No new hex on the graft path.
- Hardcoded `#0d1522` / `#22303f` on rows is existing shipyard chrome, not a Wave 82 graft add.
- Primary vs secondary: Confirm graft is warm; Cancel is default. Matches Confirm papers.
- Warning lives in muted meta (see Minor). Two-step still blocks debit until Confirm.

### XSS
- Graft labels are authored (`Graft tissue`, `Offer graft`, `Confirm graft`, `GRAFT_WARN`, UU from an integer constant).
- World strings on the Hangar pane (hull `name`) still go through `h()` `textContent`. Graft card does not print save names.
- No `innerHTML` on this desk.

### Independent vs worker self-audit
Worker `out/w82/stand/ui-audit.md` reported no 🔴/🟠, one wrapping minor, and a suggestion that the offer now includes price. This pass agrees: no Blocker, no Major, wrapping stays Minor. The offer price line is **done well**, not a defect. This pass adds two optional suggestions (focus after redraw; legend silence) and the required-check table. Kill standing helper was not audited.

### Not in scope / not inflated
- `applyPlayerKillStanding` / Digit 9 kill copy.
- Yard papers flow except where it must stay distinct from graft (`No sale.`, Digit 3+ papers, no Digit remap).
- Pre-existing `Mounted id ${mountedId}` on Hangar.
- Pre-existing hostile yard still listing Papers after the `No sale.` note (`shipyard-desk.js:214-228`). That is yard UX, not graft.
- Do not bind Digit 0 to Offer graft.
