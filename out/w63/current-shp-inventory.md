# Wave 63 — current SHP inventory (ships today)

**Status:** DESIGN ONLY. This file is a cite map. It is not a persist schema.

**Purpose:** Record how the player hull, class, faction, cargo, equipment, yard, and save work in the tree today so later SHP work can cite code.

**Not this file:** SHP-01 / SHP-02 / SHP-03 wants live in `docs/PLAYER-EXPERIENCE-WISHLIST.md`. Those wants are listed only in §12 so later design does not confuse them with shipped behavior.

**Sources read:** `src/systems/ship.js`, `src/game/state.js`, `src/game/save.js`, `src/core/ctx.js`, `src/systems/station.js`, `src/systems/hud.js`, `src/game/bio.js`, `src/game/flight-feel.js`, `src/systems/organic.js`, `src/game/world.js`, `src/game/contacts.js`, `src/systems/title.js`, `src/main.js`, `src/systems/npc.js` (NPC cargo / mesh only), `src/systems/combat.js` (mining head read only).

---

## 0. How to read this brief

- **Ships today** = code that runs now. Every claim has a file + line range.
- **Wishlist SHP wants** = §12 only. Do not treat those bullets as APIs.
- **Holes** = persist or ownership gaps later SHP must name. This brief does not invent a hangar schema.

---

## 1. Player hull creation (no mesh swap)

`src/systems/ship.js` builds one living mesh at init and never replaces it.

- Header: the player ship is a living hull, grown not built (`ship.js` 7–25). Swim, flap, breath, and heartbeat run on that mesh every frame.
- Geometry: `makeLivingHull()` sculpts a sphere (`ship.js` 248–297). `initShip` parents that mesh under `flesh` / `root` (`ship.js` 303–321).
- Live transform: `ctx.ship.object = root` (`ship.js` 393). Camera and flight write that same object.
- State record: `ctx.player = createShipState('light')` (`ship.js` 397–398). Class is hard-coded `'light'`. No second call rebuilds the player.
- `buildShipMesh` / `buildShipAsset` do not appear in `ship.js`. Those builders belong to NPC traffic (`npc.js` 166–167, 358–366).
- Flight speeds come from `ctx.config.ship` (light baseline: `maxSpeed` 120, `creep` 30) (`ctx.js` 43–47; `ship.js` 533–562). `SHIP_CLASSES` cruise / burn are **not** read by the player flight step.
- Turn rate is the only live class hook on the player mesh path: `hoverTurnRateFor(ctx.player?.classKey || 'light', ship.speed)` (`ship.js` 513–515). Unknown `classKey` falls back to light (`flight-feel.js` 61–65).

**Today:** the living mesh **is** the player ship. There is no conventional player mesh swap.

---

## 2. `createShipState` fields

`src/game/state.js` 118–139.

```
createShipState(classKey, opts = {})
  cls = SHIP_CLASSES[classKey]          // no fallback; a bad key throws
  writes:
    classKey
    name            opts.name ?? cls.role
    faction         opts.faction ?? 'independent'
    hull, hullMax   cls.hull
    screen, screenMax   40% of cls.shield (DEFENSE.screenFraction)
    shell, shellMax     remainder of cls.shield
    engine, engineMax   cls.engine
    heat: 0, overheated: false
    lastHitAt: -1e9, lastCombatAt: -1e9
    engineOut, disabled, destroyed, surrendered: false
    disabledDamage: 0, disabledSince: null
    cargo           opts.cargo ?? []     // NPC / record hold, not ctx.cargo
    bookValue       cls.hull * 12
    bounty          opts.bounty ?? 0
    resolve         opts.resolve ?? 70
    personality     opts.personality ?? random ±10
```

It does **not** write `hullKind`.

Player boot path passes no opts (`ship.js` 398), so the live starter is:

