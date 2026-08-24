# NPC turrets shared contract (Wave 98 owner close)

**Wave:** 98. Markdown only. No turret `npcFire` ships in this wave.  
**Status:** MERGE LAW for [`docs/OwnerDecisionsWave98.md`](../../../docs/OwnerDecisionsWave98.md) and the [`docs/NpcTurretsDesign.md`](../../../docs/NpcTurretsDesign.md) status bump. If the owner file / brief and this file ever disagree, **this file wins**.  
**Predecessor contract:** [`out/w97/turrets/shared-contract.md`](../../w97/turrets/shared-contract.md). Wave 98 **closes** Wave 97 Q1 / Q2. It does **not** emit bolts.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit the wishlist, `PROGRESS.md`, [`docs/NpcMissilesDesign.md`](../../../docs/NpcMissilesDesign.md), [`docs/Shp03WeaponsDesign.md`](../../../docs/Shp03WeaponsDesign.md), `docs/Shp*.md`, `docs/Tgt*.md`, `docs/Hud*.md`, `docs/Bio*.md`, `docs/Nav*.md`, prior `docs/OwnerDecisionsWave9[2-7].md`, or sibling `out/w98/tgt03/**` / `out/w98/radar/**`.  
**Locked sources:** live code cited in [`current-npc-turrets-inventory.md`](current-npc-turrets-inventory.md); player `auto` as shipped Wave 68; Wave 83 pirate+ace darts; HUD-01 empty hub; AI-04 `mayHuntPlayer`; Wave 57 hit-test split; Wave 98 owner Q1/Q2.

[`docs/NpcMissilesDesign.md`](../../../docs/NpcMissilesDesign.md) remains the **NPC darts** record (Wave 75 design / Wave 83 impl). It still says NPC `auto` turret stays out. **This contract supersedes that freeze for a later implementation wave only.** Wave 68 and Wave 83 stay complete. Do **not** edit `docs/NpcMissilesDesign.md`.

---

## 0. Law in one page

1. **HUD-01 / HUD-02 stay closed.** No incoming turret gauge, lock box, aim-glass pip, aspect ring, or new `#hud` glance node. Empty 80 px hub stays empty. FORE/AFT stays `playerHit` only. No turret toast.
2. Player `auto` SKU, Digit 8/9 papers, hangar `turret` mirror, and `tryPlayerTurret` **stay**. NPC fire must not write hangar or grant the player free ammo / a free SKU.
3. NPC turret fire is **not** a player SKU. Do **not** add a second `TURRET_IDS` row. Reuse `WEAPONS.turret` + the 64-bolt energy path. **No** `state.js` fork. Do not invent damage / ROF numbers.
4. **Who fires (Q1, closed):** class-gated `heavy` / `ace` / `frigate` **and** already-hostile (`mayHuntPlayer`). Not trader, miner, cutter-pirate, Unknowable, Beautiful-as-faction. Seat 0 never. Wave 97 default-off is **replaced** by this named gate for a later serial.
5. **vsPlayer (Q2, closed):** first slice **vsPlayer only**. Explicit `target: 'player'`. Missing target **drops**. vs already-hostile NPC stays later. vsPlayer vs vsNPC **must not collapse**.
6. Unknowables: turret bolts are **not** beams. They miss. Unknowable NPCs **must not** fire turrets. Turret never damages Unknowable hulls.
7. Zero per-frame allocation on the bolt path. Cap live NPC turret bolts **separately** from the player `TURRET_LIVE_CAP` 2. Exhausted pool → **drop**. Fail closed.
8. **No fire percent.** Cadence later: independent clock. Named pin: **0.5×** player turret ROF. Not a live dice. Unset clock in live `src/` → no turret emit (correct until serial).
9. **No chaff.** PHY avoid stays lookahead, not turret dodge. Power ledger stays **out**. Heat: NPC turret must **not** call player `addHeat`.
10. Digit 0 stays Shipyard. Digit 8/9 stay **player** launcher / turret papers. Do not steal digits. No persist key for NPC racks. No new `WORLD_FIELDS`. No new `localStorage`.
11. `state.js` is **READ-ONLY this wave**. Later impl **defaults to no `state.js` write**.
12. `textContent` / `h()` / `el()` only. No `innerHTML`. Prototype-safe persist/ids. No `for-in` merge. Event payloads must not stringify attacker names into HTML.
13. Do **not** reopen NPC missiles Q1/Q2 (pirate+ace, toast `Incoming dart.` + song). Do not write TGT-03 `Incoming fire.` (sibling Wave 98 TGT-03 worker). If a later turret emit is vsPlayer cannon-family energy, TGT-03 law applies automatically. Do not design that toast here. Do not write sibling `out/w98/radar/**`. Do not “fix” WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul boot FAILs.
14. Wave 98 writes markdown only. Serial PR plan still later. Do not implement here. Live `src/` still has zero turret `npcFire`. That is correct.

