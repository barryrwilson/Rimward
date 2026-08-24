# Current BIO-02 growth-and-training inventory (Wave 86)

**Wave:** 86. Design only. No `src/`. No GLBs. No live bindings.  
**Rule:** Live `src/` wins over comments, Wave 70 line numbers, wishlist wording, and this inventory if they disagree. Re-open the cited files before an impl serial.  
**Scope:** Beautiful Ones **growth vs class-ladder training** among live `SHIP_CLASSES` keys. Not BIO-01 gift/pirate. Not BIO-03 bake. Not BIO-04 psionics. Not living-frigate **buy**.

This file is the source of truth for “BIO-02 today.” The integrator brief and `shared-contract.md` must not invent fields that are not here unless they mark them **proposed, needs owner** or **owner-open**.

Siblings (read only): [`docs/BioLivingShipsDesign.md`](../../docs/BioLivingShipsDesign.md) §4 (do not edit); Wave 70 contract [`out/w70/bio/shared-contract.md`](../../w70/bio/shared-contract.md); [`docs/OwnerDecisionsWave82.md`](../../docs/OwnerDecisionsWave82.md); [`docs/Bio03ClassLookDesign.md`](../../docs/Bio03ClassLookDesign.md) (sibling; do not edit).

Live line numbers: **2026-08-21**.

---

## 0. Files a later verifier must open

| File | Why |
|---|---|
| `src/game/hangar.js` | `switchTo`, `applyFlightEnvelope`, `applyMountedFlight`, heal seats, hangar sanitize, cargo pack |
| `src/game/bio.js` | `bio.growth` formula. Does **not** write `classKey` |
| `src/game/shipyard.js` | `LIVING_STOCK`, `YARD_LIST_UU`, `MIN_REP`, buy vs remount |
| `src/systems/ship.js` | `makeLivingHull`, `remountPlayerHull`, `GROWTH_SCALE_MAX`, living remount ignores class sculpt |
| `src/game/state.js` | `SHIP_CLASSES` six keys, `MOUNT_TABLE`, `createShipState`. **READ-ONLY** |
| `src/game/weapon-fit.js` | `canSeat` → heal launcher/turret |
| `src/systems/shipyard-desk.js` | Digit 1 Hangar / Digit 2 Yard; Confirm papers; graft on Hangar |
| `src/systems/station.js` | `DOCK_KEY_SERVICES`; Digit 0 = Shipyard; Feed Digit 4; `h()` `textContent` |
| `src/game/save.js` | `WORLD_FIELDS` hangar; restore sanitize; no BIO-02 key |
| `src/core/ctx.js` | Ownership; `emit` spread; `bio` writer; frozen events |
| `src/systems/hud.js` | `hudFamily` **reads** `hullKind`; never writes |
| `src/systems/controls.js` | Digit 1–4 weapons while undocked |
| `docs/OwnerDecisionsWave82.md` | No BIO-02 UU. Do not invent |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | BIO-02 1068–1076 |

---

## 1. Class catalog (live six keys only)

`SHIP_CLASSES` (`state.js` 35–42):

| Key | cruise | burn | hull | role |
|---|---|---|---|---|
| `light` | 120 | 240 | 100 | player |
| `heavy` | 90 | 180 | 160 | combat |
| `freighter` | 60 | 120 | 220 | trade |
| `ace` | 135 | 270 | 140 | ace |
| `cutter` | 105 | 210 | 80 | pirate |
| `frigate` | 22 | 45 | 900 | capital |

`MOUNT_TABLE` (`state.js` 46–53): `light` / `cutter` / `freighter` have `missile: 0`, `turret: 0`. `heavy` has `missile: 2`, `turret: 2`. `ace` 2/1. `frigate` 4/4.

`canSeat` (`weapon-fit.js` 57–61): unknown `classKey` uses **light**. Heal must pass the **new** key, not fall through to light after a heavy remount.

`classKeyOf` (`hangar.js` 38–40): `Object.prototype.hasOwnProperty.call(SHIP_CLASSES, value) ? value : 'light'`. Extra tokens become `light`. No career keys exist.

`createShipState` (`state.js` 140–161): vitals from class. `cargo` on the **player record** is not the live hold. Hangar deletes `player.cargo` (`hangar.js` 414, 662). Live hold is `ctx.cargo` / hangar row `cargo`.

**There is no `combat` / `mining` / `trade` / `exploration` / `stealth` / `support` class key.**

