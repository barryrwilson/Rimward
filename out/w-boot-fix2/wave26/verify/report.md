## Status
BUGS_FOUND

## What I tested
Static read of `src/systems/station.js` (`boardJobs`, unique DONE hide, `acceptJob` ferry, `renderJobs` ferry reward, `reofferFerryHandles`, `clampJobPay`, JOB_HANDLES prune) and `scripts/boot-test.mjs` (`w26ReofferFerry`). Unique DONE skip is still present at `boardJobs` (`state === 'done'` unique four `continue`; persist row kept, no splice). Offered/accepted unique four still push. `station.js` has no `innerHTML`. Digit 2/0/8/9 mappings were not changed (later waves still pin Digit2 jobs / Digit0 shipyard / Digit8/9). WAVE26 still mutates the live `ferry-consignment` persist row immediately before each Digit 2.

Ran `npm run test:boot` from `C:\Projects\WebSim`. Full log: `out/w-boot-fix2/wave26/verify/boot-test.log`. No leftover `node scripts/boot-test.mjs` after the run.

## Bugs found
- **WAVE26 LANE DELIVERY FAIL** (this task). Pin dump: `haulDone:false`; all other delivery pins true (`ferryPaidExactlyQuoted`, `haulPaidExactlyQuoted`, `creditsDeltaIsBothQuotes`, `ferryDone:true`, `ferryPaid=385`, `haulPaid=770`). Quote/accept/save/restore WAVE26 banners did not fire. Prior boot (`out/w116/hud02tgt/verify/boot-full.txt`) had `haulDone:true` while ferry never accepted; after this ferry fix both contracts pay in the same window and the captured `haulJob26` handle is not `done`. Haul WAVE26 path was not updated to re-find the live persist row (ferry uses `w26ReofferFerry()`).
- Unique DONE hide was **not** removed (`keepUniqueFour:true` in wave83; skip still in `station.js`).
- WAVE26 FERRY QUOTE / HAUL QUOTE / OLD-SAVE FALLBACK / SAVE FIELDS / RESTORE: **not** present.
- `[OTHER TASK]` Silent / logged `UPDATE ERR` in npc `speedCap` (`Cannot read properties of undefined (reading 'cruise')`) at wave116 unknown lock omit. Four frames printed (errors cap 5); remainder of the 16-error total is the same UPDATE ERR path. Not a WAVE26 named FAIL.

## Environmental issues
None. Boot harness ran to completion. Exit 1 is test errors, not environment.

## Evidence
- Log path: `C:\Projects\WebSim\out\w-boot-fix2\wave26\verify\boot-test.log`
- FAIL grep: `WAVE26 LANE DELIVERY FAIL` (only named WAVE26 FAIL). No `WAVE26 FERRY QUOTE FAIL`, `WAVE26 HAUL QUOTE FAIL`, `WAVE26 OLD-SAVE FALLBACK FAIL`, `WAVE26 SAVE FIELDS FAIL`, `WAVE26 RESTORE FAIL`.
- wave26 haul quote (all true): `quoted=770`
- wave26 lane delivery: `{"boughtTheLoad":true,"holdLoadedForBoth":true,"dockedAtLaneDest":true,"ferryPaidExactlyQuoted":true,"haulPaidExactlyQuoted":true,"haulPaidIs140UnderDestChain":true,"creditsDeltaIsBothQuotes":true,"ferryDone":true,"haulDone":false} ferryPaid=385 haulPaid=770`
- Final BOOT TEST line: `BOOT TEST FAIL — 16 errors`
- Unique DONE skip: `src/systems/station.js` `boardJobs` hide unique four when `state === 'done'`.
