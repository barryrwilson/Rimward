# Issue #62 reactive defense — verification in progress

Date: 2026-09-09. Status: **source and local functional verification complete
within the recorded coverage; final evidence review pending; release blocked**.
This record does not close #62 or authorize publication.
Contract: [reactive defense design](../AgentReactiveDefenseDesign.md).

## Artifact and independent review

Runtime reviewed by independent Claude/Quinn:
`97c5ea1e04417fe43699c3079ae664a27f3938c5`, based on `906ebb4b`.
Verdict: **SOURCE PASS — NO ACTIONABLE SOURCE DEFECT**; acceptance/release
explicitly incomplete. The review assessed strict input validation, one
control owner, unchanged expiry, visible-cue identity boundaries, collision
precedence, latched withdrawal, ordinary physics and owned-burn isolation.
It did not execute the runtime or approve the live-evidence methodology.

Test follow-up `a25a554c1daef963c124fdef4f27d030bf52345b` adds
human-burn isolation coverage. `git diff 97c5ea1 HEAD -- src` is empty at this
checkpoint. Controlled live runs below recorded runtime source hash
`879dc6a3239e4180d44d1ccacc23a86185d7c2ede869f83b6d9d3e8f831816e3`.
The reviewed runtime remains frozen. Probe-methodology correction
`cdef473eef5d1f7c60aad05a14b27467be142302` and isolated-browser-window restore
`3a4551f520ea672f2e2de9c92772fb090bfbc3c7` are committed, with no runtime
changes. Later harness commit `5e5cfcff0fa82bc6e21c563f0cd2bd3c8a0adc0c`
supports optional real rendering while occluded, and probe commit
`8047445e756f1c0ab2c5218aac975c506cf0b5ae` fixes the post-grant interval marker.
Neither changes runtime source. A corrected 30-second baseline and enabled
retry now complete; the first enabled attempt ended early on target surrender
and remains recorded separately. Detailed coverage remains qualified below.
Independent review of checkpoint `9dea69e` returned SOURCE PASS and
methodology PASS conditional on distinguishing fresh episodes from continued
defense (D1). P1/P2 timing-methodology defects and T2 human-burn coverage were
closed by that review. Probe `2cacf343074cd8406696942a406559808a14d061`
implements D1/D2 classification corrections and weapon-family gating;
offline reanalysis preserves original results. Cleanup-only probe follow-up
`f2bb0d6ace26f5c6f942053d5883ee1145f1e70a` treats raw search neutralization
separately from combat cancellation. Final evidence review remains pending.
Review record:
`C:/Projects/WebSim/out/issue-62-evidence/review-final/CLAUDE-REVIEW.md`.

Local retained review and command evidence lives in
`C:/Projects/WebSim/out/issue-62-evidence/`; browser raw evidence lives in this
worktree's `out/issue-62-live/`. These are local verification artifacts, not
committed browser profiles or screenshots. The independent verdict is
`review-97c5ea1/CLAUDE-REVIEW.md`; each live directory retains `result.json`.

## Automated verification

| Check | Recorded result | Evidence |
|---|---|---|
| Reactive-defense regressions | PASS, 19 groups at both runtime review and test-only follow-up | `focused-01.log`, `focused-02.log` |
| Existing combat-intent regressions | PASS, 33 groups on unchanged runtime, rerun by coordinator | `combat-intent-final.log` |
| Full boot including agent gameplay | PASS, no update errors | `boot-01.log` |
| Agent schema and hardening | PASS | `test-agent-schema-01.log`, `test-agent-hardening-01.log` |
| Paused input and safe launch | PASS; safe launch 11 checks | `test-paused-input-01.log`, `test-safe-launch-01.log` |
| Gate escape regression | PASS | `test-gate-escape-01.log` |
| Production build | **FAIL**: unchanged byte limits exceeded | `build-01.log` |
| Production cold startup | **FAIL**: two of five exceed 8,000 ms | `production-startup-01.log` |

