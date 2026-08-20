# SHP shared contract

**Wave:** 63. Design only. No shipyard, hangar, or hull swap ships in this wave.  
**Status:** MERGE LAW for the integrator. If SHP-01 / SHP-02 / SHP-03 notes conflict with this file, this file wins.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`, or `docs/`. Do not edit the wishlist or `PROGRESS.md`.  
**Locked sources:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` initiative SHP + BIO preserve note + HUD-02 `hullKind` notes; `docs/Hud02IdentitiesDesign.md` hullKind / Unknowables / HUD never writes hullKind / no HUD-03 skin checkbox; `src/systems/station.js` `DOCK_KEY_SERVICES`; `src/game/save.js` `WORLD_FIELDS` + `Object.assign` player + `sanitizeRestored` + `clearAutosave` berth rule; `src/game/state.js` `createShipState`, `SHIP_CLASSES`, `WEAPONS`, `MINING_LASERS`; `src/systems/ship.js` living starter mesh; Wave 62 `hudFamily` in `src/systems/hud.js`. Wave 61 `out/w61/shared-contract.md` is a FORMAT reference only — do not copy HUD glance tables.

Integrator rule: this file freezes merge law from the locked sources. Parallel SHP-01 / SHP-02 / SHP-03 briefs must obey it.

---

## 0. Law in one page

1. This wave is markdown only. Implementation is a later serial wave (same pattern as Wave 61 → 62).
2. Hull identity (`hullKind` + `faction` + `classKey`) is SHP-owned. HUD reads only. HUD never writes `hullKind`.
3. Unknowables purchased hulls are living. SHP must set `hullKind: 'living'` (not `'built'`). Owner 2026-08-18.
4. Live default stays the living starter until a `'built'` hull is mounted. Unset `hullKind` stays `bio` for every faction. Mech is session-debug / `hullKind: 'built'` only until that mount.
5. Hangar is magical and dock-global. Stored ships switch from any station. Fiction does not simulate delivery.
6. Do not insert dock services into the middle of `DOCK_KEY_SERVICES`. Append only. First slice adds **one** service after `epics`.
7. World strings use `textContent`. No `innerHTML` / `insertAdjacentHTML` / `document.write` of names, notices, catalog lines, or save strings.
8. Persist is allowlisted and sanitized. Hangar rides `WORLD_FIELDS`. `hullKind` is a player-record field with a `living`|`built` allowlist. No new HUD family key. No `settings.js` skin key.
9. Bio companion is not a hull and survives swaps. Do not factory-reset `ctx.bio` on buy, park, remount, or New Game-adjacent hull work. Death already keeps her (`save.js` `freshStart`).
10. First implementation ships shipyards + hangar + `hullKind`. SHP-03 first = move existing equipment onto the hull. Missiles, turrets, and mass-power are later.
11. Do not weaken the living player ship motion or skin. `ship.js` `makeLivingHull` (swim / breath / heartbeat) is the BIO preserve benchmark.

---

## 1. Persist contract

### 1.1 Snapshot map (today, locked)

