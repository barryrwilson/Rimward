# Current NPC missiles and incoming-warning inventory (Wave 75)

**Wave:** 75. Design only. No `src/` edits.  
**Rule:** code wins over stale comments. Every row cites `file:line`.  
**Scope:** player dart, NPC fire, turret `auto`, HUD glance, events, FORE/AFT, toasts, song, PHY avoid, AI hunt/scratch, `state.js` WEAPONS, hangar launcher / ammo.  
**Not this note:** chaff, an incoming gauge, a second player launcher SKU, NPC player-style turrets, a power ledger.

Integrator: [`docs/NpcMissilesDesign.md`](../../../docs/NpcMissilesDesign.md).  
Merge law: [`shared-contract.md`](shared-contract.md). If this note and the contract conflict, the contract wins.

Wave 67/68 freeze “no NPC missiles in first impl” lives in [`docs/Shp03WeaponsDesign.md`](../../../docs/Shp03WeaponsDesign.md). **Do not edit that file.** This inventory is the live post-Wave-68 record.

---

## 0. Law in one page (today)

1. The player owns **one** launcher SKU `dart`. Group 4. Separate missile pool cap **8**. Ammo parks on the hangar row.
2. NPC fire is **cannon only**. `npcFire` always carries `weapon: 'cannon'`. Combat spawns a bolt from the 64-pool.
3. Missile sim **only** tests NPC hulls (`testNpcHits`). It never calls `testPlayerHit`.
4. There is **no** incoming-missile gauge, lock box, aspect ring, or extra `#hud` glance node.
5. Incoming cannon already uses FORE/AFT flash on `playerHit`, song `npcFire` / `playerHit`, and off-column toasts. `npcFire` itself does **not** toast.
6. Unknowable fields ignore non-beam hits. Darts are not beams.
7. `state.js` is READ-ONLY for feature workers.
8. Digit 0 is Shipyard. Outfitting 8/9 already sell the player dart / auto turret. This wave does not reopen them.

---

## 1. Player dart (Wave 68)

### 1.1 Catalog

| Surface | Today | Cite |
|---|---|---|
| Header READ-ONLY | Feature workers import. Do not modify. Wave 68 PR0 was the exclusive writer of `WEAPONS` + `MOUNT_TABLE`. | `state.js` 7–9 |
| `WEAPONS.missile` | name Dart rack, damage 22, rof 0.45, speed 260, range 720, heatPerShot 14, family `missile`, turn 0.85 rad/s | `state.js` 109–114 |
| `WEAPONS.turret` | Auto turret, damage 4, rof 3, speed 800, range 380, heatPerShot 2, family `energy` | `state.js` 115–118 |
| `LAUNCHER_IDS.dart` | `wkey: 'missile'`, ammoMax 8, cost 6500, restock 400 / 2, name Dart rack | `weapon-fit.js` 33–44 |
| `TURRET_IDS.auto` | `wkey: 'turret'`, cost 4200 | `weapon-fit.js` 46–54 |
| Seat table | light/cutter/freighter missile **0**. heavy/ace **2**. frigate **4**. | `state.js` 46–53 |
| `canSeat` | Unknown `classKey` uses `light` | `weapon-fit.js` 56–61 |

`createShipState` (`state.js` 140–160) does **not** attach launcher, ammo, or turret.

### 1.2 Seeker math and pool

