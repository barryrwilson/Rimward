# SHP-02 — Magical hangar / multi-ship storage

**Merge law:** If this file conflicts with `out/w63/shared-contract.md`, the shared contract wins.

**Wave:** 63. Design only.  
**Status:** Hangar implementer brief. SHP-01 owns purchase. SHP-03 owns later mounts. Persist envelope is MERGE LAW in `out/w63/shared-contract.md` §1.2.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`, `docs/`, `PROGRESS.md`, or the wishlist.  
**Wishlist:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` SHP-02.  
**Fiction:** storage is magical. Any dock can switch any stored hull. Do not simulate physical delivery.

Integrator rule: purchase prices, yard stock, and reputation gates belong to SHP-01. Hardpoints belong to SHP-03. Do not invent persist keys beyond the contract envelope.

---

## 0. Law in one page

1. Persist the hangar on `ctx.world.hangar` and add `'hangar'` to `WORLD_FIELDS`.
2. Shape is **`{ mountedId, hulls }`**. The live hull **is a row in `hulls`**. `mountedId` names that row (`SAFE_ID`).
3. Cap default is **8 hulls** (the `hulls` array, including the mounted row). At cap, refuse a new hull. Switch still works. (Rejected: first-slice 4 owned / 3 stored-only. Contract §8 Q4 overrides.)
4. Switch is **docked only**. Refuse in flight, in combat, mid-jump, while dead, or while paused.
5. Dock service key is **`'shipyard'`**, appended after `epics`. **Digit 0** opens it. `KeyY` may be an extra. Do not use a unique first-slice hotkey that refuses Digit 0.
6. Cargo **stays with the hull**. The live hold is `ctx.cargo`. Each row stores its parked hold. Do not keep a second copy on `ctx.player.cargo`.
7. Bio companion (`ctx.bio`) is **not** a hull. Bond / hunger / wounds / growth / mood **survive** every swap.
8. Credits stay on `ctx.world.credits`. Never on a hull record.
9. Restore **rebuilds** hangar records from an allowlist. Never `Object.assign` a raw save object onto player or world.
10. SHP allowlists `ctx.player.hullKind` to `'built' | 'living'` and **deletes every other unknown player key**. **Then** if the faction is Unknowables, write `'living'`. HUD never writes `hullKind`. Do not add a HUD family persist key.
11. Persist `classKey` if it is a key of `SHIP_CLASSES` (`light` `heavy` `freighter` `ace` `cutter` `frigate`). Unknown keys **coerce to `'light'`**. First-slice **BUY** lists omit `frigate` / `ace` / `cutter` (SHP-01). Stored rows that pass `SHIP_CLASSES` stay.
12. New Game calls `clearAutosave()` only (`rimward-save-v1`). Manual berths `rimward-save-v1-slot-1..3` **must** keep their hangar blobs.
13. Do **not** insert a service into the middle of `DOCK_KEY_SERVICES`. Append `'shipyard'` after `epics`.
14. `state.js` is read-only for feature workers. Hangar helpers live in a new `src/game/hangar.js`.
15. First-slice career gear (`scanner`, `miningLaser`, `concealedMounts`) **lives on the hull row**. World keys are **live mirrors** of the mounted row (contract §1.1). Do not keep them only on `WORLD_FIELDS`.
16. Death + no autosave (`freshStart`) **rebuilds hangar to one living starter**. (Rejected: keep stored rows as a vault. Contract §1.3 overrides.)

---

## 1. Persist location

### 1.1 Recommendation

**`ctx.world.hangar` + `WORLD_FIELDS`.** Envelope: contract §1.2.

| Option | Verdict | Why |
|---|---|---|
| `ctx.world.hangar` = `{ mountedId, hulls }` | **Choose this** (contract) | Live hull is a row. One allowlisted blob. `snapshot()` already copies listed world keys. |
| `ctx.world.hangar` = `[]` stored-only + `player.hangarId` | **Rejected.** Contract overrides. | Two live copies (row vs player) and a new player persist key. |
| `snap.hangar` top-level | Reject | New snapshot sibling. Easy to forget on a future envelope bump. |
| On `ctx.player` | Reject | Player is **not** a whitelist today (`save.js` `snapshot` ~170 writes `player: ctx.player`; `restore` ~359 `Object.assign`s it). |

`WORLD_FIELDS` today (`save.js` ~65–82) has no `'hangar'`. Implementation **must** append it:

```js
// save.js WORLD_FIELDS — add one key, do not reorder the existing list
'hangar',
```

Shape on world (JSON-plain; no new keys):

```js
// ctx.world.hangar — magical, dock-global
{
  mountedId: 'hull_starter', // SAFE_ID, must name a row in hulls
  hulls: [
    {
      id: 'hull_starter',
      hullKind: 'living',        // 'living' | 'built' only
      faction: 'independent',    // sanitizeFaction
      classKey: 'light',         // must exist on SHIP_CLASSES
      name: '',                  // optional; mounted copy is world.shipName
      scanner: 0,                // 0|1|2
      miningLaser: 0,            // 0|1|2|3
      concealedMounts: false,    // literal true or false
      cargoCapacity: 20,
      cargo: [],                 // sanitizeCargoList
      hull: 100, hullMax: 100,
      screen: 40, screenMax: 40,
      shell: 60, shellMax: 60,
      engine: 100, engineMax: 100,
      heat: 0,
    },
  ],
}
```

Missing / non-object `hangar` on a legacy save → build **one** living starter row from the live `ctx.player` + current world mirrors. `mountedId` is that row. Do not heal to `[]`.

Do not persist `nextId` on world. Derive the next id from existing records (see §2.3).

Do **not** add a HUD key here. Family chrome reads `ctx.player.hullKind` at 5 Hz (`docs/Hud02IdentitiesDesign.md` §3.1).

Do **not** persist `ctx.player.hangarId`. The mounted pointer is `hangar.mountedId` only.

### 1.2 What already persists (do not duplicate)

