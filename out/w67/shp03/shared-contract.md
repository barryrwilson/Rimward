# SHP-03 weapons / mounts shared contract

**Wave:** 67. Design only. No missiles, turrets, HUD gauges, or `src/` in this wave.  
**Status:** MERGE LAW for the integrator. If a sibling note and this file conflict, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit the wishlist, `PROGRESS.md`, or historical `docs/ShpDesign.md`.  
**Locked sources:** live code cited in [`current-weapons-inventory.md`](current-weapons-inventory.md); `docs/ShpDesign.md` first-slice flatten law; `docs/Hud02IdentitiesDesign.md` HUD-02 closed; `docs/HudUtilityChangeProposal.md` HUD-01 aim glass; `docs/PLAYER-EXPERIENCE-WISHLIST.md` SHP-03 / TGT-03 remaining / TGT-04; Wave 63 [`out/w63/shared-contract.md`](../../w63/shared-contract.md) persist + Digit 0; Wave 64 hangar flatten in `src/game/hangar.js`.

`docs/ShpDesign.md` remains the **first-slice** record (Wave 63/64). It still says no missiles. **This contract supersedes that “no missiles” freeze for a later implementation wave only.** The first slice stays shipped without missiles.

---

## 0. Law in one page

1. Hangar rows stay **flat**. No nested `loadout`. Unknown keys drop on sanitize.
2. `state.js` stays READ-ONLY for parallel feature PRs. New `WEAPONS` / class / `MOUNT_TABLE` rows land in a **serial dedicated PR**, not a sibling feature PR.
3. HUD-02 is closed. HUD reads. SHP / combat write weapon state. No HUD-03 free skin checkbox. No incoming-missile gauge.
4. Digit 0 is Shipyard. Digits 1–9 stay. Missile / turret shops grow **Outfitting** (level 2). Do not add a dock service. Do not fold launchers into Shipyard.
5. Confirm-before-debit for every new launcher and turret SKU (same papers law as hull buy). Existing Digit 1–7 outfitter one-shots stay.
6. Persist allowlist only. No `sessionStorage` weapon debug that becomes save state.
7. XSS: `textContent` only for names and catalog copy. No `innerHTML`.
8. Missiles are a weapon class with launcher hardpoints. Turrets need compatible mounts. Living ships may accept conventional parts without flipping `hullKind`. HUD stays bio when living.
9. Mass / power / heat-per-fit: **seat counts are the mass law**. Power ledger is **out** of the first impl wave. Heat-per-fit ledger is **out**. Live heat stays the shipped `HEAT` pool plus catalog `heatPerShot`.
10. Do not reopen POD-02, HUD-02 Q1–Q3, or remount-on-buy.

---

## 1. Persist (flat keys)

### 1.1 First-slice keys (already shipped — do not nest)

Keep Wave 64 row shape (`hangar.js` 132–147; `out/w63/shared-contract.md` §1.2):

`id`, `hullKind`, `faction`, `classKey`, `name`, `scanner`, `miningLaser`, `concealedMounts`, `cargoCapacity`, `cargo`, vitals.

World mirrors stay on `WORLD_FIELDS`: `scanner`, `miningLaser`, `concealedMounts`, `hangar` (`save.js` 73–92).

### 1.2 New flat keys (later impl wave)

Add **three** own keys on each hangar row. Do **not** wrap them in `loadout`.

| Key | Type | Heal | Default (stock / missing) |
|---|---|---|---|
| `launcher` | string id | Own key of authored `LAUNCHER_IDS`. Else `''` | `''` (no rack) |
| `missileAmmo` | integer | **`healMissileAmmo` (one law).** If `launcher === ''` → `0`. Else if `Number.isInteger(value)` and `value >= 0` → `Math.min(value, catalogMax(launcher))`. Else `0`. Do not trunc. `'2'` / `2.9` → `0` (same class as scanner `'2'` → 0, `hangar.js` 35–37; `save.js` 306–309). `99` with dart → `ammoMax`. | `0` |
| `turret` | string id | Own key of authored `TURRET_IDS`. Else `''` | `''` |

Rules:

- `sanitizeHangarRecord` copies these three if present **and** valid. Any other key still drops (`__proto__`, `loadout`, `damage`, `rof`, `mass`, `power`).
- Do not persist combat stats (`damage`, `rof`, `speed`, `range`, `heatPerShot`, blast, seeker turn). Combat looks up catalog / `WEAPONS`.
- `missileAmmo` is **not** a career pool. It parks with the hull. Swap must not copy ammo onto the incoming hull.
- Stock yard rows (`shipyard.js` `buildStockRow`) seed `launcher: ''`, `missileAmmo: 0`, `turret: ''`.
- Legacy hangar rows without the keys heal to empty / 0. Do not invent a free rack.
- `freshStart` starter: empty launcher, 0 ammo, empty turret.
- Player record must **not** grow unsanitized `launcher` / `turret` extras. If a stray `player.launcher` appears, delete it on heal.

### 1.3 World mirrors

First impl wave **keeps** write-through mirrors so combat / HUD / hail do not fork in one PR:

| Live mirror | Source |
|---|---|
| `ctx.world.scanner` / `miningLaser` / `concealedMounts` | unchanged |
| `ctx.world.launcher` | mounted row `launcher` |
| `ctx.world.missileAmmo` | mounted row `missileAmmo` |
| `ctx.world.turret` | mounted row `turret` |

Add the three new names to `WORLD_FIELDS` in **PR1** (persist), not in a parallel combat PR.

`LAUNCHER_IDS` / `TURRET_IDS` live in new `src/game/weapon-fit.js` and land **with PR0** (same serial PR as `state.js` tables). PR1 **imports** that module (read). It does not edit `state.js`. An unknown id on an older build that lacks the SKU fails closed to `''`.

Heal on restore (same class as scanner / miningLaser):

- `launcher` not an own key of `LAUNCHER_IDS`, or length > `ID_MAX` (64), or reserved id → `''` (and ammo 0)
- `turret` same rule vs `TURRET_IDS`
- `missileAmmo`: **same `healMissileAmmo` as §1.2.** If `launcher === ''` → `0`. Else if `Number.isInteger(value)` and `value >= 0` → `Math.min(value, catalogMax(launcher))`. Else `0`. Do not trunc. `'2'` / `2.9` → `0`. `99` with dart → `ammoMax`.

**Restore order (mandatory):**

1. Copy `WORLD_FIELDS` as today (`save.js` 387–389).
2. `sanitizeHangar(ctx)` (rebuilds rows from allowlist; drops unknown keys).
3. `healPlayerHullKind` + `syncMountedToPlayer` as today.
4. **Overwrite** `ctx.world.launcher` / `missileAmmo` / `turret` from the **mounted hangar row**. The world blob must not win a dart that the row does not have.
5. If hangar is missing / rebuilt to starter: force the three mirrors to `''` / `0` / `''`.

`packLiveHull` / `loadMountedRow` / `writeMountedGear` / `captureSwitch` must grow with these keys. Unknown patch keys on `writeMountedGear` still ignore.

Combat ammo spend uses one helper (name e.g. `spendMissileAmmo(ctx, n)` in `hangar.js`): decrement mounted row **and** world mirror together, clamp to 0. Do not write only the world key and wait for `parkMounted`. Snapshot still parks first (`save.js` 180–181); the helper keeps a mid-fight hangar row honest if a swap/desk path reads the row before park.

### 1.4 Forbidden persist

| Surface | Forbidden because |
|---|---|
| Nested `hull.loadout` | Wave 64 flatten. Unknown keys drop. Wave 63 verifier MEDIUM. |
| Save-supplied `damage` / `rof` / seeker rates | Combat stats are code. |
| `sessionStorage` missile debug copied to save | Same class as `rw-hud-family`. Session only if an impl debug exists. Never a hangar field. |
| `ctx.input.weaponGroup` | Session. Groups 1–3 exist; group 4 is also session. |
| `ctx.config.ship` | Envelope already forbidden. |
| HUD family / settings skin | HUD-02 Q3 closed. |
| New `localStorage` weapons key | Hangar rides `{v:1}`. |
| Mass / power numbers on the row | No mass-power ledger in first impl wave (§5). |

---

## 2. Desk (Outfitting grows)

### 2.1 Dock digits (frozen)

`DOCK_KEY_SERVICES` (`station.js` 122) already has ten keys. Digit **0** is Shipyard. Digits 1–9 stay Market…Standing.

- Do **not** append an eleventh dock service for missiles.
- Do **not** insert mid-list.
- Do **not** sell launchers on the Shipyard Yard pane (that pane sells hulls with Confirm papers).

