# Ship asset pipeline — the repeatable method

> **Authority:** `docs/FactionShipDesignBible.md` is the art direction and
> `src/game/ship-scale.js` is the machine-readable charter. This document is the
> PROCESS: the file layout, the commands, the gates with their thresholds, and
> the failure modes a new session will hit. `docs/FactionShipRebuildPlan.md` is a
> historical record of the retired procedural `src/systems/ships/` path and is
> not a guide for current work.
> **First proved end to end:** the Freehold Compact fleet, commit `b06a25f`
> (wave 5) — cutter first, then light, ace, heavy, frigate, freighter.

## 1. What builds a ship now

Geometry is authored in Python, baked by Blender, delivered as Meshopt GLB LODs,
and loaded at runtime. Nothing procedural runs in the browser any more.

```
scripts/ship_kit.py             primitive kit: box, cyl, sphere, torus, wedge,
                                taper_block, chamfer_block, hull_loft, strut,
                                plate_course, plate_grid, panel_lines,
                                greeble_field, window_row, engine_bank,
                                nozzle_ring, barbette, handrail, sensor_mast,
                                rescue_hatch, rng(seed)
scripts/ship_builders/<f>.py    per-faction hand-authored sculpts, or
scripts/ship_builders/<f>/      a package when the faction has many classes
scripts/ship_skins/<f>.py       palette + role weights (paint_parts_vc reads it)
scripts/build-ship-assets.py    the driver: CLASSES envelopes, PILOTS dispatch,
                                centre_parts, vertex-colour paint, merge, export
scripts/compress-ship-assets.mjs  Meshopt encode, in place, path-prefix scoped
scripts/encode-ship-textures.mjs  KTX2 atlas encode
src/systems/ship-assets.js      runtime load + derived collision proxy
```

`CLASSES` in the driver gives each class `(l, beam_ratio, height_ratio)`; the
builder receives `l`, `b = l*beam_ratio`, `h = l*height_ratio`. `PILOTS` maps a
faction to its hand-authored module; a class listed in that module's
`PILOT_CLASSES` uses it, every other class falls back to the generic
`BUILDERS[faction]` block-out. That is how a faction can be migrated one class at
a time without turning the fleet red.

### Faction module layout

A single file is fine for two or three classes (`ship_builders/ferrous.py`). Six
research-level classes do not fit in one file — Freehold is a package:

```
scripts/ship_builders/freehold/
  __init__.py     faction docstring, PILOT_CLASSES, build() dispatch
  surface.py      SHARED: hull-surface queries + the absolute human module
  cutter.py       one class, one body plan, one build_<class>() entry point
  light.py  ace.py  heavy.py  frigate.py  freighter.py
```

`surface.py` is the reason the package works. A faired loft's flank falls away
from the beam line and its deck rises along the sheer, so a fitting placed at a
typed coordinate floats. Every fitting is seated with a query instead:

```python
sf.fair(z, half_w, half_h, y_offset)   one station, rounded-octagon section
sf.section(stations, z)                interpolate (hw, hh, yo, chamfer)
sf.flank_x(stations, z, y)             half-beam at that station and height
sf.top_y(stations, z, x)               deck height at that station and offset
sf.bottom_y(stations, z, x)            keel height
sf.flat_half(stations, z)              flat deck half-width inboard of chamfer
sf.straight_top / straight_bottom      limits of the vertical part of the flank
```

The human module lives beside them as ABSOLUTE units (`PORT_LIGHT`,
`FLANK_PORT`, `ROOF_PANE`, `AIRLOCK`, `SUPPLY_LOCKER`, `FLOOD_LAMP`,
`MARKER_LAMP`, `STATUS_SLIT`, `PORT_SPACING`). They are never multiplied by
`l`, `b` or `h`. A bigger ship carries MORE windows, never a bigger window —
that is the whole scale cue, and scaling one is the fastest way to make a hull
look like a toy.

## 2. Commands, in order