| Field | Starter value | Cite |
|---|---|---|
| `classKey` | `'light'` | `ship.js` 398 |
| `name` | `'player'` (`SHIP_CLASSES.light.role`) | `state.js` 35, 123 |
| `faction` | `'independent'` | `state.js` 124 |
| integrity | light hull 100 / shield 100 / engine 100 | `state.js` 35, 125–128 |

`createShipState` is also used for NPCs (`npc.js` 267) and for heal / death rebuilds (`save.js` 235, 379; `station.js` 1513). Those callers pass `{ name, faction }` or NPC opts. None pass `hullKind`.

---

## 3. `SHIP_CLASSES` today

`src/game/state.js` 34–41. Keys: `light`, `heavy`, `freighter`, `ace`, `cutter`, `frigate`.

| Key | cruise | burn | creep | stopTime | turn | hull | shield | engine | role |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| light | 120 | 240 | 30 | 2.0 | 1.6 | 100 | 100 | 100 | player |
| heavy | 90 | 180 | 22 | 2.5 | 1.1 | 160 | 140 | 120 | combat |
| freighter | 60 | 120 | 15 | 3.5 | 0.7 | 220 | 120 | 140 | trade |
| ace | 135 | 270 | 30 | 1.8 | 2.0 | 140 | 160 | 120 | ace |
| cutter | 105 | 210 | 25 | 2.2 | 1.5 | 80 | 80 | 90 | pirate |
| frigate | 22 | 45 | 8 | 5.0 | 0.35 | 900 | 600 | 300 | capital |

These numbers feed `createShipState` integrity / `bookValue` and NPC cruise (`world.js` 855). They do **not** retune `ctx.config.ship.maxSpeed` for the player.

Turn tables that **do** key on `classKey` (player + NPC): `TURN_MIN_RADIUS`, `TURN_MAX`, `HOVER_RCS` in `flight-feel.js` 10–54.

---

## 4. Weapons, mining, Q-ship mounts, scanner

### 4.1 `WEAPONS`

`src/game/state.js` 85–97. Keys: `cannon`, `disruptor`, `mining`.

- Cannon: energy, damage 8, rof 6, speed 900, range 500, heat 4.
- Disruptor: damage 10, rof 2.5, speed 700, range 350, heat 6; `shieldMult` 2, `engineMult` 2, `hullMult` 0.25.
- Mining row is a stock Mk I **mirror** of `MINING_LASERS[0]` (`state.js` 88–96). Combat reads the **installed** head via `miningLaserFor(ctx.world.miningLaser)` (`combat.js` 51, 1031), not this row’s numbers (`state.js` 90–91).

Player fire group is `ctx.input.weaponGroup` 1/2/3 (`ctx.js` 78). There is no mount table on `ctx.player`.

### 4.2 `MINING_LASERS` / `ctx.world.miningLaser`

Ladder: `state.js` 51–76. Four heads, index **is** `ctx.world.miningLaser` (0..3) (`state.js` 47–48, 78–81).

| Index | key | name | tier | cost |
|---|---|---|---:|---:|
| 0 | mk1 | Mining laser Mk I | 1 | 0 (stock, not sold) |
| 1 | mk2 | Bore laser Mk II | 2 | 1400 |
| 2 | mk3 | Ferrous cutting head Mk III | 3 | 4200 |
| 3 | mk4 | Deepcore lance Mk IV | 4 | 11000 |

Default in `createCtx`: `miningLaser: 0` (`ctx.js` 135–138). `initStation` also does `ctx.world.miningLaser ??= 0` (`station.js` 1404–1405). Outfitter is the writer (`station.js` 1558–1575). Persist: `WORLD_FIELDS` includes `'miningLaser'` (`save.js` 79–81). Heal: only `0/1/2/3` survive restore (`save.js` 251–256).

### 4.3 `HIDDEN_MOUNTS` / Q-ship / `ctx.world.concealedMounts`

Constant: `state.js` 279.

```
HIDDEN_MOUNTS = { cost: 900, bluffBase: 0.35, bluffPerFear: 0.01,
                  failResolveBump: 20, calmSeconds: 90, demandMin: 50 }
```

