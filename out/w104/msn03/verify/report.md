## Status
CLEAN

## What I tested
- Ran `node out/w104/msn03/probe.mjs`. Exit 0. Every pin is true. Log: `out/w104/msn03/verify/probe-log.txt`.
- Read `src/systems/station.js` `boardJobs` (3603–3628). Unique-four `done` skip sits next to chain `done` skip. Exact ids: bounty-ace, patrol-lane, haul-provisions, ferry-consignment. No `in`. Offered/accepted unique still pushed. Overlay pirate DONE not in the four ids.
- `completeJob` (3712–3725) stamps `done` and does not splice.
- uniqueRetry source stays in `renderJobs` (5211–5214) and ferry DONE reset stays in `acceptJob` (4692–4697).
- Digit 2 is still Jobs (`DOCK_KEY_SERVICES[1]`). Digit 0 is still shipyard (last service).
- `scripts/boot-test.mjs` was not this worker (mtime 21:13 vs hide 23:06; tail is WAVE103 HUD covering; no WAVE104 unique-done section).
- No `jobs-chains.js` write. `save.js` / `state.js` working-tree diffs are sibling (nav/hangar, BIO cargo), not unique-done hide.
- Live dock: Vite `127.0.0.1:5177` only. Playwright dock at Freehold. Digit 2 Jobs. Console set unique four to `done`. Cards gone; `world.jobs` still holds four `done` rows (18 jobs persist). Digit 0 shipyard. Console 0 errors / 0 warnings from this skip.

## Bugs found


## Environmental issues
- `graph_resolve` returned `blocked_ambiguous` (Activar vs code-review). Owner line: proceed_unmodeled, do not follow Activar CRM. Verify continued.
- Overlay pirate DONE was not live (pirates were `offered`). Replica pin covers that case.
- After Vite stop, 5177 showed TCP `TimeWait` only, not LISTENING. 9417 was never LISTENING.

## Evidence
- Probe: `out/w104/msn03/verify/probe-log.txt` — `PASS  all pins`, exit 0
- Screenshots:
  - `out/w104/msn03/verify/01-jobs-offered.png` — unique four on Digit 2
  - `out/w104/msn03/verify/02-jobs-unique-done-hidden.png` — unique four gone after `done`
  - `out/w104/msn03/verify/03-digit0-shipyard.png` — Digit 0 shipyard
- Console: `out/w104/msn03/verify/console.json` — 0 errors, 0 warnings
- Notes: `out/w104/msn03/verify/notes.md`
