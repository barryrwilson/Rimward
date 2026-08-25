# WAVE26 unique-four persist identity — diagnosis (iteration 3)

## Symptom
`ferryDone:false` after dest-dock payout. `haulDone:true`. Both pays match quotes (385 / 770). `WAVE26 LANE DELIVERY FAIL`. Iteration 1 was the inverse (`haulDone:false`, `ferryDone:true`).

## Cause
`sanitizeJobs` clones the jobs array. Iteration 2 `keepUniqueJobRows` rebound unique-four slots to the first `JOB_HANDLES` object, then prune dropped any other row for that id. WAVE26 `w26ReofferFerry` / accept mutate the live persist row; after the next sanitize that object is no longer in `world.jobs`. `completeJob` stamps persist `done`. The pin still held the pre-accept `ferryJob26` (`state` stayed `accepted`). Haul passed only because the pin re-found live `haul-provisions` after the delivery ticks.

## Fix
- Persist identity is the row already in `world.jobs`. Clone fields copy onto tracked unique-four handles. Duplicate id slots collapse onto that persist row. Do not swap the array onto an older handle.
- Unique-four handles skip prune so `writeJobState` still reaches a pre-accept ref.
- Unique ferry dest-dock payout prefers persist `ferry-consignment` the same way unique haul prefers `haul-provisions`.
- WAVE26 re-finds live `ferry-consignment` after delivery ticks (same pattern as haul). Pin keys stay `ferryDone` / `haulDone`. `w26ReofferFerry` stays ferry-only.

## Honor
Unique DONE hide unchanged. Persist unique four. Digit 2/0/8/9 unchanged. No innerHTML.

## Not run
Full `npm run test:boot` (orchestrator: colliding boot).