- Buy: `act.buyConcealedMounts` sets `ctx.world.concealedMounts = true` (`station.js` 1550–1556).
- Persist: `'concealedMounts'` on `WORLD_FIELDS` (`save.js` 76–78).
- Heal: only literal `true` stays; anything else becomes `false` (`save.js` 244–246).
- Use: hail bluff path (`hail.js` 250–270). This is a **world flag**, not a player-record field.
- `createCtx` does **not** seed `concealedMounts`. It is undefined until buy or sanitize.

The player mesh is not a Q-ship cover hull. Cover class vs real `classKey` is an NPC traffic trick (`npc.js` 253–259).

### 4.4 `ctx.world.scanner`

Wolfeye ladder 0 / 1 / 2.

- Not present on the `createCtx` `world` object (`ctx.js` 120–138). `initStation` seeds `ctx.world.scanner ??= 0` (`station.js` 1403).
- Buys: Mk I 400 UU → `scanner = 1`; Mk II 900 UU → `scanner = 2`; Mk II requires Mk I (`station.js` 130–131, 1532–1547).
- Persist: `'scanner'` on `WORLD_FIELDS` (`save.js` 68).
- Heal: only `[0, 1, 2]` survive (`save.js` 247–250).
- HUD: contacts arc and pierce gate on `scanner >= 1` / `>= 2` (`hud.js` 1082–1101, 1458).

There is no other player sensor field.

---

## 5. Save: wholesale player record

Envelope `{ v: 1 }` in localStorage key `rimward-save-v1` (`save.js` 4–5, 55).

### 5.1 Snapshot

`snapshot(ctx)` (`save.js` 160–178):

- `world`: allowlisted `WORLD_FIELDS` only (`save.js` 65–82, 161–162).
- `cargo`: `sanitizeCargoList(ctx.cargo)` (`save.js` 167).
- `cargoCapacity`: raw `ctx.cargoCapacity` (`save.js` 168).
- `bio`: `{ ...ctx.bio, songEvent: null }` (`save.js` 169).
- `player: ctx.player` **wholesale** (`save.js` 170). No field allowlist.
- `ship`: position + quaternion arrays (`save.js` 171–176).

### 5.2 Restore

`restore(ctx, snap)` (`save.js` 324–372):

- Copies only listed `WORLD_FIELDS` onto `ctx.world` (`save.js` 328–330).
- Replaces `ctx.cargo` from sanitized snap cargo (`save.js` 351–353).
- `if (typeof snap.cargoCapacity === 'number') ctx.cargoCapacity = snap.cargoCapacity` (`save.js` 354). No min / max / finite check.
- `Object.assign(ctx.bio, snap.bio)` then clears `songEvent` (`save.js` 355–357).
- `if (snap.player && ctx.player) Object.assign(ctx.player, snap.player)` (`save.js` 359). Extra keys **KEEP**. Missing snap keys on the live object **KEEP**.
- Then `sanitizeRestored(ctx)` (`save.js` 371).

Boot load: after `initShip` created the living mesh + light player, `initSave` restores the autosave if present (`main.js` 109–122; `save.js` 658–660).

### 5.3 `sanitizeRestored`

`save.js` 232–278. What it heals:

| Channel | Heal | Cite |
|---|---|---|
| player numeric vitals | non-finite → `createShipState(valid class or 'light')` baseline; then clamp current ≤ max | 233–240 |
| `credits` | non-finite → 350 | 242 |
| `fear` | non-finite → 0 | 243 |
| `concealedMounts` | not `true` → `false` | 244–246 |
| `scanner` | not 0/1/2 → 0 | 247–250 |
| `miningLaser` | not 0/1/2/3 → 0 | 251–256 |
| bio numbers | non-finite → defaults | 257–266 |
| ship transform | any non-finite → spawn + identity | 267–273 |
| `ctx.cargo` | re-run `sanitizeCargoList` | 274–277 |

