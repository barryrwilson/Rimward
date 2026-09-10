# Fresh-start sun drift: investigation and verification

Status: cause reproduced; narrow heading fix implemented and locally verified.
Independent source/evidence QA passed `6e17f69f9db65d902dbe1272fc69a43d45103385`.
Owner-approved exact bytes and separate measured startup exceptions are recorded
and the byte descriptor is activated. Ordinary build/report, complete artifact
comparison, and final policy QA remain pending. No merge or deployment is claimed.

## Reproduced behavior

Baseline: `acc8662431507d257ed094975224fd7ed4cf80fa`.
Fresh Greenhand and Beautiful starts fly into Freehold's sun with untouched
controls. This is ordinary starting flight, not gravity or a test-only pose.

| Origin | Sun-core death, simulation seconds | Input after origin choice |
|---|---:|---|
| Greenhand | 25.1774 | None |
| Beautiful | 25.2489 | None |

Local raw evidence is under
`C:/Projects/WebSim/out/starter-sun-drift-evidence/baseline-live-local/`, in
`untouched-greenhand/result.json` and `untouched-beautiful/result.json`.
Both action logs contain only successful public `startGame` and `chooseOrigin`.
There are no post-choice controls or hail dismissals. Both runs use real browser
animation time, fresh profiles, seed 1, and read-only simulation telemetry.
RNG seeding is the only fixture; frame ordering can change random consumption.
Both record stable runtime source, empty console-error/exception arrays, exited
Chrome/Vite processes, and closed Vite/CDP ports. Root inspected screenshots.
The baseline runtime-source digest is
`d92f394200164ec91b737a891dba709eb92950ac6001867dac03926ecfc02440`.

