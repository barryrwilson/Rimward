# Current NPC turrets inventory (Wave 98)

**Wave:** 98. Owner close. No `src/` edits.  
**Rule:** code wins over stale comments. Every row cites live `file:line` (re-grep 2026-08-23). Wave 97 pack line numbers may be stale; this file re-cites.  
**Scope:** player `auto` turret SKU, NPC cannon + Wave 83 darts, bolt pools, Wave 57 hit-test split, Unknowables, HUD glass, Digit 0/8/9, hangar `turret`, AI-04 hunt, PHY avoid.  
**Not this note:** chaff, an incoming turret gauge, Digit theft, a new `WEAPONS` row, TGT-03 `Incoming fire.` copy, radar, invented fire percent / UU / standing.

Owner line: [`docs/OwnerDecisionsWave98.md`](../../../docs/OwnerDecisionsWave98.md).  
Integrator: [`docs/NpcTurretsDesign.md`](../../../docs/NpcTurretsDesign.md).  
Merge law: [`shared-contract.md`](shared-contract.md). If this note and the contract conflict, the contract wins.  
Predecessor inventory: [`out/w97/turrets/current-npc-turrets-inventory.md`](../../w97/turrets/current-npc-turrets-inventory.md).

[`docs/NpcMissilesDesign.md`](../../../docs/NpcMissilesDesign.md) still freezes **no NPC player-style `auto` turret**. **Do not edit that file.** Wave 68 player `auto` and Wave 83 pirate+ace darts stay shipped. Wave 98 owner close supersedes that freeze for a **later** implementation wave only. Live code still has **zero** turret `npcFire`. That is correct.

---

## 0. Law in one page (today, live code)

1. The player owns **one** turret SKU `auto`. Not a weapon group. Combat ticks `tryPlayerTurret` when seated. Heat-limited. No magazine.
2. NPC fire is **cannon** plus Wave 83 **darts** for `pirate` + `ace` vs the player. NPCs do **not** emit `weapon: 'turret'`. Grep `weapon: 'turret'` in `src/` → **no matches**.
3. NPC still auto-fires **cannon** (`npcFire` + `spawnNpcShot`). That is not a seated `auto` turret.
4. Wave 57 live split: NPC-vs-player bolts `testPlayerHit`; NPC-vs-NPC never `testPlayerHit`.
5. Unknowable fields ignore non-beam hits. `WEAPONS.turret` is family `energy`, not `beam`.
6. HUD-01 empty 80 px hub. No incoming turret gauge. No lock box. No turret aim-glass pip. FORE/AFT flashes on `playerHit` only.
7. Digit 0 is Shipyard. Digit 8/9 are player launcher / turret papers. Hangar `turret` is a player/flat row field.
8. `state.js` is READ-ONLY for feature workers. `WEAPONS.turret` already exists. Reuse is **not** a lie.
9. Wave 98 **closes** Q1/Q2 on paper. Live `src/` still has zero turret emit until a later serial.

---

## 1. Player `auto` turret (Wave 68 — shipped)

### 1.1 Catalog

| Surface | Today | Cite |
|---|---|---|
| Header READ-ONLY | Feature workers import. Do not modify. Wave 68 PR0 wrote `WEAPONS` + `MOUNT_TABLE`. Wave 92/94 later wrote psionic / POWER only. | `state.js` 7–11 |
| `WEAPONS.turret` | name Auto turret, damage **4**, rof **3**, speed **800**, range **380**, heatPerShot **2**, family `energy`. **Not** `beam`. | `state.js` 135–138 |
| `WEAPONS.cannon` | damage 8, rof 6, speed 900, range 500, heatPerShot 4, family `energy` | `state.js` 118 |
| `TURRET_IDS.auto` | `wkey: 'turret'`, cost 4200, confirm true, name Auto turret, no magazine | `weapon-fit.js` 46–54 |
| `isTurretId` | Own-key, `ID_MAX` 64, reserved skip | `weapon-fit.js` 12–31, 67–69 |
| `MOUNT_TABLE.turret` | light / cutter / freighter **0**. heavy **2**. ace **1**. frigate **4**. | `state.js` 66–72 |
| `canSeat(classKey, 'turret')` | Unknown `classKey` uses `light` (0) | `weapon-fit.js` 56–61 |
| `HEAT` | max 100, coolPerSec 12, overheatUnlockAt 40. Shared pool. No power ledger on turret. | `state.js` 146–147 |
| `POWER` | afterburner / psionic. Turret does not spend it. | `state.js` 147 |

