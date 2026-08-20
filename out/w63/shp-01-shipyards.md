# SHP-01 — Faction shipyards and purchasable ships

| Field | Value |
|---|---|
| **Title** | SHP-01 faction shipyards |
| **Wave** | 63 — design only |
| **Status** | DESIGN. No `src/` or `scripts/` edits in this wave. |
| **Wishlist** | `docs/PLAYER-EXPERIENCE-WISHLIST.md` initiative SHP, item **SHP-01** |
| **Peers** | SHP-02 hangar persist (do not specify). SHP-03 mounts / missiles (name stock loadout only). |
| **Locked** | `docs/Hud02IdentitiesDesign.md` §3. `hullKind` is `'built' \| 'living'`. SHP writes it. HUD reads it. HUD never writes it. |

**Wishlist SHP-01 (cite `docs/PLAYER-EXPERIENCE-WISHLIST.md`):**

- Give each faction at least one shipyard where its ships can be purchased.
- Gate faction hulls by sufficient reputation as well as price.
- Make faction and class differences meaningful to careers and loadouts.

This note freezes the first-implementation slice and the later depth. Labels:

- **FIRST SLICE** — ship in the first SHP-01 implementation PRs.
- **LATER DEPTH** — after the buy / remount / HUD loop is playable.

---

## 0. Locked decisions (do not reopen)

1. `hullKind` is `'built' | 'living'`. SHP writes it. HUD reads it (`hudFamily` in `src/systems/hud.js` 65–74 and `docs/Hud02IdentitiesDesign.md` §3.1). HUD never writes it.
2. Unknowables purchased hulls are `hullKind: 'living'` (owner 2026-08-18). Unset kind stays the living-HUD default for every faction.
3. The Beautiful / living player mesh is the quality benchmark (BIO initiative). Do not replace the current living starter with a plated hull.
4. Dock digit keys map to `DOCK_KEY_SERVICES` array order (`src/systems/station.js` 116). Adding a service **shifts** hotkeys unless you **APPEND**. Wave 6 Standing (`epics`) was appended after `launch` for this reason.
5. Magical hangar storage is SHP-02. Assume a hangar exists later. Do not specify its persist schema.
6. Loadouts / mounts / missiles are SHP-03. Name “stock loadout by hull” only.
7. `src/game/state.js` header: feature workers must not modify it without reporting. A later PR may propose data tables there.

---

## 1. Where the yard lives in the dock UI

### Current dock service order (cite)

`src/systems/station.js` 116:

```js
export const DOCK_KEY_SERVICES = Object.freeze([
  'market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics'
]);
```

Menu labels at `station.js` 2189:

| Digit | Index | Key | Label today |
|---:|---:|---|---|
| 1 | 0 | `market` | Market |
| 2 | 1 | `jobs` | Jobs board |
| 3 | 2 | `bar` | Bar |
| 4 | 3 | `feed` | Feed & tend |
| 5 | 4 | `repair` | Repair |
| 6 | 5 | `outfitting` | Outfitting |
| 7 | 6 | `people` | People |
| 8 | 7 | `launch` | Launch |
| 9 | 8 | `epics` | Standing |

Keyboard (`station.js` 2249–2251): `Digit1`–`Digit9` select `DOCK_KEY_SERVICES[i]`. Legend: `1-9 select service · Esc/B launch`.

Wave 6 Standing is the last entry. It was appended so digits 1–8 did not move.

### Recommendation — **FIRST SLICE: APPEND a new `yard` service**

**Recommend:** append `'yard'` after `'epics'`. Do **not** insert. Do **not** put hull sales inside Outfitting.

```js
// proposed — APPEND only
Object.freeze([
  'market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'yard'
]);
```

New label: `Yard`. New renderer: `renderYard`. New `RENDERERS.yard`.

**Why not Outfitting:** Outfitting already spends digits 1–7 (hold, Mk I, concealed mounts, Mk II, three mining heads; `station.js` 1922–1969 and 2281–2287). A hull list there would shift those keys or overflow the digit row. Outfitting is instruments on the **current** hull. A yard sells a **different** hull. Mixing them collapses the career read.

**Why not Repair:** Repair is integrity restore (`REPAIR_RATES`). A yard is a purchase. Keep the “Comped by the keepers” path on repair only.

