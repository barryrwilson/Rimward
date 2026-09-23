# Issue #234: light-hull arrival diagnosis and recovery feedback

Status: partial progress. The missing recovery instruction is addressed
(sections up to "Confirmed fix"). One `blocked` failure class is now traced to
a specific accounting defect and fixed (sections from "Traced cause" onward).
Arrival collision avoidance and the four original cases remain unresolved. This
document does not claim that issue #234's overall arrival outcome is complete.
The 2026-09-22 section at the end places both historical impacts at an arrival
gate bore, splits the arrival-facing cause into #255, and fixes a second
gate-related cause: hub rings were invisible to the dock planner.

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
old best describes a different target. It is not permanently unreachable: once
the hull swings onto the new aim, a later yaw error can beat it. During the
reorientation, though, it is a stale and low threshold, so it withholds credit
for as long as the watchdog is counting down.

Three credit paths exist. In this episode all three are closed:

| Credit | Why it is unavailable |
| --- | --- |
| Range | The turn hold sets `ap.throttle = 0`, so the hull sits at exactly 0 speed and the stage distance never moves. |
| Heading | `dockBestHeading` is stale against the pre-detour aim, and no tick in this episode beat it. |
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
false, and that the hull was stationary with `align` at 0. Misalignment alone is
enough to set `ap.idle`, so the recorded hold proves neither that the direct
brake predicate was false nor that the turn hold was the only term asserting.
The probe now captures every term of `ap.idle` separately.

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

The new credit adds at most one watchdog window, 10.00s, for each real range
episode. The 10.017s and 20.017s numbers are the measured times of these two
specific fixtures, which hold `yawAbs` fixed; they are not a general guarantee
that a hull with no range gain always dies by 20s. The watchdog's pre-existing
heading credit can reset the deadline on its own whenever the yaw error beats
`dockBestHeading`, independently of the new turn credit. A hull that keeps
genuinely closing range is never cancelled, which is what the watchdog always
intended.

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
| Positive candidate: real watchdog, cruise turn offered | survives the whole episode under all 16 synthetic pose fixtures |

The historical side is optional by design. A checkout without that commit still
runs every assertion, because the durable negative needs no history.

Honesty about the pose. The baseline is exact: it replays the recorded `range`
and `yawAbs` scalars and needs no pose at all. The capture also holds the hull
position and the aim exactly, but not the hull quaternion. The candidate needs
`fwd`, so the 16 variants are SYNTHETIC SENSITIVITY FIXTURES, built as follows:

- The recorded `align` is `fwd . dir`. Where it was recorded unclamped it gives
  the angle between `fwd` and the aim direction exactly: no model, no fit. That
  is 36 of the 106 rows.
- The product clamps `align` at 0, so an error past 90 degrees records as 0 and
  loses its magnitude. For those 70 rows the capture does not bound the error.
  `yawAbs` is only the yaw component, and with pitch present the total error
  `acos(cos(pitch) * cos(yaw))` can be smaller than `yawAbs`, so `yawAbs` is not
  a floor. Two clamp modes pick two values; they do not sample an interval.
- The azimuth of `fwd` around `dir` is not recorded at all. Eight azimuths are
  used, held constant across the episode because a real hull's forward vector
  moves continuously. An arbitrary azimuth need not match the recorded `yawAbs`
  or the hull's real turn rate.

All 2 x 8 = 16 fixtures survive. These are not the recovered pose, not a
physical reconstruction of the hull, and not a conservative or exhaustive bound
over the poses the episode could have had. Their agreement shows the verdict
does not rest on one arbitrary pose choice. It is not proof that the recorded
hull would have survived, and it is not live efficacy evidence.

Sampling caveat: the capture is at about 0.1s while the sim ticks at 1/60s, so
the replay can also OVER-credit. One converging sample credits the whole gap
even if the live sim converged only on its final frame.

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

The natural live re-run is done, at commit `9a46a8e8`, with evidence at
`out/issue-234/candidate-live-final/natural-planner/result.json` (untracked).
Runtime `src` SHA-256
`742d4a247ebcb8bf5bf83f19910ed209c50e7bd5d301d1b9ca6133154a104aa3` was
identical at run start and run end. All commands were public Agent API calls;
traffic, collision and clocks were intact, with no teleport, no suppression and
no clock edit. 213 wall seconds, 813 flight samples, 2,752 decision samples.

| Measure | Result |
| --- | --- |
| Destinations | 3 of 3 docked |
| `blocked` / `impact` cancellations | 0 |
| Contacts | one harmless touch, speed 0 and damage 0 |
| Capture verdict | PASS |
| Console errors, exceptions, debugger pauses, instrumentation errors, dropped samples, unknown NPC speeds | 0 |