| Surface | Today | Cite |
|---|---|---|
| Zero per-frame alloc | Pools + module-scope scratch. Header law. | `combat.js` 42–43 |
| Seeker scratch | `_seekFwd`, `_seekWant` at module scope | `combat.js` 160–162 |
| `steerSeekerVel` | Turn toward lock. Cap `|Δθ|` at `turn*dt`. Null lock → ballistic. Mutates vel. No alloc. | `combat.js` 199–224 |
| Bolt pool | 64. Drop when exhausted. | `combat.js` 164, 865–894 |
| Missile pool | **8** slots. Separate from bolts. Sharing would starve cannon. | `combat.js` 165, 515–545 |
| `spawnMissile` | First free slot. Hardcodes `fromPlayer = true`, `shooter = null`, `vsPlayer = false`. Dry pool → `null`. | `combat.js` 1117–1144 |
| `tryPlayerMissile` | ROF, integer ammo > 0, live ship lock in range, spawn, **then** `spendMissileAmmo`, heat, `playerFire`. Dry pool: no ammo, no heat. | `combat.js` 1154–1175 |
| Lock | `ctx.targets.current` live ship in range. Asteroid / gate / dead → null | `combat.js` 1146–1152 |
| Tick | Even under `reducedMotion`. Lost lock → ballistic. **Always** `testNpcHits`. Never `testPlayerHit`. | `combat.js` 1722–1738 |
| Group 4 | `GROUP_WEAPON` has 1–3 only. Group 4 reads seated `LAUNCHER_IDS[id].wkey`. Empty → `null` (no cannon fallback). | `combat.js` 176–178, 226–234 |
| Digit4 | Flight: `input.weaponGroup = 4` | `controls.js` 23, 211–214 |
| `playerFire` | Emitted only when a player cannon / disruptor / missile / turret **leaves a pool** | `combat.js` 38–39, 1112, 1172, 1226 |

### 1.3 Unknowables miss (non-beam)

| Surface | Today | Cite |
|---|---|---|
| `applyHit` | If `isUnknowable(state.faction)` and `w.beam !== true` → `[]`. No recharge stall. | `state.js` 167–171 |
| Missile family | `beam` is unset. Dart is not a beam. | `state.js` 109–114 |
| `testNpcHits` | Skip Unknowable ships. Bolt / dart is **not consumed**. | `combat.js` 1458–1459 |
| Turret pick | Skip Unknowable | `combat.js` 1195 |
| Mining | Beam **does** couple (`beam: true`) | `state.js` 104–108; `combat.js` 1264–1275, 1300 |

Wave 9 / SHP-03: darts do not damage Unknowables. Live code already does this for player darts.

### 1.4 Ammo / hangar

| Surface | Today | Cite |
|---|---|---|
| World mirrors | `launcher: ''`, `missileAmmo: 0`, `turret: ''` | `ctx.js` 144–148 |
| Sanitize | `healLauncher` + `healMissileAmmo` on a **fresh** row literal | `hangar.js` 53–56, 219–231 |
| Spend | `spendMissileAmmo` decrements mounted row **and** world mirror. Empty launcher → 0. | `hangar.js` 516–529 |
| Park / load | Pack includes launcher / ammo / turret. Sync writes world from row. | `hangar.js` 248–258, 443–466, 498–506 |

NPC hulls have **no** hangar `launcher` / `missileAmmo`. Combat must not call `spendMissileAmmo` for an NPC shot.

---

## 2. NPC fire (cannon only)

| Surface | Today | Cite |
|---|---|---|
| Header | Fire is `npcFire { ship, weapon:'cannon', target }`. Combat aims and spawns. NPCs never spawn projectiles themselves. | `npc.js` 37–41; `combat.js` 33–36 |
| Hunt fire | Interval vs `WEAPONS.cannon.range` + `FIRE_FACE_DOT` 0.92. Emit `{ ship, weapon: 'cannon', target: ai.target }`. | `npc.js` 84–91, 1509–1512 |
| Ace duel fire | Same cannon. Emit `{ ship, weapon: 'cannon' }` (**no `target`**). Combat treats missing cannon target as player. **Cannon-only.** Do not copy this omit onto darts. | `npc.js` 1869–1872; `combat.js` 1672–1675 |
| Consume | `weapon` is passed to `spawnNpcShot`. Unknown key → `'cannon'`. `tgt === 'player' \|\| tgt == null` → vs player. | `combat.js` 1665–1679, 1230–1232 |
| `spawnNpcShot` | ±2° error. `spawnProjectile` into the **64-bolt** pool. Sets `shooter`. Does **not** enter the missile pool. Does **not** seek. | `combat.js` 1230–1250, 173 |
| `vsPlayer` | `target === 'player'` or `null` → `vsPlayer = true`. Live-ship target → `false`. | `combat.js` 1672–1678 |
| Bolt hit split (**live law**) | `(fromPlayer \|\| !vsPlayer) ? testNpcHits : testPlayerHit`. Player shot → `testNpcHits`. NPC vs player → `testPlayerHit`. NPC vs NPC → `testNpcHits`, never `testPlayerHit`. | `combat.js` 1716–1718 |
| Header (stale) | Says player-aimed use `testPlayerHit` only and ship-aimed never `testPlayerHit`. **False vs 1716–1718.** Do not cite as Wave 57 law. | `combat.js` 35–36 |

