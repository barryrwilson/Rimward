# UI Audit: Assembly Archive desk + Veridian/Redmarch fixer launder (Wave 82)

**Auditor:** `[designer]` (independent of `out/w82/exp/ui-audit.md`)
**Scope:** Market Archive block at Assembly docks (`as_census`, `as_archive`). People Digit 7 fixer launder at Veridian (`Lias Corrow`) and Redmarch (`Six-Finger Brack`). Not shipyard. Not HUD lock.
**Review file:** `out/w82/exp/designer-audit.md`
**Method:** `orchestrator/references/ui-audit.md` + `orchestrator/assets/designer-persona.md`. Source + `src/ui/screens.css`. No Playwright. [NO BROWSER COVERAGE].
**Date:** 2026-08-21
**Product source:** review only (no `src/` edits)

Owner freeze: `docs/OwnerDecisionsWave82.md` EXP table (own 400 / rival 900 / launder 250 / hostile `standingRead(assembly) < 0` → no sale / untinted steel). Brief: `docs/ExpDataTradeDesign.md`. Price helpers: `src/game/data-trade.js`.

## UI Audit: Archive desk and People fixer launder

### Summary
The Archive block sits under the ordinary Market table at live Assembly docks only. Copy prints **400 UU** for legal cubes and **900 UU** for rival crystals. Hostile standing prints **No sale.** and hides File verbs. Captured Assembly cubes print refuse copy with no sell button. Launder is a two-step mark on the existing fixer card at Veridian and Redmarch, with **250 UU** on the row and on confirm. `reducedMotion` shortens labels; File buy / File sell / Confirm filing / Mark legal / Confirm mark / Esc — Cancel stay. Digits do not debit data. Q/W/A/S stay `COMMODITY_KEYS`. Copy uses `textContent`. No Blocker. No Major.

### Verdict
**CLEAN.** 0 blockers, 0 majors, 1 minor, 2 suggestions.

### What's done well
- Archive gates on Market level 2, Assembly faction, and live `DETAIL_STATIONS.assembly` (`src/systems/station.js:1124-1126, 1300-1302, 4332`). Only `as_census` and `as_archive` are `faction: 'assembly'` (`src/game/galaxy.generated.js:6768-6854`). Freehold Market does not paint the block.
- Price helpers are authored constants, not `priceOf`: `ARCHIVE_OWN_UU = 400`, `ARCHIVE_RIVAL_UU = 900`, `LAUNDER_UU = 250` (`src/game/data-trade.js:21-26, 187-201`). Desk interpolates those numbers in `textContent` (`station.js:1307-1310, 1347, 1385, 1475-1477, 1499-1501`). `"UU unset"` is gone from `src/`.
- `priceOf('dataCube'|'dataCrystal')` is **0** even if `world.prices` is stuffed (`station.js:1937-1939`). `tryTrade` refuses data keys and points at the archive (`station.js:4226-4228`). Data tokens are not `COMMODITIES` rows (`src/game/state.js:309-322`).
- Hostile Assembly: `standingRead(..., 'assembly') < 0` paints `No sale.` and returns before File buy/sell (`station.js:1128-1130, 1312-1315`). Confirm-time hostile also prints `No sale.` and does not debit (`station.js:1207-1209`).
- Two-step Archive: File arms `ui.dataPending`; Confirm filing calls `confirmArchivePending`; Esc — Cancel / level-2 Escape call `cancelDataPending` (`station.js:1039-1043, 1317-1341, 5432`). Warm confirm vs default cancel (`station.js:1334-1341`; `src/ui/screens.css:102-112`).
- Two-step launder: Mark legal arms `ui.launderPending`; Confirm mark calls `confirmLaunderPending`; Esc — Cancel / People Escape call `cancelLaunderPending` (`station.js:1046-1050, 1467-1487, 5431`). Same papers-family button pair.
- Captured Assembly cube: no File sell. Note: `Captured cube — illegal in origin. Filing refused.` (`station.js:1369-1371`). Confirm refuse uses the same sentence (`station.js:1211-1213, 1329-1330`). Rival crystals still price at 900 regardless of `source` (`data-trade.js:198-200`).
- `reducedMotion === true` shortens title and row copy. Verbs stay File buy / File sell / Mark legal. Confirm stays Confirm filing / Confirm mark (`station.js:1305-1310, 1348, 1388, 1465, 1475-1477, 1499-1504`). No extra motion on the desk.
- `h()` sets `textContent` (`station.js:4079-4084`). `btn()` is `<button type="button">` (`station.js:4086-4090`). Archive and launder paths have no `innerHTML`. Labels come from `DATA_LABELS` / `FACTIONS.name` / integer UU, not `row.name`.
- No new Digit. Dock Digit 7 is still People (`DOCK_KEY_SERVICES` people at index 6). Level-2 People has no Digit handler (`station.js:5452-5480`). Launder is a fixer card action after Ask around (`station.js:5210`). Fence locker stays restricted-components only.
- Q/W/A/S on Market still walk `COMMODITY_KEYS` into `tryTrade` (`station.js:4303-4318, 5442-5448`). Archive confirm does not steal those keys.
- Untinted steel: Archive uses existing `screen-sub` / `screen-note` / `screen-btnrow people-actions`. Launder uses existing `people-note` on the fixer card. No data tint class.
- Empty Archive hold: buy row stays; `No crystal or cube in the hold.` (`station.js:1356-1358`). Empty captured hold: fixer launder paints nothing (`station.js:1515`). Hide, not a ghost verb.
- Busy fences `dataBusy` / `launderBusy` block double-apply (`station.js:1194-1195, 1412-1413`). Vanished lots clear pending and print hold copy (`station.js:1323-1326, 1470-1472`).
- Back / service change / dock / undock clear both pendings (`station.js:5339-5345, 5361-5363, 5378-5381, 5398-5401`).

