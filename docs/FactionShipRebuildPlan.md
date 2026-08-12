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
| `light` | 0.62–1.44 | 4.08–9.52 | 6.8 | 5.2 | +31% |
| `ace` | 0.65–1.53 | 4.32–10.08 | 7.2 | 10.0 | −28% |
| `cutter` | 1.00–2.33 | 6.60–15.40 | 11.0 | 8.7 | +27% |
| `heavy` | 1.55–3.61 | 10.20–23.80 | 17.0 | 16.4 | +4% |
| `frigate` | 2.91–6.79 | 19.20–44.80 | 32.0 | 46.4 | −31% |
| `freighter` | 10.0–16.55 | 66.00–109.20 | 78.0 | 12.4 | **+529%** |

The bands were widened in wave 3 to ±40% of the authored target, at the project
owner's direction — on the same terms as the vertex ceiling relaxation the wave-3
handoff records. The target values are unchanged and remain the authoring aim.

Adjacent bands now share range. Light (4.08–9.52) and ace (4.32–10.08) almost
entirely coincide; cutter's floor 6.60 sits inside ace's band; heavy's floor
10.20 sits inside cutter's band. Two constraints make this safe without loosening
the hierarchy.

**The size ladder is pinned per faction.** `scripts/boot-test.mjs` checks
`<faction>ClassOrdering` for every rebuilt fleet: light ≤ ace < cutter < heavy <
frigate < freighter, with light and ace permitted within 15% of each other. A
faction still has to climb its own ladder even when adjacent charter bands share
range.

**The freighter floor is a world-coherence bound, not a budget.** The
mathematically symmetric lower bound would be 46.8 (78 × 0.60), but the floor is
held at 66.0. A station sculpt measures roughly 57 units across
(`src/systems/stations/*.js`, half-extents ~28). The player reads "this ship does
not fit inside a station" from the silhouette beside it — bible §2, "Never fits
inside a station; exterior berth only" — and a 46-unit freighter parked beside a
57-unit station would not deliver that read. Station scale is deliberately out of
scope for this pass.

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
| `light` | 4,000–25,000 | 260 | 0.6 |
| `ace` | 4,000–21,000 | 260 | 0.6 |
| `cutter` | 6,000–47,000 | 400 | 0.8 |
| `heavy` | 9,000–78,000 | 600 | 1.1 |
| `frigate` | 16,000–84,000 | 1,100 | 1.8 |
| `freighter` | 34,000–154,000 | 2,400 | 3.2 |

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
`SHIP_SCALE[class].proxy` described a hand-authored circular capsule — sphere
radius `r` swept along the hull's local Z between `−halfLen` and `+halfLen`.

**Nothing had ever verified the capsule.** The values were sized for the retired
wave-47 hierarchy and never re-cut when wave 0 re-scaled every class to the
charter. Grepping `proxy` across `measure-ships.mjs`, `probe-class.mjs`,
`ship-metrics.mjs` and `boot-test.mjs` returned nothing. Widening the span bands
in wave 3 forced the first measurement.

`proxyCover` in `scripts/ship-metrics.mjs` measures the fraction of hull vertices
inside the proxy at unit scale. Nine of eighteen rebuilt sculpts were below 80%:
veridian cutter 71.1%, heavy 60.6%; ferrous ace 53.4%, cutter 44.5%, heavy 36.8%;
freehold light 51.3%, ace 69.2%, cutter 70.0%, heavy 20.1%. The freehold heavy at
20.1% was almost entirely unshootable.

Re-solving the circular capsule for coverage produced the opposite defect. Hulls
are flat by charter: `SHIP_PROPORTION` caps `spanY / spanZ` at 0.60, and sculpts
run 0.19–0.47. A circular cross-section reaching the flanks must grow large enough
to contain the wings, which made it stand up to 2.3× the ship's height. The
veridian cutter's hitbox was +132% in Y. Coverage alone has a degenerate optimum:
the metric rewards a capsule that swallows the ship plus empty space.

