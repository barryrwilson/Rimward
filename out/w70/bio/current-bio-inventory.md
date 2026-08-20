# Current BIO inventory (Wave 70)

**Wave:** 70. Design only.  
**Rule:** Live code wins over comments, lore, and this inventory if they disagree. Re-open the cited files before an implementation wave.  
**Scope:** living player hull, hangar `hullKind`, Beautiful / Unknowables yards, companion growth, Beautiful NPC look/motion, origins, persist.

This file is the source of truth for “BIO today.” The integrator brief and `shared-contract.md` must not invent fields that are not here unless they mark them **proposed, needs owner**.

---

## 0. Files a later verifier must open

| File | Why |
|---|---|
| `src/systems/ship.js` | `makeLivingHull`, living remount, swim/breath/heartbeat, growth scale |
| `src/game/hangar.js` | hangar rows, `hullKind` allowlist, `applyFlightEnvelope`, `switchTo` |
| `src/game/shipyard.js` | `LIVING_STOCK`, `UNKNOWABLES_STOCK`, `hullKindFor`, prices, min-rep |
| `src/systems/shipyard-desk.js` | Confirm papers, textContent desk, Digit mapping |
| `src/systems/organic.js` | `isBeautiful` = `faction === 'beautiful'` |
| `src/systems/npc.js` | `buildPlayerPlatedMesh`, `HOSTILE_STANDING` −10, `standingOf` |
| `src/systems/ship-assets.js` | Beautiful GPU swim, idle clip, GLB templates |
| `src/game/origins.js` | Beautiful origin applies bio + cargo only |
| `src/game/bio.js` | hunger, wounds, mood, bond, `growth` |
| `src/game/state.js` | `SHIP_CLASSES`, `ORIGINS.beautiful`, `RANK_LADDER`, `COMMODITIES.livingRock`, `WEAPONS` (READ-ONLY) |
| `src/systems/hud.js` | `hudFamily` reads `hullKind`; never writes it |
| `src/game/save.js` | `WORLD_FIELDS` hangar, wholesale `player` + `bio`, `freshStart` living |
| `src/core/ctx.js` | ownership, frozen events, default `bio` / `reputation` |
| `src/systems/station.js` | feed / tend, `textContent` helper, Gilded people desk confirm |
| `src/game/world.js` | Beautiful origin beats on `bio.growth` |
| `docs/ShpDesign.md` | living persist + remount law (do **not** edit) |
| `docs/Hud02IdentitiesDesign.md` | family switch (do **not** edit) |
| `docs/PLAYER-EXPERIENCE-WISHLIST.md` | Initiative BIO intent (do **not** edit) |
| `out/w64/remount-notes.md` | Wave 64 remount map |
| `out/w67/shp03/shared-contract.md` | living hulls may seat conventional guns; no BIO-02 growth-center required |
| `public/assets/ships/beautiful/` | NPC GLBs for all six classes (including frigate) |

---

## 1. Living player hull (`ship.js`) — quality benchmark

**Preserve.** Wishlist BIO: future work must not weaken this.

| Surface | Today | Cite |
|---|---|---|
| Boot mesh | Always `buildLivingVisual()` → `makeLivingHull()` | `ship.js` 353–428, 544–553 |
| Sculpt | Sphere 64×40, elongate spine, manta disc, whip tail, dorsal camber, head bulge. Nose −Z, tail +Z | `makeLivingHull` 257–306 |
| Four motion fields | Swim wave (speed-scaled, idle floor 0.5 Hz), wing flap, breath ~4 s (`BREATH_HZ` 0.25), heartbeat 1.1 Hz. Never still at zero throttle | header 17–34; 888–933 |
| Skin | `MeshPhysicalMaterial` 0x2b2145, clearcoat, `makeVeinTexture` emissive | 360–371, 178–227 |
| Eyes / underlight / scars | Two cyan eyes; teal point light; 5 scar planes gated by `bio.wounds` | 373–402, 952–955 |
| Mood | `MOOD_VISUALS` tints veins, glow, jitter, breath rate/depth | 151–157, 935–950 |
| Growth visual | `GROWTH_SCALE_MAX = 0.15`. `flesh.scale` = `(1 + bio.growth * 0.15) * mood breath` | 97, 978–986 |
| Growth on built | **Same** `flesh.scale` path runs for plated remounts. Code does not gate growth to living | 978–986 vs 963–965 |
| Reduced motion | Afterburner trail hidden. Vertex swim still runs unless a later PR gates it | 989–991 |
| Player record | `createShipState('light')`. Default faction `independent` | 589–590; `state.js` 140–146 |
| Scale charter | This hull **is** `P` (`ship-scale.js`). Models Browser imports `makeLivingHull` | `ship.js` 253–255; `model-catalog.js` 19, 98 |