### Digit-key regression (must stay visible)

| Choice | Digit 1–9 | Digit for Yard | Regression |
|---|---|---|---|
| **APPEND `yard` (recommended)** | Unchanged | None on 1–9. Click / mouse in FIRST SLICE. Optional `Digit0` later. | **No shift.** Standing stays 9. Launch stays 8. |
| Insert before `epics` | Standing moves off 9 | Yard becomes 9 | **Breaks** Wave 6 muscle memory. |
| Insert anywhere earlier | Every later service moves | — | **Forbidden.** |
| Fold into Outfitting | Menu 1–9 unchanged | Outfitting 1–7 shift or overflow | Breaks mining-head ladder keys 5/6/7. |

**FIRST SLICE:** append. No `Digit0`. Yard is a menu button without a digit until the owner assigns one.

**LATER DEPTH:** optional `Digit0` → `yard` if the owner wants a key. Do not steal 1–9.

Update the level-1 legend only if a tenth key exists: keep `1-9 select service` until then.

---

## 2. Who sells what

### Facts

- `FACTION_SERVICES` (`state.js` 574–585) has **10** generated-flown keys: `freehold`, `veridian`, `redledger`, `ferrous`, `gilded`, `beautiful`, `congregation`, `assembly`, `independent`, `lamplighter`.
- **Hollow has no generated systems** (`FACTION_SERVICES` comment; `EXPECTED_FACTION_TOTALS.hollow === 3`, all authored).
- Unknowables have **no** galaxy systems (`EXPECTED_FACTION_TOTALS` has no `unknowables` key). They have ship assets (`NPC_FACTIONS` in `ship-assets.js`).
- Authored six (`authored-systems.js`): Freehold Drift (`freehold`), Veridian Reach (`veridian`), The Redmarch (`redledger`), Hollow Reach / The Hush / The Verge (`hollow`).
- Wave 24 rule: `FACTION_SERVICES` modifiers apply only at **generated** docks. Authored six stay byte-identical on those multipliers. SHP-01 must not break that guard for market / repair / jobs.

### **FIRST SLICE — authored capitals only, small catalogs**

Open a yard **only** at these station ids:

| System id | Station | Flag | Sells (classKey) | Why this slice |
|---|---|---|---|---|
| `freehold` | Freehold Landing | `freehold` | `light` | Home berth. Courier / workboat career. |
| `veridian` | Veridian Spire | `veridian` | `light` | Combine workboat. Trade career stays on this hull until SHP-03 / later freighter. |
| `redmarch` | Ledger Anchorage | `redledger` | `light`, `cutter` | Patrol / raid read. Cutter is the first class split. |

**Generated docks sell nothing in FIRST SLICE.** A generated Freehold grange that listed every `SHIP_CLASSES` row would collapse the career ladder (owner regression risk). `FACTION_SERVICES` stays a price-voice table, not a yard inventory.

**Hollow:** no FIRST SLICE yard. The three authored hollow docks are mystery / hermit space. A plated hollow sale there would mix SHP with the hush fiction. Later depth can add Hollow Anchorage only (not The Vigil).

**Beautiful / Unknowables:** no FIRST SLICE yard. Living remount is later. The current player mesh stays the living benchmark.

**Independent / Ferrous / Gilded / Congregation / Assembly / Lamplighter:** no FIRST SLICE yard. Wishlist “at least one yard per faction” is **LATER DEPTH**.

### **LATER DEPTH — one yard per faction, still not every class**

| Faction | Where the yard lives | Notes |
|---|---|---|
| `freehold` | Authored Landing + later generated Compact docks that opt in | Same catalog law, not “every class”. |
| `veridian` | Authored Spire + later Combine opt-in | Add `freighter` when cargo/career math exists. |
| `redledger` | Authored Anchorage + later Ledger opt-in | Keep cutter as the Ledger signature. |
| `ferrous` | Generated hub `fx_bastion` (and later Hegemony yards) | `heavy` signature. |
| `gilded` | Generated hub `gc_auction` | `freighter` / later graft fiction is BIO-05, not SHP-01. |
| `beautiful` | Generated Beautiful docks | Living hulls only. Remount must not weaken swim. |
| `unknowables` | No system today. Owner must name a berth or an encounter sale. | Purchased hulls are `living`. |
| `congregation` | Generated Congregation docks | Plated. |
| `assembly` | Generated Assembly docks | Plated. |
| `independent` | Opt-in generated independents | Purchased independent hulls are **plated** (`built`). The starter is not this SKU. |
| `lamplighter` | `lastbeacon` | One Guild yard. |
| `hollow` | `hollowreach` only (Hollow Anchorage) | Never The Vigil. Never generated (none exist). |

