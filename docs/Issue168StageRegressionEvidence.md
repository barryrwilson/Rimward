# Issue 168: stage and incoming-hold regressions

These checks supplement the continuous public cruise probe. They use labeled
initial state reconstruction and must not be described as untouched public play.
The runtime under test is the stage repair through `8b3afe0`; final acceptance
still requires three consecutive public journeys on the final combined commit.

## Real asteroid stage coverage

`scripts/issue-168-stage-obstacles-test.mjs` initializes every game owner, travels
to Veridian through the boot helper, and places the player at the recorded
`t=48.860` position/speed. Its quaternion and velocity direction are estimated
from adjacent recorded positions because the original review omitted them. It
verifies the actual asteroid owner reproduces asteroid 2's recorded orbit and
then runs all owners at 60 Hz. All 90 asteroids and the existing traffic remain.
There is no invulnerability, player pose/velocity correction, or hidden helm
history injection after the initial fixture.

This is a coverage pin: both the old integration `a3d79acf` and the repaired
runtime pass. The old runtime completes in 32.3667 seconds; the repaired runtime
completes in 33.6667 seconds with no body contact/heat/death and 0.8077 units
minimum clearance from asteroid 2. It is not baseline-fail evidence.

Later fresh-AP starts remain reproducible diagnostic modes: `STAGE_CASE=earlier`
uses the recorded `t=49.3629` pose, while `STAGE_CASE=late` back-projects the last
sample by 0.25 seconds. The old runtime hits asteroid 2; the repaired runtime
stops before it, then asteroid 48 reaches the held player. Passive diagnostics
show the player's current nose points toward incoming asteroid 48 and forward
creep is unsafe even when tested against that body alone. These late cold starts
lack the original continuous helm's tangent and motion history. Their failures
are retained, not converted into successful journey assertions.

## Controlled incoming collider with real player physics

`scripts/issue-168-hold-traffic-test.mjs` uses a real freighter mesh and collision
radius with a test-controlled straight incoming trajectory. Only the named
mover is excluded from NPC AI so route choices and NPC-side bounce cannot solve
the crossing for the player. The actual helm, player motion, and player collision
owner run normally; all other actors retain their ordinary owners.

The incoming velocity is `[11.15, -3.39, -49.13]`. It starts one second before
the recorded incoming offset, at `[0.85, -13.61, 100.13]` relative to a stopped
player pointing along -X. On the old runtime this produces an incoming-ship
`bodyHit` after 1.5 seconds and cancels the dock helm. On the repair the actual
player moves 11.6128 units, retains at least 2.6815 units of hull clearance, and
keeps its helm. The same trajectory penetrates a stationary player's hull by
6.4577 units, establishing a meaningful escape rather than an unthreatened hold.

`HOLD_CASE=blocked` starts the player 70 units along the station's +X axis, with
its nose toward the station. The proposed forward escape crosses the station
keep-out: the first ten real frames remain idle with zero movement and no hit.
This bounded negative check does not claim a complete journey from that pose.

Earlier fixture-development results are retained under the isolated test
worktree's `out/issue-168-stage/` and `out/issue-168-hold/`: route AI independently
evaded, drift bounced its own hull, and a late fixed incoming offset had only
0.5 seconds before contact and no validated forward clearance. Those outcomes
are diagnostic limitations, not passing acceptance runs.

## Commands and final gates

`npm run test:agent-playtest-fixes` runs these three new cases in checked fresh
processes alongside the five existing regressions. The group is already wired
into the boot and release-focused gates. Every child retains its assertions,
visible failures, and two-minute timeout.

The public cruise probe now retains player position, velocity, quaternion,
helm/input fields, nearby collider motion estimates, and 120 recent frames for
each body contact. It resets motion history on system changes. This passive
capture changes no gameplay and relaxes no live acceptance assertions.