---

## 2. Growth (care made visible — not a remount)

`bio.js` header (1–5): writes **ONLY** `ctx.bio`. Station feeding mutates hunger in `station.js`.

Formula (`bio.js` 32–35, 156–161):

```
bio.growth = min(1, bio.bond * 0.7 + bio.fedCount * 0.05)
```

Constants: `GROWTH_BOND_WEIGHT` 0.7, `GROWTH_PER_FEEDING` 0.05. `fedCount` increments when hunger drop ≥ 0.2 (`bio.js` 107–110).

`bio.js` does **not** read or write `player.classKey`, hangar `classKey`, `hullKind`, `ctx.config.ship`, or remount.

`ctx.bio` defaults (`ctx.js` 123–134): `growth: 0`, `fedCount: 0`. Ownership (`ctx.js` 21): **bio.js only writes**; ship/song/hud read.

Visual (`ship.js` 98, 987–995): `GROWTH_SCALE_MAX = 0.15` on `flesh.scale` composed with breath. Applies while the living rig is mounted. Also the plated flesh wrapper path exists in comments from Wave 70; live scale write is the `flesh.scale.setScalar(breathScale)` block at 991–995.

Feed desk (`station.js` 178, 5136–5143): Digit **4** service `feed`. Biomass 60 UU. Does **not** change class.

**Inventory conclusion:** live growth cannot evolve class. A later training verb must be a **separate** dock action.

---

## 3. Hangar remount — the only class change today

### 3.1 `applyFlightEnvelope` (`hangar.js` 547–566)

Copies authored `SHIP_CLASSES` onto `ctx.config.ship`. **Do not persist** that object.

| Field | Live write |
|---|---|
| `maxSpeed` | `cls.cruise` |
| `creep` | `cls.creep` |
| `afterburner.multiplier` | `cls.cruise > 0 ? cls.burn / cls.cruise : 2` |
| `damping` | `1 / stopTime` |
| `acceleration` | `cls.cruise * (90/120)` |

**Not** `multiplier = burn`. Light: 240/120 = **2**. Assigning `burn` would make 240×.

`ship.js` 8, 14 re-exports `applyFlightEnvelope`. `registerPlayerRemount` (`hangar.js` 538–545) keeps hangar THREE-free.

### 3.2 `switchTo` (`hangar.js` 681–718)

Dock-only hangar **swap to another row**.

Refuse (`switchRefuseReason` 681–694): `not-docked` / `combat` / `jump` / `destroyed` / `paused` / `missing` / **`already-mounted`**.

Success path: `parkMounted` → sanitize → `loadMountedRow` → `mountedId = row.id` → Unknowables force living → **`applyFlightEnvelope(ctx, row.classKey)`** → `callRemount` → standing cap.

Snap/restore on throw (590–628, 714–717).

**Critical:** `hangar.mountedId === id` returns `'already-mounted'` (692). Training that mutates the **same** mounted row **cannot** call `switchTo(thatId)`. Envelope + remount for an in-place class change is **`applyMountedFlight`** (721–728) or the same body `switchTo` uses after park (`applyFlightEnvelope` + `callRemount`).

### 3.3 `applyMountedFlight` (`hangar.js` 721–728)

Restore / freshStart: envelope from mounted `classKey`, Unknowables force, heal grafted, standing, **`callRemount`**. This is the live in-place remount after identity is already on the player.

### 3.4 `loadMountedRow` (`hangar.js` 643–679)

`createShipState(row.classKey)` baseline, copy vitals from **row**, copy `hullKind`, delete `player.cargo`, rebuild combat flags, mirror weapons, **replace `ctx.cargo` from `row.cargo`**, set `cargoCapacity` from row.

`sanitizeHangarRecord` (`hangar.js` 211–241): `healLauncher` / `healTurret` (`54–61`) drop seats `canSeat` rejects. `trimCargoToCapacity` (`68–79`) keeps cargo that fits. `healCargoCapacity` (`64–66`) min **20** — capacity is a hangar field, **not** a `SHIP_CLASSES` column. Outfitter can raise it (`station.js` `CARGO_UPGRADE_*` 185–187).

`packLiveHull` (`243–275`) copies live cargo onto the row before swaps.

**Inventory conclusion:** class change that re-sanitizes the same row will (a) clamp vitals to the new class max, (b) drop illegal launcher/turret, (c) keep cargo up to **existing** `cargoCapacity`. It will **not** dump the hold unless the impl resets capacity to 20.

