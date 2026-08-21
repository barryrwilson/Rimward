# Current BIO-03 inventory (Wave 75)

**Wave:** 75. Design only.  
**Rule:** Live code wins over comments, lore, and this inventory if they disagree. Re-open the cited files before a visual serial.  
**Scope:** Beautiful **NPC** fleet look + motion vs the player living hull benchmark. Not player remount. Not grafts. Not psionics.

This file is the source of truth for “BIO-03 today.” The integrator brief and `shared-contract.md` must not invent fields that are not here unless they mark them **proposed, needs owner**.

Sibling: Wave 70 living-ships inventory [`out/w70/bio/current-bio-inventory.md`](../w70/bio/current-bio-inventory.md). Re-cited here with **live 2026-08-20** line numbers after Wave 72 grafts.

---

## 0. Files a later verifier must open

| File | Why |
|---|---|
| `src/systems/ship.js` | Player `makeLivingHull` / `buildLivingVisual` / CPU swim / breath / heartbeat / vein / thrust surge |
| `src/systems/organic.js` | `isBeautiful` = `faction === 'beautiful'` only |
| `src/systems/ship-assets.js` | Beautiful GLB path, GPU swim inject, idle clip, `userData.glow` mesh, canonical paths |
| `src/systems/npc.js` | `buildShipMesh` → `buildShipAsset`; `animateShipMesh`; glow is a real mesh |
| `src/game/shipyard.js` | `LIVING_STOCK` light/cutter/heavy; no living frigate **buy** |
| `src/game/hangar.js` | `hullKind` allowlist; Wave 72 `grafted`; Unknowables force living |
| `src/systems/hud.js` | `hudFamily` **reads** `hullKind`; never writes |
| `src/systems/shipyard-desk.js` | Graft offer on built only; does not write `hullKind` |
| `src/game/state.js` | `SHIP_CLASSES` six keys. READ-ONLY |
| `src/game/faction-style.js` | `isUnknowable`; vertex-color ruling for **built** ships (retired `FACTION_VC_PARTS`) |
| `src/systems/station.js` | Beautiful Bloom via `isBeautiful`; `DETAIL_STATIONS` 10 keys; Unknowables D3 no dock |
| `src/game/model-catalog.js` | Models Browser `ship:player` = `makeLivingHull` |
| `src/game/ship-scale.js` | Player hull is P (6.6). NPC GLBs measure against it |
| `src/core/ctx.js` | HUD reads `hullKind`; frozen events; no BIO-03 event |
| `scripts/build-ship-assets.py` | `PILOTS['beautiful']`; `add_idle` for beautiful + unknowables |
| `scripts/ship_builders/beautiful/` | Per-class pilots + `surface` / `anatomy` / `organs` |
| `scripts/measure-ships.mjs` | Live bake/measure pin for LOD0 GLBs |
| `public/assets/ships/beautiful/` | **Existing** Wave 8 GLBs (six classes, including frigate) |
| `docs/BioLivingShipsDesign.md` | Wave 70 sibling. BIO-03 named as a later visual serial. **Do not edit** |
| `docs/SpaceShipIdeas/reference-images/beautiful-ones/` | Six class plates (inspiration, not model sheets) |
| `docs/FactionExamples/06-beautiful-ones-ship.png` | Concept charter, not a GLB to copy |
| `docs/FactionShipDesignBible.md` §4.6 | Living kin, not organic machines |
| `docs/ShipAssetPipeline.md` Wave 8 | Bake process that **still** owns Beautiful NPC GLBs |
| `out/hud-research/live-combat.png` | Chase still of the **player living** hull (HUD research, not a BIO-03 stills pack) |

---

## 1. Player living hull — quality benchmark (`ship.js`)

**Preserve.** Wishlist BIO: later work must not weaken this. BIO-03 must **not** replace it with NPC GPU swim.