| Channel | Fields | Hangar rule |
|---|---|---|
| `snap.world` via WORLD_FIELDS | credits, fear, reputation, jobs, scanner, miningLaser, concealedMounts, shipName, … | Credits / career stay world. `scanner` / `miningLaser` / `concealedMounts` / `shipName` are **mirrors of the mounted row**. Hangar is a new sibling key. |
| `snap.player` | live `createShipState` record + extra keys | Live mount numbers. After restore, allowlist (§10), then copy identity from the mounted row. |
| `snap.ship` | position + quaternion | Dock pose. Switch does not write this. |
| `snap.cargo` / `snap.cargoCapacity` | **live** hold | Live hold only. Same values as the mounted row after park / load. |
| `snap.bio` | companion | Never copy onto a hull. Never reset on switch. |

### 1.3 Snapshot must park the live hull (numbered)

`snapshot()` copies `world.hangar` as it exists. If the mounted row is stale, restore §9.3 would overwrite the live ship with old cargo / gear / vitals.

1. If `ctx.world.hangar` is a sanitized `{ mountedId, hulls }` object and `mountedId` names a row, call `parkMounted(ctx)` (§3.2.1) **before** the WORLD_FIELDS copy.
2. `parkMounted` includes the Unknowables force (`§3.2.1` step 6).
3. Do this on manual berth save, autosave, and `requestAutosave`. Destroyed / jumping saves are already refused by `trySave` gates.
4. Do not remount and do not write `ctx.bio`. Park is JSON only.

---

## 2. Record shape

A hull row is a **plain JSON object** built by the packer. It is never a live `createShipState` object and never a Three.js mesh. The mounted row and parked rows use the same allowlist.

### 2.1 Allowlisted fields

Copy only these keys (contract §1.2). Drop every other key.

```js
{
  id:        string,          // required, SAFE_ID, not a prototype key
  classKey:  keyof SHIP_CLASSES, // light|heavy|freighter|ace|cutter|frigate; else 'light'
  faction:   string,          // sanitizeFaction else 'independent'
  hullKind:  'built' | 'living', // omit if illegal; then Unknowables force 'living'
  name:      string,          // 1..40 after stripControlChars
  scanner:   0 | 1 | 2,
  miningLaser: 0 | 1 | 2 | 3,
  concealedMounts: boolean,   // literal true else false
  cargo:     CargoRow[],      // sanitizeCargoList (save.js)
  cargoCapacity: number,      // finite, ≥ 20; first slice also {20,30,40}
  hull:      number,
  hullMax:   number,
  screen:    number,
  screenMax: number,
  shell:     number,
  shellMax:  number,
  engine:    number,
  engineMax: number,
  heat:      number,
}
```

Do not persist `engineOut` (derive on load). Do not persist `integrity`, `loadoutRef`, `bio`, meshes, functions, `input`, `flags`, or HUD family.

### 2.2 Caps and string rules

Reuse `save.js` constants. Do not invent a second name/id budget.

| Field | Rule |
|---|---|
| `id` | `typeof === 'string'`, length 1..`ID_MAX` (64), `/^[a-z0-9_]+$/i`, **and** not a reserved key. Empty id → drop the row. |
| Reserved ids (drop the record) | `__proto__`, `prototype`, `constructor`, `toString`, `valueOf`, `hasOwnProperty`, `__defineGetter__`, `__defineSetter__`, `__lookupGetter__`, `__lookupSetter__` |
| `name` | `stripControlChars`, trim, slice `NAME_MAX` (40). Empty → class role string (`SHIP_CLASSES[classKey].role`) or `'hull'`. |
| `classKey` | `Object.hasOwn(SHIP_CLASSES, value)` — includes `ace` / `cutter` / `frigate`. Else **coerce to `'light'`**. Do not drop a stored row because the class is capital. |
| `faction` | `sanitizeFaction(value)` else `'independent'`. Do not drop the row. |
| `hullKind` | exact `'built'` or `'living'`. Anything else (including `'living+built'`, `'mech'`, `'bio'`, `true`) → **delete the field**. **Then** apply §2.6. Unset (non-Unknowables) = living HUD default. |
| `scanner` | `0\|1\|2` else `0` (same as world). |
| `miningLaser` | `0\|1\|2\|3` else `0` (same as world). |
| `concealedMounts` | literal `true` else `false`. |
| Numbers | finite. Non-finite vitals → rebuild from `createShipState(classKey)`. Clamp current ≤ max. Overwrite maxes from `SHIP_CLASSES[classKey]` (ignore tampered `hullMax`). |
| `heat` | finite ≥ 0. Else `0`. |
| `cargoCapacity` | finite and ≥ 20. First slice also clamp to `{20,30,40}` (base 20 + `CARGO_UPGRADE_STEP` 10 × at most `CARGO_UPGRADE_MAX` 2). Else 20. |
| `cargo` | `sanitizeCargoList`. Then drop units that exceed `cargoCapacity` from the **end** of the list. |
| Unknown keys | drop. Do not copy. |
| Prototype | build `{ ...allowlisted }` literals. Never `Object.assign(target, raw)`. Never use the id as an object key into `world`. |

### 2.3 Id generation

Prefix `hull_` + increment: `hull_1`, `hull_2`, … (`SAFE_ID` passes). Starter migrate may use `hull_starter` if free.

```
nextSeq = 1 + max of trailing integers on existing ids that match /^hull_(\d+)$/i
id      = 'hull_' + nextSeq
```

If that id collides (hand-edit), increment until free or the hull cap is hit. Do not use `Math.random()`. Do not use `Date.now()` as the only uniqueness.

### 2.4 Buy-list class filter (SHP-01, not persist)

```js
export const FIRST_SLICE_BUY_CLASS_KEYS = Object.freeze({
  light: true,
  heavy: true,
  freighter: true,
});
```

Yard **BUY** lists omit `ace`, `cutter`, and `frigate` (SHP-01 / contract §5). Persist sanitize does **not** use this table. A stored `frigate` that is a `SHIP_CLASSES` key **stays**.

### 2.5 `hullKind` write rules (SHP writes, HUD reads)

When packing or mounting:

| Purchase / hull | `hullKind` |
|---|---|
| Unknowables | **force** `'living'` (owner 2026-08-18). A tampered `'built'` on this faction is overwritten, not kept. |
| Beautiful Ones | `'living'` |
| Freehold / Ledger / Ferrous / other plated | `'built'` |
| Current independent starter (pre-purchase) | omit or `'living'` — HUD default is bio either way |
| Illegal / both / HUD tokens `mech`/`bio` | delete field, then apply §2.6 |

