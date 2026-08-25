## Status
BUGS_FOUND

## What I tested
Static read of `src/systems/station.js` (`keepUniqueJobRows` unique-four identity, `persistJobById` first-row live, unique DONE hide in `boardJobs`, unique-four skip in JOB_HANDLES prune, `completeJob` persist prefer, unique haul/ferry `persistHaul`/`persistFerry` delivery, `DOCK_KEY_SERVICES`, no `innerHTML`) and `scripts/boot-test.mjs` (`w26ReofferFerry` ferry-only, live `ferry-consignment` + `haul-provisions` re-find after delivery ticks). Unique DONE skip is still present at `boardJobs` (`state === 'done'` unique four `continue`; persist row kept, no splice). Offered/accepted unique four still push. Digit 2/0/8/9 mapping is unchanged (`DOCK_KEY_SERVICES` = market, jobs, …, epics, shipyard; Digit2 still jobs, Digit0 still shipyard). Later-wave pins still assert `digit2Jobs` / `digit0Shipyard` / Digit8/9.

Ran `npm run test:boot` from `C:\Projects\WebSim`. Full log: `out/w-boot-fix2/wave26/verify/boot-test-3.log`. No leftover `node scripts/boot-test.mjs` after the run.

## Bugs found
- WAVE26 LANE DELIVERY / FERRY QUOTE / HAUL QUOTE / OLD-SAVE FALLBACK / SAVE FIELDS / RESTORE: **not** present. Pin dump: `ferryDone:true`; `haulDone:true`; all delivery pins true (`ferryPaidExactlyQuoted`, `haulPaidExactlyQuoted`, `creditsDeltaIsBothQuotes`, `ferryPaid=385`, `haulPaid=770`). Unique DONE hide was **not** removed (`keepUniqueFour:true` in wave83; skip still in `station.js`).
- `[OTHER TASK]` **WAVE83 MISSILES FAIL** (joint boot-test gate). Pin dump: `toastCopy:false`; all other wave83 missile pins true (`toastThrottle:true`, so `dartToasts.length === 1`; `textContent` is not `'Incoming dart.'`). Not a WAVE26 named FAIL.
- UPDATE ERR: **not** present. `npc.js` `speedCap` / `classBurn` / `updateFlee` do not throw in this run.

## Environmental issues
None. Boot harness ran to completion. Exit 1 is test errors, not environment.

## Evidence
- Log path: `C:\Projects\WebSim\out\w-boot-fix2\wave26\verify\boot-test-3.log`
- FAIL grep: `WAVE83 MISSILES FAIL` (only FAIL banner). No `WAVE26 LANE DELIVERY FAIL`, `WAVE26 FERRY QUOTE FAIL`, `WAVE26 HAUL QUOTE FAIL`, `WAVE26 OLD-SAVE FALLBACK FAIL`, `WAVE26 SAVE FIELDS FAIL`, `WAVE26 RESTORE FAIL`. No `UPDATE ERR`.
- wave26 haul quote (all true): `quoted=770`
- wave26 ferry quote (all true): `quoted=385`
- wave26 lane delivery: `{"boughtTheLoad":true,"holdLoadedForBoth":true,"dockedAtLaneDest":true,"ferryPaidExactlyQuoted":true,"haulPaidExactlyQuoted":true,"haulPaidIs140UnderDestChain":true,"creditsDeltaIsBothQuotes":true,"ferryDone":true,"haulDone":true} ferryPaid=385 haulPaid=770`
- wave26 old-save fallback / save fields / restore: all-true dumps in the log.
- wave83 missiles: `toastCopy:false` (only false pin); `WAVE83 MISSILES FAIL`.
- Final BOOT TEST line: `BOOT TEST FAIL — 1 errors`
- Unique DONE skip: `src/systems/station.js` `boardJobs` hide unique four when `state === 'done'`.
- Unique four identity: `keepUniqueJobRows` copies persist row onto JOB_HANDLES and rebinds `world.jobs` slots; prune skips `uniqueFourId`.
- Ferry + haul re-find: `scripts/boot-test.mjs` `ctx.world.jobs.find` for `ferry-consignment` and `haul-provisions` after delivery ticks.
- `w26ReofferFerry` mutates only `id === 'ferry-consignment'`.