The probe captured the actual `fwd` / quaternion this time, so the turn credit
is measured rather than synthesised: 101 sampled frames took positive turn
credit, the largest total used in one episode was 3.187s of the 10s window, and
the largest single frame was 0.0226s. Chrome (pid 128308) and Vite (pid 130488)
exited and the ports were verified closed. A dock screenshot was inspected
independently.

This is live-candidate runtime evidence for the traced cruise turn-hold class.
It is not a repeat of run 1's exact random trajectory, so it does not re-fly
that individual failure. The four original historical failures in the table near
the top of this document remain unproven and unresolved, the separate route-
autopilot collisions are not claimed fixed, and issue #234 stays open as a
partial outcome.

Build and boot gates: build PASS in 8.79s and boot unchanged PASS, logged at
`out/mission-234/build.log` and `out/mission-234/boot.log`; runtime source is
unchanged from `eadcca5` through the final commits. The focused suites remain
11 PASS, and `CASE=all` passes: the exact recorded-scalar negative baseline
replay, the 16 synthetic sensitivity fixtures (not physical proof), the bounded
added-10s budget fixture, and the 36.5s physical control dock with no contacts.

## Resumed diagnosis — 2026-09-19

This follow-up starts at `7862dfc40e0129b0145d18db1adc51d4fa2a4247`.
It changes diagnosis scripts only: no gameplay source, navigation tuning,
collision policy, helm authority, or watchdog accounting is changed. The four
historical failures remain unresolved unless explicitly reproduced below.

### Greenhand queued route

The unchanged enriched probe ran from the ordinary Greenhand light-hull origin
at Freehold with public route and queued-dock commands, normal clocks, intact
traffic and collision damage. Raw artifacts are local and untracked at
`out/issue-234/resumed-run1/natural-planner/`; its execution log is
`out/mission-234-resumed/natural-run1.log`.

| Destination | First-attempt docking time | Retries / cancellations |
| --- | --- | --- |
| Veridian | 80.524s | 0 / 0 |
| Freehold | 140.009s | 0 / 0 |
| Hollow Reach | 224.119s | 0 / 0 |

The flight capture lasted 235.2 wall seconds, with 869 flight samples and 3,164
controller decisions. Capture PASS is distinct from gameplay completion; this
run achieved both clean capture and all three destinations. Console errors,
exceptions, debugger pauses, instrumentation errors, dropped decisions, and
unknown nearby NPC speeds were all zero. Actual berth screenshots were
inspected. The source SHA-256 was identical at both ends:
`3226e763c8816250c4f6e419a76ac40d6b68032909ec2123df10a7e9a9149b6c`.
Chrome and Vite exited, with both loopback listeners closed.

This was not a contact-free route. Two ship contacts were recorded: t=84.621,
speed 40.712, damage 0 while departing Veridian; and t=182.142, speed 79.897,
damage 0 in Redmarch. The neighboring flight samples show route mode with the
dock controller inactive. Neither was a dock-approach cancellation. The probe's
`bodyHitsHarmful` label means the contact would fail the dock harmless-touch
predicate; it does not mean positive damage occurred. These route contacts do
not prove the cause of any original arrival failure.

### Direct Rim Drifter coverage and probe correction

The shared live runner now accepts an optional `origin` argument, retaining
Greenhand by default. The issue probe accepts `ISSUE234_ORIGIN=drifter` and
`ISSUE234_DOCK_MODE=direct`. It records the requested origin separately from
the actual running world's origin; unexpected inputs fail before browser
startup. The default queued command sequence and shared boot/timeouts remain
unchanged.

Direct mode waits for each natural jump to finish before issuing another public
command. An ordinary unqueued route deliberately drops helm authority at each
jump. The probe therefore records its initial public `nav.path`, waits for the
expected next system with `gate.jumping === false`, and explicitly continues
an intermediate hop only after verifying an intact shorter route, both helm
flags down, route mode, and no cancellation reason. It never resumes merely
because the ship stopped in the same system. At the final destination it waits
for route-arrived status and a completed jump before issuing `approachDock`.
One total wall deadline bounds the direct route; the overall flight budget and
existing dock retry limits also remain in force.

