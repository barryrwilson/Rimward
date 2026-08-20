# Current weapons and mounts inventory (Wave 67)

**Wave:** 67. Design only. No `src/` edits.  
**Rule:** code wins over stale comments. Every row cites `file:line`.  
**Scope:** player weapons, NPC fire, hangar flat fields, outfitter, HUD glance, Q-ship, persist.  
**Not this note:** missiles, turrets, mass-power as shipped features. They do **not** exist in code today.

Integrator: [`docs/Shp03WeaponsDesign.md`](../../../docs/Shp03WeaponsDesign.md).  
Merge law: [`shared-contract.md`](shared-contract.md). If this note and the contract conflict, the contract wins.

---

## 0. Law in one page

1. Three player groups: cannon, disruptor, mining. No fourth group.
2. Combat is projectile + one mining beam. No missiles. No player turrets.
3. Hangar rows are **flat**. Unknown keys drop. There is no nested `loadout`.
4. World `scanner` / `miningLaser` / `concealedMounts` are live **mirrors** of the mounted row.
5. HUD reads weapon state. Combat and SHP write it. HUD-02 skins are closed.
6. Digit 0 is Shipyard. Outfitting level-2 digits 1–7 are spent. Digits 1–9 on the dock root stay.
7. `state.js` is READ-ONLY for feature workers.

---

## 1. Catalog tables (`state.js`)

Header (`state.js` 7–8): this file is READ-ONLY for feature workers. Import. Do not modify. A worker that needs a change must report back.

### 1.1 `SHIP_CLASSES` (`state.js` 34–41)

| classKey | role | cruise | hull | shield | engine |
|---|---|---|---|---|---|
| `light` | player | 120 | 100 | 100 | 100 |
| `heavy` | combat | 90 | 160 | 140 | 120 |
| `freighter` | trade | 60 | 220 | 120 | 140 |
| `ace` | ace | 135 | 140 | 160 | 120 |
| `cutter` | pirate | 105 | 80 | 80 | 90 |
| `frigate` | capital | 22 | 900 | 600 | 300 |

There is **no** mount-count field, mass field, or power field on these rows.

### 1.2 `WEAPONS` (`state.js` 85–97)

| key | name | damage | rof | speed | range | heatPerShot | family | notes |
|---|---|---|---|---|---|---|---|---|
| `cannon` | Energy cannon | 8 | 6 | 900 | 500 | 4 | `energy` | player group 1 |
| `disruptor` | Disruptor | 10 | 2.5 | 700 | 350 | 6 | `disruptor` | `shieldMult` 2, `engineMult` 2, `hullMult` 0.25 |
| `mining` | Mk I label | from Mk I | 4 | **0** | Mk I | Mk I | `mining` | `beam: true`. Combat **does not** use this row’s numbers for the live head |

Comment at `state.js` 88–91: `applyHit` uses the family key. Combat reads the **installed** head via `miningLaserFor(ctx.world.miningLaser)`, never this row’s numbers.

There is **no** `missile` key. There is **no** `turret` key. `applyHit` (`state.js` 145–146) looks up `Object.hasOwn(WEAPONS, family)`. Family `'impact'` is not a `WEAPONS` key (`combat.js` 1392–1401). Unknowable hulls ignore non-beam hits (`state.js` 147–149).

### 1.3 `MINING_LASERS` (`state.js` 51–76)

Index **is** `ctx.world.miningLaser` (0..3). Comment at 47–48. `miningLaserFor` (`state.js` 79–82) heals a non-integer / out-of-range index to Mk I.

| Index | key | name | tier | cost |
|---|---|---|---|---|
| 0 | `mk1` | Mining laser Mk I | 1 | 0 |
| 1 | `mk2` | Bore laser Mk II | 2 | 1400 |
| 2 | `mk3` | Ferrous cutting head Mk III | 3 | 4200 |
| 3 | `mk4` | Deepcore lance Mk IV | 4 | 11000 |

### 1.4 Heat and defense

- `HEAT` (`state.js` 98): `{ max: 100, coolPerSec: 12, overheatUnlockAt: 40 }`.
- `tickShipState` (`state.js` 207–218) cools heat and clears overheat at 40.
- `createShipState` (`state.js` 118–139) builds vitals from `SHIP_CLASSES`. It does **not** attach weapons, launchers, ammo, or `hullKind`.

