# Faction Jump Gate Redesign — staged plan

> **Status:** Charter accepted 2026-08-16 (R1–R10). G0–G13 landed:
> every faction has a new body under `src/systems/gates/`. G13 code
> closeout deleted leftover torus/overlay chassis in `gate.js`.
> **Authority for look:** `docs/FactionExamples/*-jump-gate.png` and
> `docs/FactionExamples/overview-jump-gates.jpg`, plus `PROMPTS.md`.
> Those plates are visual-development references, not canon
> (`docs/FactionExamples/README.md`). This plan treats them as the style
> target and **does not** treat `src/systems/gate.js` meshes as a starting
> sculpt.
> **Authority for lore:** `rimward-faction-lore-omp.md` (Lamplighter Guild
> / Gatewrights). The Guild keeps the network. Banners occupy local rings.
> **Authority for process:** station D5 (`docs/FactionVisualUpdatePlan.md`)
> and `docs/ShipAssetPipeline.md` — foundation first, one faction per
> wave, owner look beats numeric pins.

Owner instruction: ignore the existing gate models.

---

## 0. Why the current gates fail

Phase 4 (`docs/FactionVisualUpdatePlan.md` §Phase 4, waves 37–39 / 42)
kept one Lamplighter brass torus (`RING_RADIUS = 30`, tube 2.2, eight
chevrons) and then:

- tinted glow / beacon / tunnel from `FACTION_STYLE`
- bolted a `${faction}-overlay` of 6–16 shared boxes
- grew Beautiful overgrowth and Unknowables hairline lenses on the same
  chassis

That is a sticker on a doughnut. The example plates are **faction
architecture**. Hex plaza, fortress cross, village ring, oval salon,
petal manta, energy field, factory wheel, shrine disc, and lamp yard do
not share one outer outline.

Keep the occupancy lore. Drop the shared torus as the design.

---

## 1. Design thesis

**A gate is a job, not a mesh.**

Shared Guild contract (every live gate):

1. One readable **bore** (the largest empty shape).
2. One **approach axis** that faces world origin (`lookAt(0,0,0)`).
3. One **charge volume** (idle / aligned / transit).
4. **Service grammar** where the plates still show a machine: replaceable
   segments, access routes, lamps at human module scale.
5. Same gameplay hooks: zone 60, charge 2.5 s, arrival 50 u toward
   origin, hub KeyG lantern, catalog `buildGateModel`.

Faction identity is **massing and program**, not hue:

| Key | Far-read outline | Attached program | Aperture |
|---|---|---|---|
| `veridian` | Thick **hex** prism on a claim plaza | Assay blocks, beacon pylons, survey lanes | Emerald-white **filled tunnel** |
| `ferrous` | Heavy **circle** + four cardinal bastions | Parade docks, crimson masts, blast shutters | Ice-blue swirl disc |
| `freehold` | Fat **patched circle** grown into a village | Greenhouse, barn, tanks, occupied apron | Open bore, white-blue rim |
| `redledger` | **Asymmetric** tally-slab circle | Right-side toll keep, crates, boarding arm, beacon cage | Dirty amber sun |
| `gilded` | Standing **oval / egg**, scale skin | Ivory inspection salons, gold causeways | Pale turquoise lens |
| `beautiful` | **Petal / manta** body; machine ring buried | Bone, membrane, gardens, clutch ships | Soft violet-blue tunnel |
| `unknowables` | **Field**: orbits + orbs + star core | Ghost industrial ring only | White-gold flare, no tunnel wall |
| `assembly` | Fat **wheel** on a factory plaza | Recursive modules, orange copy-errors, probe swarm | Opaque teal disc |
| `congregation` | **Disc city** with a central well | Shrine cones, nave towers, refuge docks | Dark well, violet-blue lip |
| `lamplighter` | Standing **work torus** + crane + depot | Gantries, yellow panels, lamp crown, tugs | Deep blue-white service throat |
| `independent` | Secondhand Guild work (no plate) | Lash-up modules, warm nav lamps | Dim work throat |
| `hollow` | Shuttered Guild work (no plate) | Dark watch, few lamps | Almost empty, cold rim |

Do **not** force a circular torus onto Veridian, Gilded, Beautiful,
Congregation, or Unknowables.

