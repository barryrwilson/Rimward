# Wave 78 explore / information recovery — worker notes

## Landed
- PR1 `save.js`: `'explore'` kind; `EXPLORE_SLOTS_PER_SYSTEM = 2`; cap = live mining+trade+hunt+passenger cap + explore room only; `extraOfferedExplore` after extra passenger; no commodity copy (drop field); need 1; proto token drop; no `WORLD_FIELDS` `'explored'`.
- PR2–3 `station.js`: `resolveExploreSite` (origin landmarks, dest fallback via `otherSystemId`); `syncExploreJobs` (2 slots, skip if no site); origin-only accept; origin `jobPayFor(Math.round(RECOVERY_REWARD * HAUL_MARGIN))` stamp; tick reads `mystery.visited` (no mystery.js write); origin dock pay; splice+replace; 600 s expire fail-closed.
- PR4 UI in `renderJobs` only. Display names (`landmarks[i].name`, `SYSTEMS[site].name`). Remaining time via `miningTimeLeftLabel`.
- PR5 WAVE78 explore pins after the passenger WAVE78 block. Passenger `capFormula` no longer forbids `EXPLORE_SLOTS` (that pin would evict this family).

## Cap
Live was 4 + mining + trade + hunt + passenger + 16. Added `EXPLORE_SLOTS_PER_SYSTEM * N_SYSTEMS` only. Not a reset to `4+6*N+16`. Hunt and passenger rooms stay.

## Hunt / passenger
Did not rewrite WAVE78 hunt or passenger pin blocks except passenger `!EXPLORE_SLOTS` (required so passenger pins stay true after explore lands). Overlay skip, unique four, hunt/passenger helpers stay.

## Site bind
Pay and UI rebind `resolveExploreSite(ctx, origin, slot)`. Stuffed `destSystem` / `landmarkId` cannot retarget pay. `landmarkId` is not a job field.

## No data grant
No `addCargo` dataCrystal/dataCube, no `spawnDataPod`, no Archive confirm.

## Known boot FAILs (untouched)
WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.

## Verify
`npm run test:boot` — WAVE78 explore all true; WAVE78 hunt+passenger all true; WAVE71/72/74/76 true. Known FAILs WAVE4/26/35 only (50 errors).  
Dev: dock Freehold Digit 2 — two explore cards with landmark display names; hunt+passenger still present; no clue ids.
