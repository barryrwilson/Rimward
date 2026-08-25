# Code Review: Wave 53 PHY (solid bodies + sun heat)

**Scope:** `src/game/physics.js`, `src/game/collision.js`, `src/core/ctx.js`, `src/systems/ship.js`, `src/systems/npc.js`, `src/systems/combat.js`, `src/systems/hud.js`, `scripts/boot-test.mjs` (WAVE53 only).  
**Src edits:** none (review only).  
**Verdict:** Approve with minors. No HIGH/CRITICAL breakage found.

### Summary

Solid-body bounce and sun heat split ownership correctly: `ship.js` / `npc.js` move, `combat.js` is the only `applyHit` writer, HUD only toasts. Station equator bounce (32 + 2.4 = 34.4) sits inside `U.DOCK_RANGE` 45. `skipKind && skipId` is the right coupling. WAVE53 boot pins miss the skip-AND contract that `out/phy-verify/kernel-pins.mjs` already covers.

### What's done well

- One frozen `PHY` table; combat hit radius comment matches `PLAYER_HIT_RADIUS` 2.4.
- `collectBodies` / `resolveMover` / `sunZone` take preallocated `dest` / `out`. After warmup, slots reuse. No THREE in `collision.js`.
- NaN paths clear hits / zero velocity / `sunZone.zone = 0` and do not throw.
- Self-skip is `(kind, id)` AND, so station `id` 0 is not asteroid `id` 0 (`collision.js:354-355`).
- Player does not bounce on the sun (`collectBodies` never adds it). Combat applies heat (`zone === 1`) and a one-shot lethal packet (`zone === 2`) → `playerDestroyed` / `sunKill`.
- NPCs append a sun *heat* sphere (`sunRadius * SUN_HEAT_MULT`) and bounce there. They do not share the player lethal path.
- `applyCombatEnvelope` / telegraph / demand / `canGunPass` still set `_aim`. `applyAvoidBias` only adds a lateral offset. `skipAvoidBody` skips the current combat target so lookahead does not steer off the envelope.
- System order is station → ship → npc → combat → hud. Same-frame `bodyHit` is visible to combat; combat may fill `e.damage` before HUD.
- Live verify (`out/phy-verify/phy-notes.txt`): equator ram min radial 34.4, dock at dist 40, D docks. NPC traffic stayed outside the station cylinder.

### Findings

#### 🟡 Minor: WAVE53 boot pins omit skip-AND and dock clearance

**Location:** `scripts/boot-test.mjs:11523-11581`  
**Issue:** WAVE53 checks overlap math, sun zones, `collectBodies` presence, and `typeof resolveMover`. It does not call `resolveMover` with mixed `station/0` + `asteroid/0`, and it does not pin `STATION_CYL_RADIUS + PLAYER_RADIUS < U.DOCK_RANGE`. `kernel-pins.mjs` already has `resolveMover.skipAnd`. A boot-only regression can drop the AND coupling.  
**Suggestion:** Copy the skip-AND pin into WAVE53. Add `32 + 2.4 < 45` (and optionally `hypot(32, 33) + 2.4` as the top-rim note).  
**Status:** open

#### 🟡 Minor: Top rim of the station cylinder sits outside the 45 u dock sphere

**Location:** `src/game/physics.js:8-10`, `src/game/state.js:27`, `src/systems/station.js:2202`  
**Issue:** Equator contact is `32 + 2.4 = 34.4` (inside 45). Bottom rim is `hypot(32, 26) + 2.4 ≈ 43.6` (inside 45). Top rim is `hypot(32, 33) + 2.4 ≈ 48.4` (outside 45). A high approach that rides the cap rim can bounce the player out of `inZone` after the prompt was true. Equatorial dock works (parked at 40 u in live verify).  
**Suggestion:** Lower `STATION_CYL_Y1` a few units, or treat dock range as max(45, rim + player radius). Do not treat this as a dock blocker.  
**Status:** open — not typical approach

#### 🟡 Minor: Body radii use class fallback proxy, not mesh `userData.proxy`

**Location:** `src/game/collision.js:29-38`, `src/systems/npc.js:350-358`  
**Issue:** `SHIP_SCALE` has no `maxRadius`. Both helpers use `hypot(proxy.rx, proxy.ry, proxy.halfLen)` from `scaleFor(classKey)`. Combat already reads `object.userData.proxy` so a Q-ship cover freighter is not a cutter capsule. PHY bounce still uses the *real* `state.classKey`. The player can slide through a disguised freighter volume.  
**Suggestion:** Store mesh radius / proxy on the dest slot (from `object.userData.radius` or `proxy`) when collecting ships.  
**Status:** open — Q-ship only