---

## 2. Recommended rulings (owner can override)

These close the open questions from the lore/engine pass. The owner
accepted R1–R10 on 2026-08-16. They are binding for G0 and later waves.

| ID | Ruling |
|---|---|
| **R1** | Guild ownership is **lore**, not a copied brass torus. The shared chassis is the job in §1. Visible Guild machine only where the plate still shows it. |
| **R2** | Beautiful keeps a **buried** old ring inside living mass. Do not delete the machine. Do not let the machine win the silhouette. |
| **R3** | Unknowables keep a **ghost** ring for idle read and zone origin. The field owns the far read. Charge is when the field takes the bore. |
| **R4** | Congregation is a **disc + well**, not a standing ring clone. A buried ring is allowed only if the disc and shrine cones stay dominant. |
| **R5** | Hollow = abandoned / barely kept Guild work. Independent = secondhand lash-up. Neither copies Freehold. Neither stays "plain brass torus." |
| **R6** | Hub lantern stays **one Guild-neutral extra** that can sit on any new body. Do not rebuild ten hub meshes. |
| **R7** | Bore envelope stays ~30 u inner clear (player **P** = 6.6). Attachments may reach far. Do not grow the hole until `JUMP.zone` / `arrivalOffset` change. A freighter (~78) must **not** fit. A gate is a lane, not a drydock. |
| **R8** | Stay **procedural Three.js**, station D5 style. One builder per faction. No Blender/GLB unless the Freehold pilot fails visual review. |
| **R9** | Rename live groups from `lamplighter-gate` to `<faction>-gate`. Update `scripts/boot-test.mjs` in the same wave that lands the first new body. |
| **R10** | Retire wave-38 overlay census pins (`boxes === 10`, "one TorusGeometry survives") when G1 lands. Those pins lock the failed sculpt. |

---

## 3. Shared grammar vs dress

**Keep on every gate that still shows a machine**

- Nested bore / shutter rings with **depth** (not a flat energy sticker)
- Approach plane or dock mass
- Night-readable lamps at `HUMAN.lampGap` (do not scale lamps with the ring)
- Charge tunnel + bore bloom keyed off `charging`
- Reduced-motion freeze

**Do not share**

- Outer outline (hex / fortress circle / village / oval / petals / field / disc / lamp yard)
- Attached mass (plaza, bastions, barn, toll keep, salons, swarm, shrines, crane)
- Aperture fill (emerald tunnel, ice swirl, open rim, amber haze, turquoise lens, star flare, teal well, sacred horizon, service throat)

**Lamplighter is the naked tool.** Other banners occupy it. Beautiful
grows over it. Unknowables rewrite it in transit.

**Anti-patterns (from plates + external research)**

- One torus + hue shift
- Tiny chevrons as identity
- Aperture smaller than the ship, or buried in greeble
- No approach corridor
- Flat energy disc with no tunnel depth
- Copying Mass Effect forks, Elite mailslots, EVE empire gates, B5 four-strut vortices, or Stargate chevron locks

---

## 4. Engine contracts the new art must still obey

Cited from the current runtime. New meshes change. These jobs do not.

1. One live assembly per `def.gates[i]`, plus one hub assembly when
   `def.hub.routes` is non-empty (`src/systems/gate.js` rebuild).
2. `rebuild()` on `systemLoaded`. Dispose per-build mats. Never dispose
   `userData.shared` caches.
3. Zone radius `JUMP.zone` = 60. Nearest assembly. Skip while jumping or
   docked. Dock press emits `jumpRequested`.
4. Live origin = `gateDef.position`. `group.lookAt(0,0,0)`.
5. Charge is a **flag**: `jumping && a.to === destination`. Tunnel
   visible only when charging and not `reducedMotion` (except Unknowables
   plasma, which stays visible under reducedMotion while charging).
6. Jump sequence is mesh-free (`src/game/jump.js`): 2.5 s charge, swap at
   0.5, arrival +50 toward origin, `lookAt(0,0,0)`, `systemLoaded`.
7. Catalog: `buildGateModel(faction, { hub, routes })` uses the **same**
   builders. Parked, not charging.
