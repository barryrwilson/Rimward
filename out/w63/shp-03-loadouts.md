# SHP-03 — Loadouts and bounded customization

| Field | Value |
|---|---|
| **Title** | SHP-03 loadouts / customization |
| **Wave** | 63 — design only |
| **Status** | DESIGN. No `src/` or `scripts/` in this wave. |
| **Wishlist** | `docs/PLAYER-EXPERIENCE-WISHLIST.md` SHP-03 |
| **Depends on** | SHP-01 hull stock. SHP-02 hangar record. This note does not own those envelopes. |
| **Not this wave** | TGT-04 turrets. HUD-03 audio-alert settings. New HUD tree. Missiles. Mass / power sim. BIO-02 growth-center. Wishlist or `PROGRESS.md` edits. |

Integrator rule: if an implementation PR and this file conflict, this file wins until the owner changes a default in §9.

---

## 0. Law in one page

1. First slice binds **existing** cannon / disruptor / mining / scanner / Q-ship to a **per-hull** loadout when a hangar exists. It does **not** add missiles or turrets.
2. `miningLaser`, `scanner`, and `concealedMounts` move off shared `WORLD_FIELDS` onto the mounted hull. One Deepcore lance must not sit on every stored ship.
3. Combat numbers stay in `WEAPONS` / `MINING_LASERS` / `HEAT` / `DEFENSE`. Saves persist **ids and ladder indexes only**.
4. HUD glance set stays. A new later weapon shows in **WPN text**, not a lock box, not a new HUD tree.
5. Living starter quality must not drop. Light hulls keep two general mounts plus a mining provision. Conventional parts may seat on living hulls. BIO-02 is not required.
6. Outfitter stays the existing dock service. Do not insert a new key in the middle of `DOCK_KEY_SERVICES`.
7. Persist is allowlisted and sanitized. Prototype keys die. Unknown families (including any missile rack this build does not know) are dropped.
8. Mass / power / ammo sim does **not** block SHP-01 / SHP-02. First slice keeps the shipped heat model.

---

## 1. Current combat (cite only — do not invent)

There is **no** per-hull mount table today. There are **no** missiles and **no** player turrets.

### 1.1 Weapon families

`src/game/state.js` `WEAPONS` (85–97):

- `cannon` — Energy cannon. `damage` 8, `rof` 6, `speed` 900, `range` 500, `heatPerShot` 4, `family: 'energy'`.
- `disruptor` — Disruptor. `damage` 10, `rof` 2.5, `speed` 700, `range` 350, `heatPerShot` 6, `family: 'disruptor'`, `shieldMult` 2, `engineMult` 2, `hullMult` 0.25.
- `mining` — derived from `MINING_LASERS[0]` so the ladder is the single source of truth. `applyHit` uses the family key; combat reads the **installed** head via `miningLaserFor(ctx.world.miningLaser)`, never this row’s numbers.

`MINING_LASERS` (51–76) is a four-rung ladder. Index **is** `ctx.world.miningLaser` (0..3):

| Index | key | name | tier | cost |
|---|---|---|---|---|
| 0 | `mk1` | Mining laser Mk I | 1 | 0 (stock) |
| 1 | `mk2` | Bore laser Mk II | 2 | 1400 |
| 2 | `mk3` | Ferrous cutting head Mk III | 3 | 4200 |
| 3 | `mk4` | Deepcore lance Mk IV | 4 | 11000 |

`miningLaserFor(tier)` (`state.js` 79–82) heals a non-integer / out-of-range index to Mk I.

### 1.2 Player groups and HUD

- `ctx.input.weaponGroup` is 1 / 2 / 3 (`ctx.js` 78). Session input. Not persisted.
- `combat.js` `GROUP_WEAPON` (169): `{ 1: 'cannon', 2: 'disruptor', 3: 'mining' }`.
- `hud.js` `WEAPON_KEYS` (185): `['cannon', 'disruptor', 'mining']`.
- WPN text (`hud.js` 1390–1397): `weaponGroup · name`. Group 3 uses `miningLaserFor(ctx.world.miningLaser).name`. `WEAPONS.mining.name` is permanently the Mk I label.

### 1.3 Heat and defense

- `HEAT` (`state.js` 98): `{ max: 100, coolPerSec: 12, overheatUnlockAt: 40 }`.
- `DEFENSE` (`state.js` 101–112): screen / shell layers, recharge, engine-out, disable.
- `createShipState` (`state.js` 118–139) builds vitals from `SHIP_CLASSES[classKey]`. It does not attach weapons.