These are two reproduced browser cases, not an estimate of encounter frequency
or universal survival. Their probe PASS means the expected original failure
was observed with valid instrumentation; it is not a gameplay or QA PASS.
The earlier [issue #10 evidence](Issue10StarterPacingEvidence.md) reported
25.233-second untouched deaths in headless simulation. Its surviving browser
runs explicitly commanded full stop, so they did not exercise this condition.

## Source cause and bounded change

`src/core/ctx.js` starts the ship at `(0,30,800)`, with throttle zero and
`fullStop: false`. `initShip` previously retained identity orientation; the
ship's local forward axis is `-Z`. Ordinary flight in `src/systems/ship.js`
therefore accelerates toward the sun through the 30-unit creep floor, with
small damping. Greenhand and Beautiful origin effects do not change this pose.
`src/game/authored-systems.js` gives Freehold a 60-unit sun radius;
`src/game/physics.js` makes heat begin at 144 units and the lethal core at 67.2.
`src/systems/combat.js` applies those hazards normally. No gravity force is
involved, and hostile grace does not provide sun immunity.

The runtime change is one call and its explanatory comment in `initShip`,
immediately after copying the spawn position: `root.lookAt(config.world.sunPosition)`.
Object3D aims its local `+Z` toward the sun, placing the ship's `-Z` nose
outward. Initial straight flight then increases both sun and station distance.
The other Freehold origins inherit this heading; Drifter retains its existing
origin-specific outward pose. Valid saved position/quaternion are restored
later by `save.js`, and hull remount already preserves the current transform.

Visible tradeoff: the home station and sun begin behind the player. Actual mouse
turn-back and keyboard docking passed in the browser. Scope excludes recovery fallback,
save repair, persisted control/pose changes, new inputs or gauges, flight tuning,
sun tuning, hostile grace changes, and additional onboarding mechanics.

## Acceptance and current gates

- Fresh Greenhand and Beautiful survive at least 60 simulation seconds untouched,
  without sun heat/core events; ordinary forward throttle also clears the sun.
- Confirm fresh-origin heading consistency and preservation of saved heading.
- Exercise turning, stopping/resuming, and return-to-station docking in the
  rendered game; check console errors and source identity.
- Complete relevant focused tests, full boot, ordinary build, and independent
  review of the exact final artifact. Update the backlog/wishlist outcome.

## Completed builder verification

`node --import ./scripts/with-css-stub.mjs scripts/starter-sun-drift-test.mjs`
passes all five origins at idle and half throttle for 60 simulation seconds,
with outward initial heading, increased sun distance, and no solar events.
Greenhand and Beautiful explicitly retain positive hull and remain alive.
The half-throttle focused cases assign an input fixture; these are deterministic
real-system tests, not browser or natural-input evidence. The same test covers
mouse steering, the existing R throttle ramp, double-F full stop, and an actual
fresh boot restoring a saved non-default position and quaternion. The initial
full suite and four affected cases after the explicit survival assertion are
recorded in `focused-tests-2.log` and `focused-survival-tests.log` under the local
evidence directory. Earlier failed harness attempts are preserved separately.

The live runner is `scripts/starter-sun-drift-live-probe.mjs`, using
`--expected original` for the reproduced failure and `--expected safe` for the
candidate. `DRIFT_OUT` selects a new evidence directory; the runner refuses to
overwrite an existing origin folder. `DRIFT_SCENARIO=forward` sends centered
public half-throttle leases; `flight` exercises the actual mouse/keyboard and
native save/reload sequence. Untouched is the default. `DRIFT_ORIGIN` can select
one origin. No transform, defense, or clock injection is used in these runs.

| Candidate browser case | World seconds | Wall seconds | Final hull | Final sun distance |
|---|---:|---:|---:|---:|
| Greenhand untouched | 60.3637 | 60.4420 | 100 | 2,599.899 |
| Beautiful untouched | 60.4127 | 60.5388 | 100 | 2,601.548 |
| Greenhand public half throttle | 60.2475 | 60.3599 | 100 | 5,273.287 |
| Beautiful public half throttle | 60.1206 | 60.2628 | 100 | 5,265.627 |

All four began at sun distance 800.562, recorded no sun heat/core or destruction
events, and passed the safe expectation. The two untouched action logs contain
only start/origin choice. The half-throttle logs additionally contain successful
public `setControl` receipts; they do not dismiss hails. Measurements use actual
observed world time, not the later screenshot checkpoint time. Read-only DOM
and state diagnostics add overhead; this is functional evidence, not a
performance benchmark or an estimate of incident probability.

Raw candidate results and initial/terminal screenshots are under
`fixed-live/` and `fixed-forward-live/` in the local evidence directory. The
supplemental `fixed-flight-live/flight-greenhand/result.json` records actual
CDP mouse steering, R/F keys, and J docking confirmed by world time 14.283.
Its native dock autosave survives a page reload with exactly equal position and
quaternion before Continue. It then resumes play without another origin choice.
The station panel and saved reload screenshots were inspected. All five live
candidate cases report stable runtime source, no browser console errors or
exceptions, owned Chrome/Vite exits, and closed Vite/CDP ports. The failed
sandbox GPU launches remain in `baseline-live/`; the successful local runs use
Intel UHD D3D11 rendering outside that command sandbox.

The baseline successful probe hash was
`366fd336de6f3903529e3c44159e54103d3c97003220e63cb74981dd278c9793`;
all candidate live runs used probe hash
`7e62d1d2786f2af38aa2cdf69b8c6f0ae7d79c75f1e6d37aa96408772a16019a`.
Git normalized line endings in the stored probe, and a surplus EOF blank line
was removed after capture. Executable code is unchanged; the hashes above
identify the captured probe bytes, not the final whitespace-cleaned file.
The runtime source hash is
`b7f2d46f2f7550028ff83b9a0197e29bbd702770714e9c9b8b245120a27e04a2`.
Baseline and candidate full boot passed, with unchanged ship source during the
candidate run (`boot-candidate.log`, `boot-ship-before.json`,
`boot-ship-after.json`). No tests or release thresholds were weakened.

## Remaining release gates

Baseline build passed. Before exception activation, the candidate ordinary build
failed only the byte gate: 1,825,899 minified / 545,419 gzip JavaScript bytes,
30 / 10 bytes above the exact previous issue #12 artifact. The separate
three-only browser dependency-boundary diagnostic passed. That diagnostic does
not convert the ordinary build into a PASS. The exact approved byte descriptor
is now activated, with global limits, matcher, and dependency audit unchanged;
ordinary build/report and full emitted-artifact comparison remain pending.
Five serial production startup samples had median 7,880.8 ms and maximum
8,076.1 ms; two exceeded the unchanged 8,000 ms target, so raw startup failed.
All 447 candidate files were independently rehashed against the saved manifest.
Exact artifact identities, raw measurements, limitations, and the owner-approved
exact byte and separate startup decisions are in the
[measured release decision](releases/starter-sun-drift-measured-decision.md).
The two-overrun raw startup FAIL is retained; its separate acceptance does not
follow from the byte exception.

The initial authenticated Claude build stalled without producing changes; its
scoped retry was rejected by automatic approval review over external source
disclosure. Implementation and builder tests therefore used the designated
local Codex fallback. The owner subsequently explicitly authorized scoped
Claude review and conditional exact byte/separate startup exceptions on
2026-09-10. Independent Claude review returned source/evidence **PASS**, with
no blocking findings, on `6e17f69f9db65d902dbe1272fc69a43d45103385`, fulfilling
those conditions. The verdict is retained as `QA-SOURCE.md` in the local evidence
directory. Raw transcripts are `claude-source-review.jsonl` (initial review,
reached the turn limit) and `claude-source-review-continuation.jsonl` (final PASS).
Review reproduced the runtime source digest and focused tests, checked pose
contracts, and confirmed executable probe code was unchanged by EOF cleanup.
Its separate death-respawn observation is parked outside this fresh-start scope.
Final independent policy/documentation QA remains pending after the ordinary
build/report and complete artifact comparison; release readiness is not claimed.
