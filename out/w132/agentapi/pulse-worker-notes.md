# PR3 pulse worker notes

Pending flags `pendingDock`, `pendingHail`, `pendingTarget`, `pendingReticleLock` are module-level lets in `controls.js`. KeyJ/H/T/V still assign those names. Next `controls.update` publishes `input.*Pressed` for one frame, then clears.

Tokens:
- unknown edge / missing `args.edge` → `unknown`
- skip dock (`shouldSkipDockPulse`) → `no-service`
- hail overlay (`playSurfaceBlocked` or `canOpenPlayCard(ctx,'hail') === false`; throw → refuse) → `no-service`
- none in range / bad id → `no-service`
- skip weapon digits (`shouldSkipWeaponGroupDigits`) → `no-service`
- `n` not integer 1..5 → `bad-qty`

`selectTarget` with no `id` pulses KeyT. `id` sets `ctx.targets.current` in controls (ships + group-3 rocks). Agent-api does not assign `ctx.input` or `ctx.targets.current`.

No boot pins in this worker. WAVE131 still expects `pr3Unknown`.