**Watchout for a later missile PR:** if an impl passes `weapon: 'missile'` into today’s `spawnNpcShot`, combat would spawn a **ballistic** missile-colored bolt in the 64-pool with **no seeker**. NPC darts must **not** reuse `spawnNpcShot`. They need the missile pool + `steerSeekerVel`.

Missile later impl must follow **1716–1718**, not the stale 35–36 header and not “always `testNpcHits`” (today’s player-only tick at 1738). `vsPlayer` → `testPlayerHit`; else `testNpcHits`. Never `testPlayerHit` on NPC-vs-NPC. Missile `npcFire` must set `target` explicitly; do not reuse ace cannon’s omitted `target`.

NPC does **not** emit a second weapon type today. Grep of `npcFire` in `npc.js` is cannon only (1512, 1872).

---

## 3. Turret `auto` (player only)

| Surface | Today | Cite |
|---|---|---|
| SKU | `TURRET_IDS.auto` → `WEAPONS.turret` | `weapon-fit.js` 46–54; `state.js` 115–118 |
| Loop | Player only. Skip unseated / docked / dead / overheated. | `combat.js` 1699–1702, 1209–1228 |
| Pick | Nearest hostile with `ai.intent`, forward cone `CONVERGE_DOT` 0.72. No aft. | `combat.js` 1185–1207 |
| Cap | Share 64-pool. Max **2** live turret bolts. | `combat.js` 166, 1177–1182 |
| NPC turret | **Absent.** NPC still auto-fires cannon (`npcFire`). SHP-03: no NPC player-style `auto`. | `npc.js` 1510–1512 |

---

## 4. HUD WPN group 4, empty hub, no lock box

| Surface | Today | Cite |
|---|---|---|
| HUD-01 glance | Reticle + lead, bracket, mirrored rails, one prompt. Same overlay three cameras. | `hud.js` 10–17 |
| Empty hub | Keep the 80 px hub on glass. Clamp reticle. | `hud.js` 1004 |
| HUD-01 reject | No aspect-lock, no missile timer, no incoming gauge on the aim glass | `docs/HudUtilityChangeProposal.md` 318–321, 417 |
| HUD-02 reject | No missiles HUD, lock-box, incoming-missile gauge, countermeasures | `docs/Hud02IdentitiesDesign.md` 75 |
| Group 4 key | `hudWeaponKey`: seated launcher `wkey`, else `null` | `hud.js` 186–197 |
| WPN copy | `4 · <name> · <ammo>` or `4 · —`. `textContent`. HUD never writes world keys. | `hud.js` 199–214, 728–730, 1511–1512 |
| RANGE / lead | Selected-weapon range and TOF. Empty group 4 has no speed (no cannon fallback). Seated dart speed 260 is advisory. | `hud.js` 1078–1083, 1142–1153 |
| Tree | `initHud` builds reticle, rails, bracket, lead, edge arrow, contacts, toasts, banner, prompt. **No** incoming-missile node. | `hud.js` 599–678, 719–730 |
| `innerHTML` | **None** in `hud.js` / `combat.js` / `npc.js` / `song.js` | grep |