---

## 1. HUD (closed)

### 1.1 Forbidden glance

| Forbidden | Why |
|---|---|
| Incoming turret gauge, hub lamp, wedge, extra edge-arrow | HUD-01 aim glass; HUD-02 non-goal |
| Lock box, aspect ring, turret lead pip on glass | Player turret lead is already **invisible** (`combat.js` 1253–1296) |
| New `#hud` child for inbound count / turret WPN Digit | Nodes created once in `initHud`; WPN is groups 1–5 only (`hud.js` 210–229, 837–838) |
| Hide turret bolts under `reducedMotion` | Combat, not decoration. Sparks/muzzle may snap; bolts still tick (`combat.js` 1854 law for seekers; same for energy) |
| Power / mass bar | SHP-03 Frozen 9 |
| Turret toast | Cannon has none. Do not steal `Incoming dart.` (`hud.js` 61–62, 567–571). Do not author `Incoming fire.` here (sibling) |

Player WPN copy stays as shipped. This wave does not add `6 · Auto turret`. FORE/AFT does **not** dual-use as inbound.

### 1.2 Allowed channels (existing)

NPC turret is an **energy bolt**, like cannon, not a seeker.

| Channel | Live behavior | Honest use for NPC turret |
|---|---|---|
| FORE/AFT | Flash on `playerHit` | **Hit-only.** Keep. |
| Song `npcFire` | Cannon bark unless `weapon === 'missile'` | **Reuse cannon bark.** Do not steal `npcFireMissile`. Do not add a turret toast. |
| HUD toast | `npcFire` toasts **only** missile vs player (`Incoming dart.`) | **No** turret toast in this pack. Sibling TGT-03 owns `Incoming fire.` if that worker binds cannon-family vsPlayer. |
| `commLine` | Hail voice | **Do not** hail a turret spawn. |

**Default:** no new glance, no new toast in this pack, no new song row. Impact still FORE/AFT + `playerHit` thud.

Banner stays `systemLoaded`. Do not steal it.

Living family stays `hudFamily` from hull — HUD never writes `hullKind`.

---

## 2. Events

### 2.1 Prefer reuse

| Emit | Reuse? |
|---|---|
| `npcFire { ship, weapon, target }` | **Yes.** Set `weapon: 'turret'`. **Always set `target: 'player'`** in the first slice. If `weapon === 'turret'` and `target` is missing, **drop**. Do not aim the player. Ace cannon omit (`npc.js` 1923; `combat.js` 1787–1791) is **forbidden** for turret. Update the `ctx.js` frozen comment in the **impl** PR. |
| `playerFire` | Player only. Do not emit for NPC turret. |
| `playerHit` | Impact only. NPC turret vs player still emits this when `testPlayerHit` succeeds. |

### 2.2 New event (cap 1)

A new frozen type is **not frozen** and **not required**. Prefer `npcFire` + `weapon: 'turret'`.

Add one new type **only** if reuse would lie. Until then: **no new type**. If added, payload is booleans / enums only. No name strings. No HTML.

### 2.3 Song

`npcFire` with `weapon: 'turret'` **reuses** the cannon bark (`song.js` 68, 423). Do not route it to `npcFireMissile`. Volley cap 8 stays (`song.js` 132–134).

---

## 3. Who fires (Q1 closed) and vsPlayer (Q2 closed)

### 3.1 Live gates (do not widen)

Cite `mayHuntPlayer` / `isCivilianRole` (`npc.js` 1079–1091) and `MOUNT_TABLE.turret` (`state.js` 66–72):

