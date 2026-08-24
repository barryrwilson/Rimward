# Beautiful Ones foundation — class-author cheat sheet (wave 106)

Four body plans, one tissue lineage. Do not reuse manta / flipper / membrane
lofts. Class files own stations and seating. This package owns primitives.

## Class mapping

| Class     | Body plan | Read |
|-----------|-----------|------|
| light     | SHARK     | young reef shark |
| ace       | SQUID     | hunting squid |
| cutter    | SHARK     | thresher or hammerhead — must not be a scaled light |
| heavy     | WHALE     | humpback: long pectorals, dense chest |
| frigate   | OCTOPUS   | travel pose: mantle toward -Z, arms trail toward +Z |
| freighter | WHALE     | blue-whale gardenback: extreme length, tiny pectorals, dorsal gardens |

Driver glow sits at `z = +l*0.47`. Taper the stern so the glow reads as wake.

## surface.py — queries and body sweep

Keep these. Never seat organs with a typed y fraction of the ship.

- `fair(z, half_w, half_h, y_offset, k=0.49)` → station tuple
- `section(stations, z)` → `(half_w, half_h, y_offset, chamfer)`
- `flank_x(stations, z, y)` → 0.0 off-section (self-trim)
- `top_y(stations, z, x=0)` / `bottom_y(stations, z, x=0)`
- `flat_half(stations, z)` / `straight_top` / `straight_bottom`
- `flank_anchor(stations, z, y, inset)` → 0.0 when the sample is 0.0
- `surf_flank(stations, y, inset=0)` / `surf_top` / `surf_bottom` / `surf_flat`
- `span_ray(root, tip)` (alias `fin_ray`) → point at fraction t
- `grown_loft(parts, name, role, stations, mat, radial=16)` — true ellipse rings. Do not use `kit.hull_loft` for grown bodies.

Absolute living module (never scale by ship l/b/h): `FILAMENT_R`, `FILAMENT_LEN`, `FILAMENT_FAN`, `VEIN_R`, `VEIN_NODE_R`, `VEIN_PITCH`, `FLOW_R`, `VENT_R`, `HOLLOW`, `COMPANION_LEN`.

Fusiform helper lives in anatomy: `fusiform_stations(z_nose, z_stern, max_hw, max_hh, y_offset=0, peak_t=0.32, n=7)`.

## anatomy.py — primitives

Skip any element whose surf sample is 0.0. Roots inside the hull stay inside.

### Tissue (all four plans)

| Function | Args | Notes |
|----------|------|-------|
| `flow_line` | `parts, name, mat, path, thick=FLOW_R, detail=3, role=None` | strut chain; detail 0 keeps a chord |
| `vein_fan` | `parts, glow, name, hull_mat, glow_mat, root, tips, out, detail=3, nodes=True` | empty at detail 0 |
| `healed_scar` | `parts, name, mat, path, thick=0.08, detail=3, role=None` | empty at detail 0 |
| `nacre_pads` | `parts, name, mat, path, radii, detail=3, role=None, seed=1` | overlapping muscle ellipsoids, not plates |
| `grown_lip` | `parts, name, mat, loc, axis_u, axis_v, out, count=10, bead_r=0.14, seed=1, detail=3, role=None` | irregular oval beads; not a torus |
| `muscle_fold` | `parts, name, mat, z0, z1, surf, y, side=1, detail=3` | nacre gathering; no kit.box floors |

### Shark — light, cutter

| Function | Args | Notes |
|----------|------|-------|
| `shark_dorsal` | `parts, name, mat, root, tip, root_chord, thick=0.14, detail=3` | triangular, vertical |
| `shark_caudal` | `parts, name, mat, peduncle, upper_tip, lower_tip, root_chord, thick=0.12, detail=3` | heterocercal; upper lobe longer |
| `shark_pectoral` | `parts, name, mat, root, tip, root_chord, tip_chord=0.16, thick=0.12, detail=3` | triangular; root buried in flank |
| `gill_slits` | `parts, name, mat, z0, z1, surf, y, side=1, count=5, height=0.38, detail=3` | grown lips + recess wells |

### Squid — ace