`createShipState` (`state.js` 167–180) does **not** attach `turret`.

### 1.2 Combat loop (player only)

| Surface | Today | Cite |
|---|---|---|
| Not a group | Groups 1–3 cannon/disruptor/mining. Group 4 launcher. Group 5 psionic. Turret is **not** in `GROUP_WEAPON`. | `combat.js` 184–187 |
| Docked | Combat returns; weapons cold | `combat.js` 1710–1713 |
| Tick | After player groups. Skip if destroyed / overheated. | `combat.js` 1831–1834 |
| Seat gate | `isTurretId(ctx.world.turret)` | `combat.js` 1278–1279 |
| Catalog | `TURRET_IDS[id].wkey` then `WEAPONS[wkey] \|\| WEAPONS.turret` | `combat.js` 1280–1281 |
| Pick | Nearest live ship with `s.ai.intent`, not Unknowable, in range, forward cone `CONVERGE_DOT` 0.72. **Does not track aft.** | `combat.js` 1253–1275, 182 |
| Live cap | Count `pool[i].wkey === 'turret'` (all fromPlayer today). Cap **2**. Share 64-bolt pool. | `combat.js` 174, 1245–1250, 1284 |
| Spawn | `spawnProjectile(true, wkey, w, …)` into 64-pool. Nose −Z. Aim at target. **No** `AIM_ERROR`. | `combat.js` 1285–1291, 902–931 |
| Heat | `addHeat` writes **player** only | `combat.js` 892–899, 1293 |
| Event | `playerFire { weapon: wkey }` on real spawn | `combat.js` 1294, 43–44 |
| Clock | `nextFireAt.turret = now + 1 / w.rof` | `combat.js` 888, 1278, 1295 |
| Dry pool | Drop. No heat. | `combat.js` 1291, 931 |

### 1.3 HUD WPN (player groups only)

| Surface | Today | Cite |
|---|---|---|
| WPN copy | Groups 1–5 via `weaponHudLabel`. Turret is **not** a Digit and **not** on the WPN rail. | `hud.js` 196–229, 837–838 |
| `textContent` | `el()` writes `textContent`. Toast slots too. | `hud.js` 239–244, 1103 |
| Empty hub | Keep 80 px hub on glass | `hud.js` 1185 |
| FORE/AFT | Words + fill. Flash on `playerHit.fromAft`. | `hud.js` 323–349, 1122–1124 |
| Incoming dart toast | `npcFire` **only** when `weapon === 'missile'` and `target === 'player'`. Authored `Incoming dart.` | `hud.js` 61–62, 567–571 |
| Cannon / turret toast | **None.** Default `npcFire` (non-missile) returns null. | `hud.js` 567–568 |
| `innerHTML` | **Absent** in `hud.js` / `combat.js` / `npc.js` | grep 0 |

HUD never writes `hullKind` / `ctx.world.turret`.

---

## 2. NPC fire (today — no seated turret)

### 2.1 Emit

