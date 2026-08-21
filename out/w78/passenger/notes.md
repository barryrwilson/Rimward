# Wave 78 passenger escort — worker notes

## Landed
- PR1 `save.js`: `'passenger'` kind; `PASSENGER_SLOTS_PER_SYSTEM = 2`; cap = live hunt cap + passenger room; extraOfferedPassenger after hunt; no commodity; need 1; dest ≠ origin; proto token drop.
- PR2–3 `station.js`: `syncPassengerJobs` (2 slots), origin-only accept, origin `jobPayFor(FERRY_REWARD)` stamp, dest-dock tick no cargo, splice+replace, 600 s expire fail-closed.
- PR4 UI in `renderJobs` only.
- PR5 WAVE78 passenger pins after the hunt WAVE78 block.

## Cap
Live was 4 + mining + trade + hunt + 16. Added `PASSENGER_SLOTS_PER_SYSTEM * N_SYSTEMS` only. Not `4+6*N+16`. No explore room.

## Hunt
Did not edit the WAVE78 hunt pin block. Hunt kind, `HUNT_SLOTS`, overlay skip, extraOfferedHunt kept. Boot: `wave78 msn` all true.

## Unique ferry
Id `ferry-consignment`, kind `'ferry'`, complete still `done` via `completeJob`. No `ferry-<sys>-<n>` allocator.

## Known boot FAILs (untouched)
WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.

## Verify
`npm run test:boot` — WAVE78 passenger all true; WAVE78 hunt all true; WAVE71/72/74/76 true.  
Dev: dock Freehold Digit 2 — two passenger cards, hunt cards, unique ferry card. textContent only.