| Blob | Owner today | How it persists | SHP rule |
|---|---|---|---|
| `ctx.world.*` listed in `WORLD_FIELDS` | world / station / save | `snapshot()` copies only those keys (`save.js` 65–82, 160–162). `restore()` writes only those keys (328–330). | Add **`hangar`** to `WORLD_FIELDS`. Nothing else HUD-shaped. |
| `ctx.player` | `ship.js` creates via `createShipState`; combat/station mutate | Wholesale `player: ctx.player` (170). `restore()` `Object.assign(ctx.player, snap.player)` (359). | Extra keys **keep** today. SHP must copy `hullKind` on purpose and allowlist it. HUD must not write it. |
| `ctx.cargo` / `ctx.cargoCapacity` | station / pods | Own snapshot fields (167–168, 351–354). Cargo runs `sanitizeCargoList`. | First-slice equipment: these travel with the **mounted** hull. Park/load through hangar slots. |
| `ctx.bio` | `bio.js` | Spread copy; `songEvent` forced null (169, 355–358). `freshStart` wounds her, does not reset (375–390). | Not a hull. Do not store bio on a hangar slot. |
| `ctx.world.scanner` | station outfitting | `WORLD_FIELDS`; `sanitizeRestored` allowlists `0\|1\|2` (247–250). | Live **mirror** of the mounted hull. Swap copies hull → world. |
| `ctx.world.miningLaser` | station outfitting | `WORLD_FIELDS`; allowlist `0\|1\|2\|3` (256). Ladder into `MINING_LASERS`. | Same mirror rule. |
| `ctx.world.concealedMounts` | station outfitting | `WORLD_FIELDS`; only literal `true` restores (244–246). | Same mirror rule. |
| `ctx.world.shipName` | world / station | `WORLD_FIELDS`. | Display name of the **mounted** hull. Park/load with the slot `name`. |
| `ctx.world.credits` / `reputation` / jobs / origin | world / station | `WORLD_FIELDS`. Credits/fear heal to finite (242–243). | Career, not hull. Survive every swap. |
| `ctx.input.weaponGroup` | `controls.js` | **Not persisted.** Groups 1/2/3 = cannon / disruptor / mining (`ctx.js` 78). | Stay input. Do not invent a persist key for group. The **mining head** is the equipment. |
| `ctx.settings` | `settings.js` | `rimward-settings-v1`. | No HUD-skin checkbox. No SHP key. |
| Manual berths | `save.js` | `rimward-save-v1-slot-1..3`. Same `{v:1}` envelope. | Hangar rides the envelope via `WORLD_FIELDS`. |
| Autosave | `save.js` `KEY` | `rimward-save-v1`. | `clearAutosave()` removes **only** this key (200–206). Manual berths keep hangar. New Game does not invent a second hangar store. |

`createShipState` (`state.js` 118–138) does **not** emit `hullKind`. `state.js` is marked READ-ONLY for feature workers. First slice writes `hullKind` at SHP mount / sanitize sites. Do not smuggle it through a silent `createShipState` edit in a parallel PR.

### 1.2 New world field: `ctx.world.hangar`

Assume this location. Whitelist discipline: the field exists only after it is listed on `WORLD_FIELDS`.

