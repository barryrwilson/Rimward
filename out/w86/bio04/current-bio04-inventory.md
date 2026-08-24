# BIO-04 live combat / weapons / HUD inventory

**Wave:** 86. Design only. Code wins over stale comments and over Wave 67 SHP-03 inventory (that file still says three groups).  
**Date:** 2026-08-21.  
**Scope:** WEAPONS catalog, combat groups/fire, Digit map, Unknowables ignore, hangar `hullKind`/`grafted`, HUD WPN/lead/range, `playerFire` ownership.  
**Not inventory of:** BIO-01 obtain, BIO-02 evolution, BIO-03 bake, NAV, Unknowables dock, police leave.

`state.js` is READ-ONLY this wave. Wave 68 PR0 remains the exclusive writer of `WEAPONS` / `MOUNT_TABLE` rows (`state.js` 9).

---

## 0. One-line result

Live fire Digits are **1 cannon, 2 disruptor, 3 mining, 4 missiles (`dart`)**. Turret is auto equipment, not a fifth fire Digit. Unknowables ignore non-beam. There is **no** psionic family, **no** power ledger, **no** psi resource.

---

## 1. WEAPONS catalog (`src/game/state.js`)

| Key | Name | Family | Beam? | Damage | ROF | Speed | Range | Heat/shot | Extra | Line |
|---|---|---|---|---|---|---|---|---|---|---|
| `cannon` | Energy cannon | `energy` | no | 8 | 6 | 900 | 500 | 4 | — | 98 |
| `disruptor` | Disruptor | `disruptor` | no | 10 | 2.5 | 700 | 350 | 6 | shield/engine ×2, hull ×0.25 | 99 |
| `mining` | Mining laser Mk I (stock) | `mining` | **`beam: true`** | 4 | 4 | 0 | 90 | 2 | `extractPerSec` 1.2; live numbers from `miningLaserFor` | 104–108 |
| `missile` | Dart rack | `missile` | no | 22 | 0.45 | 260 | 720 | 14 | `turn` 0.85 rad/s | 109–114 |
| `turret` | Auto turret | `energy` | no | 4 | 3 | 800 | 380 | 2 | seated SKU; not a Digit group | 115–118 |

- Catalog object: `state.js` 97–119.
- `HEAT`: `{ max: 100, coolPerSec: 12, overheatUnlockAt: 40 }` (`state.js` 120). **Only** heat resource on a ship state.
- `createShipState` (`state.js` 140–161): hull/screen/shell/engine/`heat`/`overheated`. **No** power, **no** psi, **no** weapon slots.
- `MOUNT_TABLE` (`state.js` 46–53): seat counts for `general` / `mining` / `scanner` / `qship` / `missile` / `turret`. No psionic seat.
- `applyHit` family lookup: `Object.hasOwn(WEAPONS, family) ? WEAPONS[family] : {}` (`state.js` 167–168). Combat passes `family: p.wkey` (`combat.js` 1581, 1640).

**Psionic row:** absent.

---

## 2. Unknowables ignore (beam rule)

`applyHit` (`state.js` 169–171):

```
if (isUnknowable(state.faction) && w.beam !== true) return [];
```

A projectile miss must not stall screen/shell recharge.

`isUnknowable` (`faction-style.js` 163–164): `faction === 'unknowables'`.

Combat projectile path **skips** Unknowable fields entirely (bolt is not consumed):

- `testNpcHits` (`combat.js` 1499–1500): `if (isUnknowable(s.state.faction)) continue;`
- `pickTurretTarget` (`combat.js` 1232): same skip.

Mining **is** the live beam family. `updateMining` pulls Unknowable locks in the reticle cone (`combat.js` 1311–1315) and ray-tests Unknowable ships (`combat.js` 1316–1347, 1338–1347). That is the only live “hit Unknowables” gun path.

NPC missiles: Unknowables never fire darts (`combat.js` 1738). Owner Wave 82: Unknowables never fire or eat darts (`docs/OwnerDecisionsWave82.md` NPC missiles).

**Implication for BIO-04:** a non-beam psionic bolt misses Unknowables twice (hit test skip + `applyHit` empty). A `beam: true` psionic would still need a mining-style ray path; inventory does **not** support a second beam. Fail-closed: psionics miss Unknowables.

---

## 3. Combat groups and fire (`src/systems/combat.js`)

