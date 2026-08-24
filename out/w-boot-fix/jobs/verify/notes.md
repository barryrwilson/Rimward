# Verify: dock() jobTick reset

Status: CLEAN (coverage reduced: did not start a second npm run test:boot)

Date: 2026-08-23
Scope: leftover jobTick must not deliver on the 3-frame dock settle.

## Code

`src/systems/station.js` `dock()` sets `jobTick = 0` after `ui.justDocked = true`.

```
ui.uniqueHaulPaid = false;
ui.justDocked = true;
// leftover throttle must not deliver during dock settle
jobTick = 0;
```

`update()` still uses the same 0.5s throttle. `jobTick` lives in the `initStation` closure. `dock()` and `update()` share it.

```
jobTick += dt;
if (jobTick >= 0.5) { jobTick = 0; tickDeliveryJobs(ctx, ui, render); }
```

Order on the dock frame:

1. `dock()` sets `jobTick = 0`.
2. Same `update()` then does `jobTick += dt`.

Boot `dt` is `1/60`. The dock frame cannot reach 0.5s. `dockAtCurrentStation` is 1 dock tick + 2 settle ticks = 3 frames (~0.05s). First delivery needs ~30 frames of docked time.

Passenger and spy still require `ctx.flags.docked` in `tickDeliveryJobs`. Pay still uses `payQuoted` then `clampJobPay`. Unique-four, haul dest bind, and mouse accept were not part of this patch. Boot pins for those flags are true.

## Same-berth delivery (no skip)

Reset does not skip a legal dest dock. It only delays the first `tickDeliveryJobs` to 0.5s of docked time. That is the existing throttle.

Harness dest path (wave78 passenger):

1. `dockAtCurrentStation` (3 frames, leftover cannot pay).
2. Stamp `payQuoted = 18`.
3. `tick(40)` (~0.67s) > 0.5s.

Wave80 spy pays at origin after dest gather. Same 0.5s wait after the origin dock. Pins `gatheredAtDest`, `completePay`, `employerPlus2` are true.

Wave26 lane delivery and wave35a named-dest delivery still paid the quoted amounts after this reset.

If the player undocks before 0.5s, delivery does not fire. That matches the old throttle when leftover was near 0. The leftover path that paid on frame 1 of dock was the harness bug, not a player contract.

## Boot log (`out/w-boot-fix/jobs/boot.txt`)

Did not start a second `npm run test:boot`. A live process already ran it:

- PID 47220 `npm run test:boot`
- PID 197436 `node --import ./scripts/with-css-stub.mjs scripts/boot-test.mjs`

Worker log is complete through wave101 and `BOOT TEST FAIL — 24 errors`.

Parsed JSON (false keys = none unless noted):

| pin | result |
| --- | --- |
| wave78 passenger | 40 keys, all true (`completePay`, `completeAgain`, `uniqueFour`, `haulDestBind`, `passengerDestBind`, `uniqueHaulIds`, `mouseAccept`) |
| wave78 msn | 31 keys, all true (`completePay`, `haulDestBind`, `uniqueHaulIds`) |
| wave80 espionage | 54 keys, all true (`completePay`, `completeAgain`, `employerPlus2`, `uniqueFour`, `haulDestBind`, `uniqueHaulIds`, `mouseAccept`) |
| wave26 ferry quote / lane delivery | all true (quoted 385 / 770 paid) |
| wave35a load / delivery | unpaid at origin; dest paid 1344 |

No `WAVE78 PASSENGER FAIL` or `WAVE80 ESPIONAGE FAIL` lines.

WAVE30/64/66/67: no FAIL lines in this log. Not flagged.

## WAVE12

`WAVE12 CALLOW BOOKS FAIL` and `WAVE12 RESTORE HEAL FAIL` are present.

False books pins: `liveShipFound`, `refusalRearmedSecond`, `refusalsRotatedTwoTotal`.
False heal pins: live-ship identity after restore. Heal reuses `callowLive12`.

This is Old Callow spawn after hops, not job pay.

Why this is not the dock() change:

- Wave11 in the same log has `liveShipFound: true`.
- WAVE12 books uses jumps and KeyH, not dock, before the heal dock.
- `jobTick` only changes when `tickDeliveryJobs` first runs after dock.
- Earlier boots (`out/w-boot-fix/boot.txt`, `boot-current.txt`, `boot4.txt`–`boot6.txt`) pass WAVE12 with `liveShipFound: true`.
- Worker said WAVE12 still fails. The fail mode is Callow live-ship, a known flake.

Not a bug for this worker.

## Other errors in the log

Three logged `UPDATE ERR` at wave74 in `npc.js` (`velocity` on undefined). The harness caps logged update errors at 5. WAVE12 already used 2. Remaining of the 24 is later silent update errors. Not this patch.

## Coverage

- Code review of `dock()`, throttle, passenger/spy pay: full.
- Worker `test:boot` log wave78/wave80/wave26/wave35/WAVE12: full.
- Live re-run of `test:boot`: skipped (process already running). Coverage reduced, not ENV_ISSUE.

## Graph note

`graph_resolve` returned `blocked_ambiguous` on unrelated PDF / slides / CRM workflows (term overlap on inspect/verify). Parent assigned this verify task. No PDF or CRM work ran.
