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
- Pirate-role variants reuse the same geometries with a scarred/dulled material
  set (the tarnished-Beautiful precedent).
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

### Phase 5 — Verification, polish, documentation

**STATUS: DONE (wave 39).** Phases 0–4 landed in waves 37–38; the last optional
piece, D3 (unknowables), landed in wave 42. The plan is closed.

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