### Findings

None at 🔴 Blocker / 🟠 Major.

#### 🟡 Minor: File buy stays armed when the hold is full or credits are short
**Location:** `src/systems/station.js:1346-1352, 1234-1250`
**Severity:** minor
**Status:** open (fail-closed confirm is enough for money safety)
**Issue:** The buy row does not check `cargoUsed + 1 > holdCap` or `credits < ARCHIVE_OWN_UU` before arming. Confirm then prints `Hold is full.` or `Not enough UU.` The player spends a click to learn a fact the header already shows (`CREDITS n UU · HOLD used/cap`, `station.js:5318-5319`).
**Fix:** Optional disable or a muted note on the buy row. Do not skip the two-step confirm. Yard papers also arm, then refuse.

#### 💡 Suggestion: Hostile Archive still prints 400 / 900 above "No sale."
**Location:** `src/systems/station.js:1306-1314`
**Severity:** suggestion
**Status:** optional (yard also names prices near a no-sale line)
**Issue:** Hostile standing hides File verbs but the rate line still reads legal cubes 400 UU and rival crystals 900 UU. A hostile player can learn the posted rates.
**Fix:** None required. If a later pass wants a colder hostile desk, drop the rate line and keep only `No sale.`

#### 💡 Suggestion: Redraw after File / Mark drops keyboard focus
**Location:** `src/systems/station.js:5300-5310, 1348-1351, 1504-1511, 1334-1336, 1480-1482`
**Severity:** suggestion
**Status:** optional (same overlay rebuild as Confirm papers / Confirm graft)
**Issue:** `render()` clears the overlay. After File a legal cube or Mark this lot legal, focus is not moved to Confirm filing / Confirm mark. Tab starts at station chrome. Buttons remain real controls with `:focus-visible` (`src/ui/screens.css:88-100`).
**Fix:** Optional: after arming, `focus()` the warm confirm button. Do not add a Digit for confirm.

### Required checks

