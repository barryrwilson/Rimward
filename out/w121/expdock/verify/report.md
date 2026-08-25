# Wave 121 EXP remaining Unknowables dock leftover — verifier report

**Status:** CLEAN  
**Date:** 2026-08-25  
**Domain:** data  
**Browser:** [NO BROWSER COVERAGE] — Vite not started; dock chrome not opened.

## Verdict

Worker leftover freeze **CONSUME** / named serial **none** matches live code.

Live origin dock is authored `veil` / station **The Quiet** / dedicated `buildUnknowablesStation`.  
Live Archive at Unknowables is own crystal **400** / rival cube **900**.  
EXP-02 two-way at Unknowables is not dead.  
Wishlist “Unknowables dock still waits” is stale vs code. Code wins.

## What I tested

1. Read brief `docs/Exp04RemainingDockDesign.md`, inventory, and `shared-contract.md`. All three say **CONSUME**, serial **none**, name **no remaining Unknowables dock / Archive two-way leftover.**
2. Git write-set: worker pack is untracked markdown only. No `src/` in the pack.
3. Spot-checked live cites in `src/` (file reads; no Vite).
4. Confirmed honor files for this leftover were not in the worker write-set.
5. Did not run formatters, linters, or the full test suite.
6. Graph resolve (`omp`): `proceed_unmodeled`. No binding workflow.

## Live cite checks (code wins)

| Claim | Live | Result |
|---|---|---|
| Authored `veil` / The Veil / `unknowables` | `authored-systems.js` 234–255 | LIVE |
| Station The Quiet | `station: { name: 'The Quiet', ... }` line 243 | LIVE |
| hush → veil gate | hush gates line 175 `to: 'veil'` | LIVE |
| veil → hush gate | veil gates line 245 `to: 'hush'` | LIVE |
| Presence `th_veil` is hush landmark, not the dock | hush landmarks line 189 | LIVE (not a missing dock) |
| Dedicated builder | `stations/unknowables.js` `UNKNOWABLES_STATION_PATH` 13; `assembleUnknowablesStation` 15; `station.js` `buildUnknowablesStation` 308–316; dispatch 321 | LIVE |
| Not `DETAIL_STATIONS.unknowables` | `DETAIL_STATIONS` 567–578: 10 keys, no `unknowables` | Honor D3 |
| Archive allow Unknowables | `archiveDeskAllowed` 1210–1214: `unknowables` iff `UNKNOWABLES_STATION_PATH === true` | LIVE |
| Own / rival UU | `ARCHIVE_OWN_UU` 400 / `ARCHIVE_RIVAL_UU` 900 in `data-trade.js` 22–24; `archivePriceAtDesk` 1232–1238 | LIVE |
| Desk host | `renderArchiveDesk` 1419–1525; Market call 4784 | LIVE |
| Digit 0 shipyard | `DOCK_KEY_SERVICES` last key `shipyard` 188; menu hot 0 at 6035–6037; Digit 0 handler 6171–6173 | LIVE |
| Digit 8 / 9 | launch / epics (indices 7 / 8) | LIVE |
| No `innerHTML` in station/unknowables modules | grep 0 | LIVE |
| `h()` `textContent` | `station.js` 4464–4469 | LIVE |
| Session pending | `ui.dataPending` init 4447; clear 6087, 6107, 6138, 6184 | LIVE |
| No archive `WORLD_FIELDS` | `save.js` 77–101 | LIVE |
| `FACTIONS.unknowables` | `state.js` 605 | LIVE |
| `SYSTEMS` merge | `state.js` 583 | LIVE |
| No `EPICS.unknowables` | `EPICS` starts `freehold` 797–800; boot pin 20737 | LIVE |
| Chart id `veil` | `galaxychart.js` `AUTHORED_IDS` 54 | LIVE |
| Generator cluster | `generate-galaxy.mjs` grep `unknowables` 0 | LIVE |
| Contacts | `contacts.js` 97 Voice-Without; 114 roster | LIVE |
| Catalog | `model-catalog.js` 139–145 `station:unknowables` | LIVE |
| Yard | `shipyard.js` 29–30, 61 `UNKNOWABLES_STOCK = LIVING_STOCK` | LIVE |
| WAVE94 open-outs | `boot-test.mjs` 20708–20744: veil / The Quiet / gates / `archiveDeskAllowed('unknowables')` / `buildUnknowablesStation` | LIVE |
| `AUTHORED_IDS23` includes `veil` | `boot-test.mjs` 4915 | LIVE |
| Assembly `archiveFilePrice` cube 400 / crystal 900 | `data-trade.js` 187–201 | LIVE (Assembly helper; Unknowables prices live in `archivePriceAtDesk`) |
| Wishlist stale line | `PLAYER-EXPERIENCE-WISHLIST.md` 1446 “Unknowables dock still waits.” | Stale; pack did not edit it |

EXP-02 two-way path from live helpers:

- Buy legal crystal at Unknowables: `archivePriceAtDesk` 1233 → 400.
- Sell legal crystal at Unknowables: 1234 → 400.
- Sell Assembly cube (any `isDataSource`) at Unknowables: 1237–1238 → 900.
- Buy cubes at Unknowables: null / copy “The archive does not buy cubes.” 1333, 1479.
- Assembly still prices own cube 400 and rival crystal 900 via `archiveFilePrice`.

That is player-facing two-way. CONSUME is not wrong.

## Worker write-set (actual)

See `out/w121/expdock/verify/write-set.txt`. Git untracked only:

- `docs/Exp04RemainingDockDesign.md`
- `out/w121/expdock/code-review.md`
- `out/w121/expdock/current-exp-dock-inventory.md`
- `out/w121/expdock/notes.md`
- `out/w121/expdock/security-review.md`
- `out/w121/expdock/shared-contract.md`
- `out/w121/expdock/ui-audit.md`

No `src/`, `scripts/`, `public/`, `index.html`, `package.json` in the pack.  
No edit to wishlist, `PROGRESS.md`, `docs/UnknowablesDockDesign.md`, `docs/ExpDataTradeDesign.md`, `docs/OwnerDecisions*.md`, or `docs/OwnerDecisionsWave121.md`.

Workspace also has dirty sibling files **not** in this pack: `src/systems/galaxychart.js`, `src/ui/hud.css`, `docs/Nav07ChartLabelDesign.md`.

## Cite nits (not CONSUME bugs)

- Inventory §9 pins hush `th_veil` at boot-test **4947** and empty veil landmarks at **4949**. Live strings are **4946** (`hush` includes `th_veil`) and **4948** (`veil` landmarks `''`). Off-by-one. The pins exist.

## Reviews in pack

Security: no open CRITICAL/HIGH.  
Code-review: no open Blocker/Major.  
UI audit: no open Blocker/Major.  
Matches brief acceptance item 6 for this markdown pack.

## Bugs found

None. CONSUME stands.

## Environmental issues

None that block this census. Graph resolve on `omp` was `proceed_unmodeled`. No Vite. No Chrome.

## Evidence

- Screenshots: none ([NO BROWSER COVERAGE])
- Logs: none (no process started)
- Test output: `out/w121/expdock/verify/report.md`
- Write-set: `out/w121/expdock/verify/write-set.txt`
