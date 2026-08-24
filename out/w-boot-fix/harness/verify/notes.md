# Verify: stale harness pins (WAVE30/31/35, landmarks, WAVE64/67)

Date: 2026-08-23
Command: `npm run test:boot` → exit 1 (53 UPDATE ERR in wave74, not named pin FAILs)
Log: `out/w-boot-fix/harness/verify/boot.txt`

## Pin source checks

- WAVE30: after 300-tick wait, `if (time < jumpGraceUntil) jumpGraceUntil = 0` (TEST SETUP). JUMP.graceSeconds is 60.
- WAVE31 acquire: same force-expire before the 30-tick acquire loop (no 300-tick wait in this section).
- WAVE35b: same force-expire after the 300-tick wait.
- Landmarks: `catalogCount22`, `th_veil` in `wLmAuthoredIds`, skip hero tag for `th_veil`.
- WAVE64 remount: `tamper.capFromRow` uses `cargoHoldFor('freighter') + HOLD_RACK_STEP * 2`.
- WAVE64 equipment: heavy holds use `w64EqHold('heavy')`.
- WAVE67: `trustedRow?.cargoCapacity === w67Hold('frigate')`.

## Named FAIL grep (expect ZERO)

WAVE30 DEMAND HAIL FAIL — 0
WAVE30 PAYTRIBUTE FAIL — 0
WAVE30 SHOWTEETH FAIL — 0
WAVE30 VOID ON HIT FAIL — 0
WAVE31 REVEAL ON ACQUIRE FAIL — 0
WAVE31 REVEAL ON SCRATCH FAIL — 0
WAVE35 HAILCLOSED CROSS-SCOPE FAIL — 0
WAVE35 HAILCLOSED BACKSTOP FAIL — 0
WAVE35 HAILCLOSED HOLD SCOPE FAIL — 0
LANDMARK REDESIGN CATALOG FAIL — 0
WAVE64 REMOUNT FAIL — 0
WAVE64 EQUIPMENT FAIL — 0
WAVE67 CATALOG FAIL — 0

## Pin JSON (all true)

See boot.txt lines 395–400, 406–407, 428–431, 517, 537, 580, 582.

## Product files

- `src/systems/hail.js`: clean (no git diff)
- `src/game/hail.js`: does not exist
- `src/systems/npc.js`, `src/game/state.js`, `src/game/hangar.js`: dirty in this working tree from other uncommitted work (not this harness file)

## Out of scope

BOOT TEST FAIL — 53 errors: UPDATE ERR frame 44863–44867 (and more, only first 5 printed) at npc.js:2277 velocity during wave74 cycle. WAVE74 pins still all true. WAVE66 / WAVE78 / WAVE80 named FAIL banners: none.
