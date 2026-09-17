# Issue #234: light-hull arrival diagnosis and recovery feedback

Status: partial progress. The missing recovery instruction is addressed
(sections up to "Confirmed fix"). One `blocked` failure class is now traced to
a specific accounting defect and fixed (sections from "Traced cause" onward).
Arrival collision avoidance and the four original cases remain unresolved. This
document does not claim that issue #234's overall arrival outcome is complete.

## Scope and evidence identity

Diagnosis used baseline `a923f9df5858e4b2752bf1f668c744caede8d5b1`.
The natural browser run recorded runtime hash
`3e92994a6fa0d096b184891a0a762d6c3cd68970062c8149aaebb338def824e4`,
unchanged across the run, with no runtime source modifications. Its 275.5 wall
seconds began at `2026-09-17T02:04:58.320Z`. It used the Greenhand starter light
hull, while the original spy playtest used Rim Drifter. Traffic, collision
damage, solar clearance, clocks, and gameplay tuning were intact. Navigation
used public `plotRoute`, `engageAutopilot`, and queued `approachDock` commands;
retries were explicit public commands, not automatic reacquisition.

The browser rendered at the normal rate and captured screenshots, console
errors, events, and roughly quarter-second flight samples. There were no
teleports or injected gameplay state in this natural run. The separate
feedback-only browser probe deliberately uses cancellation fixtures; it is not
natural arrival evidence.

Raw evidence is intentionally untracked:

- Original: `C:/Projects/WebSim/out/spy-playtest-20260917/` (`REPORT.md`,
  `actions.jsonl`, `observations.jsonl`, `results.json`).
- Fresh: `out/issue-234/live/light-dock-natural/` (`result.json`,
  `trace-0.25s.json`, `events.json`, `cancellation-windows.json`, screenshots).
- Historical extraction: `out/issue-234/spy-trace-mine.json`.
- Final feedback verification: `out/issue-234/feedback-toast-final/dock-feedback/`.
- Claude Code prompts/output: `out/issue-234/claude-*.txt` and
  `out/issue-234/claude-*.jsonl`.

## Original four cases

| Case | Evidence | Diagnosis limit |
| --- | --- | --- |
| Hollow Reach impact | Ship contact at t=753.982, speed 10.10, damage 3.54; failure first observed t=775.8, range 660u | Stopping after this contact is correct. The prior avoidance geometry is absent. |
| Freehold impact | Failure first observed t=1031.6, range 1508u | Triggering collision is missing from the sampled event ring; do not assign a body or cause. |
| Freehold blocked | Cruise stationary at about 384u from t=1065.7, failure first observed t=1081.6 | Nearby ships are present; Sable Ilex closes from 119u to 26u while the player is stationary. The trace does not identify the exact blocking guard. |
| Veridian blocked | Stage closes to about 58u then widens to 196u before failing near 185u | A ship passes nearby, but distance widening alone cannot distinguish a safe tangent from a defective plan. |

Original nearby bearings are ship-local, not world coordinates. They cannot be
added directly to the player position to reconstruct world trajectories.
Neither the four original traces nor the new run establishes that these cases
share one cause. No original case is declared fixed by the feedback change.

## Fresh natural route results

| Leg | Result |
| --- | --- |
| Freehold to Veridian | Ship impact at t=45.074 (speed 3.213, damage 0), then three blocked retries at t=71.357/82.045/117.597, ranges 273.9/284.2/290.8u. Still undocked at end, t=118.159. |
| Veridian to Freehold | Docked at the actual destination, t=177.377, without cancellation. |
| Freehold to Hollow Reach | Gate impact at t=238.276 (speed 38.321, damage 0); docked at the actual destination after an explicit retry, t=265.456. |

The Veridian blocked episodes had nearby ships, including Tessellate and
Patient Sorrow at roughly 40–61u in the first two retries. This confirms a
traffic-associated failure class, not that the safety stop should be removed.
Hollow's new contact was with a gate, unlike the original ship contact.

The run captured 1,036 flight samples and 3,176 events. Two additional ship
touches had speed 0.935 and 0 with zero damage. The existing harmless-touch
contract requires both zero damage and absolute speed below 1u/s; the two
impact cancellations therefore remain correct under that contract even though
their recorded damage is zero. Event impact speed is not the same quantity as
the ship's speed in a later observation.