### 1.5 Q-ship

`HIDDEN_MOUNTS` (`state.js` 273–279): `{ cost: 900, bluffBase: 0.35, bluffPerFear: 0.01, failResolveBump: 20, calmSeconds: 90, demandMin: 50 }`.

---

## 2. Player fire path

Owner: `src/systems/combat.js`. Input owner: `controls.js` only (`ctx.js` 15, 80–81).

| Surface | Today | Cite |
|---|---|---|
| Groups | `{ 1: 'cannon', 2: 'disruptor', 3: 'mining' }` | `combat.js` 169 |
| Keys | Digit1 / Digit2 / Digit3 set `input.weaponGroup` | `controls.js` 150–158 |
| Hold fire | LMB → `input.fireHeld` | `controls.js` 171–173 (mousedown), 250 (`input.fireHeld = fireDown`); `ctx.js` 80 |
| Docked | Weapons cold. Mining FX hidden. Early return. | `combat.js` 1376–1379 |
| Gate | `fireHeld` and player not destroyed and not overheated | `combat.js` 1456–1458 |
| Select | `GROUP_WEAPON[weaponGroup] ?? 'cannon'` | `combat.js` 1459 |
| Mining | `updateMining` uses `miningLaserFor(ctx.world.miningLaser)` every call | `combat.js` 1028–1031, 1460–1461 |
| Guns | ROF via `nextFireAt` (`cannon`, `disruptor` only). Then `firePlayerGun` | `combat.js` 745–746, 1462–1465 |
| Aim | Reticle ray, not ship −Z. Optional lead converge in frontal cone `CONVERGE_DOT` 0.72 | `combat.js` 23–25, 167, 969–995 |
| Bolt | Pooled projectile. Speed / range / damage from `WEAPONS[wkey]` | `combat.js` 760–787 |
| Heat | `addHeat(w.heatPerShot)` even if pool is exhausted | `combat.js` 750–757, 997–1001 |
| Event | `playerFire { weapon }` only when a cannon/disruptor bolt **spawns**. Not mining. Not dry-fire. | `combat.js` 36–37, 84–85, 997–999; `ctx.js` 35, 212 |
| Pool | `POOL_SIZE = 64`. Exhausted shot drops. No allocation. | `combat.js` 159, 787 |
| NPC | `npcFire` → `spawnNpcShot`. Default weapon `'cannon'`. ±2° error. | `combat.js` 31–33, 1004–1024, 1439–1453; `npc.js` 40, 1509, 1869 |

There is **no** guided seeker, lock-on timer, ammo decrement, or turret loop.

---

## 3. HUD (HUD-02 closed)

HUD reads. HUD does not write weapon state, `hullKind`, or `input.throttle`.

| Instrument | Rule | Cite |
|---|---|---|
| Family | `hudFamily` → `mech` \| `bio` from `hullKind` / debug / Beautiful fall-through | `hud.js` 65–74 |
| Debug | `sessionStorage['rw-hud-family']` `mech`\|`bio` only. Not save. | `hud.js` 76–81 |
| `WEAPON_KEYS` | `['cannon', 'disruptor', 'mining']` maps groups 1..3 | `hud.js` 185 |
| WPN | `weaponGroup · name`. Group 3 uses `miningLaserFor(ctx.world.miningLaser).name`. `textContent`. | `hud.js` 1427–1435 |
| Heat strain | Aux Heat panel. `player.heat / HEAT.max` | `hud.js` 703–707, 1436–1437 |
| Lead | Selected-weapon TOF. Hide when `wSpeed === 0` (mining) or no live ship lock. Not auto-aim. | `hud.js` 994–1020 |
| RANGE | Hub word when `targetDistNow` ≤ selected range. Mining uses installed head range. | `hud.js` 1059–1071 |
| Cadence | Nodes once. Transforms per frame. Text ~5 Hz. | `hud.js` 18–20 |

