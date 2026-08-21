# UI Audit: Dock Digit 2 Jobs + Digit 9 Standing (Wave 83)

**Verdict:** CLEAN

Review only. Product source was not edited.

Scope: Digit 2 chain cards; Digit 9 restitution desk (`RESTITUTION_UU` 1200, two-step, Esc cancel); spy/war card copy if expose/target lines changed. Owner: no new Digit; Digit 0 stays shipyard; HUD-02 closed.

## Summary

Chain cards reuse the Jobs `h()` / Accept pattern, hide `done`, and print station and faction display names rather than system keys. Restitution copies the shipyard graft two-step (pending, warm Confirm, Esc cancel). Short credits and non-negative standing hide the pay control while 1200 UU still appears in copy when the desk is relevant. Spy and war dest lines still use station/faction display names. No Blocker or Major defects.

## Owner checklist

| Check | Result |
|---|---|
| Digit 2 = Jobs; Digit 9 = Standing; Digit 0 = Shipyard | Pass. `DOCK_KEY_SERVICES` is market…epics, shipyard last. Hotkey last index is 0. |
| No new Digit / HUD-02 closed | Pass. Chain and restitution stay in existing panes. No HUD family. |
| Chain offered / accepted / hide done | Pass. Offered only at origin (+ Known gate on step 1). Accepted stay on the board. `done` is skipped. |
| Dest names not system keys | Pass. Station names (`Freehold Landing`, `Veridian Spire`, `Ledger Anchorage`, …) and `FACTIONS[].name`. |
| `textContent` / no XSS innerHTML | Pass. Station `h()` sets `textContent` only. |
| Restitution 1200 UU visible | Pass. Offered note, pending meta, short note, and Digit 9 how/live lines. |
| Pay hidden when short or standing ≥ 0 | Pass. Short: note only. Standing ≥ 0: no RESTITUTION block. |
| Two-step: pending, Confirm, Esc cancels, no debit | Pass. Matches graft/yard papers. |
| Spy dest / war target copy | Dest and flag lines use display names. Expose −2 / war target −2 are not on the cards (see Suggestion). |

## What's done well

- `h()` in `station.js` writes `textContent` only; buttons are real `<button type="button">` with existing `:focus-visible` rings.
- Confirm restitution uses `screen-btn-warm` plus `.shipyard-confirm` cyan rail, so the costly step is visually primary vs Cancel.
- First-step label is **Pay restitution**; second-step is **Confirm restitution**. The labels do not collide.
- Visible **Esc — Cancel** control plus `keydown` Escape that cancels pending without leaving Standing and without debit.
- Short state hides the pay button instead of teasing a dead control. 1200 UU remains in the note.
- Chain `done` does not occupy the board. Other families still show DONE. That matches MSN-03 hide-done.
- Spy dest resolve falls through to `the far dock` when the id is unknown. It does not print a stuffed system key.
- War quarry names reject `recordId`-shaped strings (`warCardName`). Dest station and employer/target flags use display names.
- Chain copy never names Dart/Auto SKUs. Last-step reward is UU at the home dock.
- Digit 2 Accept (n) still works for chain offered cards. Chain has no deadline line (MSN-03).
- 1 s docked rebuild restores `scrollTop`, so arming confirm does not snap the panel away from the desk.

## Findings

None at Blocker or Major.

#### 🟡 Minor: Digit 9 still omits spy expose and war target writers
**Location:** `src/systems/station.js:1122-1154`, spy/war cards `4850-4871`
**Issue:** Wave 83 writes target standing −2 on accepted spy lapse (`SPY_EXPOSE_DELTA`) and on war success (`WAR_TARGET_DELTA`). Jobs header still only says spy/war credit the dock flag (+2). Digit 9 how/live notes list mining, patrol, rescue, sale, graft, and restitution, but not expose or war target loss. A player can accept those cards without a Standing-pane explanation of the dest-faction hit.
**Fix:** Optional for this wave (MSN-02 first impl did not require a notes edit). If copy is opened, add one how-line each: spy lapse −2 dest flag, secret success dest 0; war success dest −2. Keep cards on dest station names; do not print system keys.

#### 🟡 Minor: Restitution confirm does not name the faction or the Beautiful graft cap
**Location:** `src/systems/station.js:5496-5516`; apply path `src/game/restitution.js:62-64`
**Issue:** Offered copy says “this dock's standing”. Success comm says “the dock flag”. Rank line above already has `factionDisplayName`. If a Beautiful graft is live, `applyAbominationStanding` may pull the key to −10 after the set-to-0, so the desk can remain after a 1200 UU debit. Live notes already mention the graft cap; the confirm row does not.
**Fix:** Prefer `Pay 1200 UU to return ${fname} standing to 0.` If graft is live on a Beautiful dock, add one warn line that the cap may hold −10.

