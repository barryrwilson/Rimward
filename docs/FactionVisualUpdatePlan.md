# RIMWARD Faction Visual Alignment — Phased Plan

Goal: make every faction's **stations, ships, and jump gates** in-game match the
colors and styles of the reference concept art in `Docs/FactionExamples/`
(30 PNGs + 3 overview sheets; prompt notes in `PROMPTS.md`).

The images are explicitly *visual-development references, not canon*
(`Docs/FactionExamples/README.md`). This plan treats them as the style target
while respecting two existing in-game identities worth keeping: Veridian's
§18.2 white/cyan corporate look and the Beautiful Ones' established mint/nacre
organic kit. Both are flagged as decisions below.

---

## 1. Current architecture (the three dispatch seams)

| Asset | File | How faction look is resolved today |
|---|---|---|
| Ships (NPC) | `src/systems/npc.js` | `materialsFor(faction)` → shared `{hull, trim}` from `FACTIONS[faction].color`; `buildShipMesh(classKey, faction, role)` → **one placeholder silhouette per classKey for every faction**, except `isBeautiful` → `buildBeautifulShip` (wave 27). Engine glow is one shared amber material. |
| Stations | `src/systems/station.js` | `SCHEMES` has **only freehold/veridian**; `schemeFor()` falls back to a neutral gray scheme tinted by `def.station.palette`. **One placeholder spindle/ring/drum mesh for all non-beautiful factions**, except `buildBeautifulStation` (waves 27/33). |
| Jump gates | `src/systems/gate.js` | All gates are **Lamplighter brass/amber** regardless of system faction; beautiful systems get a grown-over subgroup (wave 27). No other per-faction variance. |

Supporting data flow:

- `FACTIONS` (`src/game/state.js`) — 12 keys; colors feed HUD brackets,
  `galaxychart.js` nodes, `wakes.js`, and ship hulls.
- `scripts/generate-galaxy.mjs` — `FACTION_COLOR` table stamps every generated
  system's `station.palette`; a validation rule (`palette mismatch`) fails the
  build if data and table drift. **Any faction color change must regenerate
  `src/game/galaxy.generated.js`.**
- `src/systems/solarsystem.js` — planet band palettes are binary `warm`/`cold`
  (veridian → cold, everything else → warm).
- Generated-galaxy faction census (`EXPECTED_FACTION_TOTALS`): freehold 20,
  veridian 18, ferrous 17, independent 13, redledger 12, gilded 8, beautiful 3,
  congregation 3, hollow 3, assembly 2, lamplighter 1. **`unknowables` flies no
  generated system** — its assets only appear if spawned otherwise.

Binding conventions (from file headers, must hold in every phase):

- `update()` performs **zero allocations**; per-frame animation mutates in place.
- Module-cached shared materials/geometries are **never disposed**
  (`userData.shared` skip in `teardownMesh`); per-build materials dispose exactly as before.
- All animation freezes under `ctx.settings.reducedMotion`.
- `AUTHORED_SYSTEMS` by-id guards keep the authored six byte-identical where
  that ruling exists (pricing/voice — visuals are not currently guarded).
- Silhouettes must stay readable at distance (§13.1); nose is local -Z on ships.

## 2. Faction ↔ image mapping and extracted palettes

Dominant/accent colors below were sampled directly from the PNGs
(median-cut quantization; hull = dominant structure tones, accent = saturated
trim/light tones). `PROMPTS.md` supplies the intent where sampling is muddy.

| # | Faction key | Hull / structure | Trim / secondary | Light / glow accent | Style keywords (from PROMPTS.md) |
|---|---|---|---|---|---|
| 01 | `veridian` | graphite `#2d3535`, pale alloy `#6a6c67` | `#55625a` | muted emerald-green `#3a5a4b` → suggest `0x58c49a` | modular hexagonal industrial, assay towers, sensor fins, emerald-white aperture |
| 02 | `ferrous` | iron gray `#42454b` / `#50545a` | cold steel `#566b7c` | restrained crimson `#643f38` → `0x8a3a34`, brass `0xb08a4a` | monumental armored symmetry, radial batteries, bastions, disciplined formations |
| 03 | `freehold` | warm browns `#80674f` / `#5a4a39` | weathered cream `0xd8c9a8`, faded blue `0x5b7a94`, barn red `0x9a4436` | warm amber windows `#dba474` → `0xffb454` (matches current) | repaired mismatched modules, farm rings, greenhouses, scaffolds, cared-for |
| 04 | `redledger` | dark iron `#1e1a15` | tarnished copper `#946445` / `#9d693f` | dried-blood red `#5d211a` → `0x7e2a20`, amber utility `0xd88a3a` | captured rebuilt hardware, tally geometry, repair scars, toll platforms |
| 05 | `gilded` | black ceramic `#0b0d0e` | ivory `#a09b8a`, old gold `#77674b` → `0xc9a86a` | cold turquoise `#3b757e` / `#4e939d` → `0x4fc4c4` | scale-like overlapping armor, auction pavilion, sealed vaults, elegance over horror |
| 06 | `beautiful` | pearl/indigo `#283a5e` (current: nacre/mint) | gilt `0xc9a86a`, opal `0xd8c8f0` | cyan-violet bioluminescence `#788dd4` (current: mint `0x7fe0a8`) | grown bone/membrane, manta-whale, cradle docks — **already implemented; see Decision D2** |
| 07 | `unknowables` | sparse dark anchors `#1e2024` | — | ultraviolet `#665fac`, electric cyan `0x6fd8e8`, white-gold `0xffe8b0` (sampled `#5770af`/`#7ea0e2`) | **no hull** — coherent energy field, nested magnetic loops, lensing arcs, floating cells |
| 08 | `assembly` | weathered off-white `#6b6e70` → `0xb8b4a8` | charcoal `#1a1c1d`, faded orange `#7b5e45` → `0xb8763c` | teal optics `#3e767a` / `#569294` → `0x4faeae` | recursive self-similar modules, copy-error duplication, antenna forests, daughter probes |
| 09 | `congregation` | midnight blue `#1d1e2d` / `#2b3264` | weathered silver `0xa8b0b8` | candle amber `0xd8a25a`, violet Wakeglass `#48426f` → `0x8a7bd8` | radial rimward orientation, shrines, observation nave, folded sails, refuge docks |
| 10 | `lamplighter` | soot-black `#1d1915` / `#2a2b2d` | weathered utility yellow `0xd8a83a` | warm lamps `#b09066` → `0xffc06a`, cobalt diagnostics `#355889` → `0x5a8ae0` | standardized replaceable parts, exposed access routes, gantries, thousands of guide lamps |
| — | `hollow`, `independent` | *(no reference images)* | | | keep current derived/gray looks |

