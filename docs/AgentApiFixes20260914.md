# Agent API playtest fixes — 2026-09-14

This work addresses the five open `area:agent-api` issues reported against
master `0991593bd905d00451b9f7d2b5f58eea737d3ac2`.

| Issue | Acceptance contract | Evidence |
|---|---|---|
| [#168](https://github.com/barryrwilson/Rimward/issues/168) | Cruise to the local station through the existing approachDock helm, then brake into the dock corridor; fixed Veridian arrival gate to berth in under 40 sim seconds without sunHeat. | [Cruise evidence](Issue168CruiseEvidence.md): fixed acceptance 39.1667s with intact traffic. Three natural live journeys reach safe berth in 52.6130/38.2574/48.5468s; two supplemental live timing checks fail. Integrated QA pending. |
| [#169](https://github.com/barryrwilson/Rimward/issues/169) | Raw control axes reach the real ship, with positive steerY pitching down and a real-quaternion regression test. | [Steering evidence](Issue169SteeringEvidence.md): all axes >10 degrees in one sim second; pitch sign corrected, original no-turn report unreplicated in isolated Chrome. |
| [#170](https://github.com/barryrwilson/Rimward/issues/170) | Desk refusals carry a token and reason; undock from service panes has explicit behavior; observed offers match the current desk. | [Desk evidence](Issue170DeskEvidence.md): named refusals, eight service-pane launches, real desk filtering and live market-pane launch verified by builder. |
| [#171](https://github.com/barryrwilson/Rimward/issues/171) | Raw afterburner pulses give a burst without taking the flee helm; explicit approachDock handoff retires the burn and safely brakes. Combat retreat burner remains available. | Combined real-system test passes already-active/queued edges plus 43.6u and 55.6u handoffs at 64.5u/s, safe berth and no damage. Near-pad live verification is recorded below. |
| [#178](https://github.com/barryrwilson/Rimward/issues/178) | Haul reward quotes agree across the desk, observation and acceptance after price drift. | [Desk evidence](Issue170DeskEvidence.md): price-drift card/offer/acceptance agreement verified; accepted pay stays fixed. |

## Verification boundaries

The reported #169 no-turn symptom did not reproduce in standalone Chrome on
the issue's master revision: renewed raw leases turned all three axes in real
frames. The baseline did reveal an opposite pitch sign. Tests distinguish this
confirmed contract mismatch from the original unreplicated symptom. The
current light-hull low-speed RCS floor remains 0.4rad/s (22.9 degrees/s at
full input, approximately 16 degrees/s at 0.7), not the issue's estimated
37 degrees/s. No ship tuning changed. The
in-app Browser also launched Greenhand with no warning/error console logs,
but that startup check alone does not verify raw control leases.

Issue #168 necessarily overlaps [#172](https://github.com/barryrwilson/Rimward/issues/172):
the dock stage must retain the planner's sun detour. Additional #172 acceptance
coverage is recorded separately if exercised. Unrelated dock-cancellation,
market presentation, consignment and new mission-generation work remains in
its own issues.

## Review and integration

Codex workers own bounded implementation branches. Claude Code independently
reviews immutable artifacts against the issue contracts. The combined gate
includes the unchanged build and boot checks, focused regressions, live
browser flows and console inspection. Final results and artifact identity
will be recorded here before the work is marked verified.

## Integrated regression entry points

`npm run test:agent-playtest-fixes` runs the intact-traffic cruise, controlled
obstacle clearance, real-hull steering, desk/quote and raw burner handoff
scenarios in checked fresh processes.
The same group is included in `npm run test:boot` and
`npm run test:release-focused`, preserving all existing scenarios and
assertions. Live entry points are `test:agent-cruise-live`,
`test:agent-steering-live`, `test:agent-desk-live`, and `test:agent-burner-live`.

The candidate combines the exact worker artifacts `e2dd59b6` (#169),
`6ccc617f` (#171 provenance), `3e5c8807` (#170/#171/#178), and
`900af8dc` (#168), followed by desk repair `44dd2c0f`, cruise safety repair
`8e10452b`, and its evidence `9033ad96`. Their cherry-picked integration
identities differ from the worker hashes. Final integrated artifact identity and QA verdict are pending;
no default-branch merge, push or deployment has been performed.

The bounded combined group passed **5/5** before final independent
verification: Veridian cruise reaches berth in 39.1667 simulation seconds,
steering/throttle passed 22 pins, desk/haul quotes agreed after price drift,
and both near-pad burner-to-dock timings survived. The raw JSON result is
`out/agent-api-playtest-fixes/result.json`. Source syntax checks and
`git diff --check` also passed. These builder checks do not substitute for
independent QA, full build/boot, or final integrated browser verification.

Historical Wave 138 boot coverage was migrated for #171: the public raw
pulse now explicitly asserts no flee ownership and a cleared full-stop
latch. Existing internal flee steering, sun clearance, no-teleport, death,
and recovery assertions remain and activate that legacy module explicitly.
The #120 tactical retreat burner tests are unchanged.

## Final repair boundaries

The cruise threshold is 100u from the +X stage point. Planning predicts
moving hulls and brakes for their crossing paths. Natural live traffic can
take longer than the fixed acceptance fixture: the first 52.6130s run has
no phase trace, so its delay remains unattributed; the 48.5468s trace records
freighter avoidance and waits, with minimum sampled hull clearance 11.2136u.
All three runs have clean consoles and no heat/impact. The two live 40s
failures remain reported; they are not claimed as passes.

Desk quote freezing applies only while Jobs is visible. Hidden-pane reads
use current prices, and successful undock/dock invalidate the former berth's
cache. Duplicate ferry/passenger refusal receipts and visible notices were
restored without changing the obligation.

The authorized #139 test-fixture repair samples the actual impact frame and
removes only each test's spawned hull. The command
`node --import ./scripts/with-css-stub.mjs scripts/issue-139-dock-corridor-test.mjs`
still reports one failure on the candidate: **the sweep loiterer stayed on
the far side throughout**. Independent baseline/candidate comparison found
the same dynamic-loiterer assertion fails on the baseline. It remains
unchanged; the impact, safe-docking and authored-waypoint assertions pass.
This is distinct from `dock-approach-test.mjs`, whose far-side detour cases
pass on the candidate.