| Surface | Today | Cite |
|---|---|---|
| Frozen payload | `npcFire { ship, weapon:'cannon'\|'missile', target }` | `ctx.js` 244; `npc.js` 44–45 |
| Hunt / duel cannon | `weapon: 'cannon', target: ai.target` | `npc.js` 1541–1548 |
| Ace vs player cannon | `weapon: 'cannon'` — **omits** `target` (legacy) | `npc.js` 1917–1923 |
| Wave 83 dart | One dart after telegraph vs player, then cannon. `weapon: 'missile', target: 'player'` | `npc.js` 237, 1093–1100, 1543–1546, 1919–1921 |
| `canNpcDart` | pirate or ace, not Unknowable, `!dartSpent` | `npc.js` 1093–1100 |
| Interval | `NPC_FIRE_INTERVAL = 1 / (WEAPONS.cannon.rof * 0.5)`. Face `FIRE_FACE_DOT` 0.92. Cannon **range**. | `npc.js` 89–96, 1540–1541 |
| Telegraph | ≥ 3 s before first shot. Demand-hold weapons cold. | `npc.js` 42–43, 88, 1526–1538 |
| Turret emit | **Absent.** No `weapon: 'turret'`. | grep `npc.js` npcFire sites 1545–1548, 1921–1923; grep `weapon: 'turret'` → 0 |

NPCs auto-fire **cannon** while hunting. That is AI gunfire, not a seated `auto` SKU.

### 2.2 Combat consume

| Surface | Today | Cite |
|---|---|---|
| Same-frame | combat ticks after npc; consumes `ctx.events` | `combat.js` 34–40, 1773–1796 |
| Missile branch | `weapon === 'missile'`: drop unless `target === 'player'`; Unknowable skip; `spawnNpcMissile` | `combat.js` 1779–1785, 1192–1210 |
| Else (cannon path) | `target === 'player' \|\| tgt == null` → `spawnNpcShot` + `vsPlayer = true`. Live ship → `vsPlayer = false`. | `combat.js` 1787–1795 |
| `spawnNpcShot` | Maps unknown weapon → `'cannon'`. Refuses missile / psionic families. **Does not refuse `turret`.** | `combat.js` 1298–1320 |
| Turret-through-cannon | If someone emitted `weapon: 'turret'`, `WEAPONS.turret` exists, family `energy` → **would** occupy the 64-bolt pool with turret stats, ±2° `AIM_ERROR`, **no** `TURRET_LIVE_CAP`. **Live NPCs do not emit this.** | `combat.js` 1298–1320, 174, 181 |
| Heat | `spawnNpcShot` does **not** call `addHeat` | `combat.js` 1298–1320 vs 892–899 |
| Hangar | NPC shots do not call `spendMissileAmmo` / `writeMountedGear` | `combat.js` 1192; `hangar.js` 511–524 |

### 2.3 Pools

| Pool | Cap | Who | Cite |
|---|---|---|---|
| Bolt `pool` | 64 | Player guns + player turret + NPC cannon (and would include NPC turret if emitted) | `combat.js` 171, 517–545 |
| Player missile | 8 | Player dart | `combat.js` 172, 547–578 |
| NPC missile | 4 | Wave 83 NPC dart | `combat.js` 173, 1192–1210 |
| Player turret live | 2 | Count `wkey === 'turret'` (no `fromPlayer` filter today) | `combat.js` 174, 1245–1250 |

Exhausted pool **drops** the shot (`combat.js` 931). Zero per-frame alloc on the bolt path (`combat.js` 47–48).

---

## 3. Wave 57 hit-test split

Live bolt tick (`combat.js` 1848–1851):

`(fromPlayer || !vsPlayer) ? testNpcHits : testPlayerHit`

| Shot | Hit test | Cite |
|---|---|---|
| Player gun / player turret | `fromPlayer true` → `testNpcHits` | `combat.js` 1290, 1848–1850 |
| NPC vs player (`vsPlayer`) | `testPlayerHit` only | `combat.js` 1790–1791, 1674–1691 |
| NPC vs NPC | `testNpcHits` only. **Never** `testPlayerHit` | `combat.js` 1793–1794, 1538–1637 |
| Seeker pools | Same split | `combat.js` 1667–1669, 1854–1857 |