One field. There is no `living+built` combo. HUD never writes this field (`Hud02IdentitiesDesign.md` §3.4).

### 2.6 Unknowables force-`'living'` (every path)

`'built'` is a legal enum. `faction: 'unknowables'` plus `hullKind: 'built'` **must not survive**.

After the enum allowlist on **every** numbered path (pack / park, unpack / load, sanitize / restore, player allowlist, remount, buy stock):

```
if (faction === 'unknowables') hullKind = 'living';
```

Use the faction on **that object** (the row being written, or `ctx.player.faction` on player / remount). Also, after restore, if the **mounted row** is Unknowables, write `'living'` on the player. Do not leave this only in a claim table.

---

## 3. Mounted vs stored

### 3.1 Recommendation

**Live hull is a row in `hulls`.** Pointer: `hangar.mountedId`.

| Scheme | Verdict | Why |
|---|---|---|
| Live + parked all in `hulls`, plus `mountedId` | **Choose this** (contract §1.2) | One allowlisted store. Park writes the mounted row in place. Load reads another row. |
| Stored-only array + `player.hangarId` | **Rejected.** Contract overrides. | Dual live copy. Extra player persist key. |

After every park / load / restore, the mounted row and `ctx.player` must agree on `hullKind`, `faction`, and `classKey` (contract §4.4).

### 3.2 Switch flow (atomic)

Module: `src/game/hangar.js` `switchTo(ctx, id)`. Station UI only calls this. It does not mutate hangar by hand.

**Guards** (any fail → no writes, station notice):

1. `ctx.flags.docked === true`
2. `ctx.flags.combat !== true`
3. `ctx.gate?.jumping !== true`
4. `ctx.player` exists and `ctx.player.destroyed !== true`
5. `ctx.flags.paused !== true` (same reason berth load refuses: events would rot)
6. `id` allowlisted and **not** equal to `ctx.world.hangar.mountedId`
7. After sanitize, a hulls row with that `id` exists

**Steps** (all or nothing; if remount throws, restore the pre-switch snapshot of player + cargo + hangar + cargoCapacity + world mirrors):

1. `sanitizeHangar(ctx)` so `mountedId` names a real row.
2. `parkMounted(ctx)` — see §3.2.1.
3. `loadMounted(ctx, id)` — see §3.2.2.
4. `remountPlayerHull(ctx)` in `ship.js` — see §3.3.
5. Do **not** touch `ctx.bio`.
6. Do **not** touch `ctx.world.credits`, jobs, reputation, origin, epics, contacts.
7. No new `ctx.emit` type. Events in `ctx.js` are frozen. Station sets `ui.notice`. Optional existing `'commLine'` is allowed. HUD rereads `hullKind` / `faction` on the 5 Hz path.
8. After success, persist. **Default:** export a narrow `requestAutosave(ctx)` from `save.js`. It must call the same gates as `trySave` (`dead`, `ctx.gate.jumping`, `saveBlockReason`). A docked switch is already outside those blocks. Do not write a second serializer. SHP-01 buy uses the same hook so a purchase cannot sit only in RAM until undock.

Net `hulls.length` is unchanged. Own-count is unchanged.

#### 3.2.1 `parkMounted(ctx)` (numbered)

1. Let `rowId = ctx.world.hangar.mountedId`. Find that object in `hulls`. If missing, abort the switch (guard already failed).
2. Build a **new** allowlisted object from the live hull: identity triple, `name` from `ctx.world.shipName`, vitals, `heat`, `scanner` / `miningLaser` / `concealedMounts` from **world mirrors**, `cargo` from `ctx.cargo`, `cargoCapacity` from `ctx.cargoCapacity`. Copy only §2.1 fields. Do not `Object.assign({}, ctx.player)`.
3. Keep `id` equal to `rowId`.
4. `classKey`: if not a `SHIP_CLASSES` key, write `'light'`.
5. `hullKind`: keep only `'built'` or `'living'`; otherwise delete the field.
6. **If `faction === 'unknowables'`, write `hullKind: 'living'`.**
7. Replace the hulls slot with this new object (do not merge leftover keys).

#### 3.2.2 `loadMounted(ctx, id)` (numbered)

1. Let `incoming` be the hulls row with that `id` (already sanitized).
2. Start from `createShipState(incoming.classKey, { name: incoming.name, faction: incoming.faction })` so maxima come from `SHIP_CLASSES`. Call `createShipState` only with `Object.hasOwn(SHIP_CLASSES, classKey)`.
3. Copy allowlisted vitals (`hull`, `screen`, `shell`, `engine`, `heat`) already clamped. Derive `engineOut` from `engine / engineMax` vs `DEFENSE.engineOutAt`. Force `disabled` / `destroyed` / `surrendered` false.
4. Set `hullKind` only if `'built'` or `'living'`; otherwise delete `ctx.player.hullKind`.
5. **If `incoming.faction === 'unknowables'` or `ctx.player.faction === 'unknowables'`, write `ctx.player.hullKind = 'living'`.**
6. **Replace** `ctx.player` fields by writing the fresh state, then **delete every key not on the player allowlist** (§10). Do not `Object.assign(ctx.player, incoming)`.
7. Replace `ctx.cargo` contents with `sanitizeCargoList(incoming.cargo)`. Do not concat onto the old hold.
8. Set `ctx.cargoCapacity` to the record’s clamped capacity.
9. **Mirror** `incoming.scanner`, `incoming.miningLaser`, `incoming.concealedMounts` onto `ctx.world` (same heals as `sanitizeRestored`).
10. Set `ctx.world.shipName` to the record `name`.
11. Set `ctx.world.hangar.mountedId = incoming.id`.

### 3.3 Remount mesh (orphan / double-ship)

Player is **not** in `ctx.ships` (`src/game/traffic.js` only pushes NPCs). There is one `ctx.ship.object`.

`ship.js` today always builds `makeLivingHull` and assigns `ctx.player = createShipState('light')` (~398).

Implementation **must** add `remountPlayerHull(ctx)` owned by `ship.js`:

