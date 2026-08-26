# Wave 129 HUD-07 PR1 notes

**Verdict:** leftover **REAL**. Serial **PR1** landed in `src/systems/hud.js` + `src/ui/hud.css`.

## Method

- Graph resolve: `proceed_unmodeled` (`r-mt9oi1d4-04605e00`). No active workflow.
- Merge law: `out/w128/deconflict/shared-contract.md` wins.
- Did not edit Hail02 toast functions. Did not edit `.rw-galaxy-*`. Did not touch `galaxychart.js`.
- Did not start Vite or Chrome. Ports 5175 / 9412 unused.
- Did not write `scripts/boot-test.mjs`. Pins live in `boot-pins.md`.

## Lands

- Hide `.rw-target-name` when a ship lock shows `.rw-combat-name`.
- Hide RANGE **word** when rail DIST / bracket meta dist is up; keep `.in-range` ring.
- Hide LEAD **word** in cruise and on hub/bracket/path collision; keep lead ring.
- Hide chartmark / HOME pip **labels** on those collisions; keep diamond / pip / POS HOME.
- Cruise CSS: RANGE/LEAD words opacity 0.14. No second hide of HOME/GATE/J/POS.
- `stripHudText` on rail name. `rw-yield` hide-not-delete. Fail-closed try/catch.

## Honor

- HUD-01 80 px hub: no new child.
- HUD-06 inset 108.
- TGT / NAV-02 inset 84.
- Toast linger 8 s, five slots.
- `innerHTML` 0. No persist. No new live region.

## Reviews

- Security: low; no open high/critical.
- Code: no Blocker/Major.
- UI: no Blocker/Major.
- Re-run: not required (no HIGH/CRITICAL/Blocker/Major to fix).

## Processes

Started none.