#### 🟡 Minor: Sun heat is a new per-frame `applyHit` allocation

**Location:** `src/systems/combat.js:64`, `src/systems/combat.js:1055-1057`, `src/game/state.js:150`  
**Issue:** Combat claims zero new per-frame allocations (`_sunOut`). Zone 1 calls `applyHit` every frame. `applyHit` always does `const events = []`. That is event-time for weapons; it is continuous while the player sits in the heat shell. `state.js` is read-only for feature workers, so combat cannot fix the array without a state change.  
**Suggestion:** Accept as applyHit contract, or add a dest-array overload later. Do not treat as gameplay breakage.  
**Status:** open — documented, not blocking

#### 🟡 Minor: `PLAYER_HIT_RADIUS` still duplicated beside `PHY.PLAYER_RADIUS`

**Location:** `src/systems/combat.js:134`, `src/game/physics.js:7`  
**Issue:** Comment says they must match. Projectile tests still use a local `2.4`. A later radius edit can desync bounce vs bolt hits.  
**Suggestion:** Use `PHY.PLAYER_RADIUS` in `testPlayerHit`.  
**Status:** open

#### 💡 Suggestion: Player sun-strip loop never sees a sun body

**Location:** `src/systems/ship.js:552-561`  
**Issue:** `collectBodies` does not push `kind: 'sun'`. Only `npc.js` `appendSunBody` does. The compact loop is dead. Intent (player must not bounce on the star) is already true.  
**Suggestion:** Delete the loop, or stop claiming it filters sun.  
**Status:** open

#### 💡 Suggestion: WAVE53 `sunBoundary` / `earlyCollect` are weak

**Location:** `scripts/boot-test.mjs:11571`, `scripts/boot-test.mjs:11579`  
**Issue:** `sz0.zone === 0 || sz0.zone === 1` accepts either side of `dist <= heatR`. `bodies2.count === 0 || Number.isFinite(bodies2.count)` is true for any finite count.  
**Suggestion:** Pin `sz0.zone === 1` and `t === 0` at exactly `SUN_HEAT_MULT * R`. Pin empty collect to `count === 0`.  
**Status:** open

#### 💡 Suggestion: `_sunKillEmitted` resets only on `systemLoaded`

**Location:** `src/systems/combat.js:1007-1011`  
**Issue:** Lethal toast is one-shot until a system load. A same-system death restore that does not emit `systemLoaded` still kills via `applyHit` / `playerDestroyed`, but skips a second `sunKill` toast.  
**Suggestion:** Clear the flag when `player.destroyed` becomes false / on restore.  
**Status:** open — toast only

#### 💡 Suggestion: Long Wave 53 header comments narrate the change

**Location:** `src/systems/combat.js:59-64`, `src/systems/ship.js:551`  
**Issue:** Comments restate ownership and throttle numbers already in `ctx.js` / `PHY`. Review rule: comments explain WHY, not the wave story.  
**Suggestion:** Keep one line (combat owns applyHit; ship only emits).  
**Status:** open

### Focus checklist

| Focus | Result |
| --- | --- |
| Bounce vs dock (45 u) | Pass on equator / live dock at 40. Top rim can exit 45 (minor). |
| Zero-alloc | Warmup slots + module scratch. Continuous sun `applyHit` allocates `[]`. `bodyHit` emit is event-time. |
| `applyHit` ownership | Pass. Only `combat.js`. Ship emits `damage: 0`; combat fills on damaging scrapes. |
| Sun lethal vs bounce | Pass. Player: no sun body, heat then lethal packet. NPC: bounce at heat radius, no `applyHit`. |
| Combat envelope | Pass. Envelope functions unchanged; avoid is additive; target skipped in lookahead. |
| NaN | Pass. Overlap / sun / resolve / bounce quaternion guarded. WAVE53 covers overlap + sunZone; kernel-pins also cover `resolveMover`. |
| `skipKind` AND `skipId` | Pass in `resolveMover`. Not pinned in WAVE53 (pinned in kernel-pins). |

### Not raised (checked, not defects)

- Station `dock()` does not teleport. Ship bounce is skipped while `flags.docked`. Undock leaves the ship where it was (typically the 34.4–45 shell).
- `bodyHit` with `speed < IMPACT_MIN_SPEED` is slide-only. HUD ignores `damage <= 0`.
- `resolveVelocity` head-on with rest 0.15 yields `vx = 1.5` even with `SLIDE_FRICTION` 0.85 (no tangent).
- NPC impact damage is not applied. Player-only scrapes match the combat generosity comments.
