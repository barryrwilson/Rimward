# Issue #114 — A combat intent is a thrust command

[Issue #114](https://github.com/barryrwilson/Rimward/issues/114).

**Status: implementation and local verification COMPLETE, AWAITING PR REVIEW
AND MERGE.** The runtime change is implemented on `claude/next-issue-dcb4e3`
from master `66b56f88`. Build, unchanged boot, the focused suite, the
release-focused regressions (15/15, including the new suite) and the live
browser check on 2026-09-11 pass with no console errors. No independent QA,
merge, release or deployment is claimed.

## Outcome

- An accepted `setCombatIntent` (`engage`, `disable`, `break-off`, `retreat`,
  and a renewal) clears `input.fullStop` on acceptance, exactly as
  `engageAutopilot`, `approachDock` and `engageAutomine` do. A hull stopped by
  the documented #103 handshake (`setControl { throttle: 0 }` → confirm
  `ship.throttle === 0` and `flags.fullStop === true` → `clearControl`) thrusts
  on the first applied update of the combat lease, and `flags.fullStop` reads
  `false` from the accepting act onward, before any frame runs.
- While a live combat lease is still held at rest by the latch,
  `control.combat.movementBlocked` reads `full-stop`. The physical blocks
  `obstructed` and `engine` keep priority. The label is a read-through in the
  status view; it never writes the lease's own record.
- A refused `setCombatIntent` leaves the latch untouched. Every release of a
  combat lease (`clearControl`, expiry, gated transition) still ends in a full
  stop; the completed view carries no `full-stop` label because no lease is
  claiming motion.

The API stays at `VERSION` 2. No new command, key, gauge, save field or
schema version. The manifest gains `setCombatIntent.movementBlocks` and a
note; `fireBlocks`, phases and reasons are unchanged.

## Current-code finding

The fixture reproduction of the issue's repro does **not** show a stuck latch
on current code: the combat tick sets a lease throttle in `[0.12, 0.9]` and
the lease apply path already cleared `input.fullStop` on the first applied
update. The observation in the issue — `phase: intercept`,
`fireBlocked: alignment`, `ship.throttle: 0`, `flags.fullStop: true`, target
range constant for the whole lease — is exactly a freshly created combat lease
with **zero applied frames**, followed by a wall-clock expiry whose release is
a full stop. That matches the recorded desktop-app behaviour where the sim
freezes while the Browser pane is hidden while lease wall TTLs keep expiring
([issue #121](https://github.com/barryrwilson/Rimward/issues/121)). The
issue's expected outcome is still the right contract, so the latch clear
moves to acceptance (the view is honest before the first frame) and the view
names the latch when it does hold the hull. No change is made for #121 here.

## Change and boundaries

| File | Change |
|---|---|
| `src/systems/controls.js` | `agentCombatSet` clears `input.fullStop` on acceptance; `combatStatusView` labels `movementBlocked: 'full-stop'` for a live combat lease held by the latch. |
| `src/game/agent-schema.js` | `setCombatIntent.movementBlocks` and a note describing the latch clear and the label. |
| `scripts/issue-114-combat-full-stop-test.mjs` | Focused suite, 7 groups (`npm run test:combat-full-stop`); joins `release-focused.mjs`. |
| `docs/AgentApiDesign.md`, `docs/PLAYER-EXPERIENCE-WISHLIST.md` | The latch-clearing list names `setCombatIntent`; the `full-stop` label is documented. |

Not changed: ship.js flight law, the raw `setControl` throttle semantics, the
combat release full stop, autopilot/automine `inputBreak`, HUD, keys.

## Verification

- `npm run test:combat-full-stop` — 7 groups pass: acceptance clears the
  latch before any update; the hull thrusts under the lease after the
  handshake; a refusal leaves the latch; the `full-stop` label appears while
  the latch holds a live lease and clears on the next applied tick; physical
  blocks keep priority; release still ends in a full stop with no label; a
  renewal clears a latch set meanwhile.
- `npm run test:release-focused` — 15/15 (combatIntent, reactiveDefense,
  agentSchema, agentApiHardening, agentBridge and the rest unchanged).
- `npm run build` and `npm run test:boot` pass unchanged.
- Live browser (Vite dev, `?agent=1`, saved Marked game in Freehold, Claude
  desktop Browser pane, 2026-09-11): with pirate `rec-10` locked at 29 u,
  `setControl { throttle: 0 }` → `ship.throttle 0`, `flags.fullStop true`,
  `speed 0`; `clearControl` → `fullStop` still `true`, owner `none`;
  `setCombatIntent { intent: 'disable' }` accepted → **immediately**
  `flags.fullStop false`, `movementBlocked ''`, `phase intercept`; four
  seconds later `state active`, `throttle 0.278`, `speed 50`, `fullStop
  false`, `movementBlocked ''`; forcing `input.fullStop = true` under the live
  lease → `movementBlocked 'full-stop'` in `observe()`; one second later the
  applied tick cleared it (`fullStop false`, `speed 66`); `clearControl` →
  owner `none`, `fullStop true`, `throttle 0`, `defense.phase completed`,
  `movementBlocked ''`. Console: no errors.

## Risks and parked follow-ups

- Clearing the latch on acceptance means a hull the player double-tapped to a
  stop moves as soon as an agent's combat intent is accepted. This is the same
  contract `engageAutopilot` already has, and the lease is refused while any
  physical flight input is held.
- The frozen-sim / wall-expiry observability gap stays with #121.