### 2.2 Outfitting level 2

Existing Digit 1–7 stay the hold / Wolfeye / concealed / mining ladder (`station.js` 2448–2454). Do not remap them.

Gate: **only** `ui.level === 2 && ui.service === 'outfitting'`. The live level-2 chain already sits after the level-1 return (`station.js` 2403–2454). Digit 8 on level 1 is **Launch**. Digit 9 on level 1 is **Standing**. A weapons PR that binds 8/9 on the dock root steals those services. Fail closed: do not add a global Digit8 handler.

Later impl:

| Digit (outfitting level 2 only) | Role |
|---|---|
| 1–7 | unchanged |
| **8** | Launcher: offer / restock. Confirm papers before debit. |
| **9** | Turret: offer. Confirm papers before debit. |
| 0 | unused in outfitting (Digit 0 is Shipyard on level 1; do not bind it here) |

If a later catalog has more than one launcher SKU, Digit 8 opens a short list; pane-local digits or click picks the SKU; **Confirm papers** still debits. Do not steal dock Digit 8 (`launch`) or Digit 9 (`epics`).

Hail Digit1–9 overlap with weapon groups is a **known** overlap (`hail.js` 403–404). Group 4 uses Digit4 in **flight**, same pattern as 1–3. Do not change hail.

### 2.3 Confirm-before-debit

Hull buy: Digit 3+ selects papers; Confirm papers debits (`shipyard-desk.js` 198–201).

**Every new launcher and turret SKU** uses that papers law. A Digit 8/9 press must **not** one-shot a debit. Esc cancels pending papers (`station.js` 2418 already cancels yard pending; extend the same pattern for outfitter pending).

Existing Digit 1–7 one-shots (including Deepcore 11000 UU) stay. Do not reopen them in this wave.

Price is authored catalog + live `ctx.world.credits`. Do not read cost from the save. Re-check purse on confirm. Integer UU. No negative purse. One debit in flight.

Ammo restock is also confirm if the restock price is ≥ 400 UU; cheaper restock may one-shot **only** if the catalog row says `confirm: false`. Default: **confirm** for restock too (fail closed).

---

## 3. HUD (closed skins, open WPN text)

HUD-02 Q1–Q3 stay final. HUD never writes `hullKind`, `faction`, `classKey`, `launcher`, `turret`, ammo, or `input.throttle`.

| Allowed in first weapons impl | Forbidden |
|---|---|
| WPN text grows: `4 · <launcher name> · <ammo>` when group 4 is selected | New HUD tree, lock box, aspect ring, 13 s timer |
| RANGE uses selected launcher `range` | Incoming-missile gauge, missile wedge edge-arrow restyle |
| Lead uses selected launcher `speed` (TOF, same as cannon) | Turret reticles, second MATCH, HUD-03 skin checkbox |
| Empty group 4: keep prior WPN / or `4 · —` | `innerHTML` of catalog names |

**Incoming-missile gauge: frozen OFF.** HUD-01 rails must not obscure aim (`docs/HudUtilityChangeProposal.md` 318). HUD-02 lists the gauge as a non-goal (74–75). Existing `playerHit`, FORE/AFT flash, and toasts already mark incoming fire. A center or hub missile lamp would add glance chrome the aim glass does not have room for. TGT-03 “missile warnings” stay later, not this impl wave.

Plant / Flight / Heat stay `.rw-aux`. Do not add a mass or power bar.

---

## 4. Combat families (later impl, grounded in live combat)

### 4.1 Missiles

- New `WEAPONS` family **`missile`** (dedicated `state.js` PR). Not hitscan. Not a beam. Unknowables stay immune (`state.js` 147–149) unless a later owner reopens that law (default: **do not**).
- Seat: hangar `launcher` id on a hull whose `classKey` has `MOUNT_TABLE.missile > 0`.
- Fire: new **weapon group 4** (`controls.js` Digit4 while not docked). `GROUP_WEAPON[4] = 'missile'` (or the seated launcher’s `wkey`). If `launcher === ''` or ammo 0 or overheated or docked: no shot, no ammo spend, no heat.
- Lock: **existing** `ctx.targets.current` live ship. No new lock instrument. Refuse fire without a live ship lock in selected range (RANGE already uses that range).
- After spawn: seek that object with a **capped turn rate**. If the lock dies or despawns, go ballistic on last velocity. Player can dodge NPC bolts today (`combat.js` 19–21); the same dodge is the counterplay. **No chaff** in the first impl wave.
- Ammo: decrement `missileAmmo` on a successful spawn (same gate as `playerFire`: bolt actually left a pool). Park ammo on the hangar row.
- Pool: **separate** small missile pool (cap **8** live). Do not share the 64-bolt pool (`combat.js` 159) or cannon fire starves.
- NPC: **no** player-facing NPC missiles in the first impl wave. `npcFire` stays cannon (`npc.js` 1509). This is the other half of “no incoming gauge”.
- Heat: `heatPerShot` into the existing player `HEAT` pool.

