# Faction Ship Rebuild — implementation plan

> **Authority:** `docs/FactionShipDesignBible.md` is the art direction. This
> document is the engineering plan that carries it into the runtime, and
> `src/game/ship-scale.js` is the machine-readable half of it. Where this
> document and the bible disagree, the bible wins and this document is wrong.

The wave-47 sculpts are rejected as shape references. This is a rebuild, not a
polish pass: every `src/systems/ships/<faction>.js` family is re-authored from
its faction brief, one faction per wave.

## 1. The measured yardstick

The Player ship is not part of the rebuild. `makeLivingHull()` in
`src/systems/ship.js` sculpts a `SphereGeometry(1, 64, 40)` into the manta hull;
measured at object scale 1 in the neutral pose:

| axis | span |
|---|---:|
| X (wingspan) | 6.60 |
| Y (height) | 0.70 |
| Z (length) | 4.20 |
| max radius | 3.30 |

The largest rest-pose dimension is the wingspan, so **P = 6.6 world units**.
The bible's illustrative column treats P as 24 m, which fixes the world scale at
**1 unit ≈ 3.64 m** — the conversion that makes `HUMAN` in
`src/game/ship-scale.js` a real human module rather than a decorative constant.

### The retired hierarchy

Wave 47 pinned `ace < cutter < freighter < heavy << frigate`, with the freighter
at 1.9 P and the frigate at 7.0 P. Bulk carriers came out smaller than gunships
and the frigate outweighed everything in ordinary traffic. The charter is now:

`ace ≈ light < cutter < heavy < frigate << freighter`

| class | P band | span (units) | authored target | old span | change |
|---|---|---:|---:|---:|---|
| `light` | 0.90–1.10 | 5.94–7.26 | 6.8 | 5.2 | +31% |
| `ace` | 0.90–1.15 | 5.94–7.59 | 7.2 | 10.0 | −28% |
| `cutter` | 1.45–1.80 | 9.57–11.88 | 11.0 | 8.7 | +27% |
| `heavy` | 2.20–2.80 | 14.52–18.48 | 17.0 | 16.4 | +4% |
| `frigate` | 4.00–5.50 | 26.40–36.30 | 32.0 | 46.4 | −31% |
| `freighter` | 10.0–14.0 | 66.00–92.40 | 78.0 | 12.4 | **+529%** |

The freighter is the whole point of the charter and the largest single change in
the wave. A station sculpt measures roughly 57 units across
(`src/systems/stations/*.js`, half-extents ~28), so a 78-unit freighter is
visibly longer than the station it moors against. That is the intended read —
bible §2, "Never fits inside a station; exterior berth only" — and station
scale is deliberately out of scope for this pass.

### Silhouette rules

`SHIP_PROPORTION` in `src/game/ship-scale.js` replaces wave 47's
`spanZ >= 2.4 * spanX` / `spanY <= 0.75 * spanX` pair. Those pins forbade shapes
the bible explicitly asks for: the Gilded Chain's low crescents, the Beautiful
Ones' manta plan, and any broad freighter. What survives is what the bible
actually states.

| rule | value | source |
|---|---|---|
| `spanZ / spanX` floor | 1.15 (freighter 1.05) | travel direction instantly legible |
| `spanY / spanZ` ceiling | 0.60 (freighter 0.62) | "mostly longer than it is tall" |
| `spanX / spanZ` floor | 0.16 | "not an undifferentiated box or barrel" |
| pivot offset ceiling | 0.15 of span per axis | root pivot at the stable centre of mass |

### Vertex budgets

Budgets scale with surface area, not linearly, and are bounded by GPU memory:
every faction × class × bake (trader and pirate) is a separately cached merged
geometry in `npc.js`, and the Models Browser can build all of them in one
session. A 100k-vertex freighter bake costs ~5 MB; 12 factions × 2 bakes puts
the freighter row alone near 120 MB, which is the ceiling this table respects.

