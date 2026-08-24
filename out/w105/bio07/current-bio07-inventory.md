# Current BIO-07 species-inspired living ship bodies inventory (Wave 105)

**Wave:** 105. Design only (this worker). No bake. No new GLBs from this pack.  
**Rule:** Live `src/`, bake scripts, and `public/assets/ships/beautiful/` win over comments, lore, Wave 81 “Wave 8 GLB”, Wave 81 “`LIVING_STOCK` omit”, and this inventory if they disagree. Re-open the cited files before a body serial.  
**Scope:** Beautiful **NPC** per-class **bodies**. Motion (Wave 76) is inventory, not reopen. BIO-06 cadence is sibling leftover, not this census. Not player remount. Not grafts overlay.

This file is the source of truth for “BIO-07 bodies today.” The integrator brief and `shared-contract.md` must not invent fields that are not here unless they mark them **proposed, needs owner**.

Siblings (read only): Wave 81 look inventory [`out/w81/bio03/current-bio03-look-inventory.md`](../../w81/bio03/current-bio03-look-inventory.md); Wave 104 cadence inventory [`out/w104/bio06/current-bio06-inventory.md`](../../w104/bio06/current-bio06-inventory.md). **Do not edit** `docs/Bio03ClassLookDesign.md`, `docs/Bio06CadenceDesign.md`, or `out/w81/bio03/shared-contract.md`.

Live line numbers: **2026-08-24**. Wave 81 cites are stale where they disagree with code.

---

## 0. Files a later verifier must open

| File | Why |
|---|---|
| `src/systems/ship.js` | Player `makeLivingHull` / `buildLivingVisual` / CPU swim / remount — **quality bar** |
| `src/systems/organic.js` | `isBeautiful` = `faction === 'beautiful'` only |
| `src/systems/ship-assets.js` | Canonical path join, GPU swim uniforms, `userData.glow`, `buildShipAsset` / `updateShipAsset` |
| `src/systems/npc.js` | `buildShipMesh` → `buildShipAsset`; `animateShipMesh` passes speed |
| `src/game/shipyard.js` | Live `LIVING_STOCK` six keys. BIO-07 must **not add** SKUs |
| `src/game/hangar.js` | `hullKind` allowlist; `grafted` built-only |
| `src/systems/hud.js` | `hudFamily` **reads** `hullKind`; never writes player |
| `src/game/state.js` | `SHIP_CLASSES` six keys. READ-ONLY |
| `src/game/model-catalog.js` | `ship:player` = `makeLivingHull` |
| `scripts/build-ship-assets.py` | `PILOTS['beautiful']`; generic `BUILDERS['beautiful']` sphere stub |
| `scripts/ship_builders/beautiful/__init__.py` | `PILOT_CLASSES`; dispatch; “no panel lines” charter |
| `scripts/ship_builders/beautiful/light.py` | Young wayfinder. Sibling PR1. **Do not edit this worker** |
| `scripts/ship_builders/beautiful/heavy.py` | Shieldback. Sibling PR2. **Do not edit this worker** |
| `scripts/ship_builders/beautiful/ace.py` | Dart hunter. Later PR3 |
| `scripts/ship_builders/beautiful/cutter.py` | Guardian cradle. Later PR4 |
| `scripts/ship_builders/beautiful/frigate.py` | Elder hollows. Later PR5 |
| `scripts/ship_builders/beautiful/freighter.py` | Gardenback. Later PR6 |
| `scripts/ship_builders/beautiful/surface.py` | `grown_loft`; surface queries. **Serial** |
| `scripts/ship_builders/beautiful/anatomy.py` | Fins, veins, **`kit.box` fold floors**. **Serial** |
| `scripts/ship_builders/beautiful/organs.py` | Crown, vents, **`kit.box` wells / glow panels**, mantles. **Serial** |
| `scripts/measure-ships.mjs` | LOD0 GLB vs `SHIP_SCALE`; ladder light ≤ ace < cutter < heavy < frigate < freighter |
| `scripts/probe-beautiful-parts.py` | Shared-module smoke before class bake |
| `public/assets/ships/beautiful/` | **Wave 95** GLBs (six classes, including frigate) — fail-closed keep |
| `assets-source/ships/beautiful/` | Six `.blend` sources |
| `docs/FactionShipDesignBible.md` §4.6 | Living kin; class = life stage / body plan |
| `docs/SpaceShipIdeas/reference-images/beautiful-ones/README.md` | Six class plates |
| `out/hud-research/live-combat.png` | Chase still of the **player** living hull |

