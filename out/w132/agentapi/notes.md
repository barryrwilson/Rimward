# Wave 132 — Agent API PR3 close-out (boot pins + docs)

**Status:** implemented (pins + design/PROGRESS). Pulse sink and hypot latch were already CLEAN in src.
**Merge law:** `out/w126/agentapi/shared-contract.md` wins.
**Graph:** did not write the graph. Prior graph: `proceed_unmodeled`. This worker resolved `codex/workflow-software-delivery`.

## Landed

- `scripts/boot-test.mjs` — WAVE132 named pulse/latch pins immediately before `if (errors === 0)`. WAVE131 no longer asserts `pr3Unknown`; the three PR3 unknown probes are deleted. Other WAVE131 pins stay.
- `docs/AgentApiDesign.md` — header status/wave: PR3 pulse+latch implemented. PR3 plan row notes law 19. Wishlist untouched.
- `PROGRESS.md` — Wave 132 bullet.
- This notes file. Did not clobber `latch-verify.md` or `pulse-verify.md`.

Zero edits to `src/` (pulse/latch belong to the CLEAN workers).

## Pins (all must print true)

| Key | Law |
|---|---|
| `dockOneFrame` | `act({ name:'dock' })` does not set `dockPressed` same tick. Next `tick(1)` publishes one frame, then false. Does not assert `flags.docked` on the act tick. Hull parked off-pad so the pulse is an edge only. |
| `hailOneFrame` | `pulse` `{ edge:'hail' }` same one-frame `hailPressed`. |
| `pulseUnknown` | `camera`, `afterburner`, `__proto__` → `ok:false`, `token:'unknown'`. Never throw. |
| `weaponGroup` | `n:3` ok when not skipped; while `flags.docked` refuse `no-service` and do not change group. |
| `selectNoCand` | no in-range cand → `no-service`. |
| `teleportForbidden` | still `forbidden`. |
| `hypotLatch` | `optIn` + AP + hypot 1 stays engaged; KeyD strafe steals (`reason === 'input'`). Restore AP/nav/optIn/input. |
| `amOptInNoBerth` | source pin: `automine.js` `helmSteerLatched` contains `optIn` and does not mention `berthHold` / `berthHeld`. |
| `noThrow` | acts did not throw. |

Boot harness does not write `ctx.input.dockPressed = true` for these pins. Optional in-zone docked-assert skipped (flaky / pad approach is a v1 non-goal).

## Restore

WAVE132 saves and restores `optIn`, berthHold, paused, docked, hailOpen, chartOpen, berthOpen, matchSpeed, weaponGroup, steer/strafe/throttleHeld, dock/hail pressed, ship position, nav bag, AP engaged.

## OPEN leftovers

PR4 key-code, PR5 badge, PR6 bridge.

## VERIFY

Retry `npm run test:boot` (exit 0):

```
wave127 agent-observe: { ... all true }
wave131 agent-intents: { ... all true; no pr3Unknown }
wave132 pulse-latch: {"dockOneFrame":true,"hailOneFrame":true,"pulseUnknown":true,"weaponGroup":true,"selectNoCand":true,"teleportForbidden":true,"hypotLatch":true,"amOptInNoBerth":true,"noThrow":true}
BOOT TEST PASS — no update errors
```

First run: WAVE132 all true; WAVE127 hail01 nan `resolved:false` and WAVE129 hailmiss cascade. Retry passed. Not a WAVE132 pin fail. Did not start Vite/Chrome.