Focused tests cover anonymous/fore/aft cues, stale replay, no-threat and
NPC-vs-NPC exclusions, thresholds, heat hysteresis, lifecycle and human
priority, withdrawal completion, and actual ship-physics drift/burn behavior.
Independent review T1 correctly limits the focused timing assertion: it proves
timestamp pairing/ordering inside synchronous controls updates, not the
250 ms budget under real frame scheduling. T3 notes the original mode-label
fixture's speed/velocity inconsistency; that group proves branch labeling,
not a physically possible maneuver. The real `initShip` flight fixtures are
the evidence for drift/burn activation, cooldown, release and deceleration.
Review T2's additional human-origin-burn coverage is now in the test-only
follow-up; `focused-02.log` still passes all 19 groups.

## Completed controlled comparisons

These runs stage identical initial conditions for each off/evade pair, then
use ordinary NPC shots, damage, collision and movement. Setup includes private
fixture state; these are **controlled live evidence, not natural gameplay**.
During each recorded 5- or 15-second outer decision gap, only public
observation was sampled; `noOuterActions`, `delayCovered`, runtime/probe
stability and pair identity checks passed. No renewal occurred in the gap.

The successful pairs used probe hash
`168266ecfa4719e0e15ac89447e5162a1fe92a83241fe6f6b6c1c5344aa27d48`
and common harness hash
`9a820ac72fcf0ec88692e05bd6b31036076f3e51cb0f503aa5b0f23a6d7ee3b4`.
They predate the independent review's probe-methodology corrections.

| Encounter / delay | Defense | Net screen loss | Observed incoming hits | Stationary under threat | Actual player shots | Body hits | Survived |
|---|---|---:|---:|---:|---:|---:|---|
| Ahead / 5 s | off | 24 | 3 | 0.0485 s | 0 | 0 | yes |
| Ahead / 5 s | evade | 8 | 1 | 0.0560 s | 0 | 0 | yes |
| Aft / 15 s | off | 0 | 1 | 0.0560 s | 0 | 0 | yes |
| Aft / 15 s | evade | 0 | 1 | 0.0556 s | 4 | 0 | yes |

Net hull, engine and shell loss was zero in all four runs. Net screen loss
includes recharge: zero at the end does not mean no hit occurred. Stationary
means speed below 1 unit/second, holding the previous sample over each
interval. Threat means the public combat flag, selected hostile within 500
units, or a player-hit delta in the preceding sample. This is a sampled
metric, not continuous ground truth. No NPC hit is automatically credited to
the player; actual `playerFire` shots are distinct from target-hit activity.

The ahead pair had lower net screen loss with defense enabled in this one
sample. The aft pair ended with equal net condition. This does not establish
a general damage benefit. **Reduced stationary exposure is not demonstrated:**
the #61 baseline already keeps moving, and both modes spend about 0.05 seconds
stationary. The ahead enabled value is about 7.5 ms higher, within the scale
of the sampling interval; it is not a demonstrated improvement.

Both pairs report zero damage before their first reported defense episode,
which began from `nearby-threat`, using the enabled run's 55 ms observation
horizon for the baseline where a defense reaction is absent. That is an
initial threat-assessment comparison, not damage prevented after an incoming
shot. Actual hit-episode telemetry separately reports an aft hit with 8
screen loss before reaction in each enabled run.

All four completed browser results contain zero console errors/exceptions,
real incoming evidence, and stable source identities. Their post-gap explicit
clear and short-grant expiry checks completed. Short grants remained terminal
with owner none, full-stop true and later speed at or below 0.774 units/second.
This supports ordinary release/deceleration. Focused real-physics tests cover
defensive-break-off completion; the remaining relevant live coverage still
includes obstruction and natural incoming-fire response.

The coordinating agent visually inspected the ahead capture and
`aft-15-evade-01/incoming-reaction-1.png`. The aft capture shows the live
Incoming fire toast, player AFT shield indication, 30-unit/second speed,
target at 160 units, drift cooldown and ordinary game controls, with no
graphical error noted. This visual check corroborates an active rendered
encounter; a still image cannot establish reaction latency.

