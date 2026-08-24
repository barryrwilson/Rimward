# NPC turrets shared contract

**Wave:** 97. Design only. No `src/` in this wave.  
**Status:** MERGE LAW for the integrator. If a sibling note and this file conflict, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit the wishlist, `PROGRESS.md`, [`docs/NpcMissilesDesign.md`](../../../docs/NpcMissilesDesign.md), [`docs/Shp03WeaponsDesign.md`](../../../docs/Shp03WeaponsDesign.md), `docs/Shp*.md`, `docs/Tgt*.md`, `docs/Hud*.md`, `docs/Bio*.md`, `docs/Nav*.md`, `docs/OwnerDecisions*.md`, or sibling `out/w97/tgt03/**` / `out/w97/bio05/**`.  
**Locked sources:** live code cited in [`current-npc-turrets-inventory.md`](current-npc-turrets-inventory.md); player `auto` as shipped Wave 68; Wave 83 pirate+ace darts; HUD-01 empty hub; AI-04 `mayHuntPlayer`; Wave 57 hit-test split.

[`docs/NpcMissilesDesign.md`](../../../docs/NpcMissilesDesign.md) remains the **NPC darts** record (Wave 75 design / Wave 83 impl). It still says NPC `auto` turret stays out. **This contract supersedes that freeze for a later implementation wave only.** Wave 68 and Wave 83 stay complete. Do **not** edit `docs/NpcMissilesDesign.md`.

---

## 0. Law in one page

1. **HUD-01 / HUD-02 stay closed.** No incoming turret gauge, lock box, aim-glass pip, aspect ring, or new `#hud` glance node. Empty 80 px hub stays empty. FORE/AFT stays `playerHit` only.
2. Player `auto` SKU, Digit 8/9 papers, hangar `turret` mirror, and `tryPlayerTurret` **stay**. NPC fire must not write hangar or grant the player free ammo / a free SKU.
3. NPC turret fire is **not** a player SKU. Do **not** add a second `TURRET_IDS` row. Reuse `WEAPONS.turret` + the 64-bolt energy path. Default: **no** new `WEAPONS` key. A fork is owner-open and needs a dedicated `state.js` PR **before** fire — do not invent numbers here.
4. Who fires is a **fail-closed** subset. Default until an owner line: **nobody** (no NPC turret). Proposed: class-gated hulls that already have turret mounts on the player table — `heavy` / `ace` / `frigate` — and only vsPlayer **or** only vs already-hostile, matching AI-04. Do **not** invent a fire percent. Cadence is **proposed, not shipped**. Unset cadence → off.
5. vsPlayer vs vsNPC **must not collapse**. NPC-vs-player bolts `testPlayerHit`. NPC-vs-NPC **never** `testPlayerHit`. `lastAttacker === 'player'` remains the only scratch that turns patrols.
6. Unknowables: turret bolts are **not** beams. They miss. Unknowable NPCs **must not** fire turrets.
7. Zero per-frame allocation on the bolt path. Cap live NPC turret bolts **separately** from the player `TURRET_LIVE_CAP` 2. Exhausted pool → **drop**. Fail closed.
8. **No chaff.** PHY avoid stays lookahead, not turret dodge. Power ledger stays **out**. Heat: NPC turret must **not** call player `addHeat`.
9. Digit 0 stays Shipyard. Digit 8/9 stay **player** launcher / turret papers. Do not steal digits. No persist key for NPC racks. No new `WORLD_FIELDS`. No new `localStorage`.
10. `state.js` is **READ-ONLY this wave**. Later impl **defaults to no `state.js` write**.
11. `textContent` / `h()` / `el()` only. No `innerHTML`. Prototype-safe persist/ids. No `for-in` merge. Event payloads must not stringify attacker names into HTML.
12. Do **not** reopen NPC missiles Q1/Q2 (pirate+ace, toast `Incoming dart.` + song). Do not reopen BIO-05 or TGT-03 (sibling Wave 97 workers). Do not “fix” WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul boot FAILs.
13. Wave 97 writes markdown only. Serial PR plan later. Do not implement here.

---

## 1. HUD (closed)

### 1.1 Forbidden glance