### 1.4 Scanner and Q-ship

- Scanner ladder is `ctx.world.scanner` 0 / 1 / 2. Outfitter: Wolfeye Mk I (`SCANNER_COST` 400), Mk II (`SCANNER2_COST` 900) seats only on Mk I (`station.js` 1532–1547, 1932–1953).
- Contacts arc is scanner-gated (`Hud02IdentitiesDesign.md` / `hud.js`). 0 = no arc. ≥1 Mk I bubble. ≥2 Mk II pierce + longer arc.
- Q-ship: `ctx.world.concealedMounts` literal `true` (`HIDDEN_MOUNTS.cost` 900, `state.js` 279). `npc.js` 1286–1291 offers hail `showTeeth` only when the flag is true. `hail.js` 247–260 rolls `HIDDEN_MOUNTS.bluffBase + fear * bluffPerFear`.

### 1.5 Persist today

`save.js` `WORLD_FIELDS` (65–82) allowlists world keys. Equipment keys on that list:

- `'scanner'`
- `'concealedMounts'` (wave 30)
- `'miningLaser'` (wave 51; comment: `ctx.world.miningLaser` is the only writer target)

`sanitizeRestored` (`save.js` 246–256):

- `concealedMounts !== true` → `false`
- scanner not in `[0, 1, 2]` → `0` (wave-34 close of wave-31 LOW: a hand-edited `99` / `'2'` must not restore Mk II)
- miningLaser not in `[0, 1, 2, 3]` → `0` (wave-51: same reasoning; no free Deepcore)

`snapshot()` copies only `WORLD_FIELDS` for world. `player` is written wholesale (`save.js` 170). `restore()` `Object.assign(ctx.player, snap.player)` (359). `cargoCapacity` is a **sibling** of world (`snap.cargoCapacity`, 354), not a `WORLD_FIELDS` key.

`station.js` heals missing ladders: `ctx.world.scanner ??= 0`; `ctx.world.miningLaser ??= 0` (1403–1405).

### 1.6 Dock keys

```
DOCK_KEY_SERVICES = ['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics']
```

`station.js` 116. Level-1 Digit1–9 map onto that array in order (2249–2251). Level-2 outfitting Digit1–7 are already bound (2281–2287):

| Digit (in outfitting) | Action |
|---|---|
| 1 | Expand hold (`CARGO_UPGRADE_*`) |
| 2 | Wolfeye Mk I |
| 3 | Concealed mounts |
| 4 | Wolfeye Mk II |
| 5 / 6 / 7 | Mining Mk II / III / IV (`buyMiningLaser(n - 4)`) |

Digit 8 and 9 are free **inside** outfitting. They are **not** free on the dock root.

### 1.7 Classes

`SHIP_CLASSES` (`state.js` 34–41): `light` (player), `heavy` (combat), `freighter` (trade), `ace` (ace), `cutter` (pirate), `frigate` (capital). Starter is `createShipState('light')`, default faction `'independent'`, living mesh (`Hud02IdentitiesDesign.md` §3.3).

---

## 2. First slice vs later

### 2.1 First slice (this design’s implementation series)

**Bind the equipment that already exists to the hangar hull**, so a ship swap does not share one `miningLaser` / scanner / Q-ship across every stored hull.

In scope:

- Per-hull `loadout` on the SHP-02 hangar record.
- One-shot migrate of legacy `WORLD_FIELDS` onto the **mounted** hull.
- Readers and writers (`combat.js`, `hud.js`, `station.js` outfitter, `npc.js` / `hail.js` `showTeeth`) resolve through the mounted hull (direct or write-through mirror — §3).
- Mount **counts** by `classKey` gate what the outfitter will sell. No new families.
- Starter / light quality unchanged: two general mounts (cannon + disruptor fitted) plus mining Mk I provision.
- Sanitize / allowlist / prototype-key rules (§8).

Out of first slice:

- Missiles, launchers, ammo sim, lock boxes, missile-warning gauges.
- Turrets / automatic guns (TGT-04). Mounts may be **reserved** as empty counts only.
- New `WEAPONS` families (plasma, flak, …).
- Mass / power budgets.
- HUD-03 settings. New HUD instruments.
- BIO-02 Beautiful growth-center.
- Unequip that strips the living starter’s cannon or disruptor.