1. Keep `ctx.ship.object.position` / `quaternion` (already docked).
2. **If `ctx.player.faction === 'unknowables'`, write `ctx.player.hullKind = 'living'`.**
3. Choose culture from `hullKind` after step 2: `'living'` or unset → living path (`makeLivingHull` + swim / breath / heartbeat). `'built'` → plated faction mesh. Do not run living vertex swim on plated hulls.
4. Remove the old root from `ctx.scene`.
5. Dispose geometries / materials / textures on that root (no leaked GPU objects).
6. Build **one** new root from the kind chosen in step 3 + `faction` + `classKey` (SHP-01 / art owns the built mesh catalog).
7. Assign `ctx.ship.object = newRoot`. Zero `velocity` and `speed`.
8. Rebuild player combat flags from the parked row (or healthy baseline). Do not leave `destroyed` / `disabled` / `engineOut` stuck from the previous hull.
9. Leave MATCH alone except as `ship.js` already does while docked. Do **not** write `ctx.input.throttle`.
10. Do **not** `ctx.ships.push` the player.
11. Do **not** leave the old root in the scene.

Trail / scar / flesh-child caches inside `ship.js` must retarget the new root. If a cache still points at the disposed mesh, that is the “orphaned live mesh” regression.

A coder who only follows these steps cannot mount Unknowables as built: step 2 rewrites kind before the mesh branch.

### 3.4 Bio companion

Default (locked): she is not a hull.

On switch, death-with-save, and New Game reload she follows existing `save.js` / `bio.js` rules only. Hangar code must not write `ctx.bio`.

No cited reason to reset bond, hunger, wounds, or growth when the plated hull changes.

---

## 4. Capacity

```js
export const HANGAR_HULL_CAP = 8; // ctx.world.hangar.hulls.length max, includes mounted
```

Rejected alternative (do not implement): `HANGAR_OWNED_CAP = 4` / `HANGAR_STORED_CAP = 3`. Contract §8 Q4 default is **8**.

| Action | At cap |
|---|---|
| Switch | Allowed (swap). Length stays ≤ 8. |
| SHP-01 purchase | **Refuse**. Notice: hangar is full. Do not silently sell the mount. |
| Restore with `hulls.length > 8` | Keep the **mounted** row. Then keep earlier rows in array order until 8. Drop the rest from the tail. |
| Restore with duplicate ids | Keep the first. Drop later duplicates. |
| Restore with a stored `frigate` | Keep the row if `classKey` is a `SHIP_CLASSES` key. Unknown class → `'light'`. |

First-slice has **no sell / scrap / abandon**. Owner can reopen that later if the cap feels tight.

---

## 5. Switch UX

### 5.1 Service

**One appended `'shipyard'` service** (contract §2.2). Two panes:

| Pane | Owner | Content |
|---|---|---|
| Stock | SHP-01 | Faction yard list, price, reputation gate, Buy. |
| Hangar | SHP-02 | Owned hulls, Switch, current mount summary. |

If SHP-01 has not shipped, the Stock pane is an empty “no yard list yet” note. The Hangar pane still switches.

Magical storage: **every dock** shows this service, including independent / generated stations and docks that will not sell the faction of a parked hull. Buy list may be empty.

### 5.2 Digit keys — append after epics

`DOCK_KEY_SERVICES` today (`station.js` ~116):

```
['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics']
```

Digits 1–9 map 1:1 (`station.js` ~2248–2251). `Digit0` is index `-1` and is rejected today.

**Forbidden:** splice `'shipyard'` into the middle (would renumber Repair / Outfitting / People / Launch / Standing).

**Required (contract):**

```js
// later implementation — append only
[...existing nine, 'shipyard']
```

| Index | Digit | Key | Label |
|---|---|---|---|
| 0–8 | 1–9 | unchanged | unchanged |
| 9 | **0** | `shipyard` | `Shipyard` |

- Digits 1–9 keep today’s services.
- Digit **0** selects the appended `shipyard`. Implementation must special-case `Digit0` → last key, because `Number('0') - 1 === -1`.
- `KeyY` may also select `shipyard` (extra). Do not refuse Digit 0.
- Legend becomes `1-9, 0 select service · Esc/B launch` (or equal). Still `textContent`.
- Inside Shipyard (level 2): Digit **1** = Stock pane, Digit **2** = Hangar pane. Digit **3+** are SHP-01 buy rows or SHP-02 switch rows **on the active pane only** (pane-local index). Re-read `ui.shipyardPane` at keydown. Document the index in the legend.
- Copy uses `textContent` only (world `name` / `shipName`).

Rejected alternative: `DOCK_APPENDED_SERVICES` outside the digit list with **only** `KeyY` and “do not consume Digit0”. Contract Digit 0 overrides that unique first-slice hotkey.

### 5.3 Hangar pane rows

For each hulls row **except** `mountedId`, one row:

- `name` · `classKey` · faction display name · `hullKind` or “living (default)” · hull fraction
- Button `n — Make fast` (pane-local digit)

Current mount block at the top (not a switch target): name, class, faction, kind, hold used/cap, hull/screen/shell/engine, career-gear summary from the mounted row.

Empty extra slots: “No other hull in the aether. Buy one to keep this berth.” (After migrate there is always at least the starter row.)

Refuse copy when a guard fails: “Clamps hold. Switch only at a dock, out of a fight.”

---

## 6. Integrity / heat / engineOut

**Hull rows keep hull, screen, shell, engine, maxima, and `heat`.** Repair is a dock service on the **mounted** hull only.

| Field | Store? | Sanitize |
|---|---|---|
| `hull` / `screen` / `shell` / `engine` + maxes | Yes | Non-finite → rebuild from `createShipState(classKey)`. Overwrite maxes from class. Clamp current ≤ max. |
| `heat` | Yes (contract) | Finite ≥ 0 else 0. |
| `engineOut` | **No** (not a contract persist key) | Derive on load. Force `true` if `engine / engineMax ≤ DEFENSE.engineOutAt`. Force `false` otherwise. |
| `overheated` / `lastHitAt` / `lastCombatAt` | **No** | Remount uses `createShipState` defaults for those clocks. |
| `disabled` / `destroyed` / `surrendered` / `disabledDamage` | **No** | A docked player is not dead. Force false / 0 on park and load. |
| `personality` / `resolve` / `bounty` / `bookValue` | **No** on the hangar record | Recompute `bookValue` from class on load. |

A nearly dead parked hull stays nearly dead. That is the cost of not visiting Repair before you swapped.

---