#### 🟡 Minor: Chain station names skip `stripControlChars`
**Location:** `src/game/jobs-chains.js:88-123`; accepted dest `station.js:5070-5078`
**Issue:** MSN-03 UI asked for station names after `stripControlChars` / `NAME_MAX`. Spy cards do that (`spyStationName`). `chainCardCopy` / `stationDisplayName` print raw `SYSTEMS[].station.name`. Authored names are clean (`Freehold Landing`, `Veridian Spire`, `Ledger Anchorage`, `Hollow Anchorage`), and `textContent` still blocks HTML. The gap is sanitizer consistency, not XSS.
**Fix:** Route chain labels through the same strip/slice helper as spy.

#### 💡 Suggestion: Pending confirm does not take focus; Digit/Enter does not confirm
**Location:** `src/systems/station.js:5497-5505`, keydown `5722-5727`, docked refresh `5823-5825`
**Issue:** After **Pay restitution**, `render()` rebuilds the overlay. Focus is not moved to **Confirm restitution**. Standing has no Digit handler. Enter does not confirm. Esc cancel works. This matches graft/yard papers, including the 1 s panel rebuild.
**Fix:** After painting pending, `focus()` the warm confirm button. Optional: while `restitutionPending`, treat Enter as confirm (not Digit, so Digit 0 stays shipyard on the root menu).

#### 💡 Suggestion: Restitution copy could stay “this dock” if rank already names the flag
**Location:** `src/systems/station.js:5486-5508`
**Issue:** Same as the existing station `ui-audit.md` note. Not a defect if the graft-cap line is the only copy change later.
**Fix:** Optional.

## Accessibility

- Contrast: job titles `#e6eef7` on `#0d1522`; notes `#9fb2c6`; pay `var(--rw-good)`; confirm warm `var(--rw-warm)` with existing hover/focus. Tokens are the screen overlay palette. Confirm left rail `#6fd2e0` matches `--rw-accent`.
- Focus rings: `.screen-btn:focus-visible` outline 2px accent, offset 2px.
- Semantics: buttons, not clickable divs. No `aria-live` on `station-notice` (existing dock pattern).
- Keyboard: root 1–9 / 0 select service. Jobs Accept (1–9) plus mouse. Restitution is mouse + Tab + Esc. Not a Blocker because graft uses the same two-step.
- Hit targets: confirm buttons are full-width `screen-btn` (padding 7×12). Job Accept stays compact (`4px 10px`) like other family cards.
- `reducedMotion`: no extra confirm animation.

## Theming

Restitution reuses `.shipyard-buy-row.shipyard-confirm` and `.screen-btn-warm`. No new hardcoded screen or HUD chrome. Job cards keep the existing left rail.

## States

| State | Behavior |
|---|---|
| Standing ≥ 0 | RESTITUTION block absent (`5494-5516`). How/live notes still mention 1200 UU. |
| Standing < 0, credits ≥ 1200 | Note + **Pay restitution**. |
| Standing < 0, credits < 1200 | `Restitution 1200 UU. Not enough UU.` No button (`restitutionShort`). |
| Pending | Confirm row; 1200 UU in meta; warm Confirm; Esc — Cancel. |
| Confirm success | Pending cleared; notice = result line; desk hides if standing no longer < 0. |
| Confirm short / not on offer | Notice; no debit from the UI path beyond `applyRestitution`. |
| Esc / Back / undock / change service | `restitutionPending = false`. Esc on Standing cancels first and stays on the pane. |
| Chain offered | Accept (n). No timer. |
| Chain accepted | `ACCEPTED — file at <station>` or `ACCEPTED — dock at <dest station>`. |
| Chain done | Not rendered (`boardJobs` continue). |
| Spy/war offered | Dest display names + remaining time (existing mining deadline helper). |

## Visual hierarchy

Jobs: title → detail → green reward → Accept or warm ACCEPTED. Chain reward is secondary (“Chain paper — last step pays …”) so it does not look like an instant payout.

Standing: RESTITUTION sits after the live rank/ladder and before how/live explain. Confirm is a distinct card, not a second identical Pay button.

## Spy / war card copy (changed lines)

Spy (`4850-4858`, `4952-4962`, `5051-5062`): `Spy at <dest station>`; gather/file lines use `spyCardDestName` / `spyStationName` / employer display name. No system id. Expose −2 is not on the card (Minor above).

War (`4859-4871`, `4963-4973`, `5063-5067`): `Strike <quarry>`; dest station + `for <target faction display>`; employer “pays on a witnessed kill”. Target −2 is not on the card (Minor above). `recordId` is not printed.

## Digit map (unchanged)

`src/systems/station.js:174` `DOCK_KEY_SERVICES` = Market 1, Jobs 2, Bar 3, Feed 4, Repair 5, Outfitting 6, People 7, Launch 8, Standing 9, Shipyard 0.

`5612-5616`, `5710-5717`: Digit 0 selects the last service (shipyard). No eleventh service.

## Status

CLEAN. 🟡/💡 only. No 🔴/🟠. Worker lifecycle: do not block DONE on these notes; document or take the quick copy wins if the pane is already open.
