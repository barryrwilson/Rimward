# Issue #62 reactive defense — verification in progress

Date: 2026-09-09. Status: **implementation in review; acceptance incomplete;
release blocked**. This record does not close #62 or authorize publication.
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
changes. No completed live run exists at either corrected-probe artifact at
this checkpoint.

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
They are not yet independent proof of the at-most-250 ms acceptance target.

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

The corrected methodology is committed but **not yet verified by a completed
live run**. Frame/sample gaps remain recorded, and screenshots taken during a
gap can disturb frame cadence. The **250 ms target and natural-live requirement
are unchanged**. Corrected live evidence and final evidence review remain
pending; committing the probe does not establish acceptance.

## Known observation limitations

The implemented public-flag assessment shares `nearby-threat` with
`hostileEnter` and has no separate source field. Null attacker ID cannot
distinguish a flag assessment from an anonymous nearby event, so it cannot
prove an incoming shot or a separately captured production event (review C1).
The actual `modeBlocked` values are recorded in the design; capability
discovery exposes phases and tuning, but does not enumerate that vocabulary
(C2). These are documented limitations, not claims of completed discovery.

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
source remained stable. These are an unresolved browser/session availability
blocker, not completed measurements or evidence of a gameplay failure. The
coordinator requested that the user unlock/reconnect the session; no response
or restored frame cadence is recorded at this checkpoint.

Still required: completed 30-second multiple-threat comparison; controlled
obstruction coverage; natural API-only
encounters with real incoming warnings/hits and delayed outer decisions;
corrected independently qualified wall-latency evidence; final evidence
review. Synthetic 5/15/30-second focused tests do not close these live gaps.

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

Next gate: complete corrected live evidence and review, resolve the measured
production blockers through an authorized decision, then update this report
against the final immutable artifact. Backlog completion, merge and deployment
remain separate and unperformed.