## 7. Cargo and career gear

### 7.1 Cargo stays with the hull

`ctx.cargo` + `ctx.cargoCapacity` are the live hold. Park copies them onto the mounted row. Load replaces the live hold from the chosen row.

This is **not** a shared locker.

### 7.2 Why this and not a locker

| | Per-hull hold (choose) | Shared locker |
|---|---|---|
| Switch | No merge. Freighter keep stays on the freighter. | Capacity change can overflow. Need dump / refuse / delete rules. |
| Theft / loss | Die with a snapshot → restore that hangar. `freshStart` **rebuilds hangar to one living starter** (contract §1.3), so parked holds are gone. | One pile. Death / wipe is all-or-nothing. |
| Duplication risk | High if implementers also leave `ctx.player.cargo` filled. **Law:** live hold is only `ctx.cargo`. Park reads `ctx.cargo`. Player allowlist **deletes** `player.cargo` or forces `[]`. | High if locker + per-record cargo both exist. |
| Jobs / ferry | Consignment rides the hull that accepted it. Deliver after you remount that hull. | Switch cannot strand a job in a parked hold. |

**Theft / loss tradeoff (explicit):** magical storage means a parked hold cannot be boarded in the field. A player can park wealth in the aether and fly a fighter **until** a no-save death. `freshStart` is not a vault. Death-with-autosave still rewinds to the last snapshot (existing save.js header — no corpse run).

Rejected alternative: keep stored hangar cargo across `freshStart` (old Q6). Contract §1.3 overrides.

### 7.3 Career gear lives on the hull row

`scanner`, `miningLaser`, and `concealedMounts` are fields on **each hull row**. World keys are **live mirrors** of the mounted row (contract §1.1 / §5).

| Writer | Rule |
|---|---|
| Outfitter | Writes the **mounted** hull row, then mirrors to `ctx.world`. |
| Park | Copies current world mirrors onto the mounted row. |
| Load / restore | Copies the chosen / mounted row onto `ctx.world`. |
| Sanitize | Same heals as world: scanner `0\|1\|2`, miningLaser `0\|1\|2\|3`, concealedMounts literal `true` else `false`. |

Rejected alternative: keep these keys only on `WORLD_FIELDS` as shared career gear. Contract overrides.

`loadoutRef` is omitted. SHP-03 will attach later mounts.

### 7.4 Capacity on the hull

Outfitting `buyCargoRack` today mutates `ctx.cargoCapacity` (global). After SHP-02 it mutates the **mounted** hull’s capacity only, then mirrors to `ctx.cargoCapacity`. Parked hulls keep the capacity they had when packed.

Clamp on restore: finite ≥ 20, first slice `{20,30,40}` only.

---

## 8. When switch is legal

| State | Switch |
|---|---|
| Docked, overlay open, not in combat, not jumping, not dead, not paused | Yes, any dock |
| In flight | No |
| `ctx.flags.combat` | No (even if somehow docked) |
| `ctx.gate.jumping` | No |
| Death overlay / `player.destroyed` | No |
| Title / paused | No |
| Mid-purchase confirmation (SHP-01) | No until the buy commits or cancels |

There is no “remote switch” key in space. Convenience is the **any-dock** rule, not an in-flight menu.

---

## 9. Sanitize on restore

Call `sanitizeHangar(ctx)` from `sanitizeRestored` **after** world fields are copied and **before** or with player allowlist (order: world hangar → player allowlist → copy identity + mirrors from mounted row → live cargo list).

### 9.1 `sanitizeHangar(ctx)` (numbered)

1. If `ctx.world.hangar` is missing or not a non-array object, go to step 8 (starter rebuild).
2. Let `src = hangar.hulls`. If `src` is not an array, go to step 8.
3. Walk `src`. Drop non-objects. Drop arrays. For each remaining value, `rec = sanitizeHangarRecord(raw)`. Skip `null`.
4. Dedupe by `id`: first wins. Drop later duplicates.
5. Resolve `mountedId`: must be a string that names a remaining row. Else first remaining row. If no rows remain, go to step 8.
6. If `out.length > HANGAR_HULL_CAP` (8): keep the mounted row; then keep earlier remaining rows in array order until 8; drop the tail.
7. Write `{ mountedId, hulls: out }` as a new literal. Stop.
8. **Starter rebuild:** build one living starter from live `ctx.player` + current world mirrors (`scanner`, `miningLaser`, `concealedMounts`, `shipName`, `ctx.cargo`, `ctx.cargoCapacity`). Assign a free `SAFE_ID` (`hull_starter` if free). `hullKind`: `'living'`. Run §9.2 on that object (includes Unknowables force). Write `{ mountedId: that.id, hulls: [that] }`.

### 9.2 `sanitizeHangarRecord(raw)` (numbered)

1. Reject if `raw` is null, not an object, or `Array.isArray(raw)`.
2. Build a new object. Copy only §2.1 fields that pass §2.2. Drop `__proto__`, `prototype`, `constructor`.
3. `id`: must pass §2.2. Else return `null`.
4. `classKey`: if not `Object.hasOwn(SHIP_CLASSES, classKey)`, write `'light'`. Do not drop the row.
5. `faction`: `sanitizeFaction` else `'independent'`.
6. `hullKind`: keep only `'built'` or `'living'`; else omit the field.
7. **If `faction === 'unknowables'`, write `hullKind: 'living'`.**
8. Recompute maxima via `createShipState(classKey)` and clamp vitals. Non-finite → those rebuilt numbers. `heat` finite ≥ 0 else 0.
9. Heal `scanner` / `miningLaser` / `concealedMounts` as world. Sanitize cargo; trim to `cargoCapacity`.
10. Return the new object or `null`.

A coder who only follows step 6 then step 7 cannot keep Unknowables + `'built'`.

Also sanitize **live** `snap.cargoCapacity` to finite ≥ 20 and first-slice `{20,30,40}` in the same pass (today `restore` ~354 assigns any number). That is the same class of heal as `scanner` 0/1/2.

### 9.3 After hangar + player allowlist (numbered)