| Forbidden | Why |
|---|---|
| Incoming turret gauge, hub lamp, wedge, extra edge-arrow | HUD-01 aim glass; HUD-02 non-goal |
| Lock box, aspect ring, turret lead pip on glass | Player turret lead is already **invisible** (`combat.js` 1253–1296) |
| New `#hud` child for inbound count / turret WPN Digit | Nodes created once in `initHud`; WPN is groups 1–5 only (`hud.js` 210–229) |
| Hide turret bolts under `reducedMotion` | Combat, not decoration. Sparks/muzzle may snap; bolts still tick (`combat.js` 1854 law for seekers; same for energy) |
| Power / mass bar | SHP-03 Frozen 9 |

Player WPN copy stays as shipped. This wave does not add `6 · Auto turret`. FORE/AFT does **not** dual-use as inbound.

### 1.2 Allowed channels (existing)

NPC turret is an **energy bolt**, like cannon, not a seeker.

| Channel | Live behavior | Honest use for NPC turret |
|---|---|---|
| FORE/AFT | Flash on `playerHit` | **Hit-only.** Keep. |
| Song `npcFire` | Cannon bark unless `weapon === 'missile'` | **Reuse cannon bark.** Do not steal `npcFireMissile`. Do not add a turret toast. |
| HUD toast | `npcFire` toasts **only** missile vs player (`Incoming dart.`) | **No** turret toast. Cannon has none. A second incoming line would lie about darts. |
| `commLine` | Hail voice | **Do not** hail a turret spawn. |

**Default:** no new glance, no new toast, no new song row. Impact still FORE/AFT + `playerHit` thud.

Banner stays `systemLoaded`. Do not steal it.

Living family stays `hudFamily` from hull — HUD never writes `hullKind`.

---

## 2. Events

### 2.1 Prefer reuse

| Emit | Reuse? |
|---|---|
| `npcFire { ship, weapon, target }` | **Yes.** Set `weapon: 'turret'`. **Always set `target`.** Missing-target-means-player (`combat.js` 1787–1791, ace cannon omit `npc.js` 1923) is **forbidden** for turret. If `weapon === 'turret'` and `target` is missing, **drop**. Do not aim the player. Update the `ctx.js` frozen comment in the impl PR. |
| `playerFire` | Player only. Do not emit for NPC turret. |
| `playerHit` | Impact only. NPC turret vs player still emits this when `testPlayerHit` succeeds. |

### 2.2 New event (cap 1)

A new frozen type is **not frozen** and **not required**. Prefer `npcFire` + `weapon: 'turret'`.

Add one new type **only** if reuse would lie. Until then: **no new type**. If added, payload is booleans / enums only. No name strings. No HTML.

### 2.3 Song

`npcFire` with `weapon: 'turret'` **reuses** the cannon bark (`song.js` 68, 423). Do not route it to `npcFireMissile`. Volley cap 8 stays (`song.js` 132–134).

---

## 3. Who fires (fail closed)

### 3.1 Live gates (do not widen)

Cite `mayHuntPlayer` / `isCivilianRole` (`npc.js` 1079–1091) and `MOUNT_TABLE.turret` (`state.js` 66–72):

- `trader` / `miner` → **never** hunt, **never** turret.
- `patrol` → may already cannon the player when scratched by the player or standing ≤ −10. Class `heavy` has turret **2**. Turret rides that **existing** hunt only. Do not widen `mayHuntPlayer`.
- `pirate` → typical `cutter` has turret **0**. Class gate **excludes** them unless a later record is a seated class. Do not gift pirates a turret on a cutter.
- `ace` → class `ace` has turret **1**. Eligible **only** if the owner turns the subset on **and** the hull is already hostile.
- `frigate` → turret **4** on the player table. Spawn is rare in live `world.js`. Same class gate; no faction grant.
- Unknowable any role → **never**.
- Beautiful-as-faction → **no grant**. BIO-05 remaining is a **sibling**. Do not sneak grafted NPC turrets here.

Class gate uses `canSeat(classKey, 'turret')` / `MOUNT_TABLE` **as shipped**. Unknown `classKey` is `light` (0). Do not persist NPC seat counts.

### 3.2 Owner pick (blocks impl)

