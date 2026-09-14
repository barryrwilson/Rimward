# Agent API playtest fixes — 2026-09-14

This work addresses the five open `area:agent-api` issues reported against
master `0991593bd905d00451b9f7d2b5f58eea737d3ac2`.

| Issue | Acceptance contract | Evidence |
|---|---|---|
| [#168](https://github.com/barryrwilson/Rimward/issues/168) | Cruise to the local station through the existing approachDock helm, then brake into the dock corridor; Veridian arrival gate to berth in under 40 sim seconds without sunHeat. | [Cruise evidence](Issue168CruiseEvidence.md): public live arrival-to-berth 38.3846 sim seconds; no heat/impact, clean console. Integrated QA pending. |
| [#169](https://github.com/barryrwilson/Rimward/issues/169) | Raw control axes reach the real ship, with positive steerY pitching down and a real-quaternion regression test. | [Steering evidence](Issue169SteeringEvidence.md): all axes >10 degrees in one sim second; pitch sign corrected, original no-turn report unreplicated in isolated Chrome. |
| [#170](https://github.com/barryrwilson/Rimward/issues/170) | Desk refusals carry a token and reason; undock from service panes has explicit behavior; observed offers match the current desk. | [Desk evidence](Issue170DeskEvidence.md): named refusals, eight service-pane launches, real desk filtering and live market-pane launch verified by builder. |
| [#171](https://github.com/barryrwilson/Rimward/issues/171) | Raw afterburner pulses give a burst without taking the flee helm and permit an immediate approachDock handoff; combat retreat burner remains available. | Combined `issue-171-burner-test.mjs` passes both already-active and same-turn queued burner handoffs; retreat regression remains green. |
| [#178](https://github.com/barryrwilson/Rimward/issues/178) | Haul reward quotes agree across the desk, observation and acceptance after price drift. | [Desk evidence](Issue170DeskEvidence.md): price-drift card/offer/acceptance agreement verified; accepted pay stays fixed. |

## Verification boundaries

The reported #169 no-turn symptom did not reproduce in standalone Chrome on
the issue's master revision: renewed raw leases turned all three axes in real
frames. The baseline did reveal an opposite pitch sign. Tests distinguish this
confirmed contract mismatch from the original unreplicated symptom. The
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

`npm run test:agent-playtest-fixes` runs the cruise, real-hull steering,
desk/quote and raw burner handoff scenarios in checked fresh processes.
The same group is included in `npm run test:boot` and
`npm run test:release-focused`, preserving all existing scenarios and
assertions. Live entry points are `test:agent-cruise-live`,
`test:agent-steering-live`, and `test:agent-desk-live`.

The candidate combines the exact worker artifacts `e2dd59b6` (#169),
`6ccc617f` (#171 provenance), `3e5c8807` (#170/#171/#178), and
`900af8dc` (#168). Their cherry-picked integration identities differ from the
worker hashes. Final integrated artifact identity and QA verdict are pending;
no default-branch merge, push or deployment has been performed.

The bounded combined group passed **4/4** on the integrated tree before the
final gate: Veridian cruise reached berth in 39.3333 simulation seconds,
steering/throttle passed 22 pins, desk/haul quotes agreed after price drift,
and both burner-to-dock timings survived. The raw JSON result is
`out/agent-api-playtest-fixes/result.json`. Source syntax checks and
`git diff --check` also passed. These builder checks do not substitute for
independent QA, full build/boot, or final integrated browser verification.

Historical Wave 138 boot coverage was migrated for #171: the public raw
pulse now explicitly asserts no flee ownership and a cleared full-stop
latch. Existing internal flee steering, sun clearance, no-teleport, death,
and recovery assertions remain and activate that legacy module explicitly.
The #120 tactical retreat burner tests are unchanged.
