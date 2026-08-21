# Current BIO-03 per-class look and bake inventory (Wave 81)

**Wave:** 81. Design only. No bake. No new GLBs.  
**Rule:** Live `src/`, bake scripts, and `public/assets/ships/beautiful/` win over comments, lore, Wave 75 line numbers, and this inventory if they disagree. Re-open the cited files before a look/bake serial.  
**Scope:** Beautiful **NPC** per-class look + bake/wire. Motion (Wave 76) is inventory, not reopen. Not player remount. Not grafts overlay. Not psionics.

This file is the source of truth for “BIO-03 look and bake today.” The integrator brief and `shared-contract.md` must not invent fields that are not here unless they mark them **proposed, needs owner**.

Siblings (read only): Wave 75 fleet inventory [`out/w75/bio03/current-bio03-inventory.md`](../../w75/bio03/current-bio03-inventory.md); Wave 76 motion notes [`out/w76/bio03/notes.md`](../../w76/bio03/notes.md); Wave 70 living-ships [`out/w70/bio/current-bio-inventory.md`](../../w70/bio/current-bio-inventory.md). **Do not edit** `docs/Bio03FleetDesign.md` or `docs/BioLivingShipsDesign.md`.

Live line numbers: **2026-08-21**. Wave 75 cites are stale.

---

## 0. Files a later verifier must open

| File | Why |
|---|---|
| `src/systems/ship.js` | Player `makeLivingHull` / `buildLivingVisual` / CPU swim / remount |
| `src/systems/organic.js` | `isBeautiful` = `faction === 'beautiful'` only |
| `src/systems/ship-assets.js` | Canonical path join, GPU swim uniforms, `userData.glow`, `buildShipAsset` / `updateShipAsset` |
| `src/systems/npc.js` | `buildShipMesh` → `buildShipAsset`; `animateShipMesh` passes speed; glow is a mesh |
| `src/game/shipyard.js` | `LIVING_STOCK` light/cutter/heavy; omit ace/freighter/frigate **buy** |
| `src/game/hangar.js` | `hullKind` allowlist; `grafted` built-only; Unknowables force living |
| `src/systems/hud.js` | `hudFamily` **reads** `hullKind`; never writes |
| `src/game/state.js` | `SHIP_CLASSES` six keys. READ-ONLY |
| `src/core/ctx.js` | Ownership; frozen events; no BIO-03 event |
| `src/game/ship-scale.js` | `P` = player hull 6.6; `CLASS_ORDER` six keys |
| `src/game/model-catalog.js` | `ship:player` = `makeLivingHull` |
| `src/systems/station.js` | Bloom via `isBeautiful`; `DETAIL_STATIONS` omits beautiful/unknowables |
| `scripts/build-ship-assets.py` | `PILOTS['beautiful']`; `add_idle`; `DELIVERY_ROOT` |
| `scripts/ship_builders/beautiful/` | Six class files + shared `surface` / `anatomy` / `organs` |
| `scripts/measure-ships.mjs` | LOD0 GLB vs `SHIP_SCALE` |
| `scripts/compress-ship-assets.mjs` | Meshopt compress under `public/assets/ships/` |
| `scripts/encode-ship-textures.mjs` | PNG → KTX2 under `public/assets/ships/materials/` |
| `scripts/validate-ship-assets.mjs` | Self-contained GLB / slot caps / faction+class allowlist |
| `scripts/probe-beautiful-parts.py` | Shared-module smoke before class bake |
| `public/assets/ships/beautiful/` | Wave 8 GLBs (six classes, including frigate) |
| `public/assets/ships/materials/beautiful/` | trader + pirate KTX2/PNG |
| `assets-source/ships/beautiful/` | Six `.blend` sources |
| `docs/ShipAssetPipeline.md` | Wave 8 bake process that **still** owns Beautiful NPC GLBs |
| `docs/SpaceShipIdeas/reference-images/beautiful-ones/` | Six class plates |
| `docs/FactionExamples/06-beautiful-ones-ship.png` | Concept charter, not a photocopy |
| `docs/FactionShipDesignBible.md` §4.6 | Living kin; class = life stage / body plan |
| `out/hud-research/live-combat.png` | Chase still of the **player** living hull |