| Check | Result |
| --- | --- |
| Prices 400 / 900 visible | **Pass.** Archive note interpolates `ARCHIVE_OWN_UU` / `ARCHIVE_RIVAL_UU` (`station.js:1307-1310`). Buy row: `Data cube · legal · 400 UU` (`station.js:1347`). Sell row appends ` · ${price} UU` (`station.js:1385`). Helpers: `data-trade.js:22-24, 187-201`. Owner freeze `docs/OwnerDecisionsWave82.md:78-79`. |
| UU unset gone | **Pass.** No `"UU unset"` in `src/`. Desk copy always prints the integer constants. If `LAUNDER_UU` were non-positive, `renderFixerLaunder` would hide (`station.js:1463`) and confirm would refuse (`station.js:1425-1427`). Live value is 250. |
| Hostile no sale | **Pass.** Render `No sale.` and return (`station.js:1312-1315`). Confirm `No sale.` no write (`station.js:1207-1209`). Gate `standingRead(assembly) < 0` (`station.js:1128-1130`; `data-trade.js:73-80`). |
| Two-step confirm | **Pass.** Archive File → Confirm filing. Launder Mark legal → Confirm mark. Debit/credit/flip only in `confirmArchivePending` / `confirmLaunderPending`. |
| Esc cancel | **Pass.** Confirm row button `Esc — Cancel`. Market Escape → `cancelDataPending`. People Escape → `cancelLaunderPending` (after traffic). No debit. |
| reducedMotion verbs | **Pass.** File buy / File sell / Mark legal when reduced; longer prose otherwise. Confirm filing / Confirm mark / Esc — Cancel unchanged. |
| Captured cube refuse copy | **Pass.** Hold row: `Captured cube — illegal in origin. Filing refused.` No File sell (`station.js:1369-1371`). Confirm: same sentence (`station.js:1211-1213`). |
| Launder 250 visible | **Pass.** List line and confirm meta interpolate `LAUNDER_UU` (`station.js:1499-1501, 1475-1477`). Success notice: `The lot is marked legal. 250 UU.` (`station.js:1450`). Owner freeze `docs/OwnerDecisionsWave82.md:80`. |
| textContent | **Pass.** Station `h()` assigns `textContent`. Archive/launder copy goes through `h` / `btn`. No `innerHTML` on these paths. |
| No new Digit | **Pass.** Digit 7 remains People at dock root. People level 2 has no Digit map. Launder is mouse/Tab on the fixer card. |
| Q/W/A/S stay commodities | **Pass.** Market keys still `tryTrade(COMMODITY_KEYS[ui.marketSel], …)` (`station.js:5445-5448`). Data keys are not in that list. |

### Accessibility
- File / Confirm filing / Esc — Cancel / Mark legal / Confirm mark are real `<button type="button">`.
- Keyboard: Digit 1 opens Market; Digit 7 opens People. Archive and launder arm/confirm are Tab + Enter/Space. Escape cancels pending first, then Back.
- Focus ring: existing `.screen-btn:focus-visible` 2px `var(--rw-accent)` (`src/ui/screens.css:95-100`).
- Contrast: Archive notes `#9fb2c6` on panel `#0a101b` / `#101826` (`screens.css:55-58, 26-33`). `body.rw-contrast` lifts `.screen-note` to `#c3d4e6` (`screens.css:557-569`). Launder uses `people-note` (no dedicated rule; inherits overlay `#e6eef7`, contrast overlay `#ffffff`). Hit targets reuse `.people-actions .screen-btn` padding `4px 10px` (same as traffic / Ask around).
- Hit target / overflow: panel `min-width: 560px`, `max-height: 82vh`, `overflow-y: auto`. Confirm rows are flex row (`.people-actions`). Long meta plus two buttons can wrap visually; acceptable at this panel width.
- `reducedMotion`: shorter copy only. No animation added for Archive or launder.
- Semantic: `div.screen-sub` / `div.screen-note` / `div.people-note` match Market and People chrome. No save `name` interpolation. Portraits on the fixer card keep authored `alt` (`station.js:5132`).