| class | hull verts | lights floor | grid cell |
|---|---|---:|---:|
| `light` | 4,000–14,000 | 260 | 0.6 |
| `ace` | 4,000–15,000 | 260 | 0.6 |
| `cutter` | 6,000–22,000 | 400 | 0.8 |
| `heavy` | 9,000–34,000 | 600 | 1.1 |
| `frigate` | 16,000–60,000 | 1,100 | 1.8 |
| `freighter` | 34,000–100,000 | 2,400 | 3.2 |

The lights ceiling stays 25% of the hull count.

## 2. Runtime contract

Unchanged from wave 47 and non-negotiable — every sculpt inherits it:

- `export const <faction>Ship = { light, ace, cutter, heavy, frigate, freighter }`,
  each entry `{ glowZ: number, build(b, st) }`.
- `build` receives a `detailBuilder()` and a `FACTION_STYLE` record. It writes
  exactly two channels: `hull` (opaque, `MeshStandardMaterial`) and `lights`
  (additive, `MeshBasicMaterial`). No third channel.
- Geometry never reads a colour value to decide a position. The pirate bake
  calls the same `build` with a dulled palette and its positions must come out
  byte-identical.
- Hull colours come only from `st.hull / st.hullDark / st.trim / st.accent /
  st.patch[]` and their `weather(hex, 0..3)` shades.
- `lights` colours are authored NEAR-WHITE (every sRGB channel ≥ 0.6). The
  additive material supplies the faction hue and multiplies these.
- Nose −Z, stern +Z. `glowZ` sits on the sculpt's own stern reach.
- One connected mass: ≥ 97% of occupancy cells in a single flood-fill
  component, and ≤ 2% orphan lights.
- Deterministic: no unseeded `Math.random()`. `rng(seed)` only.

### Human module by construction