The initial direct attempt at harness commit
`b39acbf0b079d521b93fbb08d894f0f42c68c309` failed capture correctly. At the jump
midpoint the public route already said arrived and helm flags were down, but
`gate.jumping` was still true. `approachDock` correctly refused the request;
subsequent route commands were also refused while jumping. No approach was
flown, so this is a probe-readiness failure, not product arrival evidence.
It remains at `out/issue-234/resumed-run2/natural-planner/`. Independent QA also
identified the need to continue ordinary intermediate hops explicitly.
Correction commit `ce5373403aa590b24cb47f022f20b522fbd50d5f` addresses both probe
errors and preserves the failed evidence.

### Corrected Rim Drifter direct route

The final run used `ce5373403aa590b24cb47f022f20b522fbd50d5f` and finished at
`2026-09-19T19:00:48.395Z`. Artifacts are
`out/issue-234/resumed-run3/natural-planner/`. The runtime itself confirmed
origin `drifter`, class `light`, and starting system `redmarch`.

| Destination | First-attempt docking time | Retries / cancellations |
| --- | --- | --- |
| Veridian | 38.983s | 0 / 0 |
| Freehold | 100.897s | 0 / 0 |
| Hollow Reach | 177.660s | 0 / 0 |

All three direct approaches were accepted after completed jumps; none was
queued. The route flew five hops with two explicit intermediate continuations.
The three-hop final leg recorded completed arrivals at Veridian (120.046s),
Redmarch (134.560s), and Hollow Reach (147.776s), with `jumping: false`, route
mode, and an empty reason at each continuation. All three berths were reached
on the first dock attempt. Capture PASS covers 687 flight samples and 2,994
controller decisions over 184.2 wall seconds. Console errors, exceptions,
debugger pauses, instrumentation errors, dropped decisions, and unknown nearby
NPC speeds were zero. Freehold's docked screenshot was inspected.

Two ship contacts occurred under route mode with the dock controller inactive:
t=117.288 in Freehold, speed 77.790, damage 0; and t=135.120 in Redmarch,
speed 27.078, damage 0. Neighboring samples recorded hull 100. These are
separately classified route contacts, not arrival cancellations or evidence
that the original impacts were fixed.

The source hash matched the Greenhand run at both ends, and Chrome (10544) and
Vite (1724) exited with both listeners closed. Six first-attempt docks across
the two successful runs did not reproduce any remaining `blocked` or `impact`
cancellation. No new gameplay cause was confirmed; no speculative gameplay fix
or new product regression test was added. This is a bounded diagnosis result,
not completion of issue #234.

### Verification and limits

Build and the unchanged `npm run test:boot` passed; coordinator logs are
`out/mission-234-resumed/build.log` and `out/mission-234-resumed/boot.log`.
Focused checks passed using the repository's existing CSS-stub loader:
`issue-234-cruise-heading-credit-test` with `CASE=all`,
`issue-221-freighter-dock-test`, `issue-201-arrival-dock-test`, and
`dock-approach-test`. Their logs are `out/mission-234-resumed/*-verified.log`.
An initial invocation without the required loader failed on the CSS extension;
those setup-failure logs are retained separately and are not product failures.

The natural samples remain bounded observations, not an exhaustive reliability
claim or a replay of the original random trajectories. Decisions are sampled
at roughly 10 Hz and flight state at 4 Hz, nearby NPC lists are truncated, and
solar pose remains best-effort. No causal body or exact collision frame is
inferred from absent data. No new gameplay regression has been demonstrated
by either completed run; issue #234 remains open.

## Gate-bore arrivals and hub rings — 2026-09-22

