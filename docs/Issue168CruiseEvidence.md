# Issue #168: cruise to the current station

## Contract and implementation

The issue's alternative shape is implemented: `approachDock` remains an empty-argument command for the current station. Requests more than 500 units from its +X stage begin with `observe().autopilot.mode === 'dock'` and `phase === 'cruise'`. The existing route planner, obstacle collection, sun heat envelope, avoidance bias, and route throttle policy drive this far leg. The approach brakes before handing off to the existing slow stage within 200 units of that point. A station blocking the chord triggers the conservative stage handoff within 500 units of the station; nearby requests retain their existing slow approach.

The observable sequence is `cruise → stage → corridor → settle → docking → complete`. Existing named refusals remain authoritative; a second request while the approach owns the helm refuses `autopilot`. There is no new waypoint/gate command, key, ship tuning, persistence field, event type, or human flight change. The capabilities command note describes this contract.

This also addresses the sun-path defect overlapping #172: the dock stage previously retained a detour only when the station blocked the direct chord, discarding a sun-only detour. It now follows the planner's sun detour and rejects an avoidance bias that cuts its protected chord. Nearby station tangent behavior remains conservative.

Integration for #171 allows an already active raw burner to hand off to docking. A controls-authored `input.agentAfterburnerPressed` edge does not cancel the dock helm; an ordinary physical burner press still does. This consumer requires the separate controls provenance commit from the steering worker. Combat and flee helm exclusions remain. Capabilities also describe #169's positive `steerY` as nose down and positive `steerX` as nose right; the steering implementation is a separate artifact.

## Verification

- `node --import ./scripts/with-css-stub.mjs scripts/issue-168-cruise-test.mjs`: actual boot systems and jump arrival at Veridian, stock Greenhand tuning, 39.3333 simulation seconds to berth, peak approximately 120 units/second, no `sunHeat` or `bodyHit`, and all cruise/dock phases observed. This deterministic static-route fixture removes moving NPCs after arrival to isolate the route contract.
- `node --import ./scripts/with-css-stub.mjs scripts/dock-approach-test.mjs`: near, far-side, 3 km far-side cruise, sun-blocked chord, finite-state/refusal/cancellation, pause, dock pulse, and restore checks pass. The sun fixture asserts the minimum distance stays outside `sunRadius * PHY.SUN_HEAT_MULT`, not merely outside the visible star. Burner provenance checks preserve physical cancellation.
- `node scripts/agent-schema-test.mjs`: capabilities and schema suite passes.
- `node scripts/issue-168-cruise-live-probe.mjs`: owns a loopback-only Vite server and dedicated Chrome profile; drives a fresh Greenhand through public `startGame`, `chooseOrigin`, `plotRoute`, `engageAutopilot`, and `approachDock` calls. No world transforms, clock acceleration, or traffic changes are applied. It captures arrival/berth screenshots, simulation timing, events, console errors, runtime-source hashes, and process/port cleanup in an ignored `out/issue-168-cruise-live/<timestamp>/veridian-public/` directory. Set `CRUISE_OUT` to select a new evidence directory. Chrome may require running outside the filesystem sandbox for its GPU subprocess to render.

The initial rendered pass used real Intel/ANGLE hardware rendering with untouched traffic: 39.1143 observed simulation seconds from arrival checkpoint to berth, peak 119.9998, no `sunHeat` or `bodyHit`, no browser console errors or exceptions. Source hashes matched throughout, both owned processes exited, and their Vite/CDP ports closed. The final source rerun is recorded below.

Final rendered PASS: `out/issue-168-cruise-final/veridian-public/result.json`, with `arrival.png` and `berth.png` beside it. The accepted command receipt to `docked` event interval was **38.3846 simulation seconds**; peak speed **119.9998**, all six phases observed, no heat/impact events, no console errors or exceptions. Start/end source SHA-256 was `f8011751a40d61f3e286cb805d2a832f74218a7fd0739fb3ab87dd3480360fac`. Chrome PID 2940 exited normally, owned Vite PID 85204 exited, and both ports were closed. The earlier `out/issue-168-cruise-live/veridian-public/result.json` is an environmental GPU subprocess failure and is not acceptance evidence.

## Existing corridor fixture finding

`scripts/issue-139-dock-corridor-test.mjs` already fails its assertion that a moving loiterer remains on the station's far side on base `0991593bd905d00451b9f7d2b5f58eea737d3ac2`: NPC avoidance can move the actual hull beyond its authored waypoint half-plane. This assertion is retained; no product behavior was changed to satisfy it.

A separate fixture-only commit records nearest-hull geometry on the collision frame instead of after the remainder of a 30-frame batch, and removes old fixture hulls from `ctx.ships` as well as the scene. The existing old-ring collision, collider identity/range, new-ring no-collision, and fresh approach checks remain; the preexisting dynamic-pose assertion remains a reported failure. That fixture commit can be reviewed independently of the cruise implementation.

## Review and limits

Builder security and code checklists were applied to the diff. No credentials, external endpoints, new agent action authority, unsafe DOM insertion, or persistence changes were introduced. Planner/geometry validation and held-helm refusals remain fail-closed. The browser probe binds loopback and stops only its own processes. No high/critical findings remain in the builder review; independent QA is still required.

The route avoids collected bodies and heat zones but does not promise collision-free flight through every possible moving NPC encounter. A deterministic seed-7 headless traffic encounter collided on both the baseline and intermediate cruise build; the static boot pin isolates route safety, while the public rendered acceptance retains live traffic. No pursuit, traffic, combat, or #173 cancellation redesign is included.

## Integration prose for AgentApiDesign.md

`approachDock {}` flies to the current station. Beyond 500 u from the +X stage it starts in `autopilot.mode: 'dock', phase: 'cruise'`, using route speed with body/sun avoidance. It brakes into the existing slow `stage` within 200 u of the stage point (earlier, within 500 u of a station blocking the chord), then proceeds through `corridor`, `settle`, and `docking`. Nearby requests keep the slow approach. Existing named refusals apply. Raw afterburner pulses do not own the helm, and docking can take over while such a pulse is active; physical manual burner presses still cancel the dock helm. Raw `setControl.steerY > 0` pitches the nose down; `steerX > 0` turns right.
