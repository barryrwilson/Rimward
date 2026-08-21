# WAVE78 completePay isolation

## Root cause

Game pay in `src/systems/station.js` is correct: passenger and explore pay
stamped `payQuoted` clamped 0…20000, stuffed dest is rebound and ignored
(`stuffedDestIgnored` true). The job splices (`completeReplace` true).

Independent `npm run test:boot` still saw `completePay` false because
`credits` was not exactly `credBefore + 18`. Hunt `completePay` stayed true
on the same boot. Extra accepted live rows paid on the same throttled
delivery tick:

- overlay `kind === 'bounty'` (hunt incidents already on `ctx`)
- unique haul / ferry / patrol / recovery still accepted from earlier waves
- sibling passenger / explore / mining / trade / hunt slots

Passenger dest-dock only parked unique ferry. Explore `freezeSlotJobs78e`
parked family slots but skipped bounty overlay and unique kinds.

## Fix

`scripts/boot-test.mjs` only. Did not change `station.js`.

- Passenger: `freezeSlotJobs78p` parks accepted mining/trade/hunt/passenger/
  explore plus bounty/haul/ferry/patrol/recovery except the pin keep job.
  Call before stuffed snapshot, dest-dock credit snapshot, and again tick.
  Re-stamp the keep job accepted + `payQuoted` 18 after dest freeze.
  Unique ferry restore for `uniqueFerryDone` is unchanged.
- Explore: same extra kinds on `freezeSlotJobs78e` (already ran before
  snapshots).

Pin stays exact equality: `credits === credBefore + 18`. Not `>=`.

Did not edit WAVE4 / WAVE26 / WAVE35 pins. Did not drop hunt / passenger /
explore features. Did not edit PROGRESS.md or the wishlist.

## Boot

`npm run test:boot` (this worker, ~379 s). WAVE78 hunt, passenger, and
explore all true including `completePay`. WAVE71 / 72 / 74 / 76 all true.
Named FAILs only WAVE4 fence, WAVE26 ferry/haul/lane/old-save/save/restore,
WAVE35 haul. 47 errors. Pin dump: `out/w78/explore/boot-pins.txt`.

Security / code-review / UI audit: pin-only isolation in boot-test. No
station.js UI change.