Raw run names: `ahead-5-off-01`, `ahead-5-evade-02`, `aft-15-off-01`,
`aft-15-evade-01`. Paired summaries are `ahead-5-comparison.json` and
`aft-15-comparison.json` under `out/issue-62-live/`.

## Reaction timing: evidence limitation and required correction

The controller reports 35.8 ms from production hit stamp to defensive control
application in the ahead setup's later aft-hit episode, and 19.4 ms for the
aft setup's hit episode. These are useful **self-reported runtime telemetry**.
Those original summary fields alone are not independent proof of the
at-most-250 ms acceptance target. The later sidecar analysis below supplies
qualified public-hit-frame corroboration from retained samples.

Independent review P1/P2 invalidates the historical probe's
`observerWallLatencyUpperBoundMs` claim. Its supposed cue and reaction
observations are the same sample, so the 50–55 ms number is just the sampler
interval, not a bound on cue-to-reaction latency. `Date.now()` was also mixed
with the monotonic timestamp base. Do not cite those fields as a latency
guarantee. P3 also identifies cue acknowledgments during `reengaging` that
were summarized as reaction latencies despite no new defensive episode.

Committed probe correction `cdef473` uses independently sampled browser
monotonic time and separately reads public `playerHit` rows. A valid production
lower bound requires a prior same-grant public sample with simulation time
strictly earlier than the new hit event's time; otherwise the result is
unbounded. Application still comes from controller telemetry, with public
throttle/speed/fire corroborating output state; the probe does not claim an
independently instrumented steering/strafe write. Warning/contact production
is not separately exposed by the public API, so those timestamps remain
self-reported. Cue acknowledgments, continued defense and defensive response
are partitioned, and sampler cadence is labeled only as cadence.

Corrected probe `8047445` has now recorded a complete 30-second baseline and
a 13.8805-second enabled attempt that ended on target surrender. In that
enabled attempt, one aft-hit episode has a corroborating public-hit-frame
upper bound of 46.9 ms from the prior strictly earlier public sample to the
sample exposing applied telemetry (controller-reported latency 29 ms). The
actual hit caused 8 screen damage before response; later zero net screen loss
reflects recharge. This supports the 250 ms target for that
observed hit, within the stated telemetry/application limitation. It does not
turn the shorter enabled attempt into a complete 30-second comparison or
prove timing for warning-only cues. Frame/sample gaps remain recorded, and
screenshots inside the gap can disturb cadence. The **250 ms target and
natural-live requirement are unchanged**; remaining coverage and final
evidence review remain pending.

## Background rendering and interval integrity

After the user explicitly asked work to continue despite desktop locking,
`5e5cfcf` added the optional Chrome launch flag
`--disable-backgrounding-occluded-windows` for this #62 probe. The shared
harness default is unchanged. Each result records its exact launch arguments.
No visibility override, artificial animation callback or simulated game clock
is introduced. Before fixture setup, the probe requires at least three actual
animation callbacks and advancing public simulation time. Visibility/focus
are recorded as context, not treated as proof of an unlocked or visually
inspected desktop. This restored actual rendering and gameplay; desktop
availability is no longer the active blocker for these runs.

The first rendering-enabled run `multiple-30-off-04` ran 30.023 seconds with
real incoming fire and no outer actions, but its Date.now-based start filter
included a pre-grant owner-none sample captured in the same millisecond as
grant acceptance. It therefore recorded `completeGap: false`. Retain it as a
measurement failure, not a completed acceptance window. Probe `8047445`
records a browser monotonic `startMarker` only after the grant receipt and
uses its exact buffer index, including ties, to select every post-marker
sample. The wait uses real monotonic elapsed time. Gap validation checks all
post-marker samples for owner/expiry; it never filters out a genuine control
release to manufacture a complete interval.