### 2.2 Later slice (not scheduled here)

- Missile class + launcher hardpoints + hull ammo (§5).
- Additional conventional families filling reserved general / missile counts on large combat hulls.
- TGT-04 consumes reserved turret mounts. SHP does not implement auto-aim.
- Optional mass / power / heat-per-fit depth **after** the shipyard ships.

Default: **do not start the later slice in the same PR train as SHP-01 / 02 / 03-first.**

---

## 3. Where fields live after SHP

### 3.1 Ownership

| Field | Owner | After SHP-03 first slice | Why |
|---|---|---|---|
| Hull catalog (price, faction gate, mesh, `classKey`, `hullKind`) | **SHP-01** | Stock row. Not a loadout. | Shipyard inventory. |
| Hangar instance (`instanceId`, storage, swap) | **SHP-02** | Envelope. `loadout` is a child object SHP-03 defines. | Multi-ship storage. |
| `loadout.miningLaser` 0..3 | **SHP-03** | **Per-hull** | Sharing one Deepcore across stored ships is the named regression. |
| `loadout.scanner` 0..1..2 | **SHP-03** | **Per-hull** | Outfitter bolts an eye to **this** hull. A stock freighter must not keep a Mk II bought on a scout. |
| `loadout.concealedMounts` bool | **SHP-03** | **Per-hull** | Q-ship is a hull fit. `showTeeth` follows the mounted hull. |
| `loadout.general` | **SHP-03** | **Per-hull** allowlisted `WEAPONS` keys except `mining` | First slice: `['cannon','disruptor']` on light. No unequip. |
| `loadout.cargoCapacity` | **SHP-03** rack / **SHP-02** transfer | **Per-hull** integer | Outfitter already sells racks onto the live ship (`ctx.cargoCapacity`). Cargo **contents** stay SHP-02. |
| Reserved `missile` / `turret` slot counts | **SHP-03** table | Counts on the **class**, not persisted as racks | Empty until a later wave. Do not persist unknown rack ids. |
| `ctx.world.credits`, fear, reputation, jobs, … | world | Stay on `WORLD_FIELDS` | Career, not fit. |
| `ctx.input.weaponGroup` | input | Session | Do not persist. |
| `player` vitals, `classKey`, `hullKind` | player / SHP-01 | `hullKind` allowlist is SHP-01 (`living`\|`built`) | HUD family. Not a weapon. |
| `ctx.bio` | bio | World/player companion | Not a mount. Do not gate conventional guns on growth. |
| `HEAT` / `DEFENSE` / `WEAPONS.*.damage` | prototypes | **Never persist** | Sanitize rejects save-supplied combat stats. |

### 3.2 Live mirrors (transition)

Today every reader hits `ctx.world.miningLaser` / `scanner` / `concealedMounts`. First-slice PR1 may keep **write-through mirrors** on `ctx.world` so unconverted readers do not fork:

1. Mounted hull `loadout` is source of truth when a hangar exists.
2. After migrate, swap, or outfitter buy: copy the three ladders onto `ctx.world.*` and `ctx.cargoCapacity`.
3. `sanitizeRestored` heals the **hull** first, then overwrites any remaining world keys from the hull. A stale world `miningLaser: 99` must not win.

When every reader listed in §10 PR2 has switched, drop the three keys from `WORLD_FIELDS` and stop writing them. Until that PR, keep the wave-51 / wave-34 heals on the world keys **and** apply the same heals to the hull.

### 3.3 Legacy `WORLD_FIELDS` migration

Trigger: first load or first hangar create after SHP-02 exists, for the **currently mounted** hull only. Other stored hulls that SHP-02 seeds empty get **stock** loadouts (§3.4), not a copy of the world Deepcore.

Migrate copies **once**. Sanitize runs **every restore, on every hangar hull**, including stored ships that never sat in the world-key era.

```
function migrateWorldLoadoutOnce(ctx, mountedHull):
  if (mountedHull.loadout && mountedHull.loadout.v === 1) return  // skip copy only

  mountedHull.loadout = {
    v: 1,
    miningLaser: ctx.world.miningLaser,
    scanner: ctx.world.scanner,
    concealedMounts: ctx.world.concealedMounts === true,
    general: ['cannon', 'disruptor'],
    cargoCapacity: ctx.cargoCapacity,
  }

function restoreHangarLoadouts(ctx, hangar):
  migrateWorldLoadoutOnce(ctx, hangar.mounted)
  for (const hull of hangar.hulls):
    hull.loadout = sanitizeLoadout(hull.loadout, hull.classKey)  // always; never Object.assign
```