**Catalog law (both slices):** a dock sells only rows in `YARD_STOCK[faction]`. Missing faction → empty yard panel + fail-closed note. Generated docks never default to `Object.keys(SHIP_CLASSES)`.

Propose table home: new `src/game/shipyard.js` (pure data). Feature workers must **report** before editing `state.js`. Integrator may later move the tables into `state.js` if the owner wants one constants file.

---

## 3. Stock — which `SHIP_CLASSES` each faction sells

`SHIP_CLASSES` today (`state.js` 34–41): `light`, `heavy`, `freighter`, `ace`, `cutter`, `frigate`.

Class already changes cruise / burn / turn / hull / shield / engine. SHP-03 will add mounts. FIRST SLICE uses class **flight identity** plus faction **mesh / HUD / stock loadout name**. That is enough to make the first buy feel like a career fork.

### **FIRST SLICE stock**

| Faction | Classes | Why not every class |
|---|---|---|
| `freehold` | `light` | One Compact workboat. Ace / frigate would skip the ladder. |
| `veridian` | `light` | One Combine workboat. Freighter waits for cargo-career math and berth fiction (10–14 P; `FactionShipDesignBible.md`). |
| `redledger` | `light`, `cutter` | First meaningful class split (courier vs patrol/raid). |

Not on day one (any faction):

- `ace` — prestige. Needs Sworn-level gate and a named-pilot fiction.
- `heavy` — Ferrous / escort career. Later.
- `freighter` — trade career. Scale and cargo identity need SHP-03 + berth copy.
- `frigate` — compact capital. Endgame price and rank.

**Stock loadout by hull (name only; SHP-03 owns mounts):**

| SKU | Stock loadout name (copy only) |
|---|---|
| any `light` | “Yard cannon, stock Mk I head” |
| `redledger` `cutter` | “Yard cannon, no mining head in the boarding lock” |

Do not add weapons, mounts, or missile hardpoints in SHP-01.

### **LATER DEPTH stock (proposed defaults)**

| Faction | Classes (ordered by unlock) |
|---|---|
| `freehold` | `light`, then `cutter`, then `freighter` |
| `veridian` | `light`, then `freighter`, then `heavy` |
| `redledger` | `light`, `cutter`, then `ace` |
| `ferrous` | `cutter`, `heavy`, then `frigate` |
| `gilded` | `light`, `freighter` |
| `beautiful` | `light`, `ace` (living) |
| `unknowables` | `light`, `ace` (living) |
| `congregation` | `light`, `freighter` |
| `assembly` | `light`, `heavy` |
| `independent` | `light`, `cutter` (plated) |
| `lamplighter` | `light`, `cutter` |
| `hollow` | `light` only at Hollow Anchorage |

Faction difference: mesh (`ship-assets.js` faction GLB), HUD family via `hullKind`, stock-loadout name, and which class appears first. Class difference: `SHIP_CLASSES` stats now; mounts later (SHP-03).

---

## 4. Price model

### Precedent (do not reuse as the sale price)

`createShipState` sets `bookValue: cls.hull * 12` (`state.js` 134). Comment: ransom / prize math §7.8 (`ransomFor` at 1065). Market sell goodwill is **+2% per positive rank tier** when the player **sells commodities** (`station.js` 1624–1626). Starting purse is **350 UU** (`ctx.js` 122). Patrol payout is **300 UU**. Mining Mk II is **1400**, Mk IV is **11000**.

If the yard charged raw `bookValue` (light = 1200 UU), a ship would cost less than a Mk II head and class identity would die. If the yard charged Mk-IV-and-up for a light, SHP would not appear in ordinary play.

### **FIRST SLICE list price (server-side, recomputed)**

Authored floors, not `hull * 12`:

```
YARD_LIST_UU = {
  light: 8000,
  cutter: 11000,
  heavy: 20000,
  ace: 28000,
  freighter: 24000,
  frigate: 80000,
}
```

`bookValue` stays ransom math. The yard **never** reads `ctx.player.bookValue` or a save-supplied price.

Light at 8000 UU is about 25–30 patrols at 300 UU, or a shorter mining / haul loop after Mk II. The player buys gear first, then a hull. Cutter is **dearer** than light even though cutter `hull` is 80 (bookValue 960). Do not price from hull alone or the raid ship undercuts the workboat.

### Reputation discount (buy side)

Invert the market goodwill. Apply only to **hull list price**:

| Rank (`RANK_LADDER`) | tier | Discount |
|---|---:|---:|
| Sworn | 3 | 15% |
| Trusted | 2 | 10% |
| Known | 1 | 5% |
| Stranger | 0 | 0% |
| Suspect / Marked | < 0 | no sale (gate), not a surcharge |

```
list = YARD_LIST_UU[classKey]
tier = rankFor(ctx.world.reputation[dockFaction] ?? 0).tier
price = Math.round(list * (1 - 0.05 * Math.max(0, tier)))
```

Epic `buyMult` / `FACTION_SERVICES.buyMult` do **not** apply in FIRST SLICE. Those multipliers are commodity / patent paths. Stacking them onto hulls would hide the authored floor. **LATER DEPTH** may add a yard-only epic hook if the owner wants Standing to move ship prices.

### Trade-in

**No trade-in.** SHP-02: the player keeps the old hull. The yard charges the full discounted list. Do not subtract `bookValue`. Do not delete the mounted hull to “pay” for the new one.

### Credits

Deduct `price` from `ctx.world.credits` only after every gate passes. Integer UU. Refuse if `credits < price`.

---

## 5. Reputation gate

### Field

`ctx.world.reputation[dockFaction]`.

- `dockFaction` is `SYSTEMS[currentSystem].faction` (the flag the dock flies).
- Read with `?? 0`. Missing key is **0** (Stranger). Fail closed.
- Rank via `rankFor` (`state.js` 650–660).
- Do **not** gate on `ctx.world.origin`.
- Do **not** gate on `ctx.player.faction` (that is the hull’s maker after purchase).
- Do **not** gate on epic stage count. Standing is a different screen.

`ctx.js` 124 currently inits `{ freehold, redledger, veridian, hollow }`. Other flags already work as `?? 0` at docks (`station.js` 2195). Survivor rescue already writes arbitrary `FACTIONS` keys (`station.js` 1009–1012). FIRST SLICE only needs the three authored flags, which already exist. **LATER DEPTH:** expand the default bag so new banners are visible on the rank line before the first write. Report that `ctx.js` change; do not silently add WORLD_FIELDS.

### **FIRST SLICE rank floors**

| classKey | Required rank | Why |
|---|---|---|
| `light` | Known (`tier >= 1`, rep >= 10) | Wishlist: reputation **and** price. Stranger can see the hull, not buy it. |
| `cutter` | Trusted (`tier >= 2`, rep >= 25) | Class identity: the raid/patrol hull is a trust step. |

Suspect / Marked (`tier < 0`): list visible, buy forbidden.

### Fail-closed copy (textContent only)

| Fail | Notice |
|---|---|
| `tier < 0` | `The yard will not sign papers for a [rank].` |
| `tier` too low for that class | `This hull is for [required rank] and above. The dock reads you as [current rank].` |
| Missing faction key (treated as 0) | Same as Stranger. |

Use `rankFor(rep).name` and `rankNameForTier(required)` (`station.js` 1240–1243). No HTML.

Greenhand starts at 0 / Stranger. The player must earn Known (jobs, rescue, origin deltas) before the first hull. That is the career gate. Patrol today writes **only** `reputation.freehold` (`station.js` 1305). FIRST SLICE Veridian / Ledger yards need some other rep source (rescue, origin, later REP). **Open question** with default: FIRST SLICE also awards `+PATROL_REP` to **the dock’s faction** when a patrol completes at that dock. Report the station.js job-tick change. Do not retarget the existing Freehold-only line without owner OK.

---