Console errors and exceptions were both zero, the runtime hash stayed stable,
and both loopback listeners closed. The harness's PASS means evidence capture
and cleanup succeeded. It does not mean all three approaches succeeded.

## Confirmed fix and intentionally unchanged behavior

Before this change, the persistent HUD receipt and public `commLine` named the
cause but offered no next action. The shared `DOCK_APPROACH_LINES.blocked` and
`.impact` messages now retain their distinct causes and add: “Wait for
clearance or steer clear, then retry the approach.” An API pilot retries using
`approachDock`. Machine-readable reason tokens remain `blocked` and `impact`.

The controller still relinquishes propulsion on cancellation; reading the
message never retakes the helm. No avoidance, collision, watchdog, gate,
freighter, deadline, or solar-clearance logic is changed. Existing #221 and
zero-damage-touch contracts remain requirements, not exceptions to bypass.

The longer persistent receipt overlapped Controls and Manifest at 800x600.
A selector limited to `[data-dock-failure]` caps it at 400px (or the viewport
minus 32px) and wraps the full message. Independent QA then found that the
same extended text still clipped in the transient commLine toast. Only the
two exact shared cancellation messages now receive a dedicated toast class;
that class wraps at 360px (with a viewport cap) and uses flow spacing below
the persistent receipt and onboarding hint. Other helm/commLine styles and
text-safe DOM rendering are preserved.

The initial feedback change is committed at
`82baa6a256349a5fe71f8245847456bca749c060`; the QA toast correction is
`ef2a83af419ddbe15583e40da4b6d0d775803b46`. The final browser pass finished at
`2026-09-17T02:44:05.722Z`, with source hash
`d50bf52d8d4f7cf39f5b4e7873532916d3782d86f6c70c48368012bc0b32a40e`
unchanged across the run. Both blocked and impact receipts measured 400px,
wrapped with no element overflow at 1440x900 and 800x600. The probe verified
the cause and recovery action in the HUD and public commLine, and measured
every visible cancellation toast against the viewport, Controls, Manifest,
onboarding hint, persistent receipt, and other cancellation toasts. All four
reason/viewport combinations passed explicit no-clipping/no-intersection
assertions, including two simultaneous cancellation toasts. It also verified
persistence past six seconds, retained cancellation reason, explicit API retry
acceptance, and receipt clearing after acceptance. Console errors and
exceptions were zero; Chrome exited and both listeners closed. Compact and
after-retry screenshots were inspected. Expired slots leave vertical space;
no actual overflow or overlap was observed in these verified flows.

Verification setup failures are retained separately. An earlier browser-readiness
failure coincided with confirmed host memory pressure; a later retry overlapped a surviving
owned probe child and encountered a port conflict. Those attempts are not
counted as product verification. A clean pre-layout probe completed with the
existing Browser.close timeout recorded, while confirming actual process exit
and port closure. No shared harness or boot timeout was changed.

The first layout probe measured only the persistent chip, so its PASS did not
cover transient-toast clipping. The corrected probe includes both surfaces and
fails on clipping or intersections; it no longer reports that no CSS change
is warranted merely because the persistent chip fits.

## Remaining investigation (answered below for one class only)

The bounded diagnosis this section asked for has since been carried out. Its
result is the "Traced cause" section onward. The paragraphs below are kept as
the record of why that work was commissioned.

The fresh probe's initial NPC sampler captured distances but its guessed name
and velocity fields were null. Zero moving-ship counts in that raw trace mean
missing measurements, not stationary traffic. Planner branch, selected
waypoint, predicted clearance, and watchdog progress state were not recorded.
Consequently, the evidence is insufficient to choose a safe navigation fix.

The next bounded diagnosis should capture those controller decisions and
actual NPC record positions/velocities for a reproducing approach, then pin a
specific avoidable defect separately from legitimate obstruction. Do not
extend timers, suppress contact, or claim the generic blocked class is solved
because a later retry docks. The supplied natural probe now fails closed on
launch/route refusals and verifies the destination before counting completion.
Its local wall-budget callback does not change the shared harness. These probe
guard corrections received syntax checks; the recorded natural flight preceded
them, and its reported successful destinations were independently verified from
the saved end checkpoints.

---

# Traced cause and fix: the cruise turn-hold cancellation