---

## 1. Player living hull — CPU path (quality bar, not NPC mesh)

**Preserve.** BIO-03 look/bake must **not** clone this onto traffic and must **not** replace it with an NPC GLB.

| Surface | Today | Cite |
|---|---|---|
| Boot mesh | Always `buildLivingVisual()` → `makeLivingHull()` | `ship.js` 549–553, 354–428, 258–307 |
| Sculpt | Sphere 64×40, elongate spine, manta disc, whip tail, dorsal camber, head bulge. Nose −Z, tail +Z | `makeLivingHull` 258–307 |
| Four motion fields | Swim idle 0.5 Hz → cruise 2.3 Hz, wing flap, breath ~4 s (`BREATH_HZ` 0.25), heartbeat 1.1 Hz | 143–147; loop 888–933 |
| Skin | `MeshPhysicalMaterial` 0x2b2145, clearcoat, `makeVeinTexture` emissive | 360–371 |
| Thrust surge | Extra `emissiveIntensity` + underlight. **No nozzle** | 957–962 |
| Growth visual | `GROWTH_SCALE_MAX = 0.15` on `flesh.scale` from `ctx.bio.growth` | 98, 978–986 |
| Reduced motion | Afterburner trail hidden. **Vertex swim still runs** | 989–991 vs 907–933 |
| Player record | `createShipState('light')`. Default faction **`independent`** | `ship.js` 590–591; `state.js` 146 |
| Scale charter | This hull **is** `P` (spanX 6.60) | `ship-scale.js` 10–18, 38–39 |
| Models Browser | `id: 'ship:player'` builds `makeLivingHull`. Catalog `faction: 'beautiful'` is **filter only** | `model-catalog.js` 92–113 |
| Remount living | Unset/`living` → rebuild `makeLivingHull`. Unknowables force `'living'` first | `meshKindFor` 503–508; `remountPlayerHull` 514–528 |
| Built remount | `buildBuiltVisual` → NPC GLB path. Living player never uses that GLB | 526–528; plated `animateShipMesh` 963–965 |

CPU per-vertex mutation is unique to the **player living** rig. `publishHullPath` sets `ship.living` only when `rig.kind === 'living'` (`ship.js` 313–328).

**Not the living-player test:** `isBeautiful(player.faction)` is false on the starter (`independent`).

---

## 2. NPC Beautiful — GLB + GPU (`buildShipAsset` / `updateShipAsset`)

**This is not `makeLivingHull`.**

| Surface | Today | Cite |
|---|---|---|
| Catalog | `NPC_FACTIONS` includes `beautiful`. `NPC_CLASSES` = `light` `ace` `cutter` `heavy` `frigate` `freighter` | `ship-assets.js` 7–11 |
| Root | `ASSET_ROOT = '/assets/ships'` (same origin) | 13 |
| Path join | `` `${ASSET_ROOT}/${resolvedFaction}/${resolvedClass}/${lod}.glb` `` | 23–36, 234 |
| Canonical | `canonicalFaction` / `canonicalClass` **before** join. Unknown faction → `independent`. Unknown class → `light`. Role → `trader` \| `pirate` | 114–124, 387–390 |
| Idle clip | Beautiful **and** Unknowables templates set `idleClip: 'idle'` | 33 |
| Bake idle | `add_idle` root scale 1 → 1.025/0.985/1.025 → 1, frames 1–40 | `build-ship-assets.py` 445–457, 502–503 |
| GPU swim (Wave 76) | Per-instance `userData.swimUniforms`: `uSwimTime`, `uSwimAmp`, `uSwimHz`. Authored `onBeforeCompile` | `ship-assets.js` 43–108, 398–429 |
| Hz | Idle 0.5 → cruise 2.3. `speedNorm = min(speed/120, 1)`. Omit speed → idle | 46–48, 457–470 |
| Amp | `reducedMotion` → `uSwimAmp.value = 0`. Else 1 | 469 |
| NPC caller | `npc.js` passes `st.disabled ? 0 : live.ai.velocity.length()` | 2181 |
| Mixer | Idle clip `setTime` skipped when `reducedMotion` | 458–459 |
| Phase | Dummy morph + `Math.random() * Math.PI * 2`. Visual only | 427–437 |
| NPC mesh | `buildShipMesh` → `buildShipAsset`. **No** `buildBeautifulShip` in live `npc.js` | `npc.js` 167–168 |
| Glow | `root.userData.glow` is a **Group** with engine mesh (or sphere fallback). Wave 42: glow must stay a real mesh | `ship-assets.js` 404–416; `npc.js` 1382, 1916, 1942 |
| Self-contained GLB | Test reader rejects external `buffers[].uri` / `images[].uri` | `ship-assets.js` 209–228 |
| No eval | No `eval` / `new Function` in `ship-assets.js` | grep 0 |
| No remote URL | Relative `/assets/ships/…` only. The only `https://` in the file is a three.js docs comment | 13, 147, 234 |