---

## 1. Player living hull — CPU path (quality bar, not NPC mesh)

**Preserve.** BIO-07 must **not** clone this onto traffic and must **not** replace it with an NPC GLB.

| Surface | Today | Cite |
|---|---|---|
| Sculpt | Sphere 64×40, elongate spine, manta disc, whip tail, dorsal camber, head bulge. Nose −Z, tail +Z | `makeLivingHull` `ship.js` 274–334 |
| Modest class silhouette | cutter `{x:0.88,y:0.78,z:1.16}`; heavy `{x:1.10,y:1.32,z:1.06}`; else identity | `livingSilhouette` 258–263 |
| Visual | `MeshPhysicalMaterial` 0x2b2145, clearcoat, vein emissive, cyan eyes, underlight | `buildLivingVisual` 382–413 |
| Boot remount | Unset/`living` → rebuild `makeLivingHull`. Unknowables force `'living'` first | `meshKindFor` 535–539; `remountPlayerHull` 546–560 |
| Hz | idle 0.5 → cruise 2.3 × mood.rate | 144–157, 948–956 |
| Breath / heart | `BREATH_HZ` 0.25; `HEART_HZ` 1.1 | 146–147, 961–965 |
| Growth | `GROWTH_SCALE_MAX` 0.15 | 98, 1043 |
| Player record | Boot `createShipState('light')`. Default faction **`independent`** | `ship.js` 624; `state.js` 173 |
| Models Browser | `id: 'ship:player'` builds `makeLivingHull()` with **no** classKey (light yardstick) | `model-catalog.js` 93–113 |
| Reduced motion | **Vertex swim still runs** on the player living rig | 948–965 vs trail gates later |

CPU per-vertex mutation is unique to the **player living** rig. Ace / frigate / freighter living remounts use `restScale` only (no extra silhouette) — BIO-07 does **not** “fix” that CPU sculpt.

**Not the living-player test:** `isBeautiful(player.faction)` is false on the starter (`organic.js` 67–69).

---

## 2. NPC Beautiful — GLB + GPU (`buildShipAsset` / `updateShipAsset`)

**This is not `makeLivingHull`.**

| Surface | Today | Cite |
|---|---|---|
| Catalog | `NPC_FACTIONS` includes `beautiful`. `NPC_CLASSES` = `light` `ace` `cutter` `heavy` `frigate` `freighter` | `ship-assets.js` 7–11 |
| Root | `ASSET_ROOT = '/assets/ships'` (same origin) | 13 |
| Path join | `` `${ASSET_ROOT}/${resolvedFaction}/${resolvedClass}/${lod}.glb` `` after canonical | 23–36, 114–119, 387–390 |
| Canonical | Unknown faction → `independent`. Unknown class → `light` | 114–119 |
| Idle clip | Beautiful **and** Unknowables templates set `idleClip: 'idle'` | 33 |
| GPU swim (Wave 76) | Per-instance `userData.swimUniforms`: `uSwimTime`, `uSwimAmp`, `uSwimHz`. Authored `onBeforeCompile` | 43–87, 398–429, 457–470 |
| Hz | Idle 0.5 → cruise 2.3. `speedNorm = min(speed/120, 1)`. Omit speed → idle | 46–48, 467–470 |
| Amp | `reducedMotion` → `uSwimAmp.value = 0`. Else 1 | 469 |
| NPC caller | `npc.js` 2287 passes `st.disabled ? 0 : ai.velocity.length()` | 176–178, 188–190, 2287 |
| Glow | `root.userData.glow` is a **Group** with engine mesh (or sphere fallback) | 404–416 |
| No eval | No `eval` / `new Function` in `ship-assets.js` | grep 0 |
| No remote URL | Relative `/assets/ships/…` only | 13, 27 |

