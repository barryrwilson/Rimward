## Security Review: Wave 94 POWER ledger

### Risk Level: Low

### Summary
Quick scan of a client-only live pool (power), HUD bar, afterburner gate, and psionic spend. No CRITICAL or HIGH findings. Power is not persisted. HUD writes a fixed `PWR` label and a numeric bar width.

### Findings

None.

#### XSS via HUD
**Result:** not present.

- `src/systems/hud.js` builds the PWR row with `makeBar(..., 'PWR', 'rw-power')` and `textContent`.
- No `innerHTML`, `insertAdjacentHTML`, or `eval` in `state.js`, `hud.js`, `combat.js`, or `ship.js`.
- Bar width is `Math.round` of a 0–100 percent from `player.power / POWER.max`.

#### Persist / save tamper
**Result:** not present in this slice.

- `createShipState` adds live `power: POWER.max` only.
- `WORLD_FIELDS` in `src/game/save.js` is unchanged and has no `power` key.
- Hangar rows still copy heat, not power (out of write-set; remount `Object.assign`s a fresh `createShipState` so power returns to max).

#### Economy / credit integrity
**Result:** not present.

- Drain and regen touch `player.power` only.
- Afterburner and Digit 5 do not write `ctx.world.credits`.

#### Injection / prototype keys
**Result:** not present.

- Weapon cost is `WEAPONS.psionic.powerPerShot` from the catalog constant.
- Scratch flag `powerDrainThisFrame` is a boolean the sim sets; it is not read from save JSON.

### Passed Checks
- [x] No secrets, API keys, or credentials in scoped files
- [x] No network, auth, or server trust boundary
- [x] No new `WORLD_FIELDS` key
- [x] HUD uses `textContent` / style width
- [x] Non-finite `player.power` does not NaN the bar (`Number.isFinite` fallback to 0)
- [x] Psionic spend is fail-closed when `powerPerShot` is missing (`psiDry`)

### Recommendations
1. Keep power off the hangar/save whitelist (already true in this wave).
