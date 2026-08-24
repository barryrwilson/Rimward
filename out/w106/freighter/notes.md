# Beautiful Ones freighter — blue-whale gardenback (wave 106)

Rewrite of `scripts/ship_builders/beautiful/freighter.py`. The old manta /
whale-manta garden file is gone. This class is a COLOSSAL elongate blue
whale with dorsal garden ecology. It is not a humpback (heavy owns the
long pectorals). It is not a manta.

## Envelope

Driver: `l = 85.0`, `b = l*0.55 = 46.75`, `h = l*0.30 = 25.5`.
Authored largest dimension ~78 (spanZ, nose `l*-0.450` to tail `l*+0.462`).
Span band `[66.00, 109.20]`. Hull vertex aim `[34000, 154000]`.
`spanZ/spanX >= 1.05`. `spanY/spanZ <= 0.62`. `spanX/spanZ >= 0.16`.
Only class with lod3 (`detail=0`). Driver glow at `z = +l*0.47` is the wake.

## Body plan

| Part | Primitive | Read |
|------|-----------|------|
| elongate body | `sf.grown_loft` `body-main` | small head, long torso, long tail |
| pearl brow | `sf.grown_loft` `living-body-brow` | blunt-to-slightly-pointed head |
| indigo throat | `sf.grown_loft` `body-throat` | rorqual ventral swell |
| tiny pecs | `an.whale_pectoral` `style='blue'` | short, buried roots |
| huge fluke | `an.whale_fluke` | HORIZONTAL lobes, span 28 |
| soft ridge | `an.dorsal_ridge` | far-back pads, not a shark triangle |
| throat grooves | `an.muscle_fold` | nacre on ventral forward belly |
| blowhole | `an.blowhole` | nape, ahead of first garden |
| three gardens | `living-body-garden-*` + `org.garden_fold` | separated biomes, calm gaps |
| hollows | `org.nursery_hollow` / `org.sanctuary_hollow` | flanks, nested companions |
| transfer pouch | `org.belly_chamber` | great ventral cradle |
| crown | `org.sensory_crown` count 14 | ancient, through the brow |
| port scar | `an.healed_scar` | one deliberate mark |

Gardens sit ON the whale back. They do not replace the silhouette.
Breathing vents occupy the two calm gaps plus a sparse flank row.

## LOD

- 3 — full gardens, 7 hollows, nested + free companions, grooves, veins
- 2 — fewer hollows / occupants / vents / folds / veins; one grazer
- 1 — masses + garden_fold hint + two hollows + vents + crown + scar
- 0 — loft, fluke, blue pecs, three garden masses, ridge, throat, belly, one wake mote

Silhouette never trims. Ring density and repeats drop.

## Paint dual rule

Role tag AND name selector agree (`out/w106/foundation/notes.md`).

- hull indigo — `kit.ROLE_HULL` (`body-main`, `body-throat`)
- armour pearl — `kit.ROLE_ARMOUR`, `living-body-…` / `fin-…`
- accent violet nerve — `kit.ROLE_ACCENT`, `nerve-…` / `sensory-crown-…`
- trim bright pearl — `kit.ROLE_TRIM` (flow, scar)
- recess dark — `kit.ROLE_RECESS` (wells, vent bowls)
- glow cyan — `'glow'` on the glow list (wake, breath, vein cores)

No `kit.box`. No windows. No nozzles. No turrets.

## Silhouette checklist

- Blue whale: extreme length, tiny flippers, huge horizontal fluke, small head.
- Not humpback: pecs are short (`style='blue'`), not long wing-like paddles.
- Not manta: no great wings, no `fin_membrane`, no diamond planform.
- Not octopus / squid / shark: no `squid_mantle_fins`, no `shark_dorsal`.
- Thumbnail: a long carrier with gardens as back ecology.

## Seating

Organs use `sf.top_y` / `sf.bottom_y` / `sf.flank_x` / `sf.surf_*`.
Skip when a sample is 0.0. Roots stay inside the hull. Absolute living
module (`HOLLOW`, `COMPANION_LEN`, `FILAMENT_*`, `VENT_R`) is never
scaled by `l`/`b`/`h`.

## Fix note — islands + lod0 tri cap (re-dispatch)

Bake (voxel 0.06, post-centre) reported 10 FLOATING PART GROUPS in
port/starboard pairs, plus lod0 64152 tris (> 60000) and lod3
`Warning: No mesh data to join`.