TGT-03 remaining still names missile warnings (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 246–261). The scanner arc shipped. The warning gauge did **not**.

---

## 5. FORE / AFT, toasts, banner (off aim column)

| Surface | Today | Cite |
|---|---|---|
| FORE/AFT widget | Words + fill/hollow. Modes `fore` / `aft` / `flash-fore` / `flash-aft` / `dim`. | `hud.js` 308–336 |
| Hit flash | `playerHit` sets 0.4 s flash. `fromAft` picks AFT vs FORE. | `hud.js` 903–904, 942–945, 1156–1175 |
| Glance facing | No lock → dim (unless flashing). With lock: nose vs lock. Flash overrides. | `hud.js` 1156–1175 |
| Toasts | Top-center, 5 slots, `textContent`, `role=status`. Off the aim column (HUD-01 Wave A). | `hud.js` 650–657, 906–926 |
| Banner | `systemLoaded` arrival. Off the aim column. | `hud.js` 661–666; `HudUtilityChangeProposal.md` 313, 321 |
| `toastForEvent` | `commLine` uses `e.text ?? e.line` (not `e.from`). `npcFire` / `playerFire` / `playerHit` fall through `default` → **null** (no toast). | `hud.js` 397–408, 507–508 |
| `pushToast` | `slot.el.textContent = text` | `hud.js` 924 |

`playerHit` is **impact**, not an inbound warning. Cannon inbound has no pre-hit toast. The player hears `npcFire` and sees FORE/AFT only after a hit (plus the bolt in world space).

---

## 6. `commLine` and song cues

| Surface | Today | Cite |
|---|---|---|
| `say` | `ctx.emit('commLine', { text, from: live.state.name })` | `npc.js` 319–320 |
| Toast of comm | Displays **authored `text`**, ignores `from` | `hud.js` 400–408 |
| Frozen event | `'commLine' {text, from}` | `ctx.js` 207 |
| `playerFire` | `{ weapon }` — cannon/disruptor/`missile`/turret wkey | `ctx.js` 219 |
| `npcFire` | Not listed with a payload in the frozen comment block (emit sites document it). Hunt includes `target`. | `ctx.js` 198–237; `npc.js` 40, 1512 |
| Song `playerHit` | Hull thud | `song.js` 51–54 |
| Song `playerFire` | Gun bark (same table for darts today) | `song.js` 64–67 |
| Song `npcFire` | Thinner square. No weapon branch. | `song.js` 68 |
| Volley cap | ~8 overlapping `npcFire` / `npcHit` | `song.js` 131–133, 427–433 |
| `reticleLock` | Short tick. TGT-05. | `song.js` 118; `ctx.js` 237 |
| `hostileEnter` | Bio family, scanner arc first hostile | `song.js` 116, 127 |

A dart-colored `npcFire` that still plays the cannon bark would **lie** in the ear unless song branches on `weapon`.

---

## 7. PHY avoid (not chaff)

| Surface | Today | Cite |
|---|---|---|
| Constants | `AVOID_LOOKAHEAD` 40, `AVOID_GAIN` 1.4 | `physics.js` 19–20 |
| NPC avoid | Lateral bias around nearest lookahead obstacle. Does **not** replace combat aim. | `npc.js` 50, 587–635 |
| Player dodge | Combat is projectile, dodgeable, no hitscan | `combat.js` 19–21 |
| Chaff | **Absent.** SHP-03 non-goal. | `docs/Shp03WeaponsDesign.md` 102, 209 |

Seekers are not PHY bodies. Avoid does not steer around darts. Counterplay today is **flight**.

---

## 8. AI hunt / scratch / lastAttacker (Wave 57)