JSON-plain shape:

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
      // parked vitals (finite numbers only; same keys sanitizeRestored already heals)
      hull: 100, hullMax: 100,
      screen: 40, screenMax: 40,
      shell: 60, shellMax: 60,
      engine: 100, engineMax: 100,
      heat: 0,
    },
  ],
}
```

Rules:

- Missing / non-object `hangar` on a legacy save → build one starter row from the live `ctx.player` + current world mirrors. Starter `hullKind` is `'living'`. `mountedId` is that row.
- `hulls` must be an array. Drop non-objects. Cap length (default **8**, see §8).
- Each row: drop unknown keys. Drop `__proto__`, `prototype`, `constructor`.
- `id`: string matching `SAFE_ID` (`save.js` 85), length ≤ `ID_MAX` (64). Dedupe by first wins. Empty id → drop the row.
- `hullKind`: `'living'` or `'built'` only. Anything else → **delete** the key on that row (HUD fall-through is `bio`). Unknowables rows that survive sanitize must be `'living'`.
- `classKey`: must be a key of `SHIP_CLASSES` (`light` `heavy` `freighter` `ace` `cutter` `frigate`). Else coerce to `'light'`.
- `faction`: `sanitizeFaction`. Else `'independent'`.
- `scanner` / `miningLaser` / `concealedMounts`: same heals as world.
- `cargo` / `cargoCapacity`: `sanitizeCargoList`; capacity finite and ≥ 20 (stock hold).
- Vitals: non-finite → rebuild from `createShipState(classKey)`. Clamp current ≤ max.
- `mountedId` must match a remaining hull. Else first hull, or starter rebuild.
- Do not persist meshes, THREE objects, functions, `bio`, `input`, `flags`, HUD family, or session debug keys.

### 1.3 Player-record field: `ctx.player.hullKind`

SHP-owned. Tokens: `'living'` | `'built'`.

After every `Object.assign(ctx.player, snap.player)` and after every mount:

1. If `hullKind` is not `'living'` or `'built'`, **delete** `ctx.player.hullKind`.
2. If the mounted hangar row is Unknowables, force `'living'`.
3. Do not accept `'mech'`, `'bio'`, `'live'`, `true`, `1`, or any other token.

`sanitizeRestored` today heals NaN vitals only (232–241). It does **not** drop unknown keys. A hand-edited `hullKind: 'built'` on the living starter **sticks** until SHP allowlists. That is why HUD must never write the field, and why SHP sanitize is mandatory.

`freshStart` does `Object.assign(ctx.player, createShipState('light', { name }))` (379). That assign does not clear leftover keys. SHP must delete or rewrite `hullKind` on that path so a no-save death cannot keep a purchased `'built'` identity on a new light hull. Hangar is world-owned: a no-save death also rebuilds hangar to the single living starter. A **saved** death restores the snapshot hangar.

### 1.4 Forbidden keys

| Key / surface | Forbidden because |
|---|---|
| `WORLD_FIELDS` HUD / family / `data-family` | Family is derived. Hud02IdentitiesDesign. |
| `ctx.settings` HUD-style / `rw-hud-*` | Owner 2026-08-18: no HUD-03 free skin override. |
| `sessionStorage['rw-hud-family']` copied onto player or world | Session debug only (HUD-02). Persist would force family. |
| Hangar stored on `ctx.player` | Player is not a whitelist. Restore would keep unsanitized slots. |
| New `localStorage` hangar key | One envelope. Berth rule stays `clearAutosave` + surviving manual slots. |
| Persist `ctx.input` / `flags.matchSpeed` / mesh | Input and MATCH are live. Mesh is remounted. |
| Persist `ctx.config.ship` | Live flight envelope. Remount copies it from authored `SHIP_CLASSES`. |
| Persist bio on a hull | Companion is not a hull. |
| Prototype keys on hangar or player extras | `__proto__` / `constructor` / `prototype`. |

### 1.5 Owners

| Field | Writer | Readers | Sanitize |
|---|---|---|---|
| `player.hullKind` | SHP mount / buy / restore heal only | `hudFamily`, remount | `living`\|`built` or delete |
| `player.faction` | SHP mount / buy; `createShipState` default `'independent'` | HUD (`isBeautiful` after kind miss), combat, station | `sanitizeFaction` |
| `player.classKey` | SHP mount / buy; starter `'light'` | **Turn** already (`hoverTurnRateFor`). Cruise only after remount copies the class onto `ctx.config.ship`. Vitals rebuild. HUD must **not** switch on it | `SHIP_CLASSES` or `'light'` |
| `world.hangar` | SHP + `save.js` restore | Shipyard UI, remount | §1.2 |
| `world.scanner` / `miningLaser` / `concealedMounts` | Outfitter writes the **mounted** hull, then mirrors to world | combat / hud / station (today) | Existing world heals |
| `world.shipName` | SHP swap + existing rename | Station head, HUD | Existing string path; `textContent` |
| `credits` / `reputation` | Station buy / jobs — **not** the save blob's asking price | Yard gate | Finite credits; authored catalog price at debit time |
| `ctx.bio` | `bio.js` only | HUD Bio panel, `ship.js` mood | Existing bio heals |

---

## 2. Dock UI contract

### 2.1 Frozen digit order

Shipped (`station.js` 116):

```js
export const DOCK_KEY_SERVICES = Object.freeze([
  'market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics',
]);
```

Level-1 digits (`station.js` 2248–2251): `DigitN` → index `N - 1`. `Digit1`…`Digit9` map the nine keys. `Digit0` is index `-1` and is rejected today.

Level-1 labels (`station.js` 2189), same index order: Market, Jobs board, Bar, Feed & tend, Repair, Outfitting, People, Launch, Standing.

**Do not** insert a yard / hangar key before `launch`, between `people` and `launch`, or anywhere else in the middle. That would renumber 1–9.

### 2.2 First-slice service (assumed)

Append **one** key after `epics`:

```js
// later implementation — not this wave
[...existing nine, 'shipyard']
```

| Index | Digit | Key | Label |
|---|---|---|---|
| 0–8 | 1–9 | unchanged | unchanged |
| 9 | **0** | `shipyard` | `Shipyard` |

Hotkey law:

- Digits 1–9 keep today's services.
- Digit **0** selects the appended `shipyard` (implementation must special-case `Digit0` → last key, because `Number('0') - 1 === -1`).
- Do not steal Digit 8 from Launch or Digit 9 from Standing.
- Legend becomes `1-9, 0 select service · Esc/B launch` (or equal). Still `textContent`.

`selectService('launch')` still undocks. The new key opens level 2 like the others.

### 2.3 What the one service contains

One desk. Two panes. Not two `DOCK_KEY_SERVICES` entries.

1. **Hangar (every dock).** List owned hulls. Mount / park. Magical: any station, any shipyard, no delivery.
2. **Yard buy (gated).** If this dock sells hulls, list the authored catalog for that yard. Price + reputation gate. Buy **adds** a hangar row; it does not trade away the mounted hull (SHP-02).

Default yard stock (see §8): a dock sells the **dock faction** list when that faction has a catalog. Hangar still opens when the dock sells nothing.

Do not add a second appended service in the first slice.

### 2.4 UI construction

`station.js` `h()` already sets `textContent` (1450–1454). Keep that. Overlay clear uses `overlay.textContent = ''` (2175) — that is a wipe, not a world-string interpolate. Catalog names, hull names, notices, and faction strings stay `textContent`.

Do not rebuild the whole dock chrome to add the desk. Append the menu button in the existing `forEach`.

---

## 3. hullKind / HUD contract

Cite shipped `hudFamily` (`src/systems/hud.js` 65–74). Hud02IdentitiesDesign §3 is the identity brief. This file owns the SHP write sites.

```js
export function hudFamily(ctx) {
  const debug = sessionHudFamilyOverride(); // session-only; mech|bio
  if (debug === 'mech' || debug === 'bio') return debug;
  const p = ctx.player;
  if (!p) return 'bio';
  if (p.hullKind === 'built') return 'mech';
  if (p.hullKind === 'living') return 'bio';
  if (isBeautiful(p.faction)) return 'bio';
  return 'bio';
}
```

### 3.1 Identity triple

| Field | Meaning | HUD | SHP |
|---|---|---|---|
| `hullKind` | Culture of the **mounted** hull: grown vs plated | Read. Never write. | Write on buy / mount / sanitize. |
| `faction` | Banner of the mounted hull | `isBeautiful` after kind miss only | Write to the purchased banner. Unknowables → kind `'living'`. |
| `classKey` | `SHIP_CLASSES` row (role / stats) | Do **not** switch on class | Write a real class key. Ace / cutter / light can be either culture. |

Do **not** key HUD or remount culture on: `ctx.world.origin`, `ctx.bio`, `classKey` alone, `flags.camera`, `flags.combat`, scanner tier, target faction, or a HUD-03 checkbox.

### 3.2 Cases

| Case | `hullKind` SHP must write | `hudFamily` |
|---|---|---|
| Fresh boot / legacy save / living starter | `'living'` on first hangar migrate (or leave unset; both are `bio`) | `bio` |
| Beautiful Ones purchased hull | `'living'` | `bio` |
| Unknowables purchased hull | **`'living'`** (owner 2026-08-18). Never `'built'`. | `bio` |
| Freehold / Ledger / Ferrous / other plated hull | `'built'` | `mech` |
| Swap back to a living hangar row | `'living'` | `bio` on next 5 Hz tick |
| Living hull with conventional guns (SHP-03) | still `'living'` | `bio` — weapons do not pick the HUD |
| Session `rw-hud-family` | do not copy onto player | debug override wins until tab close |
| HUD-03 `body.rw-*` | no write | family unchanged |

Live default stays the living starter until a `'built'` hull is mounted. There is no conventional player mesh in the tree today. Do not fake one with origin.

### 3.3 SHP write sites (only)

1. Buy: new hangar row + if the player mounts it immediately, `ctx.player`.
2. Mount / swap: copy the chosen row onto `ctx.player` (`hullKind`, `faction`, `classKey`, vitals).
3. Restore / `sanitizeRestored` / `freshStart` heal (§1.3).
4. First migrate of a pre-SHP save.

### 3.4 HUD forbidden writes

HUD must **not**:

- assign `ctx.player.hullKind`;
- assign `ctx.player.faction` or `classKey` to pick a skin;
- persist `rw-hud-family` into save, settings, or player;
- add an O-panel “HUD style” checkbox;
- rebuild `#hud` nodes on swap (5 Hz `data-family` refresh already exists);
- write `ctx.input.throttle` (MATCH law; HUD-02).