1. Let `row` be the hulls object whose `id === hangar.mountedId`.
2. Copy `row.faction` and `row.classKey` onto `ctx.player`.
3. Copy `row.hullKind` onto `ctx.player` if present; else `delete ctx.player.hullKind`.
4. **If `row.faction === 'unknowables'` or `ctx.player.faction === 'unknowables'`, write `ctx.player.hullKind = 'living'`.**
5. Mirror `row.scanner`, `row.miningLaser`, `row.concealedMounts` onto `ctx.world`.
6. Set `ctx.world.shipName` from `row.name`.
7. Replace `ctx.cargo` from `row.cargo`. Set `ctx.cargoCapacity` from the row.

---

## 10. Player-record allowlist (SHP must)

`restore` `Object.assign(ctx.player, snap.player)` (~359) **keeps unknown keys**. SHP implementation **must** run after that assign:

**Keep (and sanitize):**

`classKey`, `name`, `faction`, `hull`, `hullMax`, `screen`, `screenMax`, `shell`, `shellMax`, `engine`, `engineMax`, `heat`, `overheated`, `lastHitAt`, `lastCombatAt`, `engineOut`, `disabled`, `destroyed`, `surrendered`, `disabledDamage`, `disabledSince`, `bookValue`, `bounty`, `resolve`, `personality`, `hullKind`.

**Force (numbered):**

1. `classKey`: if not `Object.hasOwn(SHIP_CLASSES, classKey)` → `'light'` (live mount must exist).
2. maxima: overwrite from `createShipState(classKey)` (ignore tampered maxes).
3. vitals: existing finite heal in `sanitizeRestored` ~236–240, then clamp. `heat` finite ≥ 0 else 0.
4. `hullKind`: keep only `'built'` or `'living'`; else `delete ctx.player.hullKind`.
5. **If `ctx.player.faction === 'unknowables'`, write `ctx.player.hullKind = 'living'`.**
6. `cargo`: `delete ctx.player.cargo` or `[]` — live hold is `ctx.cargo`.
7. `credits` on player: **delete**. Credits are `ctx.world.credits`.
8. Delete `hangarId` if present (not a persist key).
9. Never call `createShipState` except with `Object.hasOwn(SHIP_CLASSES, classKey)`.

**Delete everything else**, including `hudFamily`, `family`, `__proto__` own props, and any future HUD debug key.

Then run §9.3 so a tampered player blob cannot disagree with the mounted Unknowables row.

Do **not** add a `WORLD_FIELDS` HUD key. Do **not** persist `sessionStorage['rw-hud-family']`.

---

## 11. Security (save-tamper)

Single-player `localStorage`. The threat is a hand-edited `rimward-save-v1` (or a berth slot) that grants fleet power without a yard purchase.

| Attack | Required defense |
|---|---|
| `classKey: 'not-a-class'` on a row | Coerce to `'light'`. |
| Stored `classKey: 'frigate'` | **Keep** (it is a `SHIP_CLASSES` key). BUY lists still omit it. |
| Live `classKey` unknown | Heal live mount to `'light'`. |
| `hullKind: 'living'` and a second built flag | Impossible: one field. Illegal token deleted. |
| Unknowables + `hullKind: 'built'` | Force `'living'` on pack, load, sanitize record, player allowlist, restore §9.3, remount, and buy stock. |
| `hangar` length 99 | Truncate to 8; mounted row kept. |
| `id: '__proto__'` | Drop the record. Array storage — never `hullsById[id] = rec`. |
| `id` used as a key into `world` or `FACTIONS` | Forbidden. Lookup is array scan + `Object.hasOwn`. |
| `faction: '__proto__'` | `sanitizeFaction` fails. Heal to `'independent'`. |
| Credits on each hull | Field not in allowlist. World credits already non-finite-heal to 350. |
| `cargoCapacity: 999` / `hullMax: 1e12` | Clamp capacity; recompute maxes from class. |
| `cargo` survivor mint | Existing `sanitizeCargoList`. Not a hangar-specific grant. |
| Prototype pollution via `Object.assign(player, rawRecord)` | Load uses `createShipState` + explicit fields only. |
| Infinite `nextId` / NaN ids | Regex + increment; reject non-strings. |
| Tampered row `scanner: 2` on a parked hull | Allowed as **that hull’s** gear after sanitize `0\|1\|2`. Does not change world until that row is mounted. |
| Two copies of Deepcore (row + world) | World is a mirror. Park/load/restore copy one way at a time. Outfitter writes row then world. |

Purchase is SHP-01. Hangar **does not** spawn a hull that was not packed from the live mount or bought through SHP-01. A crafted stored `heavy` still grants a heavy if the player loads the save — same class of local cheat as editing `credits`. The allowlist stops **undefined classes**, **unbounded slots**, **Unknowables-as-built**, and **pollution**, not every numeric cheat.

---

## 12. Death vs New Game vs berths

| Path | Hangar | Live mount | Berth slots 1–3 |
|---|---|---|---|
| **New Game** (`title.js` → `clearAutosave()` → reload) | Autosave hangar gone with `rimward-save-v1`. New session migrates to one living starter. | Fresh `light` from `ship.js`. | **Must survive.** Each slot keeps its own `world.hangar` inside its `{v:1}` blob. `clearAutosave` must not grow a slot loop. |
| **Death + autosave exists** | Restore snapshot hangar wholesale (then sanitize). | Restore snapshot player (then allowlist + §9.3). Existing “no corpse run / last berth” (`save.js` header § DEATH). | Untouched. |
| **Death + no autosave** (`freshStart`) | **Rebuild** to one living starter (contract §1.3). Do **not** keep parked rows. Do **not** pack the wreck. | Rebuild `light` (`save.js` ~378–380). **Then run §10 + §9.3.** `Object.assign` does **not** delete leftover `hullKind`. Omit or set `hullKind: 'living'`. If leftover faction is Unknowables, still write `'living'`. Live cargo cleared (~381). World career-gear mirrors reset from the new starter row (`scanner` 0, `miningLaser` 0, `concealedMounts` false). | Untouched. |
| **Manual berth Save** | `snapshot()` copies `world.hangar` because it is on WORLD_FIELDS. | Live player + cargo. Park first or snapshot the already-synced mounted row. | Writes that slot only. |
| **Manual berth Load** | `restore()` copies WORLD_FIELDS including hangar, then sanitize. | Object.assign + allowlist + §9.3. | Reads that slot only. |