`testPlayerHit`: true radius `PLAYER_HIT_RADIUS` 2.4, no padding, facet FORE/AFT, `applyHit` on `ctx.player`, emit `playerHit { damage, family, fromAft }` (`combat.js` 1674–1691, 179).

`testNpcHits`: skip shooter, skip Unknowable without consume, pad vs NPCs, stamp `lastAttacker` (`combat.js` 1538–1544, 1626).

`lastAttacker` is instance-only, not saved (`npc.js` 231). Patrol hunt needs `lastAttacker === 'player'` (`npc.js` 1083–1090).

File header at `combat.js` 34–41 matches the live split. Code wins.

---

## 4. Unknowables

| Surface | Today | Cite |
|---|---|---|
| `applyHit` | Non-beam vs Unknowable → `[]`. No screen stall. | `state.js` 197–199 |
| Turret catalog | family `energy`. No `beam: true`. **Miss.** | `state.js` 135–138 |
| `testNpcHits` | Skip Unknowable hull; do not consume bolt | `combat.js` 1543–1544 |
| Player turret pick | Skip Unknowable | `combat.js` 1263 |
| NPC dart gate | Unknowable never `canNpcDart` | `npc.js` 1098–1099 |
| Missile combat gate | Unknowable NPC never `spawnNpcMissile` | `combat.js` 1782 |

Default for turret bolts: **miss** Unknowables. Inventory does **not** prove turret is a beam.

---

## 5. AI-04 hunt (who may already cannon)

| Role | Player hunt today | Typical `classKey` | `MOUNT_TABLE.turret` | Cite |
|---|---|---|---|---|
| `trader` | never (`isCivilianRole`) | freighter | 0 | `npc.js` 1079–1085; `world.js` 338 |
| `miner` | never | light / cutter | 0 | `npc.js` 1079–1085; `world.js` 395 |
| `patrol` | standing ≤ −10 **or** scratched by **player** | heavy | **2** | `npc.js` 1086–1089; `world.js` 378 |
| `pirate` | interest / alwaysHunts | cutter (Q-ship cover freighter) | **0** | `npc.js` 1090, 1553–1568; `world.js` 348–370 |
| `ace` | duel | ace / Named Guns | **1** | `npc.js` 1090; `world.js` 407–414; `state.js` 71 |
| `frigate` | (class exists; spawn not in this `world.js` loop) | frigate | **4** | `state.js` 43, 72 |

`mayHuntPlayer` (`npc.js` 1083–1091) is the live gate. Do not widen it here.

Wave 98 owner Q1 **binds** later emit to class `heavy` / `ace` / `frigate` **and** this hunt gate. Live emit still cannon/dart only.

---

## 6. Hangar / persist (player/flat)

| Surface | Today | Cite |
|---|---|---|
| Hangar row `turret` | Heal: no seat → `''`; else `isTurretId` or `''` | `hangar.js` 61–64, 233 |
| World mirror | `ctx.world.turret` write-through of mounted row | `ctx.js` 171; `hangar.js` 458, 523, 637, 684 |
| `WORLD_FIELDS` | `'launcher', 'missileAmmo', 'turret'` — player mirrors | `save.js` 96 |
| NPC records | `{ id?, classKey, role, name?, faction?, … }` — **no** turret field | `npc.js` 37–39 |
| Shipyard fresh row | `turret: ''` | `shipyard.js` 182 |
| `writeMountedGear` | Own-key patch; no `for-in` merge | `hangar.js` 511–524 |
| Chain grant | Red Ledger last step SKU `auto` on **player** hull if `canSeat` | `jobs-chains.js` 27–32 |

NPC records are **not** hangar rows. There is no persist key for NPC racks.

---

## 7. Digit 0 / 8 / 9

