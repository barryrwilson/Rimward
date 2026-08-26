# Code Review: AI-05 PR1 death remaining countdown (`src/systems/npc.js`)

### Summary

`deathCalmLeft` is a session remaining countdown. `playerDestroyed` sets 90 s (clamp 0..180). Each npc `update` subtracts finite `dt`. `deathBlock` is remaining > 0. Hop tamper is unchanged. Probe and extra-helper pass, including rewind-then-90dt expire and `hugeHop.now10000.mustNotGodMode`.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` and `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn `[reviewer]`.

### What's done well

- Root cause was absolute `deathCalmUntil = now + 90`. Restore rewind no longer stretches that stamp.
- Hop and death clocks are separate. Hop still uses stamped `graceUntilOrZero`. Extra still uses `world.time < extra`.
- Tick skips non-finite / non-positive `dt`. Tamper remaining > 180 s → 0.
- Helper still sits before `playerInterestedIn`. After remaining hits 0, the roll can run (`playerRolled` false).
- Greenhand extra at `world.time` 10 still blocks; Dresk extra bypass; scratch omits the helper.
- Death does not write remaining into instance `ai.calmUntil` (that field is still an absolute hail clock).

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: Demand during grace is blocked even after scratch acquire

**Location:** `src/systems/npc.js` demand block (`starterGraceBlocksAcquire`)

**Issue:** Scratch still sets `playerInterested` and `setTarget('player')` without the helper. Demand is a listed helper call site, so a scratched pirate hunts but does not open hail until hop/extra/death lift.

**Fix:** Contract lists demand as a helper site. Keep. Hail-into-fight remains a sibling P1 hole if a toast still fires from other paths.

**Status:** accepted — unsolicited demand is the leftover; fight proceeds from scratch

#### 🟡 Minor: Ace duel has no scratch override during extra window

**Location:** `updateDuel` grace return

**Issue:** Illyx loiters for Greenhand extra 180 s even if the player fires. Scratch override lives only in `updateHunt`.

**Fix:** Do not add helper to scratch; do not add hunt scratch into duel in PR1. Named delay is the Greenhand playtest.

**Status:** accepted — design delay, not fire-first for aces

#### 🟡 Minor: `playerDestroyed` in `lastEvents` re-clamps remaining for a second frame

**Location:** `applyPlayerDestroyedCalm`

**Issue:** The event is visible on `events` then `lastEvents`. Apply sets remaining to 90 twice. Production loses one frame of dt (1/60 s). Probe must clear both queues before an expire tick.

**Fix:** Optional edge-trigger. Not required. 90 s play contract still holds.

**Status:** accepted — one-frame reset; not a rewind stretch

#### 💡 Suggestion: Extra-helper `huge` object keeps `time: 200` on later now args

**Location:** `out/w125/startergrace/verify/extra-helper.mjs`

**Issue:** Cases pass `now` 380 / 10000 while `world.time` stays 200. Extra for Marked is 0, so the hop tamper path is still the one under test.

**Fix:** Optional: set `time` to match `now`. Not required.

**Status:** accepted — extra 0; hop path is the contract

### Passed

- Greenhand / freehold / `world.time` 10 / not Dresk → helper true (probe).
- Marked extra 0; hop 60 still (probe `helper.markedHopStill` / `helper.hop60ExpiresAtStamp`).
- Huge hop `1e15` at now 200 / 380 / 10000 → false (probe + extra-helper).
- Infinity / NaN hop → false.
- Dresk extra bypass; hop + death remaining honor (probe).
- Death: rewind `world.time` to 1 still blocks; 45+45 dt expires even at `time` 0; pirates re-roll cold; Dresk keeps interest.
- Scratch still sets `playerInterested` without helper.
- `JUMP.graceSeconds` 60. No new `WORLD_FIELDS`.