| Surface | Today | Cite |
|---|---|---|
| Boot mesh | Always `buildLivingVisual()` → `makeLivingHull()` | `ship.js` 549–553, 354–428, 258–307 |
| Sculpt | Sphere 64×40, elongate spine, manta disc, whip tail, dorsal camber, head bulge. Nose −Z, tail +Z | `makeLivingHull` 258–307 |
| Four motion fields | Swim (idle 0.5 Hz → cruise 2.3 Hz), wing flap, breath ~4 s (`BREATH_HZ` 0.25), heartbeat 1.1 Hz. Never still at zero throttle | header 17–34; constants 143–147; loop 888–933 |
| Skin | `MeshPhysicalMaterial` 0x2b2145, clearcoat, `makeVeinTexture` emissive | 360–371 |
| Eyes / underlight / scars | Two cyan eyes; teal point light; 5 scar planes gated by `bio.wounds` | 374–402, 952–955 |
| Mood | `MOOD_VISUALS` tints veins, glow, jitter, breath | 152–157, 935–950 |
| Thrust surge | Extra `emissiveIntensity` + underlight from throttle / afterburner. **No nozzle** | 957–962 |
| Growth visual | `GROWTH_SCALE_MAX = 0.15`. `flesh.scale` from `ctx.bio.growth` | 98, 978–986 |
| Reduced motion | Afterburner trail hidden. **Vertex swim still runs** | 989–991 vs 907–933 |
| Player record | `createShipState('light')` at boot. Default faction **`independent`** | `ship.js` 590–591 (call); `state.js` 146 (`opts.faction ?? 'independent'`) |
| Scale charter | This hull **is** `P` (spanX 6.60) | `ship-scale.js` 10–18, 38–39; `ship.js` 254–256 |
| Models Browser | `id: 'ship:player'` builds `makeLivingHull` + vein material. Catalog tags faction `'beautiful'` for **filter only** — that is not `ctx.player.faction` | `model-catalog.js` 92–113 |

CPU per-vertex mutation is unique to the **player living** rig. `publishHullPath` sets `ship.living` only when `rig.kind === 'living'` (`ship.js` 313–328). Built player hulls call `animateShipMesh` on the plated GLB (`ship.js` 963–965).

**Not the living-player test:** `isBeautiful(player.faction)` is false on the starter (`independent`).

---

## 2. Remount, Unknowables living-light, grafts

| Surface | Today | Cite |
|---|---|---|
| Mesh kind | Unknowables → living. `hullKind === 'built'` → plated. Else living (unset included) | `meshKindFor` `ship.js` 503–508 |
| `remountPlayerHull` | Unknowables force `hullKind: 'living'` **before** the branch. Living rebuilds `makeLivingHull` | 514–528 |
| Unknowables **player** | Always the CPU living manta, **not** the Unknowables field GLB | `ship.js` 503–508, 518–528 |
| Unknowables **NPC** | GLB field ships via `ship-assets.js` (`NPC_FACTIONS` includes `unknowables`; idle clip) | `ship-assets.js` 7–10, 33 |
| Unknowables **dock** | No live system. Wave 42 D3. `DETAIL_STATIONS` omits the key; `buildStationMesh` would placeholder if a system existed | `station.js` 254–258, 493–494; EXP inventory; `PROGRESS.md` 3362 |
| `grafted` (Wave 72) | Boolean own-key `true` only. Living / Unknowables **drop** it | `hangar.js` 81–107, 236–238 |
| Graft desk | Gilded, mounted **built** hull only. `graftMounted` does not remount and does not flip `hullKind` | `hangar.js` 730–752; `shipyard-desk.js` 140–148, 167 |
| HUD on graft | Grafted built stays `hullKind: 'built'` → `hudFamily` **mech** | `hud.js` 67–75; hangar 747–750 |

Abomination tissue overlay is **later** (BIO-05 visual). BIO-03 must not overlay grafts on Beautiful NPC GLBs or steal `makeLivingHull` for grafted plated hulls.

---

## 3. `isBeautiful` (`organic.js`)

| Surface | Today | Cite |
|---|---|---|
| Predicate | `faction === 'beautiful'` only | `organic.js` 67–69 |
| Use | NPC / station / gate **art** flag. Not a player-hull flag | header 3–8; `station.js` 255 |
| Toolkit | Grown nacre, mint 0x7fe0a8, part-level sway/breath/pulse for stations | `ORGANIC` 43–57; header 18–29 |
| Header vs code | Header still stresses part-level transforms; **also** documents Beautiful NPC GPU swim in `ship-assets.js` | `organic.js` 18–23 |