What it does **not** do:

- No allowlist of `hullKind`. A snap `hullKind` stays on `ctx.player`.
- No allowlist of `classKey` beyond “use it if it is a `SHIP_CLASSES` key when healing NaN vitals” (`save.js` 235). A finite `classKey: 'frigate'` plus finite hull 900 **stays**.
- No sanitize of `player.name` or `player.faction`.
- No clamp of `credits` magnitude or sign (only `Number.isFinite`).
- No heal of `cargoCapacity` (`NaN` is a `number` and would pass line 354).
- No drop of extra player keys (`destroyed`, `bookValue`, `cargo` on the record, future `hullKind`, attacker-added fields).

### 5.4 Save-tamper surfaces (name the holes)

Local-only game. The live threat is a hand-edited `rimward-save-v1` / berth slot.

1. **`classKey`** — restore assigns it. Finite integrity is not rebuilt from the class table. Player turn uses the tampered key (`ship.js` 514). Repair NaN heal uses `SHIP_CLASSES[p.classKey]` if the key exists (`station.js` 1513).
2. **Extra player keys** — `Object.assign` keeps them (`save.js` 359). `hullKind: 'built'` forces HUD `mech` (`hud.js` 70) without an allowlist.
3. **`credits`** — persist via `WORLD_FIELDS` (`save.js` 66). Heal only if non-finite (`save.js` 242). A huge or negative purse loads.
4. **Equipment ladders** — `scanner` and `miningLaser` **are** allowlisted on restore. `concealedMounts` is a strict `true` flag. Those three are the model later hull fields should copy. `cargoCapacity` is **not** on that model.
5. **Names** — `world.shipName` is a `WORLD_FIELDS` string with no length / control-char heal. `player.name` rides the wholesale player blob. Dock / recognition paint them with `textContent` today (`station.js` 1450–1454, 2182–2183; `contacts.js` 466–469). That is the XSS hole if a later name UI uses `innerHTML`.

This brief does **not** propose a persist schema. It only names those holes.

---

## 6. Station dock services (no shipyard)

`DOCK_KEY_SERVICES` is frozen (`station.js` 116):

```
['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics']
```

Digit keys map to array order (`station.js` 2248–2251): `DigitN` → index `N - 1`. Menu labels are parallel (`station.js` 2188–2193):

| Digit | Service key | Label |
|---|---|---|
| 1 | market | Market |
| 2 | jobs | Jobs board |
| 3 | bar | Bar |
| 4 | feed | Feed & tend |
| 5 | repair | Repair |
| 6 | outfitting | Outfitting |
| 7 | people | People |
| 8 | launch | Launch |
| 9 | epics | Standing |

There is no tenth service. Grep of `station.js` finds no `shipyard`, `hangar`, `buyShip`, or `hullKind`.

### 6.1 Repair yard (exists)

- Rates: `REPAIR_RATES = { hull: 0.9, screen: 0.3, shell: 0.5, engine: 0.6 }` UU per missing integrity (`station.js` 123–126).
- UI: `renderRepair` (`station.js` 1902–1919). Action: `act.repairAll` (`station.js` 1501–1521).
- Faction / epic `repairMult` compose on the bill (`station.js` 1867–1872).
- `repairAll` rebuilds scrambled maxes from `createShipState(classKey or 'light')` then fills hull / screen / shell / engine (`station.js` 1513–1519). It does not change `classKey`, mesh, or `hullKind`.

### 6.2 Outfitting (exists; not a hull shop)

`renderOutfitting` (`station.js` 1923–1969):

- Hold racks: +10 capacity, 600 UU, max 2 upgrades from the 20-unit baseline (`station.js` 127–129, 1523–1530, 1925–1931). Cap today = 40 if both buys land.
- Wolfeye Mk I / Mk II (`station.js` 1932–1953).
- Concealed mounts (`station.js` 1938–1944).
- Mining heads Mk II–IV (`station.js` 1954–1968).