Cause: `grown_loft` is a true ellipse. `sf.flank_x` / `sf.top_y` /
`sf.surf_flank` use the chamfered section, so flank fittings sat
outboard of the skin. Garden_fold used a proud surf above the back.
Throat `muscle_fold` pads used chamfer X at a near-pole Y, so they
hung as paper sheets (Y extent ~0.24) off the belly.

What changed in `scripts/ship_builders/beautiful/freighter.py` only:

- Local ellipse samplers `_ell_hw` / `_ell_top` / `_ell_bot` match the
  loft rings. All seating (folds, flow, veins, hollows, vents, pec
  roots, gardens, ridge) uses these plus an inset ≥ 0.18.
- Garden mounds: `bury=2.20` > `proud=1.15`, so the mass sits > 0.15
  into the loft. `org.garden_fold` surf is `ellipse top - 0.32`.
  `an.dorsal_ridge` uses `_surf_ell_top(..., drop=0.20)`, height 0.48.
- Throat: groove Y at `yo - hh*{0.72,0.52}` (off the pole).
  `muscle_fold` on `_surf_ell_flank` inset 0.28. Extra `nacre_pads`
  on the lower row with `ry=0.22` so Y extent > 0.06 and the pads
  pierce the belly.
- Flow lines `thick=0.08` on inboard ellipse paths. Veins inset 0.40.
- lod0 cut (~7%+): radial 24→20; garden stations 7→5; `detail=trim=2`
  for folds / vents / hollows / crown / veins / grazers at lod0;
  one fewer hollow; occupants capped at 1; crown 14→10; flow 10→7;
  vein tips 5→3; garden_fold 3 swells→2.
- detail=0 still emits loft, fluke, blue pecs, three garden masses,
  ridge, throat, belly, and **two** wake motes so glow join is not a
  single-object empty join.

## Fix note — six remaining FLOAT strips (re-dispatch 2)

Bake 2 (voxel 0.06, post-centre) still reported 6 FLOATING PART GROUPS
in port/starboard pairs. lod0 tris 39252 (under 60000). Prior 10
ridge/keel islands are gone.

```
FLOAT x[-5.40,-5.16] y[-2.82,-2.64] z[ -8.76, -7.68]
FLOAT x[ 5.16, 5.40] y[-2.82,-2.64] z[ -8.76, -7.68]
FLOAT x[-5.40,-5.16] y[-2.82,-2.64] z[-12.84,-11.70]
FLOAT x[ 5.16, 5.40] y[-2.82,-2.64] z[-12.84,-11.70]
FLOAT x[ 5.16, 5.40] y[-2.76,-2.64] z[-11.46,-10.38]
FLOAT x[-5.40,-5.16] y[-2.76,-2.64] z[-11.46,-10.38]
```

Cause: `an.muscle_fold` → `nacre_pads` with radii `(0.16, 0.10, 0.22)`
(Z stretched to ~0.55). Upper groove used a constant Y (`gyo - ghh*0.52`
≈ -2.21) and `_surf_ell_flank` inset 0.28 plus muscle_fold's own -0.10
(total 0.38). At max girth the pads sat fully inside the ellipse shell
(`t≈0.90`, no surface cut). Lower-row extra `nacre_pads` welded their
side. Upper-row beads at z ≈ -12.0, -10.7, -8.0 (three per side) stayed
as 0.24 × 0.18 × 1.1 paper strips at |x|≈5.3, y≈-2.7 after centre.

What changed in `scripts/ship_builders/beautiful/freighter.py` only:

- Removed `an.muscle_fold` for the throat. Those thin runs are not
  silhouette-critical once the nacre pads remain.
- New `_groove_path`: local Y `yo - hh*{0.50, 0.34}` (raised toward
  the hull from 0.72/0.52). X = ellipse half-beam minus
  `rx - 0.14` so each pad overlaps the loft by 0.14 outboard.
- Both rows, both sides: `an.nacre_pads` radii `(0.38, 0.22, 0.60)` —
  every axis > 0.06. Sampled overlap: 0.24 inboard / 0.14 outboard
  at the old FLOAT z.
- Blue-whale plan unchanged: `whale_fluke`, `whale_pectoral`
  `style='blue'`, `dorsal_ridge`, `garden_fold`, hollows. lod0 still
  uses `trim=2` and radial 20.

