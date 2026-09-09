# Issue #62 reactive defense — verification in progress

Date: 2026-09-09. Status: **SOURCE, PROBE METHODOLOGY and FUNCTIONAL ACCEPTANCE
PASS; exact owner exceptions approved; build/bundle/artifact verification PASS;
final policy review pending**.
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
separately from combat cancellation.
Review record:
`C:/Projects/WebSim/out/issue-62-evidence/review-final/CLAUDE-REVIEW.md`.

Completion review of `030c24665d9962fd146f6ccbb649ffd945aee525` returned
**SOURCE PASS and METHODOLOGY PASS**, closing D1/D2/D3. It accepts the
26.3719-second natural interval as satisfying the issue's natural-evidence
criterion, while leaving G1: no retained natural run is both clean end to end
and contains confirmed weapon incoming with a defensive response. A complete
30-second natural window is not required to close that gap. Review record:
`C:/Projects/WebSim/out/issue-62-evidence/review-completion/CLAUDE-REVIEW.md`.

The latest tested probe commit is
`b14e542efd2c34eb3e9b0bf87ceae50e371b2bf9`, probe SHA256
`a23e73e4722bc932faeaf3b339c555fe60007b5528d35b754f921edc22cb8986`.
It obtains the clean G1 run documented below. Runtime source remains the
reviewed `97c5ea1` content and source hash `879dc6a3…16e3`; shared live
harness identity remains `c8035a38…ad0f0`. Focused independent review of
`30c0b28090776a66554574c8ed3cd4ab29bc1ba4` returned **SOURCE PASS, PROBE
METHODOLOGY PASS and FUNCTIONAL ACCEPTANCE PASS — G1 CLOSED**. Its F1–F5
findings are nonblocking report-precision corrections incorporated here.
Review record:
`C:/Projects/WebSim/out/issue-62-evidence/review-g1/CLAUDE-REVIEW.md`.
That functional review did not approve or activate a production exception.
The owner subsequently approved the exact #62 byte and startup exceptions
and opening the pull request. Descriptor activation `f09a84cf` and actual
post-activation verification are recorded at the end of this report and in
the [release exception note](../releases/issue-62-measured-exception.md).
Final independent policy review remains pending; merge/deployment are separate.

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
| Original production build | Historical **FAIL**: unchanged byte limits exceeded | `build-01.log` |
| Approved production build and bundle report | **PASS** through the exact owner-approved #62 byte exception; raw byte flags remain false | `approved-build-01.log`, `approved-bundle-report-01.log` |
| Complete emitted artifact/runtime equivalence | **PASS**, all 447 files and canonical manifest/runtime hashes match | `approved-artifact-verification-01.json` |
| Production cold startup | Historical raw **FAIL**, two of five exceed 8,000 ms; separately owner-approved exact startup exception | `production-startup-01.log`, release exception note |

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
natural-live requirement are unchanged**; G1 is now closed by the focused
review below. Subsequent owner-approved production exceptions and verification
are recorded separately; final policy review remains pending.

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

Hash scopes differ: sidecar `original.sharedHarnessHash` is the live harness's
composite hash over three tool files, while `analysisSharedHarnessHash` is the
plain SHA256 of `scripts/issue-61-live-harness.mjs` alone. Their different
values do not imply harness drift; compare hashes only within matching scopes.

| Enabled run | Corroborated genuine new defensive-response hit-episode public-frame upper bounds |
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
The table intentionally covers defensive-response episodes. A separate
genuine new hit episode in `multiple-30-evade-02` was movement-blocked by
obstruction, with a 104.2 ms corroborated upper bound; it is not a
defensive-response 250 ms demonstration. Completion review accepted the
corrected methodology and these scoped classifications.

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

`natural-30-01/analysis-episode-start.json` uses the later analysis probe hash
`ca5701ec5bad6e4e04a0543d85cdf7a7cce16eec731e15806ea4a7ca160cd60a`
from the cleanup-corrected probe, separately from the controlled sidecars.
It preserves original result SHA256
`a2cc2f60d3b728eca936e48aa5351dad8efe1163451a9d88dfd20a4934793604`.
That sidecar corroborates a 56 ms public-hit-frame bound for a real missile
hit (22 damage, fore direction, attacker ID null), whose recorded response
was `obstructed`, throttle zero and fire false. This supports unidentified-hit
handling and an explicit movement-block reason. The cue did not begin a new
defensive-response episode and its corroboration flag is false: **this is
not a natural defensive-response 250 ms demonstration** (G2). The natural
interval has no corroborated new defensive-response hit bracket; controlled
live evidence supplies that timing evidence, as permitted by the issue.

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
in a natural encounter. Controlled 5/15/30 windows are complete. Completion
review accepts the genuine 26-second interval for that natural criterion
while retaining its normal early terminal and later cleanup failure. G1
at that review required a clean end-to-end natural run with confirmed incoming and a
defensive response; neither a new benchmark nor a 30-second duration is
required. Fresh attempt `natural-15-03` failed before any encounter or
combat grant: initial docking timed out at simulation time 150.652, with
owner none and no recorded trial. Its `checksCompleted: false` remains an
unrelated navigation/setup failure, not additional defensive-response evidence.
No clean, full requested natural delay is claimed from those initial attempts.