Proposed event `missileFire { weapon }` is **not frozen** until the impl wave edits `ctx.js`. Until then, combat may reuse `playerFire { weapon: 'missile' }` if the serial owner prefers zero new types. Default: reuse `playerFire` (no ctx.js event-list growth required). Prefer that default.

### 4.2 Turrets (TGT-04)

- Seat: hangar `turret` id on a hull with `MOUNT_TABLE.turret > 0`.
- Turrets are **automatic guns**, not a player weapon group. They do not steal Digit1–3 or Digit4.
- Fire loop in `combat.js`: if seated, not docked, player not destroyed, not overheated, pick nearest **hostile** ship in the forward cone (`CONVERGE_DOT` 0.72, same as gun converge) and in turret range. Spawn a **cannon-family** bolt (or a dedicated `WEAPONS.turret` row from the dedicated `state.js` PR) at a low ROF. Shared heat.
- This is auto-**fire**, not auto-**aim** of the player’s selected gun. Do not write the reticle, MATCH, or `input.throttle`. Do not snap group 1–2 shots onto the turret target.
- Lead pip / RANGE continue to follow the **selected** group only.
- NPC: no player-equivalent turret on NPCs in the first impl wave (NPC already auto-fires cannon).
- Living hull: a living `heavy` / `ace` / `frigate` may seat a turret. `hullKind` stays `'living'`. HUD stays `bio`.

### 4.3 Mount table (mass law)

Implement as frozen `MOUNT_TABLE` next to `SHIP_CLASSES` in the dedicated `state.js` PR. Do not read counts from the save. Unknown `classKey` → `light`.

| classKey | general (shipped) | mining | scanner | qship | missile | turret |
|---|---|---|---|---|---|---|
| `light` | 2 | 1 | 1 | 1 | **0** | **0** |
| `cutter` | 2 | 1 | 1 | 1 | **0** | **0** |
| `freighter` | 2 | 1 | 1 | 1 | **0** | **0** |
| `heavy` | 2 | 1 | 1 | 1 | **2** | **2** |
| `ace` | 2 | 1 | 1 | 1 | **2** | **1** |
| `frigate` | 2 | 1 | 1 | 1 | **4** | **4** |

First impl SKU count: **at most one** launcher id seated (`launcher` is a single string, not an array), even if `missile > 1`. Extra missile seats stay empty until a later wave persists a second id. Same for turret: **one** `turret` string. Counts > 1 reserve the class; they do not ship multi-rack UI in the first impl wave.

Outfitter refuses a SKU the class table does not allow. A tampered `launcher` on a `light` row sanitizes to `''`.

General mounts stay cannon + disruptor. Do not unequip them. Do not persist a `general` array (flatten law).

---

## 5. Mass / power / heat-per-fit

**Minimal mass law (in):** `MOUNT_TABLE` seat counts + single-string seats. That is the entire mass budget for the first impl wave. A light cannot carry a dart rack because `missile === 0`, not because a kg ledger said so.

**Power ledger (out):** `SHIP_CLASSES` has no power field (`state.js` 34–41). Plant / Flight / Heat stay HUD aux (HUD-02). A power triad would add persist numbers, HUD chrome, and a `state.js` budget in the same wave as seekers. First impl wave must not wait on it.

**Heat-per-fit ledger (out):** do not persist a heat-capacity per module. Catalog rows keep `heatPerShot`. The ship keeps one `HEAT` pool (`state.js` 98). Overheat already locks player guns (`combat.js` 1458). Turrets and missiles obey that same lock.

**Ammo (in, missiles only):** hull `missileAmmo`. Cannon / disruptor / mining / turret stay heat-limited with no magazine.

