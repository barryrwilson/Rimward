# RIMWARD gap analysis — current faction art against the reference corpus

Method: the lead viewed `docs/FactionExamples/overview-ships.jpg` and the individual renders
`01-veridian-combine-ship.png`, `02-ferrous-hegemony-ship.png`, and `08-assembly-ship.png`, then
compared them against the 350+ reference images cataloged in `../catalog/`.
Accessed: 2026-08-12

---

## 1. What the current concept art already does well

- Every faction render carries one clear silhouette family. Veridian is a stepped slab, Ferrous is
  a segmented cigar, Assembly is a spine with radial fans, Beautiful Ones is a manta.
- Colour habits are disciplined. Veridian uses green light on dark metal, Ferrous uses red-brown
  stripe on grey, Assembly uses teal light with orange patch panels, Lamplighter uses yellow and blue.
- Scale escorts appear in most frames. Small craft beside the main hull give an immediate size read.

## 2. Gaps, with the evidence behind each

### G1. Detail density is uniform. The band rule is missing.
Veridian, Ferrous, and Assembly all carry medium-frequency box greeble along the entire hull.
The reference corpus says the opposite: Pride of Hiigara keeps 75 % of the hull calm; Galactica
keeps flanks calm and uses one rib rhythm; Donnager keeps radiator fins flat.
**Fix:** define one service band per hull, 20–30 % of the length or one flank stripe. Move all
hangars, windows, catwalks, and antennas into it. Flatten everything outside it.

### G2. Silhouettes are all longitudinal boxes. The outline does not break.
Six of ten faction ships are a long box with surface relief. In the corpus, the ships that read at
distance break the outline with a few large elements: Galactica flight pods, Donnager fins,
Serenity nacelles, Sulaco hung pods, Rifter twin booms.
**Fix:** give each faction one outline-breaking element of at least 15 % of hull length:
Ferrous — armour rib flare; Veridian — cargo cradle wings; Red Ledger — salvage boom;
Lamplighter — gate-arm fork; Assembly — radial module fans (already present, keep and enlarge).

### G3. Thermal and propulsion systems are not visible.
No current render shows radiators, a shielded reactor face, or a real nozzle count. The NASA OTV
and nuclear-shuttle boards (N-105, N-106, N-116) show why this matters: a flat annular shield disk
and flat radiator panels are the cheapest way to make a hull read as a working machine.
**Fix:** every `heavy`, `frigate`, and `freighter` gets flat radiator panels that break the outline
and a distinct drive face with a countable nozzle group (2, 4, 6, or 8, never a vague glow).

### G4. Scale cues are decorative, not systematic.
Window rows change size between renders. There is no repeated human module and no lettering.
**Fix:** adopt the fleet-wide human module from the synthesis file — 2.0 m door, 0.8 m window,
1.1 m rail, one marker light per 8 m — and paint a registry code at constant letter height on
every hull. This alone will separate `frigate` from `freighter` at combat distance.

### G5. Nothing is nested inside anything.
The single clearest scale image in the whole corpus is the Anvil Carrack with a rover on its ramp.
No RIMWARD render shows a bay with content.
**Fix:** each `freighter` gets one open bay with a container or a shuttle modelled inside it. Each
`frigate` gets one visible berth with a docked `light`.

### G6. Construction logic is not yet faction-specific.
Veridian, Ferrous, Assembly, Lamplighter, and Congregation all currently read as "plated hull with
boxes". The corpus shows four distinct logics: exposed frame, closed shell, repeated module, grown body.
**Fix, per faction:**
| Faction | Logic | Signature to model |
|---|---|---|
| Veridian Combine | Closed shell, machined | Inset recess lighting only; no surface pipes; large flush plates |
| Ferrous Hegemony | Repeated module, armoured | 20–40 armour ribs at even pitch; turret modules repeated on a rail |
| Freehold Compact | Exposed frame | Open trusses between two solid volumes; mismatched plate colours |
| Red Ledger | Exposed frame, salvage | Cut-and-welded seams; captured parts of other factions bolted on |
| Gilded Chain | Closed shell, ornament | One continuous curve; edge-only precious trim; long thin light lines |
| Beautiful Ones | Grown body | No panel lines; flow-line detail; lights on the flow lines |
| Unknowables | Field body | Stable envelope with implied structure; light without a lamp |
| Assembly | Repeated module | One part, many copies, radial and linear arrays; visible joints |
| Congregation | Repeated module, ritual | Stacked reliquary cans; procession of identical shrines along a spine |
| Lamplighter Guild | Exposed frame, utility | Gantries, cable runs, work lights, and clamp arms |

### G7. Class hierarchy is not yet visible in the art.
The renders show similar hull lengths across factions. The Design Bible sets
`ace ≈ light < cutter < heavy < frigate << freighter`, and the mission-architecture boards
(N-107, N-116) show how real programmes communicate hierarchy: the same schematic scale, with
the tug always smaller than the shuttle, and the shuttle always smaller than the station.
**Fix:** produce one fleet line-up render per faction at true relative scale before modelling.
A freighter must be 10–14 P. If the line-up does not look wrong at first glance, the freighter is too small.

## 3. Build order recommended by the corpus

1. Fix the fleet-wide human module and the light pitch. Everything else depends on it.
2. Block out silhouettes only: three zones, one band, one outline breaker. No greeble yet.
3. Validate at thumbnail size, 64 px wide, in grey. If two factions are confusable, change the
   silhouette family, not the texture.
4. Add function hardware: drive face, radiators, docking collars, bay with content.
5. Add the band detail. Keep the calm areas calm.
6. Add colour: low-chroma field, one accent at 3–8 %, one metal habit if the faction has one.
7. Add light last, under a 5 % emissive budget.

## 4. Reference shortlist per class

| Class | Best references in the corpus | Where |
|---|---|---|
| `light` | Serenity, X-wing, Rifter, tug flight configuration | `catalog/16` S-06, `catalog/10`, `catalog/16` S-09, `catalog/02` N-111 |
| `ace` | Imperial Cutter, Swordfish II, Viper | `catalog/16` S-13, `catalog/13`, `catalog/12` |
| `cutter` | MSFC delta-wing space tug, Millennium Falcon, Carrack | `catalog/02` N-108/N-112, `catalog/16` S-01, S-15 |
| `heavy` | Galactica, Nostromo, octagonal multi-bell engine pod | `catalog/16` S-03, S-05, `catalog/02` N-106 |
| `frigate` | Donnager, Sulaco, Star Destroyer terraces | `catalog/16` S-02, S-12, `catalog/10` index 1 |
| `freighter` | Type-9, Pride of Hiigara, Khar-Kushan, nuclear shuttle boards | `catalog/16` S-04, S-11, S-16, `catalog/02` N-105/N-116 |
