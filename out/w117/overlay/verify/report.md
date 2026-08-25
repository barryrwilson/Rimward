## Status
CLEAN

## What I tested
- Pack files exist under `docs/Ctl02OverlayDesign.md` and `out/w117/overlay/` (inventory, contract, notes, security-review, code-review, ui-audit, `verify/write-set.txt`).
- Worker write-set is markdown only. Pack markdown cites `src/` for census and later serial names. It does not ship JS.
- `git status`: overlay pack and `docs/Ctl02OverlayDesign.md` are untracked. `src/systems/hail.js` and `src/game/save.js` are clean vs HEAD. Dirty `src/` (`galaxychart.js`, `controls.js`, `hud.js`, `npc.js`, `ctx.js`, `autopilot.js`, `station.js`, `hud.css`, `world.js`, …) is sibling work. Overlay pack did not add mutex.
- `src/systems/overlay-policy.js` is absent. Grep `canShowHail` in `src/` is empty.
- Live leftover REAL vs inventory file:line:
  - Hail z 40 (`hail.js` 108). Module-local `open` (122). Header does not pause (`hail.js` 8–9).
  - `openCard` (326–403) does not read `ai.calmUntil`, `chartOpen`, or berth. `update` always calls `openCard` on `hailOpened` (421).
  - Salvage `letGo` writes no calm (185–186). Live `letGo` writes `time + 30` (192). Every resolve emits `hailClosed` then `closeCard` (294–295).
  - Digit1–9 still resolve while `open` (407–415). No hail/berth mutex.
  - Chart `setOpen` writes `flags.chartOpen` (420–427). KeyM open gate ignores hail/berth (`galaxychart.js` 668–678; KeyM body 670–675). `aria-modal=false` (113). CSS z-index 30 (`hud.css` 1908). `.rw-galaxy-chart` has no `pointer-events: none`.
  - Berth z 60, local `berthOpen` (`save.js` 1352, 1382–1388). KeyL ignores hail/chart (1486–1496). Hint: records hold while you fly (1376).
  - `ctx.flags` has `chartOpen` only among overlay flags (`ctx.js` 200–208). No `hailOpen` / `berthOpen`.
  - `WORLD_FIELDS` has no calm/overlay key (`save.js` 76–101).
  - NPC `makeAi`: `hailed: false` (227), `calmUntil: 0` (249). `updateResolve` returns during calm (1377). Bargaining hail 1414–1417. Demand hail 1869–1886 does not read `calmUntil`. Writer `ai.hailed = true` only at 1415.
  - `showApLive` live at 572–576, cancel 623, fly 709–718. `tryEngage` does not close the chart (627–636).
- Contract forbids Digit/hub steal, KeyJ remap, NAV-05 `showApLive`, close-chart-on-AP, toast-flood, `autopilot.js`, `hud.js` combat rails, `state.js`, `OwnerDecisionsWave117.md`, wishlist, `PROGRESS.md`. Design doc and notes match. `docs/OwnerDecisionsWave117.md` is absent.
- Serial is named only: **PR1 overlay-priority**. Deputize: mutex hail/chart/berth; defer incoming hail by skipping `openCard` only; session calm; never pause those three. No `src/` mutex this wave.
- `write-set.txt` later allow list matches contract §4: `hail.js`, `save.js` berth only, `overlay-policy.js`, `galaxychart.js` open gate only, optional `ctx.js` flags, `hud.css` z-index only if required. Later forbidden list matches contract (autopilot, controls KeyJ, `showApLive`, hud rails, state, station Digit, wishlist, PROGRESS). No brief vs contract allow-list mismatch.
- `docs/Ctl02OverlayDesign.md` exists. It states leftover **REAL**, not CONSUME, named serial **PR1 overlay-priority**.
- Did not start Vite. Did not start Chrome. `[NO BROWSER COVERAGE]` is correct.

Non-blocking cite nits (do not invert leftover REAL):
- Inventory KeyM range 667–677 is one line early vs live 668–678 (KeyM body 670–675). Code-review cites 669–674, which is the KeyM block.
- Inventory honor row `controls.js` 271 is blur `input.roll`. Live KeyH pulse is 288–289. Help H/J/C is 370; M/L are 374–375.

## Bugs found
None. Leftover is REAL. Serial is named. Mutex is not implemented in `src/` this wave.

## Environmental issues
None. No overlay worker process. No Vite. No Chrome.

## Evidence
- Pack: `C:\Projects\WebSim\docs\Ctl02OverlayDesign.md`; `C:\Projects\WebSim\out\w117\overlay\current-overlay-inventory.md`; `shared-contract.md`; `notes.md`; `security-review.md`; `code-review.md`; `ui-audit.md`; `verify\write-set.txt`.
- `hail.js` 8–9, 108, 122, 124–127, 184–192, 294–295, 308, 326–403, 407–415, 421: stack + reopen hole live. Salvage `letGo` has no `calmUntil`.
- `galaxychart.js` 24–27, 113, 420–427, 572–576, 623, 627–636, 668–678, 709–718; `hud.css` 1908: `chartOpen`, z 30, no hail/berth gate, `showApLive` sibling-owned.
- `save.js` 76–101, 1344–1497, 1352, 1376, 1382–1388, 1486–1496, 1544: berth z 60, local `berthOpen`, sim live.
- `npc.js` 227, 249, 1377, 1414–1417, 1869–1886; `world.js` 1245: calm gate is resolve-only; demand/Callow/openCard skip it.
- `ctx.js` 200–208, 261: `chartOpen` only. Helper file absent.
- `controls.js` 44, 288–292, 370, 374–375, 465: KeyJ dock live; KeyH hail; no overlay mutex.
- `main.js` 105–106, 149–176: title `systems[0]`; pause skips `system.update` and flushes events.
- `git status --short`: overlay markdown untracked; hail/save clean; sibling `src/` dirty; no `overlay-policy.js`.
- Contract §0.1 / §3 / §4 vs `write-set.txt` later allow/forbid: match. Design doc leftover REAL + PR1 overlay-priority: match.