---

## 4. Living mesh remount (player)

`meshKindFor` (`ship.js` 503–508): Unknowables → living; `hullKind === 'built'` → built; else living.

`remountPlayerHull` (`ship.js` 514–543): keep dock transform, zero velocity. Built → `buildBuiltVisual(classKey, faction)`. Living → **`buildLivingVisual()` with no classKey argument** (526–528).

`makeLivingHull` (`ship.js` 258–307): one manta/whale CPU sculpt. `initShip` boot (`549–553`, 590–591): living light, `createShipState('light')`. `registerPlayerRemount(remountPlayerHull)` at 588.

Living CPU motion (`ship.js` 897–995): swim / breath / heartbeat / veins / thrust surge. `reducedMotion` does not idle vertex swim in this block.

**Inventory conclusion:** evolving `classKey` on a living player hull changes envelope, vitals, and seats. It does **not** pick a per-class CPU mesh. BIO-03 NPC GLBs are a different path. First BIO-02 impl must not wait on per-class player sculpt.

HUD (`hud.js` 72–80): `hullKind === 'built'` → `mech`; `'living'` → `bio`. HUD never assigns `hullKind`.

---

## 5. Yards — living buy vs training hole

`YARD_LIST_UU` (`shipyard.js` 16–23): light 8000, cutter 11000, heavy 20000, ace 28000, freighter 24000, frigate 80000.

`GRAFT_LIST_UU` = 4000 (`shipyard.js` 26). Owner Wave 82.

`LIVING_STOCK` (`shipyard.js` 29) = `['light', 'cutter', 'heavy']`.  
`UNKNOWABLES_STOCK` (`30`) = `['light']`.  
`CORE_STOCK` includes `frigate` (`28`). Beautiful / Unknowables maps (`41–42`) omit frigate, ace, freighter **buy**.

`MIN_REP` (`45–52`): light/cutter/heavy/freighter **0**; ace 10; frigate 25.

`hullKindFor` (`72–75`): beautiful / unknowables → `'living'`.

`yardPrice` (`91–101`): rank discount 5/10/15% at tiers 1/2/3. `dockReputation` missing key → **0** (`83–88`). Hostile `rep < 0` → no sale (`shipyard.js` 194).

`purchaseYardHull` (`225–232`): adds a hangar row. **Does not remount.** One debit. `buyInFlight` lock.

**No training SKU. No evolve helper. No train price constant.** Wave 82 (`docs/OwnerDecisionsWave82.md` 87–99) closed graft UU, gift defer, pirate defer, **living frigate buy omit**. It did **not** author a BIO-02 train UU or standing delta.

---

## 6. Shipyard desk and Digit map

`DOCK_KEY_SERVICES` (`station.js` 174):

`['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard']`

Menu labels (`5612`): Market, Jobs board, Bar, Feed & tend, Repair, Outfitting, People, Launch, Standing, Shipyard.

Digit (`5710–5717`): `Digit0` → last service = **shipyard**. `Digit1`–`Digit9` → index 0–8. `KeyY` also shipyard (`5709`).

**There is no training Digit. Digit 0 is Shipyard. Digit 4 is Feed.** Mid-list insert would steal every later hotkey.

Shipyard panes (`shipyard-desk.js` 14–16, 278–298): Digit **1 Hangar**, Digit **2 Yard**. Hull/papers digits **3+** (0 = row 8) (`104–113`, 301–334). Legend 297–298.

Yard buy: Digit 3+ **arms papers**. Confirm papers debits (`202–206`, 304). Esc cancels pending (`82–86`, `station.js` 5723).

Graft: **Hangar pane**, Gilded only (`142–151`, 268–275). Two-step confirm. Not a dock service. Not a new Digit.

`h()` (`station.js` 4230–4235): `textContent` only. `shipyard-desk.js` innerHTML: **none**.

`SWITCH_REFUSE_LINES` / `BUY_REFUSE_LINES` (`shipyard-desk.js` 18–38): hostile yard copy is **`No sale.`** — never a vague “not available.”

---

## 7. Persist / sanitize / save

`WORLD_FIELDS` (`save.js` 76–101) includes `'hangar'`. No `train` / `evolution` / `growthClass` key.

