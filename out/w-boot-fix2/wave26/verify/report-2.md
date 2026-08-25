## Status
BUGS_FOUND

## What I tested
Static read of `src/systems/station.js` (`completeJob` unique-four persist prefer, unique haul `persistHaul` delivery, `keepUniqueJobRows`, unique DONE hide in `boardJobs`, JOB_HANDLES prune, `DOCK_KEY_SERVICES`, no `innerHTML`) and `scripts/boot-test.mjs` (`w26ReofferFerry` ferry-only, `haulJob26` live re-find after delivery ticks). Unique DONE skip is still present at `boardJobs` (`state === 'done'` unique four `continue`; persist row kept, no splice). Offered/accepted unique four still push. Digit 2/0/8/9 mapping is unchanged (`DOCK_KEY_SERVICES` = market, jobs, …, epics, shipyard; Digit2 still jobs, Digit0 still shipyard). Later-wave pins still assert `digit2Jobs` / `digit0Shipyard` / Digit8/9.

Ran `npm run test:boot` from `C:\Projects\WebSim`. Full log: `out/w-boot-fix2/wave26/verify/boot-test-2.log`. No leftover `node scripts/boot-test.mjs` after the run.

## Bugs found
- **WAVE26 LANE DELIVERY FAIL** (this task). Pin dump: `ferryDone:false`; `haulDone:true`; all other delivery pins true (`ferryPaidExactlyQuoted`, `haulPaidExactlyQuoted`, `creditsDeltaIsBothQuotes`, `ferryPaid=385`, `haulPaid=770`). Quote/accept/save/restore WAVE26 banners did not fire. Iteration 1 (`boot-test.log`) had `haulDone:false` / `ferryDone:true`. Iteration 2 re-finds live `haul-provisions` after delivery ticks, so `haulDone` is now true; `w26ReofferFerry` stays ferry-only and the pin still uses the pre-accept `ferryJob26` handle. `keepUniqueJobRows` rebinds array slots to the first JOB_HANDLES object when `sanitizeJobs` clones; prune then drops the pre-accept ferry object, so `completeJob` stamps persist `done` while `ferryJob26.state` stays `accepted`.
- Unique DONE hide was **not** removed (`keepUniqueFour:true` in wave83; skip still in `station.js`).
- WAVE26 FERRY QUOTE / HAUL QUOTE / OLD-SAVE FALLBACK / SAVE FIELDS / RESTORE: **not** present.
- `[OTHER TASK]` Silent / logged `UPDATE ERR` in npc `updateFlee` (`Cannot read properties of undefined (reading 'burn')`) at wave116 unknown lock omit. Four frames printed (errors cap 5, WAVE26 already counted 1); remainder of the 16-error total is the same UPDATE ERR path. Not a WAVE26 named FAIL.

## Environmental issues
None. Boot harness ran to completion. Exit 1 is test errors, not environment.

## Evidence
- Log path: `C:\Projects\WebSim\out\w-boot-fix2\wave26\verify\boot-test-2.log`
- FAIL grep: `WAVE26 LANE DELIVERY FAIL` (only named WAVE26 FAIL). No `WAVE26 FERRY QUOTE FAIL`, `WAVE26 HAUL QUOTE FAIL`, `WAVE26 OLD-SAVE FALLBACK FAIL`, `WAVE26 SAVE FIELDS FAIL`, `WAVE26 RESTORE FAIL`.
- wave26 haul quote (all true): `quoted=770`
- wave26 ferry quote (all true): `quoted=385`
- wave26 lane delivery: `{"boughtTheLoad":true,"holdLoadedForBoth":true,"dockedAtLaneDest":true,"ferryPaidExactlyQuoted":true,"haulPaidExactlyQuoted":true,"haulPaidIs140UnderDestChain":true,"creditsDeltaIsBothQuotes":true,"ferryDone":false,"haulDone":true} ferryPaid=385 haulPaid=770`
- Final BOOT TEST line: `BOOT TEST FAIL — 16 errors`
- Unique DONE skip: `src/systems/station.js` `boardJobs` hide unique four when `state === 'done'`.
- Haul re-find: `scripts/boot-test.mjs` `haulJob26 = ctx.world.jobs.find((j) => j && j.id === 'haul-provisions') ?? haulJob26` after delivery ticks.
- `w26ReofferFerry` mutates only `id === 'ferry-consignment'`.