`v === 1` must not skip the heal. A hand-edited `{ v: 1, miningLaser: 99 }` on a stored hull still becomes Mk I.

After migrate:

- Snapshot persist of those world keys is **deprecated**. Prefer persist on the hangar hull (SHP-02 envelope).
- If a later snapshot still contains world `miningLaser` / `scanner` / `concealedMounts`, restore **ignores** them when `loadout.v === 1` exists on the mounted hull. Then sanitize the old keys to the healed hull values (or omit them on the next snapshot).
- A save with **no** hangar keeps today’s world-key path and today’s heals. Do not break pre-SHP boots.

`loadout.v` is a small integer schema mark, not a combat stat. Unknown `v` → treat as missing and rebuild from stock + any still-present world keys.

### 3.4 Stock loadout (new hull, or stored hull with no migrate)

```
stockLoadout(classKey) =
  sanitizeLoadout({
    v: 1,
    miningLaser: 0,                 // Mk I, cost 0
    scanner: 0,
    concealedMounts: false,
    general: defaultGeneral(classKey),  // light/cutter/freighter/heavy/ace/frigate: cannon+disruptor
    cargoCapacity: 20,
  }, classKey)
```

`defaultGeneral` in first slice is always `['cannon','disruptor']` for every class that has `general >= 2` in §4. No class in §4 has `general < 2`, so the living starter does not lose a group.

### 3.5 Swap

SHP-02 owns the swap. SHP-03 requires:

1. Write current live loadout **back** to the outgoing hull (mirrors → hull) before unmount.
2. Apply incoming hull `loadout` to live mirrors / readers.
3. Do not copy `miningLaser` from the outgoing hull onto the incoming hull.
4. `ctx.input.weaponGroup` stays as-is if that group still exists; else fall back to `1`.
5. Cargo **contents** are SHP-02. Default if the incoming `cargoCapacity` is smaller than units in the hold: refuse the swap (or SHP-02’s documented clamp). SHP-03 does not add a second cargo array.

---

## 4. Mount table (counts only)

Source of `classKey`: `SHIP_CLASSES` keys. Counts are **maximum seated items of that mount kind**. First slice does not add families, so extra reserved counts stay empty.

| classKey | role | general | mining | scanner | qship | missile (later) | turret (TGT-04 reserve) |
|---|---|---|---|---|---|---|---|
| `light` | player starter | 2 | 1 | 1 | 1 | 0 | 0 |
| `cutter` | pirate | 2 | 1 | 1 | 1 | 0 | 0 |
| `freighter` | trade | 2 | 1 | 1 | 1 | 0 | 0 |
| `heavy` | combat | 2 | 1 | 1 | 1 | 2 | 2 |
| `ace` | ace | 2 | 1 | 1 | 1 | 2 | 1 |
| `frigate` | capital | 2 | 1 | 1 | 1 | 4 | 4 |

Notes:

- Wishlist: starter / small = one or two general plus a mining provision. **Default two** so the shipped starter (cannon + disruptor + mining) is not weakened.
- Wishlist: large combat hull can take every **conventional** family, subject to counts. First slice families are only cannon / disruptor / mining. Frigate / heavy / ace reserve missile and turret counts so a later wave can fill them without a table rewrite.
- `general` in first slice accepts only `cannon` and `disruptor` (one of each). It is not a multi-cannon bank.
- `mining` is a provision, not a career lock. A frigate may fit a head. A light may fit Mk IV if the player pays the ladder.
- `scanner` and `qship` are 0-or-1 seats. The ladder lives in the seated item, not in extra sockets.
- Unknown `classKey` → treat as `light` (same heal as `createShipState` / `sanitizeRestored`).

Implement the table as a frozen `MOUNT_TABLE` next to `SHIP_CLASSES`. Do not read counts from the save.

---

## 5. Power / mass / heat / ammo

**First slice: keep `HEAT` as shipped. Skip mass, power, and ammo.**

Reasons:

- `HEAT` already gates fire (`max` 100, `coolPerSec` 12, `overheatUnlockAt` 40). Combat and HUD already show strain from `player.heat`.
- A mass / power ledger would block SHP-01 / SHP-02 on numbers this wave does not have.
- Cannon / disruptor / mining / scanner / Q-ship have no ammo today. Do not invent magazines for them.

