# WAVE132 verifier — 2026-08-26

Status: CLEAN

Did not edit `src/`, `scripts/boot-test.mjs`, `PROGRESS.md`, or `docs/`.
Did not start Vite or Chrome.
Did not clobber `latch-verify.md` or `pulse-verify.md`.

## Pin review (`scripts/boot-test.mjs` 24507–24708)

- Pins sit immediately before `if (errors === 0)`.
- Pulse pins call `window.rimward.act` then `tick(1)` (law 19).
- New WAVE132 pins do not write `ctx.input.dockPressed = true`.
  Existing writes stay at lines 1139 and 4462 (older dock pins).
- WAVE131 object has no `pr3Unknown`. Repo grep finds no `pr3Unknown` in `boot-test.mjs`.
- `hypotLatch`: optIn + mouse hypot keeps AP engaged; KeyD strafe steal sets `reason === 'input'`.
- `amOptInNoBerth`: greps `helmSteerLatched` in `automine.js` for `optIn` and not `berthHold`/`berthHeld`. Source matches (`automine.js` 166–168).
- `teleportForbidden` still asserts `ok:false` / `token:'forbidden'`.
- Restore includes `fullStop` / `roll` / `afterburnerPressed` / `driftHeld` after the worker PASS run.

## Boot

`npm run test:boot` from repo root. Exit 0.

```
wave127 agent-observe: {all true}
wave127 hail01 nan: {"skipped":true,"resolved":true,"floorFn":true}
wave131 agent-intents: {all true; no pr3Unknown}
wave132 pulse-latch: {"dockOneFrame":true,"hailOneFrame":true,"pulseUnknown":true,"weaponGroup":true,"selectNoCand":true,"teleportForbidden":true,"hypotLatch":true,"amOptInNoBerth":true,"noThrow":true}
BOOT TEST PASS — no update errors
```

Full log: `out/w132/agentapi/boot-verify.log`

No leftover `boot-test` / `vite` after exit. Did not kill user Chrome or MCP node.