A second pin, `proxyFit` in `scripts/ship-metrics.mjs`, bounds the overshoot:
proxy width and height may not exceed the hull's own spans by more than +25%;
proxy length by more than +35%. `boot-test.mjs` mirrors both per faction as
`<faction>ProxyCover` and `<faction>ProxyFit`. A proxy needs both bounds, because
either alone drives a degenerate result.

The cross-section became an **ellipse** `{ rx, ry, halfLen }`. That fixed 15 of
18 sculpts and left three structurally impossible: one proxy per CLASS cannot serve
a 2.06× `spanY` ratio between the ferrous cutter (stout tug, `spanY` 5.33) and
the veridian cutter (flat blade, `spanY` 2.59).

**The proxy is now derived per sculpt.** `deriveProxy(hullGeometry)` is exported
from `src/systems/npc.js` and called at bake time. Its result is cached alongside
the merged geometry in `shipGeosFor`'s per faction × class × bake cache;
`buildShipMesh` puts it on `group.userData.proxy`; `combat.js` reads that field
and falls back to `SHIP_SCALE[class].proxy` only for hull-less ships (the
Unknowables are a no-hull energy field and have no geometry to derive from). **Do
not tune `SHIP_SCALE[class].proxy` for any rebuilt faction — it has no effect.**

The cross-section uses `q = 0.90` of the normalised 2D radial distance
`sqrt((x/hX)² + (y/hY)²)` scaled by the hull's own half-spans, giving `(rx, ry)`.
A marginal per-axis percentile was tried and rejected: it gave the ferrous
hammerhead heavy 45% coverage, because that hull's primary mass fills the XY
bounding-box corners — the corner cells fall outside both a percentile-X margin
and a percentile-Y margin individually, even though they sit squarely within the
actual mass envelope. The joint normalised-radial percentile captures that mass;
the marginal approach misses it. That is exactly the mistake the next author will
reach for first.

`halfLen` needed its own rule, and the reason is worth keeping. It was first
derived as `qthPercentile(|z|) − max(rx, ry)`, which looked correct and measured
correct — because `proxyCover` at the time clamped a vertex's `z` and then
DISCARDED the result, so the score was purely radial and could not see length at
all. A capsule with `halfLen = 0` would have scored ~90%. Once the metric became
a true capsule test including the end caps, every one of the eighteen sculpts
fell to 39–79%: subtracting the largest cap radius from an already-percentile
length put the cylinder caps near the hull midplane, and on a wide hull like the
ferrous heavy (`rx` 5.78) it left `halfLen` at 2.03 on a 16-unit ship.

Raising the percentile cannot fix that — `max(rx, ry)` can approach the hull's
own half-length on a stocky ship, driving `halfLen` toward zero for any `q`. The
formula is now
`halfLen = max(0, min(zPercentile(0.97), 0.67 · spanZ − max(rx, ry)))`:
a high longitudinal percentile, clamped by the `proxyFit` length ceiling
expressed as a bound on `halfLen`. For wide hulls the ceiling is the binding
term, which is why several classes report a length fit of 34% — the capsule is
as long as the fit pin permits, and coverage still clears the floor.

All eighteen rebuilt sculpts now sit at ~90% coverage with fit inside +25/+25/+35.
Reproduce with `node scripts/measure-ships.mjs <faction>` (reports `proxyCover`
and `proxyFit` per class) and `npm run test:boot` (reports `<faction>ProxyCover`
and `<faction>ProxyFit` per rebuilt faction).

The coverage floor is 80% and not 100% because the proxy follows primary mass
only — masts, cranes, docking spars and antennae sit deliberately outside it, and
a bolt passes through them. A sculpt reading 80–93% is healthy. One that scrapes
80% consistently means primary hull is slipping outside the proxy, not that
appendages are unusually large.

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
| 3 | Freehold Compact | `ships/freehold/` | **done** — donated-section hulls, greenhouse/tank volumes, soft vertex budgets; one-builder-six-sizes retired |
| 4 | Red Ledger | `ships/redledger/` | **done** — captured-section hulls, the ram, grapple arms, the haulage spine; six anatomies from one seized-hardware vocabulary |
| 5 | Gilded Chain | `ships/gilded.js` | **next** |
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