With that fix, `multiple-30-off-05` completed 30.0113 seconds, with
`noOuterActions`, `completeGap`, actual incoming evidence and source/probe
stability true, and zero browser errors/exceptions. It observed nine incoming
hits, 38.472 net screen loss, 16 shell loss, no hull/engine loss, 0.0542 seconds
stationary under the defined threat metric, and survival. The corresponding
`multiple-30-evade-01` ended truthfully with `target-surrendered` at 13.8805
seconds; it observed one hit and survived, but did not cover the requested
delay. Unequal measurement windows are not a valid 30-second damage or
stationary-exposure comparison. Its unsuccessful comparison is retained as
`multiple-30-surrender-comparison.json`; the complete retry is documented
separately below.

These runs use runtime source hash `879dc6a3…16e3`, probe hash
`2ca9a08bac145fac993261055cb5eb5468cadc17bc9afbcbabaad69a50a3fe79`
and harness hash
`c8035a387dab72cdf4b2ed9d7cc596fd12d447d3766f3f2fe6960057028ad0f0`.

## Complete 30-second multiple-threat retry

`multiple-30-evade-02` completes 30.0182 seconds with the same fixture and
probe/runtime/harness identities as baseline `multiple-30-off-05`. Both
record actual incoming fire, no outer actions, zero console errors/exceptions
and survival. The enabled retry does not replace the earlier surrender result
or turn that result into success.

| Mode | Measured delay | Incoming hits | Net screen loss | Net shell loss | Stationary under threat | Sampled distance | Body hits |
|---|---:|---:|---:|---:|---:|---:|---:|
| off | 30.0113 s | 9 | 38.4720 | 16.0000 | 0.0542 s | 2447.3419 u | 0 |
| evade, retry 02 | 30.0182 s | 12 | 28.2187 | 41.3643 | 0.0152 s | 2154.1222 u | 1 |

Hull and engine net loss are zero in both. **Enabled defense had greater
combined net shield loss and more incoming hits in this pair.** Its single
body-hit event was a ship bump at simulation time 128.5686, relative speed
about 3.149 units/second and zero damage; recent threat telemetry already
reported obstruction. This is not collision-free evidence. The short
stationary interval was lower in the enabled run, but its 39 ms difference
is comparable to the sampling interval and does not establish a general
stationary-exposure improvement. No uniform damage or survival advantage is
claimed.

Actual new hit-episode records include a 49.5 ms public-hit-frame bracket at
simulation time 123.3292; warning-only timestamps remain self-reported.
Review D1 required a finer distinction for the separate `latestCue` records:
new episodes, continuing defense and acknowledgment-only cues must not share
one reaction-latency claim. D2 required engine/obstruction blocks to remain
visible as movement-blocked outcomes. The correction and sidecar reanalysis
described below implement those distinctions; originals remain intact.

## Corrected obstruction comparison

`obstruction-5-off-01` and `obstruction-5-evade-01` use the same corrected
probe/harness and matched fixture hash. The setup adds a visible static
16-unit-radius sphere to the collision asteroid list, 60 units ahead of the
initial player; native asteroid lifecycle is not under test. Both completed
their observation-only delays (5.0126 and 5.0209 seconds respectively), with
no outer actions, source/probe stability, zero console errors/exceptions,
zero body hits, zero net condition loss and survival.

The enabled run observed incoming-fire cues and `movementBlocked: 'obstructed'`;
its incoming warning initially produced a collision-safety response with
throttle zero, before later movement resumed. These warning timestamps remain
self-reported. It traveled 316.4699 sampled units and spent 0.0507 seconds
stationary under the threat metric, versus 349.7960 units and 0.0560 seconds
in the baseline. This supports visible-obstruction precedence and moving
away without recorded collision in this fixture. It does not establish a
general stationary-exposure improvement or universal collision avoidance.

The baseline has `actualIncomingObserved: false`: no incoming hit was found
in its public event data and defense-off emits no warning telemetry. Retain
that coverage gap; absence of a public confirmation is not proof no shots
occurred. The pair is valid for the controlled obstacle/motion comparison,
not an equal-confirmed-fire damage comparison. Raw paired summary:
`out/issue-62-live/obstruction-5-comparison.json`.