8. `update()` allocates nothing. No `PointLight` on assemblies.
9. `styleFor(faction)` still supplies palette. Metalness cap 0.35.
10. 10-jump leak pin stays: `|liveAfter10 − liveAfter1| ≤ 60`.

Full contract list lives in the research notes from this pass. Do not
re-pin overlay part counts.

---

## 5. Build method

Copy **stations**, not **ships**.

Ships needed Blender/GLB because each faction has six classes, LODs, and
a size ladder. A gate is **one structure per faction** plus live FX
(spin, beacon, charge, 200-point tunnel, hub lamps). A GLB still needs
all of that in `gate.js`.

**G0 kit (shared functions, not a shared mesh)**

- `src/systems/gate-detail.js` — seeded RNG, frame stack, primitives,
  merge channels (`hull` vertex-colour, `glow` near-white verts,
  optional `glaze`).
- `src/game/gate-scale.js` — bore, outline-breaker, merge budget,
  density, lamp gap.
- Named hooks: idle spin, beacon, bore bloom, tunnel, hub lantern,
  reduced-motion freeze.
- Dispatch in `gate.js`. Faction files do not own zone or jump.

**Per-faction builder**

- `src/systems/gates/<faction>.js` exports `{ build(b, st) }`.
- Author a **new** body. Do not wrap `TorusGeometry(30, 2.2)`.
- One outline-breaker with reach ≥ 15% of diameter 60 (≥ 9 u). Grow
  **reach**, not hub thickness.

**Exceptions**

- `beautiful` may keep / extend the organic path.
- `unknowables` needs a field path (additive filaments, orbs, ghost mesh).
- `assembly` needs instanced probes.

---

## 6. Staged waves

Order follows **generated-system census**, not `FACTION_REBUILD_ORDER`
(that list is for ships). Independent and Hollow fly 16 systems with
plain brass today. Do not leave them last.

Guild grammar lives in G0. Full Lamplighter **yard** lands late so the
kit exists first.

| Wave | Name | Faction | Census | Stop / approve |
|---|---|---|---:|---|
| **G0** | Charter | — | — | Owner approves §2 rulings, bore, channels, "no overlay-on-torus" |
| **G1** | Pilot | `freehold` | 20 | Owner **looks** at Models Browser vs `03-freehold-compact-jump-gate.png`. Numbers are not enough |
| **G2** | Core A | `veridian` | 18 | Hex body, not hex cladding. Distinct from Freehold |
| **G3** | Core B | `ferrous` | 17 | Four-bastion cross. Shutters must not close the bore |
| **G4** | Gap | `independent` | 13 | Secondhand lash-up. Not a Freehold copy |
| **G5** | Mid | `redledger` | 12 | Asymmetric toll keep + tally slabs. Not a Ferrous clone |
| **G6** | Mid | `gilded` | 8 | Vertical oval + salons. New plan, not spheres on a torus |
| **G7** | Special | `beautiful` | 3 | Petals own the far read. Buried machine remains |
| **G8** | Low | `congregation` | 3 | Disc + well + shrine cones. Distinct from Beautiful |
| **G9** | Gap | `hollow` | 3 | Shuttered watch. Dim lamps. One mass |
| **G10** | Rare | `assembly` | 2 | Wheel + plaza + probe swarm at two scales |
| **G11** | Home | `lamplighter` | 1 | Full yard: crane, depot, lamp crown. Hub still works |
| **G12** | Field | `unknowables` | 0 | Ghost + field. Plasma only while charging. Catalog + synthetic spawn |
| **G13** | Closeout | — | — | Delete overlay switch and leftover torus. 12-faction screenshot matrix. 10-jump leak |

**Do not start G2 until G1 is approved by look.**
**Do not batch G2–G11.** One faction per wave.

### Per-wave deliverables

1. Short brief in the wave notes: construction logic + one
   outline-breaker, quoted from the plate and `PROMPTS.md`.
2. Builder file + dispatch hook.
3. Catalog still uses the live builder.
4. Boot-test pins: merge budget, bore clearance, charge FX, dispose,
   `reducedMotion`, group name `<faction>-gate`.
5. Models Browser stills: face-on and quarter. Grayscale thumbnail
   must name the faction.

### G0 also ships

- This plan stays the charter until a `docs/FactionGateDesignBible.md`
  exists (write the bible in G0, not before the owner accepts §2).