Callers that omit speed (Models Browser, plated remount) stay at idle Hz (0.5). BIO-06 may later change the denom; **this leftover does not**.

---

## 3. Class keys, yard stock, bake drivers

Live six keys only. **No new career class keys.**

| Surface | Today | Cite |
|---|---|---|
| `SHIP_CLASSES` | light, heavy, freighter, ace, cutter, frigate | `state.js` 37–44 |
| `NPC_CLASSES` | same six | `ship-assets.js` 11 |
| `PILOT_CLASSES` | `('light', 'ace', 'cutter', 'heavy', 'frigate', 'freighter')` | `beautiful/__init__.py` 73 |
| `PILOTS['beautiful']` | `beautiful_pilot` package | `build-ship-assets.py` 435 |
| Generic stub | `BUILDERS['beautiful']` sphere + manta-fin spheres + box nerve-line | `build-ship-assets.py` 354–361, 420–424 |
| Ladder | light ≤ ace < cutter < heavy < frigate < freighter | `measure-ships.mjs` 12 |
| `YARD_LIST_UU` | light 8000 … frigate 80000 | `shipyard.js` 16–23 |
| `LIVING_STOCK` | **six keys** `light` `cutter` `heavy` `freighter` `ace` `frigate` | `shipyard.js` 28–30 |
| Comment | “sell the full live class set as living hulls” | `shipyard.js` 12–14 |

**Code wins over Wave 81 “omit ace/frigate/freighter buy.”** BIO-07 must **not add** a SKU (already six). BIO-07 must **not** cut the live catalog back to three.

Player remount of a bought living row still uses `makeLivingHull`, not the NPC GLB (`ship.js` 546–560).

---

## 4. Live GLB / blend pins (fail-closed = Wave 95)

On disk now:

| Class | GLB | Blend |
|---|---|---|
| light | `public/assets/ships/beautiful/light/lod0.glb` (+ lod1, lod2) | `assets-source/ships/beautiful/light.blend` |
| ace | `…/ace/lod0..2.glb` | `ace.blend` |
| cutter | `…/cutter/lod0..2.glb` | `cutter.blend` |
| heavy | `…/heavy/lod0..2.glb` | `heavy.blend` |
| frigate | `…/frigate/lod0..2.glb` | `frigate.blend` |
| freighter | `…/freighter/lod0..3.glb` | `freighter.blend` |

These are the Wave 95 look/bake set (wishlist BIO-03 DONE Wave 95). If a later class rebuild misses the bar, **keep that class’s files**. Do not empty the slot.

---

## 5. Builder charter vs live rigid primitives (the pain)

`beautiful/__init__.py` 7–20 already **forbids** panel lines, plates, nozzles, windows, armour, turrets. Live geometry still uses **box wells** and **box crease floors**. That is the kitbash fusion the owner still sees.

### 5.1 Shared (serial — one writer)

