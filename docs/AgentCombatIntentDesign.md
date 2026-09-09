# Bounded agent combat — issue #61

Source: [PIR-08](https://github.com/barryrwilson/Rimward/issues/61), including
the moving-target mercenary follow-up. This contract shares an ownership
boundary with [PIR-09](https://github.com/barryrwilson/Rimward/issues/62);
incoming-fire reactions remain separate work.

The local controller sustains an explicitly selected fight between outer
decisions. It pursues, chooses ordinary firing windows and turns away before
a close pass. It does not promise a win, career payout or safe destruction-free
disable. Normal ship physics, weapon convergence, ammunition, cooldowns,
damage, heat, kit and NPC behavior remain authoritative.

## Commands and ownership

```js
rimward.act({ v: 2, name: 'setCombatIntent', args: {
  seq: 21, ttl: 45, targetId: 'rec-10', intent: 'engage'
}});
rimward.act({ v: 2, name: 'clearControl', args: {} });
```

All four combat arguments are required; unknown arguments refuse. `seq` is a
positive safe integer, strictly increasing in the same session sequence as
`setControl`. `ttl` is 1–60 seconds, bounded by both simulation time and monotonic
elapsed wall time: the first deadline reached ends authorization. Raw manual leases retain their
0.05–5 second duration. Observation does not renew anything. A complete newer
combat request atomically renews/replaces combat, with each deadline equal to
its current clock plus the requested duration. Same-target/intent/weapon renewal
preserves maneuver memory. Cancelled/expired sequences cannot be reused.

The target must be the current live ship lock with a fresh matching HUD sample.
A newly selected target may require one HUD frame before authorization is
accepted. There is no automatic target cycling, acquisition or reacquisition.
Attack intents bind the selected non-mining weapon, without switching equipment
or subsystem aim. Empty/ineligible weapon groups refuse. Active MATCH, burner
or drift refuses; the agent cannot quietly mutate a human flight setting.

`controls.js` owns exactly one agent session: a manual lease or combat intent.
The combat helper returns normalized inputs, and the existing controls update
applies their steering/throttle/fire through the normal ship/combat consumers.
It never writes ship pose, velocity or another helm channel. A raw lease blocks
combat and combat blocks raw leases. AP, automine, dock approach and flee refuse
incoming API acquisition while combat owns control; use `clearControl` first.

Human mouse/button/key flight input wins synchronously. Old agent throttle and holds
are neutralized before the new human command is applied. Explicit pause,
dock/berth, blocked overlays, death, jump/system replacement, opt-out, expiry
and explicit clear release combat. **Focus loss and switching windows do not
cancel combat**, per the owner's correction during implementation. The raw
manual lease still cancels on blur. If a hidden tab suspends simulation, the
wall deadline expires on the next observation or control tick before a new
shot; focus does not renew the grant. Idempotent clear remains
available while paused/held and retains an already reported combat terminal
reason. There are no automatic burner requests or external renewals.

## Maneuvers and endings

Unsolicited hail cards leave combat authorization running, just as ordinary
flight remains live behind the card. They do not renew the grant or resolve
the conversation. New explicit grants and renewals use the same policy.
Deliberate hail pulses, successful API hail responses, and existing physical
hail controls hand control back; invalid or stale responses preserve the grant.
Raw manual leases retain their existing hail interruption behavior.

- `engage` and `disable`: intercept using angular target/lead errors plus
  measured angular change, enter a firing pass and avoid a forward collision
  corridor. Nearby aft pursuit alone does not reverse a return to aim.
  Reposition uses ordinary thrust/strafe and lasts at most three seconds
  unless immediate hull clearance still requires avoidance;
  the next six seconds suppress only preferred-distance re-entry while actual
  hull clearance and visible obstacles still take priority. A shortest-arc
  aim correction handles overhead crossings without a yaw discontinuity.
  Both intents currently share this attack policy and the existing selected
  ordinary weapon/subsystem. `disable` does not select engines automatically
  or guarantee a different outcome; target destruction remains possible.
- `break-off`: never fire, turn away and finish `disengaged` after two seconds
  of increasing separation beyond the weapon-relative threshold.
- `retreat`: never fire, turn away and finish `retreated` after five seconds of
  the same separation criterion or the tracked target leaves sensor range.

The withdrawal threshold is `min(0.65 * TARGET_RANGE,
max(300, 0.8 * weaponRange))`, keeping the measurement inside the 600-unit
public sensing envelope. A break-off whose target leaves the envelope before
the increasing-separation interval completes reports `target-lost`. Completion
means this maneuver finished; it does not assert global safety or auto-dock.
HUD closing is the signed derivative of range: negative means approaching,
positive means increasing separation.

Every fire frame requires a valid selected live lock, attack intent, the same
compatible weapon, normal projectile reach, forward target/lead alignment and
acceptable heat. Reposition/obstruction/withdrawal never fires. Existing muzzle
convergence remains unchanged. Actual spawn/cooldown/ammo rules still decide
whether requested fire produces `playerFire`.

Actual disable, completed surrender or destruction ends both attack intents.
Bargaining and willingness to yield are morale states, not terminal surrender.
Shelter remains a live ship. Departure, stale/mismatched sensing, removal or
range loss stops fire and ends the session. A changed selection reports
`target-changed`; changed weapon reports `weapon-changed`.

Visible station/gate/asteroid and sun clearance can suppress fire and slow the
ordinary throttle while turning away, with `movementBlocked: 'obstructed'`.
Obstacle collection excludes private traffic entirely. Selected target hull
clearance is covered by close-pass handling. All endings issue ordinary full
stop: velocity decelerates through ship physics, never instant pose/velocity
mutation. Player takeover yields to the new human inputs.

## Observable contract

The HUD owns the target/weapon/time-stamped aim digest; the controller consumes its
visible bearing, lead, range, speed and closing estimates. It does not read
hidden enemy velocity, plans, loadout or off-sensor positions.

`observe().control` retains `state`, `seq`, `expiresIn`, `fire` and `reason`,
adds `owner` (`none`, `manual`, `combat`), and includes a combat block while
active or after its last terminal result:

```js
{ targetId, intent, phase, weaponGroup, fireBlocked, movementBlocked, completedAt }
```

Fire reflects the controller output selected for the current frame, not shot
credit. Terminal observation retains target, intent and reason with owner
`none`, zero remaining time and fire false. Accepted start/renew receipts also
include accepted `seq` and `owner`; old receipts are historical acknowledgments.
Runners serialize commands and reconcile against current observation.
`expiresIn` is the smaller remaining duration of the two authorization clocks.

PIR-09 may add a bounded defensive phase inside this same combat session. It
may substitute movement/fire while authorization permits, but cannot create a
second helm, extend the deadline, or resume after cancellation or a terminal
target. No operative defensive stance/reaction is exposed in #61.

## Verification and release gate

`test:combat-intent` covers strict refusal/no mutation, poisoned/stale sequence,
manual/helm arbitration, 5/15/30-second decision gaps, renewal/expiry, fire
gating, target identity and terminal conditions, close passes, withdrawal,
visible obstruction, lifecycle cancellation, focus continuity, bounded
suspended-tab expiry and human takeover. These are
synthetic regressions. Live fixtures and natural API-only gameplay are recorded
separately by `test:combat-live`; raw samples include motion, separation,
actual shots, target-hit activity, player damage, collisions and survival.
`npcHit` has no shooter identity; natural target hits are never all credited to
the player. Actual bounty/patrol credit requires its own outcome receipt.

Status: implementation under verification. Full build/boot, comparative live
behavior, natural engagement and independent review remain release gates.
The initial production build exceeds existing byte budgets; no budget is
raised or waived by this design. A measured owner-approved exception, if any,
must follow the repository's production performance policy.

No saved-game migration is needed. Rollback is the preceding commit. The
builder hands a specific immutable commit to independent review; merge and
deployment are separate actions.