**Green:** `measure-ships` ALL PASS (whole fleet, including `proxyCover` and
`proxyFit`), `attach-audit` ALL PARTS ATTACHED (Veridian, Ferrous, Freehold and
Red Ledger; the six unrebuilt built fleets still carry wave-47 floaters and are
only legacy-pinned), `test:boot` BOOT TEST PASS (including `<faction>ProxyCover`
and `<faction>ProxyFit` for veridian, ferrous, freehold and redledger),
`probe-models` MODEL PROBE PASS, `probe-motifs redledger` ALL MOTIFS CLEAN.

### Wave 4 — Red Ledger

Six body plans, measured: account runner, a thin predatory needle carrying an
oversized dish collector on a stepped cradle above its own crown, with a belly
lockbox (6.90); collector, a low wide-shouldered blade behind one machined
boarding spike, its two captured drives deliberately mismatched — port larger,
lower and further aft, starboard smaller, higher and further forward (7.48);
boarding talon, the fork: two swept grapple arms with converging jaws around a
centreline breaching tube, reverse-thrust blocks on the outboard shoulders and
an armoured brow behind the fork throat (12.01); tribute raider, a hammer — a
deep wedge ram stepping up into a muscular plated body with four grapple booms
of four different lengths and three bolted ransom vaults on stand-off pads
(17.40); clan command ship, three zones on one keel: a narrow low boarding
gallery forward, a three-step command citadel amidships, a widened rack aft
carrying three mismatched captured drives (34.20); tribute barge, an armoured
haulage train — protected command tug, a 52-unit spine of seized containers,
ransom vaults, counting houses and outboard prize cradles, then a drive block
(77.93).

What landed:

- **`src/systems/ships/redledger/body.js`** as the faction shape core
  (`capturedHull`, `plunderCourse`, `ramProw`, `grappleArm`, `haulSpine`,
  `breachTube`, `vaultBlock`, `tallyBand`) over the unchanged shared `loft.js`.
  Where Freehold splices donated sections with bolted straps, the Ledger welds
  seized ones: every seam carries a raised weld bead and adjacent sections are
  forbidden the same tone, so a hull reads as three captures made into one.
- **`src/systems/ships/redledger/motifs.js`** — the Ledger's equipment
  language: tally grooves, hidden weapon shutters, the oversized collector,
  contract lockboxes, claw jaws, mag clamps, winches, caged transfer locks,
  counting houses, captured drives, reverse thrusters, the boarding spike,
  prize cradles, seized containers, amber work-lamp runs and crew walks.
- One file per class under a barrel at `src/systems/ships/redledger.js`, and
  **`redledger` added to `REBUILT_FACTIONS`** in `src/game/ship-scale.js`.
- **`scripts/probe-motifs.mjs` now supports redledger** (26 constructs); its
  call-table selection became a lookup object instead of a ternary chain, so
  wave 5 adds one function and one key.

### The six defect shapes wave 4 added to the catalogue

1. **Degrees written into a radian slot.** `detailBuilder.push` is
   `push(x, y, z, ry, rx, rz)`. Three separate authors passed DEGREES —
   `-90`, `180`, `-5.7`, `±10` — and two of them put the value in `rx` when
   they meant yaw. `-90` radians is 243°, so every flank fitting on the cutter
   was spun about the long axis, and the light's dish collector rendered as a
   flat black slab leaning over the hull. No pin sees it: attachment, mass,
   palette and proxy all stay green because a rotated part is still a part.
   Only the render shows it. Grep a finished class file for a rotation
   argument whose absolute value exceeds 2π.