### States
- Archive visible: Market level 2, `faction === 'assembly'`, `DETAIL_STATIONS.assembly` live, not hostile.
- Archive hidden: any other dock/service. No ghost block.
- Hostile: rate line + `No sale.` No File buttons. Pending confirm is not shown (hostile return is before pending UI). Escape still clears `dataPending`.
- Buy idle: legal cube row + File buy / File a legal cube. Crystal buy is a note only: `The archive does not buy crystals.`
- Sell idle: one row per merged lot. Legal cube / Unknowable crystal get File sell. Illegal origin lots are notes only.
- Armed (`dataPending`): commodity table remains; Archive idle rows hide; confirm box shows price + Confirm filing + Esc — Cancel.
- Confirm success: notice names the file and the UU. Header credits update. Autosave requested.
- Confirm refuse: `No sale.` / `Not enough UU.` / `Hold is full.` / `The filing is no longer in the hold.` / `Captured cube — illegal in origin. Filing refused.` / `The archive will not file.`
- Launder visible: People level 2, contact `role === 'fixer'`, `systemId` veridian or redmarch, live fixer in `world.contacts`, `LAUNDER_UU` authored, at least one `source === 'captured'` lot.
- Launder hidden: no captured lot, or no fixer. Card still has Ask around.
- Armed (`launderPending`): confirm meta + Confirm mark + Esc — Cancel. Other captured lots hide until confirm/cancel.
- Busy: same-tick re-entry fence, not a spinner. Fine for this desk.
- Hover / focus: existing `.screen-btn` and `.screen-btn-warm`.
- Disabled: verbs hide or refuse on confirm. Short credits still allow arm (same as papers).

### Visual hierarchy / theming
- Archive is an additive `ARCHIVE` `screen-sub` after the Market table, not a new service and not a SKU column. Cyan subhead matches other desks. Untinted steel: no data color token.
- Primary vs secondary: Confirm filing / Confirm mark use `screen-btn-warm`; Cancel uses default `screen-btn`. Matches Confirm papers / Confirm transfer / Confirm graft.
- Launder lives on the fixer card under Ask around, not on the Gilded transfer helper (`renderTrafficDesk` is Gilded-only, `station.js:1798-1801`).
- Hardcoded people-card hex (`#0d1522` / `#22303f`) is existing People chrome, not a Wave 82 add.

### XSS
- Archive labels are authored (`DATA_LABELS`, File / Confirm strings, UU integers). Origin display uses `FACTIONS[key].name` through `textContent`.
- Launder lines use the same label map plus captured / origin name. No `row.name`. Sanitize drops unknown data rows before `dataHoldLots` paints them (`station.js:1146-1166`; `data-trade.js:83-96`).
- No `innerHTML` on Archive or launder.

### Independent vs worker self-audit
Worker `out/w82/exp/ui-audit.md` reported no 🔴/🟠, one minor (File buy arms when hold is full), and a suggestion that hostile still prints 400 / 900. This pass agrees. This pass also records the hold-full **and** short-credits arm on File buy as that same minor, and adds the optional focus-after-redraw suggestion (same overlay rebuild as other desks). Shipyard and HUD lock were not audited.

### Not in scope / not inflated
- Shipyard Digit 0 / graft / yard papers (except as confirm-family precedent).
- HUD lock / TGT-05 cone.
- Unknowables home dock (Wave 42 wait). No Unknowables Archive UI exists; `DETAIL_STATIONS` has no `unknowables` key (`station.js:519-530`).
- Drop-rate pod spawn (not a desk surface).
- Pre-existing `people-note` with no CSS rule (traffic desk already used it).
- Stolen lots have no first-impl spawn. Archive maps non-legal `source` to the word `captured` (`station.js:1364`); fixer lists `source === 'captured'` only.
- Do not bind a Digit to File or Mark legal.
- Do not put crystals/cubes on the Market SKU table.