| Surface | Today | Cite |
|---|---|---|
| Digit groups | `GROUP_WEAPON = { 1: 'cannon', 2: 'disruptor', 3: 'mining' }` | 182 |
| Group 4 | Seated launcher `wkey` (`dart` → `missile`). Empty → `null`. **No** `?? 'cannon'` | 183–184, 232–240 |
| Unknown group | `GROUP_WEAPON[g] ?? 'cannon'` — **group 5+ today falls through to cannon** | 239 |
| Family colors | energy cyan `0x53f2ff`, disruptor violet `0xc86bff`, mining green `0x51ff9e`, missile amber `0xff8a2a` | 185–186 |
| Bolt pool | 64 shared. Unknown family materials fall back to **energy** | 169, 413–432, 892–894 |
| Seeker pools | Player 8, NPC 4. Do not share the 64-bolt pool | 170–171 |
| Turret live cap | 2 bolts in the 64-pool | 172 |
| ROF clocks | `{ cannon, disruptor, missile, turret }` — no psionic slot | 862 |
| Player fire | LMB `fireHeld`, not docked, not destroyed, not overheated | 1666–1768, 1754–1767 |
| Mining | `wkey === 'mining'` → `updateMining` (no `playerFire`) | 1759–1760 |
| Missile | `WEAPONS[wkey].family === 'missile'` → `tryPlayerMissile` | 1761–1762 |
| Else gun | `firePlayerGun` + heat + `playerFire { weapon: wkey }` | 1763–1766, 1118–1126 |
| Turret | Auto, **not** a weapon group. `tryPlayerTurret` | 1771–1774, 1246–1265 |
| Docked | Weapons cold, sim frozen | 1666–1669 |
| `playerFire` | Only when a bolt/dart actually leaves a pool. Not dry-fire, heat-lock, mining, dropped shot | header 41–42, 89–90; 1123, 1209, 1263 |
| NPC `npcFire` | `weapon` `'cannon' \| 'missile'`. Missiles always set target | header 33–37; 1729–1751 |
| NPC bolt | `spawnNpcShot` refuses missile family | 1267–1270 |
| Heat | `addHeat` on player `heat` vs `HEAT.max` | 866–874 |
| Aim | Reticle ray + optional frontal lead converge `CONVERGE_DOT` 0.72 | 1088–1116 |
| `reducedMotion` | No new sparks; muzzle/ripple snap; bolts still simulate | 52–53, 924, 1794, 1861–1862 |

Launcher SKU (`src/game/weapon-fit.js` 33–44): only `dart` (`wkey: 'missile'`, `ammoMax` 8, `cost` 6500, `restockCost` 400).  
Turret SKU (`weapon-fit.js` 46–54): only `auto` (`wkey: 'turret'`, `cost` 4200).

---

## 4. Digit map (flight vs dock)

### 4.1 Flight (`src/systems/controls.js`, `src/core/ctx.js`)

| Digit | Tracked? | Effect |
|---|---|---|
| 1 | yes | `weaponGroup = 1` cannon |
| 2 | yes | `weaponGroup = 2` disruptor |
| 3 | yes | `weaponGroup = 3` mining (T also cycles rocks) |
| 4 | yes | `weaponGroup = 4` missiles if seated |
| 0, 5–9 | **no** | Not in `TRACKED` |

Cites: `TRACKED` `controls.js` 37–44; Digit handlers 289–301; help line 334 (`1/2/3/4 — weapon group: cannon / disruptor / mining / missiles`); `PREVENT_DEFAULT` is **Space only** (46–47).  
`ctx.input.weaponGroup` default **1** (`ctx.js` 83): `1=cannon 2=disruptor 3=mining 4=missiles`.  
LMB fire: window `mousedown` → `fireHeld` (`controls.js` 314–316).

### 4.2 Dock root (`src/systems/station.js`)

`DOCK_KEY_SERVICES` (`station.js` 174):

`['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard']`

Level-1 Digit (`station.js` 5710–5717): Digit **0** = last entry **shipyard**. Digit `n` = index `n-1`.

| Digit | Dock root service |
|---|---|
| 1 | market |
| 2 | jobs |
| 3 | bar |
| 4 | feed |
| **5** | **repair** |
| 6 | outfitting |
| 7 | people |
| **8** | **launch** |
| **9** | **epics** (Standing) |
| **0** | **shipyard** |

Comment at `station.js` 1555–1556: Digit 8 on dock root is Launch; Digit 9 is Standing.

### 4.3 Outfitting level 2 (`station.js` 5760–5770)

| Digit | Outfitting |
|---|---|
| 1 | cargo rack |
| 2 | scanner |
| 3 | concealed mounts |
| 4 | scanner 2 |
| 5–7 | mining heads Mk II–IV (`buyMiningLaser(n-4)`) |
| **8** | launcher papers (`armOutfitPapers`) |
| **9** | turret papers |

### 4.4 Shipyard level 2 (`shipyard-desk.js` 104–113)

Hull digits: index 7 → label `'0'`. Digit 0 remounts hangar index 7. Digits 3+ map hull indices. Digit 5 at the desk is a **hangar remount**, not a gun.

**Combat while docked is cold** (`combat.js` 1666–1669). A flight Digit 5 would not shoot at a desk.

---

## 5. HUD WPN / lead / range (`src/systems/hud.js`)