HUD-01 / HUD-02 **forbid** lock box, missile timer, incoming-missile gauge (`docs/Hud02IdentitiesDesign.md` 74–75; `docs/HudUtilityChangeProposal.md` 101, 247, 417). Rails must not obscure aim (`HudUtilityChangeProposal.md` 318).

Plant / Flight / Heat stay `.rw-aux` and fade in combat. There is no G/S/E power triad.

---

## 4. Hangar fields (flat)

`src/game/hangar.js`. Wave 64 shipped sanitize / park / `writeMountedGear`.

`sanitizeHangarRecord` (`hangar.js` 123–148) builds a **fresh literal**. It copies only known keys. Unknown keys (including a nested `loadout`, a missile rack, `__proto__`) **drop**.

Allowlisted hull keys today:

| Key | Heal | Cite |
|---|---|---|
| `id` | `SAFE_ID`, not reserved | `hangar.js` 75–78, 125–126 |
| `hullKind` | `'living'` \| `'built'` else omit; Unknowables force `'living'` | `hangar.js` 144–146, 65–67 |
| `faction` | `sanitizeFaction` | `hangar.js` 128–129 |
| `classKey` | key of `SHIP_CLASSES` else `'light'` | `hangar.js` 31–33, 127 |
| `name` | strip + cap | `hangar.js` 69–72, 136 |
| `scanner` | `0\|1\|2` else 0 | `hangar.js` 35–37, 137 |
| `miningLaser` | `0\|1\|2\|3` else 0 | `hangar.js` 39–41, 138 |
| `concealedMounts` | literal `true` else false | `hangar.js` 43–45, 139 |
| `cargoCapacity` | finite ≥ 20 else 20 | `hangar.js` 47–49, 131 |
| `cargo` | `sanitizeCargoList` then trim | `hangar.js` 141 |
| vitals | from class maxes | `hangar.js` 81–97, 130, 142 |

`writeMountedGear` (`hangar.js` 346–368) patches only `scanner` / `miningLaser` / `concealedMounts` / `cargoCapacity`. Other patch keys are ignored.

`packLiveHull` (`hangar.js` 150–178) parks those same gear keys from **world mirrors**. `loadMountedRow` (`hangar.js` 496–500) copies them back to world. Swap isolation is real for the three ladders.

Yard stock (`shipyard.js` 138–163) seeds `scanner: 0`, `miningLaser: 0`, `concealedMounts: false`. No launcher. No turret.

There is **no** `MOUNT_TABLE` in `src/`. Wave 63 sketched counts in `out/w63/shp-03-loadouts.md` §4. That table is **not** code.

---

## 5. Persist

`WORLD_FIELDS` (`save.js` 73–92) includes `scanner`, `concealedMounts`, `miningLaser`, `hangar`. Comment at 87–88 says `ctx.world.miningLaser` is the only writer target. **Code wins:** `writeMountedGear` writes the hangar row, then the world mirror (`hangar.js` 355–357).

`snapshot()` copies `WORLD_FIELDS` plus wholesale `player` (`save.js` 184–192). `sanitizeRestored` (`save.js` 305–315):

- `concealedMounts !== true` → `false`
- scanner not in `[0,1,2]` → `0`
- miningLaser not in `[0,1,2,3]` → `0`

`input.weaponGroup` is **not** persisted (`ctx.js` 81; Wave 63 contract §1.1).

Later weapons keys (not in tree today) use **one** ammo heal, copied here so this note cannot drift from the contract: if `launcher === ''` → `0`. Else if `Number.isInteger(value)` and `value >= 0` → `Math.min(value, catalogMax(launcher))`. Else `0`. Do not trunc. Same integer class as scanner (`hangar.js` 35–37; `save.js` 306–309).

`sessionStorage['rw-hud-family']` is HUD debug. It is not a weapon store.

---

## 6. Dock desk

Shipped (`station.js` 122):

```js
export const DOCK_KEY_SERVICES = Object.freeze([
  'market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard',
]);
```

Level-1 (`station.js` 2406–2413): Digit 1–9 map index `N-1`. Digit **0** selects the last key (`shipyard`). `KeyY` also opens shipyard (`station.js` 2405). Labels (`station.js` 2334): Market, Jobs board, Bar, Feed & tend, Repair, Outfitting, People, Launch, Standing, Shipyard.