Callers that omit speed (Models Browser, plated remount) stay at idle Hz (0.5).

---

## 3. Wave 76 uniforms (do not reopen)

Landed. See [`out/w76/bio03/notes.md`](../../w76/bio03/notes.md).

- Shared module-global swim uniforms **retired** for Beautiful instances.
- `cloneSwimMaterials` clones six materials per instance; textures stay shared (`ship-assets.js` 90–108, 199–200).
- Frame cost: write three uniform `.value` fields. No player-sized vertex loop.
- Player `ship.js` path untouched in Wave 76.
- Fail closed still: do **not** clone `makeLivingHull` onto NPCs.

Look/bake serials must keep these uniforms. They must not switch Beautiful traffic to CPU vertex swim.

---

## 4. Class keys — `SHIP_CLASSES` / `PILOTS` / yard omit

Live six keys only. **No new career class keys.**

| Surface | Today | Cite |
|---|---|---|
| Runtime | `SHIP_CLASSES`: `light` `heavy` `freighter` `ace` `cutter` `frigate` | `state.js` 35–42 |
| Asset classes | `NPC_CLASSES` same six | `ship-assets.js` 11 |
| Measure order | `CLASS_ORDER` = `light` `ace` `cutter` `heavy` `frigate` `freighter` | `ship-scale.js` 258 |
| Bake driver | `PILOTS['beautiful'] = beautiful_pilot` | `build-ship-assets.py` 429–442 |
| Pilot classes | Full six: `light` `ace` `cutter` `heavy` `frigate` `freighter` | `scripts/ship_builders/beautiful/__init__.py` 73 |
| Dispatch | Lazy import per class file | `__init__.py` 90–107 |
| Generic fallback | `BUILDERS['beautiful']` still exists (sphere stub) but **does not run** while `key in PILOT_CLASSES` (full six). Do not drop a pilot key to fall through | `build-ship-assets.py` 354–361, 420–423, 478–483 |
| Envelope `CLASSES` | light 7.8 / ace 7.2 / cutter 11.0 / heavy 17.0 / frigate 32.0 / freighter 85.0 | `build-ship-assets.py` 38–45 |

### Yards — buy ≠ NPC visual

`src/game/shipyard.js`:

```
YARD_LIST_UU: light 8000, cutter 11000, heavy 20000, ace 28000, freighter 24000, frigate 80000
CORE_STOCK: light, cutter, heavy, freighter, ace, frigate   // plated factions
LIVING_STOCK: light, cutter, heavy                         // beautiful
UNKNOWABLES_STOCK: light
YARD_STOCK.beautiful = LIVING_STOCK
hullKindFor: beautiful | unknowables → 'living'; else 'built'
```

Cites: `shipyard.js` 16–40, 69–72.

