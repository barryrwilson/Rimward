# Issue #105 — departure lane camping

## Mission and scope

Source: [issue #105](https://github.com/barryrwilson/Rimward/issues/105).
Base: master `a157056d`; branch `codex/issue-105-launch-hold`.
Stage: independently reviewable implementation. Coordinator: Codex;
builder: Rex through Claude Code;
independent quality gate: Quinn through Codex, after an immutable handoff.

The reported outcome is an indefinite launch hold when hunting pirate cutters
occupy the departure lane at Freehold Landing. The issue permits either a
bounded hold with a safe departure or a station-security response/hail, and
requires the blocking hull's name and range in both the notice and the agent
undock receipt.

Current code confirms that `planLaunch` refuses any obstructing body, the
station reports a generic hull notice, and `actLaunch` propagates that notice.
Issue #65's berth-to-release sweep, clear release pose, and five-second creep
corridor are existing safety contracts that must survive this change.

Selected alternative: a station-security hail requests physical evacuation of
the lane by the blocking pirate through the NPC movement owner. No forced
launch or patrol combat redesign. Current hunter logic already breaks off
player targeting while docked or inside the law zone; loss of that target
alone does not clear a hull from the departure corridor.

## Acceptance contract

- A hunting pirate blocking a docked player's departure receives a concrete
  response under one of the issue's permitted alternatives.
- The hold notice and public undock receipt identify the actual blocking hull
  and its current finite range; all agent launch entry points stay consistent.
- A blocked departure preserves docking and collision protection. No launch
  teleports through an obstruction or bypasses unreadable flight/input owners.
- Ordinary clear departures and non-hostile/structural refusals retain their
  established behavior.
- Response state resets appropriately; repeated launch attempts cannot spam
  security actions or mutate unrelated combat, cargo, progression, or saves.
- World strings use text-safe DOM handling and public data remains JSON-safe.

New keys, equipment, persisted fields, combat balance redesign, new public
services, and broad station/traffic refactoring are excluded.

## Required evidence

Focused runtime checks for the response, identity/range, retries, lifecycle,
non-hostile and structural blockers, and safe launch regressions; unchanged
`npm run test:boot`; `npm run build`; related agent checks; live Chrome flows
with screenshots and console checks. Generated evidence stays in ignored
`out/issue-105-evidence/`.

Baseline `npm run test:safe-launch` passed all 11 groups before implementation;
raw output: `out/issue-105-evidence/baseline-safe-launch.log`.

## Verification

The initial three-file runtime patch passes `npm run build` (146 modules;
1801.55 KiB minified / 539.78 KiB gzip; existing bundle policy passes),
`npm run test:safe-launch` (11 groups), `npm run test:agent-schema`, and
`npm run test:agent-hardening`. Logs are `build.log`, `safe-launch.log`,
`agent-schema.log`, and `agent-hardening.log` under the evidence directory.
The unchanged `npm run test:boot` passes with `BOOT TEST PASS — no update
errors`, including agent gameplay and mission families. Its headless DOM stub
emits the existing WebGL-context messages; live browser console coverage is a
separate gate. `test:combat-intent` passes 33 regression groups and
`test:gate-escape` passes. Logs: `boot.log`, `combat-intent.log`,
`gate-escape.log`.

The builder's initial focused response tests pass eight groups, including
physical clearance (maximum observed displacement 1.2 units per frame) and
sequential blockers (six retries, exactly two security hails). Initial fixture
corrections remain visible in builder logs. Final focused tests, live browser
checks, and independent QA remain pending; these partial results are not a
completion verdict.

After adding explicit system/clock lifecycle guards, the final runtime passes
`npm run build` again (146 modules; 1801.70 KiB minified / 539.84 KiB gzip;
existing bundle policy passes) and the unchanged `npm run test:boot` again,
including agent gameplay. Raw logs: `build-final.log`, `boot-final.log`.
`npm run test:lane-hold` passes all 10 final groups (`focused-final.log`):
identity/range and response, repeat calls, actual movement and safe release,
visit cleanup, sequential blockers, structural and concealed-hull refusals,
text-safe names, expiry/cooldown/system/clock/id lifecycle, excluded hulls,
and per-context/per-live-object ownership. Browser verification and independent
QA remain pending.

Initial live Chrome run: four of five pins pass, with zero console errors or
uncaught exceptions. The hold reports `Bloodmoth`, 55 units, and the accepted
station-security order. The screenshot visibly contains the security hail;
the hull moves over real frames (maximum sampled 3D step 1.7808 units), and
the first launch retry after four seconds succeeds. The security-hail pin
fails because it inspects the same-tick observation captured before the event
journal update; the later observation contains one security line. The probe
must await public event publication before asserting that pin. Initial raw
evidence is preserved in `live/` and `live-command.log`; this run is not
reported as a full pass.

The live fixtures explicitly position the player beside Freehold Landing,
then use public `dock`; a production-spawned pirate is placed in the departure
lane with a pinned loiter waypoint. Docked flags, event receipts, security
requests, subsequent movement, and world time are not fabricated. This is a
staged reproduction, not an organic campaign or docking-approach certification.

Final live Chrome run: **PASS, 5/5 pins, zero console errors and uncaught
exceptions**, on platform Intel/Direct3D graphics. `live-final/result.json`,
`live-final/console.txt`, `live-final/run.log`, and `live-final-command.log`
retain the result. The hold reports Bloodmoth at 55 units; bounded observation
across real frames records exactly one matching security hail. Motion is
sampled for 357 frames / 3.9962 simulation seconds, with maximum sampled 3D
step 4.6872 units. The first retry after observation succeeds; docking becomes
false and the stale refusal clears. Screenshots `01-docked.png` through
`04-launched.png` are retained; the coordinator visually inspected the held
notice and launched view. The event timing correction changes only the probe.

The implementation and tests are ready for an immutable handoff to independent
Codex QA. The builder self-applied source/security checks; this is not the
independent verdict. No saved fields, event vocabulary, API version, combat
balance, bridge binding, credentials, or equipment changed. Repeated orders
are bounded, but security does not guarantee a fixed launch deadline when
other ships or structures still obstruct the lane.

## Handoffs and status

Implementation design:

1. Retain the actual collision slot identity when refusing a ship obstruction;
   derive the hull name and current distance from the live ship. Preserve the
   existing blocker-kind fallback for structures or unavailable identity.
2. On a blocked launch, ask the NPC owner to clear an eligible active
   pirate/ace. Include the name, range, and truthful security response in the
   station notice. The existing agent launch adapter propagates that notice
   into the receipt across all launch entry points.
3. Keep requests transient and keyed by context and live object, avoiding
   reused-id associations or saved-state changes. Throttle security hails.
4. During normal NPC updates, steer the requested hull toward a stable
   clearance point using existing steering and collision handling. Do not
   reposition either hull in the launch call. End requests on expiry,
   departure, system reset, loss of eligibility, or despawn.
5. Re-run the complete existing clearance planner on each launch attempt.
   Security intervention never authorizes launching through an obstruction.

Likely write set: `src/game/launch-clearance.js`, `src/systems/station.js`,
`src/systems/npc.js`, issue-specific test/live-probe scripts, package scripts,
and outcome/evidence documentation. Agent API/schema edits are only necessary
if the existing notice propagation cannot satisfy the issue.

Independent QA prepared its boundary matrix in ignored
`out/issue-105-evidence/qa-preliminary-matrix.md`; review has not begun. The matrix
includes multiple blockers, inactive/civilian hulls, id reuse and context
resets, repeated calls, owner failures, text-safe names, and real movement.

The sandboxed Claude Code attempt failed during API access before source edits.
Automatic approval review rejected the escalated invocation because transmitting
repository context to the external implementation harness and allowing its local
edits required more explicit user authorization. The user then explicitly
authorized Claude Code to transmit relevant source context to Anthropic and
make scoped local code/test edits, followed by independent Codex review.
Implementation resumed under that authorization. No QA PASS, publication,
merge, or deployment is claimed. Next owner: Quinn to review the immutable
implementation commit against the acceptance contract and recorded evidence.

Rollback: revert the implementation commit. No save migration is in scope.
