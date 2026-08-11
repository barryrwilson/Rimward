# RIMWARD Faction Ship Design Bible

> **Status:** Art-direction handoff for the complete NPC ship rebuild.
>
> **Decision:** The current faction ship models are rejected as shape references. Do not polish, reskin, or proportionally enlarge them. Build new silhouettes from the faction briefs below. The existing **Player ship is the quality, animation, and scale anchor** and must not be redesigned as part of this pass.

## 1. The fleet must read before the faction does

Every ship has to communicate two things at combat distance:

1. **Class:** what it can do and how large it is.
2. **Faction:** who made, grew, inherited, or manifested it.

Class controls size, mass distribution, and functional equipment. Faction controls construction logic, surface language, light language, and attitude. Do not make one faction hull and uniformly scale it into six classes. The six ships should look related, but each must have anatomy appropriate to its job.

The Player ship is the visual yardstick. It is a small, personal living craft—not a miniature capital ship. Preserve its current model and measure every NPC ship against its largest rest-pose dimension, called **P** below.

## 2. Relative size charter

The old implementation made frigates enormous and freighters only slightly larger than personal craft. That hierarchy is retired. Use this order:

`ace ≈ light < cutter < heavy < frigate << freighter`

| Runtime class key | Modeling role | Target largest dimension | If P is treated as 24 m | Station relationship |
|---|---|---:|---:|---|
| `light` | Scout, courier, interceptor, personal workboat | 0.9–1.1 P | 22–26 m | Fits an internal berth |
| `ace` | Bespoke high-performance personal combat craft | 0.9–1.15 P | 22–28 m | Fits an internal berth |
| `cutter` | Patrol, boarding, customs, rescue, raiding | 1.45–1.8 P | 35–43 m | Fits a large internal berth |
| `heavy` | Gunship, convoy escort, tough specialist vessel | 2.2–2.8 P | 53–67 m | Uses a large bay or exterior cradle |
| `frigate` | Compact capital escort and command ship | 4.0–5.5 P | 96–132 m | Normally uses an exterior military clamp |
| `freighter` | Bulk carrier, mobile industry, migration vessel | 10–14 P | 240–336 m | **Never fits inside a station; exterior berth only** |

The meter column is illustrative. The P ratios are authoritative and let the existing Player ship remain unchanged.

### Scale rules that must be visible in the model

- A freighter must feel like a location. Give it repeated cargo bays, service vehicles, gantries, windows, maintenance access, and multiple docking points. The Player ship should look tiny beside it.
- A frigate is a compact warship, not the largest object in ordinary traffic. It should clearly outrank a heavy ship, but a freighter should dwarf it in volume.
- A heavy is a large combat or specialist ship. It is not a synonym for frigate.
- Ace and light craft occupy the same broad scale band. The ace reads as exceptional through proportions, control surfaces, engine-to-mass ratio, and finish—not through capital-ship size.
- Windows, doors, rails, docking collars, cargo containers, antennas, and maneuvering thrusters must keep a common human-scale module across every built faction. Never enlarge windows to fill a larger hull.
- Measure size from the complete visible envelope in its neutral pose. For the Unknowables, measure the stable field envelope. For the Beautiful Ones, exclude only very thin trailing tendrils from the class limit.

### Shared spatial setup

- Nose faces local **-Z** and stern faces **+Z**.
- Put the root pivot at the stable center of mass, not the geometric center of decorative fins.
- Keep forward, side, and top silhouettes distinct. A ship that only reads from one beauty angle is not finished.
- Keep the navigation silhouette mostly longer than it is tall. Faction-specific exceptions may be wide, radial, or manta-like, but should not become an undifferentiated box or barrel.
- Freighters may be broad and irregular, but their travel direction still needs to be instantly legible.

## 3. Shared class grammar

Use this grammar inside every faction brief.

### Light

One- to small-crew vessel. Minimal duplicated systems, one obvious cockpit/sensor focus, and no fake capital-ship decks. It should feel nimble even when parked.

### Ace

A named pilot's or exceptional lineage's craft. Use a cleaner profile, larger propulsion or control surfaces, tighter panel fit, and one memorable signature feature. Avoid random spikes and avoid simply adding more guns everywhere.

### Cutter

