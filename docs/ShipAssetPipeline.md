# Ship asset pipeline — the repeatable method

> **Authority:** `docs/FactionShipDesignBible.md` is the art direction and
> `src/game/ship-scale.js` is the machine-readable charter. This document is the
> PROCESS: the file layout, the commands, the gates with their thresholds, and
> the failure modes a new session will hit. `docs/FactionShipRebuildPlan.md` is a
> historical record of the retired procedural `src/systems/ships/` path and is
> not a guide for current work.
> **First proved end to end:** the Freehold Compact fleet, commit `b06a25f`
> (wave 5) — cutter first, then light, ace, heavy, frigate, freighter. Second
> run: the Red Ledger fleet (wave 6), which added §0's reading order, §4's
> reference-art rule, the size-convention table in §6, the two probes in §6 and
> the handoff in §8.
> **Fresh session: read §0 first, then §8 for the next faction's brief.**

## 0. Start here — the reading order for a fresh session

Do these in order before writing a line of geometry. Steps 2 and 3 are the ones
that were skipped in wave 6's first pass, and skipping them cost the whole fleet
a re-authoring round while every gate stayed green.

1. **This document**, all of it. §3 gates, §4 authoring rules, §6 failure modes
   and the size-convention table, §7 definition of done.
2. **`docs/FactionExamples/<n>-<faction>-ship.png`** and
   **`overview-ships.jpg`** — LOOK AT THEM. Write down, in the brief you hand to
   each class author, what the render establishes: the silhouette family, the
   surface treatment, where the accent colour goes and in what shape, what the
   emissive is and where it sits, and the one element that breaks the outline.
   The escorts in the frame are the `light` and `ace` briefs.