**Q1 — Who fires?**  
Proposed: class-gated lawful combat hulls with turret mounts — `heavy` / `ace` / `frigate` — and only while already allowed to cannon that target (AI-04).  
Default: **nobody**.

**Q2 — vsPlayer vs vs already-hostile?**  
Proposed first slice: **vsPlayer only** (`target: 'player'`), matching Wave 83 dart slice. vsNPC turret waits.  
Alt (owner): also vs an already-hostile live ship (`vsPlayer false`). Still never bruise the player from that bolt.  
Default: **no NPC turret**.

Do **not** invent a fire percent. Personality is resolve, not a turret dice.

**Cadence (proposed, not shipped):** independent of the cannon `fireAt` clock. Mirror NPC cannon: `1 / (WEAPONS.turret.rof * 0.5)` as a **starting number for the impl PR**, not persist, not a percent. Unset cadence → **off** (cannon-only NPCs). Do not steal the dart `dartSpent` flag. Telegraph ≥ 3 s before the **first** shot stays. Turret does not skip demand-hold weapons-cold.

Q1/Q2 unpicked → no `weapon: 'turret'` emit.

---

## 4. Combat (later impl, grounded in live combat)

### 4.1 Catalog reuse

First NPC slice uses **`WEAPONS.turret` as shipped** (damage 4, rof 3, speed 800, range 380, heatPerShot 2, family `energy`). Not persist. Not a new hangar id.

A damage/ROF fork needs a dedicated `state.js` PR **before** fire. Default: **no fork**. Mark any new key **owner-open** and do **not** invent numbers in this contract.

Do not add `TURRET_IDS.npcAuto`. Do not write `ctx.world.turret`. Do not spend `missileAmmo`.

### 4.2 Spawn (energy bolt — `spawnNpcShot` is allowed)

Unlike darts, turret is **not** a seeker. **`spawnNpcShot` is the honest energy path** (`combat.js` 1298–1320): 64-pool, ±2° AIM_ERROR, no lock.

NPC spawn must:

1. Emit `npcFire { weapon: 'turret', target }` with **explicit** `target` (`'player'` in the first slice, or a live ship if Q2 opens vsNPC).
2. Combat: if `weapon === 'turret'` and `target` is missing → **drop**. Do not use ace cannon omit.
3. `fromPlayer = false`, `shooter = live`, `vsPlayer = (target === 'player')`.
4. Skip Unknowable shooter. Skip Unknowable aim (do not spawn).
5. **Separate NPC turret live cap.** Do **not** share `countLiveTurretBolts` without a `fromPlayer` filter — that counter would starve the player hose (`combat.js` 1245–1250). Proposed (one integer, impl PR pins it): **global 4** live NPC turret bolts (`fromPlayer === false && wkey === 'turret'`), same order as `NPC_MISSILE_POOL` 4. Exhausted → drop. Do not invent a new pool geometry (reuse 64-pool). Per-shooter 2 is an owner alt, not this default.
6. Do **not** call `addHeat` on the player. Do not write hangar.
7. Range / face: proposed `WEAPONS.turret.range` + existing `FIRE_FACE_DOT` (or player cone `CONVERGE_DOT` 0.72). Unset → off.

Player `tryPlayerTurret` stays untouched.

### 4.3 Hit tests (Wave 57)

Live bolt law (`combat.js` 1848–1851):

`(fromPlayer || !vsPlayer) ? testNpcHits : testPlayerHit`

| Shot | Hit test |
|---|---|
| Player turret | `testNpcHits` (unchanged) |
| NPC turret vs player | `testPlayerHit` only |
| NPC turret vs NPC | `testNpcHits` only. **Never** `testPlayerHit` |

`lastAttacker` stamp stays inside `testNpcHits` (`combat.js` 1626):

- Player turret vs NPC → `'player'`.
- NPC turret vs NPC → `p.shooter` (or `'npc'`). Must **not** write `'player'`.
- NPC turret vs player → no NPC `lastAttacker` write (player is not that record).

A ship-vs-ship turret bolt that also called `testPlayerHit` would bruise the hull and could mis-scratch patrols. **Forbidden.**

### 4.4 Unknowables

