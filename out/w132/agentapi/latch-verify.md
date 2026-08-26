# Wave 132 hypot latch verify

Scope: `src/game/autopilot.js`, `src/game/automine.js`. No `src/` edits. No Vite/Chrome. No `npm run test:boot`.

Probe: `out/w132/agentapi/latch-probe.mjs` (Node + CSS stub). Result: 49 pass, 0 fail.

## Predicates

AP `helmSteerLatched`: `flags.chartOpen === true` OR `berthHeld(ctx)` (`flags.berthHold === true`) OR `ctx.agent.optIn === true`.

AM `helmSteerLatched`: `flags.chartOpen === true` OR `ctx.agent.optIn === true`. No `berthHold` / `berthHeld`.

`optIn` uses `=== true` only. Probe: string `'true'` and numeric `1` do not latch AP; string `'true'` does not latch AM.

## inputBreak

While latched, `steerArmed` is false so hypot does not return `'input'`.

After latch ends, re-arm only when hypot `< 0.65` (`AP_STEER_BREAK` / AM `STEER_BREAK`). Next large hypot then returns `'input'`.

AP `if (held) return ''` is `berthHeld` only. Probe: opt-in + strafe still cancels AP. Berth hold mutes hypot and strafe.

AM berth hold does **not** skip hypot (probe cancelled with `'input'`).

While `optIn === true`, strafeX/Y, roll, throttleHeld, afterburnerPressed, driftHeld, fullStop still return `'input'` on AP and AM.

Engage: AP `tryEngage` and AM `tryEngageAutomine` set `steerArmed = helmSteerLatched(ctx) ? false : true`. AM probe: engage while opt-in, leftover hypot does not cancel.

## Writes

Neither file assigns `ctx.input`, `ctx.agent`, or `flags.berthHold`. Probe: object identities and `berthHold` value stay.

`disable()` stays in `src/systems/agent-api.js` (clears `optIn` only; does not disengage AP/AM).

## Status

CLEAN.