A working ship that can catch and interact with small traffic. Its boarding collar, tractor gear, rescue lock, inspection bay, or faction-equivalent must be visible near the bow or midships.

### Heavy

A dense, durable escort or specialist combat ship. Concentrate armor and weapons around a compact core. It should look capable of taking hits without becoming a scaled-down frigate.

### Frigate

The smallest true command/capital silhouette: bridge or command sensor focus, redundant systems, point-defense coverage, and one small craft or rescue capacity. It is long enough to have decks and operational zones, but still much smaller than a freighter.

### Freighter

A bulk-moving machine or organism. Cargo volume dominates propulsion and crew volume. Give it several independently readable sections and exterior berthing geometry. It should look unable to enter a station because of both size and awkward service structures—not because a label says so.

## 4. Faction briefs

## 4.1 Veridian Combine — ownership made physical

**First read:** calm corporate authority, survey precision, modular extraction hardware.

**Fleet DNA:** a straight load-bearing spine; hexagonal or chamfered pressure modules; detachable survey pods; graphite primary hull; pale structural alloy; muted emerald optics. Modules should look serialized and replaceable even without readable text. The silhouette is ordered and efficient, with instruments treated as valuable equipment rather than decoration.

**Avoid:** generic green warships, random greeble noise, decorative fins without survey function, or heroic naval curves.

- **Light — claim scout:** A narrow sensor-first dart with a small pressure cabin behind a large faceted survey head. Add two detachable sample canisters and thin lateral ranging vanes. Almost no weapon mass.
- **Ace — patent demonstrator:** A proprietary, unusually seamless test craft built around an oversized emerald sensor aperture and high-output drive. Fewer visible seams than the rest of the fleet and one unmistakable split-tail profile.
- **Cutter — inspection launch:** A slim enforcement hull with a forward docking/impound collar, evidence lockers along the spine, and paired survey drones nested flush into the sides.
- **Heavy — claim-enforcement ship:** A compact armored core with recessed weapons, redundant sensor facets, and protected sample vaults. The prow should look like a legal boundary made physical: blunt, exact, and difficult to push aside.
- **Frigate — survey command frigate:** A long, restrained command vessel with a central registry/data citadel, distributed instrument fins, two small launch bays, and armor concentrated around the archive and bridge.
- **Freighter — extraction carrier:** A gigantic open industrial spine carrying ore silos, refinery drums, detachable claim modules, and tug docks. Keep the crew/control block small so the cargo scale dominates. It must look designed to moor outside a station and exchange entire modules.

## 4.2 Ferrous Hegemony — readiness made monumental

**First read:** disciplined military mass, exact symmetry, protected citizens behind a hard line.

**Fleet DNA:** blunt reinforced prows; layered citadel armor; paired and formally aligned weapon housings; iron gray; restrained crimson recognition bands; small brass service honors. Rescue capability should always be present—this state believes it is humanity's shield. Symmetry is part of doctrine.

**Avoid:** chaotic guns, exposed pirate machinery, flamboyant wings, skull-like intimidation, or asymmetry without clear battle damage.

- **Light — picket:** A compact armored wedge with paired sensor cheeks, a narrow cockpit slit, and small rescue panniers. It should look overbuilt for its size.
- **Ace — honor interceptor:** A sharpened, immaculate development of the picket with a longer prow, larger paired drives, a single crimson centerline band, and formal recognition plates.
- **Cutter — patrol launch:** A stout customs/boarding vessel with a protected bow lock, side-by-side maneuvering engines, nonlethal projector housings, and a small rescue airlock.
- **Heavy — bastion gunship:** A short, dense citadel behind a deep wedge prow. Use two or four deliberate weapon blocks and thick shoulder armor; leave clean arcs for point defense.
- **Frigate — line escort:** A compact naval capital ship with a stepped command tower, layered central citadel, rescue-capable ventral hangar, and rigorously paired batteries. It should be impressive, not gigantic.
- **Freighter — fleet logistics carrier:** A very large armored logistics train: standardized container blocks and fuel tanks behind a protected command tug. Armor the vital spine and drive, not every cargo box. Repetition and formation discipline should create scale.

## 4.3 Freehold Compact — a home that happens to fly

**First read:** maintained by neighbors, repaired for decades, useful before beautiful, warm without being quaint.