Sculpts import `HUMAN` from `src/game/ship-scale.js` for every window, door,
rail, ladder, lamp, docking collar and cargo container, instead of typing
literals. A family that needs a bigger window row adds windows; it never scales
one. This is how acceptance test 5 ("the smallest repeated doors/windows/rails
stay the same physical size across light, frigate and freighter") is met without
a pin that cannot see intent.

### Body plans first, motifs second

The bible forbids one faction hull uniformly scaled into six classes, and
requires the six to still read as relatives. Wave 49.1 tried to satisfy both
with a **motif library** alone: one `hexSpine` call per class, then the
faction's recurring detail hung off the resulting cylinder. It does not work,
and the reason is worth writing down because every remaining faction is about
to face it.

A motif decorates a body. It cannot make one. Six classes that all call the
same spine helper are one shape six times no matter how different the greeble
is, and the review verdict on that fleet was exactly that: *"the hulls are
still fundamentally plated tubes; the motifs hang detail on a cylinder, they do
not give the classes distinct body plans."* Raising vertex ceilings made it
worse — it bought more detail on the same shape.

So a faction file is now **three layers**, and the shape layer comes first:

0. **The shared sweep core** — `src/systems/ships/loft.js`. Faction-agnostic and
   the same for every wave: `sectionOutline`, `sectionAt`, `loftExtents`,
   `loftHull`, `loftPlating`, `loftRib`, plus the `tri`/`quad`/`emitMesh`
   plumbing. It sweeps a cross-section along Z through a list of STATIONS, each
   carrying its own half-width, half-height, vertical offset and chamfer. One
   station list is one body plan, and the same code produces a wide instrument
   head over a slim tail, a lifting body that forks, a flat blade, an anvil
   widest at the prow, twin keels under a citadel, or a blunt wedge. It was
   extracted from the wave-1 Veridian body in wave 2, when the second faction
   needed the same machinery; ten more waves would otherwise have copied it.
   `loftPlating` — plating that follows a taper, which `panelSkin` cannot — is
   the vertex engine, and that limitation is half of why wave 49.1's hulls were
   cylinders in the first place.
1. **A faction shape core** — `<faction>/body.js`. ONLY what is that faction's
   own construction language, on top of the sweep core. Veridian:
   `chamferBlock`, `openKeel`. Ferrous: `armourBlock`, `beltedHull`,
   `armourCourse`, `armouredSpine`.
2. **A motif library** — `<faction>/motifs.js`: the surface and equipment
   language. Veridian's serialized modules, instrument apertures, latches,
   vanes, drive sections and tug docks; Ferrous's citadel armour, wedge prow,
   weapon blocks, recognition bands, service honours, rescue locks, point
   defence, command steps, container blocks and drive battery.

**An author writes the station list first, reads the extents off it, and only
then decorates.** Family resemblance comes from the shared motifs and the
shared cross-section; class identity comes from where the mass is. If a
silhouette can be described as "a tube with things on it", the class is not
done.

One class per file. Anatomy is the unit of work, so it is the unit of the file
layout: `src/systems/ships/<faction>.js` becomes a barrel over
`src/systems/ships/<faction>/<class>.js`. The runtime contract is unchanged.

### Collision proxy

`NPC_BASE_RADIUS = 3.4` was a single sphere for every class. At the new scale a
78-unit freighter would be a 3.4-unit target, so bolts pass straight through it.
`SHIP_SCALE[class].proxy` is a **capsule**: sphere radius `r` swept along the
hull's local Z between `−halfLen` and `+halfLen`, following the primary mass
only. Thin antennae, tendrils, cranes, sails and field wakes sit outside it on
purpose.

### Out of scope

- **LODs.** Bible §6 asks for three LODs plus a freighter distance silhouette.
  That section is written for an exported-asset pipeline; this project generates
  geometry procedurally and shares one cached merged geometry per faction ×
  class × bake. Vertex budgets are the density control. An LOD system is an
  engine feature, not a ship model, and is not part of this rebuild.
- **Station and gate scale.** Untouched.
- **The Player ship.** Untouched. It is the anchor.

## 3. Waves

Each faction is one wave: author the six-ship family, add the faction to
`REBUILT_FACTIONS` in `src/game/ship-scale.js`, verify, commit. The harnesses
pin rebuilt factions against `SHIP_SCALE` and everything else against
`LEGACY_SHIP_SCALE`, so a wave in progress never turns the other fleets red.

| wave | faction | file | status |
|---:|---|---|---|
| 0 | — | `ship-scale.js`, harnesses, `combat.js`, catalog | **done** |
| 1 | Veridian Combine | `ships/veridian/` | **done** — rebuilt from silhouette in 49.2; the reference for §2 "Body plans first" |
| 2 | Ferrous Hegemony | `ships/ferrous/` | **done** — wave 49.3; introduced the shared `ships/loft.js` sweep core |
| 3 | Freehold Compact | `ships/freehold/` | **next** — retires the one-builder-six-sizes shortcut |
| 4 | Red Ledger | `ships/redledger.js` | |
| 5 | Gilded Chain | `ships/gilded.js` | |
| 6 | The Beautiful Ones | `ships/beautiful.js` (new) | organic; moves out of `npc.js`/`organic.js` |
| 7 | The Unknowables | `ships/unknowables.js` (new) | field; moves out of `npc.js` |
| 8 | The Assembly | `ships/assembly.js` | |
| 9 | Congregation of the Further Shore | `ships/congregation.js` | |
| 10 | Lamplighter Guild | `ships/lamplighter.js` | |
| 11 | Independent | `ships/independent.js` | non-Banner, bible §5.1 |
| 12 | Hollow Reach | `ships/hollow.js` | non-Banner, bible §5.2 |
| 13 | — | delete `LEGACY_SHIP_SCALE` + `REBUILT_FACTIONS` | closeout |

Waves 6 and 7 do not use `detailBuilder`. The Beautiful Ones are living tissue
(no nozzles, no manufactured windows, no bolted plates) and the Unknowables have
no hull at all, so they keep bespoke builders — but they move into
`src/systems/ships/` for symmetry, respect the same class span charter measured
on the stable field/body envelope, and are measured by the harness on their own
terms.

## 4. Per-wave acceptance

A faction family is done when all of these hold:

1. `node scripts/measure-ships.mjs <faction>` reports ALL PASS.
2. `node scripts/attach-audit.mjs <faction>` reports ALL PARTS ATTACHED.
3. `npm run test:boot` reports BOOT TEST PASS.
4. `node scripts/silhouette-sheet.mjs <faction>` — the six classes sort by
   class at thumbnail size, with no colour and no materials, in the SIDE column
   alone. Two classes that could swap side views are one class.
5. `node scripts/ship-render.mjs <faction>` — the construction logic reads:
   plate courses, frames, recesses, the emissive channel, and a tonal range
   wider than one value. The family reads as one faction from that logic.
6. The family is reviewed **in the render**, in the Models Browser, at side and
   top angles. When a report and the render disagree the render wins.
7. The freighter's exterior-only berthing story is visible in the sculpt —
   awkward service structures and multiple external docking points, not just
   size.
8. No flags, readable text, or borrowed franchise shapes.
9. The Models Browser renders all twelve entries (six classes × trader/pirate)
   without a build error, framed correctly at both ends of the size ladder.

### The authoring loop, and why it needs its own instruments

`measure-ships` and `attach-audit` import a faction's whole family through its
barrel, so while six classes are being authored in parallel one half-written
sibling blanks the report for the other five. `scripts/probe-class.mjs
<faction> <class>` imports ONE class module and reports the same numbers plus
the attachment verdict. It is a probe, not a gate.

It also catches three defect shapes the fleet harnesses cannot, all of which
shipped green in wave 49.1's first drafts:

- **A stray channel.** `box()` takes the channel SECOND and the colour THIRD.
  Called with the colour first, a sculpt silently opens a third channel named
  after a colour number and fills it with NaN-coloured geometry.
- **A NaN vertex colour**, from an options object passed where a hex belongs.
- **An exact 1×1×1 part.** THREE defaults every omitted dimension to 1, so a
  helper called without its `w`/`h`/`d` emits a unit cube instead of throwing.
  On the ace that was two one-unit emissive cubes on a seven-unit hull, and it
  rendered as a white slab across the nose while every pin stayed green.

`scripts/silhouette-sheet.mjs` and `scripts/ship-render.mjs` exist because the
in-game Models Browser needs WebGL and the headless Chromium available to an
agent has none. They project and scan-convert the merged geometry on the CPU
(`scripts/raster.mjs`), so shape review is automatable: a silhouette sheet in
three orthographic views plus a common-scale ladder, and a shaded three-quarter
print with the emissive channel composited. They are review prints, not game
frames, and their exposure is set for a white page.

### Why `attach-audit` exists and is not optional

`singleMass` floods an edge-sampled occupancy grid and joins cells by
**6-neighbour adjacency**. Its cell runs from 0.6 units on a light craft to 3.2
on a freighter, so two parts in neighbouring cells score as one connected mass
even with a visible gap between their surfaces. Wave 1 shipped six Veridian
sculpts at 100% single mass, and the first person to open the Models Browser saw
detached hull sections and floating greebles.

`scripts/attachment.mjs` asks the question per PART: does every part's bounding
box overlap another part's, and is the overlap graph connected? Box overlap is
**necessary but not sufficient** for contact, so the metric cannot prove a sculpt
is connected — only that a part is not. That is the useful direction: every
failure it reports is real, and it prints the offending part's box and the source
line that added it. `detailBuilder({ track: true })` records the boxes; the game
never pays for it.

The five defect shapes it found in wave 1, all of which passed every numeric pin,
are the ones to watch for in every later wave:

1. **A motif with no shank.** `surveyAperture` placed every part forward of its
   own frame origin, so a caller mounting it on a nose face got a tangent contact
   and the instrument floated. Any motif meant to be mounted INTO something needs
   geometry reaching back past its frame origin.
2. **A lamp run strung across a gap.** The ace's stern lamps ran between the two
   drive booms, through open space.
3. **A run that crosses the hull instead of following it.** The frigate's running
   lights went diagonally from one flank to the other; six of eight lamps floated.
4. **Absolute coordinates passed inside a pushed frame.** The freighter's refinery
   `pipeRun` passed `az: z - 1.2` inside a frame already carrying `z`, throwing
   four runs to `2z` — 40 units off the nose. Worse, removing them showed the hull
   was really 59.7 units and not 78: the floating parts had been measuring the
   ship's length. Check size again after fixing any attachment defect.
5. **A deck or rail hovering above what it belongs to.** The refinery walkway and
   the external gantry raft both sat clear of the drums beneath them. A walkway is
   a deck plate that overlaps its mount, plus a rail on the deck.

## 5. Models Browser — done

`src/game/model-catalog.js` enumerates ships from `FACTION_ORDER × CLASS_ORDER ×
{trader, pirate}`, so the rebuild needs no manifest edit for the existing twelve
factions. Two changes were required and are in:

- **The Player ship is now a catalog entry** (`ship:player`), built from
  `makeLivingHull` / `makeVeinTexture`, which `src/systems/ship.js` now exports
  for exactly this reason. It is the charter's yardstick, so the browser shows
  that geometry rather than a lookalike, and a reviewer can put it beside a
  frigate and a freighter (bible §6 deliverable 5, acceptance test 3).
- **Framing fits the bounding BOX from a side-biased angle.** A bounding-sphere
  fit down the length of a 78-unit hull filled a sixth of the viewport and could
  not be reviewed; the old `(0.75, 0.42, 1)` camera also looked straight down the
  ship's length. `measureModel` now returns the box extent and `frameModel`
  projects it onto the camera basis, solving for the tighter of the vertical and
  horizontal fits.

`node --import ./scripts/with-css-stub.mjs scripts/probe-models.mjs` builds all
221 catalog entries headlessly: 221 built, 0 failures.

## 6. Handoff

**Green:** `measure-ships` ALL PASS (whole fleet), `attach-audit` ALL PARTS
ATTACHED (Veridian and Ferrous; the eight unrebuilt built fleets still carry
wave-47 floaters and are only legacy-pinned), `test:boot` BOOT TEST PASS,
`probe-models` MODEL PROBE PASS.

### Wave 49.3 — the Ferrous Hegemony family

Six body plans, measured: picket, a solid stern-heavy wedge — a doorstop with a
flat bow strike face (6.9); honour interceptor, a dart with a pronounced
shoulder whose stern forks into twin drive nacelles on structural arms (7.2);
patrol launch, a stout tug with a U-notch cut into the bow for the boarding
lock and a flat working deck aft (11.5); bastion gunship, a hammerhead
ziggurat — deep wedge prow, hard step up into a shouldered citadel, narrow tail
(16.4); line escort, a long low hull with a three-step tower above and a
recessed hangar cavity below (28.0); fleet logistics carrier, an articulated
train — command tug, armoured spine of container ranks and fuel-tank pairs,
drive block (81.7).

What else landed, and what the next wave inherits:

- **`src/systems/ships/loft.js`** — the sweep core, extracted from
  `veridian/body.js` so wave 3 does not copy it a third time. Veridian's output
  is byte-identical across the extraction (same vertex counts, same spans).
- **`SHIP_SCALE` ceilings raised twice more**, both recorded in
  `src/game/ship-scale.js` with their reasons: `light` 14,000 → 18,000 and
  `heavy` 40,000 → 48,000. Both for the cutter's original reason — the number
  predates the surface the bible asks the class to carry, and an author asked to
  fit it deletes construction language instead of greeble.
- **The Models Browser Ships tab now runs in charter order** (`CLASS_ORDER` from
  `ship-scale.js`) instead of wave 47's `light, cutter, ace, freighter, heavy,
  frigate`, so the list reads as a size ladder. Faction × 12 entries: Veridian's
  trader bakes are indices 12, 14, 16, 18, 20, 22 and Ferrous's are 36, 38, 40,
  42, 44, 46.

### Write a motif-level smoke probe BEFORE the class files

The single highest-value thing this wave did was throw away three hours of
corrective work that never happened. Before dispatching class authors, build
every export of the new `<faction>/body.js` and `<faction>/motifs.js` into its
own `detailBuilder({ track: true })` and check five things per motif: channel
set is exactly `hull`/`lights`, no NaN or black vertex colour, no exact 1×1×1
part, `analyseAttachment` + `analyseContact` both 100%, and every hull hex
inside `allowedHull(faction)`. That one script found six real defects in the
foundation in a single run — a stray `[object Object]` channel in three motifs,
a missing `crate` import, floating approach lamps, a floating window brow, and a
NaN belt from `undefined + 0` on an omitted station `y`. Every one of them would
otherwise have shipped into six class files first and been diagnosed six times.

### The three defect shapes wave 2 added to the catalogue

1. **A partial style object.** The frigate called nine motifs with
   `{ hull: st.hull, trim: st.trim }` instead of `st`. Every other palette key
   came through `undefined`, baked to pure black, and tripped the palette pin —
   and silently deleted the faction's crimson and brass from those motifs.
   Motifs take the WHOLE `st`.
2. **An armour belt that buried the ship.** `beltedHull` first swept a complete
   second shell 0.12 proud over the middle 70% of the hull. Plate courses stand
   0.07–0.10 proud, so the belt swallowed every course, rib and tonal step: the
   picket and the gunship rendered as featureless black slabs while every pin
   stayed green. A belt is a girdle of strakes on the flank faces; anything that
   covers the hull is just a bigger hull.
3. **A range clip that dropped its own end bands.** `armourCourse` only
   interpolated a cut section when `from`/`to` did not coincide with a station,
   then collected interior stations with a strict inequality — so a course whose
   range landed on a station lost that band, and a full-hull course lost one at
   each end and could emit nothing at all on a short flank range. Always
   interpolate both ends; `sectionAt` returns the station itself when they
   coincide.

And one process rule, learned twice in one session: **an agent that hits a pin
it cannot explain will invent a cause and act on it.** One replaced four shared
motifs with private copies; another swapped the brass service honour for trim.
Both were chasing the same black pixel, whose real cause was a float passed as a
`weather()` index in a fifth motif. Diagnose centrally, fix at the source, and
broadcast the correction to every agent still running.

### Wave 49.2 — the Veridian body-plan rebuild

Wave 49.1 shipped six Veridian sculpts that passed every pin and were rejected
in review as plated tubes. 49.2 re-authored the family from silhouette. What
landed:

- `hexSpine` is **deleted**. No class builds a constant-section hull.
- `src/systems/ships/veridian.js` is a barrel over `src/systems/ships/veridian/`:
  `body.js` (the shape core), `motifs.js` (equipment and surface), and one file
  per class.
- Six body plans, measured: claim scout, a faceted instrument head on a thin
  spar with outrigger vanes (7.1); patent demonstrator, a smooth-section
  lifting body forking into twin drive booms (7.1); inspection launch, a flat
  wide blade with a bow impound ring and flank drone recesses (10.3); claim
  enforcement, an anvil widest at the prow behind an instrumented boundary
  plate (18.0); survey command frigate, twin instrument keels under a raised
  archive citadel with a 1.45-unit tunnel between them (30.8); extraction
  carrier, an open four-chord lattice keel under a two-tier drum rack (74.9).
- New review instruments: `scripts/probe-class.mjs`, `scripts/silhouette-sheet.mjs`,
  `scripts/ship-render.mjs`, on `scripts/raster.mjs` and the extracted
  `scripts/ship-metrics.mjs`. Sheets for the family are in `docs/silhouettes/`.
- `SHIP_SCALE.cutter.hull` ceiling 26,000 → 34,000, for the reason recorded in
  the comment there: authors asked to fit an inspection launch into 26,000
  twice responded by switching the hull PLATING off.

### What the second session actually cost, and the rule that came out of it

Almost every corrective pass was the same failure: **an author asked to meet a
number removed the thing the class is for.** The survey scout's instrument was
shrunk to a pancake to move a pivot 0.05. The scout's drive section was replaced
with hand-rolled boxes to save vertices. The inspection launch's impound ring
was cut to a six-sided wire loop and its windows deleted. Hull plating was
switched off — with `rows: 0` — on four separate classes.

The rule, and it belongs in every future wave's brief: **when a pin and the
brief collide, move the geometry that is NOT the class read.** Lengthen the
stern rather than shortening the instrument. Thin the tail rather than
un-plating the hull. If nothing can move, the budget is wrong and it gets
changed in `ship-scale.js` with a comment saying why — that is a smaller lie
than a ship that no longer matches its brief.

### Reviewing in the render

Headless Chromium has no WebGL and `main.js` catches it with a fatal screen. Use
real Chrome:

```
chrome.exe --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist
```

against `npm run dev`. The title screen's MODELS button is unreliable to click
while Vite is hot-reloading; `window.__ctx.models.open()` is the dependable way
in. Then click `.rw-models-entry` by index — the Ships tab lists
`FACTION_ORDER × CLASS_ORDER × {trader, pirate}`, so Veridian's trader bakes are
indices 12, 14, 16, 18, 20, 22.

That path still needs a human at a keyboard. For everything short of the final
sign-off, use the CPU prints instead — they need no GPU, no browser and no
server, and they are what caught every shape defect in wave 49.2:

```
node scripts/silhouette-sheet.mjs <faction>   # docs/silhouettes/<f>-shape.png, -scale.png
node scripts/ship-render.mjs <faction>        # docs/silhouettes/<f>-render.png
```

Read the PNGs. The silhouette sheet answers "is the anatomy different?" and the
shaded print answers "does the construction logic read?" — a hull can pass every
numeric pin and still be a bare shell wearing equipment, and only the second
sheet shows it.

### Wave 3 — Freehold Compact, and what to reuse

Bible §4.3. The brief is the hardest yet on shape discipline: "donated hull
sections on a sound frame", "patchwork is history, not neglect", and the
silhouette "can be chunky and friendly" while the travel direction stays clear.
That is a licence for varied section, not for randomness — and the class that
retires the one-builder-six-sizes shortcut is this one.

Reuse, in this order:

1. `src/systems/ships/loft.js` unchanged. It is faction-agnostic; do not copy it.
2. Write `src/systems/ships/freehold/body.js` with ONLY the Compact's own
   construction language on top of it. Ferrous's `armourBlock` / `beltedHull` /
   `armourCourse` / `armouredSpine` are the shape of the answer, not the answer:
   a Freehold body core wants donated-section splicing, a sound structural frame
   under mismatched skins, and greenhouse/tank volumes.
3. Write `freehold/motifs.js`, then the motif-level smoke probe described above,
   then the six class files in parallel.

Ferrous notes worth carrying forward:

- Class targets that measured inside band: light 6.9, ace 7.2, cutter 11.5,
  heavy 16.4, frigate 28.0, freighter 81.7.
- Plate COUNT is the vertex lever, never plate size. Twelve large boxes moved the
  Veridian frigate's count by 432 verts against a 16,000 floor.
- Symmetry was doctrine for Ferrous; for Freehold it is the opposite, and the
  bible is explicit that the asymmetry must read as history rather than damage.

### Authoring rules that cost this session the most time

1. **Budget the extents before you build.** Agents that guessed produced an 8.8
   unit ace against a 7.59 ceiling and a 117-unit freighter against 92.4. Walk
   every `b.push` and part offset and write down the min and max z first.
2. **`panelSkin` is the vertex engine, not `box`.** A box is 36 vertices.
3. **Lamp counts come from `HUMAN.lampGap`, never `HUMAN.lampSize`.** Dividing by
   the lamp's own size packs them edge to edge: 805 lamps and 73,692 lit vertices
   on one freighter.
4. **Lit parts are seated on a fixed 1.0-unit cell at every class size.** Put
   them on plating, and build the walkway if the brief implies one.
5. **`weather(hex, i)` now clamps `i`.** It used to return pure black for `i >= 4`
   and fail the palette pin with no clue where it came from.
6. **Never let an agent run `git checkout`.** One did, after a syntax error, and
   destroyed two agents' uncommitted work.