HUD (`hud.js` 73) still has a leftover `isBeautiful(p.faction) → bio` branch **after** `hullKind` living/built. Independent starter already returns `bio` from the final else. Do **not** key player living tests on `isBeautiful`.

---

## 4. Beautiful NPC path — GLB + GPU swim (`ship-assets.js`)

**This is not `makeLivingHull`.**

| Surface | Today | Cite |
|---|---|---|
| Catalog | `NPC_FACTIONS` includes `beautiful`. `NPC_CLASSES` = `light` `ace` `cutter` `heavy` `frigate` `freighter` | `ship-assets.js` 7–11 |
| Paths | `` `${ASSET_ROOT}/${faction}/${classKey}/${lod}.glb` `` with `ASSET_ROOT = '/assets/ships'` | 13, 23–36 |
| Canonical | Unknown faction → `independent`. Unknown class → `light`. Role → `trader` \| `pirate` | 50–60 |
| Idle clip | Beautiful **and** Unknowables templates set `idleClip: 'idle'` | 33 |
| Bake idle | `add_idle` keyframes root scale 1 → 1.025/0.985/1.025 → 1, frames 1–40, **beautiful + unknowables only** | `build-ship-assets.py` 445–457 |
| GPU swim | `onBeforeCompile` inject on beautiful materials only. Shared `uSwimTime` / `uSwimAmp`. `aSwim` (zn, wing, xn, sz). **Fixed 0.7 Hz**. Breath 0.25 Hz × 1.2% | `ship-assets.js` 44–48, 135–170 |
| Per-ship phase | Dummy morph slot + `Math.random() * Math.PI * 2` | 216–247, 396–405 |
| Frame update | `swimTimeUniform.value = elapsed`; `swimAmpUniform.value = reducedMotion ? 0 : 1` | 425–434 |
| Speed response | **None.** Amp is global 0 or 1. Frequency does not read NPC `speed` | 432–434 vs player 888–899 |
| NPC mesh | `buildShipMesh` → `buildShipAsset` after prime. **No** `buildBeautifulShip` in live `npc.js` | `npc.js` 166–167 |
| Glow | `root.userData.glow` is a **Group** that holds the engine mesh (or a sphere fallback). Wave 42: glow must stay a real mesh | `ship-assets.js` 373–385; `npc.js` 1915, 1941 |
| Self-contained GLB | Test reader rejects external `buffers[].uri` / `images[].uri` | `ship-assets.js` 180–198 |
| No eval | No `eval` / `new Function` of model names | grep `ship-assets.js` |
| No remote URL | Relative same-origin `/assets/ships/…` only | 13, 205 |

Live files under `public/assets/ships/beautiful/`: `light/`, `ace/`, `cutter/`, `heavy/`, `frigate/`, `freighter/` with lod0–lod2 (freighter also lod3). **These already exist** (Wave 8). Wave 75 does **not** ship replacements. Do not claim new GLBs from this brief.

---

## 5. PILOTS / class keys / bake-measure (still live)

| Surface | Today | Cite |
|---|---|---|
| Runtime classes | `SHIP_CLASSES`: `light` `heavy` `freighter` `ace` `cutter` `frigate` | `state.js` 35–42 |
| Asset classes | `NPC_CLASSES` same six keys | `ship-assets.js` 11 |
| Driver `PILOTS` | `'beautiful': beautiful_pilot` among all 12 factions | `build-ship-assets.py` 429–442 |
| Beautiful `PILOT_CLASSES` | Full six: `light` `ace` `cutter` `heavy` `frigate` `freighter` | `scripts/ship_builders/beautiful/__init__.py` 73 |
| Per-class files | `light.py` `ace.py` `cutter.py` `heavy.py` `frigate.py` `freighter.py` plus shared `surface.py` `anatomy.py` `organs.py` | `scripts/ship_builders/beautiful/` |
| Measure | `scripts/measure-ships.mjs` loads `public/assets/ships/<faction>/<class>/lod0.glb` vs `SHIP_SCALE` | header 1–16 |
| Compress / validate | `compress-ship-assets.mjs`, `validate-ship-assets.mjs` still in `scripts/` | listing |
| Pipeline doc | Wave 8 COMPLETE 2026-08-14; Beautiful NPC swim landed in `ship-assets.js` | `docs/ShipAssetPipeline.md` 386–537 |