Everything above this line predates the traced diagnosis. Everything below is
the bounded diagnosis it called for. One class is proven and fixed; the four
original cases in the table above remain unresolved and unreproduced.

## The defect

A light hull on a dock approach yields to crossing traffic, is held stationary
by the cruise **turn hold**, and is then cancelled `blocked` while it is
demonstrably turning back onto a clear line.

The progress watchdog, `dockMakingProgress` in `src/game/autopilot.js`, credits
heading progress only against `dockBestHeading`, an engagement-global best that
is reset only on a phase change. A yaw error is meaningful only relative to the
aim it was measured against, so when a traffic detour moves the aim point, the
old best describes a different target and becomes permanently unreachable. The
hull is then required to point at an abandoned waypoint to prove progress.

Three credit paths exist. In this episode all three are closed:

| Credit | Why it is unavailable |
| --- | --- |
| Range | The turn hold sets `ap.throttle = 0`, so the hull sits at exactly 0 speed and the stage distance never moves. |
| Heading | `dockBestHeading` is stale against the pre-detour aim, and unreachable. |
| Traffic / arc | The cruise call site passes neither `trafficYield` nor `arcCredit`; both are stage-phase only. |

With no credit path at all, the 10s `DOCK_BLOCK_SECONDS` deadline expires.

## The traced episode

Natural run, frozen at `out/issue-234/run1-frozen/` (raw evidence, untracked).
Starter light hull from the ordinary Freehold Greenhand origin; traffic,
collision damage, solar clearance, clocks and tuning intact; navigation by the
public `plotRoute` / `engageAutopilot` / `approachDock` commands only; runtime
`src` hash `c72fbb7f05d8` identical at run start and run end. Leg Freehold to
Veridian, station at `[-140, 30, -550]`, stage point `[-5, 30, -550]`:

| t | speed | stage dist | align | yawAbs | stall | event |
| --- | --- | --- | --- | --- | --- | --- |
| 35.042 | 47.9 | 1423.8 | 0.990 | 0.135 | 0.01 | `dockBestHeading` latches 0.136 |
| 35.144 | 53.0 | 1418.5 | 0 | 1.687 | 0.03 | aim flips behind the hull; NPC Patient Sorrow at 274.9u and closing |
| 35.677 | 0 | 1405.9 | 0 | 2.029 | 0.06 | hull fully stopped on the turn hold |
| 40.985 | 0 | 1405.9 | 0.531 | 0.994 | 5.37 | mid-window replan fires; by design it does not reset the deadline |
| 42.040 | 0 | 1405.9 | 0 | 2.520 | 6.43 | Patient Sorrow has left the window; aim returns forward |
| 45.614 | 0 | 1405.9 | 0.429 | 1.125 | 10.00 | cancelled `blocked` while still converging |

Over the final 3.5s `yawAbs` fell monotonically 2.520 to 1.125 and `align` rose
0 to 0.429. At cancellation the nearest traffic was 568.6u away, the planner
reported `ok` with a valid waypoint, and `braking`, `cruiseExitBlocked`,
`stationBlocked` and `escapeHold` were false on every cruise tick of the
episode. The leg still reached Veridian, but only after an explicit
`approachDock` retry, at a cost of 37s. A retry succeeding is not evidence that
the class is solved.

### Correction to an earlier claim

An earlier draft of this analysis said every braking predicate was false. Run 1
recorded the cruise branch's final `ap.idle` but not its separate terms, so the
direct `dockCruiseShouldBrake(p, velocity, acceleration, planningBodies)` call
inside the cruise hold was never measured on its own. What run 1 establishes is
that `braking`, `cruiseExitBlocked`, `stationBlocked` and `escapeHold` were
false, and that the hull was stationary with `align` at 0. That is consistent
with the align term alone forcing the hold, but it is not a measurement of the
direct predicate. The probe now captures every term of `ap.idle` separately.

## The fix

`src/game/autopilot.js` only. A cruise-phase turn credit. Convergence is
measured against `dockTurnRef`, a world direction frozen when the heading
target last moved materially, so what earns time is the hull's own rotation
against that frozen reference.

Design properties, each asserted by test:

1. A moving aim can never buy time. Target motion changes the reference, never
   the measured error. Adopting a new reference returns 0 seconds.