| Primitive | What it is | Cite | Glance risk |
|---|---|---|---|
| `grown_loft` | True-ellipse ring sweep; welded caps | `surface.py` 338–354 | Good. Prefer this |
| `fold_crease` floor | **`kit.box`** recess strip, outer face flush, body sunk inboard | `anatomy.py` 794–835 | **Rigid panel line** |
| `sanctuary_hollow` well | **`kit.box`** `_WELL_DEPTH` × hh × dd, `bevel=0.10` | `organs.py` 413–455 | **Box well / hangar bay** |
| Hollow glow panel | **`kit.box`** `_GLOW_PANEL_T` on glow list | `organs.py` 64–65, 492–493 | **Window leftover** |
| Vent lip | `kit.torus` major `r*1.05`, minor 0.05 | `organs.py` 229–230, 282–286 | Circular porthole if proud |
| Vent bowl | flattened `kit.sphere` ROLE_RECESS | `organs.py` 272–276 | OK if buried |
| `dorsal_mantles` | overlapping `kit.sphere` ellipsoids, `ry ≥ 0.55*rz`, ROLE_ARMOUR names `living-body-mantle-*` | `organs.py` 718–776 | **Fitted-armor** if coaxial / crisp borders |
| `sensory_crown` | bezier `kit.strut` + glow droplets | `organs.py` 105–213 | OK |
| `grasping_fins` | blunt pads, tip ≥ 72% root | `organs.py` 306–342 | Mouth if continuous row |
| `garden_fold` | large ellipsoid swells + fronds | `organs.py` 638–712 | Zoo if dense coral |

`kit.box` **call sites** in the beautiful package (grep 2026-08-24): `anatomy.py` 834; `organs.py` 454, 492. Comments at `surface.py` 30; `anatomy.py` 35; `organs.py` 25. Class `.py` files do **not** call `kit.box` directly.

### 5.2 Light — young wayfinder (`light.py`) — sibling PR1

| Read | Live | Cite |
|---|---|---|
| Envelope | l=7.8, b=3.28, h=1.87 | 14–18 |
| Body | 9 `sf.fair` stations; thickest shoulders; short tail | 102–125, 271 |
| Pearl cap + soft crest | grown lofts | 273–295 |
| Fins | forward wings + aft pair + flukes; `_FLIP_TIP_ROUND` paddles | 297–325; `anatomy.py` 88 |
| Head | cephalic lobes + throat sphere; **no eye** (plate eye is concept) | 327–339 |
| Crown | 8 filaments, forward lean, `arc=0.30` | 374–377 |
| Rigid | `an.fold_crease` → box floors on wing/aft folds | 383–391 → `anatomy.py` 834 |
| Vents | two small mouths/flank, radius 0.16 | 433–442 |
| Scar | one port diagonal | 449–457 |
| Measured | lod0 verts 19260; tris 12112/7572/3696 (2026-08-14) | 78 |

Family to player: compact, crown-forward, manta plan. Must **differ** in head/fin anatomy. Must **not** copy `makeLivingHull` 64×40 sphere topology.

### 5.3 Heavy — shieldback (`heavy.py`) — sibling PR2

| Read | Live | Cite |
|---|---|---|
| Envelope | l=17.0, b=8.84, h=5.78 | 48 |
| Body | 17 fair stations; blunt downturned snout; deep chest | 92–128, 239 |
| Mantles | `org.dorsal_mantles` count=3, size `(6.40, 2.20, 4.60)`, seed=73 | 245–261 |
| Shield fins | steep roots buried; lower manta pair | 263–291 |
| Pouch | `org.belly_chamber` | 293–302 |
| Rigid | two `fold_crease` per flank (box floors) | 315–323 → `anatomy.py` 834 |
| Crown | 8 short, `arc=0.10`, watchful | 366–371 |
| Measured | lod0 verts 40900; tris 22500/12020/4484 (2026-08-14) | 56 |

Charter already says “whale muscle, never shell-plate” (`heavy.py` 17–21). Plate README 63: painting borders can still read as fitted plates. Owner still sees fusion — mantles + box creases are the remaining plate read.

### 5.4 Ace — later PR3 (`ace.py`)

Taut dart-manta; swept fins; traveling-wave **three** `fold_crease` segments per flank (`ace.py` 42–48) — more box floors than light. Low nose fan, not a raised crown. Healed-torn port fin. Glance law frozen; geometry waits.

