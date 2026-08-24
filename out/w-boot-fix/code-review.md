## Code Review: boot FAIL cluster (WAVE4/26/35/80/92)

### Summary
WAVE4 fence spend, WAVE35 extra dest credits, WAVE80 move-notes length, and WAVE92 gift/train overlay pins pass. WAVE26 lane origin dock/accept still fails.

### What's done well
- Overlay locker uses the dock identity (`lockerAllowed`), not a drifted `currentSystem`.
- Unique haul dest hold skips renewable dest pay in the same berth visit.
- Digit0 / first Escape-after-dock keep the services menu for BIO-01/02.
- Gift arm copy is the literal GIFT_ARM_LINE text in `station.js`.

### Findings

#### 🟠 Major: WAVE26 still does not dock at `as_census`
**Location:** `src/systems/station.js` dock zone / `acceptJob`
**Issue:** Boot still logs `dockedAtLaneOrigin:false` and no ferry Accept. Quote math is already dest-chain.
**Fix:** Make the Digit2 board open at the live `as_census` berth and stamp ferry dest / haul origin on that accept. Do not change `scripts/boot-test.mjs`.

#### 🟡 Minor: Favor bank + handle Set is extra machinery
**Location:** `src/game/contacts.js`
**Issue:** Needed so spend mutates the WAVE4 test handle after roster drift.
**Fix:** Keep until WAVE26 origin dock is solved; then see if live refs alone suffice.

#### 💡 Suggestion: `restrictedAllowed` is now unused
**Location:** `src/systems/station.js`
**Issue:** Market uses inner `lockerAllowed()`.
**Fix:** Delete or wire one helper.

### Severity mapping
- Major WAVE26 dock/accept: still open
- Minor favor bank: documented, not blocking WAVE4
