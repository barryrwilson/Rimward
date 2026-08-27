# RIMWARD RW-001 agent pad-approach design

| Field | Value |
|---|---|
| Issue | [RW-001 / GitHub #2](https://github.com/barryrwilson/Rimward/issues/2) |
| Date | 2026-08-27 |
| Status | **Approved and implemented in the RW-001 worktree.** |
| Owner decision | **2B approved** by Barry Wilson in the Orca task thread on 2026-08-27. This unlocks a new outer pad-approach wave and supersedes the earlier Agent API v1 choice 2A for this outcome only. |
| Scope | One additive external-agent intent that flies a safe approach and finishes through the existing in-zone KeyJ dock path. |

## Outcome

An opted-in external agent can issue one outer-loop intent from ordinary flight
range, watch deterministic progress, and arrive at the current station slowly
enough for the existing dock pulse to berth the ship without a collision. The
human sees the same live ship motion and retains immediate cancellation.

The smallest compatible API addition is:

```js
window.rimward.act({ v: 1, name: 'approachDock', args: {} });
```

`approachDock` is an additive v1 command. The existing `dock` command remains
unchanged: it refuses with `range` unless `ctx.station.inZone === true`, then
queues the existing KeyJ-equivalent pulse. `cancelAutopilot` cancels either
route flight or dock-approach flight, preserving its current idempotent result.

## Current contracts that remain authoritative

- `station.js` alone writes `flags.docked`. Dock range stays 45 u; the existing
  90 u KeyJ snap and in-zone dock behavior stay unchanged.
- `controls.js` remains the input/pulse owner. The approach never writes
  `ctx.input`, a ship transform, credits, cargo, or dock flags.
- `autopilot.js` writes analog yaw, pitch, and throttle commands;
  `ship.js` remains the only player-transform writer.
- Route Autopilot, Automine, and Flee remain mutually exclusive at the helm.
- `world.nav.autopilot` continues to mean routed gate flight and remains forced
  false on save/restore. Dock approach adds no `WORLD_FIELDS` data.
- `state.js`, bindings, digits, equipment, the aim glass, and human NAV-10 are
  unchanged.

## Architecture choice: reuse Autopilot, do not add a helm

Extend the session-only `ctx.autopilot` command channel with an authored mode:

```js
{
  engaged: true,
  mode: 'dock',              // 'route' for existing NAV-03 flight
  phase: 'stage',            // stage | corridor | settle | docking
  reason: '',
  yaw: 0,
  pitch: 0,
  throttle: 0,
  idle: false,
  wantDock: false,
  startSystem: 'freehold',
  startRange: 620,
  range: 620,
  progress: 0
}
```

These are live session fields, sanitized by `autopilot.js` and omitted from
saves. Initialization resets them, and every `save.js restore()` explicitly
calls `disengage(ctx, 'restore')` so same-system manual loads and death recovery
cannot leave dock mode holding the helm. Existing routed flight sets
`mode: 'route'`; `world.nav.autopilot` continues to gate route UI and gate
entry. `ship.js` consumes `ctx.autopilot.engaged` for helm ownership, while
`gate.js` keeps its current stricter `world.nav.autopilot && wantJump` check.
Dock mode therefore cannot request or enter a gate.

Automine and Flee refusal/handoff checks use the engaged Autopilot channel, not
only `world.nav.autopilot`, so two inner loops can never command the ship at
once. Route Autopilot, Automine, Flee, MATCH, drift, and afterburner are refused
at dock-approach engagement rather than silently cancelled.

## Deterministic approach geometry

The current dock snap establishes the authored berth side at station-local
`+X` and parks at 36 u. The approach uses two non-persistent points derived from
the live station position:

- **Stage:** station `+X 135 u`, matching the existing NAV-10 SLOW cue band.
- **Settle point:** station `+X 40 u`, inside `U.DOCK_RANGE` (45) but outside
  the station collision cylinder plus player radius (32 + 2.4 = 34.4).

From any representative outer position, the existing Autopilot path planner
flies to the stage with the station and other solid bodies in its keep-out bag.
This prevents a far-side start from drawing a chord through the station. The
final stage-to-settle corridor is the fixed clear `+X` radial segment. During
that segment the station is omitted from *planning* because the goal is inside
its conservative spherical keep-out, but every other avoidance body remains
active and the normal `resolveMover` collision safety net remains untouched.

If the stage/corridor geometry, station pose, ship pose, or planner result is
missing or non-finite, the approach disengages fail-closed. It never substitutes
a default station and never moves the ship directly.

## Braking profile

The profile uses the live mounted hull envelope from `ctx.config.ship`; it does
not add tuning to `state.js`.

For distance `d` to the current point, speed `v`, acceleration `a`, and phase
buffer `b`, the conservative stop test is:

```text
stopDistance = v^2 / (2 * max(a, 1))
brake when d <= stopDistance + b
```

The stage buffer is 10 u, inside the 12 u stage-arrival band. The final buffer
is 2 u, which stops the light hull inside the 45 u dock zone while retaining
clearance from the 34.4 u collision boundary. While aligned and outside
the brake envelope, throttle is capped so dock-corridor commanded speed never
exceeds 30 u/s (the live light-hull creep; lower for hulls whose creep is
lower). Inside the brake envelope, dock mode sets `throttle = 0` and
`idle = true`.

`idle` is the one necessary shared flight primitive: in `ship.js`, a dock-mode
Autopilot with zero throttle targets zero forward speed, exactly as Automine
already does at idle. Route Autopilot keeps its existing creep behavior. This
lets the approach settle below the NAV-10 20 u/s cue without writing or
latching the player's `input.fullStop`.

The approach requests the existing dock pulse only when all are true:

- mode and phase are still `dock` / `settle`;
- current system and station identity still match engagement;
- `ctx.station.inZone === true`;
- range is at most 43 u, leaving a 2 u zone margin;
- ship speed is at most 5 u/s;
- no blocking overlay/berth hold, jump, or pause is active.

`autopilot.js` then sets `wantDock` once and queues `agentPulse(ctx, 'dock')`.
The normal controls/station update order consumes that KeyJ-equivalent pulse.
The low speed and settle-point clearance cover its frame delay. Dock mode never
calls `station.dock()`, never writes `dockPressed` directly, and never uses the
90 u snap as its approach mechanism.

## State machine and observation

| Phase | Behavior | Transition |
|---|---|---|
| `stage` | Plan/avoid toward `+X 135`; brake to a controlled arrival. | Within 12 u of stage and speed <= 20 u/s -> `corridor`. |
| `corridor` | Aim down the fixed clear radial corridor; cap speed and use the final stop envelope. | In zone -> `settle`; invalid/blocked -> fail. |
| `settle` | Command dock-mode idle and hold the settle point. | Range <= 43 and speed <= 5 -> queue dock pulse. |
| `docking` | Keep idle commands; never queue a second pulse. | `flags.docked`/`docked` event -> complete; 2 s without docking -> `dock-refused`. |

The v1 observation gains additive JSON-plain fields:

```js
station: {
  inZone: false,
  name: 'Freehold Landing',
  systemName: '...',
  range: 620,
  closingSpeed: -42
},
autopilot: {
  engaged: true,
  mode: 'dock',
  phase: 'stage',
  reason: '',
  range: 620,
  progress: 0.18
}
```

`progress` is clamped to 0..1 from the engagement range and current range; it
never decreases within a phase, resets only on a new command, and is advisory.
`station.range`, phase, ship speed, and `station.inZone` are the authoritative
progress signals. `closingSpeed` follows the existing LOS convention: negative
means approaching.

On asynchronous completion/failure, the Autopilot channel becomes disengaged
but retains `mode: 'dock'`, the terminal phase (`complete` or `failed`), and an
authored `reason` until the next Autopilot engagement. The existing `docked`
ring event confirms success. No new global event type is required.

## Refusal and interruption matrix

| Case | Deterministic result |
|---|---|
| Not opted in | Existing `opt-in` refusal. |
| Already docked at command time | Refuse `docked`; no helm or pulse mutation. |
| Already in zone, speed <= 5 | Enter `settle`, then queue the ordinary dock pulse. |
| Already in zone, speed > 5 | Enter `settle`, brake first, then queue the ordinary dock pulse. |
| Pause at command time | Existing `paused` refusal. |
| KeyP pause during approach | The full loop freezes. Observation retains phase/progress with `flags.paused`; resume revalidates and continues. |
| Berth hold | Refuse `held`; if it begins later, zero commands and retain phase until resume. |
| Jump active/requested | Refuse or disengage `jumping`; clear `wantDock`; never emit a jump. |
| `systemLoaded` or current system changes | Disengage `lost-station`. |
| Station/ship pose missing, stale, or non-finite | Refuse/disengage `no-station` or `stale`; zero commands. |
| Route Autopilot active | Refuse `autopilot`; route and plotted destination remain untouched. |
| Automine active | Refuse `automine`; rock lock remains untouched. |
| Flee active | Refuse `flee`; do not cancel an emergency maneuver. |
| MATCH, drift, or afterburner active | Refuse `match`, `drift`, or `afterburner`. |
| `cancelAutopilot` or qualifying manual input | Disengage with `cancel` or `input`, clear `wantDock`, and return the existing player throttle/reticle helm without writing it. |
| `disable` | Existing contract: opt-out does not cancel Autopilot. Approach continues and remains visible to `observe()`. |
| Avoidance cannot produce a finite path | Disengage `blocked`. |
| No material range/heading improvement for 10 unpaused seconds | Disengage `blocked`. |
| `bodyHit` during approach | Disengage `impact` immediately; collision safety remains active. |
| Dock pulse is refused or docking does not complete in 2 seconds | Disengage `dock-refused`; do not retry or teleport. |

All failure exits zero Autopilot commands and `wantDock`. They do not set
`input.fullStop`, change the route, clear the target lock, or alter the ship
transform.

## Security and compatibility

- The new command takes no target position, station id, or arbitrary numeric
  arguments. It can only resolve the current authored station.
- Existing opt-in, pause, berth-hold, forbidden-name, loopback-only bridge, and
  full-token protections remain in force.
- Observation copies numbers/strings/booleans into fresh JSON-plain objects;
  no THREE object or function is exposed.
- There is no browser credential, network listener, direct pose writer,
  immunity, damage suppression, or collision bypass.
- Existing clients that use `dock` keep the same range refusal and queued
  result. Existing route Autopilot keeps its route flag, gate behavior, HUD,
  events, and save/restore contract.

## Expected implementation write set

- `src/game/autopilot.js`: authored route/dock modes, state machine, braking,
  refusal/interrupt reasons, and one-shot dock request.
- `src/game/ap-path.js` or a small pure `src/game/dock-approach.js`: pure
  waypoint/braking helpers with direct tests.
- `src/systems/ship.js`: consume an engaged Autopilot channel and honor
  dock-mode `idle` without changing route creep.
- `src/systems/agent-api.js`: dispatch `approachDock`; keep `dock` unchanged.
- `src/game/agent-schema.js`: add the authored command.
- `src/game/agent-observe.js`: additive station and Autopilot progress fields.
- `src/game/save.js`: one explicit `disengage(ctx, 'restore')` lifecycle hook;
  no saved field or schema change.
- `scripts/boot-test.mjs`, Agent API tests, and bridge smoke coverage.
- This design, `docs/REMAINING-WORK.md`, and
  `docs/PLAYER-EXPERIENCE-WISHLIST.md` status after implementation.

No planned write is needed in `state.js`, `ctx.js`, `station.js`, `controls.js`,
`gate.js`, the persisted snapshot schema, human HUD/CSS, or the bridge
transport.

## Verification and acceptance

Implementation is complete only when all of the following pass:

1. Pure tests cover stop-distance bounds, non-finite inputs, progress clamps,
   and stage/corridor geometry.
2. Agent API tests cover command authorship, opt-in, all synchronous refusals,
   unchanged `dock` range gating, JSON/plain observation, cancel, and restore
   not resuming approach.
3. A deterministic live fixture starts the light hull at representative outer
   ranges (at least 300 and 600 u) from the berth side and far side. Each run
   reaches the stage, brakes, enters the 45 u zone, queues the normal dock
   pulse, emits `docked`, and emits no `bodyHit`.
4. Live interruption fixtures cover cancel, obstruction/stall, lost station,
   KeyP pause/resume, jump, already docked, and a refused dock pulse.
5. `npm run build` passes.
6. `npm run test:boot` passes under the repository's RW-006/RW-007 rerun rule.
7. `npm run agent:bridge:smoke` exercises `approachDock` through the loopback
   bridge in a real browser and records phase/range/speed/docked evidence.
8. The live WebGL flow is watched for both approach headings; console errors,
   collision events, control handoff, the agent badge, and pause/resume are
   checked.
9. Security/regression review confirms loopback-only transport, unchanged
   `dock`/KeyJ semantics, no direct transform writes, no persisted approach,
   and no gate/Automine/Flee helm overlap.

### Verification record — 2026-08-27

- `npm run build`, `npm run test:dock-approach`, Agent schema/hardening tests,
  and the bridge self-test passed.
- The focused flight fixture passed at 300 u on the berth side and 600 u from
  the far side with collision clearance, ordinary pulse docking, terminal
  state, refusal, interruption, pause/resume, and restore pins.
- `npm run agent:bridge:smoke` passed in a real browser with authored
  phase/range/progress, braking below 5 u/s, station-owned docking, undock,
  loopback HTTP/WS/auth pins, and the existing system transition.
- The live WebGL scene rendered normally and browser console inspection found
  no errors or warnings.
- Both full boot runs completed with only the documented RW-007 intermittent
  fixtures failing: `WAVE127 AGENT-OBSERVE/ringHeld` and
  `WAVE132 PULSE-LATCH/dockOneFrame`. The required one-time rerun reproduced
  the same pair; no test was weakened or hidden.

## Approval gate

Barry Wilson explicitly approved this focused design in the Orca task thread on
2026-08-27 after approving choice 2B. That approval unlocked the bounded write
set and behavior above; implementation and verification followed in RW-001.
