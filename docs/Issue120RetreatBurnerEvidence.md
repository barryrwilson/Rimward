# Issue #120 — A withdrawal intent may hold the afterburner

[Issue #120](https://github.com/barryrwilson/Rimward/issues/120).

**Status: implementation and local verification COMPLETE, AWAITING PR REVIEW
AND MERGE.** The runtime change is implemented on `claude/next-issue-2ba4be`
from master `696f0ecb`. Build, unchanged boot, the focused suite, the
release-focused regressions (16/16, including the new suite) and the live
browser check on 2026-09-11 pass with no console errors. No independent QA,
merge, release or deployment is claimed.

## Outcome

The issue offered three shapes. The accepted one is the explicit flag: it
keeps the "no burner request the caller did not permit" contract for every
existing caller, and it gives the runner the one control a human pilot holds.

- `setCombatIntent` accepts an optional `burner` boolean (default `false`).
  It is accepted only with `intent: 'retreat'` or `'break-off'`; a
  non-boolean, or `burner: true` on `engage`/`disable`, refuses `bad-args`
  with a `detail`. Every existing call is unchanged.
- With the permission, the controller holds the ordinary afterburner through
  the same input a Space press produces (`afterburnerPressed` edge on the
  frame a burn starts, `agentBurnerHeld` while it runs). `ship.js` applies
  the normal ×2 multiplier, burn time, power drain, power floor and cooldown;
  nothing writes `ship.burnerActive`.
- A burn starts only when the target is astern (HUD bearing local z > 0.7),
  the pursuer is not already falling behind (HUD closing ≤ 20 u/s), the
  burner is ready with power, no drift or visible obstruction is live, the
  boosted-speed lookahead (`max(speed, 2 × maxSpeed)` over two seconds) is
  clear, the engine is up and more than one second of authorization remains.
  An owned burn that already started rides to the ship's own cutoff unless
  `engine`, `drift` or `obstructed` appears.
- `observe().control.combat.burner` reads `{ allowed, held, blocked }`;
  `blocked` names the first unmet condition from
  `['', 'not-allowed', 'engine', 'obstructed', 'drift', 'power', 'cooldown',
  'alignment', 'separating', 'authorization']`. `held` is the controller
  output for the frame; the ship state stays on `observe().ship`.
- A same-maneuver renewal may grant or revoke the permission without losing
  the separation timer; a renewal during an owned burn is not refused as a
  foreign burner; a burn nobody in the session requested still refuses
  `helm`. Every lease release neutralizes the hold, so the ordinary cutoff
  and cooldown apply.
- The raw `afterburner` pulse still answers `helm` under any combat lease;
  its receipt now carries a `detail` naming the permission.

The API stays at `VERSION` 2. No new command, key, gauge, save field or
schema version. The manifest gains `setCombatIntent.args.burner`,
`burnerBlocks` and a `burner` rule; phases, reasons and fire/movement blocks
are unchanged.

## Change and boundaries

| File | Change |
|---|---|
| `src/game/agent-combat.js` | `createCombat` carries `burnerAllowed` and a per-session `burn` record; `combatView` publishes `burner`; `withdrawalBurn` sets `lease.burner`/`burnerEdge` under the conditions above, after obstruction handling, every applied frame. |
| `src/systems/controls.js` | `agentCombatSet` validates `burner`, passes it to `createCombat`, updates it on a kept renewal, and treats a burn the session requested as not a foreign burner; `dropLease` clears the hold on the completed view. |
| `src/systems/agent-api.js` | The `helm` refusal of the raw `afterburner` pulse under a combat lease carries a `detail`. |
| `src/game/agent-schema.js` | `setCombatIntent.args.burner`, `burnerBlocks`, `burner` rule. |
| `scripts/issue-120-retreat-burner-test.mjs` | Focused suite, 10 groups (`npm run test:retreat-burner`); joins `release-focused.mjs`. |
| `docs/AgentCombatIntentDesign.md`, `docs/REMAINING-WORK.md`, `docs/PLAYER-EXPERIENCE-WISHLIST.md` | Contract, backlog status, runner lesson. |

Not changed: `ship.js` burner state machine, the PIR-09 reactive defense
(its 0.5 s critical-latch burn still runs and now shares the hold with an
allowed withdrawal), human takeover, the full stop on every release, the
attack policy, terminal reasons, keys.

## Verification

- `npm run test:retreat-burner` — 10 groups pass: argument validation and the
  unchanged default; a permitted retreat requests the edge, holds, rides the
  burn to the ship's cutoff, waits out the cooldown, declines a burn while
  separating and requests again when the pursuer closes; `break-off` shares
  the rule; every block token (`alignment`, `separating`, `power`,
  `cooldown`, `drift`, `authorization`, `engine`) is named and requests
  nothing; a body inside the boosted lookahead blocks the burn while ordinary
  steering is clear; renewal keeps an owned burn, revoking releases it, a
  human burn still refuses `helm`; the raw pulse answers `helm` with the
  detail; release ends the hold; the manifest pins.
- `npm run test:combat-intent` (33), `test:reactive-defense` (19),
  `test:combat-full-stop` (7), `test:agent-schema`, `test:agent-hardening`
  and `npm run test:release-focused` — 16/16 pass.
- `npm run build` and `npm run test:boot` pass unchanged.
- Live browser (Vite dev, `?agent=1`, saved Marked game in open space 8 km
  from Freehold Landing, Claude desktop Browser pane, 2026-09-11): a
  harness-only fixture primed the red-ledger cutter asset and spawned a
  hunting pirate 250 u dead astern with `spawnLiveShip`; the lock, intent,
  controller, ship physics and `observe()` paths are the real code.

  | Pin | Result |
  |---|---|
  | L1 acceptance | `setCombatIntent { intent: 'retreat', defense: 'evade', ttl: 40, burner: true }` → `ok`, owner `combat`, `phase retreat`, `burner { allowed: true }`. PASS. |
  | L2 the burn starts and holds | 1.5 s later: `burner { held: true, blocked: '' }`, `ship.burnerActive true`, speed 29.8 → 146.4 u/s, throttle 0.76, power 100 → 75.7, HUD bearing z 0.9999, closing +92 u/s. PASS. |
  | L3 the raw pulse under the lease | `afterburner` → `ok false`, token `helm`, detail "a combat intent owns the helm; renew setCombatIntent with intent 'retreat'\|'break-off' and burner: true, or clearControl first". PASS. |
  | L4 terminal and release | at t 534.05 the pursuer left the 600 u envelope (684.8 u): `state cleared`, reason `retreated`, `burner.held false`, the release cut the burn (`burnerActive false`, `burnerReadyAt` = completion + 8 s cooldown), full stop. PASS. |
  | L5 console | No console errors. PASS. |

  A first attempt in the same session sent the raw `afterburner` pulse
  *before* the intent: the pulse started a human burn and the intent refused
  `helm`, which is the unchanged foreign-burner rule working as documented.

## Risks and parked follow-ups

- The permission makes `retreat` spend reactor power on the runner's behalf;
  the runner opted in per intent and can revoke it on renewal. Power, burn
  time and cooldown are the ordinary ship rules.
- The boosted lookahead reuses the steering obstacle scan (visible stations,
  gates, rocks, sun); private traffic is not enumerated, as before. Hull
  clearance against the selected target is the existing close-pass rule.
- Completion still means "this maneuver finished": the terminal `retreated`
  full stop cuts an owned burn, and a faster hunter can close again. Whether
  a withdrawal should keep way on after completion is a separate contract
  question, not changed here.
- Issue #121 (frozen sim, wall-clock expiry) is unchanged.