Later depth (not a shipyard gate):

- Optional `mass` / `power` on catalog rows, summed against a class budget.
- Missile ammo only, on the hull loadout, allowlisted max from the catalog.

Do not persist heat. `sanitizeRestored` already heals `player.heat`.

---

## 6. Missiles (later sketch only)

Not first slice. Sketch so HUD and persist do not paint themselves into a corner.

- New catalog family `missile` with launcher hardpoints (`MOUNT_TABLE.missile`).
- Persist `{ id: <allowlisted launcher>, ammo: <int 0..catalogMax> }`. Never persist `damage` / `rof` / blast radius.
- Fire from a **new weapon group** (likely 4) when a launcher is seated. `GROUP_WEAPON` / `WEAPON_KEYS` gain one key. WPN text becomes `4 · <launcher name>`.
- **Forbidden in HUD-02 / first HUD glance set** (`docs/Hud02IdentitiesDesign.md` non-goals; `docs/HudUtilityChangeProposal.md` “heat-seek / aspect-lock missiles, lock box, missile-warning gauge”):
  - no lock box
  - no 13 s Interceptorz timer
  - no missile-warning gauge
  - no new HUD tree
- Aspect / heat-seek lock is a later TGT concern, not SHP-03 first slice.
- A save that contains a missile rack id this build does not know is stripped (§8). Empty reserved counts are not racks.

Turrets: reserved counts only. TGT-04 will define auto-fire and whether a turret needs a HUD affordance. SHP-03 first slice must not add one.

---

## 7. Living ships

Wishlist: living ships accept conventional components **in addition to** biological growth.

Rules:

- Mount table is by `classKey`, not by `hullKind`. A living `light` and a built `light` share counts.
- Conventional ids (`cannon`, `disruptor`, mining ladder, Wolfeye, concealed mounts) may seat on `hullKind: 'living'`.
- Weapons do not pick the HUD. Family stays `bio` on a living hull (`Hud02IdentitiesDesign.md` §3.3). WPN still names the installed gun.
- Do **not** require a Beautiful growth-center (BIO-02, later) to seat or fire conventional guns.
- Do **not** strip the living starter: stock Mk I, cannon, disruptor, scanner 0, no Q-ship unless bought.
- `ctx.bio` feed / tend stay on the **feed** dock service. They are not outfitting rows.
- Unknowables purchased hulls stay `hullKind: 'living'` (SHP-01). They still take this loadout schema.

---

## 8. Outfitter UI

**Use the existing outfitting service.** Digit keys on the dock root are already spent.

- SHP-03 must not insert a service in the middle of `DOCK_KEY_SERVICES` (that would renumber jobs / bar / feed / repair / people / launch / epics and break `scripts/boot-test.mjs` Digit assumptions).
- SHP-01 shipyard, if it needs a dock row, **appends**. That is SHP-01’s problem. SHP-03 does not add a dock service.
- First slice can ship with **no new outfitting digits** if it only rebinds storage. Buy actions stay Digit1–7 and write the **hull** loadout (plus mirrors).
- If first slice needs a “this hull’s fit” readout, add notes, not new services.
- Later families / missiles append as Digit8+ **inside** level-2 outfitting only, or as a second page opened from outfitting. Do not steal dock Digit8 (`launch`) or Digit9 (`epics`).
- Cargo rack math stays `20 + used * 10`, `used` 0..2 (`CARGO_UPGRADE_*`). After hangar, the rack integer lives on the hull.

---

## 9. Security

Trust boundary: `localStorage` `rimward-save-v1` (and slots). The player can hand-edit JSON. Treat every restore as hostile.

### 9.1 Allowlist

Frozen catalog, own-property checks only (`Object.hasOwn` or a `Map`). Suggested first-slice ids:

```
cannon
disruptor
mining.mk1 | mining.mk2 | mining.mk3 | mining.mk4
scanner.0 | scanner.mk1 | scanner.mk2     // or persist the 0..2 integer only
concealed
```

Implementation may persist the **integer ladders** already used (`miningLaser`, `scanner`) plus `concealedMounts: true|false` plus `general: string[]`. That is preferred: it matches wave-51 / wave-34 heals. If strings are used, they must map 1:1 onto those ladders.