No hull purchase. No class picker. No hangar list.

### 6.3 Feed & tend (living-companion yard)

`renderFeed` (`station.js` 1855–1863) writes `ctx.bio` only (`station.js` 1476–1499). Fiction is “the living ship.” There is no branch for a built hull.

---

## 7. `FACTION_SERVICES` (no ship stock)

`src/game/state.js` 574–585. Generated-system dock modifiers only. Authored six are guarded out by id (`station.js` 1393–1396, 1422).

| Faction | Multiplier keys | Stock / hulls |
|---|---|---|
| freehold | `repairMult` 0.9 | none |
| veridian | `jobPayMult` 1.15 | none |
| redledger | `buyMult` 1.15 | none |
| ferrous | `repairMult` 0.85 | none |
| gilded | `sellMult` 1.15 | none |
| beautiful | `sellMult` 0.85 | none |
| congregation | `jobPayMult` 1.2 | none |
| assembly | `repairMult` 1.1 | none |
| independent | `jobPayMult` 1.1 | none |
| lamplighter | `buyMult` 0.85 | none |

`hollow` has no entry. No faction table lists a for-sale `classKey`.

---

## 8. HUD-02 hook (`hullKind` read-only)

`hudFamily(ctx)` (`hud.js` 64–74):

1. Session override `rw-hud-family` = `mech` | `bio` (`hud.js` 76–81).
2. Else `p.hullKind === 'built'` → `'mech'`.
3. Else `p.hullKind === 'living'` → `'bio'`.
4. Else `isBeautiful(p.faction)` → `'bio'` (`organic.js` 67–69: `faction === 'beautiful'`).
5. Else `'bio'`.

Applied at init and on the ~5 Hz write-on-change path (`hud.js` 793–799, 1272–1283). HUD **never writes** `hullKind`. Default live family is `bio` until a `'built'` hook exists.

---

## 9. Cargo vs companion (must survive a later hull swap)

### 9.1 Two cargo channels

| Channel | Role today | Persist |
|---|---|---|
| `ctx.cargo` | Player hold. Market, pods, jobs, survivors. Default `[]`. | Snap `cargo` via `sanitizeCargoList` (`save.js` 167, 351–353) |
| `ctx.cargoCapacity` | Hold size. Default `20` (`ctx.js` 102–104). | Snap number, unsanitized (`save.js` 168, 354) |
| `ctx.player.cargo` | Field on the ship **record**. NPCs read `rec.cargo ?? live.state.cargo` (`npc.js` 949). Player systems use `ctx.cargo` (`station.js` 913–921; `hud.js` 1407–1408; `pods.js` 604–607). | Rides wholesale `player` blob. Dead for the player hold. |

`holdUnits` / `addCargo` / scoop never write `ctx.player.cargo`.

### 9.2 Bio companion fields (not on the hull record)

`ctx.bio` (`ctx.js` 107–117), written by `bio.js` (`bio.js` 3–5, 46–161) and station feed/tend:

| Field | Meaning | Persist |
|---|---|---|
| `mood` | serene / keen / anxious / pained / feral | yes (`save.js` 169, 355–357) |
| `hunger` | 0..1 | yes; NaN heal 0.15 |
| `wounds` | 0..1 | yes; NaN heal 0 |
| `bond` | 0..1 | yes; NaN heal 0.1 |
| `growth` | 0..1 visible scale | yes; NaN heal 0 |
| `fedCount` | lifetime feedings | yes; NaN heal 0 |
| `speedFactor` / `turnFactor` | mood multipliers | yes; NaN heal 1 |
| `songEvent` | one-frame | forced `null` on snap / restore |

`ship.js` reads mood, wounds, growth, `speedFactor`, `turnFactor` to animate the **living** mesh (`ship.js` 24–25, 88, 431–433, 515, 562, 700–726). Those fields live on `ctx.bio`, not `ctx.player`. A later hull swap that replaces only `ctx.player` / the mesh must not drop `ctx.bio` if the companion is meant to survive.