**Forbidden:** wiping `rimward-save-v1-slot-1..3` on New Game.  
**Forbidden:** storing hangar **only** in a new top-level key that berth `snapshot()` forgets.

Rejected alternative: `freshStart` keeps parked hulls as a vault (old Q6). Contract §1.3 overrides.

`freshStart` numbered hangar heal:

1. Existing `Object.assign(ctx.player, createShipState('light', { name }))`.
2. Run §10 player allowlist (enum, then Unknowables → `'living'`).
3. Force `hullKind: 'living'` on this recovery light. Delete leftover `'built'`.
4. Build one starter row from this light + cleared starter gear. `sanitizeHangarRecord` (includes §9.2 step 7).
5. Write `ctx.world.hangar = { mountedId: starter.id, hulls: [starter] }`.
6. Mirror starter gear onto world. Replace `ctx.cargo` with `[]`. Set capacity 20.

Bio on these paths stays the existing `save.js` contract (anxious on death-reload; pained + wound on `freshStart`). Hangar does not write her.

---

## 13. First slice vs later

### First slice (this design)

- Persist `{ mountedId, hulls }`. Live hull is a row.
- Cap **8** hulls.
- Persist any `SHIP_CLASSES` key; unknown → `'light'`. BUY omits `ace` / `cutter` / `frigate`.
- Magical any-dock switch.
- Per-hull cargo + capacity.
- Per-hull `scanner` / `miningLaser` / `concealedMounts`; world keys are mirrors.
- No sell / scrap / rename UI (name comes from pack / purchase).
- No `loadoutRef`.
- No delivery timer.
- No new ctx event type.
- No insurance beyond last snapshot.
- Service `'shipyard'` appended; Digit 0; optional KeyY.
- Player + hangar allowlists in `sanitizeRestored`. Unknowables forced `'living'` on every numbered path.
- `freshStart` rebuilds hangar to one living starter.

### Later (not this brief)

- More slots, maybe a purchased hangar upgrade.
- Sell / scrap / abandon to free a slot.
- Rename.
- SHP-03 later missiles / turrets / mass-power.
- Class-specific base cargo.
- Purchase receipts so a crafted `hullKind: 'built'` cannot force mech without a yard.
- Optional insurance: destroy the mount, keep parked hulls, spawn a cheap light.
- `frigate` / `ace` / `cutter` in BUY lists (SHP-01 later).

---

## 14. Implementation map (for the later code wave)

| File | Change |
|---|---|
| `src/game/hangar.js` | **New.** `HANGAR_HULL_CAP`, `sanitizeHangarRecord`, `sanitizeHangar`, `parkMounted`, `loadMounted`, `switchTo`, `ownedCount`, `canAcceptPurchase`. Pure data. Every writer that sets `hullKind` runs §2.6. |
| `src/game/save.js` | `WORLD_FIELDS += 'hangar'`. `snapshot()` runs §1.3 park first. Call `sanitizeHangar`. Player allowlist + §9.3 + Unknowables → `'living'`. Clamp live `cargoCapacity`. `requestAutosave` (same gates as `trySave`). **Do not** touch slot keys in `clearAutosave`. `freshStart` runs §12 numbered hangar heal. |
| `src/systems/station.js` | Append `'shipyard'` after `epics`. Digit 0 → last key. Optional `KeyY`. Two panes, hangar rows. Digit 1–9 unchanged. `textContent` only. Outfitter writes **mounted row then world mirrors**. |
| `src/systems/ship.js` | `remountPlayerHull(ctx)` including §3.3 step 2 (Unknowables → `'living'`). No second player in `ctx.ships`. |
| `src/core/ctx.js` | Comment only if `requestAutosave` needs a note. **No new event type.** |
| `src/game/state.js` | **Do not edit** (feature-worker read-only). |
| HUD | No write. 5 Hz already rereads `hullKind`. |

### 14.1 SHP-01 Buy path (numbered)

1. `if (!canAcceptPurchase(ctx)) refuse` (`hulls.length >= HANGAR_HULL_CAP`).
2. Deduct **world** credits from the authored catalog (never a hull purse). Re-check reputation. Do not trust a save `price`.
3. Build a stock row (SHP-01 data). It must pass `sanitizeHangarRecord` before use.
4. `hullKind` enum on that row; **if stock `faction === 'unknowables'`, write `'living'`**.
5. `parkMounted(ctx)` so the current live hull is stored in its row (player **keeps** the old hull — they do not trade it away).
6. Push the new row onto `hulls`. If the buy also mounts: `loadMounted(ctx, newId)` (**replace** `ctx.cargo`, do not concat), then `remountPlayerHull`.
7. `requestAutosave`.

---

## 15. Regression risks (acceptance)

| Risk | Guard |
|---|---|
| Orphaned live mesh / double player ship | One `ctx.ship.object`. Dispose old root. Never `ctx.ships.push` the player. |
| Bio reset on switch | Hangar writes no `ctx.bio` field. |
| Cargo duplication | Live hold = `ctx.cargo` only. Delete `player.cargo`. Park/load replace, do not concat. |
| Cargo wipe of a parked hull | Switch parks then loads. Tests: freighter ore still on the freighter row after fighter hop. |
| Tampered hangar grants unknown class stats | Unknown `classKey` → `'light'`. Known `SHIP_CLASSES` keys including `frigate` stay. |
| Infinite slots | Cap 8 on sanitize and on purchase. Mounted row kept. |
| Prototype id | Reserved-id drop; array only. |
| New Game wipes berths | `clearAutosave` remains `removeItem('rimward-save-v1')` only. |
| Digit 1–9 remap | Append `'shipyard'`. Digit 0 special-case. Optional KeyY. |
| HUD family persist | No new key. `hullKind` allowlist only. |
| Mid-jump / in-flight switch | Guards. |
| `Object.assign` pollution | Rebuild records and player from allowlists. |
| Unknowables mounts as `'built'` | §2.6 on pack, load, sanitize, player allowlist, restore §9.3, remount, buy. |
| Dual gear (row vs world) | World is a mirror. One writer order: row then world, or row → world on load. |
| `freshStart` keeps a purchased fleet | §12 rebuilds to one living starter. |

---

## 16. Open owner questions (defaults apply if unanswered)