This follow-up starts at `c5bc8f44eb5f23537139af92386ba67d0dcbc99a`. It
characterizes both historical `impact` cases, confirms two gate-related causes,
fixes one of them, and splits the other into
[#255](https://github.com/barryrwilson/Rimward/issues/255).

### Historical impacts: the arrival bore

Re-reading the original spy capture (`C:/Projects/WebSim/out/spy-playtest-20260917/`)
places both historical impacts at an arrival gate:

| Case | Arrival | Contact | Pose when failure was observed | Gate traffic |
| --- | --- | --- | --- | --- |
| Hollow Reach impact | route `arrive` at t=752.540 | t=753.982, ship, speed 10.10, damage 3.54 | `[0.0, 69.1, 1086.4]`, 13.6u from the Redmarch gate `[0, 70, 1100]` | Tithe Pick and Freighter hollowreach-1 escaped through that gate at t=755.2 |
| Freehold impact | during the t=992.8 queued route | not retained | `[0.7, 58.4, -883.0]`, 17.0u from the Veridian gate `[0, 60, -900]` | Cinder Halvard and Pit Lamp escaped through that gate at t=1009.9 and t=1011.6 |

The 1.44s gap between arrival and the Hollow Reach contact matches the jump
tail: the route helm releases at the midpoint swap, and collision checks resume
1.25s later when `gate.jumping` clears.

### Cause 1 (split to #255): the arrival faces the gate

`midpointSwap` in `src/game/jump.js` places the hull 50u past the gate and calls
`shipObj.lookAt(0, 0, 0)` "to face into the new system". `Object3D.lookAt`
points +Z at its target and the nose is -Z, so the nose points back at the gate
(`fwd · toCentre = -1.000` on every measured arrival). With no helm during the
jump tail, the creep floor carries the hull about 33u back to 13-17u from the
gate centre. That is inside the 60u `JUMP.zone` where fleeing NPCs hold at
`ESCAPE.holdSpeed` and charge `JUMP.chargeTime`. A dock helm then turns about
180° in place (4-12s observed) before it can leave.

A correction of the facing alone was built and measured, then reverted:

| Census, 8 seeds x 12 legs | Legs | Near-gate resumes | Contacts at resume |
| --- | --- | --- | --- |
| Pre-fix code | 74 | 70 of 70 | 9 |
| Facing corrected | 96 | 0 | 1 |

It also makes the creep floor carry an unattended arrival toward the sun at the
system centre (about 28s). `issue-183-route-dock-test` then fails because its
idle hull pins itself against the Veridian sun. `input.fullStop` is not an
arrival hold, because it also zeroes helm thrust. The fix needs an explicit
arrival-hold design, so it moved to #255 and no facing change ships here.

### Cause 2 (fixed): hub rings were invisible to the dock planner

`ap-path.js` gives gate bodies no keep radius so route flight can use their
bores. The dock helm made only its own inbound arrival gate solid. Hub junction
rings stayed invisible, and two authored arrivals pass one:

- Redmarch from Veridian: hub `[140, 60, -720]`, on the stage chord.
- Hollow Reach from Redmarch: hub `[-80, 65, 950]`, 23u off the arrival-to-station line.

Evidence before the fix:

- Natural Rim Drifter queued browser run (`ISSUE234_ORIGIN=drifter`, queued,
  `out/issue-234/resumed-run4/natural-planner/`, capture PASS): in Hollow Reach
  the hull waited 12s about 13u from the arrival gate while turning, then hit
  the hub ring at 114.4 u/s under the dock cruise helm, 40.0 damage, two
  `impact` cancellations; docked after explicit retries.
- Census on the pre-fix code: 11 hub-ring contacts in 3 of 8 seeds (damage 9.1,
  12.5 and 26.8), in both stage and cruise, often with no traffic nearby.
- Clear-lane control: the pre-fix Redmarch leg touches the hub at 23.7 u/s and
  cancels `impact` on every seed tried (1-6).

The fix, `src/game/autopilot.js` only: the dock helm's private body bag now
makes every gate and hub ring solid, using the same `dock-gate` conversion the
inbound arrival gate already used. One exemption, found by measurement: a ring
whose keep sphere already holds the hull stays open. Making it solid put the
planner inside a keep-out and produced `blocked` cancellations in five focused
suites. It adds no export, persistent field, tuning value, key or gauge. Route
flight, traffic, collision, solar clearance, watchdog and freighter logic are
unchanged.

Two stricter variants were built and rejected. Keeping every other ring open
while the hull is still beside its arrival ring removed one census failure
(below) but broke `issue-183-route-dock-test` and `issue-172-dock-sun-test`:
the later hub detour changed the side the planner took around the sun. Keeping
entered rings solid pinned the planner in Hollow Reach (`blocked`).

### Census with the fix

Same census, same 8 seeds. The random trajectories diverge between code
versions, so this is not a paired comparison.

| Measure | Pre-fix | Fixed |
| --- | --- | --- |
| Legs flown | 74 | 88 |
| Hub-ring contacts | 11 | 0 |
| Arrival-ring contacts | 0 | 8, in 2 legs |
| Legs docked | 69 | 76 |
| Route legs that never reached the destination in 240s | 0 | 8, in seeds 1 and 3 |

The two arrival-ring legs failed after four `impact` retries each:

- Seed 1, Redmarch from Veridian. Traced: the hull sat 13u in front of the open
  arrival ring with its nose on the gate (cause 1). The now-solid Redmarch hub
  moved the stage aim to a lateral tangent in the ring plane, and the turning
  hull scraped the ring from inside, 25.4u from its centre. This depends on the
  #255 facing: with the facing corrected the hull resumes 83u out, outside the
  ring's keep sphere.
- Seed 8, Redmarch from Hollow Reach, 21s after arrival in cruise, beside a
  freighter; the Redmarch hub is about 1000u away. Not traced.

The 8 route stalls happened with the dock helm not engaged (no arrival was
recorded) and were not investigated. The pre-fix census ended 4 seeds early on
`plotRoute` refusals, so it flew fewer legs in which a stall could appear.
### Regression pin

`scripts/issue-234-hub-ring-dock-test.mjs` flies real queued routes into
Redmarch and then Hollow Reach with the starter light hull. Its one disclosed
fixture removes live traffic in the destination system. It asserts no gate
contact, no cancellation, a berth, and tube clearance measured with the
`torusOverlap` geometry.

| Leg | Pre-fix | Fixed (seeds 7, 1, 4) |
| --- | --- | --- |
| Redmarch | `impact` at 23.7 u/s, tube clearance 2.4u (contact) | docked, tube clearance 32.5-33.7u |
| Hollow Reach | not reached (the test stops at Redmarch) | docked, tube clearance 7.0u |

Stated limit: in the Hollow Reach clear lane the planner reacts to the hub at
cruise speed and the hull's turn lags its aim, so it passes 36.8u from the hub
centre, inside the 46.6u keep sphere, with 7.0u of tube clearance. Once inside,
the exemption opens that ring. Tracking lag at cruise speed is existing
behaviour for every static keep sphere and is not changed here.

### Live run on the fix

Natural Rim Drifter queued browser run on the final `autopilot.js`
(`ISSUE234_ORIGIN=drifter`, queued, `out/issue-234/final-live/natural-planner/`,
untracked). Runtime `src` SHA-256
`9cdb12140bb3b94af79f90e1b2ecd60ccae123dbf85a24774d534c63fa3501b7` was the same
at start and end. Public Agent API commands only; traffic, collision damage,
solar clearance and clocks intact. Capture PASS, 260 wall seconds; console
errors, exceptions, debugger pauses, instrumentation errors and dropped
decisions were all zero. Chrome and Vite exited and port 5236 was closed.

| Measure | Result |
| --- | --- |
| Destinations | 3 of 3 docked (Veridian, Freehold, Hollow Reach) |
| `impact` cancellations | 0 (the pre-fix run on the same setup had 2) |
| `blocked` cancellations | 1: Hollow Reach stage, 100u from the station, 10.0s stall, hunting pirate at 155u; the explicit retry docked |
| Closest approach to the Hollow Reach hub | 91.2u from its centre |

The one contact happened before the first jump. It was under the **route**
helm leaving Redmarch, against the Redmarch hub at 76.0 u/s, 0 damage. Route
flight deliberately ignores gate bodies and is not changed here; this is a
separate observation, not evidence about the dock fix. The Hollow Reach
berth screenshot was inspected. This is one natural sample, not a reliability
claim, and it does not re-fly the original trajectories.

### Verification

On the final `autopilot.js` (SHA-256 checked unchanged across the run):
`npm run build` PASS; unchanged `npm run test:boot` PASS; and PASS for
`issue-234-hub-ring-dock-test`, `issue-183-route-dock-test`,
`issue-201-arrival-dock-test`, `issue-221-freighter-dock-test`,
`dock-approach-test`, `issue-172-dock-sun-test`, all seven `issue-168` cruise,
stage, detour and exit suites, `issue-168-hold-traffic-test` in all four
`HOLD_CASE` modes, `issue-68-gate-escape-test`, `issue-182-arrival-cargo-test`,
`issue-176-two-gate-jobs-test`, and `issue-234-cruise-heading-credit-test`
with `CASE=all`. Logs are under `out/issue-234/reg5/` (untracked).

One earlier boot failure (`AP_KEEP_PAD is not defined`) came from a run that
overlapped a mid-edit state of the file; it is not a product result. The
rerun on restored code passed.

`scripts/issue-234-gate-arrival-census.mjs` is diagnosis only. It flies public
route and queued-dock legs headless with traffic intact and records arrival
pose, contacts and cancellations; `ISSUE234_TRACE_LEG` prints one leg per tick.

### Still open

- The two historical `blocked` cases and the live Hollow Reach stage `blocked`
  are traffic-associated and unreproduced as a defect.
- Arrival facing and the gate-bore exposure: #255.
- `issue-183-route-dock-test` seed fragility: #258 isolates its traffic.
- The census seed 1 arrival-ring scrape depends on #255; seed 8 is untraced.
- Route-helm hub contacts (live run, Redmarch) are outside this change.
- Issue #234 stays open.
