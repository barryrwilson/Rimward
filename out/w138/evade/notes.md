# Wave 138 PR1 evade — notes

Named `act({ name: 'afterburner' })` Space-equivalent pulse landed together: schema name + live set, `dispatchLive` branch, module-scope `pendingAfterburner`, `agentPulse('afterburner')`, observe `ship.burnerReadyAt` finite-or-omit, WAVE138 evade boot pins.

Public pulse table stays four (`dock` / `hail` / `target` / `reticleLock`). `pulse.edge === 'afterburner'` stays `unknown` (WAVE132). `evade` / `flee` stay unknown. `warp` / `teleport` stay forbidden.

Human Space still sets the same module flag. Autopilot steal stays in live `inputBreak`. Burn machine stays in `ship.js`.

`npm run test:boot` (2026-08-27): `wave138 evade:` all true. WAVE127 `ringHeld` and WAVE132 `dockOneFrame` still fail; this worker does not patch those waves.
