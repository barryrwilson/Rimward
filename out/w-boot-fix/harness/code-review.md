## Code Review: scripts/boot-test.mjs (stale harness pins)

### Summary
Harness pins now match live JUMP.graceSeconds (60), Landmarks catalog length 22 (`th_veil`), and class cargo floors from `cargoHoldFor`. Named WAVE30/31/35/64/67 FAIL banners from the task list are gone.

### What's done well
- WAVE32-style TEST SETUP comments on grace expiry
- Heavy / freighter / frigate pins import `cargoHoldFor` instead of stale 20/40 literals
- Light hull floors stay at 20 (`yard.newStock`)
- `th_veil` stays in product data; only the catalog pin changed

### Findings

#### 🟡 Minor: remount pin is floor plus two racks, not floor alone
**Location:** `scripts/boot-test.mjs` WAVE64 remount `tamper.capFromRow`
**Issue:** `healCargoCapacity` treats authored 40 as 20 plus two `HOLD_RACK_STEP` racks, then adds those racks to the freighter floor (160 → 180). A pin of `cargoHoldFor('freighter')` alone still fails.
**Fix applied:** pin `cargoHoldFor('freighter') + HOLD_RACK_STEP * 2`. Product hangar.js was not changed.

#### 🟡 Minor: `th_veil` has no AUTHORED hero sculpt
**Location:** `scripts/boot-test.mjs` landmark redesign catalog
**Issue:** Hush catalogs `th_veil`, so count is 22. `landmarks/authored.js` has no `th_veil` builder, so generic anomaly mesh has no `userData.authored`.
**Fix applied:** keep `th_veil` on `wLmAuthoredIds` for `authoredNamed`; skip it in the hero tag loop.

#### 💡 Suggestion: pin name `catalogCount22`
The old key was `catalogCount21`. The new key matches the live length. No product contract rides the JSON key name.

### Verdict
No Blocker / Major findings. Remaining boot FAILs (WAVE76, UPDATE ERR frames) are out of this task.