**Fleet DNA:** barn red, weathered cream, faded blue, bare metal, warm windows; donated hull sections on a sound frame; greenhouses, water tanks, external tools, and visible rescue gear. Patchwork is history, not neglect. The silhouette can be chunky and friendly, but the travel direction must remain clear.

**Avoid:** junk piles, comedy tractors, randomly detached parts, excessive rust, or making competent people look primitive.

- **Light — family runabout:** A compact cabin-forward craft with a broad greenhouse-like windscreen, tool lockers, a rescue winch, and two clearly replaced hull panels.
- **Ace — local legend:** A lovingly rebuilt runabout stripped of unnecessary mass, with hand-fitted fairings, exposed tuned maneuvering clusters, and one personal but non-heraldic paint treatment.
- **Cutter — lane-keeper:** A practical rescue and patrol boat with a wide forward airlock, tow winch, floodlights, medical compartment, and clamp-on supply lockers.
- **Heavy — militia monitor:** A reinforced work hull carrying bolt-on armor and defensive turrets around an intact civilian core. Keep the greenhouse/cabin warmth visible behind protection.
- **Frigate — convoy keeper:** A community-funded escort with a long repaired keel, several different yard modules, a proper command cabin, rescue hangar, and replaceable side armor. It should feel like several towns contributed to one dependable ship.
- **Freighter — mobile homestead:** A huge slow carrier with habitation drums, greenhouse galleries, water tanks, workshops, family craft docks, and cargo pods on a structural spine. It is a traveling neighborhood and must berth outside. Warm window repetition is the primary scale cue.

## 4.4 Red Ledger — violence with terms and receipts

**First read:** captured hardware reorganized into a deliberate predatory machine.

**Fleet DNA:** long grasping or boarding prows; visible clamps and grapples; dark iron; dried-red tally divisions; tarnished copper; amber work light. Repairs are scarred but purposeful. Asymmetry should reveal captured components, while the overall attack vector remains clear.

**Avoid:** anarchic scrap heaps, cartoon pirate motifs, exposed crew for spectacle, random spikes, or sloppy construction. The Ledger is organized.

- **Light — account runner:** A lean spotter with a narrow predatory nose, oversized comms receiver, hidden weapon shutters, and one external lockbox for contracts or payment.
- **Ace — collector:** A low, unmistakable pursuit hull with offset captured engines, a precise boarding spike, retractable gun ports, and repeated tally grooves cut into one armor flank.
- **Cutter — boarding talon:** The faction's clearest statement: forked grappling arms around a central breaching tube, strong reverse thrust, prisoner/cargo transfer locks, and protected cockpit placement.
- **Heavy — tribute raider:** A muscular captured hull rebuilt around a ram, four grappling booms, recessed weapons, and modular ransom/cargo vaults. Deliberately unbalanced secondary machinery is welcome.
- **Frigate — clan command ship:** A long raiding command vessel whose forward third is dedicated to pursuit and boarding, middle to weapons and command, and stern to captured drives. Use disciplined red tally bands to unify mismatched parts.
- **Freighter — tribute barge:** A massive armored haulage spine bearing seized containers, ransom vaults, docked prize craft, and mobile counting-house modules. It should look profitable enough to defend and too broad and irregular for an internal dock.

## 4.5 Gilded Chain — immaculate procedure concealing horror

**First read:** reptilian auction-house elegance, sealed and controlled.

**Fleet DNA:** overlapping scale-like black ceramic armor; ivory structural edges; old-gold articulation; cold turquoise gallery light; smooth, quiet tractor apertures; sealed transfer routes. The profile should be sleek, low, and ceremonially composed. Threats are hidden until used.

**Avoid:** gore, cages displayed for shock, gothic spikes, overt monster faces, gaudy gold coverage, or visibly dirty machinery.

- **Light — catalog courier:** A small polished seed/scale shape with one turquoise sensory slit, hidden landing geometry, and a perfectly flush sealed payload chamber.
- **Ace — acquisition duelist:** A thin crescent or predatory leaf with tightly overlapped ceramic scales, swept gold control spines, and weapon apertures visible only as hairline seams.
- **Cutter — customs acquisitor:** A poised vessel with a ventral capture collar, precision tractor lenses, two sealed transfer chambers, and symmetrical inspection sensor arrays.
- **Heavy — collection hunter:** A black armored wedge with ivory scale margins, recessed interdiction gear, and a cold illuminated gallery running deep inside rather than across the surface.
- **Frigate — pavilion escort:** A long ceremonial warship with layered dorsal scales, hidden batteries, a protected transfer bay, and an observation rotunda whose elegance feels unnervingly calm.
- **Freighter — catalog ark:** A huge, immaculate acquisition carrier composed of several sealed vault/gallery bodies beneath one flowing scale shell. Multiple transfer salons and tug points establish scale. It never enters a station; the station connects to it through controlled bridges.