```bash
# 1. bake (Windows path shown; one class or a comma list keeps it quick)
"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b \
  -P scripts/build-ship-assets.py -- freehold --class=heavy,frigate

# 2. compress the paths you rebuilt (prefix-scoped; never all 228 files)
node scripts/compress-ship-assets.mjs freehold/heavy freehold/frigate

# 3. gates
node scripts/measure-ships.mjs freehold            # span, ratios, pivot, proxy, ladder
node scripts/probe-ship-islands.mjs freehold heavy lod0   # one connected body
node scripts/validate-ship-assets.mjs              # whole fleet: caps + content
npm run test:boot                                  # BOOT TEST PASS

# 4. visual proof
node scripts/silhouette-sheet.mjs freehold   # out/silhouettes/freehold-{shape,scale}.png
node scripts/ship-render.mjs freehold        # out/silhouettes/freehold-render.png
```

A one-class bake is ~30 s for three LODs; the freighter's four LODs at full
density are ~10 min because the island probe voxelises 2.4 M cells. Budget for
that: it is the slowest step in the loop, not the bake.

Compression is NOT optional. `validate-ship-assets.mjs` asserts the
`EXT_meshopt_compression` marker, so an uncompressed rebuild fails validation
even when the geometry is perfect. `quantize: Skipping TEXCOORD_0; out of [0,1]
range` during compression is benign and pre-existing.

## 3. The gates, with numbers

`scripts/measure-ships.mjs` reads each LOD0 GLB's merged hull mesh:

| gate | rule |
|---|---|
| span band | max span inside `SHIP_SCALE[class].span` |
| length over beam | `spanZ/spanX >= 1.15` (freighter 1.05) |
| height over length | `spanY/spanZ <= 0.60` (freighter 0.62) |
| beam over length | `spanX/spanZ >= 0.16` |
| pivot | vertex centroid within ±0.15 of span per axis |
| proxy | derived elliptical capsule covers ≥ 80 % of hull vertices, fit ≤ +25/+25/+35 % |
| ladder | `light ≤ ace` (within 15 %) `< cutter < heavy < frigate < freighter`, per faction |

`scripts/validate-ship-assets.mjs` adds hard caps per LOD for the WHOLE ship:
lod0 60 000 triangles, lod1 24 000, lod2 8 000, lod3 4 000 (freighter only class
with lod3); ≤ 3 material slots, ≤ 3 draw calls, non-uniform hull `COLOR_0`,
TEXCOORD_0 inside [0, 1], engine glow present and at the stern.

`scripts/probe-ship-islands.mjs` voxelises at 0.06 and demands ONE 26-connected
component. This is the gate that catches bad authoring, and it reports each
floating group's cell count and bounding box — POST-CENTRING, because
`centre_parts` shifts every object before export. Read those boxes as the bug
report they are: full-beam paper-thin groups are seam strips or panel lines
placed at a typed `y`; tiny groups in pairs are window or lamp rows; one medium
group is a pod, panel or docked craft with no strut and no overlap.

`SHIP_SCALE[class].hull` is a vertex band that no harness enforces, and it is
still binding as an authoring aim — a heavy with fewer vertices than the cutter
it outranks is under-authored even though every gate is green. The Freehold pass
landed light 6 000, ace 4 720, cutter 10 988, heavy 14 340, frigate 18 236,
freighter 78 868.

## 4. Authoring rules the corpus imposes

From `docs/SpaceShipIdeas/synthesis/20-cross-cutting-design-rules.md` and
`21-rimward-gap-analysis.md`. These are what "authored from the research" means,
and they are checkable by eye on the silhouette sheet:

1. **Three zones** along the thrust axis with real seams, collars or trusses
   between them — bow 15–25 %, mid 45–60 %, stern 20–30 %. No plate course
   crosses a zone boundary.
2. **Detail in one band.** 55–80 % of the hull stays calm. Windows, catwalks,
   antennas and hangars go in the band; the calm hull gets 0–1 forms per 10 m.
3. **Emissive ≤ 5 %** of hull area: one drive glow, one window band, a few
   hazard and marker points. Never edge-light panels.
4. **Scale from repetition**, at constant human pitch — never from greeble
   density and never from a scaled window.
5. **One construction logic per faction**, and it refuses the others. Freehold is
   EXPOSED FRAME: open trusses between two solid volumes, mismatched plate
   colours, visible tanks and lines. The empty truss gap is the faction's
   thumbnail signature (§21 G2) and must stay genuinely empty.
6. **Function hardware reads as truth:** a countable nozzle group (2, 4, 6, 8 —
   never a vague glow), flat radiator panels that break the outline and carry no
   detail, docking collars at one fleet diameter, thin fragile masts.