**Bake still applies** for Beautiful NPC GLBs. Stations and gates for Beautiful are **not** this GLB pipeline (Bloom is procedural Three.js). Fail closed for BIO-03 ships: **keep the live GLB bake path** unless the owner overrides.

---

## 6. Yards — `LIVING_STOCK` (buy ≠ NPC visual)

`src/game/shipyard.js`:

```
YARD_LIST_UU: light 8000, cutter 11000, heavy 20000, ace 28000, freighter 24000, frigate 80000
CORE_STOCK: light, cutter, heavy, freighter, ace, frigate   // plated factions
LIVING_STOCK: light, cutter, heavy                         // beautiful
UNKNOWABLES_STOCK: light                                   // unknowables
YARD_STOCK.beautiful = LIVING_STOCK
hullKindFor: beautiful | unknowables → 'living'; else 'built'
```

Cites: `shipyard.js` 16–40, 69–72.

Beautiful / Unknowables **omit frigate buy**. NPC Beautiful GLBs **include** `frigate/` (and `ace/`, `freighter/`). A living frigate may exist as an **NPC visual** while yard buy stays omitted. Do not sneak a SKU.

Buy adds a hangar row. It does not remount. Player living remount of a bought row still uses `makeLivingHull` (`hangar` `switchTo` + `remountPlayerHull`), not the NPC GLB.

---

## 7. HUD-02 `hullKind` (closed)

```
hudFamily (hud.js 67–75):
  session override rw-hud-family
  hullKind === 'built' → mech
  hullKind === 'living' → bio
  isBeautiful(faction) → bio
  else → bio
```

HUD **reads** `p.hullKind` (also 888, 1380). Grep shows **no write**. `ctx.js` 19: “SHP / save.js own player.hullKind; HUD reads only.” Grafted built hulls stay `mech`. BIO-03 must not add a HUD family or write `hullKind`.

---

## 8. SHP-03 conventional guns (closed)

Mounts follow `classKey`, not `hullKind`. Living hulls keep cannon / disruptor. No lock box. No power ledger. `state.js` 7–9, 44–53 (`MOUNT_TABLE`). BIO-03 is visual+motion only.

---

## 9. `FACTION_VC_PARTS` vs Beautiful organic path

| Era | What |
|---|---|
| Wave 37–47 | `npc.js FACTION_VC_PARTS` sculpted built ships as vertex-colored boxes. `faction-style.js` 27–30 still **documents** `vcGeoFor()` |
| Wave 47 | `PROGRESS.md` 2187, 2416: **`FACTION_VC_PARTS` deleted** in favour of `DETAIL_SHIPS` (ten procedural VC kits under `src/systems/ships/`). That is **not** the GLB era |
| Live NPC path | GLB via `npc.js` 166–167 `buildShipMesh` → `buildShipAsset`. Beautiful: organic GLB + KTX2 + GPU swim (`ship-assets.js`). Bloom is procedural (`station.js` 255, 558+) |

BIO-03 must not revive `FACTION_VC_PARTS` for Beautiful ships. Built-faction vertex-color law stays for plated hulls only.

`DETAIL_STATIONS` (`station.js` 500–511, ten keys, **no** `beautiful` / `unknowables` rows) plus live gate dispatch `GATE_BUILDERS` (`gate.js` 17–18) is **not** BIO-03’s to change. Comments still say `OVERLAY_FACTIONS` (`station.js` 498); that table name is **not** a live `gate.js` constant. Beautiful **already has** a station (`isBeautiful` → `buildBeautifulStation`) and mint-bud texture (`gate.js` 87–88, built 118–120, used 243–244 / 327–328). Unknowables **do not** get a dock. Do not add Unknowables to `DETAIL_STATIONS` from this brief.