- `trader` / `miner` → **never** hunt, **never** turret.
- `patrol` → may already cannon the player when scratched by the player or standing ≤ −10. Class `heavy` has turret **2**. Turret rides that **existing** hunt only. Do not widen `mayHuntPlayer`.
- `pirate` → typical `cutter` has turret **0**. Class gate **excludes** cutter-pirate. Do not gift pirates a turret on a cutter.
- `ace` → class `ace` has turret **1**. Eligible while already hostile (`mayHuntPlayer`).
- `frigate` → turret **4** on the player table. Spawn is rare in live `world.js`. Same class gate **and** already-hostile. No faction grant.
- Unknowable any role → **never**.
- Beautiful-as-faction → **no grant**.

Class gate uses `canSeat(classKey, 'turret')` / `MOUNT_TABLE` **as shipped**. Unknown `classKey` is `light` (0). Do not persist NPC seat counts.

### 3.2 Owner pick (closed Wave 98)

**Q1 — Who fires?**  
**Closed:** class-gated `heavy` / `ace` / `frigate` **and** already-hostile (AI-04 `mayHuntPlayer`). Not trader, miner, cutter-pirate, Unknowable, Beautiful-as-faction. Seat 0 never.

Wave 97 default **nobody** is **replaced**. Later serial implements this named gate. Until that serial, live `src/` still emits no turret `npcFire`. That is correct, not a re-open of default-off.

**Q2 — vsPlayer vs vs already-hostile?**  
**Closed:** first slice **vsPlayer only**. Explicit `target: 'player'`. Missing `target` **drops**. vs already-hostile NPC stays later.

Do **not** invent a fire percent. Personality is resolve, not a turret dice.

**Cadence (named pin, not a live dice):** independent of the cannon `fireAt` clock. Mirror NPC cannon shape: `1 / (WEAPONS.turret.rof * 0.5)` as the **named pin for the impl PR**, not persist, not a percent. Live `src/` has no turret clock. Telegraph ≥ 3 s before the **first** shot stays. Turret does not skip demand-hold weapons-cold (`npc.js` 1526–1539). Do not steal the dart `dartSpent` flag.

---

## 4. Combat (later impl, grounded in live combat)

### 4.1 Catalog reuse

First NPC slice uses **`WEAPONS.turret` as shipped** (damage 4, rof 3, speed 800, range 380, heatPerShot 2, family `energy`). Not persist. Not a new hangar id.

A damage/ROF fork is **forbidden** unless a successor owner file opens a dedicated `state.js` PR **before** fire. Wave 98: **no fork**.

Do not add `TURRET_IDS.npcAuto`. Do not write `ctx.world.turret`. Do not spend `missileAmmo`.

### 4.2 Spawn (energy bolt — `spawnNpcShot` is allowed)

Unlike darts, turret is **not** a seeker. **`spawnNpcShot` is the honest energy path** (`combat.js` 1298–1320): 64-pool, ±2° AIM_ERROR, no lock.

NPC spawn must (later serial):

1. Emit `npcFire { weapon: 'turret', target: 'player' }` with **explicit** `target`. First slice never aims a live ship.
2. Combat: if `weapon === 'turret'` and `target` is missing → **drop**. Do not use ace cannon omit.
3. `fromPlayer = false`, `shooter = live`, `vsPlayer = true` (first slice).
4. Skip Unknowable shooter. Skip Unknowable aim (do not spawn).
5. **Separate NPC turret live cap.** Do **not** share `countLiveTurretBolts` without a `fromPlayer` filter — that counter would starve the player hose (`combat.js` 1245–1250). Copy Wave 97 pin: **global 4** live NPC turret bolts (`fromPlayer === false && wkey === 'turret'`), same order as `NPC_MISSILE_POOL` 4. Exhausted → drop. Do not invent a new pool geometry (reuse 64-pool). Per-shooter 2 is an owner alt, not this default.
6. Do **not** call `addHeat` on the player. Do not write hangar.
7. Range / face: `WEAPONS.turret.range` + existing `FIRE_FACE_DOT` 0.92 (NPC cannon face). Do not mix player `CONVERGE_DOT` 0.72 into the NPC clock in the same PR.

Player `tryPlayerTurret` stays untouched.

### 4.3 Hit tests (Wave 57)

Live bolt law (`combat.js` 1848–1851):

`(fromPlayer || !vsPlayer) ? testNpcHits : testPlayerHit`

| Shot | Hit test |
|---|---|
| Player turret | `testNpcHits` (unchanged) |
| NPC turret vs player | `testPlayerHit` only |
| NPC turret vs NPC (later slice) | `testNpcHits` only. **Never** `testPlayerHit` |