2. **A motif called with no frame stacks at the origin.** The first ace draft
   contained zero `b.push` calls: the spike, both drives, three groove runs,
   four shutters, the thrusters, the lockbox and the crew walk were all emitted
   at the hull centre. Because everything then intersects everything,
   `attach-audit` reported 100% contact and every numeric pin passed. A motif
   places geometry around the CALLER'S current frame origin; the `b.push(0, 0,
   0, ry, 0, 0)` inside a motif is its own local rotation frame, not a
   position. Cheap smell test: a class file whose `b.push` count is far below
   its motif-call count is not placing its equipment.
3. **The object form of `push` makes NaN frames.** `b.push({ z: -15.7 })` puts
   the object in `x`; `Vector3.set` yields NaN, the frame matrix goes NaN, and
   every vertex under it is NaN. A min/max scan over NaN never updates, so the
   part boxes come out `[Infinity, -Infinity]`. On the frigate that single
   mistake produced 430 lonely parts, a `#000000` palette stray, `proxyCover`
   0% and `proxyFit` NaN — four symptoms, one cause, and the author's first
   instinct was to blame the shared body core.
4. **The barrel is imports only.** An agent, finding two sibling class files
   missing, wrote 123-byte stubs over them AND inlined placeholder
   `{ glowZ, build() {} }` entries into `src/systems/ships/redledger.js`. The
   fleet harnesses then reported "no hull chunk" for ace and freighter while
   `probe-class` — which imports the class module directly — reported PASS for
   both. When those two instruments disagree, suspect the barrel before the
   sculpt.
5. **Motif detail that ignores the taper it rides.** `boardingSpike` ran four
   guide rails at a constant radius along a shaft that tapers 5:1, so the
   forward two thirds of every rail hung in open space and the ace's "precise
   boarding spike" rendered as four whiskers. Same family as wave 3's window
   rows sampled at the wrong height: a strake, rail or row must follow the
   surface it belongs to, or be confined to the part of it that does.
6. **A motif has a default facing, and the caller must state it.**
   `commsReceiver` builds its bowl opening toward +Z, which is ASTERN. Mounted
   without a yaw, the spotter's oversized collector listened backwards. Any
   motif with a front should say which way it faces in its JSDoc, and any
   caller mounting one should pass the yaw explicitly rather than inherit the
   default.

And four process notes for wave 5:

- **The motif smoke probe paid for itself again, harder.** `probe-motifs
  redledger` was green on its first run over all 26 constructs, and not one of
  the six defects above turned out to live in `body.js` or `motifs.js` — every
  one was in a class file. That is the whole point of the instrument: when the
  foundation is provably clean, a class-level failure cannot be blamed on it,
  and the three agents who did blame it were answered in one message each.
- **`probe-class` imports the barrel transitively.** It pulls `deriveProxy`
  from `npc.js`, which imports every faction barrel, which imports all six
  class files — so a sibling's half-written file fails YOUR probe with a
  SyntaxError naming THEIR file. Tell every author up front: that failure is
  transient, re-run it, never edit the file in the trace.
- **Central diagnosis, broadcast correction — third wave running.** Two agents
  attributed their own NaN frames to the shared body core and were about to
  patch it. One message each, naming the line and the cause, closed both.
- **The review prints rejected three of six classes that had passed every
  numeric pin** — the fourth wave in a row this has happened. The light's dish
  was invisible, the heavy's ram was a blunt slab and the frigate's three zones
  read as one taper. Generate and READ `silhouette-sheet` and `ship-render`
  before calling a class done; the numbers cannot see shape.

### Wave 5 — Gilded Chain, and what to reuse

Bible §4.5. The hardest brief yet on SURFACE discipline, where Freehold's was
on shape: "overlapping scale-like black ceramic armor", "ivory structural
edges", "old-gold articulation", "cold turquoise gallery light", "sleek, low,
and ceremonially composed", and threats "hidden until used". The Chain is the
opposite of the Ledger in every axis — sealed where the Ledger is open,
symmetric and composed where the Ledger is scarred, cold turquoise where the
Ledger is amber — so resist carrying the Ledger's habits across.