## 6. `hullKind` + `faction` written on purchase

SHP owns these writes (`Hud02IdentitiesDesign.md` §3.4). HUD never writes them.

On a successful buy, after hangar handoff of the old hull:

```
ctx.player.faction     = dockFaction          // allowlisted FACTIONS key
ctx.player.classKey    = classKey             // allowlisted SHIP_CLASSES key
ctx.player.hullKind    = hullKindFor(dockFaction)
```

Then rebuild vitals from `createShipState(classKey, { name, faction })` so hull/shield/engine/bookValue match the new class. Copy `hullKind` **onto** the fresh record. `createShipState` does not set `hullKind` today. Do not teach HUD to write it.

### `hullKindFor(faction)` (allowlist table, not a guess)

| Faction | Purchased `hullKind` | HUD family | Notes |
|---|---|---|---|
| `beautiful` | `'living'` | `bio` | Later depth. |
| `unknowables` | `'living'` | `bio` | Owner 2026-08-18. Must not write `'built'`. |
| `independent` | `'built'` | `mech` | **Purchased** independent hulls are plated. |
| `freehold` | `'built'` | `mech` | FIRST SLICE. |
| `veridian` | `'built'` | `mech` | FIRST SLICE. |
| `redledger` | `'built'` | `mech` | FIRST SLICE. |
| `ferrous` | `'built'` | `mech` | Later. |
| `gilded` | `'built'` | `mech` | Later. |
| `congregation` | `'built'` | `mech` | Later. |
| `assembly` | `'built'` | `mech` | Later. |
| `lamplighter` | `'built'` | `mech` | Later. |
| `hollow` | `'built'` | `mech` | Later. |

Unset `hullKind` remains `bio` for every faction (`hudFamily` fall-through). The **current starter** is `createShipState('light')` with `faction: 'independent'` and **no** `hullKind`. FIRST SLICE must not stamp `'built'` on that starter except by a real purchase.

**Beautiful / living starter:** do not sell a plated stand-in. Do not remount a Beautiful GLB over the player swim in FIRST SLICE.

**Independent starter vs purchased independent:** different SKUs. Starter = living, unset kind, current mesh. Purchased independent = plated GLB + `'built'`.

Persist (`Hud02IdentitiesDesign.md` §3.4): `save.js` `sanitizeRestored` must allowlist `living` | `built` only. Anything else: **delete** the key so `hudFamily` falls through. Same class of heal as `scanner` 0/1/2. No `settings.js` key. No `WORLD_FIELDS` HUD key.

---

## 7. Current mounted hull on buy

SHP-02 owns hangar persist. SHP-01 owns the **handoff call** and the confirm.

### **FIRST SLICE**

1. Player selects a SKU. UI shows list price, rank, and: `Your current hull will be stored. You keep it.`
2. Confirm is a second control (`Confirm papers` / Esc cancel). Digit keys must not one-shot the debit.
3. On confirm, call `parkMountedHull(ctx)` (SHP-02). SHP-01 does **not** define the hangar array shape.
4. If `parkMountedHull` is missing or returns false, **abort**. Do not debit. Notice: `The hangar cannot take her. Papers cancelled.`
5. Only then debit credits, write `faction` / `classKey` / `hullKind`, remount mesh.
6. **Do not delete** the old hull unless the player confirms **and** the hangar accepts it.

Until SHP-02 lands, FIRST SLICE ships in the same serial train as a SHP-02 stub. The stub must return **true** only after it has accepted the mounted hull. SHP-01 does not invent hangar fields. A stub that returns **false** blocks every sale (fail closed). Do not debit in a “park later” path.

Do not sell a second copy of a SKU the player already holds (mounted or parked). Identity: `(faction, classKey, hullKind)`. Query ownership through a SHP-02 `ownsHull(ctx, sku)` (or equivalent). If that symbol is missing, treat “already own” as **mounted SKU only**. Notice: `You already hold this pattern.`

Cargo stays on `ctx.cargo` (world hold, not hangar). Bio stays in `ctx.bio`. **FIRST SLICE default:** freeze bio **writes** while `hullKind === 'built'` (do not wipe). Remounting the living hull later resumes the companion. Owner may override (open question).

---

## 8. Mesh remount

### Law