A HUD write of `hullKind` persists in `rimward-save-v1` with no allowlist until SHP sanitize lands.

### 3.5 No HUD-03 skin checkbox

Owner 2026-08-18: no free HUD-skin override. Hull decides. Accessibility stays the existing `settings.js` / `body.rw-*` set.

---

## 4. Swap / remount contract

Swap is instant and dock-only. Hangar is magical.

### 4.1 Must do

1. Refuse if not docked. Refuse if the target id is missing after sanitize.
2. Park the mounted hull into its hangar row: identity triple, name (`world.shipName`), vitals, scanner, miningLaser, concealedMounts, cargo list, cargoCapacity.
3. Load the chosen row onto `ctx.player` with `createShipState(classKey, { name, faction })` as the **numeric baseline**, then apply parked vitals and `hullKind`. `createShipState` sets vitals / `bookValue` only. It does **not** retune player cruise.
4. **Copy the flight envelope** from authored `SHIP_CLASSES[classKey]` onto **`ctx.config.ship`** (SHP-owned; same object `ship.js` already reads). Use the sanitized class key. Map:
   - `cruise` → `ctx.config.ship.maxSpeed`
   - `creep` → `ctx.config.ship.creep`
   - `burn` → afterburner peak so cruise × `afterburner.multiplier` equals `burn` (today light is 120 × 2 = 240)
   - `stopTime` → settle (`damping` / accel as `ship.js` already uses so she stops in ~`stopTime`)
   Restore / `freshStart` remount must run this copy too. Do **not** persist `ctx.config.ship`. Do **not** read cruise / burn / creep / stopTime off the save blob.