## 4.6 The Beautiful Ones — living kin, not organic machines

**First read:** majestic animal intelligence, tenderness, breath, and self-directed motion.

**Fleet DNA:** use the existing Player ship as the direct quality and anatomy reference: manta/whale/amoeba flow, pearl and indigo living tissue, cyan-violet veins, sensory crown, breathing vents, healed scars, and continuous subtle movement. Every class is a different life stage or body plan, not a metal ship covered with flesh. There are no engine nozzles, manufactured windows, bolted armor plates, or mechanical gun turrets.

**Avoid:** body horror, exposed organs, teeth as architecture, wet gore, mechanical kitbashing, identical player clones, or motionless organic statues.

- **Light — young wayfinder:** The closest family resemblance to the Player ship: small, curious, broad-winged, and lightly built, with a distinct crown and short tail. Differentiate it through head and fin anatomy, not color alone.
- **Ace — swift-bonded hunter:** A taut, fast adult with swept fins, narrow frontal area, bright nerve lines, and controlled asymmetry from healed experience. Propulsion is a powerful whole-body traveling wave.
- **Cutter — guardian:** A social, maneuverable adult with cradle-like grasping fins, gentle docking folds, and a protected belly chamber for rescue or transfer. It should look capable of holding without mauling.
- **Heavy — shieldback:** A mature defender with a dense central body, layered muscular mantles, broad shielding fins, and luminous threat displays. Weapons should read as focused biological energy or symbiotic organs, never barrels.
- **Frigate — elder guardian:** A large, calm, long-bodied elder with multiple coordinated fin pairs, sanctuary hollows for small companions, scar history, and a deep sensory crown. Powerful, but still much smaller than a freighter organism.
- **Freighter — gardenback migration vessel:** A colossal living carrier whose back and ventral folds support symbiotic gardens, nursery hollows, and sheltered companion spaces. Slow breathing must travel across separate body regions. Its body should dwarf stations' ordinary berths and accept external cradle branches rather than enter a hangar.

## 4.7 The Unknowables — consistent rules humans cannot parse

**First read:** a coherent traveling energy configuration carrying real physical energy cells.

**Fleet DNA:** nested magnetic loops, gravitational lensing, plasma sheets, synchronized nodes, ultraviolet and cyan fields, white-gold anchors, charged dust. No cockpit, hull, wing, or conventional engine. Each class should feel mathematically stable and intentional. Physical cells and dark anchor matter give the eye a scale reference.

**Avoid:** transparent versions of ordinary ships, lightning blobs, humanoid faces, random particle noise, or effects with no stable silhouette.

- **Light — mote:** Three nested loops around a handful of cells, with a pointed distortion in the direction of travel. Compact and readable.
- **Ace — fast knot:** A denser, brighter field with tightly wound loops and a long controlled lensing wake. Its signature is temporal precision, not more random arcs.
- **Cutter — exchange lattice:** A bifurcated field that can extend a stable transfer pocket toward another vessel. Keep the carried cells visibly moving between fixed nodes.
- **Heavy — compression manifold:** A thick toroidal configuration with multiple anchor masses and broad plasma planes that flare defensively. It should occupy more volume without appearing solid.
- **Frigate — chorus field:** Several synchronized knots moving as one stable architecture, with a clear central cadence and satellite exchange nodes. Smaller than the cell caravan below.
- **Freighter — energy procession:** A vast chain or nested procession of fields containing thousands of physical cells in ordered streams. Repeated anchor clusters create enormous scale; the station meets one terminal node while the rest remains outside.

## 4.8 The Assembly — inheritance copied until it became civilization

**First read:** ancient survey machinery, recursive self-similarity, copy errors that accumulated into lineage.

