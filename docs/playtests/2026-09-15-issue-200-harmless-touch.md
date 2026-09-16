# Issue #200 — a zero-damage touch must not abort the dock

Builder evidence for
[issue #200](https://github.com/barryrwilson/Rimward/issues/200) on branch
`codex/issue-200-harmless-dock-touch`. This record is implementation and
automated-test evidence only. It does not claim independent QA and it does not
claim a live browser pass.

## Reported outcome

Reported in the 2026-09-15 trader playtest on master `282721f6`, quoted from
issue #200. The issue cites notes at `docs/playtests/2026-09-15-trader-playtest.md`;
that file is not present on this branch, so the rows below are the issue's own
record, not a file read here. `approachDock` disengaged with
`autopilot.reason: 'impact'` five times. Four were zero-damage contacts in the
`cruise` phase:

- `bodyHit { kind: 'ship', speed: 0, damage: 0, count: 4 }` at t=627
- `bodyHit { kind: 'ship', speed: 0, damage: 0, count: 5 }` at t=734
- `bodyHit { kind: 'asteroid', speed: 0, damage: 0 }` at t=793

Each time the hull full-stopped in open space and waited for a new command,
while a pirate took the shell to 0 and the hull from 100 to 38.

## Cause

`dockTouchHarmless` in `src/game/autopilot.js` forgave a contact only when the
phase was `stage` or `settle` and the kind was `station`. Every other
zero-damage row made `dockImpact` return true, and `dockTick` disengaged with
`impact`.

## Change

`src/game/autopilot.js`

- `dockTouchHarmless(e)` now judges the row alone: `damage === 0` and a finite
  numeric `|speed| < DOCK_TOUCH_SPEED` (1 u/s). The phase and kind tests are
  removed, and the `phase` parameter is dropped from `dockTouchHarmless` and
  `dockImpact`.
- `dockTick` calls `dockImpact(ctx)`.

Preserved deliberately:

- malformed rows still cancel — a missing, non-numeric, `NaN` or non-finite
  `speed`, and any `damage` that is not exactly `0`;
- every `bodyHit` row in the frame is still judged, so a harmless touch batched
  with a real impact cannot hide it;
- `DOCK_TOUCH_SPEED` is unchanged at 1 u/s;
- the route helm, the #173 cancellation full stop, and the weapon-hit/contact
  separation are untouched.

No key, event, tuning value, equipment SKU or persisted field was added.

## Test changes

`scripts/boot-test.mjs` — new `issue200` block before the #183 child spawn. It
engages the production dock controller with `tryApproachDock`, forces the
`cruise` phase, publishes `bodyHit` rows exactly as `src/systems/ship.js` does,
and runs one real `autopilot` system update per case. It saves and restores the
flags, pose, velocity, input and nav state it touches. Cases: the playtest's
ship and asteroid zero-damage cruise touches, creep touches at ±0.9 u/s, a
batch of touches, damaging ship and asteroid touches, a fast ship touch, an
asteroid at the 1 u/s floor, five malformed speeds, five malformed damages,
both mixed orderings of a touch with a real impact, and an unchanged `stage`
station touch.

`scripts/issue-139-dock-corridor-test.mjs` — the #184 matrix is replaced by the
#200 matrix. Keep-the-helm cases now run for `stage`, `settle` and `cruise`
across kinds `station`, `asteroid`, `ship`, `gate`, `sun` and `undefined`. The
cancel cases run for those phases plus `corridor`, `docking`, `''` and
`undefined`, since `dockImpact` is decided before any phase handling. The old
expectations that a creep non-station contact and any non-berth phase cancel
are removed; they contradicted #200.

Keep-the-helm pins are restricted to the three phases the fixture actually
flies. In this fixture a `''` or `undefined` phase disengages as `stale` and a
`docking` phase disengages as `dock-refused` for reasons unrelated to contact,
so those phases are covered on the cancel side only.

## Runs

All commands run from `C:/Projects/WebSim-issue-200`. Logs are kept under
`out/issue-200/` and are not committed.

| Command | Exit | Log |
| --- | --- | --- |
| `npm ci` | 0 | `out/issue-200/npm-ci.log` |
| `npm run build` | 0 | `out/issue-200/build.log` |
| `npm run test:boot` | 0 | `out/issue-200/boot-test.log` |
| `npm run test:dock-corridor` | 0 | `out/issue-200/dock-corridor.log` |

`npm run build`:

```
✓ 155 modules transformed.
[plugin rimward-production-bundle-policy] Rimward bundle policy: 1900.17 KiB minified, 571.92 KiB gzip; browser packages: three
✓ built in 7.09s
```

`npm run test:boot`:

```
issue200 harmless dock touch: {"fixture":true,"shipTouchCruise":true,"asteroidTouchCruise":true,"shipCreepCruise":true,"asteroidCreepBack":true,"batchOfTouches":true,"shipDamageCancels":true,"asteroidDamageCancels":true,"shipFastCancels":true,"asteroidFloorCancels":true,"malformedSpeedCancels":true,"malformedDamageCancels":true,"mixedTouchThenImpact":true,"mixedImpactThenTouch":true,"stationTouchStage":true,"noThrow":true}
BOOT TEST PASS — no update errors
```

`npm run test:dock-corridor` — 250 `#200` pins pass:

```
ISSUE 173 DOCK CANCEL PASS (0)
DOCK CORRIDOR GROUP [{"name":"old","pass":true,"status":0},{"name":"new","pass":true,"status":0},{"name":"fresh","pass":true,"status":0},{"name":"repeat","pass":true,"status":0},{"name":"cancel","pass":true,"status":0}]
```

## Negative control

The pre-fix predicate was restored temporarily in a scratch copy of
`src/game/autopilot.js` to prove the new pins fail without the change. The
source was restored byte-for-byte afterwards, and the table above was produced
by a fresh run of the restored source.

With only the `kind === 'station'` test restored
(`out/issue-200/negative-control-corridor.log`):

```
ISSUE 173 DOCK CANCEL FAIL (15)
```

With both the kind and the `stage`/`settle` phase tests restored
(`out/issue-200/negative-control-boot.log`):

```
issue200 harmless dock touch: {"fixture":true,"shipTouchCruise":false,"asteroidTouchCruise":false,"shipCreepCruise":false,"asteroidCreepBack":false,"batchOfTouches":false,...}
ISSUE200 HARMLESS DOCK TOUCH FAIL
BOOT TEST FAIL — 1 errors
```

Every cancel-side pin stayed green in both controls, so the new coverage is
specific to the widened rule and does not weaken the impact gate.

## Acceptance against the issue

| Criterion | Result |
| --- | --- |
| `damage === 0` and `|speed| < DOCK_TOUCH_SPEED` of any kind keeps the dock helm in any phase | Met. Corridor keep pins over six kinds; boot `shipTouchCruise` / `asteroidTouchCruise`. |
| A damaging hit or a fast contact still cancels as `impact` | Met. Corridor cancel pins over every phase and kind; boot `shipDamageCancels`, `shipFastCancels`, `asteroidFloorCancels`. |
| Unit coverage in `scripts/boot-test.mjs` for ship and asteroid zero-damage cruise touches | Met. New `issue200` block. |

## Not covered here

- Independent QA. Not run; Quinn owns that gate.
- Live browser verification of the dock helm surviving a real traffic brush.
  Not run in this session.
- Why the hull drifts into stationary traffic during cruise at all. That is a
  planner question and is outside this issue.