- `applyHit` already returns `[]` for non-beam vs Unknowable (`state.js` 197–199).
- `testNpcHits` already skips Unknowable hulls (`combat.js` 1543–1544).
- Gate: Unknowable NPCs do not emit turret `npcFire`.
- Player turret still misses Unknowable fields. Do not reopen Wave 9.

### 4.5 Power / persist / digits

- Power ledger: **out**.
- `state.js`: **READ-ONLY** this wave; later impl default **no write**.
- Digit 0 / 8 / 9: **untouched**.
- No hangar key for NPC racks. No second player `TURRET_IDS` row.
- `input.weaponGroup` stays session. NPCs do not read it.
- No new `WORLD_FIELDS`. No new `localStorage`.

---

## 5. Counterplay

No chaff. PHY avoid does not see bolts as bodies to dodge (`npc.js` 597–616; `physics.js` 19–20). Player counterplay is the same flight they use against cannon: afterburner, turn, FORE/AFT on **hit**.

Do not add Digit equipment. Do not add a scanner-tier turret warning. Do not reopen TGT-03 as a glass instrument (sibling worker).

---

## 6. Architecture (ctx ownership)

| Channel | Writer | Reader |
|---|---|---|
| `npcFire` turret | `npc.js` (later) | combat spawn; song cannon bark |
| 64-bolt pool NPC turret slots | `combat.js` | combat only |
| `playerHit` | `combat.js` `testPlayerHit` | HUD FORE/AFT, song |
| `ctx.world.turret` / hangar `turret` | hangar / station Digit 9 | **player** `tryPlayerTurret` — **NPC must not write** |
| `hullKind` / HUD family | SHP / save | HUD read. HUD never writes `hullKind`. |
| Digit 0/8/9 | station / shipyard | closed |

Combat may occupy NPC turret bolt slots. Combat may not seat `auto` on the player hangar for an NPC.

`ctx.js` comment: document `npcFire.weapon` `'cannon' \| 'missile' \| 'turret'` when the impl PR first emits it. Default: no new event type.

---

## 7. Serial PR plan (later impl wave — not Wave 97)

| PR | Lands | Does not land |
|---|---|---|
| **PR0 catalog** | **Skipped** unless owner opens a `WEAPONS` fork | New damage/ROF numbers. Default reuse. |
| **PR1 gate + emit** | `npc.js` Q1/Q2 gate, explicit `target`, Unknowable skip, independent clock, telegraph/demand-hold honored | Hunt widen, fire percent, Digit 8/9, hangar write |
| **PR2 spawn + cap** | combat `weapon === 'turret'` branch, drop on missing target, NPC live cap split from player, `vsPlayer` flag | `spawnNpcShot('missile')` path, new pool geometry, player `addHeat` |
| **PR3 pins** | Boot pins: HUD tree unchanged, Unknowable miss, Wave 57 split, pool drop, no hangar write, Digit 0/8/9 copy | Wishlist / `PROGRESS.md` |

Wave 97 does not schedule these into `src/`. Q1/Q2 unpicked → PRs stay skipped.

---

## 8. Coupling (do not reopen)

| Surface | Freeze |
|---|---|
| SHP-03 player `auto` / Digit 8/9 / `TURRET_IDS.auto` | Closed. Point at `docs/Shp03WeaponsDesign.md`. Do not edit it. |
| HUD-01 / HUD-02 | Closed. No gauge. No pip. |
| NPC missiles Q1/Q2 | Closed Wave 82/83. pirate+ace, `Incoming dart.` + song. Do not reopen. |
| TGT-05 | Player lock stays KeyT/KeyV. NPC turret aim is the fire target, not a new player instrument. |
| TGT-03 remaining | Sibling Wave 97 worker. Do not write `out/w97/tgt03/**`. |
| BIO-05 remaining | Sibling. Do not write `out/w97/bio05/**`. |
| PHY | Avoid stays lookahead. |
| AI-04 | Do not widen `mayHuntPlayer`. Turret rides existing hostility. |
| Unknowables beam-only | Closed. |
| BIO living HUD family | No new glance node. HUD never writes `hullKind`. |
| WAVE4 / WAVE26 / WAVE35 | Do not “fix”. |
