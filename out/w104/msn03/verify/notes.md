# Wave 104 MSN-03 PR1 verify notes

**Verdict:** CLEAN  
**Date:** 2026-08-23  
**Domain:** mixed  
**Graph:** owner said proceed_unmodeled. Do not follow Activar CRM. `graph_resolve` returned `blocked_ambiguous` (Activar/code-review clash). Work continued under that owner line.

Did not edit `src/`, `scripts/`, or `docs/`. Evidence only under `out/w104/msn03/verify/`.

## Probe

```
node out/w104/msn03/probe.mjs
```

Exit 0. Line: `PASS  all pins`. Every listed pin is true. Log: `probe-log.txt`.

## Static / git (`boardJobs` ~3603–3628)

Unique DONE skip sits next to the chain `done` skip:

```
if (j.kind === 'chain' && j.state === 'done') continue;
// Hide unique DONE on the board; keep the persist row (hide ≠ splice).
if (j.state === 'done' && (
  j.id === 'bounty-ace' || j.id === 'patrol-lane'
  || j.id === 'haul-provisions' || j.id === 'ferry-consignment'
)) continue;
```

- Exact four ids. No `in`. No `UNIQUE_JOB_KIND` in `boardJobs`.
- Offered/accepted unique fail `state === 'done'` — still pushed.
- Overlay `bounty-pirate-*` is not in the four ids — not skipped.
- `completeJob` (`3712–3725`) stamps `done` and does not splice. Sibling `writeJobState` loop is not this worker.
- uniqueRetry source stays in `renderJobs` (`5211–5214`) and ferry DONE reset stays in `acceptJob` (`4692–4697`).
- Digit 2 = `DOCK_KEY_SERVICES[1]` `'jobs'` (`185`). Digit 0 = last `'shipyard'` (`6029`, `6074`).
- `innerHTML` in `station.js`: 0.

Worker hunk in `git diff src/systems/station.js` is only those five skip lines in `boardJobs`. The rest of the 546-line `station.js` diff is sibling work.

## Sibling files (not this worker)

| Path | Result |
|---|---|
| `scripts/boot-test.mjs` | Dirty. mtime 2026-08-23 21:13 vs `station.js` hide 23:06. Tail hunk is WAVE103 HUD-ALERTS. No WAVE104 unique-done covering. Sibling, not MSN-03. |
| `src/game/save.js` | Dirty. mtime 17:49. Nav / hangar cargo. No unique-done skip. `uniqueJobId` still `Object.hasOwn`. No `uniqueDone` WORLD_FIELDS key. |
| `src/game/state.js` | Dirty. mtime 12:33. BIO cargo holds. Not this worker. |
| `src/game/jobs-chains.js` | Clean. mtime 2026-08-21. No write. |

Do not treat WAVE4/26/35 boot FAILs as this worker.

## Browser (Playwright MCP)

Vite: `http://127.0.0.1:5177/` (`--host 127.0.0.1 --port 5177 --strictPort`). Did not use 5174. Did not start CDP 9417 (Playwright MCP owns the browser).

Live dock at Freehold Landing:

1. Title NEW GAME confirm → origin Digit 1 Greenhand.
2. Console park: station +36u, `dockPressed`.
3. Digit 2 Jobs. Unique four cards present (`01-jobs-offered.png`). 18 job cards.
4. Console set unique four `state = 'done'` (no `src` rewrite).
5. Esc, Digit 2 again. Unique titles gone. `world.jobs` still holds four `done` rows. Total jobs still 18. Cards 14 (`02-jobs-unique-done-hidden.png`).
6. Family card `Haul Provisions` still on the board (not unique `haul-provisions`).
7. Digit 0 from overlay root → SHIPYARD hangar (`03-digit0-shipyard.png`).
8. Console: 0 errors, 0 warnings (`console.json`).

Pirate overlay DONE was not live (pirates were `offered`). Replica pin covers that case.

## Ports / teardown

Playwright `browser_close`. Stopped Vite PID 100512. After stop: 5177 `TimeWait` only, not LISTENING. 9417 never LISTENING.

## Not bugs

- Probe replica copies skip logic instead of importing `station.js`. Source-string pins still bind live code.
- uniqueRetry source is now unreachable for hidden DONE cards. Contract leaves that leftover.
- Design brief Honor line still says “do not edit station.js” from Wave 103. Status row already says Wave 104 PR1 landed. Docs leftover, not a hide bug.