**Fleet DNA:** repeated probe modules on charcoal structural spines; weathered off-white shells; faded orange replacement panels; teal optics; antenna forests; daughter probes; fabrication apertures. A component should visibly recur at two or three scales. Variation is systematic copy drift, not human patchwork.

**Avoid:** pristine killer robots, humanoid robot faces, random asymmetry, chrome, or mystical floating pieces without mechanical purpose.

- **Light — daughter probe:** A central teal optic, three or four repeated instrument petals, small fabrication socket, and a tiny detachable copy nested beneath it.
- **Ace — divergent surveyor:** A high-speed lineage with duplicated drive modules and slightly mismatched recursive fins—the same design copied, corrected, and copied again.
- **Cutter — contact probe:** A robust survey chassis with several manipulator/inspection arms, sample exchange ports, and daughter probes arranged around an old central body.
- **Heavy — replication defender:** A dense machinery core surrounded by replaceable armor modules, fabrication bays, and duplicated sensor/weapon clusters. Function should remain legible despite complexity.
- **Frigate — archive surveyor:** A long archive spine bearing repeated data vaults, an antenna crown, probe launch petals, and a protected ancient core embedded off-center by generations of growth.
- **Freighter — foundry lineage:** A colossal mobile replication yard: resource hoppers, repeating foundry cells, daughter-ship racks, and successive generations of modules extending down one spine. The smallest visible daughter probe should be light-class scale.

## 4.9 Congregation of the Further Shore — pilgrimage aimed outward

**First read:** practical frontier vessel shaped by sacred orientation and disciplined ritual.

**Fleet DNA:** a strong forward axis toward the Rim; midnight-blue hull; weathered silver ribs; candle-amber guidance lamps; restrained violet Wakeglass optics; observation chambers, rescue stores, archives, and folded sails. Sacred spaces must also function as navigation or survival spaces.

**Avoid:** fantasy churches pasted onto hulls, crosses or borrowed real-world symbols, gold excess, flimsy sails that could not stow, or purely ceremonial ships.

- **Light — pilgrim courier:** A small forward-looking craft centered on one observation blister, with a silver rib cage, compact archive box, and two folded emergency sails.
- **Ace — visionary pathfinder:** A narrow, fast craft with an enlarged Wakeglass sight, long forward keel, and sails folded so tightly they form a sharp dorsal silhouette.
- **Cutter — refuge launch:** A rescue-oriented vessel with a broad receiving lock, warm beacon nave, medical stores, and deployable shelter sails. Its posture is invitational but durable.
- **Heavy — wardship:** A compact armored pilgrim escort with a protected forward chapel/observatory, defensive batteries kept below the rib line, and redundant life-support vaults.
- **Frigate — pilgrimage escort:** A long outward-pointing command ship with a luminous forward observation chamber, repeated silver ribs, sect-specific modular bays, rescue hangar, and folded radial sails.
- **Freighter — wandering basilica:** A huge pilgrimage and refuge vessel with habitation districts, archive vaults, supply holds, and an immense forward-facing nave/observatory. Repeated amber-lit rib bays create scale. It remains outside stations and receives pilgrims by shuttle and bridge.

## 4.10 Lamplighter Guild — the network stays alive because workers do

**First read:** rugged infrastructure, replaceable parts, access to everything, tools before weapons.

**Fleet DNA:** soot-dark frames; weathered utility-yellow modules; cobalt diagnostic panels; warm lamps; exposed safe access routes; cranes, cable reels, clamp arms, relay masts, tug engines, and standardized service connections. Every part should look maintainable in a pressure suit.

**Avoid:** sleek racing shells, ornamental steampunk brass, weapon-first silhouettes, inaccessible surface detail, or a single giant wrench joke.

- **Light — service skiff:** An open-looking but pressurized maintenance pod with tool carousel, floodlights, handrails, and two universal clamp arms.
- **Ace — outage runner:** A stripped emergency-response craft with oversized maneuvering clusters, a compact relay mast, hot-swappable tool pods, and high-visibility lamp bars.
- **Cutter — relay tender:** A stable workboat with cable reels, diagnostic booms, a replacement beacon rack, and a forward universal docking collar.
- **Heavy — gate tug:** A dense high-thrust block around a massive clamp frame. Add articulated push arms, redundant drives, and protected crew/workshop volume; weapons are secondary emergency fittings.
- **Frigate — network repair ship:** A compact mobile depot with multiple work bays, long crane rails, relay control tower, spare modules, and tug berths. It coordinates a repair operation rather than dominating a battle.
- **Freighter — mobile gate yard:** A colossal open truss carrying spare ring segments, relay masts, fuel, cable drums, workshops, and docked tugs. Its cargo is visibly infrastructure-scale. It must be one of the broadest station-exterior silhouettes in the game.