`lastAttacker` stamp stays inside `testNpcHits` (`combat.js` 1626):

- Player turret vs NPC → `'player'`.
- NPC turret vs NPC (later) → `p.shooter` (or `'npc'`). Must **not** write `'player'`.
- NPC turret vs player → no NPC `lastAttacker` write (player is not that record).

A ship-vs-ship turret bolt that also called `testPlayerHit` would bruise the hull and could mis-scratch patrols. **Forbidden.** First slice does not emit vsNPC.

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
- No invented UU / standing.

---

## 5. Counterplay

No chaff. PHY avoid does not see bolts as bodies to dodge (`npc.js` 597–616; `physics.js` 19–20). Player counterplay is the same flight they use against cannon: afterburner, turn, FORE/AFT on **hit**.

Do not add Digit equipment. Do not add a scanner-tier turret warning. Do not reopen TGT-03 as a glass instrument (sibling worker owns `Incoming fire.`).

---

## 6. Architecture (ctx ownership)

| Channel | Writer | Reader |
|---|---|---|
| `npcFire` turret | `npc.js` (later serial) | combat spawn; song cannon bark |
| 64-bolt pool NPC turret slots | `combat.js` (later serial) | combat only |
| `playerHit` | `combat.js` `testPlayerHit` | HUD FORE/AFT, song |
| `ctx.world.turret` / hangar `turret` | hangar / station Digit 9 | **player** `tryPlayerTurret` — **NPC must not write** |
| `hullKind` / HUD family | SHP / save | HUD read. HUD never writes `hullKind`. |
| Digit 0/8/9 | station / shipyard | closed |

Combat may occupy NPC turret bolt slots. Combat may not seat `auto` on the player hangar for an NPC.

`ctx.js` comment: document `npcFire.weapon` `'cannon' \| 'missile' \| 'turret'` when the impl PR first emits it. Default: no new event type. Wave 98 does not edit `ctx.js`.

---

## 7. Serial PR plan (later impl wave — not Wave 98)

| PR | Lands | Does not land |
|---|---|---|
| **PR0 catalog** | **Skipped**. Reuse `WEAPONS.turret`. | New damage/ROF numbers |
| **PR1 gate + emit** | `npc.js` Q1/Q2 gate, explicit `target: 'player'`, Unknowable skip, independent clock at named 0.5× pin, telegraph/demand-hold honored | Hunt widen, fire percent, Digit 8/9, hangar write, vsNPC |
| **PR2 spawn + cap** | combat `weapon === 'turret'` branch, drop on missing target, NPC live cap split from player, `vsPlayer` true | `spawnNpcShot('missile')` path, new pool geometry, player `addHeat` |
| **PR3 pins** | Boot pins: HUD tree unchanged, Unknowable miss, Wave 57 split, pool drop, no hangar write, Digit 0/8/9 copy, zero turret emit from seat-0 / civilian / Unknowable | Wishlist / `PROGRESS.md` |

Wave 98 does **not** schedule these into `src/`. Q1/Q2 are **closed**, so a later serial may run PR1 → PR2 → PR3. Live zero emit until then is correct.

---

## 8. Coupling (do not reopen)

| Surface | Freeze |
|---|---|
| SHP-03 player `auto` / Digit 8/9 / `TURRET_IDS.auto` | Closed. Point at `docs/Shp03WeaponsDesign.md`. Do not edit it. |
| HUD-01 / HUD-02 | Closed. No gauge. No pip. No new glance node. |
| NPC missiles Q1/Q2 | Closed Wave 82/83. pirate+ace, `Incoming dart.` + song. Do not reopen. |
| TGT-05 | Player lock stays KeyT/KeyV. NPC turret aim is the fire target, not a new player instrument. |
| TGT-03 `Incoming fire.` | Sibling Wave 98 TGT-03 worker. Do not write `out/w98/tgt03/**`. Do not design that toast here. |
| Radar | Sibling Wave 98. Do not write `out/w98/radar/**`. |
| PHY | Avoid stays lookahead. |
| AI-04 | Do not widen `mayHuntPlayer`. Turret rides existing hostility. |
| Unknowables beam-only | Closed. |
| BIO living HUD family | No new glance node. HUD never writes `hullKind`. |
| WAVE4 / WAVE26 / WAVE35 | Do not “fix”. |