Reject: `__proto__`, `constructor`, `prototype`, any key not in the catalog, any `WEAPONS` key this build does not define.

### 9.2 Never trust save-supplied combat stats

A loadout object must not carry `damage`, `rof`, `speed`, `range`, `heatPerShot`, `shieldMult`, `extractPerSec`, or beam colors. `applyHit` (`state.js` 145–146) already looks up `WEAPONS[family]`. Combat must keep that lookup. A crafted `{ miningLaser: 3, damage: 999 }` drops `damage`.

`cargoCapacity` is an integer heal: finite, trunc, clamp to `20 + k * CARGO_UPGRADE_STEP` for `k` in `0..CARGO_UPGRADE_MAX`.

### 9.3 Prototype keys

Do not `for…in` a save `loadout` into the live object. Do not `Object.assign(hull.loadout, snap.loadout)`. Build a fresh record from known fields. Same class of bug as HUD lookups on `FACTIONS` / `SYSTEMS` (`out/w61/inventory-security.md`).

`sanitizeFaction`-style `SAFE_ID` is not enough for equipment: `constructor` matches `/^[a-z0-9_]+$/i`. The catalog check is mandatory.

### 9.4 Unknown future families

If `loadout.missile` or `general: ['missile']` or any id absent from this build’s catalog appears, **drop that seat** and leave the mount empty. Log nothing sensitive. Do not persist a missile rack the build does not know.

Reserved turret / missile **counts** live in `MOUNT_TABLE` (code), not in the save.

### 9.5 Heal table (must not break wave-51 / wave-34)

| Input | Result |
|---|---|
| missing hangar | today’s world heals only |
| hangar present | `sanitizeLoadout` on **every** hull every restore (not only the mounted one) |
| hangar, missing loadout | migrate §3.3 then heal |
| `miningLaser` not in `{0,1,2,3}` | `0` (Mk I) |
| `scanner` not in `{0,1,2}` | `0` |
| `concealedMounts` not literal `true` | `false` |
| `general` has unknown / proto keys | strip; if cannon/disruptor missing and mounts allow, refill stock pair |
| extra own-keys on loadout | drop |
| world key present after migrate | overwrite from hull; omit on next snapshot once readers switched |

Outfitter remains the only **purchase** writer. Combat / HUD are read-only toward loadout.

---

## 10. Open owner questions (defaults)

These are decided for implementation unless the owner overrides.

| # | Question | Default |
|---|---|---|
| Q1 | Scanner: world career vs per-hull? | **Per-hull.** Contacts arc follows the mounted ship. |
| Q2 | Q-ship: world vs per-hull? | **Per-hull.** `showTeeth` follows the mounted ship. |
| Q3 | Cargo racks per-hull? Cargo contents? | **Racks per-hull.** Contents are SHP-02 (transfer vs leave-in-hold). First slice does not invent a second cargo array. |
| Q4 | May the player unequip cannon or disruptor? | **No** in first slice. Protects living-starter quality and keeps three WPN groups. |
| Q5 | Duplicate cannons in extra general mounts? | **No.** One of each first-slice family. Extra counts wait for later families. |
| Q6 | When do world keys leave `WORLD_FIELDS`? | After PR2 readers switch, in PR3. Not in PR1. |
| Q7 | Frigate / heavy mining provision? | **Yes** (1). Not a miner-only socket. |
| Q8 | Light missile / turret reserve? | **0.** Small hulls stay clean. |
| Q9 | SHP-03 dock service? | **No.** Outfitting only. |
| Q10 | Mass / power in first slice? | **No.** Keep `HEAT`. |
| Q11 | HUD group for a later missile? | New group text in WPN. No lock box. |
| Q12 | Beautiful-only conventional ban? | **No.** Living hulls accept conventional parts. |
| Q13 | Tampered `loadout.v`? | Treat as missing; rebuild stock + migrate if world keys remain. |
| Q14 | Death / `freshStart`? | Stock light loadout (`save.js` `freshStart` already resets player to `createShipState('light')`). Hangar policy is SHP-02. |

---

## 11. Serial PR plan (after SHP-01 and SHP-02)

Do not land these before hangar records exist. Do not mix missiles into this train.