## 5. Non-Banner traffic families

These are present in the runtime model catalog even though they are not two additional members of the Ten Banners. They still need coherent rebuilds.

## 5.1 Independent — every ship has a previous life

**Fleet DNA:** commercially available frames, secondhand modules, practical field repairs, neutral grays, occasional old faction parts, and warm universal navigation lights. Independent does not mean random junk.

- **Light:** Personal shuttle or prospecting boat with one obvious owner-driven modification.
- **Ace:** A unique hot rod whose silhouette grows from a recognizable civilian chassis.
- **Cutter:** Escort, smuggler, or salvage tug with clamps and modular mission pods.
- **Heavy:** Hired escort built by reinforcing a commercial work hull around a serious drive and weapon package.
- **Frigate:** Rare consortium or settlement defense ship assembled from compatible surplus sections, with a clear shared command spine.
- **Freighter:** The baseline bulk hauler—huge standardized containers around an old tug core, visibly serviced by small craft and always externally berthed.

## 5.2 Hollow Reach — the last watch in the dark

**Fleet DNA:** sealed and shuttered hulls, dusk-mauve and dark metal, wrap panels, long listening masts, dish ears, minimal dim lighting, and patient station-keeping. Treat this as deep-rim regional equipment, not a formal nation or secret villain fleet.

- **Light:** A sealed listening skiff with one oversized sensor ear and almost no windows.
- **Ace:** A narrow watch-runner with folded sensor vanes and a very low emission profile.
- **Cutter:** A patient picket with docking collar hidden behind shutters and multiple passive arrays.
- **Heavy:** A compact watch post with armored sensor roots and only a few protected defensive apertures.
- **Frigate:** A long-range vigil ship with redundant listening spines, shuttered bays, and a small command lantern buried inside the hull.
- **Freighter:** A deep-rim provision carrier with shielded holds, fuel bladders, and sensor masts carried far from the noisy drives; enormous, slow, and externally serviced.

## 6. Modeling and review deliverables

Each faction rebuild should be approved as a six-ship family before implementation.

For every family, provide:

1. One orthographic scale sheet showing the Player ship and all six classes in side and top view.
2. One black-silhouette sheet with no materials or lights. Class and faction must still be identifiable.
3. A material sheet identifying hull, secondary structure, emissive, transparent, and animated surfaces.
4. A neutral-pose turntable for each ship.
5. A close fly-by test with the Player ship beside the frigate and freighter.
6. An exterior station-berthing composition proving the freighter cannot fit through an internal bay.

### Runtime asset requirements

- Separate emissive geometry/material from opaque hull geometry.
- Separate articulated or deforming parts with named pivots.
- Supply a simple collision proxy that follows the primary mass, excluding thin antennae, tendrils, cranes, and field wakes.
- Supply at least three LODs. Freighters need an additional long-distance silhouette LOD because they should be visible from far away.
- Preserve one consistent root scale. Do not repair class hierarchy with arbitrary scene-level scaling after export.
- Keep docking hardpoints, bridge/cabin scale cues, engine/propulsion region, and forward direction documented in the asset metadata.

## 7. Acceptance tests

A ship family is ready only when all of these are true:

- At thumbnail size, a reviewer can sort all six ships by class without color.
- In grayscale, a reviewer can sort ships by faction from silhouette and construction logic.
- Beside the Player ship, the frigate reads as roughly 4–5.5 P and the freighter as roughly 10–14 P.
- A freighter composition makes internal station docking visually impossible and shows its exterior transfer method.
- The smallest repeated doors/windows/rails stay the same physical size across light, frigate, and freighter models.
- The model tells the faction story without flags, readable text, or borrowed science-fiction franchise shapes.
- Beautiful Ones ships look alive in neutral pose; Unknowables remain coherent without a hull; all built ships expose plausible maintenance and docking logic.