5. Mirror scanner / miningLaser / concealedMounts onto `ctx.world` so today's readers stay correct.
6. Replace `ctx.cargo` with the parked list (`sanitizeCargoList`). Set `ctx.cargoCapacity` from the row.
7. Set `ctx.world.shipName` from the row `name`.
8. Set `hangar.mountedId`.
9. Remount the **mesh**:
   - `hullKind === 'living'` (or unset) → living path. Reuse `makeLivingHull` + swim / breath / heartbeat. Do not substitute a static organic prop. Retune of `ctx.config.ship` must **not** idle those fields.
   - `hullKind === 'built'` → a plated faction mesh. Do not run living vertex swim on plated hulls.
10. Keep the dock transform (already made fast). Zero velocity / speed. Do not teleport.
11. Rebuild player combat flags from the parked row (or healthy baseline). Do not leave `destroyed` / `disabled` / `engineOut` stuck from the previous hull.
12. Leave MATCH alone except as `ship.js` already does: docked play clears `flags.matchSpeed` (`ship.js` 468–470, 633). Do **not** write `ctx.input.throttle`. Do not add a remount MATCH API.
13. Let HUD 5 Hz reread `hullKind` / `faction`. Do not add a persist event for the family flip.
14. Debit credits only on **buy**, from the authored catalog price, after re-checking purse and reputation. Swap is free.
15. Ignore `createShipState` `personality` (it uses `Math.random()`). Do not persist personality as a hangar field.

### 4.2 Must not do

**Today's fact (shipped, not optional):** `classKey` alone does **not** change player cruise. `ship.js` does not import `SHIP_CLASSES`. Player cruise / creep / maxSpeed come from `ctx.config.ship` (`ctx.js` 43–47: light baseline `maxSpeed` 120, `creep` 30). That object is **not** retuned by `classKey` today. Player turn **does** follow `classKey`: `hoverTurnRateFor(ctx.player?.classKey || 'light', ship.speed)` (`ship.js` 513–515) from `flight-feel.js`, not `SHIP_CLASSES.turn`. `SHIP_CLASSES` cruise / burn / turn feed `createShipState` vitals / `bookValue` and NPC cruise. They do not drive the player flight step. A remount that only writes `player.classKey` leaves a heavy / freighter on the light 120/30 envelope.