| Surface | Today | Cite |
|---|---|---|
| `lastAttacker` | Instance only. `'player' \| live ship \| 'npc'`. Not saved. | `npc.js` 226 |
| `lastAttackerOf` | Dead ship refs clear. | `npc.js` 1028–1036 |
| Stamp on NPC hit | `lastAttacker = fromPlayer ? 'player' : (shooter \|\| 'npc')` | `combat.js` 1541 |
| Civilian | `trader` and `miner` never hunt the player | `npc.js` 1061–1067, 1440–1441; wishlist AI-04 |
| `mayHuntPlayer` | Patrol: standing ≤ −10 **or** scratched **and** lastAttacker === `'player'`. Pirate / ace eligible. | `npc.js` 1065–1073 |
| Scratch override | Player scratch overrides pirate interest. NPC bolts must **not** send a patrol after the player. | `npc.js` 1554–1588 |
| Traders / miners | Job ticks `tickTraderJob` / `tickMinerJob`. Not hunt. | `npc.js` 2203–2204 |
| Named Guns | `role: 'ace'` in `world.js`. Aspirant names on `NAMED_GUNS` | `world.js` 414+; `state.js` 887–902 |
| Collector | `alwaysHuntsPlayer` pirate | `npc.js` 1525; `world.js` 942–948 |
| Beautiful | Faction systems exist (`galaxy.generated.js` `bt_cradle` etc.). `isBeautiful` is `faction === 'beautiful'`. **No** missile or hunt special case in `npc.js`. BIO: Abominations (later) would make them immediate enemies. | `organic.js` 66–68; `docs/BioLivingShipsDesign.md` 28 |
| Unknowable NPC | Survivor spawn skip. No Unknowable system in `galaxy.generated.js`. | `npc.js` 1313–1322 |

There is **no** live `personality` or job gate that already means “this hull fires darts.” Personality adjusts resolve (`npc.js` 1256–1261). Do not invent a fire percent from it.

---

## 9. Events (`ctx.js`)

Frozen list comment: `ctx.js` 198–237.

Relevant emits:

| Type | Payload (live) | Toast? | Song? |
|---|---|---|---|
| `playerFire` | `{ weapon }` | no | yes (gun bark) |
| `npcFire` | `{ ship, weapon:'cannon', target? }` | no | yes (thin bark) |
| `playerHit` | `{ damage, family, fromAft, shielded? }` | no | yes (thud) + FORE/AFT flash |
| `commLine` | `{ text, from }` | yes (`text`) | no dedicated cue |
| `reticleLock` | `{ hit: boolean }` only | no | yes |
| `hostileEnter` | `{ id }` | no | bio family |

No `incomingMissile` / `missileWarn` type exists.

---

## 10. What is **not** live

- NPC seekers.
- Incoming-missile gauge / lock box / aspect ring / hub lamp.
- Chaff SKU.
- NPC `auto` turret.
- Power ledger / mass kg.
- A second player launcher catalog row.
- HUD `innerHTML` of weapon or comm copy.
- Digit 0 / 8 / 9 changes after Wave 68.

---

## 11. Coupling pins (code, not wish)

| Other brief | Live pin this inventory must not contradict |
|---|---|
| SHP-03 / Wave 68 | Player dart + auto turret shipped. NPC missiles were **out** of that impl so the no-gauge decision would not lie. |
| HUD-01 / HUD-02 | Empty hub. Toasts/banner off aim column. No incoming gauge. |
| TGT-05 | Player dart lock **is** `ctx.targets.current`. KeyV does not invent a missile lock box. | `combat.js` 1146–1152; `docs/Tgt05ReticleLockDesign.md` |
| PHY | Avoid = lookahead bias. Not missile dodge AI. | `npc.js` 587–635 |
| AI-04 | Hostility subset already exists. Dart fire must **not** widen who hunts. | `npc.js` 1065–1073 |
| Unknowables | Non-beam miss. | `state.js` 167–171 |
| BIO living HUD | `hudFamily` still `bio` on living. No new glance node. | `hud.js` 65–74 |