- Living player swim (`makeLivingHull` + per-frame vertex swim in `ship.js`) is the quality benchmark. SHP-01 must **not** change swim math, vein texture, or scar anchors except to **gate** them.
- Built hulls use faction ship assets (`NPC_SHIP_ASSETS` / `buildShipAsset` / `buildShipMesh` in `ship-assets.js` / `npc.js`).
- `buildShipMesh` is the NPC entry. Player remount may call `buildShipAsset` directly so role stays `'trader'` (not pirate skins).
- Canonical fallbacks in `ship-assets.js` (`independent` / `light`) must **not** silently dress a bad SKU. If the requested pair is not in the allowlist or not primed, fail the buy before debit.

### **FIRST SLICE remount**

Extract `remountPlayerHull(ctx, { classKey, faction, hullKind })` in `ship.js` (or a tiny `player-hull.js` that `ship.js` owns).

| `hullKind` | Visual | Per-frame |
|---|---|---|
| `'living'` or unset | Keep current `makeLivingHull` flesh tree | Existing swim / breath / scars / under-light |
| `'built'` | Replace **flesh** children with a primed faction GLB (`buildShipAsset(classKey, faction, 'trader')`) | Skip vertex swim. Run `updateShipAsset` / mixer only. No engine-bead “player thruster” add-on that the living ship refused. |

Keep the existing `root` / camera / trail / recoil hooks. Swap the visual child, not the flight root.

**Do not** point the living starter at `beautiful/light` or `unknowables/light` GLBs in FIRST SLICE. Those clips (`idleClip` for beautiful / unknowables) are later living remount work.

If `!isShipAssetReady(faction, classKey, 'trader')`: notice `The yard cannot release this hull yet.` No debit.

HUD: after write, the 5 Hz `hudFamily` path (`hud.js`) flips `#hud.dataset.family` to `mech` when `hullKind === 'built'`. That is intended. Surface it in confirm copy: `Instruments will read as a built hull.`

### **LATER DEPTH**

- Beautiful / Unknowables purchased living hulls: either keep `makeLivingHull` (safest for swim quality) or adopt faction living GLB **only** if a BIO pass proves swim/idle is not weaker than the starter.
- Built hulls: faction LOD + trader materials.
- Reduced motion: existing `updateShipAsset(..., reducedMotion)` / living reduced-motion path. Purchase itself is not motion-gated.

---

## 9. Failure cases

All notices use `textContent` (`h()` / `btn()` in `station.js` 1450–1461). Fail closed. No debit.

| Case | Gate | Copy |
|---|---|---|
| Not enough credits | `ctx.world.credits < price` (recomputed) | `Not enough UU. This hull is [price] UU.` |
| Low / hostile rep | `rankFor(rep).tier` below floor or `< 0` | See §5. |
| Already own that hull | mounted or hangar SKU match | `You already hold this pattern.` |
| Docked during jump | `ctx.flags.docked && ctx.gate.jumping` | `The clamps hold. Finish the jump or launch first.` (Today `gate.js` will not start a jump while docked. Still fail closed.) |
| Reduced motion | **N/A** | Purchase is a state mutate + remount. No animation gate. No reduced-motion-only failure. |
| Not docked | no yard UI | — |
| Unknown / smuggled `classKey` | not in `SHIP_CLASSES` **and** not in `YARD_STOCK[faction]` | Silent reject + `The yard has no such hull.` |
| Unknown faction | not `Object.hasOwn(FACTIONS, faction)` or not the dock flag | Reject. Dock flag is the only seller. |
| Bad `hullKind` from UI | ignore UI; table wins | — |
| Hangar refuse | `parkMountedHull` false | `The hangar cannot take her. Papers cancelled.` |
| Asset not primed | `!isShipAssetReady` | `The yard cannot release this hull yet.` |
| No confirm | first click only selects | No debit. |

---

## 10. Security

Threat model: local browser game. Practical threats are XSS through world / hull strings, persist-key smuggling of `hullKind`, and save / UI price tampering.