| Digit | Service | Cite |
|---|---|---|
| Dock Digit 0 | Shipyard (`DOCK_KEY_SERVICES` last) | `station.js` 186, 5917–5922 |
| Outfitting Digit 8 | Player dart offer / restock papers | `station.js` 1699–1716, 5392–5421 |
| Outfitting Digit 9 | Player `auto` offer. Seated → note. No ammo. | `station.js` 1684–1689, 1718–1727, 5424–5448 |
| Desk copy | `h()` → `textContent` | `station.js` 4302–4307 |

Do not steal these digits for NPC.

---

## 8. Events / song / PHY / chaff

| Surface | Today | Cite |
|---|---|---|
| `playerFire` | Real spawn only, includes `'turret'` | `ctx.js` 38, 243 |
| `npcFire` | cannon \| missile. Missiles always set `target` | `ctx.js` 244 |
| `playerHit` | Impact. HUD FORE/AFT + song thud | `combat.js` 1686; `hud.js` 1122–1124; `song.js` 51–54 |
| Song `npcFire` | Cannon bark. Missile → `npcFireMissile` sting. Volley cap 8. | `song.js` 68–69, 132–134, 423–437 |
| PHY avoid | Lookahead 40, gain 1.4. Bias aim. Not turret dodge. | `physics.js` 19–20; `npc.js` 597–616 |
| Chaff | **Absent.** No SKU. | grep `chaff` in `src/**/*.js` → 0 |

---

## 9. XSS / proto / innerHTML

| Surface | Today | Cite |
|---|---|---|
| HUD | `textContent` / `el()`. No `innerHTML` in `hud.js`. | `hud.js` 239–244, 1103; grep 0 |
| Station | `h()` `textContent` | `station.js` 4302–4307 |
| `combat.js` / `npc.js` | No `innerHTML` | grep 0 |
| SKU ids | `freezeIds` skips `__proto__` / reserved | `weapon-fit.js` 12–24 |
| Hangar patch | `Object.prototype.hasOwnProperty.call` | `hangar.js` 521 |

`src/systems/modelsbrowser.js` uses `innerHTML`. That file is **not** HUD / combat. This wave must not copy it.

---

## 10. What TGT-04 leftover is (code)

Player first impl **DONE** (Wave 68): SKU `auto`, Digit 9, hangar field, forward cone, 64-pool sub-cap 2, shared heat.

NPC player-style `auto` is **absent** in live `src/`:

- No NPC seat check against `MOUNT_TABLE.turret`.
- No independent NPC turret clock.
- No NPC `TURRET_LIVE_CAP` split by `fromPlayer`.
- No `weapon: 'turret'` emit.

Wave 98 **owner-closes** who / vsPlayer on paper. A later serial implements. Wave 83 NPC darts do **not** make Wave 68 or Wave 83 incomplete.

Do **not** edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`.

---

## 11. Reuse vs new `WEAPONS` key

Reuse of **`WEAPONS.turret` numbers + 64-bolt pool + `spawnProjectile` / `spawnNpcShot` energy path** is **true** in live code:

- Catalog row exists (`state.js` 135–138).
- `spawnNpcShot` would accept `wkey === 'turret'` because it only refuses missile / psionic (`combat.js` 1300–1302).
- Hit tests already key off `vsPlayer`, not weapon name (`combat.js` 1848–1851).
- Family color is energy cyan (`combat.js` 189, 918).

Reuse is **not** a full player-loop clone:

- Player turret uses `TURRET_LIVE_CAP` and **no** AIM_ERROR (`combat.js` 1284–1290).
- NPC cannon uses AIM_ERROR ±2° and the cannon fire clock (`combat.js` 181, 1310–1314; `npc.js` 89, 1540).
- `countLiveTurretBolts` does not filter `fromPlayer` (`combat.js` 1245–1250). An NPC turret that shared that counter would starve the player hose.

Do **not** invent a new `WEAPONS` key. Wave 98 owner: no `state.js` fork. Default: no `state.js` write.