Beautiful yard **omits** `ace` / `freighter` / `frigate` **buy**. NPC GLBs **include** all six, including `public/assets/ships/beautiful/frigate/`. Persist may still store `classKey: 'frigate'`. Do not append those keys to `LIVING_STOCK`.

Buy adds a hangar row. It does not remount. Player living remount of a bought row still uses `makeLivingHull`, not the NPC GLB.

---

## 5. Live Beautiful GLBs and materials (Wave 8 on disk)

`public/assets/ships/beautiful/`:

| Class | Files |
|---|---|
| `light/` | `lod0.glb` `lod1.glb` `lod2.glb` |
| `ace/` | `lod0.glb` `lod1.glb` `lod2.glb` |
| `cutter/` | `lod0.glb` `lod1.glb` `lod2.glb` |
| `heavy/` | `lod0.glb` `lod1.glb` `lod2.glb` |
| `frigate/` | `lod0.glb` `lod1.glb` `lod2.glb` |
| `freighter/` | `lod0.glb` `lod1.glb` `lod2.glb` `lod3.glb` |

LOD names match `NPC_SHIP_ASSETS` (`ship-assets.js` 25–27): freighter four LODs; others three.

`public/assets/ships/materials/beautiful/trader/` and `pirate/`: `basecolor` `normal` `orm` `emissive` as `.ktx2` + `.png`.

`assets-source/ships/beautiful/`: `light.blend` `ace.blend` `cutter.blend` `heavy.blend` `frigate.blend` `freighter.blend` (plus `.blend1` backups).

Wave 81 **does not** replace these files. A later bake serial that ships new GLBs must say so in **that** wave after inventory pins.

---

## 6. Per-class builders vs plates (look identity)

Shared modules (serial writers only): `surface.py` `anatomy.py` `organs.py` `__init__.py`.  
Disjoint class files (parallel-safe if no shared-module edit): `light.py` `ace.py` `cutter.py` `heavy.py` `frigate.py` `freighter.py`.

Probe: `scripts/probe-beautiful-parts.py` (header: prove shared constructs **before** class blame).

| Key | Bible §4.6 name | Plate file | Builder header | Authored envelope | Glance read (today, in files) |
|---|---|---|---|---|---|
| `light` | young wayfinder | `beautiful-light-young-wayfinder.png` | `light.py` 1–12 | l=7.8 b=3.28 h=1.87 | Compact dolphin-manta; forward crown; short tail; closest to player **family**, not a clone of `makeLivingHull` vertices |
| `ace` | swift-bonded hunter | `beautiful-ace-swift-bonded-hunter.png` | `ace.py` 1–18 | l=7.2 b=2.88 h=1.44 | Thin dart-manta; swept fins; traveling-wave nerve lines |
| `cutter` | guardian | `beautiful-cutter-guardian.png` | `cutter.py` 1–12 | l=11.0 (driver CLASSES) | Ventral cradle + grasping pads; open hold, not a mouth |
| `heavy` | shieldback | `beautiful-heavy-shieldback.png` | `heavy.py` 1–9 | l=17.0 b=8.84 h=5.78 | Dense spanY; overlapping dorsal mantles; raised shield fins |
| `frigate` | elder guardian | `beautiful-frigate-elder-guardian.png` | `frigate.py` 1–11 | l=32.0 b=12.48 h=8.32 | Long elder; four fin pairs; four hollows. **NPC visual yes; yard buy no** |
| `freighter` | gardenback | `beautiful-freighter-gardenback.png` | `freighter.py` 1–14 | l=85.0 b=46.75 h=25.5 | Colossal; three garden biomes. **NPC visual yes; yard buy no** |

Plates live in `docs/SpaceShipIdeas/reference-images/beautiful-ones/` plus `README.md` (inspiration, **not** model sheets).  
`docs/FactionExamples/06-beautiful-ones-ship.png` is the pipeline charter (`ShipAssetPipeline.md` 388–390): silhouette family / light / surface. **Not** a photocopy target.