Reason this is not a hand-wave: live code already gates fire with heat, ROF, range, and class vitals. Seat counts plus ammo plus price plus confirm are four independent bounds. A kg/kW sim would be a new subsystem with no current fields.

---

## 6. Living ships and identity

- Mount counts are by `classKey`, not `hullKind`.
- Conventional launcher / turret / cannon / disruptor / mining / Wolfeye / concealed may seat on `hullKind: 'living'`.
- Weapons do **not** pick the HUD. Unknowables stay `'living'` on every path (Wave 64).
- Do not require BIO-02 growth-center.
- Do not strip the living starter’s cannon or disruptor.
- `ctx.bio` is not a mount.

---

## 7. Security

Threat model: local browser game. Save tamper, XSS, prototype keys, trusting blob price / ammo / class seats.

- Allowlist `launcher` / `turret` ids with `Object.hasOwn` on authored tables. `SAFE_ID` is not enough (`constructor` matches).
- Fresh hangar literals. Never `Object.assign(row, raw)`.
- Catalog price at debit time. Live credits. Live `MOUNT_TABLE[classKey]`.
- `textContent` for SKU names, lines, notices (`station.js` `h()` 1450-class). No `innerHTML` of catalog copy.
- Cap ammo. Cap missile pool. Cap hangar 8 (unchanged).
- Do not eval JSON. Do not persist functions.

---

## 8. Events and `ctx.js`

Event types are frozen (`ctx.js` 32–33, 191–219).

Default for first impl: **reuse** `playerFire { weapon }` with `weapon: 'missile'` or the turret `wkey`. No new persist event for ammo or hull swap.

If the impl owner needs a distinct type, name it `missileFire { weapon }` or `turretFire { weapon }` in the PR that **edits** `ctx.js`. It is **not frozen** by this design wave.

Do not add `missileIncoming`.

---

## 9. Parallel-safety (later impl wave)

| File | Rule |
|---|---|
| `src/game/state.js` | Dedicated serial **PR0** only. Feature PRs may **import**. They must not modify this file. |
| `src/game/weapon-fit.js` (new) | Lands **with PR0**. Ids, prices, ammoMax, `canSeat`. Not persist. |
| `src/game/save.js` | PR1 persist fields. One owner. Imports fit ids (read). |
| `src/game/hangar.js` | PR1 sanitize + PR2 mutator. Coordinate; do not fork `sanitizeHangarRecord`. |
| `src/systems/station.js` | PR3 desk. Digit 1–9 and Digit 0 stay. Outfitting 8/9 only. |
| `src/systems/combat.js` | PR3 fire. No missiles in a persist-only PR. |
| `src/systems/hud.js` | PR4 read only. |
| `src/systems/controls.js` | PR3 Digit4 group. Flight only. |
| `src/core/ctx.js` | Comment if group 4 / world mirrors need a note. No new persist event by default. |
| `src/systems/settings.js` | No change. |
| `scripts/boot-test.mjs` | PR5 only. |

Serial write-sets must **not** all touch `state.js`. Only the dedicated catalog PR writes it.

---

## 10. Do not reopen

- POD-02 trafficking / People Digit 7 sale.
- HUD-02 Q1–Q3 (family from hull, Unknowables living, no free skin).
- Remount-on-buy (buy still adds a hangar row).
- Mid-list dock insert.
- Nested loadout.
- Wave 64 Digit 0 Shipyard mapping.

---

## 11. Open owner questions (defaults)

Implementers use the default unless the owner overrides this file.

| # | Question | Default |
|---|---|---|
| 1 | Incoming-missile gauge? | **Off.** HUD-01 aim glass. |
| 2 | NPC missiles in first impl? | **No.** |
| 3 | Multi-rack arrays in persist? | **No.** One `launcher` string, one `turret` string. |
| 4 | Mass/power ledger? | Seat counts only. Power out. |
| 5 | New `ctx` event? | Reuse `playerFire`. |
| 6 | Digit4 hail overlap? | Accept. Same as Digit1–3. |
| 7 | Unknowables vs missiles? | Non-beam miss (`applyHit` law). |
| 8 | Confirm on ammo restock? | **Yes.** |
| 9 | Light missile seat? | **0.** |
| 10 | Where is the shop? | Outfitting 8/9. Not Shipyard. |