### 5.5 Cutter — later PR4 (`cutter.py`)

Ventral cradle; three grasping pads/side; open hold; juvenile nested (`cutter.py` 24–46). Plate caution: cavity can read as a mouth with teeth. Geometry waits.

### 5.6 Frigate — later PR5 (`frigate.py`)

Four hollows: two nursery + two sanctuary (`frigate.py` 44–49). Hollows call `org.sanctuary_hollow` / `nursery_hollow` → **box wells**. Four fin pairs. Geometry waits.

### 5.7 Freighter — later PR6 (`freighter.py`)

Three garden biomes; bounded nursery hollows; companions (`freighter.py` 46–58). Hollows → box wells. Geometry waits.

---

## 6. Bible §4.6 + plates (art law, not photocopies)

| Source | Law |
|---|---|
| Bible 157–170 | Living kin, not organic machines. No nozzles, windows, bolted plates, turrets. Class = life stage / body plan |
| Plates README 1–15 | Continuous manta–whale body, pearl/indigo, cyan nerves. Avoid cockpits, windows, nozzles, turrets, **panel lines** |
| Plates README 100 | Treat eyes, perfectly circular hollows, sharp fin tips, mouth-like cavities, shell-like mantle borders as concept-art artifacts |
| Wishlist BIO-07 1354–1393 | Distinct silhouettes; marine inspiration not replicas; not resized copies of one mesh; not an aquarium |

---

## 7. HUD / Digit / persist / innerHTML

| Surface | Today | Cite |
|---|---|---|
| HUD family | reads `player.hullKind`; default bio | `hud.js` 81–89 |
| HUD copy | `last.kind = p0.hullKind` (mem, not a player write) | `hud.js` 1079 |
| Hub | 80 px pupil + RANGE | `hud.js` 709–712 |
| Digit 0 | `DOCK_KEY_SERVICES` last = `shipyard` | `station.js` 185 |
| Persist | no BIO-07 world field | `save.js` `WORLD_FIELDS` (no hull-look key) |
| `innerHTML` | Models Browser only | `modelsbrowser.js` 114, 317, 369, 460, 468, 602 |

BIO-07 has **no** DOM. Do not put a species pip on `.rw-reticle`.

---

## 8. Motion (cite only — BIO-06 other worker)

Wave 76 GPU swim is live (`ship-assets.js` 43–87, 457–470). Player CPU swim is live (`ship.js` 948–965). Per-class Hz table is **absent** (BIO-06 leftover). Do **not** design Hz here.

---

## 9. What is missing (wishlist BIO-07 vs live)

| Desired | Live |
|---|---|
| Six classes immediately distinguishable from black silhouettes; not resized copies | Six builders exist with different envelopes; owner still reads **mech fusion** (box wells, crease floors, mantle-plate borders) |
| Marine inspiration inside one lineage | Charter says this; kit primitives still show panels |
| Animation native to anatomy + BIO-06 cadence | GPU swim is one shader for all Beautiful GLBs; BIO-06 other worker |
| Player bar magic on NPC skins | Player is unique CPU sphere. NPC is kitbash-grown GLB |

The hole is **not** a missing class key, Digit, persist field, or HUD disc. The hole is **NPC body language**: fewer rigid lines, sea-creature reads, class anatomy not kitbashed hull.

---

## 10. Ownership (today)

| Object | Writer today | BIO-07 this worker |
|---|---|---|
| Player living mesh | `ship.js` remount | **none** (honor) |
| Beautiful NPC GLB | bake pipeline | **none** this worker; sibling PR1/PR2 may bake light/heavy |
| Shared beautiful modules | serial | **none** this worker (PR7 later) |
| `state.js` | serial data owner | **read-only** |
| HUD `hullKind` | hangar / yard / save / Unknowables force | HUD must not write |