Bible §4.6 (`FactionShipDesignBible.md` 157–170): living kin, not organic machines. Avoid body horror, teeth as architecture, mechanical kitbash, **identical player clones**.

Generic `BUILDERS['beautiful']` sphere+fin stub (`build-ship-assets.py` 354–361) is **not** the class look. Do not ship it as a “fix.”

---

## 7. Bake pipeline (still live)

Documented in `docs/ShipAssetPipeline.md` Wave 8 (386+). Scripts still on disk.

| Step | Tool | Output |
|---|---|---|
| 1 Sculpt | Blender background + `scripts/build-ship-assets.py` | `assets-source/ships/beautiful/<class>.blend` and `public/assets/ships/beautiful/<class>/lod*.glb` (`DELIVERY_ROOT` line 29; `build_one` 460–506) |
| 2 Compress | `scripts/compress-ship-assets.mjs` | Meshopt rewrite of GLBs; optional path prefix `beautiful` / `beautiful/light` |
| 3 Materials | `scripts/encode-ship-textures.mjs` | `public/assets/ships/materials/beautiful/{trader,pirate}/*.ktx2` from PNG |
| 4 Measure | `npm run ships:measure` → `scripts/measure-ships.mjs` | stdout only; LOD0 vs `SHIP_SCALE` span / proxy / class ladder |
| 5 Validate | `npm run ships:validate` → `scripts/validate-ship-assets.mjs` | factions × six classes; max 3 material slots / 3 draw calls; tri caps; **no package.json bake script** |

`package.json` 12–13: `ships:validate`, `ships:measure`. Bake itself is Blender CLI, not an npm script. Wave 81 must **not** add npm scripts.

Engine glow sphere is appended in the driver at `z = l * 0.47`, name `RIMWARD_ENGINE_GLOW` (`build-ship-assets.py` 484–501). Runtime `removeEngineNode` moves it into `userData.glow` (`ship-assets.js` 401–416). Keep that mesh.

Runtime does **not** import the Python builders. After bake, `ship-assets.js` loads the GLB.

Stations/gates for Beautiful are **procedural** (`station.js` 271 `buildBeautifulStation`). That does **not** prove ships should leave GLB.

---

## 8. HUD-02 / grafts / Unknowables (closed)

| Surface | Today | Cite |
|---|---|---|
| `hudFamily` | session override → `built` **mech** → `living` **bio** → leftover `isBeautiful` bio → else bio | `hud.js` 66–75 |
| HUD writes `hullKind` | **None** | grep `hud.js` `hullKind =` is only reads at 71–72 |
| `ctx.js` | “SHP / save.js own player.hullKind; HUD reads only.” | 19 |
| Grafts | `grafted: true` own-key only. Living / Unknowables **drop** it | `hangar.js` 81–107 |
| Graft desk | Mounted **built** hull only. No remount. No `hullKind` flip | `hangar.js` 730–752 |
| Grafted HUD | Built + grafted stays `mech` | `hud.js` 71; hangar 747–750 |
| Unknowables player | Always `makeLivingHull` | `ship.js` 503–528 |
| Unknowables NPC | Field GLB | `ship-assets.js` 7–10, 33 |
| Unknowables dock | No live station. `DETAIL_STATIONS` omits the key | `station.js` 508–527 |

Abomination tissue overlay is **later** (BIO-05). BIO-03 look must not overlay grafts on Beautiful NPC GLBs.

---

## 9. Persist / events / prototype-safe

| Surface | Today | Cite |
|---|---|---|
| Autosave | `rimward-save-v1` only | `save.js` |
| BIO-03 fields | **None.** No NPC-look persist key | — |
| Frozen events | `ctx.js` 198–227. No fleet-art event | `ctx.js` |
| `state.js` | READ-ONLY for feature workers | `state.js` 7–9 |
| `userData` | `glow`, `swimUniforms`, `swimPhase`, mixer, lod, proxy. Not save-backed | `ship-assets.js` 415–440 |
| World strings | Shipyard desk `textContent` (no `innerHTML` in `shipyard-desk.js`) | grep 0 |