CPU per-vertex mutation is unique to the **player living** rig. Built player hulls call `animateShipMesh` on the plated GLB (`ship.js` 963–965).

---

## 2. Remount and flight envelope (Wave 64, live)

| Surface | Today | Cite |
|---|---|---|
| Mesh kind | Unknowables → living. `hullKind === 'built'` → plated. Else living (unset included) | `meshKindFor` `ship.js` 502–507 |
| `remountPlayerHull` | Keep dock transform, zero velocity, dispose old root. Unknowables force `hullKind: 'living'` **before** the branch | 513–542 |
| Living remount | Rebuilds `makeLivingHull` + swim/breath/heartbeat. Does **not** swap in a static organic prop | 525–527, `buildLivingVisual` |
| Built remount | `buildPlayerPlatedMesh(classKey, faction)` (`npc.js` 171–175). Fallback box if SKU not primed | `ship.js` 330–343, 430–468 |
| Envelope | `applyFlightEnvelope` copies authored `SHIP_CLASSES[classKey]` onto `ctx.config.ship`. Live map (`hangar.js` 472–480): `cruise` → `maxSpeed`; `creep` → `creep`; `afterburner.multiplier = cruise > 0 ? burn / cruise : 2` (light 240/120 = **2**, not 240); `damping = 1 / stopTime`; `acceleration = cruise × (90/120)`. Peak burn speed is `maxSpeed * multiplier`, which equals `burn`. Do **not** assign `multiplier = cls.burn`. | `hangar.js` 449–482 |
| `switchTo` | Dock-only. Park → load row → `applyFlightEnvelope` → registered remount. Snapshot rollback on throw | `hangar.js` 611–632 |
| Restore / death | `applyMountedFlight` after hangar heal. `freshStart` forces living starter | `hangar.js` 634–650; `save.js` 505–516 |
| `ctx.bio` on swap | **Not written.** Companion is not a hull | `hangar.js` park/load; `save.js` 517–525 death keeps bio + wound |
| Starter cannon | Weapon groups stay world/hangar gear (scanner, mining, concealed, launcher, turret). `switchTo` does not strip Digit 1/2 guns. Light `MOUNT_TABLE` has general 2 | `hangar.js` 580–588; `state.js` 47 |

**Wave 64 remount notes** (`out/w64/remount-notes.md`): Unknowables force living before the mesh branch. Boot default stays the living starter. Do not persist `ctx.config.ship`.

---

## 3. Hangar persist and `hullKind`

| Surface | Today | Cite |
|---|---|---|
| Shape | `ctx.world.hangar = { mountedId, hulls }`. Cap **8**. Live hull is a row | `hangar.js` 25, 271–301 |
| Row allowlist | `id`, `faction`, `classKey`, `name`, scanner, miningLaser, concealedMounts, launcher, turret, missileAmmo, cargoCapacity, cargo, vitals, optional `hullKind` | `sanitizeHangarRecord` 139–168 |
| `hullKind` | `'living' \| 'built'` only. Other tokens dropped | 165–166; `healPlayerHullKind` 329 |
| Unknowables | Force `'living'` on row and player on pack/sanitize/load/switch/buy | 81–83, 167, 330, 349, 576, 623, 638 |
| Nested loadout | **Forbidden.** `writeMountedGear` ignores unknown keys; sanitize drops extras | `hangar.js` 387–429 |
| Proto | `RESERVED_IDS` includes `__proto__` etc. Hull ids must match `SAFE_ID` and not reserved | 27–31, 91–95 |
| WHO writes `hullKind` | Hangar / shipyard / save `freshStart` / `ship.js` Unknowables force. **HUD never writes** | `ctx.js` 19; `hud.js` 67–75 |
| WHO does not | `origins.js`, `bio.js`, `organic.js`, `hud.js` | — |

HUD family (`hud.js` 67–75):

```
built → mech
living → bio
isBeautiful(faction) → bio
else → bio
```

Unset `hullKind` on the independent starter is **bio**. Session override `rw-hud-family` is session-only.

---

## 4. Yards — living stock (BIO decision surface)

`src/game/shipyard.js`:

```
YARD_LIST_UU: light 8000, cutter 11000, heavy 20000, ace 28000, freighter 24000, frigate 80000
CORE_STOCK: light, cutter, heavy, freighter, ace, frigate   // plated factions, including gilded
LIVING_STOCK: light, cutter, heavy                         // beautiful
UNKNOWABLES_STOCK: light                                   // unknowables
hullKindFor: beautiful | unknowables → 'living'; else 'built'
MIN_REP: light/cutter/heavy/freighter 0; ace 10; frigate 25
Hostile (rep < 0): no sale (`purchaseYardHull` 191)
Rank discount on list price: Known 5%, Trusted 10%, Sworn 15% (`yardPrice` 88–98)
```