Reuse, in this order:

1. `src/systems/ships/loft.js` unchanged. Faction-agnostic; never copy it.
   Note `sectionOutline`'s `seg` override: a smooth ellipse section is how the
   Chain gets seamless, flush shells without a new code path, where the Ledger
   and Ferrous use the chamfered octagon.
2. Write `src/systems/ships/gilded/body.js` with ONLY the Chain's own
   construction language. The shape of the answer, not the answer: Ferrous has
   `armourBlock`/`beltedHull`, Freehold has `splicedHull`/`glassHouse`, the
   Ledger has `capturedHull`/`ramProw`/`grappleArm`. A Chain body core wants
   OVERLAPPING SCALE COURSES that follow the loft (each scale lapping the one
   behind it, which `loftPlating` alone cannot express), ivory edge margins
   along the section's own outline, sealed vault/gallery volumes, and a smooth
   crescent or leaf plan.
3. Write `gilded/motifs.js`, then add a `gildedCallTable` to
   `scripts/probe-motifs.mjs` — the selection is now a lookup object, so this
   is one function and one key — and run the motif smoke probe BEFORE
   dispatching class authors. That instrument has now been green-on-first-run
   once and defect-finding once, and both outcomes saved a full corrective
   pass.
4. Then the six class files in parallel, one author each, each briefed with
   its own body plan, its extent budget and the charter numbers.

Red Ledger notes worth carrying forward:

- Class sizes that measured inside band and on the ladder: light 6.90, ace
  7.48, cutter 12.01, heavy 17.40, frigate 34.20, freighter 77.93. Remember
  `<faction>ClassOrdering` allows light and ace only 15% apart — an ace
  authored at the ace's target while the light lands at its own target is
  already at the edge of that window.
- Tell every author, in the brief and before the first line of code, that
  `push` is `(x, y, z, ry, rx, rz)` in RADIANS. Two thirds of this wave's
  corrective work was that one signature.
- The Chain's "threats hidden until used" is the same construction problem the
  Ledger's `weaponShutter` solved: a recessed well, sliding plates that meet
  at a seam, and an `open` parameter. Do not re-invent it — author the Chain's
  hairline-seam version deliberately, and give it a different closed read.

### Wave 3 — Freehold Compact

Six body plans, measured: cab-forward runabout with a framed raked windscreen and a stepped-down aft working deck (7.07); hourglass with a pinched waist between a faired shoulder and an oversized stern drive, with outboard tuned clusters (7.47); flat-bowed rescue launch with a recessed bow airlock, a bow floodlight mast and a separated medical house (11.80); low armoured work hull with a near-vertical riser into a raised monitor citadel carrying turrets on barbettes (17.48); long hull with exposed yard modules over a lowered keel with a visible gap, and an aft ventral rescue hangar (32.13); articulated command tug, narrow exposed spine and drive block, with habitation drums, greenhouse galleries and craft docks beyond the flank (78.60).

What landed:

- **`src/systems/ships/freehold/body.js`** as the faction shape core (`splicedHull`, `patchCourse`, `donatedBlock`, `soundFrame`, `glassHouse`, `tankVolume`) over the unchanged shared `loft.js`.
- **`src/systems/ships/freehold/motifs.js`** — the Compact's surface and equipment language: window strakes, habitation drums, greenhouse galleries, tank clusters, floodlight masts, recessed bow locks, medical houses, monitor turrets and ventral hangars.
- One file per class under a barrel at `src/systems/ships/freehold.js` — `light.js`, `ace.js`, `cutter.js`, `heavy.js`, `frigate.js`, `freighter.js`.
- **`freehold` added to `REBUILT_FACTIONS`** in `src/game/ship-scale.js`.