| Surface | Today | Cite |
|---|---|---|
| Groups 1–3 keys | `WEAPON_KEYS = ['cannon', 'disruptor', 'mining']` | 192 |
| `hudWeaponKey` | Group 4 → seated launcher wkey or `null`. Else `WEAPON_KEYS[g-1] ?? 'cannon'` | 195–203 |
| `weaponHudLabel` | `g · name`. Group 4: `4 · name · ammo` or `4 · —`. Mining names installed head | 206–221 |
| WPN rail | Label `WPN` + `textContent` on `.rw-value` | 810–812, 1728–1730 |
| Strain | Heat percent of `HEAT.max` (not a second resource) | 1731–1732 |
| Lead | Selected-weapon TOF. Mining hides (`speed` 0). Empty group 4 no cannon fallback | 1224–1249 |
| Range pop | `.in-range` from `WEAPONS[wKey].range` (mining uses head) | 1288–1298 |
| HUD family | `built` → `mech`; `living` / unset → `bio`. **HUD never writes `hullKind`** | 71–81; `ctx.js` 20 |
| Grafted HUD | Stays `mech` (built) | 77; hangar graft leaves `hullKind: 'built'` |
| Debug override | `sessionStorage['rw-hud-family']` mech\|bio — **family skin only** | 83–88 |
| Aim glass | Reticle + lead + bracket + edge arrow. **No** incoming gauge. **No** lock box. **No** new HUD tree | header 14–21; `HudUtilityChangeProposal.md` §2 rule 2 |
| `innerHTML` | **none** in `hud.js` / `combat.js` / `controls.js` / `station.js` (grep 0) | — |
| Incoming dart | Toast `Incoming dart.` — not an aim-glass gauge | `hud.js` 57–58 |

---

## 6. Hangar hullKind / grafted (`src/game/hangar.js`)

| Surface | Today | Cite |
|---|---|---|
| `graftedOwnTrue` | Own-key `grafted === true` only | 82–84 |
| Living / Unknowables | Never keep `grafted` | 93–108 |
| Row allowlist | `hullKind` `'living'\|'built'` else omit | 237–238 |
| Player heal | Extra tokens deleted. Unknowables → living | 405–413 |
| Mount sync | Row kind + Unknowables force living; copy grafted | 421–433 |
| Graft confirm | Mounted **built** only. Not Unknowables. Sets `row.grafted = true`. No remount | 731–764 |
| Flat row keys | `id`, faction, classKey, name, scanner, miningLaser, concealedMounts, launcher, turret, missileAmmo, cargo*, vitals, optional `hullKind` / `grafted` | 222–240 |
| Nested `loadout` | **Absent.** Unknown keys drop | Wave 64 flatten; SHP-03 |

World mirrors (`ctx.js` 156–160): `miningLaser`, `launcher`, `missileAmmo`, `turret`. No psionic mirror.

---

## 7. Player mesh / identity (`src/systems/ship.js`)

| Surface | Today | Cite |
|---|---|---|
| `meshKindFor` | Unknowables → living. `hullKind === 'built'` → built. Else living | 503–508 |
| Remount | Unknowables force `player.hullKind = 'living'` then branch | 514–528 |
| Living sculpt | `makeLivingHull` | 258 |

Starter `createShipState('light')` faction `independent` (`state.js` 146). **Do not** treat `isBeautiful(player.faction)` as the living test.

---

## 8. `playerFire` ownership (`src/core/ctx.js`)

| Surface | Today | Cite |
|---|---|---|
| Input writer | `controls.js` only | 15, 70–92 |
| `player.hullKind` | SHP / save.js write; HUD reads only | 20 |
| Combat mutates | Player/NPC **state** (damage, heat) | 18–19, 27 |
| `playerFire` | `combat.js` when a player cannon/disruptor/missile/turret shot actually spawns | 37, 232 |
| Event spread | `ctx.emit(type, data)` → `{ type, t, ...data }` | 248–249 |
| Frozen `npcFire` | `{ ship, weapon:'cannon'\|'missile', target }` | 233 |

No `playerFire` weapon token `psionic` today.

---

## 9. Named hole (old briefs — do not copy triad)

`docs/BioLivingShipsDesign.md` §6 (180–182): BIO-04 is a **named hole**. Conventional guns stay on living hulls and Abominations per SHP-03. **Do not design a three-resource triad in that old brief.**

Wishlist (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1090–1093): “Living and psionic weapon families remain to be designed. Psionic weapons are restricted to living ships and Abominations.”

SHP-03 (`docs/Shp03WeaponsDesign.md` 119–120): seat counts = mass; **power ledger out**; live `HEAT` + `heatPerShot`.

Wave 67 inventory line numbers and “three groups / no Digit4” are **stale**. This file is the Wave 86 source of truth.

---

## 10. What does **not** exist (fail-closed)

- `WEAPONS.psionic` / family `psionic` / `beam` psionic.
- Digit 5 (or 6/7) as a flight weapon group.
- Power / psi / G/S/E triad fields on `SHIP_CLASSES` or `createShipState`.
- Hangar key `psionic` / `psiAmmo` / `psiCap`.
- HUD incoming gauge, lock box, psi capacitor bar.
- NPC Beautiful / Unknowables psionic `npcFire`.
- Authoritative prices for a psionic SKU.