Phase `Math.random` is visual-only. Do not persist it. Do not `Object.assign` untrusted blobs onto `userData`.

---

## 10. `ctx.js` ownership (load-bearing)

| Object | Writer | Reader |
|---|---|---|
| scene/camera/renderer | `main.js` (camera pose: `ship.js`) | everyone |
| `player.hullKind` | hangar / yard / save / Unknowables force | HUD **reads only** (`ctx.js` 19) |
| `bio` | `bio.js` only | ship / song / HUD |
| `ships` live NPC list | traffic + npc | combat, HUD |
| events | any `ctx.emit`; types frozen | HUD last consumer |
| Beautiful NPC GLB / GPU | `ship-assets.js` (+ bake scripts in a visual wave) | `npc.js` |
| Player living mesh | `ship.js` remount | cameras, combat, HUD |

BIO-03 look/bake must not add a frozen event. Must not write `hullKind` from HUD or from bake.

---

## 11. Wishlist BIO-03 vs live (gap after Wave 76)

| Ask | Live |
|---|---|
| Organic alien skins matching player magic | Wave 8 GLBs + KTX2. More organic than plated factions. Weaker than CPU manta + veins + mood |
| Speed-responsive swim | **Wave 76 landed** GPU Hz from speed. Player CPU swim stays unique |
| Class identity by shape and size | Six GLBs + `SHIP_SCALE` ladder exist. Glance identity vs plates / player bar is the remaining look serial |
| Marine vibes, not copies | Plates + bible say this. Later rebuild must keep the rule |
| Player CPU unique | Yes. NPC is GLB + GPU |

Motion is **not** the remaining hole. Per-class look vs the player bar, then bake/wire, is the remaining serial (Wave 75 steps 3–4).

---

## 12. Coupling (do not reopen)

| Other work | Coupling |
|---|---|
| Wave 76 motion | Keep per-instance uniforms. Do not revert to global 0.7 Hz. Do not clone CPU swim |
| BIO-05 grafts | Grafted = `built` + `grafted: true`. Mesh stays plated. BIO-03 does not author tissue overlay |
| SHP yards | `LIVING_STOCK` omit ace/freighter/frigate **buy**. NPC may still show those classes |
| HUD-02 | Never write `hullKind`. Grafted HUD stays `mech` |
| SHP-03 | Conventional guns stay. No lock box. No power ledger |
| Unknowables living | Player Unknowables remount = `makeLivingHull`. NPC Unknowables = field GLB. Do not merge |
| Wave 42 no-station | Unknowables have no dock. Beautiful **has** Bloom. Do not edit `DETAIL_STATIONS` / `GATE_BUILDERS` |
| BIO-01 / BIO-02 / BIO-04 | Gift/pirate seed deferred. Class evolution skipped. Psionics out |
| Bloom / gates | Procedural stations stay. Ships stay GLB unless owner overrides |

---

## 13. Regression risks already named

Weakening player-ship animation; replacing player CPU swim with NPC GPU “for consistency”; treating `isBeautiful(player.faction)` as the living test; literal Earth animals; cloning the player manta onto every NPC class; shared-module races during parallel class edits; sneaking a living-frigate/ace/freighter yard SKU; HUD write of `hullKind`; cloning `makeLivingHull` onto every Beautiful NPC (perf); remote GLB URLs / path injection; `eval` of model names; turning `userData.glow` into a non-mesh; baking a class that fails the player bar and shipping it anyway.

Fail closed for look: **keep the Wave 8 GLB** rather than a zoo or a CPU clone.

---

## 14. Later verify (not this wave)

- Visual: real Chrome with vite + swiftshader. Name it as later-impl, not Wave 81.
- `npm run test:boot` later. Known FAILs stay: WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul.
- Wave 81 does **not** run bake, measure, validate, or boot-test.