## Clean natural G1 follow-up

`natural-30-g1-wren-07` is a clean end-to-end natural run on `b14e542e`:
process exit zero, `checksCompleted: true`, `delayCovered: true`,
`actualIncomingObserved: true`, empty coverage gaps and zero console
errors/exceptions. Its observation-only gap is **30.0226 seconds** from
`trial.observedWallSeconds` on the browser's monotonic clock; the separate
`metrics.wallSeconds: 30.029` includes the primer sample and is not used as
the authorized gap duration. Actions remain 20 → 20 with `noOuterActions`
true, and every post-marker sample retains live combat authorization.

The bounded setup uses public Jobs, patrol, launch and an existing outbound
route, then at most ten seconds of ordinary, **non-firing** public alignment
before the grant. It checks `station.range - target.range > 350` at selection
and immediately before authorization: this public triangle-inequality lower
bound puts both ships beyond the 300-unit station law zone with a 50-unit
margin. The successful pre-grant bound is 519.9802 units. No station-law flag
or hidden NPC state is changed. The final probe removes the intermediate
two-second firing initiation used in earlier attempts; no initiation command
is inserted into this run's measured window.

An optional `--bounty-target` selects only an exact currently offered public
bounty and then waits for the matching public contact. The Wren run selected
the offered Gallows Wren bounty through that option; omission preserves the
probe's default selection behavior. These are probe setup refinements only,
with no runtime changes, hidden-state inspection or fixture injection.

The player survives, travels 2024.1097 sampled units, has zero sampled
stationary time under the defined threat metric, records zero body hits,
fires 14 actual shots and receives two confirmed weapon hits. Net screen
loss is 24.8713; hull, shell and engine net loss are zero. This one run does
not establish a damage advantage or guaranteed collision avoidance.
The marker starts with setup-carried momentum: speed 68.5065 units/second
and public throttle setpoint 0.42785. These distance/stationary aggregates
are not a start-from-rest test or an isolated effect-size estimate. All cue,
ownership and no-outer-action evidence remains post-grant.

New incoming-dart and incoming-fire episodes initially report obstruction.
Across both incoming episodes, including their start rows, controller
telemetry reports `strafe` in seven noncontiguous samples (four stretches of
1 + 3 + 2 + 1 samples), `clearance` 40 times and `reengaging` 107 times,
without another outer action. The maneuver claim rests on that controller
telemetry plus retained public speed and position, not independently observed
strafe input writes. Public `ship.throttle` is the player setpoint and does
not independently confirm the lease's requested throttle. These records
support both explicit blocked movement and later local defensive movement
within that evidence limit. Its two anonymous hit cues are aft with a 46.5 ms
public-hit-frame bound and fore with a 46.8 ms bound. Both are **non-new-episode
movement-blocked responses**, with new-response corroboration false. They
do not supply a new natural defensive-maneuver 250 ms demonstration. Warning
source timing remains self-reported; the controlled genuine new-episode
timing evidence remains the basis for that quantified criterion.

The coordinator inspected `incoming-reaction-1.png`: Incoming dart, player
about 69 units/second, selected Wren about 24 units away and gate about 284
units away. Wren is bargaining in the hail view. The warnings and hits have
unknown attacker IDs and must not be attributed to Wren merely because Wren
is selected; another NPC may be firing. No graphical error was noted.

Post-window lifecycle checks clear **active combat** to owner none, throttle
zero and fire false, then observe a one-second grant expire with a stable
terminal result. These checks are separate from earlier raw-search cleanup.
Runtime/probe/harness identities remain stable; the browser and Vite process
exit, their ports close and the temporary profile is deleted. This provides
the clean G1 evidence accepted by focused independent review. The subsequent
production exception decision does not change this gameplay evidence.

All seven follow-up attempts are retained below. Durations are the exact
`trial.observedWallSeconds`, rounded to four decimals, not metrics sample-span
times. An overall-clean run without incoming remains a coverage gap.