| # | Question | Default |
|---|---|---|
| 1 | Owned-cap 8? | **8** (contract §8 Q4). Rejected: 4 / 3 stored-only. |
| 2 | Persist any `SHIP_CLASSES` key? | **Yes.** Unknown → `'light'`. BUY omits ace / cutter / frigate. Rejected: drop stored capital rows. |
| 3 | Sell / scrap in the first code wave? | **No.** Purchase refuses at cap. |
| 4 | Rename in the hangar pane? | **No.** |
| 5 | Scanner / laser / Q-ship per hull? | **Yes, on the hull row.** World keys are mirrors. Rejected: shared-only WORLD_FIELDS. |
| 6 | `freshStart` (death, no save): keep parked hangar? | **No.** Rebuild one living starter (contract §1.3). Rejected: keep-stored vault. |
| 7 | Shipyard hotkey? | **Digit 0.** KeyY extra allowed. Rejected: KeyY-only first slice. |
| 8 | New `hullSwitched` event? | **No.** Frozen event list. HUD 5 Hz + `commLine` optional. |
| 9 | Crafted `hullKind: 'built'` without a receipt? | **Allow the token** on non-Unknowables (heal only the enum). Unknowables still forced `'living'`. Receipts later. |
| 10 | Insurance that consumes the dead mount but keeps parked hulls? | **No.** Last snapshot wins. No-save death rebuilds starter. |
| 11 | Should `requestAutosave` export from `save.js`? | **Yes**, used by switch and SHP-01 buy. |
| 12 | May SHP-01 hide Stock at docks with no yard while Hangar stays? | **Yes.** Hangar is any-dock. Stock visibility is SHP-01. |

---

## 17. Worked examples

### 17.1 First purchase (SHP-01 + this record)

Player docks in a light independent starter. Hangar is `{ mountedId: 'hull_starter', hulls: [starter] }`. Buys a Freehold heavy.

1. `canAcceptPurchase` → `1 < 8`.
2. `parkMounted` writes the living light into the starter row (cargo, gear mirrors, `hullKind: 'living'`).
3. Push heavy row `{ id: 'hull_1', classKey: 'heavy', faction: 'freehold', hullKind: 'built', scanner: 0, … }`.
4. If the buy mounts: `loadMounted('hull_1')` — empty cargo, capacity 20, world mirrors from that row, `mountedId: 'hull_1'`.
5. Remount built mesh. HUD 5 Hz → `mech`.
6. Bio unchanged. Credits decremented on world. Autosave.
7. `hulls.length === 2`. Both rows exist. Live hull is the heavy row.

### 17.2 Switch at a Hollow dock (not the purchase yard)

Hangar has starter + heavy. Mount is the heavy. Player opens **0 — Shipyard → 2 Hangar → 1 Make fast** (KeyY also opens Shipyard).

1. Guards pass (docked, not combat, not jumping).
2. Park heavy (with its hold and gear) into its row; load starter row.
3. Remount living mesh. `hullKind: 'living'`. HUD → `bio`. World mirrors become the starter’s scanner / laser / mounts.
4. Heavy ore is gone from the live hold and present on the heavy row.

### 17.3 Unknowables tamper (must not mount built)

Save has a row `{ faction: 'unknowables', hullKind: 'built', classKey: 'light', id: 'hull_x' }` and `mountedId: 'hull_x'`. Player blob also has `hullKind: 'built'`.

1. §9.2 step 6 keeps `'built'` (legal enum).
2. §9.2 step 7 writes `'living'` because faction is Unknowables.
3. §10 step 4 would keep player `'built'`; step 5 writes `'living'` if player faction is Unknowables.
4. §9.3 step 4 writes player `'living'` because the mounted row is Unknowables.
5. Remount §3.3 step 2 writes `'living'` again, then takes the living mesh.
6. HUD → `bio`. No path leaves `'built'` on this faction.

### 17.4 Death with autosave

Last dock saved hangar `{ mountedId, hulls: [light, heavy] }`. Player dies in space. Overlay → restore. Same hangar after sanitize. Bio anxious. Same as any other WORLD_FIELDS restore.

### 17.5 Death with no autosave

Player owns three hulls, dies, no `rimward-save-v1`. `freshStart` rebuilds a light and **one** living starter hangar. Parked ore is gone. Leftover `'built'` on the player is deleted. World gear mirrors are starter zeros.

### 17.6 New Game after a berth save

Player sealed slot 1 with eight hulls. New Game clears autosave only. Reload: living starter only. KeyL → Load slot 1: eight hulls return (sanitize cap). Slots 2–3 untouched.

---

## 18. Citation index

| Claim | Source |
|---|---|
| Extra player keys persist | `save.js` `snapshot` ~170, `restore` `Object.assign` ~359 |
| `sanitizeRestored` heals vitals / scanner / miningLaser / cargo | `save.js` ~232–278 |
| `clearAutosave` only `rimward-save-v1` | `save.js` ~200–206; `title.js` ~25–26, ~15–19 |
| `freshStart` rebuilds light, clears cargo, keeps world, wounds bio | `save.js` ~375–402 |
| `WORLD_FIELDS` whitelist | `save.js` ~65–82 |
| `sanitizeFaction` | `save.js` ~111–118 |
| `DOCK_KEY_SERVICES` 1–9; Digit0 rejected today | `station.js` ~116, ~2189, ~2248–2251 |
| `SHIP_CLASSES` / `createShipState` | `state.js` ~34–41, ~118–138 |
| `FACTIONS` | `state.js` ~527–542 |
| `hullKind` SHP writes, HUD reads | `docs/Hud02IdentitiesDesign.md` §3.1 / §3.4; wishlist owner 2026-08-18 |
| Bio is not a hull | task lock; `ctx.js` ~107–117; `save.js` bio comment ~46–48 |
| Events frozen | `ctx.js` ~188–210 |
| `state.js` read-only for feature workers | `state.js` header ~7–8 |
| Cargo upgrade ladder | `station.js` `CARGO_UPGRADE_*` ~127–129 |
| Player not in `ctx.ships` | `src/game/traffic.js` NPC spawn only |
| Wishlist SHP-02 | `docs/PLAYER-EXPERIENCE-WISHLIST.md` ~328–335 |
| Persist envelope / Digit 0 / cap 8 / gear mirrors / freshStart rebuild | `out/w63/shared-contract.md` §1.1–1.3, §2.2, §8 |