| PR | Name | Touches (planned) | Gate |
|---|---|---|---|
| **PR1** | Schema + migrate + sanitize | `state.js` `MOUNT_TABLE` + `sanitizeLoadout`; hangar child `loadout`; `save.js` heal every hull; write-through mirrors. No combat feel change. | Boot: pre-SHP save still heals world `miningLaser` 0..3. Hangar save migrates once onto the mounted hull. Every stored hull is rebuilt from the allowlist (no `Object.assign`). `99` / `'2'` / `{__proto__}` cannot grant Mk IV / Mk II. |
| **PR2** | Readers | `combat.js` `miningLaserFor(loadout)`; `hud.js` WPN name + mining range; contacts still `scanner` 0/1/2 from hull; `npc.js` / `hail.js` `showTeeth` from hull. | WPN still `1 ·` / `2 ·` / `3 · <installed head>`. Glance set unchanged. No new HUD nodes. |
| **PR3** | Writers + swap | `station.js` outfitter writes hull then mirrors; SHP-02 swap applies §3.5; drop world keys from `WORLD_FIELDS` once PR2 is in. | Two stored hulls: buy Mk IV on A, swap to B, B is Mk I. Swap back, A is Mk IV. Outfitter Digit1–7 unchanged. |
| **PR4** | Mount gates | Outfitter refuses a buy the class table does not allow. Still no new families. | Light cannot accept a persisted missile seat (none exist). Unknown classKey heals to light table. |

**Stop.** Later wave: missiles + new families + TGT-04 consuming reserved turret counts.

Suggested tests (implementation wave, not this design wave):

- Wave-51 path: world-only save, no hangar, `miningLaser` 0..3 round-trip and `99` heals to 0.
- Hangar path: migrate copies world Mk III onto mounted hull only; a second stored stock hull stays 0.
- Scanner 0/1/2 and concealed `true`/`"yes"`/`1` heals (only literal `true` wins).
- Swap isolation: Deepcore does not follow the pilot onto a stored stock hull.
- Prototype key / extra `damage` field dropped.
- `DOCK_KEY_SERVICES` order unchanged.
- HUD still three groups; no lock box; no HUD-03 key.

---

## 12. Regression risks (named)

| Risk | Mitigation |
|---|---|
| Moving `miningLaser` onto the hull breaks the wave-51 sanitize / heal | PR1 keeps world heals when no hangar. Hull uses the **same** `[0,1,2,3]` include check. World key cannot override a migrated hull. |
| One Deepcore lance shared across every stored ship | Per-hull field. Migrate **mounted** hull only. Swap writes back, then applies the incoming hull. |
| Missiles force HUD-02 lock UI | First slice has no missiles. Later sketch forbids lock box / warning gauge. WPN text only. |
| Mass / power sim blocks the shipyard | First slice skips both. SHP-01 / 02 must not wait on a ledger. |
| Living starter weakened | Light `general: 2` + mining provision. No unequip. Stock Mk I stays free. |
| Digit remap of dock services | Outfitter only. No insert into `DOCK_KEY_SERVICES`. |
| HUD-03 audio-alert settings | Out of scope. Do not add `settings.js` keys. |
| TGT-04 implemented “while we are here” | Reserved counts only. No auto-gun code. |
| `Object.assign` of save loadout | Forbidden. Fresh record from allowlist on **every** hangar hull every restore. |
| Stored (unmounted) hull skips heal because `v === 1` | Migrate-once skips the world **copy** only. Sanitize still runs. |
| `player` wholesale persist of a crafted `loadout` | Loadout lives on the hangar hull, not as an unsanitized `player` extra. If a stray `player.loadout` appears, delete it on sanitize. |

---

## 13. Non-goals (checklist)

- [ ] No missiles in first slice.
- [ ] No turret implementation (TGT-04).
- [ ] No HUD lock box, missile warning, or new glance instrument.
- [ ] No HUD-03 settings.
- [ ] No insert into `DOCK_KEY_SERVICES`.
- [ ] No mass / power ledger.
- [ ] No BIO-02 growth-center requirement.
- [ ] No wishlist or `PROGRESS.md` edit in the design wave.
- [ ] No `src/` / `scripts/` in the design wave.

---

## 14. Verification (this design wave)

Domain: data.

How to verify:

1. Read this note.
2. Confirm first slice does not require missiles or turrets.
3. Confirm legacy `WORLD_FIELDS` migration is specified (§3.3) and wave-51 / wave-34 heals are preserved.
4. Confirm HUD non-goals: glance set stays; WPN text only; no lock box.
5. Confirm no `src/` or `scripts/` diffs in the design wave.