### Decisions

- **D1 — Veridian accent (APPROVED, wave 37).** Graphite + muted emerald
  (`0x58c49a`) replaces §18.2 white/cyan per the images. Implemented.
- **D2 — Beautiful Ones glow (APPROVED, wave 37).** Mint (`0x7fe0a8`) kept
  (established in-fiction and already built); indigo/violet reads only via
  planet grading and gate overgrowth accents. Implemented.
- **D3 — Unknowables scope (APPROVED, wave 37; BUILT, wave 42).** No hull.
  Ships are an energy field (`'unknowables-field'`: 3 nested magnetic loops on
  perpendicular planes, 2 lensing arcs, 6 floating cells, 1 core) and gates take
  an `'unknowables-overlay'` of 4 hairline lens sweeps plus 8 plasma cells that
  fill the bore only during transit. Still no generated system flies the
  faction — the assets reach the screen through the ordinary faction dispatch
  (`buildShipMesh`, `OVERLAY_FACTIONS`) the moment one does, and the boot
  harness covers both through synthetic spawns and a scoped faction override
  (the wave-27 precedent).
- **D4 — Multi-color mechanism (APPROVED, wave 37, user: "hard-core
  option").** Built ships bake per-part faction colors into **vertex colors
  on merged geometry** sharing ONE `MeshStandardMaterial` across all
  factions — one draw call per ship, color lives in the mesh. Stations take
  full per-faction schemes plus patchwork part coloring; gates tint per
  system faction. Implemented across npc.js / station.js / gate.js /
  solarsystem.js.
- **D5 — Merged-vertex-colour station detail (APPROVED, wave 43).** User
  rejected the wave-38 detail level as too simple and basic; stations are
  rebuilt with merged geometry baking per-part colours into vertex
  attributes. Freehold Landing, the pilot, carries ~600 parts (175,775
  vertices) in 8 geometries + 6 materials + 2 textures — measurably CHEAPER
  than the ~25-part sculpt it replaced (scene resource reading 195 → 173).
  The remaining seven built factions await the same treatment. Wave 44
  widens the palette rule to a recomputable weathering ladder (SHADES =
  [1.0, 0.86, 0.72, 0.6] applied via Math.round(channel8bit * f) per sRGB
  channel) so plating can be mottled without leaving the faction identity.

## 3. Phases

### Phase 0 — Style data foundation

Create one source of truth every seam reads.

- New module `src/game/faction-style.js` exporting `FACTION_STYLE[faction] =
  { hull, hullDark, trim, accent, glow, beacon, metalness, roughness, notes }`
  seeded from the table above, plus `styleFor(faction)` with an
  `independent`-gray fallback (the `schemeFor` fallback pattern).
- Record D1/D2/D3 outcomes in the module header.
- **Files:** new `src/game/faction-style.js`. No behavioral change yet.
- **Verify:** `scripts/boot-test.mjs` passes unchanged.

### Phase 1 — Color alignment (materials and palettes only, zero geometry work)

**STATUS: DONE (wave 37)** — with the D4 vertex-color upgrade: ships bake
per-part faction colors into merged vertex-colored geometry (one draw call
per ship); stations got per-faction schemes + patchwork parts; gates tint
per faction; planets grade per faction; data regenerated.

1. `src/game/state.js` — update `FACTIONS[f].color` to image-derived accents
   (per D1/D2). HUD brackets, `galaxychart.js`, `wakes.js` inherit automatically.
2. `src/systems/npc.js` — extend `materialsFor(faction)` from `{hull, trim}` to
   `{hull, dark, trim, accent, light}` built from `FACTION_STYLE`; same
   shared-never-disposed contract. Retint the shared engine glow per faction
   (one cached glow material per faction accent, still shared).
3. `src/systems/station.js` — replace the two-entry `SCHEMES` with a per-faction
   scheme table derived from `FACTION_STYLE`; `schemeFor()` keys on
   `def.faction` instead of `systemId` (keep explicit freehold/veridian overrides
   only if D1 keeps any §18.2 residue). Same placeholder geometry — only colors,
   emissives, glow sprites change.
4. `src/systems/gate.js` — tint gate glow/beacon/charge-tunnel per system
   faction accent while the **structure stays Lamplighter brass** (lore: the
   Guild builds all gates; the images show faction-contextualized gates, and the
   tint delivers that without geometry work). Beautiful keeps its mint shift.
5. `src/systems/solarsystem.js` — replace binary warm/cold with a per-faction
   band-palette table (image-derived tones for planets in that faction's space).
6. Regenerate data: update `FACTION_COLOR` in `scripts/generate-galaxy.mjs`,
   re-run it, confirm its `palette mismatch` validation passes.
- **Files:** `state.js`, `npc.js`, `station.js`, `gate.js`, `solarsystem.js`,
  `generate-galaxy.mjs`, `galaxy.generated.js`, `faction-style.js`.
- **Verify:** boot-test; screenshot tour of one system per flown faction vs the
  three overview JPGs; confirm authored six unchanged except intended recolors.

### Phase 2 — Ships: per-faction silhouette kits (`src/systems/npc.js`)

Follow the wave-27 Beautiful precedent exactly: a dispatch table
`SHIP_BUILDERS[faction] → (classKey, role) → Group`, module-cached geometries
per faction+classKey (shared, never disposed), part-level animation only.

- Refactor: extract the existing placeholder switch into
  `buildPlaceholderShip` (the `independent`/fallback path); add the dispatch
  where `isBeautiful` currently short-circuits.
- Per faction, sculpt the 5 classKeys (freighter, cutter, heavy/frigate, ace,
  light) from the faction's image language:
  - **Batch A** (most systems): `freehold` (patchwork homestead freighter,
    mismatched panels), `veridian` (hex-modular survey hulls, sensor fins),
    `ferrous` (blunt armored prow, citadel plating, formal weapon housings).
  - **Batch B:** `redledger` (boarding prow, grappling booms, repair scars),
    `gilded` (overlapping scale armor, sealed galleries — ivory/gold on black
    ceramic), `congregation` (forward observation chamber, folded sails),
    `assembly` (recursive duplicated modules, sensor crown, daughter pods).
  - **Batch C:** `lamplighter` (repair arms, cable reels, relay mast, tug
    engines), and `unknowables` (D3) — **no hull**: additive field loops,
    lensing arcs and floating cells on a new render path, not the mesh kit.
    Landed in wave 42; the core mesh doubles as `userData.glow`, so the AI
    engine-glow contract owns its scale and `animateField` never writes it.
**STATUS: PARTIAL (wave 43).** Stations received per-faction schemes and
 patchwork part coloring in wave 37, but the geometry remained low-detail.
 Wave 43 rebuilds ONE station (Freehold Compact) as a detailed merged-vertex-colour
 sculpt; seven built factions await the same treatment.
- **Verify:** spawn each faction×class in a test system; silhouette readable at
 500u; zero-alloc `update()`; qship cover path and ace-reveal rebuild still
  route through the dispatch correctly.

### Phase 3 — Stations: per-faction builders (`src/systems/station.js`)

Same dispatch shape as `buildBeautifulStation`: `buildStationMesh` routes on
`def.faction` to a per-faction builder; placeholder remains the fallback.
Mesh-only work — dock UI, services, pricing, and contacts are untouched.

- Shared infrastructure first: per-faction cached geometry/material helpers,
  `userData.shared` tagging, pulse/sway tag conventions (reuse `organic.js`
  tagging patterns where applicable, minus the organics).
- **Batch A:** `freehold` (farm rings + greenhouse modules + donated hull
  sections), `veridian` (hexagonal extraction complex, assay towers, docking
  spokes), `ferrous` (fortress-bastion, radial batteries, central command tower).
- **Batch B:** `redledger` (captured refinery core + tribute vault), `gilded`
  (auction pavilion, observation rotunda), `congregation` (outward-facing nave,
  sect bays), `assembly` (repeating foundry cells, antenna forest, ancient core).
- **Batch C:** `lamplighter` (gate-service depot: spare ring segments, parts
  yards, cranes).
- **Verify:** dock/undock at each new station; `teardownMesh` disposal audit
  (no leaks across 10 system jumps); reducedMotion freeze; authored six
  behavior identical except intended visuals.

### Phase 4 — Jump gates: faction contextualization (`src/systems/gate.js`)

Keep the Lamplighter brass ring as the structural base everywhere (lore-true),
then add a per-system-faction overlay subgroup — the exact
`beautiful-overgrowth` precedent (wave 27), generalized:

- `veridian`: segmented hexagonal ring cladding, claim beacons, emerald aperture.
- `ferrous`: four cardinal bastions, blast shutters, crimson marker lights.
- `freehold`: replaced ring segments, repair scaffolds, warm window pods.
- `redledger`: armored toll platforms, boarding dock, strict beacon lanes.
- `gilded`: oval scale-segment cladding, turquoise aperture.
- `congregation`: shrine pods, amber guidance lights, violet Wakeglass accents.
- `assembly`: recursive scaffolds, duplicated sub-rings, teal optics.
- `lamplighter`: full service dress — gantries, relay crown, maintenance rail,
  thousands of amber lamps (this is the gate's "home" look).
- `unknowables` (D3, wave 42): four hairline gravitational lens sweeps standing
  off the ring on the bore axis, plus an 8-cell plasma group that is visible
  only while `ctx.gate.jumping` names this gate's destination.
- Junction lantern (hex frame + route arms) stays faction-neutral brass; tunnel
  particles already tint from Phase 1.
- **Verify:** jump charge/tunnel visuals per faction; hub route selection
  (KeyG lamps) unaffected; zero-alloc update; rebuild disposal on systemLoaded.

**STATUS: DONE (wave 39), REVISTED (wave 43).** Phases 0-4 landed in waves
37-38; D3 (unknowables) landed in wave 42. Wave 43 added Phase 6 for
 station detail; Phase 3 stations are now partial pending the remaining
 seven faction rebuilds.
- Full screenshot matrix (10 factions × station/ship/gate, 33 stills) captured
  and diffed against `docs/FactionExamples/`. Result: every kit is built and
  correctly coloured in the data, but the authored hull colour was invisible on
  any face the sun did not strike — `metalness` 0.45–0.7 with no environment map
  plus a flat low ambient. Fixed by capping `FACTION_STYLE.metalness` at 0.35
  and replacing the flat ambient with a graded
  `HemisphereLight(0x9fb4c8, 0x2a2418, 2.0)` in `solarsystem`'s scene backdrop
  (`starfield.js`). Calibrated by masked pixel measurement; gilded black ceramic
  is the control and did not lift.
- Perf pass: per-frame allocation, shared-asset disposal and cache-key
  collisions all came back clean for wave-37/38 code. One pre-existing per-frame
  string allocation in the gate jump-fade was removed. reducedMotion sweep
  closed three pre-existing ungated animation blocks (station idle, ship engine
  glow, gate idle).
- `scripts/boot-test.mjs` green with four new `wave39` sections; generator
  validation green; `vite build` clean.
- `PROGRESS.md` wave-39 entry written; `docs/FactionExamples/README.md` carries
  the implementation-status note (the references stay non-canonical).
### Phase 6 - Station detail pass (waves 43-46)

**STATUS: DONE (wave 46).** Every station path in the game is a detail sculpt or
a deliberate exception. Freehold landed in waves 43-44; the seven remaining built
factions in wave 45, which also moved every sculpt into its own module and
generalised the harness pins; independent and hollow in wave 46, which retired
the placeholder from live service and added a per-system seed.

After wave 38, the user rejected the per-faction station detail level as
too simple and basic across all eight built factions. The stations carried
only ~30 parts each via ~36 resources (geometries + materials), nowhere
near the visual density of the reference art.

**Decision D5 — Merged-vertex-colour station detail:** rebuild stations
using the same merged-geometry pattern from the wave-37 D4 ship ruling,
baking per-part colours into vertex attributes and merging each colour
channel into ONE BufferGeometry. This makes detail cost almost no GPU
resources. The wave-39 ten-jump leak test pins scene-wide resource
counts with the assertion `Math.abs(liveAfter10 - liveAfter1) <= 60`
where the baseline is `liveAfter1=195 liveAfter10=194` — margin of 1
used out of 60. Per-part materials or geometries therefore could not
scale. MEASURED: the rebuilt Freehold station carries ~600 primitives in 8
geometries + 6 materials + 2 textures — 175,775 merged vertices, 14,160 of
them in the glow chunk — and the scene resource reading DROPPED from 195 to
173, so the detailed station is cheaper than the placeholder it replaced.

NEW TOOLKIT `src/systems/station-detail.js`: deterministic greeble toolkit
with seeded RNG (no Math.random), frame stack for sub-assembly local
space, 6 shape primitives (box, cyl, sphere, hemi, torus, cone), and 12
composite greebles (ribBands, windowRow, portholeRing, truss, railing,
panelPatches, pipeRun, antenna, ladder, radiatorPanel, lampString, crate).
Every part colour arrives as a hex from the caller — the module knows
nothing about FACTION_STYLE. Exports `detailBuilder`, `rng`, all
primitives, and all greebles. `build()` throws on an unclosed `push()`
frame: an unbalanced frame silently offsets every later assembly, which is
exactly how the bring-up threw parts 200 units off the raft.

SIX MERGED CHANNELS (`buildFreeholdStation` in `station.js`):
- `hull` (MeshStandardMaterial, vertexColors) — all lit-by-sun structure
- `glow` (MeshBasicMaterial, vertexColors) — amber windows, lamps, lantern,
  pulsed by `update()`
- `glaze` (MeshBasicMaterial, vertexColors) — greenhouse grow-light glazing,
  static
- `ringHull` / `ringGlow` / `ringGlaze` — the agri-carousel's structure, pod
  lights and glazed growing pods, inside the one spinning ringGroup

COLOUR RULE: `update()` pulses `lightMat.color` (the faction's warm amber)
and that MULTIPLIES the glow channel's vertex colours, so those must stay
near-neutral — every sRGB channel >= 0.6. Any other hue belongs in
`glaze`/`ringGlaze`, whose material is white and never animated.

CRITICAL INVARIANTS (boot-harness pinned):
- Group name `freehold-station` and exactly ONE direct Group child (the
  spinning ringGroup)
- No PointLight anywhere
- Zero new resources and zero new userData per frame
- Everything reaches teardownMesh (no userData.shared skip)
- U.DOCK_RANGE 45 envelope (|x|,|z| <= 32, y in [-26, 33])

Reference art: `docs/FactionExamples/03-freehold-compact-station.png`
("Freehold Landing" — sprawling raft of mismatched pressurised modules,
fat drums, spheres, glazed barrel-vault greenhouse, barn-red centre dome,
lighthouse mast, catwalks, hundreds of warm-amber windows).

FOLLOW-ON BATCH (pending user approval of Freehold): the remaining seven
built factions, ordered by flown-system count:
- veridian (18 systems) — hexagonal extraction complex, assay towers,
  docking spokes
- ferrous (17) — fortress-bastion, radial batteries, central command tower
- redledger (12) — captured refinery core + tribute vault
- gilded (8) — auction pavilion, observation rotunda
- congregation (3) — outward-facing nave, sect bays
- assembly (2) — repeating foundry cells, antenna forest, ancient core
- lamplighter (1) — gate-service depot: spare ring segments, parts yards,
  cranes

Each rebuild follows the Freehold pattern: rewrite the faction builder in
station.js to consume station-detail.js, emit merged channels, keep every
invariant, and mirror the six harness pins (mergedChunks, vertexColoured,
mergeDiscipline <= 8 geometries and <= 8 materials, detailDensity >= 20000
merged vertices, windowDensity >= 2000 glow vertices, envelope). Freehold's
reference numbers are ~600 parts and 175,775 vertices. Each rebuild is
self-contained and touches only that faction's builder.

Orientation traps the Freehold bring-up paid for, worth carrying forward: a
`CylinderGeometry`'s axis is +Y, so `rz: Math.PI/2` lays it along X while
`rx: Math.PI/2` lays it along Z; a `TorusGeometry` lies in XY, so
`rx: Math.PI/2` puts the ring in the XZ plane and `ry: Math.PI/2` rings the
X axis; and a `MeshBasicMaterial` glaze channel is unlit, so a saturated hue
there reads as a flat plastic blob — the greenhouse only worked once it was
split into 14 panes behind dark mullions with the green dulled to `0x35603a`.

The eighth built faction is unknowables, who by D3 build no station at
all. The placeholder (independent/hollow) remains untouched.

- **Files:** `src/systems/station-detail.js` (new), `src/systems/station.js`
  (buildFreeholdStation rewrite), `scripts/boot-test.mjs` (wave-38 freehold
  pins replaced + new wave-43 section).
- **Verify:** boot test PASS with the six replaced wave-38 pins and the four
  wave-43 checks (determinism, paletteFromStyle, glowNearWhite,
  teardownDisposesAll); browser-verified at fh_hearth from three camera
  angles; mesh bounding box inside the U.DOCK_RANGE envelope; window pulse
  live and glaze static; teardown disposal clean; reducedMotion freeze.

#### Wave 44

User rejected the wave-43 result: "still too simple and components of the
station aren't connected and looks nothing like the associated example."
Wave 43 delivered the merged-vertex-colour machinery but the sculpt failed
the visual reference in five ways: modules floated apart with air between
them; almost no connective tissue; bare smooth cylinder skins where the
reference is tiled with panel plates; too few and too small windows; a
radius-24 agri hoop enclosing a void; and too few vertical tiers.

NEW TOOLKIT PRIMITIVES (src/systems/station-detail.js):
- `panelSkin` — dense plate grid on a cylinder surface, the plating IS the
  perceived detail. Tiles rows x cols rectangular plates with visible seams,
  mottled colours from a caller-supplied hex array, deterministic per-seed
  jitter.
- `windowGrid` — rows x cols lit window fields, a grid of small boxes at
  caller-specified pitch.
- `airlock` — short fat connector tube with collar rings, the connective
  tissue that makes two modules read as one station.
- `bridge` — catwalk deck plus two railings between modules.

DESIGN RULE: packed pile plus connective tissue. Modules interpenetrate
(a drum spacing of 7 units for radius-4.5 drums, so neighbours overlap by
2). Every adjacency gets an airlock; every gap gets a bridge; every drum
gets a panelSkin of 40-70 plates and a windowGrid of 20-40 windows per
flank. The agri carousel shrinks to radius 11 and tucks under the belly at
y = -16, so it reads as part of the mass instead of a hoop around a void.

PALETTE RULE (weathering ladder): wave 43's paletteFromStyle pin required
every hull vertex colour to be EXACTLY one of the five FACTION_STYLE.freehold
colours, which was too tight for weathered reference art. The rule widens
to a fixed, recomputable product set: SHADES = [1.0, 0.86, 0.72, 0.6],
applied as Math.round(channel8bit * SHADES[i]) on each sRGB channel of
the deduplicated FACTION_STYLE.freehold palette. The allowed hull set is
therefore exactly the 5 palette colours crossed with the 4 shades (20
values). Both sculpt and harness pin MUST use identical arithmetic.

HARNESS CHANGES (scripts/boot-test.mjs):
- freeholdDetailDensity floor raised from >= 20000 to >= 120000 merged
  vertices.
- freeholdWindowDensity floor raised from >= 2000 to >= 30000 glow vertices.
- freeholdMergeDiscipline unchanged (<= 8 geometries and <= 8 materials).
- paletteFromStyle reimplemented against the shade ladder.
- new connectedness pin: buckets hull vertices into 4-unit cubes and fails
  when more than 2% of occupied cells are isolated (a packed pile passes;
  six drums with air between them does not).

#### Wave 45 — the remaining seven, and the module split

All seven remaining built factions were rebuilt in one wave: veridian, ferrous,
redledger, gilded, congregation, assembly, lamplighter. Two structural changes
came with them.

ONE MODULE PER SCULPT. `station.js` was already 2,760 lines carrying the dock
UI, the job board, the market and the economy; eight sculpts of 400-700 lines
each would have doubled it. Each faction's sculpt now lives in
`src/systems/stations/<faction>.js` and exports `{ ringY, build(b, ringB, st) }`
— no THREE import, no material, no Group, no knowledge of FACTION_STYLE beyond
the record handed to `build`. `station.js` owns `buildDetailStation` plus the
`DETAIL_STATIONS` dispatch table (which replaces `STATION_BUILDERS`), so every
shared invariant is asserted in ONE place: group name, the single spinning
ringGroup child, the six merged chunks, the three materials, the beacon at
`DETAIL_BEACON_Y = 31`. A missing channel throws with the faction and channel
named instead of failing inside the renderer. The weathering ladder moved to
`station-detail.js` as the exported `SHADES` + `weather(hex, i)`.

GENERALISED PINS. Every wave-38 per-primitive station pin (`veridianHexTori`,
`ferrousTurrets`, …) is gone: merged geometry cannot answer a
`TorusGeometry.radialSegments` census. The wave-38 section now loops the eight
factions and pins the SHARED contract — `mergedChunks` 3+3, `vertexColoured`,
`mergeDiscipline` <= 8 geometries and <= 8 materials, `detailDensity` >= 120,000
merged vertices, `windowDensity` >= 30,000 glow vertices, `envelope`. The
wave-43 detail section loops the same eight for `determinism`,
`paletteFromStyle` (each faction's own ladder), `glowNearWhite`,
`connectedness`, and `teardownDisposesAll` (each sculpt rebuilt into another
faction's system, so its own per-build assets are the ones audited).

NEW PIN — `seatedDetail`, the wave-45 lesson. Every numeric pin passed on the
first round and the sculpts still looked wrong in the browser: `windowGrid` is a
FLAT field, so a tall grid wrapped onto a round or faceted drum grazes the hull
at its centre and hangs off at its edges. Ferrous sprayed 10% of its 50,000 glow
vertices into open space; veridian grew blades of windows; redledger parked a
detached slab of amber windows beside the refinery. The pin buckets the hull
chunk into 2-unit cells and requires each glow/glaze vertex to find hull
material in its own cell or any of the 26 around it, at most 1% orphans
(freehold, the approved bar, measures 0.54%). The arithmetic a sculpt needs:
a faceted cylinder's flats sit at `r * cos(PI / seg)`, not `r`, and a field of
half-extent H must be sunk to `sqrt(rFlat^2 - H^2)`; on spheres and domes use
`portholeRing`, which is built from an explicit radial basis and cannot float.

#### Wave 46 — the placeholder loses its live sites

The user's verdict on the placeholder, seen in-game after the wave-45 tour:
"this one is BS". Fair — it was the pre-wave-43 sculpt (21 meshes, 2,407
vertices, 9 geometries, 7 materials, no vertex colours) and it served FIFTEEN
live systems: 12 independent (Drift, Sorrow, Ashfall, Tumble, Nowhere, Faint,
Wisp, Cinder, Stray, Husk, Gone, Ember, The Black Station) and 3 hollow (Hollow
Reach, The Hush, The Verge).

Both factions now have detail sculpts, so `DETAIL_STATIONS` carries 10 keys and
the placeholder has NO live site: it remains the fallback for an unknown faction
key only, and the harness pins it through a synthetic faction override rather
than a real system. Neither faction has reference art — `faction-style.js` says
so — so the designs come from the lore: independent is "the Anchorage", a dead
freighter's keel with mismatched hulls lashed along it, accretion, and a crane
cradle eating a stripped derelict; hollow is "the Vigil", a shuttered watch post
listening outward with lanterns marking its berths.

NEW IN THE CONTRACT — a per-SYSTEM seed. `build(b, ringB, st, seed)` takes a
fourth argument: `seedForSystem(systemId)`, FNV-1a over the id. A sculpt authored
for a whole faction would otherwise repeat itself 12 times across independent
space. The seed varies DRESSING only — which optional spurs exist, crate and pod
layout, which drums are lit, plate shade mixes, mast heights — never the tier
structure or any pinned number. Same id always yields the same seed, so the
determinism pin still holds. The eight reference-art factions ignore the
argument: their sculpts answer to concept art, not to variety.

NEW PIN — `singleMass`. `connectedness` counts hull cells with no 6-axis
neighbour, which a detached CLUSTER passes trivially because its members touch
each other. The wave-46 hollow bring-up hung its mooring spurs at y -16..-24
with nothing reaching them — a 12-cell island that read on screen as loose boxes
under the station — and `connectedness` waved it through. `singleMass` flood-fills
the 4-unit occupancy grid and requires the largest component to hold >= 97% of
cells. Calibrated on the approved sculpts, which read 99.5-100%.

NEW PIN — the per-system sweep. A per-faction representative is not enough
coverage once a sculpt varies by seed: the first independent build scaled its lamp
populations with the seed, and the ONE system that drew the low end —
`blackstation`, a generated hub with live traffic — landed at 25,692 glow
vertices against a 32,000 floor while all twelve others passed. The wave-46
section now sweeps EVERY live system of both seeded factions through the real
`initStation` path for density, glow, envelope, seating, packing and single mass,
and additionally proves the variation is real (one distinct hull signature per
system, not a seed that is read and ignored).

Phase 6 is COMPLETE for every station path in the game: 10 detail-sculpt
factions, beautiful grown by `buildBeautifulStation`, unknowables building no
station by decision D3, and the placeholder surviving as an untested-by-live-site
fallback that the harness exercises synthetically.

### Phase 7 - Ship detail pass (wave 47)

**Decision D6 (user, 2026-08-11): the Phase 6 station treatment, applied to
ships.** Every faction ship gets a merged vertex-coloured detail sculpt. The
PLAYER ship (`ship.js`) is out of scope and stays as it is. The goal is the
concept art: each faction's `docs/FactionExamples/NN-<faction>-ship.png`, read
against `overview-ships.jpg`, the same way the station sculpts were matched to
the station sheets.

#### What replaces what

`npc.js FACTION_VC_PARTS` — 8 factions x 6 classKeys of 7-14 boxes, authored as
tuple lists — is DELETED. In its place, `DETAIL_SHIPS` dispatches to ONE MODULE
PER FACTION under `src/systems/ships/<faction>.js`, ten keys: the eight
reference-art factions plus `independent` and `hollow` (wave 46 gave both a
station sculpt from the lore; their ships follow). `VC_PARTS` + `GLOW_Z` stay
exactly as they are and remain the fallback for an UNKNOWN faction key — a save
or a future generator can name a faction `npc.js` has never heard of. Under the
wave-42 ruling `beautiful` (organic.js) and `unknowables` (the no-hull field)
keep their own paths and are untouched.

#### The module contract

```js
// src/systems/ships/<faction>.js
export const <faction>Ship = {
  freighter: { glowZ: 6.4, build(b, st) { … } },
  cutter:    { … }, heavy: { … }, frigate: { … }, ace: { … }, light: { … },
};
```

All six classKeys are REQUIRED. A module imports ONLY `../station-detail.js` —
no THREE, no material, no Group, no `FACTION_STYLE` lookup. `st` is the style
record handed in by `npc.js`, and it is the ONLY source of colour.

- **Nose along -Z, stern at +Z** (the `ship.js` convention). `glowZ` is the
  stern point where `npc.js` parks the engine-glow sphere.
- **No seed argument.** A station sculpt varies per system because one station
  serves one system; a ship geometry is CACHED per `faction:classKey` and shared
  by every spawn of that key, so per-ship variety would mean per-ship geometry.
  One bake per key, forever. Use fixed literal seeds with the toolkit's `rng`.
- **Geometry NEVER branches on a colour.** The pirate bake calls the same
  `build` with a dulled style record and its positions must come out
  byte-identical, so nothing about the shape may read a value out of `st`.

#### Two channels, two materials

A sculpt emits into exactly two channels, and `npc.js buildShipMesh` mounts
three meshes wearing TWO materials — the wave-37 two-material cap holds:

| channel | material | rule |
|---|---|---|
| `hull` | the shared `vcMaterial` (`MeshStandardMaterial`, `vertexColors`) | colours come from `st` through the `SHADES`/`weather` ladder |
| `lights` | the per-faction `glowMatFor(faction)` (additive, `vertexColors`) | NEAR-NEUTRAL tints only: every sRGB channel >= 0.6 |

The lights material's colour is the faction's `glow` hue and it MULTIPLIES the
vertex colours, exactly like the station `lightMat`. A saturated tint in the
`lights` channel squares the hue, so lit parts are authored as warm or cool
WHITES (`0xfff2d8`, `0xe8f0ff`, `0xffffff`) and the faction reads through the
material. Ships have no `glaze` channel — a third material would break the cap.

Child order is fixed: `[0]` hull, `[1]` lights, `[2]` the engine-glow sphere,
which is ALWAYS the last child and always `userData.glow`. The core-is-glow
ruling stands: `userData.glow` must be a real mesh with a scale, because every
AI path dereferences it without a guard. Fallback (unknown-faction) ships keep
two children — hull and glow — and no lights chunk.

#### The pirate bake

`shipGeosFor(classKey, faction, pirate)` caches under
`'<faction>:<classKey>[:pirate]'`. The dulled entry runs the SAME `build`
against `dullStyleFor(faction)`, so:

- hull positions are byte-identical to the clean bake, hull colours are never
  brighter by luminance and strictly dimmer somewhere;
- lights positions AND colours are identical, because the `lights` channel
  carries authored near-whites and no `st` value at all — a pirate's running
  lights stay lit (the wave-38 rule, now exact rather than approximate).

#### Numeric pins (wave47 harness section)

Per faction x classKey, measured on the real `spawnLiveShip` path and on direct
double builds of the module:

| class | envelope max abs x / y / z | radius band | hull verts | lights verts | mass cell |
|---|---|---|---|---|---|
| light | 1.3 / 0.9 / 3.4 | 2.2 – 3.5 | 3,000 – 12,000 | >= 200 | 0.6 |
| cutter | 1.8 / 1.2 / 5.0 | 3.0 – 5.0 | 4,000 – 16,000 | >= 260 | 0.7 |
| ace | 2.2 / 1.3 / 5.8 | 4.4 – 5.8 | 4,000 – 16,000 | >= 260 | 0.7 |
| freighter | 2.8 / 2.0 / 7.4 | 4.4 – 7.2 | 6,000 – 24,000 | >= 400 | 0.9 |
| heavy | 3.6 / 2.4 / 8.8 | 6.0 – 9.0 | 7,000 – 28,000 | >= 460 | 1.0 |
| frigate | 9.0 / 6.0 / 26.0 | 21.0 – 32.0 | 15,000 – 60,000 | >= 900 | 2.0 |

**The table above is the ROUND 2 revision, and the reason is worth recording.**
Round 1 built all sixty sculpts inside a much wider envelope (frigate 18.0 /
9.5 / 26.0, light 2.4 / 2.4 / 3.8) and every numeric pin went green. Then the
first browser pass showed the truth: ten fleets of PLATED DRUMS. Height came out
equal to beam and length barely exceeded either, so a freehold frigate rendered
as a barrel with hoops and a flat disc for a face. The old ceilings could not
even EXPRESS the reference art — at 18.0 x by 26.0 z the widest legal frigate is
1.44 times longer than it is wide, and every ship on `overview-ships.jpg` is
4 to 6 times longer than its beam, with its height well under its beam. The
ceilings are now simultaneous maxima that only a long slender hull can satisfy;
a sculpt at maximum beam MUST also be near maximum length. Author beam at about
three quarters of the ceiling and spend the rest on Z.

- `proportion` — TWO pins, because "reads as a ship" is measurable and round 1
  proved that nothing else catches a drum:
  `spanZ >= 2.4 * spanX` (length dominates) and `spanY <= 0.75 * spanX` (the
  beam exceeds the height). Spans are max-minus-min per axis on the hull chunk.
- `lights` verts also stay <= 25% of the sculpt's hull verts: lit parts dress a
  hull, they are not the hull.
- `radiusBand` — the sculpt's radius, the MAXIMUM DISTANCE FROM THE LOCAL ORIGIN
  of any hull vertex, sits inside the absolute band in the table above.
  Encounter readability and combat distance are class properties, not faction
  ones: the envelope is the hard ceiling per axis and this is the overall one.

  It used to ALSO have to sit in [0.85, 1.45] x the radius of the `VC_PARTS`
  fallback bake. That second band is gone, and the reason is a lesson about
  derived pins. The absolute bands were themselves computed by hand from the
  fallback specs while writing this section — and the hand arithmetic was 15%
  wrong for `heavy` (estimated 7.0, actual 6.10). When the harness stopped
  trusting the literal and measured the real fallback bake, the derived band
  (1.45 x 6.10 = 8.85) came out TIGHTER than the authored ceiling (9.0), so two
  pins claimed one property and the derived one silently overruled the intent —
  it failed three heavies that the authored contract accepts. The authored
  number wins: it is stated in world units, it is what the reshape round was
  built against, and it does not float when an unrelated fallback spec changes.
  The harness still MEASURES the six fallback radii and prints them, because the
  bands were derived from them and whoever next edits the table should see the
  real values instead of recomputing them by hand.
- `sternGlow` — `glowZ > 0`, and against the sculpt's OWN stern reach (the
  largest positive z any hull vertex touches, not the class ceiling):
  `glowZ <= sternZ + 1.2` and `glowZ >= 0.55 * sternZ`.
- `paletteFromStyle` — every distinct hull colour lies on the faction's
  `SHADES` ladder over base `FACTION_STYLE` colours. Never weather an already
  weathered value.
- `singleMass` — the hull's largest flood-filled component holds >= 97% of
  occupied cells. **The occupancy grid is EDGE-SAMPLED at ship scale**: bucket
  each triangle's three edges at steps of half a cell, not the raw vertices. A
  4-unit box carries vertices only at its 8 corners, so a vertex-only grid at
  cell 0.9 reports a solid spine as a chain of islands. This is the one
  measurement that does not transfer from wave 46 unchanged.
- `seatedLights` — at most 2% of lights vertices fail to find hull material in
  their own 1.0-unit cell or any of the 26 around it. Lit parts SIT ON the hull.
- `determinism` — two direct builds of one module are byte-identical in both
  channels.

#### Per-faction design language

The eight reference-art factions answer to their own `-ship.png`. The wave-38
one-line reads stay the starting point, at ten times the part count:

- **freehold** — patchwork homestead: mismatched donated slabs, amber greenhouse
  dome, scaffold rails, towed pod.
- **veridian** — hex-modular survey: hexagonal prism spine, stacked hex modules,
  thin emerald assay and sensor fins.
- **ferrous** — monumental iron: blunt wedge prow, citadel command tower, formal
  paired barrel housings, crimson band, brass plate.
- **redledger** — captured and rebuilt: forward grappling claw booms, ram spike,
  tally stripes, asymmetric scarred pods.
- **gilded** — black-ceramic wedge, overlapping ivory and gold scale bands,
  swept gold stern fins, turquoise gallery strip.
- **congregation** — pilgrim hull: forward observation dome, silver rib rings,
  upright folded sails, amber keel shrine.
- **assembly** — recursive self-similar: identical modules on a charcoal spine,
  teal bow optic, antenna forest, daughter pods.
- **lamplighter** — guild tug: stern engine block, folded repair crane, cable
  reel, relay mast with lamp, hanging work platform.

The two lore factions have NO ship art, exactly as they had no station art:

- **independent** — the lash-up. No two plates from the same yard: donated hull
  sections bolted over a working frame, external cargo netted down, patch welds,
  a single amber lamp run. Grey value contrast comes from the weathering ladder,
  not from colour.
- **hollow** — the shrouded. A sealed, shuttered hull under wrap panels, long
  listening masts and dish ears standing clear of the mass, very few lights and
  those dim. `trim` is the dominant plate colour: the dark pair alone has no
  value contrast in a band-3 sun (the wave-46 hollow lesson).

#### Traps carried forward from waves 43-46

1. A `windowGrid` is a FLAT field. On a faceted cylinder the flats sit at
   `r * cos(PI / seg)`, and a field of half-extent H must be sunk to
   `sqrt(rFlat^2 - H^2)` or its edges hang in space (`seatedLights`).
2. `panelSkin` and `ribBands` WRAP A CYLINDER around the named axis. Calling
   them with a large radius on a flat deck builds a cage around the whole ship.
3. `CylinderGeometry`'s axis is +Y, so `rz: PI/2` lays it along X and
   `rx: PI/2` along Z. `TorusGeometry` lies in XY, so `rx: PI/2` puts the ring
   in XZ and `ry: PI/2` rings the X axis.
4. Every `b.push()` must be popped — `build()` throws on an unclosed frame, but
   only after the whole assembly has been authored in the wrong space.
5. Measure the FILE, never the report. Every wave-45/46 defect was found by
   running a measurement; none by reading a summary.
6. The harness cannot see a silhouette. The wave ends in the real game, two
   framings per faction, in Chrome.


## 4. Sequencing rationale

- **Asset-type phases, not faction phases.** Each asset type has exactly one
  dispatch seam (`buildShipMesh`, `buildStationMesh`, gate `buildAssembly`);
  landing all factions through one seam per phase avoids three files being
  churned ten times each.
- **Phase 1 first** because color alone gets ~70% of the visual match (the
  images are largely palette + lighting) and de-risks the D1/D2 color decisions
  before geometry is built on top of them.
- **Batches within Phases 2–4 ordered by flown-system count** (freehold 20 →
  lamplighter 1) so each increment maximizes in-game visibility.
- **Unknowables last/optional**: no generated system flies it, and its no-hull
  ship needed a new render path rather than the mesh kit. Built in wave 42
  once every flown faction was done.

## 5. Risk register

| Risk | Mitigation |
|---|---|
| D1/D2 color shifts break §18.2 lore or player recognition of established systems | Decisions recorded in Phase 0; authored-six screenshots compared before/after Phase 1 |
| Generator validation (`palette mismatch`) fails after color changes | Phase 1 step 6 regenerates data in the same commit |
| Disposal leaks from new per-faction station/gate builders | `userData.shared` convention + teardown audit in Phases 3/5 (10-jump leak test) |
| Per-frame allocation regressions from new animation | Zero-alloc `update()` contract checked per phase; part-level animation only (no per-vertex work — the organic.js ruling) |
| Unknowables no-hull ship is a render-path rabbit hole | Scoped to optional Batch C behind D3; built in wave 42 as an additive field (loops/arcs/cells) with no hull geometry and no new dependency |