1. **No `innerHTML` of hull names.** Use existing `h()` / `btn()` (`textContent`). Faction display names come from `FACTIONS[k].name`. Class keys are tokens; labels are authored strings in the yard table.
2. **Allowlist on purchase.** The click handler accepts only:
   - `classKey` ∈ `Object.keys(SHIP_CLASSES)` ∩ `YARD_STOCK[dockFaction]`
   - `faction` = **dock flag** (`currentDef.faction`), never a button `data-faction`
   - `hullKind` = `hullKindFor(dockFaction)`, never a button attribute
3. **Never trust save-supplied price.** Ignore `player.bookValue`, any `data-price`, and any snap field named `yardPrice`. Recompute from `YARD_LIST_UU` + live rank every click.
4. **Never trust save-supplied `hullKind`.** `sanitizeRestored`: keep only `'living' | 'built'`; else `delete p.hullKind`.
5. **Restore remount is allowlisted, not free.** After `sanitizeRestored`, if `hullKind === 'built'` and `classKey` ∈ `SHIP_CLASSES` and `faction` ∈ `FACTIONS` and `hullKindFor(faction) === 'built'`, remount the faction GLB. If any check fails, **delete** `hullKind`, heal `classKey` to `light` if unknown, and keep the living starter visual. A hand-edited `faction: 'freehold'` on an unset-kind starter must **not** flip HUD or mesh until a real yard write.
6. **Confirm before debit.** No single digit key completes a sale. Level-2 yard digits (if any) index into the **allowlisted stock array** for this dock. They never parse a string from the DOM.
7. **One debit.** `act.buyHull` must refuse re-entry while a buy is in flight (flag or early return). Double-click / double-digit must not charge twice or park twice.
8. **HUD does not write `hullKind`.** SHP-01 PRs must not add a `hudFamily` writer.
9. **No new `settings.js` / `WORLD_FIELDS` HUD key.**

---

## 11. Serial PR plan (SHP-01 only)

Do not edit these files in the design wave.

| PR | Files | Depends | What |
|---|---|---|---|
| **PR0 data** | **Propose** `src/game/shipyard.js` (new). Report if tables must land in `state.js` (read-only for feature workers). | — | `YARD_STOCK`, `YARD_LIST_UU`, `hullKindFor`, `yardPrice(ctx, faction, classKey)`, allowlists. No DOM. |
| **PR1 persist** | `src/game/save.js` | PR0 | Allowlist `ctx.player.hullKind` in `sanitizeRestored`. Delete anything else. After heal, remount only when the saved triple passes §10.5. Boot pin: hand-edited `'mech'` / `99` deletes and HUD stays `bio`. |
| **PR2 remount** | `src/systems/ship.js` (maybe tiny helper). Read `ship-assets.js` / `npc.js` `buildShipMesh`. | PR0, PR1 | `remountPlayerHull`. Gate living swim on living/unset. Built path uses faction GLB. **Do not** weaken `makeLivingHull`. Restore uses the same function after the allowlist. |
| **PR3 yard UI** | `src/systems/station.js` | PR0, PR1, PR2, SHP-02 `parkMountedHull` stub | **APPEND** `'yard'` to `DOCK_KEY_SERVICES`. `renderYard`, confirm, fail copy, debit, write `faction` / `classKey` / `hullKind`, remount. Do not insert. Do not edit Outfitting digits. |
| **PR4 HUD watch** | `src/systems/hud.js` **read-only check** | PR3 | Confirm 5 Hz path already flips on `hullKind`. **No HUD write.** Add a boot / browser pin: buy Freehold light → `#hud[data-family="mech"]` on next 5 Hz tick. |
| **PR5 tests** | `scripts/boot-test.mjs` or a small `out/w63` probe | PR3–PR4 | Pins: digit 1–9 unchanged; append-only length; price recompute; allowlist rejects; living starter still `bio` with unset kind. |

