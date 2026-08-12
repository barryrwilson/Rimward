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

### Motif helpers, not one scaled hull

The bible forbids one faction hull uniformly scaled into six classes, and
requires the six to still read as relatives. Each faction file therefore opens
with a **motif helper section**: small named functions for the faction's
recurring construction logic (e.g. Veridian's hex pressure module and survey
vane, Ferrous's citadel armour step, Red Ledger's grapple boom). Every class
composes those motifs into anatomy appropriate to its job. Family resemblance
comes from shared motifs; class identity comes from different anatomy.

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
| 1 | Veridian Combine | `ships/veridian.js` | **done** |
| 2 | Ferrous Hegemony | `ships/ferrous.js` | **next** — spec in this doc's §6 handoff |
| 3 | Freehold Compact | `ships/freehold.js` | retires the one-builder-six-sizes shortcut |
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
4. The family is reviewed **in the render**, in the Models Browser, at side and
   top angles. The numeric pins cannot see a silhouette, and when a report and
   the render disagree the render wins.
5. The six classes sort by class at thumbnail size without colour.
6. The family reads as one faction in grayscale, from construction logic.
7. The freighter's exterior-only berthing story is visible in the sculpt —
   awkward service structures and multiple external docking points, not just
   size.
8. No flags, readable text, or borrowed franchise shapes.
9. The Models Browser renders all twelve entries (six classes × trader/pirate)
   without a build error, framed correctly at both ends of the size ladder.

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

## 6. Handoff — state at the end of the first session

**Green:** `measure-ships` ALL PASS, `attach-audit` ALL PARTS ATTACHED (Veridian;
the nine unrebuilt built fleets still carry wave-47 floaters and are only
legacy-pinned), `test:boot` BOOT TEST PASS. Waves 0 and 1 committed.

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

### Wave 2 is prepared but NOT landed

A Ferrous Hegemony motif library and class scaffold were written, measured green
on every size, proportion, pivot and connectivity pin, and then reverted so this
session could hand over a clean tree. Rebuild it from the §4.2 brief with the
nine motifs specified for it: `citadelArmour`, `wedgeProw`, `weaponBlock`,
`recognitionBand`, `serviceHonour`, `rescueLock`, `pointDefence`, `commandStep`,
`containerBlock`. Notes worth keeping from that pass:

- Ferrous class targets that measured inside band: light 7.0, ace 7.4, cutter
  10.8, heavy 15.7, frigate 28.0, freighter 77.6.
- `citadelArmour` is both the surface language and the vertex engine: its
  `rows × cols` plates per course are how the hull count moves. Twelve large
  boxes moved the Veridian frigate's count by 432 verts against a 16,000 floor.
- Symmetry is doctrine for this faction: every side-mounted part inside
  `for (const sx of [1, -1])`.

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