| Function | Args | Notes |
|----------|------|-------|
| `squid_mantle_fins` | `parts, name, mat, loc, span=1.8, chord=1.2, thick=0.14, detail=3` | rhomboid pair at rear of mantle |
| `squid_arm` | `parts, name, mat, root, tip, root_r=0.16, tip_r=0.07, suckers=True, inward=None, detail=3` | circular tube |
| `feeding_tentacle` | `parts, name, mat, root, tip, root_r=0.12, club_r=0.20, suckers=True, inward=None, detail=3` | longer, clubbed tip |
| `sucker_pads` | `parts, name, mat, path, inward, radius=0.08, detail=3` | overlapping spheres |
| `siphon` | `parts, name, mat, loc, length=0.70, radius=0.16, aim=(0,-0.2,1), detail=3` | buried loc |

### Octopus — frigate

Travel pose is mandatory: mantle toward -Z, arms trail toward +Z.

| Function | Args | Notes |
|----------|------|-------|
| `travel_arm_tips` | `hub, length, count=8, spread=0.40, drop=0.22` | returns 8 trailing tips |
| `octopus_arm` | `parts, name, mat, root, tip, root_r=0.22, tip_r=0.08, suckers=True, inward=None, web_to=None, web_frac=0.28, detail=3` | thick tube; optional ribbon to neighbour |
| `interbrachial_web` | `parts, name, mat, hub, arm_tips, thick=0.12, trail=0.30, detail=3` | trailing skirt, not a radial disc |

### Whale — heavy, freighter

| Function | Args | Notes |
|----------|------|-------|
| `whale_fluke` | `parts, name, mat, peduncle, span, chord, thick=0.16, detail=3` | HORIZONTAL lobes |
| `whale_pectoral` | `parts, name, mat, root, tip, root_chord, tip_chord=0.22, thick=0.14, style='humpback'\|'blue', detail=3` | humpback long; blue short |
| `dorsal_ridge` | `parts, name, mat, z0, z1, surf, x=0, height=0.22, detail=3` | soft overlapping pads, not a shark triangle |
| `blowhole` | `parts, glow, name, hull_mat, glow_mat, loc, radius=0.28, detail=3, seed=1` | irregular grown lip |

## organs.py — shared biology

| Function | Args | Notes |
|----------|------|-------|
| `sensory_crown` | `parts, glow, name, hull_mat, glow_mat, loc, forward=(0,0,-1), fan=FILAMENT_FAN, count=8, detail=3, seed=1, arc=None` | empty at detail 0 |
| `breathing_vents` | `parts, glow, name, hull_mat, glow_mat, loc, step, count, face, detail, radius, points` | grown lips, not tori; prefer `points` |
| `belly_chamber` | `parts, glow, name, hull_mat, glow_mat, loc, size, detail=3` | open cradle; no teeth |
| `sanctuary_hollow` | `parts, glow, name, hull_mat, glow_mat, loc, size=None, face='x', detail=3, seed=1` | ellipsoid well + grown lip; no kit.box |
| `nursery_hollow` | same + `occupants=1, seed=None` | companions pierce the mouth plane |
| `companion_craft` | `parts, glow, name, hull_mat, glow_mat, loc, length=None, detail=3` | fusiform young body, not a mini-manta |
| `garden_fold` | `parts, glow, name, hull_mat, glow_mat, z0, z1, surf, x=0, detail=3, seed=1` | skip surf 0.0 |
| `dorsal_mantles` | `parts, name, mat, loc, size, count=3, seed=1, detail=3` | overlapping muscle ellipsoids |

## Paint dual rule

Role tag AND name selector must agree.

- hull indigo — `kit.ROLE_HULL`
- armour pearl — `kit.ROLE_ARMOUR`, names `living-…` / `fin-…` / `living-lip-…`
- accent violet nerve — `kit.ROLE_ACCENT`, names `nerve-…` / `sensory-crown-…`
- trim bright pearl — `kit.ROLE_TRIM`
- recess dark — `kit.ROLE_RECESS`
- glow cyan — `'glow'` on the glow list

## Detail ladder

- 3 full
- 2 fewer repeats
- 1 primary + hints
- 0 primary masses only

## Break window

Old class files still import removed names (`fin_membrane`, `fold_crease`,
`fleshy_sweep`, `swept_span`, …). That is expected until class workers
rewrite those files. Do not restore the old flipper API.