7. **§21 G3:** every heavy, frigate and freighter shows radiators and a distinct
   drive face. **§21 G5:** the freighter nests a craft or container in an open
   bay; the frigate berths a small craft in a visible hangar.
8. **Traps:** uniform greeble, windows scaled with the hull, total symmetry (keep
   one deliberate functional asymmetry), glow everywhere, fins with no thermal
   story, a capital ship with nothing nested to give its size away.

Author the station list FIRST and read the extents off it. If the silhouette can
be described as "a tube with things on it", the class is not done — a motif
decorates a body, it cannot make one.

## 5. Orchestration recipe (what worked for six classes)

1. **Migrate the reference class alone.** One finished class (Freehold's cutter)
   is the idiom every later file copies. Do the package split and prove it is a
   no-op: rebuild, compress, measure, confirm identical numbers.
2. **Fan out one agent per class**, all in one batch, each owning ONE new file.
   Disjoint files mean no coordination. Each task states: envelope `l, b, h`, the
   bible line for that class, the body plan, the span target that keeps the
   ladder monotone, the LOD ladder, the surface-seating requirement, the
   connectivity requirement, and the vertex aim.
3. **Agents do not verify.** No Blender, no node, no formatters — only
   `python -m py_compile`. Blender bakes serialise anyway and a mid-flight gate
   run just blocks agents on each other.
4. **Wire and bake each file as it lands**, one class at a time. Then measure and
   probe islands immediately: connectivity defects are cheap to find now and
   expensive to attribute after five files land together.
5. **Fix-ups are dispatched, not hand-waved.** Feed the agent the actual probe
   output and the actual measure line. Every one of the three fix-up rounds in
   wave 5 was driven by pasted coordinates, and each found a distinct
   root cause.
6. **Small numeric adjustments stay inline.** Raising `plate_grid` cols and rows
   or slicing a tank rank at a LOD boundary is a one-line edit; dispatching for
   it costs more than doing it.
7. **Re-derive the docstring numbers from the pipeline** once green. A builder
   docstring that states an estimate the build no longer matches is worse than
   no number.

## 6. Failure modes observed, and the fix

| symptom | cause | fix |
|---|---|---|
| full-beam paper-thin floating group | `panel_lines` / seam collar placed at a typed `y` fraction of `h` | seat with `sf.top_y`/`sf.bottom_y` and protrude the strip through the surface polygon, or cut it into a solid block instead of the loft |
| pairs of tiny floating boxes | window or lamp rows placed off the surface; `sf.flank_x` returns 0 when asked for a `y` ABOVE the loft (e.g. a cabin block's own height) | use the separated volume's own local anchor (`block_hw - size*0.5 + lap`), not a hull query |
| one medium floating group | pod, armour panel or docked craft whose centre sits exactly at `flank_x + thickness` — entirely outboard | move the centre inboard by half the thickness minus a lap, or add struts whose ends sit inside both bodies |
| floating group at a barrel or drum end | seam ring offset PAST the end face | pull the offset inboard of the end face |
| greeble field at the edge of its box floats | field box longer in `z` than the surface it rides, so the outermost boxes overrun the taper | shrink the field box, and add a second field further aft to restore coverage |
| lod2 over its triangle cap | detail 1 carries full-count repeated hardware (spokes, tank rank, spheres) | count down with detail: `n = 8 if detail >= 2 else 4`, slice the rank |
| class green on gates but under its hull band | density spent on primitives instead of surface language | add armour courses and human modules inside the existing band; never subdivide primitives |

## 7. Definition of done for a faction wave

- Every class has a hand-authored module in `PILOT_CLASSES`.
- `measure-ships <faction>` → ALL PASS, ladder monotone, each class inside its
  `SHIP_SCALE[class].hull` vertex band.
- `probe-ship-islands <faction> <class> lod0` → ONE CONNECTED BODY, all classes.
- `validate-ship-assets` → PASS for the whole fleet.
- `npm run test:boot` → BOOT TEST PASS with `<faction>Span/Proportion/Pivot/
  ProxyCover/ClassOrdering` all true.
- Silhouette and render sheets regenerated and actually looked at: six different
  anatomies, one family, size ladder legible.
- Builder docstrings carry the MEASURED numbers and the commands that produced
  them.
- Commit named for the wave, with the measured table in the body.