3. **`docs/SpaceShipIdeas/synthesis/21-rimward-gap-analysis.md`** §G6 (this
   faction's ONE construction logic and the signature to model) and §G2 (this
   faction's ONE outline-breaking element, >= 15 % of hull length), then
   **`20-cross-cutting-design-rules.md`** rules 1-8.
4. **`docs/FactionShipDesignBible.md`** §4.x for the faction and its six class
   lines. This is the LAST art input, not the first: the prose alone produces a
   plated tube that passes every pin.
5. **`src/game/ship-scale.js`** — `SHIP_SCALE` bands, `CLASS_ORDER`,
   `FACTION_REBUILD_ORDER` (which names the next faction), `HUMAN`.
6. **The finished reference fleets**: `scripts/ship_builders/freehold/` for the
   package idiom and `scripts/ship_builders/redledger/` for the four-module
   split (`surface.py` queries, `hardware.py` equipment, plus the faction's own
   surface-language and donor modules) and the `surf` callback pattern.

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

### Author from the reference art, not from the bible text alone

This wave's first pass read `docs/FactionShipDesignBible.md` §4.4 and nothing
else. It passed every numeric gate and was rejected on sight: six smooth
chamfered lozenges wearing oversized copper boxes. The inputs that were skipped
are the ones that decide what the fleet looks like, and they are cheap to read:

1. **`docs/FactionExamples/<n>-<faction>-ship.png`** — the faction's own render.
   The Red Ledger sheet establishes a long low FACETED PLATED WEDGE at roughly
   5:1, a quilt of small varied plates over the whole flank, dried-red VERTICAL
   PANELS, copper only as patina on mechanisms, dozens of tiny amber slits low
   on the flanks, and a thin skeletal boom slung under the bow. None of that is
   derivable from the bible prose. The escorts in the same frame are the `light`
   and `ace` briefs.
2. **`docs/FactionExamples/overview-ships.jpg`** — how the faction must differ
   from its neighbours at a glance.
3. **`docs/SpaceShipIdeas/synthesis/21-rimward-gap-analysis.md`** §G6 assigns
   each faction ONE construction logic and names the signature to model, and §G2
   assigns each faction ONE outline-breaking element of at least 15 % of hull
   length. For the Red Ledger those are "exposed frame, salvage: cut-and-welded
   seams, captured parts of OTHER FACTIONS bolted on" and "the salvage boom".
   The first pass had neither, which is why the family read as generic.
4. **`docs/SpaceShipIdeas/synthesis/20-cross-cutting-design-rules.md`** rule 6
   assigns ONE silhouette family held across all six classes, and rule 8 caps
   the accent at 3-8 % of area in ONE shape family.

Put these in the brief for every class author, quoted, with the specific reading
of the image. An author who has not seen the render will produce a plated tube,
and the gates will pass it.


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
| every seam bead reads as a copper frame twice the hull beam | full extents passed to `kit.box`, which takes HALF-extents | halve at the call site; see the size-convention table below |
| a ram or drive detaches from its own hull after a "fix" | HALF extents passed to `kit.chamfer_block`/`taper_block`/`wedge`, which take FULL extents | the kit is NOT uniform — check the table before editing any size |
| one drive's nozzle group measures wider than the hull | `kit.engine_bank` lays every nozzle in ONE row along X, so 6 nozzles at radius-derived spacing spans 12+ units | lay the group as a grid bounded by the housing face (`hw.captured_drive` now does) |
| a whole quilt or stripe run floats aft of a taper | the construct was given ONE surface figure for a run whose surface falls away | pass `surf` and let it re-sample per plate; a `surf` returning 0.0 self-trims the run |
| a run of sub-voxel parts each float separately | `kit.greeble_field`'s `sy` is the FIELD BOX height and each greeble is 5-15 % of it, so a 0.06 box emits 0.01-tall greebles below the 0.06 probe voxel | give the field box a real height and seat it `top_y - sy * 0.5` |
| a greeble field buried INSIDE the hull, still detached | seated on the run's MINIMUM deck height to be "safe", which sinks it below the surface at its own station | sample at the field's own station and shorten the run instead |
| a collar rib floats at a hull corner | ribs distributed by even ANGULAR sweep land on the chamfered corners, where the lofted hull has already fallen away | distribute ribs across the four FLAT faces, inside each face's straight span |

### The kit is not uniform about size, and nothing catches it

```
kit.box / kit.plate_grid / kit.panel_lines / kit.greeble_field   -> HALF-extents
kit.plate_course        -> axis figure is a FULL span, the two cross figures are HALF
kit.chamfer_block / kit.taper_block / kit.wedge                  -> FULL extents
kit.cyl / kit.torus / kit.strut                                  -> real radius / depth
```

No gate sees a size-convention error: spans, ratios, pivot, proxy and even the
island probe all stay green because an oversized part is still a part and a
halved one is still attached to something. Only the render shows it. This wave
lost a round in each direction.

### Two instruments this wave added, and both paid for themselves

`scripts/probe-ledger-parts.py` (Blender, ~3 s) builds every shared construct in
`hardware.py`, `salvage.py` and `donors.py` at all four detail levels and reports
object count, bounding box, triangle count, NaN or non-finite vertices,
degenerate zero-extent parts and illegal `skin_role` values. Run it BEFORE
dispatching class authors and after every shared-module edit: when the
foundation is provably clean, a class-level failure cannot be blamed on it. Note
it must call `bpy.context.view_layer.update()` before reading `matrix_world` —
kit builders assign `obj.location` without flushing the depsgraph, and reading
early reports every bmesh part as if it were stacked at the origin.

`scripts/probe-ship-extremes.py` (Blender) answers the two questions
`measure-ships` and `probe-ship-islands` cannot:

```
# which parts set the span on each axis, and what the span becomes without them
blender -b -P scripts/probe-ship-extremes.py -- redledger cutter lod0 --top=5
# which part is at a float's coordinates (undoes the centre_parts shift for you)
blender -b -P scripts/probe-ship-extremes.py -- redledger frigate lod0 --at=-0.15,-1.05,-9.75 --r=0.6
```

Before this existed, two rounds were spent narrowing hull stations while a
nozzle rail and a radiator were the real beam, and an agent spent two hours
reconstructing voxel coordinates by hand instead of editing the file. Name the
part first, then edit.

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
- The fleet opened in the Models Browser under real Chrome, at two framings per
  class. A close nose-on view of a citadel looks like a blob in ANY fleet; judge
  from broadside and quarter views, which is what the sheets show.

## 8. Order of work, and the next wave

`FACTION_REBUILD_ORDER` in `src/game/ship-scale.js` is the queue. Done on this
pipeline: `freehold` (wave 5, the reference package), `redledger` (wave 6).
`ferrous` predates it and still has only three pilot classes — finishing it is a
separate small wave, not the next faction. **Next is `gilded`, the Gilded Chain,
bible §4.5.**

### Wave 7 — the Gilded Chain, and what the render actually shows

`docs/FactionExamples/05-gilded-chain-ship.png`. Read it before the prose:

- An extremely long, LOW, sleek CRESCENT/LEAF hull with a needle prow — the
  silhouette family is `blade/crescent`, held across all six classes, and it is
  the longest-looking family in the fleet. Nothing steps, nothing is bolted on.
- **Overlapping scale courses** that follow the loft: each scale laps the one
  behind it, in long fair courses running fore-and-aft. This is NOT the Ledger's
  patchwork quilt of mismatched plates — it is one ordered shell, and
  `sv.plate_quilt`'s role mix and jitter are exactly wrong for it. The Chain
  needs its own lapped-course construct.
- **Ivory scale margins** on the forward flank and along the leading edges,
  against near-black ceramic scales dorsally — the tonal split is a large,
  deliberate two-tone, not per-plate variation.
- **Old-gold as hairline articulation only**: thin edge lines, ribs and collar
  rings. Bible §4.5 forbids gaudy gold coverage; treat gold as `ROLE_TRIM` on
  edges, never as a face.
- **Cold turquoise light from DEEP RECESSED galleries** on the ventral flank —
  the light is inside the hull, seen through long slots, not strips laid on the
  surface. "A cold illuminated gallery running deep inside rather than across the
  surface" is the bible's own wording for the heavy, and the render generalises
  it to the fleet. Emissive still caps at 5 % of hull area.
- Swept ventral pylons/fins and smooth tractor apertures break the outline;
  §G2's outline-breaker for this faction is the ventral pylon set, not a boom.
- **Threats are hairline seams.** Weapon and transfer apertures read as closed
  lines flush with the shell. The Ledger's `shutter_well` is the wrong shape —
  author a flush seam with an `open` parameter instead.

Construction logic, from §G6: **CLOSED SHELL, ORNAMENT** — "one continuous
curve; edge-only precious trim; long thin light lines". The Chain must refuse the
exposed frame, the mismatched plate, the visible mechanism and the dirt. It is
the opposite of the Red Ledger on every axis, so resist carrying the Ledger's
habits across; in particular, do NOT reuse `salvage.py` or `donors.py`.

### What to reuse, in this order

1. `scripts/ship_kit.py` unchanged, and the size-convention table in §6. Note
   `hull_loft`'s station tuple takes a per-station chamfer: a LARGE chamfer gives
   the Chain its smooth rounded section where the Ledger used `hard_section`.
2. `scripts/ship_builders/redledger/surface.py` as the shape of the answer for a
   new `gilded/surface.py`: the same nine queries (they are loft section math,
   not faction styling), a Chain human module, and whatever seating helpers the
   scale courses need. Never copy the Ledger's constants.
3. A `gilded/shell.py` for the faction's own surface language — lapped scale
   courses, ivory margin runs, gold edge lines, the recessed gallery slot, the
   hairline aperture seam — and a `gilded/hardware.py` for its equipment: tractor
   lenses, capture collars, sealed transfer chambers, observation rotunda.
4. `scripts/probe-ledger-parts.py` as the template for `probe-gilded-parts.py`.
   Point it at the new modules and RUN IT BEFORE dispatching class authors. It
   costs three seconds and it is the only thing that proves the foundation clean.
5. The `surf` callback pattern from `salvage.plate_quilt`: any course, margin or
   light slot that runs along a tapering hull must re-sample the surface per
   element, and skip where the callable returns 0.0.
6. `scripts/probe-ship-extremes.py` the moment a span or a float is wrong. Name
   the part before editing anything.

### Process rules that earned their place in wave 6

- **Foundation first, and prove it.** Author `surface.py` + the two language
  modules, smoke-probe them, and only then fan out one agent per class.
- **Agents author; the orchestrator verifies.** Every class brief says: no
  Blender, no node, no npm, no formatters, only `python -m py_compile`. Blender
  bakes serialise, so a mid-flight gate run just blocks siblings.
- **Forbid instrument archaeology in class briefs.** One wave-6 agent spent two
  hours reconstructing voxel coordinates and edited nothing. Diagnose centrally
  with the probes, hand the agent the NAMED part and the fix, and ban the rest.
- **Bake and probe one class at a time, immediately.** Connectivity defects are
  cheap to attribute now and expensive after five files land together.
- **A shared-module edit invalidates every class placement.** After changing a
  construct's geometry, re-bake the WHOLE faction and re-probe; wave 6 detached a
  ram and a drive by "fixing" sizes centrally without re-seating callers.
- **Small numeric adjustments stay inline.** A `rows`, `pitch` or one-line
  seating fix costs less to do than to describe.
