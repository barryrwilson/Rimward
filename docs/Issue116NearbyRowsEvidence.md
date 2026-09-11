# Issue #116 — Nearby rows a pirate can pick a prize with; station and gate bearings

[Issue #116](https://github.com/barryrwilson/Rimward/issues/116).

**Status: implementation and local verification COMPLETE, AWAITING PR REVIEW
AND MERGE.** The runtime change is implemented on `claude/next-issue-16b598`
from master `696f0ecb`. Build, unchanged boot, the new focused suite, the
schema pins and the agent regressions pass locally, and the live browser check
on 2026-09-11 passes with no console errors from the change. No independent
QA, merge, release or deployment is claimed.

## Outcome

- Every `targets.nearby` **ship** row now carries `faction`, `factionName`,
  `resolveBand`, `surrendered`, `disabled` and `hailState`, the words the
  locked HUD bracket already prints, so a pirate can rank seven hulls from one
  `observe()` without cycling the real lock. `hailState` is the persistent
  verdict of the shared issue #67 classifier (`salvage` / `yielded` /
  `willing` / `no-hail`); the transient blocker, the refusal reason and the
  next step stay on the locked row's `hail` object because they depend on
  range and the open surface.
- The scanner tiers are unchanged and identical to the bracket: a masked
  Q-ship publishes its cover name and cover faction until the Mk II eye
  pierces it; numeric `resolve` (Mk I), `concealedMounts` (Mk II), the `hail`
  object, `escape` and the vitals stay on the extended `targets.current` row
  only. No cargo, no ai internals, no record identity.
- `station.bearing` is a ship-local unit vector (x right, y up, nose `-z`, the
  `jobs.active[].objective.bearing` convention) toward the station, next to
  the existing `range` and `closingSpeed`.
- `gate` gains `to`, `kind` (`ring` | `hub`), `source` (`nav` | `nearest`),
  `range` and `bearing` for the **active gate**: the plotted nav next hop when
  a route is plotted (the same live zone origin the in-world NAV ring marks),
  otherwise the nearest live gate assembly of the current system. Live
  assemblies only, never an authored ghost, so a missing build publishes
  `null` rather than a stale position.
- Pod rows already carried a stable `id` and `units` since issue #115; the
  focused suite pins that contract again.

Nothing about locking, hailing, combat, resolve, the HUD, persistence, the
lease model or the terminal reasons changes. No new command, key, gauge,
persisted field or schema version; the public API stays at `VERSION` 2 and the
ring cap stays 16.

## Change and boundaries

| File | Change |
|---|---|
| `src/game/agent-observe.js` | `shipPublicCondition` (faction, hostile, disabled, resolveBand, surrendered, hailState) is applied to every nearby ship row and reused by the extended `shipCondition`; `station.bearing`; `activeGateSnap` fills `gate.to/kind/source/range/bearing`. |
| `src/systems/gate.js` | New `lookupNearestLiveGate(x, y, z, expectSystem)`: primitives-only nearest live assembly, same live-only rule as `lookupLiveNavGate`. |
| `src/game/agent-schema.js` | Manifest role note for the new fields. No version bump. |
| `scripts/issue-116-nearby-rows-test.mjs` | Focused suite (`npm run test:nearby-rows`). |
| `package.json` | Registers the suite. |
| `docs/AgentApiDesign.md`, `docs/REMAINING-WORK.md` | Contract and inventory. |

Not changed: `hail-offer.js` (its exported `hailEncounterState` is consumed
as is), `hud.js`, `npc.js`, `nav.js`, the lease and combat modules, and the
sanitizer. The alternative `inspect { id }` command from the issue was not
added: the row fields cover the ranking case without a new command.

## Automated evidence

- `npm run test:nearby-rows` — 39 checks over the real npc, gate, nav, pods
  and agent-api systems: five hulls with distinct verdicts read from the
  unlocked rows with the lock untouched; a masked Q-ship prints its cover
  under Mk 0/I and its real identity under Mk II; numeric resolve appears on
  the locked row only under Mk I; no locked-only or private field reaches an
  unlocked row; the locked row keeps its extended shape and agrees with the
  nearby row; pod rows keep `id`/`units`; `station.bearing` is `[0,0,-1]` dead
  ahead at 500 u and follows the ship frame under a 90° yaw (THREE
  inverse-rotation parity); `gate` reads the nearest live gate with no route,
  the plotted next hop after `plotRoute`, and the nearest again after
  `clearRoute`, with range equal to the assembly distance; every new block is
  JSON-plain; no ship object publishes nulls without throwing; docked
  observations still carry the bearings.
- Unchanged and passing: `npm run build`, `npm run test:boot`,
  `npm run test:agent-schema`, `npm run test:agent-hardening`,
  `npm run test:pod-receipts`, `npm run test:refusal-tokens`,
  `npm run test:attacker-identity`, `npm run test:capitulation-feedback`,
  `npm run test:gate-escape`, `npm run test:survey-navigation`.

## Live browser check (2026-09-11)

Vite dev server on port 5199, `?agent=1`, new game from the title screen,
origin digit 1, Claude desktop Browser pane.

- Fresh in flight, no lock: `observe().station` published `bearing`
  `[-0.014, 0.000, 0.9999]` at 2653 u (the station dead astern), and `gate`
  published `to: 'veridian'`, `kind: 'ring'`, `source: 'nearest'`, range
  1177 u with a unit bearing.
- Three hulls spawned beside the ship through `spawnLiveShip` (assets primed
  first): the rows read `Watchful Apt` (veridian, `defiant`, `no-hail`),
  `Cartwheel Ann` (independent, `bargaining`, `willing`) and the pirate
  `Gallows Wren` (redledger, `shaken`, `no-hail`) with `targets.current`
  still `null`. The pirate had already been revealed by the npc system
  (`record.revealed === true`) when it began to hunt, so its real identity on
  the row is the bracket's own rule; the masked case is pinned by the focused
  suite.
- After `plotRoute { dest: 'veridian' }` the gate block switched to
  `source: 'nav'` with the same ring and a fresh range.
- The sim ran between polls (`t` 302 → 315). No console error from the
  change. One uncaught `NPC asset not primed: redledger:cutter:pirate` came
  from the first attempt's fixture, which spawned a Q-ship without priming its
  real hull asset; the page was reloaded and the run above primed it.

## Risks and parked follow-ups

- Cost: `hailEncounterState` per nearby ship row is a few property reads and a
  `ctx.ships.includes` per row (≤ 12 rows), no overlay probe, no
  `hailApi.peek()`.
- `gate.to` for a hub is the hub's currently selected route, which cycles as
  the player flies through; `source: 'nav'` names the plotted hop instead.
- `inspect { id }` remains unimplemented; open a follow-up if a runner needs
  the extended row without moving the lock.