Beautiful / Unknowables **omit frigate** (and Beautiful omits ace / freighter). Wave 67 plated leftover **appended** `frigate` to `CORE_STOCK` only. Living frigate SKU is **not** in the catalog. NPC Beautiful GLBs still include `frigate/` and `ace/` and `freighter/` under `public/assets/ships/beautiful/`.

Buy **adds** a hangar row. It does not remount (`purchaseYardHull` 209–212). Confirm papers is two-step (`shipyard-desk.js` 93–101, 117–131). Desk uses `textContent` via station `h()`.

Gilded docks sell **plated** `CORE_STOCK`, not grafts. There is no graft SKU today.

---

## 5. `isBeautiful` and NPC Beautiful ships

| Surface | Today | Cite |
|---|---|---|
| `isBeautiful(faction)` | `faction === 'beautiful'` only. NPC / station / gate art flag, **not** player-hull | `organic.js` 67–69 |
| Comment vs code | Header still says NPC organics are part-transform only; **code** injects GPU vertex swim for Beautiful GLBs | `organic.js` 18–23 vs `ship-assets.js` 136–170 |
| NPC mesh | `buildShipMesh` → primed GLB (`npc.js` 165–167). No `buildBeautifulShip` in live `npc.js` | grep: no `buildBeautifulShip` |
| GPU swim | Shared `uSwimTime` / `uSwimAmp`; `aSwim` (zn, wing, xn, sz); 0.7 Hz swim; 0.25 Hz breath scale 1.2%; per-ship phase via last morph target + `Math.random()` | `ship-assets.js` 43–48, 136–170, 397–406 |
| Idle clip | Beautiful and Unknowables templates set `idleClip: 'idle'` | `ship-assets.js` 33 |
| Player plated reuse | `buildPlayerPlatedMesh` uses role `'trader'` | `npc.js` 171–175 |
| Player living | Independent starter is **not** Beautiful. `isBeautiful(player.faction)` is false | `createShipState` default faction |

Wishlist BIO-03 pain: NPC Beautiful hulls are organic-ish GLBs with a **weaker** GPU swim than the player CPU manta. They do not share `makeLivingHull`.

---

## 6. Origins (BIO-01 “Beautiful origin”)

| Surface | Today | Cite |
|---|---|---|
| Overlay | Fresh boot only. Digit 1–5. `textContent` rows | `origins.js` 85–145 |
| `ORIGINS.beautiful` | Name “Beautiful Ones Initiate.” Bond 0.35, hunger 0.4, cargo 2× `livingRock` | `state.js` 716–719 |
| Does **not** | Change mesh, `hullKind`, `player.faction`, `classKey`, or give a second hull | `origins.js` `applyEffects` 50–83 |
| Persist | `ctx.world.origin` on `WORLD_FIELDS` | `save.js` 81; `origins.js` 115 |
| Copy | Greenhand line is already “A berth, a living ship, and no story yet.” Every origin starts on the living light | `state.js` 701–704; `ship.js` boot |

BIO-01 “choose Beautiful origin to obtain a living ship” is **already true for every origin**. The Beautiful origin only starts the companion warmer and hungrier, with two living-rock units.

---

## 7. Companion growth / bond / wounds (`bio.js`)

Writes **only** `ctx.bio`. Not a hull.

| Field | Live | Cite |
|---|---|---|
| Hunger | +1.0 per ~90 min undocked | `bio.js` 9, 104–106 |
| Wounds | Hull-reaching hits; regen after 15 s; docked ×4 | 10–13, 113–118 |
| Mood | serene / keen / anxious / pained / feral | 38–44, 125–148 |
| Bond | Serene flight, heal together, feeding bonus 0.1 | 26–30, 107–110, 154 |
| Growth | `min(1, bond * 0.7 + fedCount * 0.05)`. Visual scale only. **Does not change `classKey`** | 32–35, 156–161 |
| Station feed | Biomass 60 UU zeros hunger, +0.05 bond. Living rock: spend 1 cargo, zero hunger, +0.2 bond | `station.js` 136–137, 1845–1860 |
| Origin beats | Beautiful origin: growth ≥ 0.4 / 0.75 → `originBeat`; growth ≥ 1 → `originPayoff` | `world.js` 1053–1116 |
| Persist | Wholesale `snap.bio` (`save.js` 251, 480–482). Heal non-finite hunger/wounds/bond/growth/fedCount | 376–384 |
| Death | Companion survives; +0.4 wounds, pained, hunger floor 0.4, +0.02 bond | `save.js` 517–525 |
| Factory reset | **Forbidden** on buy/park/remount/New Game-adjacent hull work (`docs/ShpDesign.md` non-goals; live hangar does not write bio) | hangar park/load |