| Do not | Why |
|---|---|
| Reset or re-roll `ctx.bio` | Companion is not a hull. BIO / `freshStart` already keep her. |
| Dump cargo into the void or into a global pile (first-slice default) | Cargo travels with the hull (§8 Q2). |
| Move credits, reputation, jobs, origin, epics, contacts, mystery | Career / world. |
| Weaken living motion or vein skin on a living remount | Wishlist BIO preserve. Copy onto `ctx.config.ship` must not idle swim / breath / heartbeat. |
| Delete `makeLivingHull` or idle the living fields “to make remount easier” | Same. |
| Invent a conventional starter as the boot default | Only mounted hull today is living. |
| Write HUD family, settings, or `hullKind` from `hud.js` | §3. |
| Insert a dock service mid-list | §2. |
| Trade away the current hull on purchase | SHP-02: own many; store; switch. |
| Trust `bookValue` or a save-authored price | §6. |
| Write `ctx.input.throttle` to cancel MATCH | `ship.js` 443–470: MATCH is a flag; throttle-held **clears** MATCH; nothing writes the setpoint. |
| Run swap in space, mid-jump, or while `playerDestroyed` | Dock desk only. |
| Leave `ctx.config.ship` at the light baseline after a heavy / freighter / other non-light mount | Player cruise reads `ctx.config.ship`, not `classKey`. Must copy §4.1.4 or she keeps 120/30. |
| Claim `classKey` alone retunes cruise / burn / creep / stopTime | Turn already follows `classKey`. Cruise does not, until remount writes `ctx.config.ship`. |
| Persist `ctx.config.ship` or copy cruise numbers from the hangar blob | Envelope is authored `SHIP_CLASSES` + remount. Tamper must not author a 999 cruise. |
| Grow a new `SHIP_CLASSES` row in a parallel feature PR | `state.js` is shared and READ-ONLY for feature workers. |

### 4.3 Mesh / living preserve

`ship.js` header: the player hull is a grown ship. Four fields run forever (swim, wing flap, breathing, heartbeat). No nozzle. Mood from `ctx.bio` tints the living path.

First slice:

- Living remount must keep that language. Visual class identity may scale or reshape, but motion must still intensify with speed.
- Built remount may disable living vertex mutation on the **plated** flesh only.
- Bio scars / mood still exist on living hulls. They do not become a second hull identity.

### 4.4 Player record vs hangar row

`ctx.player` is the mounted record. Hangar rows are parked JSON. After swap, both must agree on the identity triple. Do not keep a second live `createShipState` for parked hulls.

---

## 5. First-slice vs later

| Item | First implementation | Later |
|---|---|---|
| SHP-01 faction yards + purchasable hulls | **Yes.** Each selling faction gets a catalog and at least one yard desk. Use existing `SHIP_CLASSES` keys. Default: omit `frigate` from buy lists (capital row). | New classes, unique per-hull stats, `frigate` stock, authored yard buildings. |
| SHP-02 magical hangar | **Yes.** `ctx.world.hangar`, any-dock switch, buy-does-not-replace. | Delivery fiction, lost-ship insurance, physical berths. |
| `hullKind` + HUD hook | **Yes.** SHP writes; HUD reads. Unknowables `'living'`. Live default living until `'built'` mount. | Abominations (BIO-05) as a third identity — **not** invented here. |
| SHP-03 existing equipment onto the hull | **Yes.** Move / park: `scanner`, `miningLaser`, `concealedMounts`, `cargo`, `cargoCapacity`, parked vitals. World keys stay **mirrors** of the mount so combat / outfitter / HUD keep working. | New slot grid, power, mass, heat budget, ammo pools. |
| Conventional guns on a living hull | Already true (groups 1–3). Keep. Wishlist: living ships accept conventional components. | Visual hardpoint language. |
| Outfitter as it exists | Stays. Writes the mounted hull + mirrors. | Per-mount UI. |
| Missiles + launcher hardpoints | **No.** | SHP-03 later. No lock-box / missile HUD in this initiative's first slice. |
| Turrets / automatic guns | **No.** TGT-04 stays parked. | Compatible mounts later. |
| Mass / power / heat triad | **No.** Plant / Flight / Heat stay HUD aux. | Later balance pass. |
| New `WEAPONS` families | **No.** Keep `cannon` / `disruptor` / `mining`. | Missiles + psionics (BIO-04) later. |
| New `MINING_LASERS` rungs | **No.** | Later. |
| New `SHIP_CLASSES` rows | **No** unless a serial `state.js` owner lands them first. | BIO-02 growth classes later. |
| Beautiful growth centers / seeds | **No.** BIO-01 / BIO-02. | Later. |
| HUD-03 skin checkbox | **No.** | Owner must reopen. |
| Family audio (HUD-02 PR4) | **No.** Not SHP. | HUD leftover. |
| Mid-list dock insert | **No.** | Never. More desks append after `shipyard`. |