Hangar shape: `{ mountedId, hulls }` (`hangar.js` 346, 381). Row allowlist in `sanitizeHangarRecord` (222–239): id, faction, classKey, name, scanner, miningLaser, concealedMounts, launcher, turret, missileAmmo, cargoCapacity, cargo, vitals, optional `hullKind`, optional `grafted`.

Restore (`save.js` 1160–1221): field copy → omit-delete hangar/nav/jobs/fieldOre → `sanitizeHangar` → `healPlayerHullKind` → `syncMountedToPlayer` → `syncMountedWeaponMirrors` → `applyMountedFlight`.

`SAFE_ID` matches `__proto__` (`save.js` 104–110). Hull ids use `RESERVED_IDS` (`hangar.js` 28–32, 163–167).

`ctx.bio` wholesale on restore (`save.js` 1199–1202). Death keeps companion (`save.js` 1237+). Must **not** factory-reset bio on hull work.

No new `localStorage` key in live hangar. Autosave rides existing `hangar`.

---

## 8. ctx ownership and events

`ctx.js` 13–37:

| Channel | Writer |
|---|---|
| `player.hullKind` | SHP / save / Unknowables force. HUD reads |
| `bio` | `bio.js` only |
| `world.hangar` | hangar / yard / save |
| `config.ship` | **Do not persist** (`ctx.js` 24) |
| `flags.docked` | `station.js` only |
| events | `emit(type, data)` spreads `data` (`248–249`) |

Frozen event list (`ctx.js` 211–245): **no** `trainHull` / `evolved` token. Spreading a hangar row into `emit` would smash `type`.

---

## 9. Unknowables living light / docks

Unknowables force `'living'` on hangar/player (`hangar.js` 86–90, 411–412, 432, 660, 709, 725). Graft refuse (`745–747`).

`UNKNOWABLES_STOCK` light only (`shipyard.js` 30). `DETAIL_STATIONS` omits `unknowables` and `beautiful` (`station.js` 533–551). Beautiful uses Bloom (`294–295`, 553+). Comment: Unknowables **build no station** (D3, 533). No authored Unknowables system in `authored-systems.js`. Owner Wave 82: Unknowables dock **Wait**. Do not invent a dock.

**Inventory conclusion:** there is no Unknowables training desk to attach. Fail closed: BIO-02 training is Beautiful-dock-only.

---

## 10. Grafted / built exclusion

Abomination = `hullKind === 'built' && grafted === true` (Wave 70/72). `applyGraftedAllowlist` drops `grafted` on living (`hangar.js` 93–97). HUD stays `mech` for built.

Training a grafted plated hull would be a living-evolution on tissue — **forbidden by hullKind**. Graft path is Gilded Hangar, not Beautiful training.

---

## 11. Starter cannon / SHP-03

`controls.js` 41, 289–298: Digit 1–4 weapons undocked. Mounts follow `classKey` not `hullKind` (`state.js` 44–45`). Living light already seats general guns. Feed/train visit is **not** required to fire.

`healLauncher` / `healTurret` only drop seats the **new** class cannot take. Light → heavy **gains** missile/turret capacity (table zeros → 2/2); empty strings stay empty until outfitter seats them. Heavy → (if ever smaller) would drop.

---

## 12. What does **not** exist (holes, not tasks)

| Hole | Today |
|---|---|
| Class evolution verb | Absent |
| Train UU | Absent (do not invent) |
| Train standing delta | Absent (do not invent) |
| Career class keys | Absent |
| Training Digit / `DOCK_KEY_SERVICES` entry | Absent |
| Per-class player living mesh | Absent (`buildLivingVisual` ignores class) |
| Living frigate / ace / freighter **buy** | Omitted from `LIVING_STOCK` |
| Unknowables dock | Absent (Wave 42) |
| BIO-02 persist field | Unnecessary if `classKey` mutates on the row |

---

## 13. Wishlist vs code

Wishlist BIO-02 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 1068–1076):

- Conventional components on living ships — **already true** (SHP-03).
- Growth-and-training centers evolve living ships into larger classes for a price — **not live**. Growth is scale only.
- Specialized career forms — **no keys**. First impl must not add them.
- Regression: growth invalidating equipment or cargo — live growth does not; a naive class mutate without heal/keep would.

Wave 70 §4 (`docs/BioLivingShipsDesign.md` 162–168): growth must not change `classKey`; later training uses `applyFlightEnvelope` + living remount; keep cargo; heal seats; no center for starter cannon; no six career keys; no new dock Digit. **Honor. Do not edit that file.**
