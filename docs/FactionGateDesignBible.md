# RIMWARD Faction Gate Design Bible

> **Status:** Art-direction handoff for the jump-gate rebuild. G0 charter.
> **Look:** `docs/FactionExamples/*-jump-gate.png` and `overview-jump-gates.jpg`.
> Those plates are visual-development references, not canon.
> **Lore:** `rimward-faction-lore-omp.md`. The Lamplighter Guild keeps the
> network. Banners occupy local rings. They do not own the lines.
> **Numbers:** `src/game/gate-scale.js` is the machine-readable half of this
> file. If this bible and that module disagree, this bible wins and the
> module is wrong.
> **Plan:** `docs/FactionGateRedesignPlan.md`. Owner accepted rulings
> R1–R10 on 2026-08-16.
> **Reject:** `src/systems/gate.js` torus, chevrons, and wave-38 overlays
> are not shape references. Do not polish them.

## 1. A gate is a job, not a mesh

Every live gate must do five jobs:

1. Show one readable **bore** — the largest empty shape.
2. Show one **approach axis** that faces world origin.
3. Show one **charge volume** with idle, aligned, and transit states.
4. Show **service grammar** where a machine is still visible: replaceable
   segments, access routes, lamps at human module scale.
5. Keep the current gameplay hooks: zone, charge, arrival, hub lantern,
   catalog builder.

Faction identity is mass and program, not hue. A tinted torus is a fail.

## 2. Scale charter

The Player ship is the yardstick. **P = 6.6** world units
(`src/game/ship-scale.js`).

```
player 6.6  ≪  gate bore ~30  ≪  station ~57  ≪  freighter ~78
```

A gate is a **lane**, not a drydock. A freighter must not fit the hole.

| Measure | Rule |
|---|---|
| Bore radius | 30 u (inner clear ≥ 24) |
| Zone | `JUMP.zone` = 60 |
| Arrival | `JUMP.arrivalOffset` = 50 toward origin |
| Outline-breaker | One element reach ≥ 9 u (15% of diameter 60). Grow reach, not hub thickness |
| Human modules | `HUMAN` from `ship-scale.js`. Lamps use `lampGap` 1.20, never `length / lampSize` |
| Merge | ≤ 6 geometries, ≤ 6 materials, plus tunnel `Points` and hub sprites |
| Density | Hull 40k–90k merged verts. Glow ≥ 8k |
| Lights | No `PointLight` on a gate assembly |

Do not grow the bore until zone and arrival change.

## 3. Shared grammar vs dress

**Share (the Guild contract)**

- Nested bore / shutter rings with depth. Not a flat energy sticker.
- An approach plane or dock mass.
- Night-readable lamps at `HUMAN.lampGap`.
- Charge tunnel and bore bloom keyed off the `charging` flag.
- Reduced-motion freeze.
- One Guild-neutral **hub lantern** extra that can sit on any body.

**Do not share**

- Outer outline.
- Attached program (plaza, bastions, barn, toll keep, salons, swarm, shrines, crane).
- Aperture fill.

Lamplighter is the naked tool. Other banners occupy it. Beautiful Ones
grow over it. Unknowables rewrite it in transit.

## 4. Accepted rulings

| ID | Ruling |
|---|---|
| R1 | Guild ownership is lore, not a copied brass torus. |
| R2 | Beautiful Ones keep a buried old ring. Life owns the silhouette. |
| R3 | Unknowables keep a ghost ring for idle read and zone origin. The field owns the far read. Charge is when the field takes the bore. |
| R4 | Congregation is a disc + well. A buried ring may exist only if the disc and shrine cones stay dominant. |
| R5 | Independent is secondhand Guild work. Hollow is shuttered Guild work. Neither copies Freehold. Neither stays a plain brass torus. |
| R6 | One Guild-neutral hub lantern. Do not rebuild ten hub meshes. |
| R7 | Bore stays ~30 u. Attachments may reach far. |
| R8 | Procedural Three.js, station D5 style. No Blender/GLB unless the Freehold pilot fails a look review. |
| R9 | Rename `lamplighter-gate` to `<faction>-gate` in the wave that lands the first new body. |
| R10 | Retire wave-38 overlay census pins when G1 lands. |

## 5. Faction briefs

Build a new body from the plate. Do not clad the current torus.

| Key | Far-read outline | Program | Aperture |
|---|---|---|---|
| `veridian` | Thick hex prism on a claim plaza | Assay blocks, beacon pylons, survey lanes | Emerald-white filled tunnel |
| `ferrous` | Heavy circle + four cardinal bastions | Parade docks, crimson masts, blast shutters that do not close the bore | Ice-blue swirl |
| `freehold` | Fat patched circle grown into a village | Greenhouse, barn, tanks, occupied apron | Open bore, white-blue rim |
| `redledger` | Asymmetric tally-slab circle | Right-side toll keep, crates, boarding arm, beacon cage | Dirty amber sun |
| `gilded` | Standing oval / egg, scale skin | Ivory inspection salons, gold causeways | Pale turquoise lens |
| `beautiful` | Petal / manta body; machine ring buried | Bone, membrane, gardens, clutch ships | Soft violet-blue tunnel |
| `unknowables` | Field: orbits, orbs, star core | Ghost industrial ring only | White-gold flare, no tunnel wall |
| `assembly` | Fat wheel on a factory plaza | Recursive modules, orange copy-errors, probe swarm | Opaque teal disc |
| `congregation` | Disc city with a central well | Shrine cones, nave towers, refuge docks | Dark well, violet-blue lip |
| `lamplighter` | Standing work torus + crane + depot | Gantries, yellow panels, lamp crown, tugs | Deep blue-white service throat |
| `independent` | Secondhand Guild work (no plate) | Lash-up modules, warm nav lamps | Dim work throat |
| `hollow` | Shuttered Guild work (no plate) | Dark watch, few lamps | Almost empty, cold rim |

Collision locks:

- Ferrous vs Red Ledger: both circles. Ferrous is four-point formal.
  Ledger is a right keep plus red slabs plus an amber sun.
- Assembly vs Lamplighter: both industrial wheels. Assembly is plaza plus
  swarm plus teal. Lamplighter is yellow-black plus crane plus depot.
- Beautiful Ones vs Congregation: Beautiful Ones are living horizontal
  petals. Congregation is a hard disc city plus cones.

## 6. Construction

- One builder per faction under `src/systems/gates/<faction>.js`.
- Shared kit: `src/systems/gate-detail.js`. Shared numbers:
  `src/game/gate-scale.js`.
- Merge channels: `hull` (vertex colour), `glow` (near-white verts; the
  material multiplies faction hue), optional `glaze`.
- Seeded RNG only. No `Math.random()` on a new sculpt path.
- `gate.js` owns zone, rebuild, dispose, charge, catalog, and hub
  gameplay. Faction files do not own those jobs.
- Catalog `buildGateModel` must call the same builder as live gates.

## 7. Look beats pins

Green numbers are not done. The owner must name the faction from a
grayscale face-on and a quarter view against the plate. If a pin fights
the brief, move other geometry or change the budget. Do not shrink the
outline-breaker.

## 8. Wave order

G0 kit (this bible + scale + detail). Then one faction per wave, census
order: Freehold, Veridian, Ferrous, Independent, Red Ledger, Gilded,
Beautiful Ones, Congregation, Hollow, Assembly, Lamplighter,
Unknowables. Closeout deletes the overlay path.

Do not start G1 until G0 is probed. Do not start G2 until G1 wins a
look review against `docs/FactionExamples/03-freehold-compact-jump-gate.png`.