| Run directory under `out/issue-62-live/` | Probe commit / SHA256 prefix | Monotonic gap | `checksCompleted` | Weapon incoming | Outcome / coverage |
|---|---|---:|---|---|---|
| natural-5-g1-01 | fd72b3cb / 91d9ac87dd90 | no trial | false | unobserved | Bounded public search found no eligible pirate; setup failed |
| natural-5-g1-02 | fb40084f / 5f5f20cd4d30 | 5.0293 s | true | no | Complete 5 s gap, but no confirmed incoming or defense response |
| natural-30-g1-03 | fb40084f / 5f5f20cd4d30 | 2.6310 s | true | no | Early target-disabled terminal; no full 30 s gap |
| natural-15-g1-04 | 0feba5d8 / 8b41fef7b92d | 15.0280 s | true | no | Complete 15 s gap, nearby-threat only; incoming coverage absent |
| natural-30-g1-05 | 0feba5d8 / 8b41fef7b92d | 23.3190 s | true | no | Early target surrender; no full 30 s gap |
| natural-30-g1-carver-06 | b14e542e / a23e73e4722b | 6.3118 s | true | no | Early target surrender; no full 30 s gap |
| natural-30-g1-wren-07 | b14e542e / a23e73e4722b | 30.0226 s | true | yes | Complete observation-only gap and clean lifecycle/teardown; G1 closed |

The commit/hash columns come from each result's `identityStart.commit` and
`probeHashStart`; full values remain in `result.json`. Attempts 02 and 03 ran
the intermediate `fb40084f` probe, which included the temporary two-second
firing initiation. They are not runs of the final `b14e542e` probe. Attempts
04–07 use the later setup after that initiation was removed.

Each directory retains `result.json`; corresponding command logs are in
`C:/Projects/WebSim/out/issue-62-evidence/` under the run name. Earlier failed,
shortened and no-incoming attempts have not been replaced or promoted.

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

Functional acceptance is now PASS and G1 is closed by focused independent
review on `30c0b280`. All failed, incomplete and no-incoming attempts remain
recorded with their original flags and coverage limits; none was promoted.

## Approved production exceptions and verification

The original `npm run build` failed with 1,821,216 minified JavaScript bytes against
1,800,000 (+21,216), and 543,822 gzip bytes against 537,600 (+6,222).
The #61 exception is an exact older artifact allowance and does not match
this candidate. Those measurements and that failed run remain historical.
The owner explicitly approved this exact #62 byte exception and its separate
startup exception on 2026-09-09, plus opening the pull request. Activation
`f09a84cf28989bfc78bca3361099b7f626159858` changes only the approved build-side
descriptor and release note, not runtime, matcher logic or global limits.

Diagnostic production cold starts were 7,563.0, 8,437.2, 7,237.2, 8,687.3 and
7,225.6 ms. Median 7,563.0 ms; maximum 8,687.3 ms. The five-run requirement
failed because every sample must meet 8,000 ms. These original samples stay
raw FAIL; the owner approved that measured result for this exact candidate.
No sample is relabeled and no new startup threshold or fresh startup PASS is
claimed. The startup exception is separate from the byte matcher.

After activation the coordinator ran `npm run build` and
`npm run bundle:report -- --json`; both PASS. Bundle `bytePolicy.pass` is true
through the exact #62 approval reference while raw `minifiedPass` and
`gzipPass` remain false. The emitted single JavaScript chunk is
`assets/index-BWMahgBB.js`, SHA256
`5dfbb91fe97de176b5bba052f21e9a5e885d9e4c5ed4b431a927eebfea5f4831`,
with exactly 1,821,216 minified and 543,822 gzip bytes. The unconditional
browser dependency boundary PASS contains only `three`.

`approved-artifact-verification-01.json` records PASS for every one of the
447 emitted files against the approved candidate, with no missing, extra or
mismatched files and no extra directories. Canonical manifest SHA256 is
`40c42c610d295ab2679c3ec8c69d58eb6b20f839b0b3c4b365635c781f5329d0`.
Runtime source hash `879dc6a3…16e3` matches before and after on `f09a84cf`.
The executed `verify-approved.mjs` SHA256 is
`0f45ff4f0ce78399f4ce531e3ac487c4ed32c6994845341b9d556e320ea335ee`.
Raw command evidence is `approved-build-01.log` and
`approved-bundle-report-01.log` in the retained root evidence directory.

Next gate: final independent review of this exact policy activation and
documentation evidence, including the F1–F5 corrections at `95023918`.
The exceptions and actual verification now pass within their approved scope;
this report does not declare the final policy review passed or the release
fully ready. The owner authorized opening the PR. Issue closure, merge and
deployment remain separate and unperformed.