Death without a save keeps her: wounds +0.4, mood `'pained'`, hunger at least 0.4, bond +0.02 (`save.js` 382–390). Death with a save restores bio then sets mood `'anxious'` (`save.js` 433–437). `bio.js` on `playerDestroyed` sets wounds = 1 (`bio.js` 94–98) before the overlay recover path runs.

---

## 10. Death, freshStart, berth slots

### 10.1 Death

Comment contract (`save.js` 43–48): `playerDestroyed` → SHIP LOST overlay (`save.js` 405–421, 446–450) → recover after 2500 ms or Enter / Space / Digit1 (`save.js` 59, 453–456).

`recover()` (`save.js` 427–444):

- If autosave exists: `restore(ctx, snap)` then `ctx.bio.mood = 'anxious'`.
- Else: `freshStart(ctx)`.
- Always emit `'She limped home.'`
- Boot load and death read **only** the autosave key (`save.js` 36–38, 432).

### 10.2 `freshStart`

`save.js` 375–402:

- Name kept: `ctx.world.shipName ?? ctx.player?.name` (`save.js` 377).
- `Object.assign(ctx.player, createShipState('light', { name }))` (`save.js` 378–379). `classKey` becomes `'light'`. Extra keys such as `hullKind` **KEEP** (assign does not delete).
- `ctx.cargo.length = 0` (`save.js` 381). Capacity is **not** reset.
- Bio survives as above. Mesh object is **not** rebuilt; position snaps to Freehold station (`save.js` 391–397).
- `ctx.world.currentSystem = 'freehold'` (`save.js` 399).

NEW GAME on the title screen is different: `clearAutosave()` then a page reload (`title.js` 15–18, 25–26). Manual berth slots survive. The new boot creates a fresh light player + living mesh.

### 10.3 Berth slots

- Autosave key `rimward-save-v1` (`save.js` 55).
- Manual keys `rimward-save-v1-slot-1..3` (`save.js` 56).
- Panel KeyL, space only (`save.js` 26–38, 459–462).
- Rows: AUTOSAVE + SLOT 1/2/3 (`save.js` 537–542). Same `{v:1}` envelope.
- Manual save uses `snapshot(ctx)` (`save.js` 651). Manual load calls `restore` (`save.js` 530–531).
- Death / boot do not read manual slots.

The player record in every slot is the same wholesale `ctx.player` blob.

---

## 11. Ship name, `classKey`, faction writes on the player

| Write | Who | Value | Cite |
|---|---|---|---|
| `ctx.player` create | `ship.js` | `createShipState('light')` → class `light`, name `'player'`, faction `'independent'` | `ship.js` 398; `state.js` 122–124 |
| `ctx.player` restore | `save.js` | `Object.assign` from snap (any of those fields) | `save.js` 359 |
| `ctx.player` death no-save | `save.js` | assign new light state; name from `shipName` or old name | `save.js` 377–379 |
| `ctx.player` repair | `station.js` | vitals only; copies name/faction into a **scratch** `createShipState` for NaN maxes | `station.js` 1513 |
| `ctx.player.classKey` live | none | no yard / hail / origin writer | grep of `player.classKey =` empty |
| `ctx.player.faction` live | none | no yard writer | grep of `player.faction =` empty |
| `ctx.player.hullKind` | HUD: never. SHP: not shipped. | unset on a clean boot | `hud.js` 70–71 reads only |
| `ctx.world.shipName` | `world.js` | `??= 'she'` after init / restore-safe | `world.js` 1368–1369 |
| `ctx.world.shipName` | `save.js` | persist / restore as a world field | `save.js` 68, 328–330 |

There is no rename UI. Comments still say “player-set later” (`ctx.js` 126; `contacts.js` 430–432). Recognition and the dock header read `ctx.world.shipName` (`contacts.js` 466–469; `station.js` 2182–2183). They do not read `ctx.player.name` except death’s fallback (`save.js` 377).