---

## 10. Art references (inspiration, not copies)

| Asset | Role |
|---|---|
| `docs/SpaceShipIdeas/reference-images/beautiful-ones/` | Six plates: Young Wayfinder, Swift-Bonded Hunter, Guardian, Shieldback, Elder Guardian, Gardenback. README: concept references, **not** literal model sheets; marine *vibes* |
| Files | `beautiful-light-young-wayfinder.png`, `beautiful-ace-swift-bonded-hunter.png`, `beautiful-cutter-guardian.png`, `beautiful-heavy-shieldback.png`, `beautiful-frigate-elder-guardian.png`, `beautiful-freighter-gardenback.png` |
| `docs/FactionExamples/06-beautiful-ones-ship.png` | Pipeline charter: silhouette family / light / surface. **Not** a target to reproduce (`ShipAssetPipeline.md` 388–390) |
| Bible §4.6 | Player ship as quality + anatomy reference; class = life stage / body plan; avoid body horror and identical player clones | `FactionShipDesignBible.md` 157–170 |
| Player stills | `out/hud-research/live-combat.png` and `wave-f-*.png` show the **live player living hull** in chase/HUD. There is **no** dedicated BIO-03 stills pack. Models Browser `ship:player` is the geometry still |

Do not treat Earth squid / octopus / whale / shark / dolphin / manta as copy targets.

---

## 11. Persist / events / prototype-safe

| Surface | Today | Cite |
|---|---|---|
| Autosave | `rimward-save-v1` only | `save.js` |
| BIO-03 fields | **None.** No NPC-look persist key | — |
| Frozen events | Listed `ctx.js` 198–227. No fleet-art event | `ctx.js` |
| `state.js` | READ-ONLY for feature workers | `state.js` 7–9 |
| World strings | Shipyard desk `textContent` (no `innerHTML` in `shipyard-desk.js`) | grep |

BIO-03 later impl must stay prototype-safe and must not add a persist key for swim phase (`Math.random` today is visual-only).

---

## 12. Wishlist BIO-03 vs live (gap)

| Ask | Live |
|---|---|
| Organic alien skins matching player magic | Wave 8 GLBs + KTX2. More organic than plated factions. Weaker than CPU manta + veins + mood |
| Speed-responsive swim | Player: 0.5→2.3 Hz + amp from `speedNorm`. NPC: fixed 0.7 Hz, global amp 0/1 |
| Class identity by shape and size | Six GLBs + `SHIP_SCALE` ladder already. Identity may still read weaker than plates / player benchmark |
| Marine vibes, not copies | Plates + bible say this. Later rebuild must keep the rule |
| Player CPU swim unique | Yes. NPC is GLB + GPU |

---

## 13. Coupling (do not reopen)

| Other work | Coupling |
|---|---|
| BIO-05 grafts | Grafted = `built` + `grafted: true`. Mesh stays plated. BIO-03 does not author tissue overlay |
| SHP yards | `LIVING_STOCK` omit frigate/ace/freighter **buy**. NPC may still show those classes |
| HUD-02 | Never write `hullKind`. Grafted HUD stays `mech` |
| Unknowables living | Player Unknowables remount = `makeLivingHull`. NPC Unknowables = field GLB. Do not merge |
| Wave 42 no-station | Unknowables have no dock. Beautiful **has** Bloom. Do not edit `DETAIL_STATIONS` / `GATE_BUILDERS` |
| BIO-01 / BIO-02 / BIO-04 | Gift/pirate seed deferred. Class evolution skipped Wave 72. Psionics out |

---

## 14. Regression risks already named

Weakening player-ship animation; replacing player CPU swim with NPC GPU “for consistency”; treating `isBeautiful(player.faction)` as the living test; literal Earth animals; sneaking a living-frigate yard SKU; HUD write of `hullKind`; cloning `makeLivingHull` onto every Beautiful NPC (perf); remote GLB URLs / path injection; `eval` of model names; turning `userData.glow` into a non-mesh.

Wave 64/72 already: Unknowables never `'built'`; grafts never living remount; factory-reset of `ctx.bio` forbidden.