| Digit (level 1) | Index | Key |
|---|---|---|
| 1 | 0 | `market` |
| 2 | 1 | `jobs` |
| 3 | 2 | `bar` |
| **4** | 3 | **`feed`** (Feed & tend). Not Outfitting. |
| 5 | 4 | `repair` |
| **6** | 5 | **`outfitting`** |
| 7 | 6 | `people` |
| 8 | 7 | `launch` |
| 9 | 8 | `epics` (Standing) |
| **0** | last | **`shipyard`** |

Outfitting is Digit **6** on the dock root. Level-2 outfitting (`station.js` 2448–2454, `renderOutfitting` 2062–2108):

| Digit (in outfitting) | Action | Confirm? |
|---|---|---|
| 1 | Expand hold | No. One key debits. |
| 2 | Wolfeye Mk I (400 UU) | No |
| 3 | Concealed mounts (900 UU) | No |
| 4 | Wolfeye Mk II (900 UU) | No |
| 5 / 6 / 7 | Mining Mk II / III / IV | No. Deepcore 11000 UU is still one key. |
| 8, 9, 0 | unused in outfitting | — |

Shipyard hull buy **does** confirm (`shipyard-desk.js` 93–125, 198–201): Digit 3+ selects papers. It does not debit. **Confirm papers** buys.

---

## 7. Q-ship / hail

- Outfitter writes `concealedMounts: true` via `writeMountedGear` (`station.js` 1689–1695).
- `npc.js` `demandIntentsFor` (`npc.js` 1296–1298) offers `showTeeth` only when `ctx.world.concealedMounts === true`.
- `hail.js` 247–260 rolls `HIDDEN_MOUNTS.bluffBase + fear * bluffPerFear`.
- Concealed mounts do **not** hide combat VFX. They are a hail bluff flag.

---

## 8. Events (frozen list)

`ctx.js` 191–219 documents frozen event types. Weapon-related live events:

- `playerFire { weapon }` — real cannon/disruptor spawn
- `npcFire { ship, weapon, target }` — NPC request; combat spawns the bolt
- `playerHit` / `npcHit` / `shieldDown` / `engineOut`
- `mineBlocked` / `mineHit`
- `hudMechRange` on RANGE rising edge

There is **no** `missileFire`, `missileIncoming`, or `turretFire`. New names are not frozen until an impl wave edits `ctx.js`.

---

## 9. Wishlist vs code

| Wishlist | Code today |
|---|---|
| SHP-03 first slice (flat gear) | **Shipped** Wave 64. `hangar.js` + world mirrors. |
| Missiles + launcher hardpoints | **Absent.** |
| TGT-04 turrets / automatic guns | **Absent.** NPC fire is AI `npcFire` cannon only. |
| Mass / power / heat-per-fit | **Absent.** Heat is one ship pool (`HEAT`). |
| TGT-03 remaining (missile warnings, subsystem targeting) | **Out of Wave F.** Arc only. |
| HUD-02 | **Closed.** Skins shipped. |
| Digit 0 Shipyard | **Shipped.** |
| POD-02 | **Shipped** Wave 66. Do not reopen. |
| Remount-on-buy | **Rejected.** Buy adds a hangar row. |

`docs/ShpDesign.md` §5 / non-goals still say no missiles / no turrets / no mass-power **for the Wave 64 first slice**. That slice shipped. This inventory is the baseline for a **later** weapons wave. `docs/Shp03WeaponsDesign.md` supersedes the Wave 63 “no missiles” freeze **for that later wave only**. Do not edit `docs/ShpDesign.md`.

---

## 10. Stale comments (code wins)

| Comment | Code |
|---|---|
| `save.js` 87–88 “`ctx.world.miningLaser` is the only writer target” | `writeMountedGear` writes hangar then world (`hangar.js` 355–357). Outfitter uses that path (`station.js` 1712). |
| Wave 63 SHP-03 nested `loadout` | Rejected. Flattened. `sanitizeHangarRecord` has no `loadout` child. |
| Wave 63 “no missiles” as forever law | First-slice law. Not a ban on a later serial wave. |