2. Only real rotation earns credit. The error must fall against a frozen
   direction by more than `DOCK_TURN_NOISE` (1e-3 rad, a float-jitter floor
   orders of magnitude below a real turn rate of about 0.017 rad per frame).
3. Hard bound. Total credit is drawn from one watchdog window and is refilled
   only by a 1u or larger all-time-best range gain. The refill is cleared
   before the frame's own credit is measured, so a rebase can never survive or
   steal a range reset. Replans and aim oscillation cannot rearm it.
4. Credit is not progress. It never resets `dockProgressAt` and never touches
   `dockReplans`.
5. Cruise only. The stage branch keeps its `trafficYield` and `arcCredit`
   accounting unchanged.

The fix adds no export, no persistent field, no tuning knob, no key and no
gauge. Unchanged: `DOCK_BLOCK_SECONDS` and every other constant in
`dock-approach.js`; collision policy (`dockImpact`, `dockTouchHarmless`, the
zero-damage-touch contract); solar clearance; traffic behaviour; the #221
freighter gate; helm reacquisition, so a cancellation still relinquishes the
helm and a retry is still an explicit `approachDock`. The change grants no
thrust and alters no aim, no braking term, no `ap.idle` and no `ap.throttle`.
It changes only how elapsed time is accounted against the deadline.

### Measured cost, stated as a number

The timer constant is unchanged, but that does not mean the worst case is
unchanged, and this document does not claim it is. Measured by `CASE=budget`
against the real watchdog:

| Case | Cancelled at |
| --- | --- |
| Wholly stuck hull, no credit offered | 10.017s |
| Adversarial oscillating aim, never closing 1u of range | 20.017s |

A hull that never closes range now survives at most one extra watchdog window:
10.00s more, 20.0s in total. A hull that keeps genuinely closing range is never
cancelled, which is what the watchdog always intended.

## Evidence

`scripts/issue-234-cruise-heading-credit-test.mjs`, four cases. Nothing in it
re-implements the code under test. It loads `dockTurnCredit` and the private
`dockMakingProgress` out of the product module itself with a load-time
re-export shim, so the product keeps them private.

### CASE=replay, the recorded failure through the real watchdog

The 106 recorded cruise ticks are committed at
`scripts/issue-234-cruise-heading-fixture.json`, carved from the raw capture
with its provenance and the raw file's sha256, so a fresh checkout runs this
regression with no untracked artifact. `FIXTURE=raw` re-derives the rows from
the raw capture and is how the committed fixture is audited. Both agree.

| Run | Result |
| --- | --- |
| Negative baseline: real watchdog, no turn offered. Every other caller still passes none, so this is the pre-fix accounting. | cancelled `blocked` at t=45.614, matching the recorded cancellation |
| Historical confirmation: the shipped pre-fix blob at `5cc51d58`, loaded from git | cancelled `blocked` at t=45.614, agreeing tick for tick |
| Positive candidate: real watchdog, cruise turn offered | survives the whole episode, 16 of 16 reconstruction variants |

The historical side is optional by design. A checkout without that commit still
runs every assertion, because the durable negative needs no history.

Honesty about the pose. The capture holds the watchdog's two arguments
(`range`, `yawAbs`), the hull position and the aim exactly. It does not hold
the hull quaternion. The baseline needs no pose at all. The candidate needs
`fwd`, and the capture pins it down as follows:

- The recorded `align` is `fwd . dir`. Where it was recorded unclamped it gives
  the angle between `fwd` and the aim direction exactly: no model, no fit. That
  is 36 of the 106 rows.
- The product clamps `align` at 0, so an error past 90 degrees records as 0 and
  loses its magnitude. For those 70 rows the capture bounds the error to
  `[yawAbs, pi]`. Two clamp modes sample that interval.
- The azimuth of `fwd` around `dir` is not recorded at all. Eight azimuths are
  swept, held constant across the episode because a real hull's forward vector
  moves continuously.

All 2 x 8 = 16 variants survive. This is not an exact pose replay and is not
presented as one. It is a replay of exactly-recorded watchdog inputs with the
unrecorded quantities swept across their admissible range.

### CASE=guard, bounds on the real dockTurnCredit

