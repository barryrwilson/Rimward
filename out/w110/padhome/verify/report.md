## Status
CLEAN

## What I tested
WAVE110 PHY-05 leftover: patrol authored hold + persist heal. Merge law `out/w109/padhome/shared-contract.md`.

Ran `node out/w110/padhome/probe.mjs` (PASS) and `node out/w110/padhome/wave110-pins.mjs` (WAVE110 ALL TRUE). Ran leftover `out/w58/routes/probe.mjs`, `out/w58/routes/verifier.mjs`, `out/w59/routes/verifier.mjs` (all CLEAN; patrol pins expect hold-off-pad). Isolated WAVE110. Did not run full `npm run test:boot`.

Read `src/game/world.js`: patrol wp0 uses `writeStationHold(..., 'heavy', gate)` not `station.clone()` (381). `healPadHome` allows trader/miner/patrol (712). `holdClassFor` returns known patrol scale else `'heavy'` (669–677). `rebuildTransitRegistry` and `tickBank` call `healPadHome` for patrol (457, 846). Fail-closed no-throw; no `speed = 0`; no third helper. `WORLD_FIELDS` has no `padHome`. Digit 0 still shipyard. Hub still 80 px RANGE. `git diff` of `npc.js` / `traffic-feel.js` / `state.js` is empty.

Hold dump: heavy hold xz 52.55 vs light 47.45. Fresh live patrol rounded xz 52.15, 3 legs, plain `{x,y,z}`. Old pad heal and tick keep speed 90. Trader/miner holds stay. Pirate/ace routes stay.

Browser: Vite 5174, Chrome CDP 9401, profile `out/w110/padhome/verify/chrome-profile/`. Hub 80×80 RANGE, no pad-home child. Digit 0 docked opens shipyard. Live `__ctx` patrol wp0 off pad. `[NO BROWSER COVERAGE]` for a visual of patrol hulls after save/load.

Killed Vite and verify Chrome. 5174 and 9401 not LISTENING.

## Bugs found
None.

Not bugs (do not fail this leftover):
- Sibling `station.js` MSN-03 SKU / `boot-test.mjs` WAVE108–109 hunks in the dirty tree.
- WAVE4/26/35 boot FAILs not run here.
- Stale `plainRoute` comment still says patrol home is gate (`world.js` 262–263). Code authors a hold.
- Live `record.speed` is unset on makeRecord; heal does not zero it.

## Environmental issues
`graph_resolve` bound `codex/workflow-browser-assisted-work`. Used Playwright MCP plus Chrome CDP 9401. No calendar/CRM writes.

Chrome capture printed `done` then the wrapper timed out on `browser.close()`. Killed leftover verify Chrome (pid 3396) and Vite (pid 27952). Did not kill the user's other Chrome windows.

## Evidence
- Screenshots: `out/w110/padhome/verify/pw-00-title.png`, `pw-01-hub.png`, `pw-03-dock.png`, `pw-04-digit0-shipyard.png`, `01-hub.png`, `02-digit0-undocked.png`, `03-dock.png`, `04-digit0-shipyard.png`
- Logs: `out/w110/padhome/verify/browser-log.txt`, `browser-states.json`, `pw-states.json`, `hold-dump.json`, `notes.md`
- Test output: `out/w110/padhome/verify/probe-output.txt` (PASS), `wave110-pins-output.txt` (WAVE110 ALL TRUE); w58/w59 leftover verifiers CLEAN in the session