Progression stays money → hulls and equipment (wishlist). Reputation gates faction hulls as well as price (SHP-01).

---

## 6. Security contract

Threat model: local browser game. Practical attacks are save tamper, DOM XSS from world strings, prototype-key smuggling, and trusting a save blob for price / class / kind.

See also `out/w63/shared-security.md`.

### 6.1 Save tamper

- Allowlist hangar keys and `hullKind`. Same class of heal as `scanner` 0/1/2 and `miningLaser` 0/1/2/3.
- Do not trust `bookValue`, a slot `price`, or a slot `minRep` from the blob when **buying**. Debit `ctx.world.credits` using the authored catalog only. Re-check reputation from `ctx.world.reputation`.
- Do not trust hangar-blob cruise / burn / creep / stopTime / `maxSpeed`. Remount copies those from authored `SHIP_CLASSES[classKey]` onto `ctx.config.ship` (§4.1.4).
- A hand-edited hangar can spawn extra hulls (credits are already editable). Still fail closed on **types**, caps, class keys, and Unknowables kind. Do not eval or hydrate functions.
- Cap `hulls.length`. Cap cargo rows via existing sanitizer.
- After `Object.assign` player: heal `hullKind`; do not let leftover keys from `freshStart` keep a purchased identity.

### 6.2 XSS

- Hull names, faction names, catalog `line`s, yard notices, shipName: `textContent` / `Text` nodes.
- No `innerHTML` of save or world strings in station, HUD, toasts, or berth UI.
- CSS is authored. Do not interpolate faction ids into stylesheet text.

### 6.3 Prototype keys

- Build hangar / hull objects with `Object.create(null)` **or** assign onto a fresh literal and copy allowlisted keys only.
- Never `Object.assign(target, rawSlot)` from JSON.
- Drop `__proto__`, `constructor`, `prototype` if they appear as own keys.

### 6.4 Price and gate trust

- Catalog is code, not save. Cost and min-rep live next to the hull offer.
- Buy path: `if (credits < catalog.cost) refuse`. Then debit. No negative purse.
- Rep path: compare live `reputation[faction]` to catalog floor. Do not read a floor off the slot.
- Outfitter ladders stay sequential (existing Mk I → Mk II discipline).

### 6.5 Allowlists (copy)

| Value | Allow |
|---|---|
| `hullKind` | `living`, `built` — else delete |
| `classKey` | keys of `SHIP_CLASSES` — else `light` |
| `faction` | `sanitizeFaction` — else `independent` |
| `scanner` | `0,1,2` — else `0` |
| `miningLaser` | `0,1,2,3` — else `0` |
| `concealedMounts` | literal `true` else `false` |
| HUD family debug | `mech`, `bio` in **session** only |
| Dock service key | frozen list + appended `shipyard` |

### 6.6 clearAutosave / berths

New Game calls `clearAutosave()` then reloads. Manual slots survive. Hangar must not get a side channel that New Game forgets to clear or that `clearAutosave` wrongly wipes from berths.

---

## 7. Parallel-safety for a later implementation wave

This wave writes briefs only. When implementation starts, treat these files as **not** parallel-safe. One owner at a time.

| File | Why serialized |
|---|---|
| `src/systems/station.js` | `DOCK_KEY_SERVICES`, digit map, `RENDERERS`, overlay `h()`, outfitter writers. Mid-list insert is a merge defect. |
| `src/game/save.js` | `WORLD_FIELDS`, `snapshot` / `restore`, `sanitizeRestored`, `freshStart`, `clearAutosave`. Hangar + `hullKind` heal land here. |
| `src/game/state.js` | Header: READ-ONLY for feature workers. `SHIP_CLASSES`, `WEAPONS`, `MINING_LASERS`, `createShipState`, `FACTIONS`. |
| `src/systems/ship.js` | Living starter mesh, MATCH flag, throttle read, remount, **`ctx.config.ship` envelope copy**. Weakening swim/skin is a BIO fail. |

Likely **single-owner** companions (still coordinate with the four above):

