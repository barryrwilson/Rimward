# WAVE111 REP-03 Digit 9 climb copy — verify notes

**Verdict: CLEAN**
**Date:** 2026-08-24
**Domain:** mixed

Did not edit `src/`, `scripts/`, or `docs/`. Evidence only under `out/w111/rep03/verify/`.

## Graph

`graph_resolve` (`codex/agent-codex`) returned `proceed_unmodeled`. No catalog write.

## Probes

| Command | Result |
|---|---|
| `node out/w111/rep03/probe.mjs` | PROBE PASS |
| `node out/w111/rep03/wave111-pins.mjs` | WAVE111 REP-03 PASS, all 14 pins true |

Did not run full `npm run test:boot`.

## Source

`standingRemedialNotes` in `src/systems/station.js` 1195–1204. `renderEpics` prints climb notes after `HOW STANDING MOVES` (5855–5871), not inside the `standing < 0` RESTITUTION block (5832–5854). `h()` uses `textContent`. Fail-closed `try/catch` keeps move/live notes.

Live copy names mining/trade/hunt/passenger/explore/spy/war `+${MINING_REP}` (2), Known 10, Beautiful graft cap, patrol +5 Freehold Compact only.

No `innerHTML` in `station.js`. No `kind: 'remedial'`. No wanted/remedial `WORLD_FIELDS`. Hub `.rw-reticle` 80×80, children pupil + 3 cilia + RANGE only.

Digit 0 shipyard, Digit 2 Jobs board, Digit 8 `selectService('launch')` undocks (`station.js` 6009). Digit 9 epics/Standing.

## Browser

Vite `http://127.0.0.1:5173/` (`--strictPort --host 127.0.0.1`). Chrome CDP 9413, profile `out/w111/rep03/verify/chrome-profile/`. Playwright MCP same origin.

New Game (confirm) → origin Digit1 greenhand → dock Freehold.

Harness: `reputation.freehold = -8`, credits 2500.

Below 0: RESTITUTION + Pay restitution, climb notes under HOW STANDING MOVES.

Pay + Confirm: standing 0, credits 1300, RESTITUTION gone, climb notes remain.

Digit 2 Jobs board. Digit 0 Shipyard hangar. Digit 8 Launch undocks (pre-existing `selectService('launch')`). Hub 80×80, no extra child.

## Teardown

Stopped Playwright. Killed Vite 5173 and verify Chrome 9413. Ports not LISTENING.