### The vertex ceilings are now soft

The project owner's direction: relax the budgets, only be concerned at more than 40% out of spec, good models matter more than the initial guidelines. Every ceiling was raised 40% (light 25,000, ace 21,000, cutter 47,000, heavy 78,000, frigate 84,000, freighter 154,000); the floors are unchanged because they are the "not a bare shell" pin. Spans, silhouette ratios, pivots, single mass, orphan lights, attachment and palette are NOT relaxed.

### The six defect shapes wave 3 added to the catalogue

1. **Double weathering.** The section-scale skin called `weather()` on tones the class files had already passed pre-weathered. `hull` x0.86 x0.72 = x0.619 lands off the four-step SHADES ladder, so the palette pin failed with hexes (#423121, #4f3a28) that match no base colour and no single shade. A helper that shades a caller-supplied colour must never assume the colour is un-shaded; emit tones verbatim from the caller's list instead.
2. **Colour-dependent colour selection breaks the pirate bake.** The same skin grouped the palette into hue families by reading RGB. The pirate bake desaturates ~50% toward luminance and dims to 72% (`src/systems/npc.js`), which changes hue relationships, so the two bakes selected DIFFERENT slots of the palette and a pirate vertex could come out brighter than its trader counterpart — `wave38 ship pirates / colorsNeverBrighterStrictlyDimmer` in `scripts/boot-test.mjs`. The rule "geometry never reads a colour to decide a position" extends to selection: pick by INDEX and seed, never by colour value.
3. **A light seated INSIDE a volume is still an orphan.** An agent fixing orphan lights on the habitation drums inset the window panes from radius r to r-0.6, which moved them into the drum's hollow interior where no hull cell can neighbour them. It moved the number and buried the defect. A window in a wall is a hull WELL plus a lit pane seated in it; the general remedy is to seat lights on a plate you add — a window strake built from the loft follows the taper by construction, where a hand-computed X offset cannot.
4. **Sampling a lofted surface at the wrong height.** Window rows were placed using the section half-width at y=0 while mounting at y~2.5. A chamfered outline narrows as it rises, so the rows hung outside the skin. Sample `sectionOutline` at the part's own y, or avoid the problem entirely with a strake.
5. **Section-scale colour can overshoot into monotone.** Fixing the per-plate "harlequin" skin with a fixed 2-4 sections per course made a 78-unit freighter almost entirely one tone — a factory paint job, not donated sections. Section count must scale with course LENGTH, and adjacent sections must be forbidden from drawing the same family so a seam is always a visible tone change.
6. **A charter constant that nothing pins drifts silently.** The collision proxy
   was documented as "set from the target span" — an intention with no
   enforcement — and stayed wrong through three waves of rescaling while every
   gate stayed green. Widening the span bands is what forced the first
   measurement. The fix was not to pin the constant — it was to delete it and
   derive the value from the artefact it describes. A derived value cannot drift:
   when the sculpt changes, the proxy updates automatically. The lesson for wave 4:
   a number in `ship-scale.js` that no harness reads back against the sculpt is a
   comment, not a contract. The corollary: a one-sided metric has a degenerate
   optimum — coverage alone rewards a proxy that swallows empty space, and fit
   alone rewards one that is arbitrarily small. That is exactly why `proxyCover`
   and `proxyFit` exist as a pair.

And four process notes worth carrying to wave 4:

- **The review prints did the work again.** The family passed every numeric pin and was rejected on shape in the first review — the third wave running that this has happened. Generate and READ `silhouette-sheet` and `ship-render` before declaring a class done.
- **Central diagnosis, broadcast correction.** When several agents hit the same unexplained pin, diagnosing it once centrally and broadcasting the cause stopped the documented wave-2 failure mode where agents invent a cause and replace shared motifs with private copies.
- **The wave-2 rule held again: authors asked to meet a number remove the thing the class is for.** Two authors cut plate density to fit a ceiling and had to be told to put it back.


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