A motionless hull earns exactly 0s under a smoothly rotating aim, a coarsely
rotating aim, a reversing aim, an aim stepping one epsilon per frame, an
arbitrarily jumping aim, an aim sweeping onto the hull, and a motionless aim.
200 adversarial rebase-and-converge cycles earn exactly 10.0s, one watchdog
window, never more. A saturated budget is not rearmed by 50 further cycles of
aim oscillation. Reference adoption always buys 0. Degenerate input (zero-span
aim, zero-length heading, non-finite pose, non-finite elapsed) is inert.

### CASE=budget, bounds on the real dockMakingProgress

The numbers above, plus: a hull genuinely closing range is never cancelled.

### CASE=live, physical safety control

A control, not a reproducer, and labelled as such in the script. Real boot,
real starter light hull, real helm, real physics, real collision owners, and a
clear-lane Veridian approach.

| Runtime | Outcome |
| --- | --- |
| Pre-fix (`5cc51d58`) | docked at 36.5s, phases cruise/stage/corridor/settle/docking, 0 contacts, hull 100 to 100 |
| Candidate | docked at 36.5s, same phases, 0 contacts, hull 100 to 100 |

Identical. This case does not reproduce the defect and is not evidence that it
existed. It is evidence that the fix does not spoil an ordinary arrival.

### Regression suites re-run unchanged, all PASS

`dock-approach-test`, `issue-168-detour-watchdog-test`,
`issue-168-detour-progress-test`, `issue-168-cruise-obstacles-test`,
`issue-168-stage-obstacles-test`, `issue-172-dock-sun-test`,
`issue-221-freighter-dock-test`, and `issue-168-hold-traffic-test` in all four
`HOLD_CASE` modes (`blocked`, `static-blocked`, `moving-blocked`,
`yield-budget-clock`).

## The probe

`scripts/issue-234-natural-planner-probe.mjs` is diagnosis-only and edits no
product source. It instruments the controller with CDP conditional breakpoints
whose conditions read the paused frame and return false, so the page never
pauses.

It now fails closed. A debugger pause, a page instrumentation error, a dropped
decision sample, traffic within 300u whose speed could not be read, or a phase
that was flown but whose logpoint captured nothing all set
`summary.captureVerdict` to `FAIL` and raise after the artifacts are written.
Coverage is checked against the phases the run actually flew, not an assumed
itinerary. Ambiguous logpoint anchors are rejected rather than silently
resolved to the first match, because three dock branches share the same
`!planned.ok` wording.

Added since run 1: the corridor/settle branch; the three early-return plan
rejections that disengage before the instrumented tail; and every term of the
cruise hold measured separately, including the direct `dockCruiseShouldBrake`.
That predicate is pure (it reads position, velocity and the body bag and
returns a boolean, `src/game/dock-cruise.js`), so a logpoint may evaluate it.

Stated limit: the sun pose is read best-effort and is recorded as `not-found`
when no known field matches. Run 1 recorded `not-found`, and no solar cause is
inferred anywhere in this document.

## What this work does NOT fix

The four original cases in the table near the top of this document were neither
reproduced nor resolved here. They remain open and unproven:

1. Hollow Reach ship impact with real damage (speed 10.10, damage 3.54).
2. Freehold impact at range 1508u.
3. Freehold `blocked` at about 384u with a stationary cruise.
4. Veridian `blocked` at about 185u after closing to about 58u.

Also not reproduced in run 1: any stage-phase `blocked` cancellation (only 91
stage decision records against 514 cruise), and any corridor/settle
cancellation, because that branch was uninstrumented in run 1. It is
instrumented now.

Separately classified and deliberately out of scope: eight `bodyHit` contacts
at t=176.6 to 178.3 in `redmarch`. All occurred under route autopilot with the
dock controller not engaged, inside an active pirate engagement, and every
contact did 0 damage. Recorded but not acted on: 7 of the 8 had 0 damage yet
speed at or above 1u/s, so under the current `dockTouchHarmless` rule they
would have cancelled an approach had dock mode been engaged. That is an
observation about how the zero-damage-touch contract interacts with sustained
scraping contact, not a proposed change. The #221 freighter gate and the
zero-damage-touch contract are preserved as requirements.

## Natural candidate run

A natural live re-run of the probe against the committed candidate, on the same
route and under the same conditions as run 1, is recorded separately once it
completes. Until that run is recorded, the evidence above is trace-replay and
harness evidence, not live-candidate evidence.