- `src/game/gate-scale.js`
- `src/systems/gate-detail.js` smoke-probed before any faction file
- Silhouette / island / measure helpers **or** equivalent boot-test
  sections
- Hub lantern as a kit extra, not a faction sculpt

---

## 7. QA analog (write into `gate-scale.js`)

| Check | Rule |
|---|---|
| Bore clearance | Inner clear radius ≥ 24. No hull vertex inside `bore − 1` except charge FX |
| Outline-breaker | One element reach ≥ 9 u (15% of diameter 60) |
| Silhouette | Pairwise occupancy IoU vs finished factions ≤ 0.65. Reviewer names the faction in grayscale |
| Merge | ≤ 6 merged meshes, ≤ 6 materials, plus tunnel `Points` and hub sprites. No `PointLight` |
| Density | Hull 40k–90k merged verts. Glow ≥ 8k so lamps read at zone 60 |
| Charge FX | Tunnel on only when charging (catalog off). Unknowables plasma only when charging |
| Connectedness | One 26-connected body. No floating scaffolds |
| Palette | Hull on `FACTION_STYLE` × weather ladder. Glow verts near-white (each sRGB ≥ 0.6) |
| Determinism | `rng(seed)` only. Fix the current tunnel `Math.random()` in G0 |
| Motion | Idle, beacon, tunnel freeze under `reducedMotion` |
| Leak | Existing 10-jump pin |
| Look | Green numbers are not done. Owner sees two framings |

Scale hierarchy to keep:

`player 6.6 ≪ gate bore ~30 ≪ station ~57 ≪ freighter ~78`

---

## 8. Per-faction 8–20 primitive recipes

Use these as the **minimum** readable kit. Density comes after the
outline is right.

- **veridian:** hex prism + 3–4 nested hex frames + plaza slab + 4–6
  pylons + 2 barge boxes. Emerald filled tunnel.
- **ferrous:** thick torus + 4 towers + 2 dock bars + 4 spikes + ice
  disc. Four-point symmetry only.
- **freehold:** fat mixed-box torus + greenhouse + tanks + barn + landing
  disc + masts. Open center.
- **redledger:** segmented torus + fat right keep + crate stack + left
  gun bar + bottom pier + amber disc + beacon lines.
- **gilded:** vertical oval torus + 2 salon boxes + glass racks + 2
  runway slabs + gold rim + turquoise disc.
- **beautiful:** 1 buried torus + 4–6 petal planes + 2–3 branch clusters
  + 2 pods + thin aperture disc. Rounded only.
- **unknowables:** 1 thin dark torus + 6–8 glow arcs + 8–12 spheres +
  central flare. No boxes, no cranes.
- **assembly:** thick torus + plaza disc + 4–8 clusters + teal disc +
  instanced cubes.
- **congregation:** large disc + well cylinder + 6–8 cones + 4–6 dock
  arms + thin well-rim torus.
- **lamplighter:** thick torus + crane boom + gantry box + 2–3 depot
  domes + lamp crown + tunnel disc.
- **independent:** thin work ring + mismatched boxes + one jury-rigged
  boom + sparse warm lamps.
- **hollow:** shuttered ring + dark keep + almost no traffic + 2–3 cold
  lamps.

Collision locks:

- Ferrous vs Red Ledger: both circles. Ferrous = four-point formal.
  Ledger = right keep + red slabs + amber sun.
- Assembly vs Lamplighter: both industrial wheels. Assembly = plaza +
  swarm + teal. Lamplighter = yellow-black + crane + depot.
- Beautiful vs Congregation: both "soft sacred." Beautiful = living
  horizontal petals. Congregation = hard disc city + cones.

---

## 9. What this pass did not do

- No code change to `src/systems/gate.js`.
- No `FactionGateDesignBible.md` yet (G0).
- No implementation of G1.
- CRM had no Rimward contacts. Open Knowledge had no Rimward gate
  notes. Project record `rimward-web-websim` is still on the ship
  rebuild (Wave 9 Unknowables / next Assembly).

---

## 10. Next action

1. G13 code closeout landed leftover torus/overlay deletion.
2. Owner reviews the 12-faction screenshot matrix vs plates.
3. Confirm the 10-jump leak pin still holds on the full boot test.