| File | Role | Must not |
|---|---|---|
| New `src/systems/shipyard.js` (or equivalent) | Catalog, buy/swap verbs, desk renderer called from station | Write HUD family; insert dock keys itself |
| `src/systems/hud.js` | Keep reading `hullKind` on 5 Hz | Write `hullKind`, throttle, settings |
| `src/systems/bio.js` | Companion only | Become a hull store |
| `src/systems/combat.js` | Keep reading world mirrors + `WEAPONS` | Grow missiles in the first slice |
| `src/systems/settings.js` | Leave closed | Skin checkbox |
| `src/core/ctx.js` | Frozen comment / shape; remount writes `config.ship` (ship.js / SHP). Avoid unless a serial owner adds `world.hangar` docs | New persist events for HUD; persist of `config.ship` |

Safer split for a later wave: (1) `save.js` hangar + `hullKind` sanitize, (2) `ship.js` remount, (3) `station.js` append `shipyard` + digit 0, (4) catalog/UI in a new module. Land **serially**. Do not parallel-edit the four unsafe files.

---

## 8. Open questions

Only questions that still need the owner. Each has a default. Implementers use the default unless the owner overrides this file.

1. **Tenth dock digit.**  
   **Need:** 1–9 are taken.  
   **Default:** Digit **0** opens appended `shipyard`. Do not renumber 1–9.

2. **Does cargo stay on the hull?**  
   **Need:** first-slice SHP-03 “move existing equipment onto the hull” vs a shared career hold.  
   **Default:** `ctx.cargo` and `cargoCapacity` park/load with the hull. Credits stay world.

3. **Built player mesh source.**  
   **Need:** no plated player hull exists; only `makeLivingHull`.  
   **Default:** reuse existing faction NPC ship builders, player-scaled. Do not replace the living starter with that mesh until a `'built'` mount.

4. **Hangar cap.**  
   **Need:** sanitize must bound the array.  
   **Default:** **8** hulls. Extra rows drop from the tail after the mounted row is kept.

5. **Who sells.**  
   **Need:** SHP-01 “each faction at least one shipyard” vs every dock as a yard.  
   **Default:** hangar on **every** dock. A dock shows a buy list only when the dock faction has a catalog. Each faction that has a catalog has at least one such yard in the galaxy. Independent / hollow catalogs may stay empty (hangar-only docks) until the owner adds stock.

6. **Reputation floor for the cheapest hull of a banner.**  
   **Need:** SHP-01 says gate by sufficient reputation as well as price.  
   **Default:** refuse when `reputation[faction] < 0` (hostile). Higher class rows may set a higher authored floor. Do not read the floor from the save.

---

## 9. Integrator checklist

- [ ] Wave 63 lands markdown only. No `src/`, `scripts/`, wishlist, or `PROGRESS.md` edits.
- [ ] If a SHP-01 / SHP-02 / SHP-03 note conflicts with this file, this file wins.
- [ ] `hullKind` is SHP-owned. HUD reads. HUD never writes.
- [ ] Unknowables purchased hulls are `'living'`. Unset kind stays `bio`.
- [ ] Live default remains the living starter until a `'built'` hull is mounted.
- [ ] Hangar is `ctx.world.hangar` on `WORLD_FIELDS`. Magical. Any dock.
- [ ] One new dock service, **appended** after `epics`. Key `shipyard`. Digit 0. No mid-list insert.
- [ ] World strings → `textContent`.
- [ ] Persist allowlisted. No HUD family key. No settings skin checkbox.
- [ ] Bio companion is not a hull and survives swaps.
- [ ] First slice = yards + hangar + `hullKind` + move existing equipment onto the hull. No missiles, turrets, or mass-power.
- [ ] Living `makeLivingHull` motion/skin is not weakened. Envelope copy must not idle swim / breath / heartbeat.
- [ ] MATCH stays in `ship.js` (already clears while docked). Remount does not write `input.throttle`.
- [ ] Remount copies `SHIP_CLASSES[classKey]` cruise / burn / creep / stopTime onto `ctx.config.ship`. `classKey` alone does not change cruise.
- [ ] `station.js`, `save.js`, `state.js`, `ship.js` stay serial in the implementation wave.
- [ ] Owner overrides of §8 replace the listed defaults in this file before implementation, or implementation uses the defaults.
