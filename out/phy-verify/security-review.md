## Security Review: Wave 53 PHY (collision / bounce / impact / sun / toasts)

### Risk Level: Low

### Summary

Quick scan of the PHY slice under a local-only threat model (localStorage save tamper; no network auth; no server). No CRITICAL or HIGH findings. Physics does not write credits. Combat computes impact and sun damage from frozen constants and finite-checked kinematics, not from attacker-supplied `event.damage`. New HUD toasts (`bodyHit`, `sunHeat`, `sunKill`) use fixed strings and `textContent`.

### Findings

None.

Named risks from the brief:

#### NaN-into-credits

**Result:** not present in scope.

- `src/game/physics.js`, `src/game/collision.js`, and `src/systems/combat.js` never read or write `ctx.world.credits`.
- `resolveMover` (`src/game/collision.js:313–327`) zeros non-finite position/velocity and returns `hit: false`, `speed: 0`.
- `sphereOverlap` / `cylinderOverlap` / `sunZone` refuse non-finite inputs (`collision.js:75–77`, `103–108`, `222–226`).
- Impact path: `e.speed || 0` (`combat.js:1036`) turns `NaN` into `0`, then `speed < PHY.IMPACT_MIN_SPEED` skips `applyHit`.
- Restore already heals a non-finite purse: `sanitizeRestored` in `src/game/save.js:166` sets `ctx.world.credits = 350`. That healer is outside this slice but closes the save-tamper credit-NaN case.

#### Unbounded damage from tampered events

**Result:** not present as a save-tamper sink.

- Events are in-memory only. `save.js` snapshot fields are world/cargo/bio/player/transform. The event queue is not persisted.
- `ship.js:581` emits `bodyHit` with `damage: 0`. Combat ignores that field and recomputes `damage = speed * PHY.IMPACT_SCREEN_PER_U` (`combat.js:1038`).
- Combat skips `kind === 'player'` (`combat.js:1035`) and speeds below `PHY.IMPACT_MIN_SPEED` (8), then applies at most one scrape per `IMPACT_GAP` (0.2 s).
- Non-finite live velocity never becomes a hit: `resolveMover` clears `hit` and `speed` (`collision.js:313–327`), so `ship.js` does not emit `bodyHit` for `Infinity`/`NaN` velocity.
- Asteroid radius from live objects is `Number.isFinite(a.radius) ? a.radius : 0` (`collision.js:272`). `Infinity`/`NaN` radii do not inflate overlap.
- Sun heat DPS is `PHY.SUN_HEAT_DPS + t * PHY.SUN_HEAT_RAMP` with `t` clamped to `[0, 1]` (`collision.js:237–240`, `combat.js:1056`). Lethal core uses `hullMax + screenMax + shellMax + 1` (`combat.js:1064`) — enough to kill the ship, not an attacker-chosen packet.
- `sunRadius` comes from authored `ctx.systems[currentSystem]`, not from the save blob. An unknown `currentSystem` is healed to `'freehold'` on restore (`save.js:252`).
- Restore zeros ship velocity (`save.js:281`). A tampered snapshot cannot inject stored closing speed into the next `bodyHit`.

Console injection of a fake `bodyHit` with a huge `speed` can one-shot the local player. That is equivalent to editing the running client. It is not a save-tamper or network issue.

#### XSS via toast text

**Result:** not present.

- `pushToast` writes `slot.el.textContent = text` (`hud.js:686`). No `innerHTML`, `insertAdjacentHTML`, or `eval` in `hud.js`.
- New PHY toasts are fixed copy:
  - `sunHeat` → `'▲ STAR HEAT — turn away.'` (`hud.js:302–303`)
  - `sunKill` → `'✕ The star took the ship.'` (`hud.js:304–305`)
  - `bodyHit` → `'▲ Hull strike.'` only when `e.damage > 0` (`hud.js:306–308`)
- Toast class names are hardcoded (`warn` / `danger`). They are not taken from event payloads (`hud.js:687`).
- Pre-existing toasts that interpolate `e.line` / `e.text` also go through `textContent`. A hand-edited milestone or comm line in a save cannot run script in this HUD.

### Passed Checks

- [x] No secrets, API keys, or credentials in the scoped files
- [x] No network, auth, or server trust boundary in this slice
- [x] `PHY` is `Object.freeze` (`physics.js:6`) — callers cannot mutate damage/heat multipliers at runtime
- [x] Collision helpers reject non-finite positions, radii, and velocities
- [x] `collectBodies` skips unreadable positions (`readPos`) and non-finite asteroid radii
- [x] Player bounce filters `kind === 'sun'` so the heat sphere is not a bounce body (`ship.js:557`)
- [x] NPC bounce/avoid does not emit `bodyHit` and does not call `applyHit`
- [x] Impact damage is derived in combat from closing speed, not from `event.damage`
- [x] Sun lethal and heat paths use authored radius + frozen DPS, not event fields
- [x] New toasts use `textContent` and fixed strings
- [x] Credits are untouched by physics/combat; save restore heals non-finite credits
- [x] `ctx.emit` event types for `bodyHit` / `sunHeat` / `sunKill` are documented on the context contract (`ctx.js:204–206`)

### Recommendations

1. Optional defense in depth (not required for this threat model): reject non-finite `damage` at the start of `applyHit` in `state.js`. The PHY emitters already cannot deliver `NaN`.
2. Optional: `Number.isFinite(e.speed)` in the combat `bodyHit` loop before the multiply. Current `e.speed || 0` already drops `NaN`.
3. Do not treat localStorage credit or `bio.speedFactor` edits as a vulnerability. This client is the authority. Save editing is cheating, not a remote exploit.

### Scope and method

- **Mode:** Quick scan (local Three.js sim; no auth/payments/crypto).
- **Trust boundary:** localStorage restore (`save.js`) → live `ctx` → ship/npc kinematics → `bodyHit` / sun zone → `applyHit` → HUD toasts.
- **Read-only files:** `src/game/physics.js`, `src/game/collision.js`, `src/core/ctx.js` (event comments), `src/systems/ship.js` (bounce / `bodyHit`), `src/systems/npc.js` (avoid / bounce), `src/systems/combat.js` (impact + sun), `src/systems/hud.js` (new toasts).
- **Adjacent reads (data flow only):** `src/game/save.js` (`sanitizeRestored`, snapshot shape), `src/game/state.js` (`applyHit`).
- **Not fixed.** No `src` edits.