There is **no** growth-center dock service. There is **no** class evolution. There is **no** seed commodity distinct from `livingRock` (food, base 600 UU, `state.js` 313).

---

## 8. Standing, hostility, Gilded

| Surface | Today | Cite |
|---|---|---|
| `RANK_LADDER` | Sworn ≥50 t3; Trusted ≥25 t2; Known ≥10 t1; Stranger ≥ −10 t0; Suspect ≥ −25 t−1; Marked ≥ −1000 t−2 | `state.js` 672–678 |
| Patrol hunt | `standingOf` ≤ `HOSTILE_STANDING` (−10) **or** player scratched them | `npc.js` 87, 1021–1072 |
| Default reputation bag | `{ freehold, redledger, veridian, hollow }` all 0. Missing faction → standing **0** | `ctx.js` 128; `standingOf` 1021–1025 |
| Yard hostile | `rep < 0` → no sale | `shipyard.js` 191 |
| Gilded docks | Generated galaxy (`generate-galaxy.mjs` 193). Not in authored six | authored-systems has no `gilded` / `beautiful` keys |
| Gilded special desk | People level-2 **survivor transfer**, two-step confirm, `textContent` | `station.js` 1270–1298 |
| Grafts | **None.** No `grafted` field. No Abomination flag | hangar allowlist |

Beautiful / Gilded systems exist as generated docks. Beautiful yards already sell `LIVING_STOCK`. Gilded yards sell plated `CORE_STOCK`.

---

## 9. Weapons / psionics

| Surface | Today | Cite |
|---|---|---|
| Player groups | 1 cannon, 2 disruptor, 3 mining, 4 missiles (if seated) | `ctx.js` 82; `WEAPONS` `state.js` 97–119 |
| Living + conventional | SHP-03 freeze: mounts by `classKey` not `hullKind`. Living may seat launcher/turret/cannon. Do not require BIO-02 growth-center. Do not strip starter cannon | `out/w67/shp03/shared-contract.md` §6 |
| Psionic family | **Does not exist.** No `WEAPONS` row, no mount, no HUD | `state.js` `WEAPONS` |
| `state.js` | READ-ONLY for feature workers. Wave 68 PR0 is exclusive writer of `WEAPONS` / `MOUNT_TABLE` | `state.js` 7–9 |

---

## 10. Persist and events

| Surface | Today | Cite |
|---|---|---|
| Autosave key | `rimward-save-v1` only | `save.js` |
| Hangar | `WORLD_FIELDS` includes `hangar` | 91–92 |
| Player | Wholesale `ctx.player`. Extra keys keep unless hangar heal deletes them | 484; `healPlayerHullKind` |
| Bio | Wholesale `ctx.bio`; `songEvent` forced null | 251, 480–482 |
| No BIO world flags | No `grafted`, no `bioSeedGift`, no seed commodity key on world | `WORLD_FIELDS` 74–97 |
| Frozen events | Listed in `ctx.js` 197–226. No hull-swap event. HUD family is 5 Hz reread | `ctx.js` |
| World strings | Station / shipyard-desk / origins use `textContent`. `innerHTML` is models-browser only | grep |

---

## 11. Wishlist BIO vs live (gap)

| ID | Ask | Live |
|---|---|---|
| Preserve | Living player ship is the benchmark | Shipped. Remount rebuilds it. |
| BIO-01 origin | Obtain living ship by Beautiful origin | All origins already fly the living light. Origin does not add a hull. |
| BIO-01 gift | Max Beautiful standing → seed gift | No gift. Sworn is rank ≥ 50. |
| BIO-01 pirate | Rare seed from Beautiful ship | No seed drop. |
| BIO-01 buy | Extremely expensive seed commodity | Beautiful yard sells living **hulls** (light 8000 UU), not a seed SKU. `livingRock` is food. |
| BIO-02 growth | Growth-center evolves class; career branches | `bio.growth` is +15% scale only. `switchTo` copies `SHIP_CLASSES` on hangar swap, not on growth. |
| BIO-03 fleet | Rebuild Beautiful NPC visual+motion around player living hull | GLB + GPU swim. Weaker than player CPU manta. |
| BIO-04 psionics | Living/Abomination-only psionic weapons | Absent. |
| BIO-05 Abominations | Gilded grafts on conventional hull; Beautiful hostility; warn; destroy → friend | Absent. |

---

## 12. Regression risks already named (wishlist)

Weakening player-ship animation; marine inspiration too literal on NPC rebuild; conventional parts clashing with living tissue; irreversible Beautiful hostility **without warning**; growth invalidating installed equipment or cargo.

Wave 64 already: do not factory-reset `ctx.bio`; do not idle living motion to make remount easier; Unknowables never `'built'`.