`ctx.player.faction` is `'independent'` unless a save stuffed another string. HUD uses it only for the Beautiful fallback (`hud.js` 72). `isBeautiful` is a strict `'beautiful'` check (`organic.js` 67–69).

---

## 12. Wishlist SHP wants (not shipped)

Quoted from `docs/PLAYER-EXPERIENCE-WISHLIST.md` 314–352 so later design does not treat them as APIs.

- **SHP-01** — faction shipyards; buy hulls; gate by reputation and price; faction/class matter to careers.
- **SHP-02** — own and store many ships; switch from any station; no physical ferry fiction required.
- **SHP-03** — bounded mounts / weapons / missiles / turrets; living ships can take conventional parts.

Related BIO wants (same wishlist 684–737) that touch hull identity but are **not** SHP inventory:

- BIO-01 obtain a living ship / seed.
- BIO-02 growth into larger classes.
- BIO-05 Abominations (built hull + living grafts).

**Not in the tree today:** shipyard service key, hangar UI, hull price table, multi-ship storage, player `buildShipMesh` swap, `hullKind` writer, persist allowlist for `hullKind`.

HUD-02 already prepared a **read** of `hullKind` (`hud.js` 64–74). That is the only SHP hook that shipped.

---

## 13. Files a later implementation wave is likely to touch

Do **not** edit these in Wave 63. Listed so the integrator can plan.

- `src/game/state.js` — `createShipState`, class table, any hull catalog.
- `src/game/save.js` — player allowlist / `hullKind` heal / hangar persist.
- `src/core/ctx.js` — player, cargo, possible hangar pointer.
- `src/systems/ship.js` — mesh swap vs living hull; class-driven flight.
- `src/systems/station.js` — new dock service; yard / hangar UI.
- `src/systems/hud.js` — already reads `hullKind`; must stay a non-writer.
- `src/game/flight-feel.js` — class turn tables.
- `src/systems/ship-assets.js` / `src/systems/npc.js` — conventional mesh builders if the player uses them.
- `src/game/ship-scale.js` — berth / proxy sizes.
- `src/game/bio.js` — companion survival across a built-hull swap.
- `src/systems/title.js` — NEW GAME vs hangar slots.
- `src/systems/organic.js` — Beautiful faction test.
- `docs/PLAYER-EXPERIENCE-WISHLIST.md` / `PROGRESS.md` — integrator later.

---

## 14. Cite checklist (acceptance)

| Claim | Cite |
|---|---|
| Player created as light | `ship.js` 398 |
| Live mesh is living hull; no swap | `ship.js` 7–25, 248–321, 393 |
| `createShipState` fields; no `hullKind` | `state.js` 118–139 |
| `SHIP_CLASSES` six keys + stats | `state.js` 34–41 |
| `WEAPONS` / `MINING_LASERS` / scanner / mounts | `state.js` 51–97, 279; `ctx.js` 135–138; `station.js` 1403–1405, 1532–1575 |
| Snapshot wholesale player | `save.js` 170 |
| Restore `Object.assign`; extra keys keep | `save.js` 359 |
| Sanitize heals ladders, not `hullKind` | `save.js` 232–256 |
| `DOCK_KEY_SERVICES` + digit map | `station.js` 116, 2188–2251 |
| Repair + outfitting; no shipyard | `station.js` 1501–1575, 1902–1969 |
| `FACTION_SERVICES` multipliers only | `state.js` 574–585 |
| HUD reads `hullKind`; default `bio` | `hud.js` 64–74 |
| `ctx.cargo` vs `player.cargo` | `ctx.js` 102–104; `state.js` 133; `npc.js` 949 |
| Bio fields on `ctx.bio` | `ctx.js` 107–117; `bio.js` 46–161 |
| Death / freshStart / berths | `save.js` 375–444, 537–542 |
| Name / class / faction writers | §11 table |
