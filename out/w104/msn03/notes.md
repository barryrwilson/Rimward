# Wave 104 MSN-03 PR1 notes

**Status:** hide-on-board landed. Persist keep unchanged.  
**Verify:** `node out/w104/msn03/probe.mjs` — all PASS.  
**Browser:** `[NO BROWSER COVERAGE]` — live dock skip. Probe + static Jobs copy is enough this wave. Ports 5175 / 9415 were not started and were not LISTENING at handoff.

## What landed

`boardJobs` now skips unique four when `state === 'done'`, immediately after the chain `done` skip (`src/systems/station.js` 3616–3621). Hide is a filter. `completeJob` still stamps `done` and does not splice (3712–3725).

## What did not land

- No splice / persist delete
- No `uniqueRetry` rewrite (`renderJobs` 5211–5214; ferry reset 4692)
- No `scripts/boot-test.mjs` (sibling REP-05)
- No `save.js` export of `uniqueJobId`
- No memorial pane, no new Digit, no empty-state string
- No HUD glance, no `innerHTML`, no `state.js` write, no SKU

## WAVE26 leftover

Boot still mutates haul/ferry to `offered` before Digit 2. Hide of `done` does not hide that offered card. uniqueRetry Accept remains in source; hidden DONE cards cannot reach it.

## Digit freeze (static)

- Digit 2 = `jobs` (`DOCK_KEY_SERVICES[1]`)
- Digit 0 = last = `shipyard`
- Header `JOBS BOARD — ${station} postings` stays
