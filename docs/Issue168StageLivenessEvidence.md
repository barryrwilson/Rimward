# Issue 168: repeated docking remains live through moving traffic

Independent Quinn review found a runtime regression on candidate `590104a4`.
The comparison used the same test script on both runtimes: the historical OLD
ring block was removed, leaving the NEW sweep docking, its real station undock,
and the ordinary second approach. The earlier runtime completed both trips;
`590104a4` completed the first but stopped progressing during the second. It
cancelled with `blocked` at world time 47.9333, still about 272.7683 units from
the stage point. This is a real liveness failure, not merely obsolete fixture
expectations. The original review logs and trace remain preserved under
`out/quinn-final/ab-base.log`, `ab-cand.log`, and `ab-cand-trace.log`.

## Regression and fixture authority

`scripts/issue-168-stage-liveness-test.mjs` runs that exact two-trip sequence via
the `repeat` case of `scripts/issue-139-dock-corridor-test.mjs`. It retains the
original seed, geometry calls, initial player placement, real spawned loiterer,
60 Hz owner updates, docking, undocking, and elapsed traffic/asteroid state.
Only the deliberately spawned test loiterer is removed after the first trip,
as in the original reproduction. It never removes ordinary traffic or rocks.
After each labeled initial player pose, every player movement and collision
uses the game owners. There is no invulnerability or in-flight pose correction.

The undock must succeed through the station API. A failed undock can no longer
be hidden by changing `flags.docked`. Both approaches must reach berth without
body contact, solar heat, death, or cancellation. Per-frame loiterer observations
and player pose/velocity/quaternion/helm samples are written to `result.json`.
The `DOCK_RUNTIME` environment variable supports an explicit source-worktree
comparison while keeping the exact regression script unchanged.

The test was reproduced against unmodified `590104a4`: the first trip docked
safely; the second ended `blocked`, producing a failing process exit. Evidence
is in the isolated test worktree under
`out/issue-139-corridor/pre-fix/repeat/result.json`. A repaired candidate must
pass this same sequence before it can be integrated.

Source repair `2911aa251b6a484aff618241908c0ed6d4625cc4` passes the unchanged
repeat sequence: both trips berth, at world times 31 and 88.5, without contact,
heat, death, or cancellation. Its runtime source SHA-256 is
`41fa6a3b9a879b3abd63e66b253b2f96959ac20f5a7e61f7386f6c875d4f3e8b`.
The original `590104a4` failure remains the before-fix result.

## Static blocked watchdog control

`HOLD_CASE=static-blocked` runs the actual player and collision owners against
one explicitly test-controlled stationary freighter mesh covering the stage
point. The player starts 220 units along the station's +X axis; the immobile
collider sits at the stage point, 135 units out. All ordinary traffic and
asteroids remain active. Only the named fixture collider's NPC AI is excluded.

On `590104a4` this control returns the named `blocked` failure after 10.7 seconds,
with no collision, heat, or death and at least 35.3596 units of hull clearance.
The regression requires the same bounded terminal failure within 30 seconds
and verifies that the collider did not move. A blanket watchdog disable cannot
pass this control. Evidence is preserved under
`out/issue-168-static-blocked/pre-fix/result.json` in the isolated test worktree.

`HOLD_CASE=moving-blocked` retains actual player physics but moves the stage
blocker slowly back and forth within a five-unit vertical envelope at one unit
per second. It never frees the stage point. The earlier runtime terminates
after 10.7 seconds; the repair terminates after 11.0167 seconds with at least
35.3667 units of hull clearance. Cumulative collider travel verifies movement
even though a reversing body can end near its starting point. The required
terminal result remains `blocked` within 30 seconds.

## Yield-budget boundary, explicitly without ship integration

`HOLD_CASE=yield-budget-clock` is a direct autopilot-owner/clock control, not a
real-flight claim. A fixed player pose prevents actual range progress. A
controlled collider sits midway along the stage chord, outside the target's
keep sphere, and reverses vertically through a twenty-unit envelope at twenty
units per second. It changes identity on reversals. Only the autopilot owner
updates during this bounded control; real player physics is covered separately
by the repeat-docking, static, slow-moving, and incoming-crossing cases.

The old runtime returns `blocked` after 10.0167 seconds and fails the required
finite-yield opportunity. The repair grants that opportunity, then returns the
same named `blocked` result after 20.0333 seconds despite changing identities
and aims. The test requires termination between 18 and 25 seconds with zero
player displacement. Thus it checks both a used yield allowance and bounded
exhaustion, without reading or reproducing private credit variables. The raw
before/candidate pair is preserved under
`out/issue-168-yield-budget-clock/{pre-fix,candidate}/result.json` in the test
worktree. Earlier physical oscillating-blocker experiments allowed real creep
and detours and are retained as diagnostics, not claimed as budget-isolation
evidence.

## Corridor suite lifecycle

`npm run test:dock-corridor` now runs OLD ring, NEW sweep, ordinary fresh approach,
and the repeat-docking regression in separate seeded processes. OLD/NEW/fresh
cases no longer inherit the preceding case's world time, berth state, traffic,
random history, or private helm state. The repeat case intentionally retains
its two-trip lifecycle because that is the independently proven regression.

The OLD full ring still has an explicit waypoint inside the +X docking lane,
preserving the historical geometry risk witness. Its live assertion now requires
safe docking: the improved helm must not collide merely to satisfy an obsolete
expected-failure test. No player collision check is relaxed.

The old assertion claiming a loiterer stayed far-side "throughout" inspected
only its final position and already failed on the earlier runtime. The revised
test records every live frame, minimum/maximum X, final X, and crossings of the
original `station.x + 30` threshold as explicit characterization. The threshold
is unchanged. Authored waypoints/chords and real spawn-path waypoint geometry
remain strict far-side assertions, and actual player contact remains a failure.
This distinction does not claim that NPC collision avoidance always follows
the waypoint envelope.

The release-focused runner already invokes the full corridor suite. The shared
Agent API regression group additionally invokes the exact repeat case, making
it part of the full boot gate as well, alongside the static blocked control.
Neither the prior release-focused failure
nor the candidate liveness failure is reported as a passing result.
The complete shared Agent API group now contains twelve checked scenarios.

That twelve-check result precedes the distinct active station-detour watchdog
repair. See [Issue168DetourProgressEvidence.md](Issue168DetourProgressEvidence.md)
for the bounded geometric allowance, hybrid regression provenance and final
combined verification boundary. The moving-traffic budget and its controls
remain unchanged.