**Do not modify in SHP-01:** `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, HUD CSS families, `settings.js`, SHP-02 persist schema, SHP-03 mounts.

**Depends on peers:** PR3 needs a `parkMountedHull(ctx)` symbol from SHP-02 (even a stub that returns false until hangar exists). If SHP-02 is late, PR3 can ship UI + dry-run without debit.

---

## 12. Open questions (defaults for freeze)

Integrator may freeze these defaults unless the owner overrides.

| # | Question | **Default to freeze** |
|---|---|---|
| Q1 | Digit for Yard after append? | No digit in FIRST SLICE. Click only. |
| Q2 | Patrol rep still Freehold-only? | FIRST SLICE: add `+PATROL_REP` to **dock faction** as well, or Veridian/Ledger Known is almost unreachable. Owner may instead accept “Freehold yard is the only reachable first buy.” |
| Q3 | Expand `ctx.world.reputation` defaults? | FIRST SLICE: no. LATER: all `FACTIONS` keys at 0. |
| Q4 | Where do tables live? | New `src/game/shipyard.js`. Report before touching `state.js`. |
| Q5 | Bio while flying a built hull? | Keep `ctx.bio`. Freeze writes. Do not wipe. |
| Q6 | Ship name on buy? | Keep `ctx.world.shipName` / `ctx.player.name`. Yard does not rename. |
| Q7 | Unknowables berth? | No FIRST SLICE yard. Owner must name a later berth or encounter. |
| Q8 | Living remount = starter mesh or faction GLB? | FIRST SLICE: starter mesh only. Later Beautiful/Unknowables: starter mesh unless BIO proves the GLB. |
| Q9 | `Digit0` later? | Only if owner wants it. Never steal 1–9. |
| Q10 | May generated docks of the three FIRST SLICE flags sell the same small catalog? | **No** in FIRST SLICE. Authored capitals only. |

---

## 13. Regression risks (tradeoffs)

| Risk | If we do the wrong thing | FIRST SLICE mitigation |
|---|---|---|
| Digit hotkey shift | Insert `yard` → Standing leaves 9, Outfitting/People/Launch move | **APPEND only.** Cite `station.js` 116. |
| Buying a built hull flips HUD to mech in live play | Confirm surprise; BIO career feels stolen | Confirm copy names the instrument change. Unset starter stays `bio`. HUD still does not write `hullKind`. |
| Weakening the living starter | Remount path edits swim, or Beautiful GLB replaces P | No living remount. No `makeLivingHull` math change. Gate swim, do not rewrite it. |
| Generated docks sell every class | Career ladder dies; first visit to a random Combine rock sells a frigate | Authored three docks. `YARD_STOCK` allowlist. No `SHIP_CLASSES` dump. |
| Price too low | Class identity dies; Mk II head outranks a ship | Floors 8000 / 11000. Not `hull * 12`. |
| Price too high | SHP never appears | Light at 8000 vs Mk IV 11000 and patrol 300. Reachable after a career loop, not after one job. |
| Trade-in deletes the starter | Conflicts with SHP-02 | No trade-in. Confirm + hangar handoff. |
| Save smuggles `hullKind: 'built'` onto the starter | Mech HUD without a yard | PR1 allowlist + delete. |
| UI-supplied price / faction | Free ships, wrong HUD | Recompute. Dock flag only. |

---

## 14. FIRST SLICE vs LATER DEPTH (checklist)

### FIRST SLICE ships

- Appended `yard` service, digits 1–9 unchanged.
- Yards at Freehold Landing, Veridian Spire, Ledger Anchorage only.
- Stock: Freehold `light`, Veridian `light`, Ledger `light` + `cutter`.
- Price floors + rank discount. No trade-in. No epic/service hull multiplier.
- Rep field `ctx.world.reputation[dockFaction]`. Light = Known. Cutter = Trusted.
- Write `faction`, `classKey`, `hullKind` (`'built'` for those three banners).
- Confirm → `parkMountedHull` → debit → remount built GLB.
- Living starter untouched until a real buy.
- Security allowlists + save heal.

### LATER DEPTH

- One yard per remaining faction (Hollow Anchorage only for hollow; Unknowables needs a berth).
- Opt-in generated docks. Still never “every class”.
- Ace / heavy / freighter / frigate with higher rank floors.
- Beautiful / Unknowables living purchases (`hullKind: 'living'`).
- Optional `Digit0`. Optional epic yard discount.
- Reputation bag includes every banner.

---

## 15. Verification (this design wave)

- Domain: data.
- Read this note.
- Confirm it cites current dock service order (`station.js` 116).
- Confirm `hullKind` rules match `docs/Hud02IdentitiesDesign.md` §3.
- Confirm no `src/` or `scripts/` diffs.
- Confirm FIRST SLICE vs LATER DEPTH are labeled.