The coordinator inspected the enabled incoming screenshot (rock ahead,
player about 27 units/second) and the later screenshot (rock offset, player
about 85 units/second), noting no graphical errors. This supports the rendered
geometry/movement check, not a still-image latency claim.

## Final episode classification and retained-evidence reanalysis

Probe `2cacf343` matches each cue to the unique episode's first trigger and
timestamp pair before treating it as a new defensive response. Other cues
within an active episode become `continued-defense`; `engine` and `obstructed`
remain `movement-blocked`; reengagement-only cues remain acknowledgments.
Only genuine new defensive episodes can support the new-response 250 ms
claim. Positive hit counts also require an authored weapon family;
environmental impacts and unknown families do not establish incoming fire.

Each relevant retained controlled run now has an
`analysis-episode-start.json` sidecar. Analysis probe hash
`8fbc43a40fb8b47419059b5345f104a237c7f2a034c37687bc3d2253dd1b1a60`
is recorded separately from original runtime/harness/probe hashes; original
result SHA256 is checked before and after analysis. This recomputes metrics
from public samples, with no new browser run, gameplay, injection or change
to original delay/coverage verdicts. Thus the earlier invalid observer-bound
fields stay invalid; they have not been silently overwritten.

| Enabled run | Genuine new hit-episode public-frame upper bounds |
|---|---|
| ahead-5-evade-02 | 99.7 ms |
| aft-15-evade-01 | 49.7 ms |
| multiple-30-evade-01, early surrender | 46.9 ms |
| multiple-30-evade-02, complete retry | 49.5, 47.6, 49.2, 49.3, 48.0 ms |
| obstruction-5-evade-01 | none; no hit episode to corroborate |

These observed new hit episodes fall below 250 ms with the stated
public-frame/telemetry limitation. Continued defense, blocked movement and
acknowledgments are not counted as new reactions. Warning-only source timing
remains self-reported. Pre-grant events are excluded; retained terminal
sequence values can appear after release but cannot create a new episode.
Final independent review must assess the corrected classifications and these
specific evidence claims.

## Natural API-only gameplay

`natural-30-01` used native RNG and a fresh stock Greenhand through public
Jobs/patrol/launch/navigation/target/combat actions only. Its method records
no private game-state inspection or injection. The selected Red Marlow fight
ran for 26.3719 seconds with **no outer actions** before the target's ordinary
surrender ended the combat grant. The interval contains incoming dart/fire
warnings, two positive weapon-hit events, obstruction-aware responses and
later evasion. Attacker IDs are unknown; selecting Red Marlow does not prove
that Red Marlow fired every observed shot.

The player survived, traveled 1654.2940 sampled units, spent 1.1549 seconds
stationary under the defined threat metric, and recorded zero body hits and
zero net condition loss. Net zero includes recharge and does not erase the
two hits. Browser console errors/exceptions are zero. The coordinator viewed
the natural incoming screenshot: Incoming dart, selected Red Marlow at 191
units, player speed about 24 units/second, with no graphical error noted.
That image does not identify the dart's attacker.

The observation interval is genuine natural evidence of local responses
while the outer agent is delayed until normal target completion. It is
**not a completed requested 30-second gap**: `completeGap` and `delayCovered`
are false. The overall run also retains `checksCompleted: false` because a
later raw-search cleanup assertion incorrectly assumed clearing a raw lease
zeroed throttle. That failure occurs after the recorded combat interval and
does not alter it, but it prevents an overall-run PASS claim.

Probe `f2bb0d6` corrects only that cleanup: it requests ordinary raw throttle
zero, allows the normal ramp, and records raw-search neutralization separately
from combat full-stop proof. Subsequent `natural-15-01` and `natural-15-02`
have `checksCompleted: true`, zero browser errors/exceptions and successful
cleanup, but preserve their gameplay coverage gaps:

