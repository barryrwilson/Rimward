# Reactive defense during agent decisions — issue #62

Source: [PIR-09](https://github.com/barryrwilson/Rimward/issues/62).
This extends [the #61 combat contract](AgentCombatIntentDesign.md), against
master `906ebb4b`. It is an implementation handoff, not a verification result.

## Outcome and discovered boundary

An explicitly authorized combat pilot responds to incoming fire at game rate
while the external agent is deciding. A hit from behind or an unidentified
attacker must not leave the ship waiting for an external command. Reaction
means an ordinary defensive movement request or a precise reason movement
cannot safely proceed; it does not promise survival or a win.

`controls.js` already owns one session, shared between raw input leases and
target-specific combat. `agent-combat.js` returns normalized controls through
that owner. Its attack, close-pass, obstacle and withdrawal policies already
use normal ship physics. Authorization ends at the earlier simulation or
monotonic wall deadline. Human takeover and lifecycle cancellation already
neutralize combat. Preserve these contracts.

The current `playerHit` event exposes damage, family, fore/aft and shielded
state but **no attacker ID**. `npcFireToast` classifies the actual player-facing
incoming cannon, turret and missile warnings; it is not a projectile tracker
and has no forward-view requirement. HUD `hostileEnter` and the public combat
flag communicate nearby hostility. The selected target's fresh HUD aim sample
provides a bearing. No private NPC plan, projectile position, concealed ship
identity or off-sensor attacker position is needed.

## Authorization and API

Extend the existing command with one optional argument:

```js
rimward.act({ v: 2, name: 'setCombatIntent', args: {
  seq: 22, ttl: 45, targetId: 'rec-10', intent: 'engage',
  defense: 'evade' // 'evade' | 'break-off' | 'off'
}});
```

Omission means `evade`. This deliberately changes the default behavior of an
explicit combat grant: it now includes local defensive response. `off` retains
the #61 policy and permits paired verification. Invalid defense values refuse
atomically without changing inputs, the prior grant or sequence. Publish the
argument/default in capability discovery and API documentation.

The existing required target, intent, sequence and 1–60 second TTL rules
remain. This issue does not add a targetless defense command, another helm,
automatic target acquisition, assistance during manual flight, a saved stance,
keys, gauges, equipment or an LLM in the browser. A valid hit can trigger
defense without identifying its attacker; the combat grant still belongs to
its original selected target and ends on that target's existing terminal
conditions. It never switches to the attacker.

`controls.js` remains the only agent input owner. Defense is a phase inside
`lease.combat`; observation continues to report `owner: 'combat'`. It cannot
extend either deadline. Only a complete, newer accepted combat command renews
authorization. Same-target/intent/weapon/stance renewal preserves maneuver
memory. Changing stance deliberately starts new tactical memory, while
remaining an atomic replacement through the same owner.

## Observable cues and reaction budget

Consume newly produced cues once, using the existing early-system
`lastEvents` handoff (controls precedes combat/HUD). Do not re-read the agent's
retained event ring as though old hits were new. Ignore cues predating a fresh
grant. Clear all defensive memory on cancellation or a new session.

Eligible cues, in descending priority when several arrive together:

1. Positive finite `playerHit.damage` from a weapon family, including shield
   hits. `impact` is excluded: current impact packets originate in collision
   or environmental damage, and no current weapon uses that family. The
   existing obstacle policy handles those hazards. Unknown attacker remains
   `null`; `fromAft` supplies only `aft` or `fore`, never an invented bearing.
2. An actual player-facing incoming-fire/dart warning, classified using the
   same weapon/target rules as `npcFireToast`. Use independent local cooldown
   memory; never mutate the HUD's toast memory. NPC-vs-NPC fire and unknown
   weapon/target combinations must not become threat cues. A missing cannon
   target retains the existing ace warning semantics. Warning identity is
   nullable: the warning alone does not reveal its emitter's ID or position.
3. A new HUD `hostileEnter` or rising public combat flag. This prompts one
   initial defensive assessment. A continuously true combat flag must not
   retrigger weaving. Seed this state from the current public flag on grant
   so already nearby active threats receive an initial assessment.

Only attach an attacker/contact ID or precise bearing when already available
through the player-visible, fresh selected-target sample or public contact
cue. Do not attach `npcFire.ship.id` merely because the internal event carries
it. In particular, an incoming warning from an offscreen ship can remain
`attackerId: null, direction: 'unknown'` and still trigger lateral evasion.

Target reaction is **at most 250 ms wall time from a qualifying visible cue
to the first applied defensive controls**, while simulation is running and
authorization is valid. Record both cue and applied-input timestamps in live
verification. At normal frame rates this should occur on the next controls
tick; the clamped simulation `dt` is not proof of wall latency. A suspended
tab, explicitly paused game or renderer stall cannot guarantee that bound:
measure/report the actual latency and the runtime cause. No polling interval
or outer-agent reply is part of the reaction path.

For a measurable clock contract, stamp eligible events at production with
`performance.now()` milliseconds (a primitive session-only event field, not a
new event type). Carry the chosen cue's timestamp into defense observation as
`cueWallMs`; stamp `appliedWallMs` in controls only when the selected defensive
inputs are actually assigned to `ctx.input`. A public combat-flag assessment
without an event uses the controls tick's detection time. In the reviewed
implementation, it shares `trigger: 'nearby-threat'` with `hostileEnter` and
has no separate source field. A null-ID nearby cue therefore cannot establish
whether the source was the public flag or an anonymous event; exclude such
rows from claims about independently observed incoming fire. This is an
observation limitation, not evidence of a shot. Retained event cue time must not be replaced with consumption
time: that would hide a blocked frame. Repeated cues may update last-cue
telemetry, but preserve the episode's first cue/applied pair. The probe should
also capture the actual production event independently and calculate
`appliedWallMs - cueWallMs`; simulation timestamps remain useful for phase
durations but cannot prove this latency target.

## Policy, precedence and completion

The following order is evaluated every applied tick:

1. Human takeover, expired authorization, explicit clear, opt-out and existing
   lifecycle/target/weapon terminal gates cancel before defense can act.
2. Immediate visible body/selected-hull collision clearance wins over the
   proposed defensive movement, suppresses fire and reports `obstructed`.
3. A latched withdrawal owns the remainder of that grant until it completes
   or cancels. Fresh hits cannot turn it back into engagement.
4. A current defensive episode may replace attack movement and fire.
5. Otherwise the existing #61 combat policy runs.

Stance `off` bypasses this additional policy. For `evade`, use ordinary yaw,
pitch, lateral thrust and throttle to interrupt an exposed approach or low
speed wait. Maintain a stable escape side within an episode; repeated bursts
and simultaneous threats update the last cue without flipping direction every
frame. Fore/aft cues support a broad lateral break, not an exact trajectory
away from an unknown attacker. Where the selected visible target is a useful
reference, reuse its bearing and existing turn-away/close-pass calculations.
Do not aim at, fire on or pursue a newly inferred attacker.

An evasive episode suppresses fire, lasts at least one second, and may return
to the original attack after 0.75 seconds without a fresh cue. Cap the episode
at three seconds, then allow one second of the ordinary moving interception
policy before another warning-led episode. Continue to record fresh cues in
that interval, retain immediate collision priority, and allow a new hit or
critical condition to interrupt it. This hysteresis prevents stationary
waits, cue-driven left/right oscillation and permanent warning-only evasion.
The observation must distinguish `evading` from `reengaging`; an already
moving reaction does not need to restart its maneuver on every burst.

Use session-independent tuning constants in `state.js`, not saved fields.
Initial conservative limits are hull at or below 40%, engine integrity at or
below 30% or `engineOut`, or combined remaining screen plus shell at or below
10% of their combined maximum. On a qualifying threat, any such condition latches defensive
break-off. Stance `break-off` latches it on the first qualifying cue regardless
of condition. Handle absent/invalid denominators safely; never divide by zero
or claim healthy condition from invalid values. Heat at or above 90% or
overheated suppresses firing and favors evasion; reengagement resumes only
below 75% and when the ordinary weapon heat gate also permits firing. Heat
alone does not create a permanent withdrawal. State these tuning choices in
capabilities/design rather than adding a configuration UI.

Break-off uses the existing selected-target withdrawal and visible obstruction
checks. Preserve the requested intent in observation and latch an effective
defensive withdrawal phase. It never fires, never automatically resumes
`engage`/`disable`, and cannot be defeated by subsequent warnings. Explicit
`break-off`/`retreat` intents retain their existing completion criteria;
defense may help movement but cannot reset their separation timers on every
hit or switch them back to attack. Obstruction may invalidate safe separation
in the existing way.

Successful defensive break-off reports `disengaged`, releases ownership and
requests the existing ordinary full stop. Velocity decelerates through ship
physics, and the full-stop hold remains after completion; a later cue cannot
restart movement. This fulfills the PIR-02 stable-completion outcome without
inventing automatic docking. A later explicit docking/AP command or human
input is a separate handoff. Target loss, expiry or cancellation also retains
the existing full-stop release and truthful terminal reason. Completion says
the bounded maneuver ended, never that every surrounding threat is gone.

Use normal thrust/strafe limits and engine derating. Defense may additionally
request the existing drift hold or afterburner edge under the following
conditions; ship.js remains the owner of their duration, power and cooldown:

- **Drift:** at most one hold of 0.35 seconds per episode, only while already
  moving at or above ordinary creep speed on a clear escape velocity. With a
  known selected-target reference, own velocity must already increase
  separation; an unidentified fore/aft hit alone does not establish a safe
  escape velocity. The current-velocity swept corridor must clear visible
  bodies and the selected hull for hold duration plus the configured 0.8s
  realignment and normal stopping distance. The whole tested corridor must
  fit within the available public sensing envelope. Do not use drift from
  rest, toward a hazard, during burner activation, before cooldown or when
  either authorization clock cannot cover hold plus realignment. Release
  immediately on episode end, obstruction, withdrawal completion or cancel.
  Normal drift release rotates velocity through its realignment interval;
  include that curved transition conservatively in clearance, not only the
  initial straight segment. If a safe transition cannot be established,
  suppress drift and retain ordinary strafe/turn movement.
- **Afterburner:** at most one edge and 0.5 seconds of agent-owned burn per
  episode (also bounded by the ordinary ship burn duration), during latched withdrawal
  when the nose and current velocity are aligned with increasing separation
  from the selected visible target. Do not burn while turning across the
  target, drifting, engine-out, overheated, below the ordinary power minimum,
  before cooldown, or with inadequate remaining authorization. Both clocks
  must cover that bounded burst duration plus normal stopping time. Check a
  swept forward corridor using boosted speed and normal stopping distance;
  if it exceeds observable clearance or intersects a body/hull, suppress the
  edge. Recheck visible clearance every tick; obstruction wins, releases the
  owned burn and requests normal full stop. This is a one-frame
  `input.afterburnerPressed` request through controls, accompanied by the
  session-only `input.agentBurnerHeld` ownership hold, not a held Space flag.

Acquisition still refuses pre-existing human burner/drift modes. Track a
session-only accepted/requested activation marker inside the same combat
grant so renewal of the same target/intent/weapon/stance does not refuse its
own active mode. A different grant or mode replacement does not inherit that
exception. Physical input still cancels first and keeps the human's new input;
no private mode owner may fight it. Clear pending burner edges and drift hold
on every terminal path, and preserve ordinary full-stop on autonomous release.

Current burner has no normal mid-burn cancellation input, so this slice adds
the minimal transient ownership hold to the input contract in `ctx.js`.
`ship.js` privately tags a burn as agent-owned only when it successfully
starts through the ordinary power/cooldown gate with both the burner edge and
`agentBurnerHeld` true. Releasing the token ends only that owned burn and
applies normal cooldown. Human-origin burns keep their existing six-second
duration/power rules. Only controls writes the hold; neither the public action
schema nor raw leases can set it. Human takeover clears it before applying a
new physical Space edge. This gives cancellation, expiry and obstruction a
normal input path to relinquish owned boost without touching ship mode state
from the controller. Test that stale holds cannot relaunch a burn or cancel
full stop. Drift release completes normal realignment before stopping; it is
not an instant velocity reset. No direct mode, pose or velocity writes, damage changes, ammo
grants or immunity are authorized. Observation reports maneuver choice and
the implemented `modeBlocked` vocabulary: empty string, `engine`,
`obstructed`, `duration`, `speed`, `alignment`, `authorization`, `burner`,
`cooldown`, `clearance`, `heat`, `power`, or `drift`. `speed` covers insufficient
speed; `alignment` includes unsafe velocity direction; `authorization` means
insufficient remaining grant time. Capability discovery currently publishes
defensive phases and thresholds, but does not enumerate these mode-block
tokens. This document records the exact vocabulary; discovery of that set is
a known limitation of the reviewed implementation.

An obstructed or severely damaged ship may move poorly; record the specific
movement block/condition instead of claiming a successful escape.

Docked/berth-held/paused/dead/blocked-overlay states cannot acquire or continue
this mode. Docked or held threat cues must never launch the ship. Physical
input cancels synchronously; held physical controls refuse reacquisition.
Focus loss alone continues combat as in #61, subject to wall expiry. Incoming
hail cards retain authorization; deliberate hail handback remains unchanged.
With no fresh threat, do not add a weave to the existing combat policy.

## Observation

Extend `control.combat` with the configured stance and a small JSON-safe
defense block, retained with the last terminal combat result:

```js
defense: {
  stance: 'evade',
  phase: 'idle', // idle | evading | reengaging | break-off | completed
  trigger: null, // hit | incoming-fire | incoming-dart | nearby-threat
  attackerId: null,
  direction: null, // fore | aft | unknown; optional visible bearing separately
  triggeredAt: null, reactedAt: null, // simulation timestamps; probe wall latency separately
  cueWallMs: null, appliedWallMs: null, // monotonic milliseconds, first episode reaction
  maneuver: null, // strafe | drift | burn | withdrawal | clearance | stopped, or ordinary phase
  modeBlocked: '', // reason an otherwise useful drift/burner request is suppressed
  reason: '', // e.g. hull, engine, defenses, stance, heat, obstructed
  completedAt: null
}
```

Implementation refinement: the initial 1.5-second boost proposal could not
fit the stock light ship's boosted travel and stopping bound inside its
600-unit sensing envelope. The configured burst is 0.5 seconds. The focused
physics test must demonstrate an actual activation with the stock ship's
unmodified speed, power and acceleration, as well as the refusal cases.

`latestCue` separately reports the most recently consumed cue's `trigger`,
`direction`, nullable `attackerId`, simulation `t`, source `cueWallMs`,
`appliedWallMs`, and `response`. The first episode's trigger and timestamps
remain paired; a later hit must not inherit an earlier nearby-threat timestamp.
Repeated incoming cues can be acknowledged while the existing maneuver
continues, with its actual response or movement block reported. A finite
`latestCue.appliedWallMs` acknowledges the next applied controls tick; it does
not by itself prove a new defensive episode began. In particular,
`response: 'reengaging'` must not be counted as a fresh reaction. Verification
must distinguish episode starts, continued defense, blocked movement and cue
acknowledgments.

Names may be tightened during implementation while preserving these facts.
Do not overwrite the primary trigger with a lower-priority simultaneous cue.
`control.reason` remains the authoritative terminal reason. During a defense
episode `fireBlocked` truthfully reports defense/heat/obstruction; `fire`
continues to describe requested output, not actual shot credit. A transition
to `completed` records whether the episode reengaged or the grant ended;
terminal observation must remain stable after observation, stale commands and
new world warnings. Use existing observation rather than expanding the frozen
event vocabulary merely to duplicate this state.

## Verification and release gate

Rex owns implementation; Quinn independently verifies the immutable artifact.
Required regression cases use real control/API dispatch where relevant:

- Strict stance validation/default/discovery; sequence and dual-clock expiry;
  no mutation on malformed/stale/refused requests; no implicit renewal.
- Fore/aft hits, offscreen/unidentified warning, missing hit attacker ID,
  simultaneous threats and repeated bursts. Assert bounded reaction, stable
  episode side, cue age/deduplication and no hidden identity in observation.
- Visible station/gate/asteroid/sun and selected-hull collision corridor:
  clearance overrides evasion, fire stays off and obstruction is observable.
- Each hull/engine/defense threshold, heat hysteresis, configured break-off,
  explicit retreat and break-off, stable full-stop completion and no restart
  from later cues. Use normal velocity decay rather than asserting teleport.
- Conditional ordinary drift/burner activation and suppression, power drain,
  cooldown, pulse/hold bounds, same-grant renewal during owned activation,
  refusal during human-owned modes, velocity/clearance guards and insufficient
  remaining authorization. Cancel/expiry/completion during each mode must
  release holds/edges, apply ordinary owned-burn cooldown, settle through
  normal realignment/deceleration and retain full stop. Human burns must not
  be cancelled by a false agent hold.
- No threat, NPC-vs-NPC fire, environmental impact, manual lease/manual input,
  docked/held/no-launch, pause/death/jump/overlay, cancel, focus continuity and
  wall expiry after suspension. A hit must not revive a terminated grant.
- External decision delays of **5, 15 and 30 seconds** without intermediate
  renewals or commands. Use adequate explicit TTL so authorization expiry is
  tested separately from response latency.

Run paired controlled scenarios from identical seed/ship/kit/position/target
and delay, `defense: 'off'` versus enabled. Preserve actual cue/applied-control
wall timestamps, damage before first reaction, total player damage, time at
low speed under fire (define the speed threshold in the result), collisions,
survival, requested movement and actual movement. Where baseline has no
defensive reaction, use the enabled run's reaction horizon for the paired
damage comparison and label baseline reaction absent; do not substitute the
external reply time. Report every pair, including failures or worse outcomes.
Reduced stationary exposure is the primary comparison; no guaranteed win or
universal damage reduction is claimed from a small sample.

Also run natural live API-only gameplay: establish a normal encounter through
the API, authorize combat, then deliberately delay the outer agent while
recording actual incoming warnings/hits and motion. Separate controlled fixture
evidence from natural gameplay; synthetic injection alone does not satisfy
this gate. Inspect the live browser and console errors. Record exact commit,
seed/setup, delays, timestamps, results and limitations in the playtest record.

`npm run build`, `npm run test:boot`, relevant existing control/combat checks
and the new focused regressions must pass. The #61 exact-byte build exception
does not authorize changed bundles: global 1.8 MB / 525 KiB budgets remain,
and this design does not expand/waive the exception. Measure a new candidate
honestly and escalate the concrete build blocker if it remains.

Update backlog/wishlist completion only after the actual outcome is verified.
No save migration is needed. Rollback is the preceding commit. No publish,
merge or deployment is performed by this design handoff; those remain later
reviewed actions. There are no unresolved product choices for the builder.