| Attempt | Measured gap | Terminal reason | Confirmed weapon incoming | Requested delay covered |
|---|---:|---|---|---|
| natural-15-01 | 4.1533 s | target-lost | no | no |
| natural-15-02 | 8.1089 s | target-surrendered | no | no |

Attempt 01 recorded one body hit and 5.7228 net screen loss, which does not
qualify as weapon incoming. Attempt 02 recorded no body hit or net condition
loss. Neither is relabeled as a complete defensive-response run.

The assigned issue requires natural live evidence in addition to controlled
regressions; it does not require every 5/15/30-second delay to be repeated
in a natural encounter. Controlled 5/15/30 windows are complete. Final
independent review should assess the genuine 26-second natural interval
against that requirement while retaining its normal early terminal and later
cleanup failure. Fresh attempt `natural-15-03` failed before any encounter or
combat grant: initial docking timed out at simulation time 150.652, with
owner none and no recorded trial. Its `checksCompleted: false` remains an
unrelated navigation/setup failure, not additional defensive-response evidence.
No clean, full requested natural delay is claimed from these attempts.

## Known observation limitations

The implemented public-flag assessment shares `nearby-threat` with
`hostileEnter` and has no separate source field. Null attacker ID cannot
distinguish a flag assessment from an anonymous nearby event, so it cannot
prove an incoming shot or a separately captured production event (review C1).
The actual `modeBlocked` values are recorded in the design; capability
discovery exposes phases and tuning, but does not enumerate that vocabulary
(C2). These are documented limitations, not claims of completed discovery.

The second review explicitly leaves C1/C2 unfixed and calls the design
reconciliation an owner decision (D5). The coordinator records them as
nonblocking metadata refinements within the assigned issue's outcome and
the design's allowance to tighten telemetry names; the assigned issue takes
precedence over this implementation brief. This record does not claim
separate owner approval or that C1/C2 were technically fixed. The 250 ms
target, valid unidentified-hit response, one-owner/cancellation rules,
natural-live requirement and production gates are unchanged.

## Failed attempts and pending coverage

The first `ahead-5-evade-01` attempt timed out waiting for a public target aim
while simulation remained at time 120; no measurement window completed. The
later `multiple-30-off-01` attempt ended with CDP unavailable during
`Runtime.evaluate`; it has `checksCompleted: false` and no completed delay.
Keep both results as failed verification attempts; neither is a gameplay pass
or evidence of a successful 30-second gap.

Corrected-probe attempts `multiple-30-off-02` and `multiple-30-off-03` stopped
before fixture setup. Both recorded a focused document with
`visibility: 'hidden'`, zero animation frames and simulation time zero. The
third attempt restored its own Chrome window to normal 1280 × 800 bounds,
confirmed those bounds, and still failed the foreground/frame check. Runtime
source remained stable. These were browser/session availability failures,
not completed measurements or evidence of a gameplay failure. Subsequent
user-authorized background rendering restored real frame cadence as recorded
above; the task is no longer waiting for the desktop to be unlocked.

Still required: final independent assessment of corrected evidence
classifications, qualified wall-latency claims and the natural observation
interval. Synthetic tests do not replace the recorded live coverage and its
limits. The failed pre-encounter natural attempt adds no combat evidence.

## Production release blockers

`npm run build` fails with 1,821,216 minified JavaScript bytes against
1,800,000 (+21,216), and 543,822 gzip bytes against 537,600 (+6,222).
The #61 exception is an exact older artifact allowance and does not match
this candidate. No budget or exception was changed by this verification.

Diagnostic production cold starts were 7,563.0, 8,437.2, 7,237.2, 8,687.3 and
7,225.6 ms. Median 7,563.0 ms; maximum 8,687.3 ms. The five-run requirement
fails because every sample must meet 8,000 ms. These diagnostic measurements
do not convert the failed production build into a pass. Byte and startup
gates remain blocked; no release exception is granted in this report.

Next gate: independently assess the corrected live evidence, resolve the measured
production blockers through an authorized decision, then update this report
against the final immutable artifact. Backlog completion, merge and deployment
remain separate and unperformed.
