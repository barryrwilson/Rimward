"""Beautiful Ones Freighter - GARDENBACK MIGRATION VESSEL.

Bible §4.6: "A colossal living carrier whose back and ventral folds support
symbiotic gardens, nursery hollows, and sheltered companion spaces. Slow
breathing must travel across separate body regions. Its body should dwarf
stations' ordinary berths and accept external cradle branches rather than
enter a hangar."

Reference plate (docs/SpaceShipIdeas/reference-images/beautiful-ones/
beautiful-freighter-gardenback.png): a migrating ecosystem on the body of a
colossal whale-manta. The plate's dense coral is simplified to game scale:
a few LARGE readable ridge swells per biome, and the plate's dozens of
hollows and juveniles are bounded to the implementation's counts, with
nearby companions carrying the living-migration scale cue.

Envelope (driver): l = 85.0, b = 46.75, h = 25.5. Authored largest
dimension ~83.5 world units (spanZ, crown tips to tail whip tip; SHIP_SCALE
freighter span band [66.00, 109.20]; fleet ladder: largest, >> frigate
~29.0). The driver's engine-glow sphere sits at the stern (z = +l*0.47 =
+39.95); the tail loft tapers to a whip tip at z = +39.5 so the glow reads
as the body's own bioluminescent wake, never an exhaust. (Measured numbers
are filled in by the orchestrator after bake.)

Body plan
---------
A colossal blunt whale-manta, the fleet's deep-end sculpt:

- ONE grown main loft ('body-main', indigo living tissue, 18 fair stations):
  a blunt head, a thorax far broader and deeper than the frigate's (max
  half-beam b*0.4385 = 20.5, half-height h*0.4431 = 11.3 just aft of the
  head at l*-0.247), then a long gentle tail taper ending just short of
  the wake glow. No zones, no transom, no drive face.
- A second pearl loft ('living-body-swell', 14 fair stations) rides the
  dorsal back with THREE gentle crests — one under each garden biome —
  separated by bare breathing-gap dips, so the three biomes read in the
  bare silhouette even at lod3. Its upper half stands proud of the indigo
  body and its lower half is buried — pearl-bone back over indigo flanks,
  two shells deeply interpenetrating (the connectivity is the overlap).
- A swollen pearl brow and an immense indigo throat give the head its
  whale read; the ancient sensory crown (fan 0.9, 14 filaments, deep
  sea-grass arc) erupts through the brow and ends in cool cyan points.
- THREE fin pairs carry the outline: a broad slow wing pair sweeping back
  past the mid-body (span sets the ship's beam, ~76 world units), a second
  smaller pair, and a stabiliser pair aft by the tail — rounded paddles,
  never knife edges.
- THREE separated dorsal GARDEN BIOMES: each is a pearl mass mound
  ('living-body-garden-…', primary mass, all LODs) carrying one
  organs.garden_fold ridge field (2-3 large swells at full detail). Bare
  breathing gaps between the biomes hold the dorsal vent row — the plate's
  "distinct symbiotic zones, not one forest".
- A bounded ROW of deep violet NURSERY HOLLOWS along each flank (three
  starboard, two port — grown, not mirrored): grown irregular lips, some
  nested with juvenile companion craft, one starboard hollow left open
  into shadowed shelter. One ventral nursery and one great protected
  belly chamber under the thorax cover the ventral folds.
- Companion scale cue: up to three tiny free companion craft graze the
  hull (bellies piercing the skin — no floating islands) beside the
  nested nursery young.
- The ONE deliberate functional asymmetry: a healed scar welt crossing the
  PORT upper forward flank (an.healed_scar), pale healed tissue sweeping
  up across the fold. Garden lateral offsets and nursery occupancy also
  vary region to region, but the scar is the named mark.

LOD ladder and per-LOD triangle budget plan MEASURED 2026-08-14 (measure-ships, gltf-transform tri count; wave-8 left this class RED on lod1 29000/24000, lod2 13808/8000, lod3 8132/4000, so the low-detail branches trim organs FIRST and never the silhouette):

- lod0 (detail 3), cap 60000 — MEASURED verts 79980; tris 47956/21268/7412/3024 (~52000 total, ~44000 hull + ~8000 emissive): full build — 6 nursery hollows with 7 nested young,
  3 free companions, 12 vents with breath glows in four separated body
  regions, 4 fold creases with lips + 4 vein fans, 3 gardens x 3 swells
  with fronds and cyan buds, crown of 14, 5 flow lines at full path
  density, scar with swells, fin lofts at full rings with spanwise flow
  lines. Hull verts MEASURED ~88000 (band [34000, 154000]).
```
  density, scar with swells, fin lofts at full rings with spanwise flow
  lines. Hull verts ~88000 (band [34000, 154000]).
- lod1 (detail 2), cap 24000 — plan ~21500 (target <=22800): hollows thin
  to 5 shells / 4 nested (lip beads 10 -> 8), free companions 3 -> 1,
  vents 12 -> 9 without breath glow, lower crease pair drops, crease
  pitch widens, vein branches halve, gardens 2 swells per biome without
  buds, fin lofts 10 rings x 8 radial, head and garden masses seg 12.
- lod2 (detail 1), cap 8000 — plan ~7200 (target <=7600): crown 14 -> 4,
  fin lofts 9/7 rings x 6 radial with one centreline flow line, crease
  floors only (no lips) shortened to the mid 60 % of the run, one vein
  branch per fan, one garden swell per biome, nurseries 2 occupied plus
  the ventral well, vents 4 dark bowls, flow lines 3 lines decimated to
  every second point, scar a single chord, belly pouch + mouth.
- lod3 (detail 0), cap 4000 — plan ~2800 (target <=3800): primary masses
  only — the two grown lofts, brow and throat, the three garden mass
  pearls, the six fin lofts (7-9 rings x 5 radial — the wing pair keeps
  one extra ring step so the outline never moves), the belly pouch, 3
  hollow wells with 2 nested young, single-chord flow lines. Crown,
  vents, veins, creases, scar and free companions drop out (the
  constructs return nothing at detail 0); the colossal silhouette — wing
  sweep, three garden crests in the swell loft, blunt brow over dark
  throat, long whip tail into the wake glow — survives.

Connectivity: every separate volume pierces the hull or another seated
part — fin roots are given inside the body, the swell interpenetrates the
main loft along its full run, garden mounds bury 40 % into the swell
crown, hollow wells are flush-well idioms sunk inboard from skins sampled
with sf.flank_x / sf.bottom_y at their OWN stations, companions pierce
the mouth planes and the belly/flank skins, the brow/throat overlap the
head run, the crown root sits inside the brow mass, and every path
endpoint is pulled inboard to bury. No typed y fractions anywhere: every
anchor is read off the station lists through sf.* queries or the surf_*
factories.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf
from . import anatomy as an
from . import organs as org


# ===========================================================================
# STATION LISTS
# ===========================================================================

def _main_stations(l, b, h):
    """Main grown-body loft stations: blunt head, thick thorax, whip tail.

    All sections are sf.fair near-ellipses (k = 0.49 at the kit clamp): a
    swollen living section with no flat face and no corner. Nose cap at
    l*-0.500 = -42.5; thickest just aft of the head at l*-0.247 = -21.0
    (half-beam b*0.4385 = 20.5, half-height h*0.4431 = 11.3); tail tip at
    l*+0.465 = +39.5, just short of the driver's wake glow at +39.95.
    y_offset stays small and positive so the vertex centroid stays near the
    origin under the idle breathing scale.
    """
    return [
        # -- HEAD: blunt manta rostrum, swelling fast aft --
        sf.fair(l * -0.500, b * 0.075, h * 0.094, h * 0.024),  # nose cap
        sf.fair(l * -0.471, b * 0.193, h * 0.216, h * 0.020),
        sf.fair(l * -0.424, b * 0.299, h * 0.314, h * 0.014),
        sf.fair(l * -0.365, b * 0.374, h * 0.384, h * 0.010),
        # -- THORAX: thickest just aft of the head, then a slow fall --
        sf.fair(l * -0.306, b * 0.417, h * 0.424, h * 0.008),
        sf.fair(l * -0.247, b * 0.439, h * 0.443, h * 0.008),  # max section
        sf.fair(l * -0.176, b * 0.428, h * 0.431, h * 0.010),
        sf.fair(l * -0.106, b * 0.396, h * 0.400, h * 0.012),
        sf.fair(l * -0.035, b * 0.353, h * 0.361, h * 0.014),
        sf.fair(l *  0.035, b * 0.310, h * 0.322, h * 0.014),
        sf.fair(l *  0.106, b * 0.267, h * 0.282, h * 0.012),
        # -- TAIL: the long taper that ends at the wake glow --
        sf.fair(l *  0.176, b * 0.225, h * 0.243, h * 0.010),
        sf.fair(l *  0.235, b * 0.188, h * 0.208, h * 0.008),
        sf.fair(l *  0.294, b * 0.150, h * 0.173, h * 0.006),
        sf.fair(l *  0.341, b * 0.118, h * 0.141, h * 0.004),
        sf.fair(l *  0.388, b * 0.086, h * 0.110, h * 0.002),
        sf.fair(l *  0.429, b * 0.056, h * 0.078, h * 0.000),
        sf.fair(l *  0.465, b * 0.026, h * 0.043, h * 0.000),  # whip tip
    ]


def _swell_stations(l, b, h):
    """Pearl dorsal swell stations: the garden-carrying back, THREE crests.

    A second grown loft whose upper half stands proud of the main body's
    crown and whose lower half is buried deep inside it — the pearl-bone
    back emerging from the indigo flanks. The crest line rises under each
    of the three garden biomes (peaks at l*-0.19, l*-0.03 and l*+0.10) and
    sags in the two bare breathing gaps between them, so the separated
    biomes read in the bare loft even when garden_fold detail drops out at
    lod3. Runs from just aft of the head (l*-0.447 = -38.0) to mid-tail
    (l*+0.365 = +31.0), where it fades flush into the taper. Both end caps
    sit inside the main body.
    """
    return [
        sf.fair(l * -0.447, b * 0.118, h * 0.086, h * 0.231),  # aft of head
        sf.fair(l * -0.388, b * 0.193, h * 0.118, h * 0.310),
        sf.fair(l * -0.318, b * 0.250, h * 0.138, h * 0.352),
        sf.fair(l * -0.247, b * 0.272, h * 0.150, h * 0.368),  # FORE crest
        sf.fair(l * -0.190, b * 0.276, h * 0.152, h * 0.366),  #   (garden 1)
        sf.fair(l * -0.130, b * 0.258, h * 0.132, h * 0.320),  # gap 1 dip
        sf.fair(l * -0.065, b * 0.240, h * 0.138, h * 0.350),
        sf.fair(l *  0.000, b * 0.222, h * 0.134, h * 0.352),  # MID crest
        sf.fair(l *  0.060, b * 0.190, h * 0.105, h * 0.290),  # gap 2 dip
        sf.fair(l *  0.100, b * 0.168, h * 0.112, h * 0.315),  # AFT crest
        sf.fair(l *  0.165, b * 0.133, h * 0.086, h * 0.240),
        sf.fair(l *  0.235, b * 0.098, h * 0.067, h * 0.169),
        sf.fair(l *  0.306, b * 0.068, h * 0.051, h * 0.129),
        sf.fair(l *  0.365, b * 0.043, h * 0.035, h * 0.102),  # fades flush
    ]


# ===========================================================================
# PATH HELPERS — every point sampled from the station lists, never a typed y
# ===========================================================================

def _flank_path(stations, side, z0, z1, n, y_frac, inset=0.03, bury=0.50):
    """Points riding the flank at a section-following height fraction.

    The ride height is ``yo + y_frac * hh`` re-sampled at every z, so the
    line holds the same fold height through the tapers instead of a typed
    absolute y. ``y_frac`` may be a ``(start, end)`` tuple: the height then
    sweeps along the run — the scar crosses the fold, it does not parallel
    it. Stations where the section has fallen away at that height are
    skipped (flank_x returns 0.0), so the run self-trims; both endpoints
    are pulled ``bury`` inboard so the chain ends inside the body. With
    ``y_frac`` inside the straight-flank band the points ride exactly on
    the skin, half a strut-radius buried along the whole run.
    """
    sweep = isinstance(y_frac, tuple)
    pts = []
    for i in range(n):
        z = z0 + (z1 - z0) * i / (n - 1.0)
        hw, hh, yo, ch = sf.section(stations, z)
        f = (y_frac[0] + (y_frac[1] - y_frac[0]) * i / (n - 1.0)
             if sweep else y_frac)
        y = yo + f * hh
        fx = sf.flank_x(stations, z, y)
        if fx <= inset:
            continue
        pts.append([side * (fx - inset), y, z])
    if pts:
        pts[0][0] -= side * bury
        pts[-1][0] -= side * bury
    return [tuple(p) for p in pts]


def _crest_path(stations, z0, z1, n, bury=0.50):
    """Points riding the swell's crown line; both ends pulled down inboard."""
    pts = []
    for i in range(n):
        z = z0 + (z1 - z0) * i / (n - 1.0)
        sy = sf.top_y(stations, z, 0.0)
        if sy == 0.0:
            continue
        pts.append([0.0, sy, z])
    if pts:
        pts[0][1] -= bury
        pts[-1][1] -= bury
    return [tuple(p) for p in pts]


def _vent_row_top(stations, x, z_list):
    """Dorsal vent mouth centres sampled on the swell skin at offset ``x``."""
    return [(x, sf.top_y(stations, z, x), z) for z in z_list]


def _vent_row_bottom(stations, x, z_list):
    """Ventral vent mouth centres sampled on the belly skin at offset ``x``."""
    return [(x, sf.bottom_y(stations, z, x), z) for z in z_list]


def _vent_row_flank(stations, side, y, z_list):
    """Flank vent mouth centres sampled on the side skin at height ``y``."""
    pts = []
    for z in z_list:
        fx = sf.flank_x(stations, z, y)
        if fx <= 0.0:
            continue                    # section fell away — never a float
        pts.append((side * fx, y, z))
    return pts


# Garden biomes: name, lateral offset, mound centre z, mound radii, and the
# z-span the ridge field is scattered over. Grown, not mirrored: each biome
# sits at its own offset with its own mass.
_GARDENS = (
    ('fore', 0.053, -0.190, (1.8, 0.60, 3.0), -0.224, -0.147),
    ('mid', -0.096, -0.033, (1.5, 0.52, 2.4), -0.065, 0.000),
    ('aft', 0.075,  0.100, (1.2, 0.45, 2.0),  0.071, 0.129),
)


def _mound_surf(swell, gx, gz, gr):
    """callable(z) -> crown height of one garden mound at (``gx``, z).

    The mound is an ellipsoid seated 40 % into the swell crown; the closure
    answers its upper ellipse and returns 0.0 off the mound's z-extent, so
    a garden_fold scattered over a wider span self-trims to the mound —
    the ridge swells grow OUT OF the folded pearl tissue, never hover
    beside it. Returns None when the mound seat itself fell off the back.
    """
    seat = sf.top_y(swell, gz, gx)
    if seat == 0.0:
        return None
    cy = seat - gr[1] * 0.4

    def at(z):
        f = 1.0 - ((z - gz) / gr[2]) ** 2
        if f <= 0.0:
            return 0.0
        return cy + gr[1] * math.sqrt(f)

    return at


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones gardenback migration vessel (freighter).

    parts / glow -- object lists the driver joins into RIMWARD_HULL and
                    RIMWARD_EMISSIVE.
    l, b, h      -- class envelope 85.0 x 46.75 x 25.5.
    detail       -- 3 (lod0) … 0 (lod3); the per-LOD plan is in the module
                    docstring.
    """
    d = min(max(int(detail), 0), 3)
    stations = _main_stations(l, b, h)
    swell = _swell_stations(l, b, h)

    # -- PRIMARY MASSES -----------------------------------------------------
    # The one grown body: indigo living tissue.
    sf.grown_loft(parts, 'body-main', kit.ROLE_HULL, stations, hull_mat)
    # The pearl-bone back: a second loft interpenetrating the first, its
    # three crests carrying the separated garden biomes.
    sf.grown_loft(parts, 'living-body-swell', kit.ROLE_ARMOUR, swell, hull_mat)
    # Whale head: blunt pearl brow over an immense dark indigo throat, both
    # deeply overlapping the nose run (kit.sphere takes RADII per axis).
    head_segs = {3: 16, 2: 12, 1: 8, 0: 8}[d]
    kit.sphere(parts, 'living-body-brow', kit.ROLE_ARMOUR,
               (0.0, h * 0.115, l * -0.406), (b * 0.260, h * 0.290, l * 0.105),
               hull_mat, segments=head_segs)
    kit.sphere(parts, 'body-throat', kit.ROLE_HULL,
               (0.0, h * -0.160, l * -0.388), (b * 0.260, h * 0.240, l * 0.110),
               hull_mat, segments=head_segs)
    # Garden biome mounds: folded pearl tissue the ridge swells grow from —
    # primary mass, present at every LOD so the three separated biomes
    # survive to lod3. Each buries 40 % into the swell crown at its own
    # station (grown lateral offsets, never mirrored).
    for gtag, gxf, gzf, gr, _gz0, _gz1 in _GARDENS:
        gy = sf.top_y(swell, l * gzf, b * gxf)
        if gy == 0.0:
            continue
        kit.sphere(parts, 'living-body-garden-%s' % gtag, kit.ROLE_ARMOUR,
                   (b * gxf, gy - gr[1] * 0.4, l * gzf), gr, hull_mat,
                   segments=head_segs)

    # -- SENSORY CROWN: ancient and wide, erupting through the brow ---------
    # Root inside the brow mass; long filaments fan forward of the nose in a
    # deep sea-grass arc and end in cool cyan points. Fan 0.9 against the
    # default 0.34, count 14 (the brow signature — it holds at lod1).
    org.sensory_crown(parts, glow, 'elder', hull_mat, glow_mat,
                      (0.0, h * 0.071, l * -0.498),
                      forward=(0.0, 0.12, -1.0), fan=0.9, count=14,
                      detail=d, seed=5, arc=0.30)

    # -- FIN SET: the outline (broad slow wing pair, second pair, aft pair) -
    # Roots are given INSIDE the body; the wing tips carry the beam to ~76
    # world units. Below detail 2 the bead override trims ring density
    # (rings = 2 * beads + 3, same roots, same tips — the paddle reach and
    # the silhouette never move).
    fin_beads = (None, None, None) if d >= 2 else (3, 2, 2)
    for side, tag in ((1.0, 's'), (-1.0, 'p')):
        an.fin_membrane(parts, 'fin-wing-%s' % tag, hull_mat,
                        (side * b * 0.150, h * 0.039, l * -0.330),
                        (side * b * 0.813, 0.0, l * -0.035),
                        root_chord=l * 0.200, tip_chord=l * 0.053,
                        thick=0.55, detail=d, flow=3,
                        beads=fin_beads[0], seed=11)
        an.fin_membrane(parts, 'fin-mid-%s' % tag, hull_mat,
                        (side * b * 0.128, h * 0.020, l * -0.094),
                        (side * b * 0.642, h * -0.020, l * 0.141),
                        root_chord=l * 0.118, tip_chord=l * 0.035,
                        thick=0.40, detail=d, flow=2,
                        beads=fin_beads[1], seed=23)
        an.fin_membrane(parts, 'fin-aft-%s' % tag, hull_mat,
                        (side * b * 0.086, h * 0.012, l * 0.165),
                        (side * b * 0.385, h * -0.020, l * 0.353),
                        root_chord=l * 0.082, tip_chord=l * 0.024,
                        thick=0.30, detail=d, flow=2,
                        beads=fin_beads[2], seed=37)

    # -- GARDEN FOLDS: three separated biomes on the pearl back -------------
    # Each biome's ridge field grows out of its own mound through the
    # mound-crown callback (self-trimming to the mound's z-extent), at its
    # own lateral offset. The BARE GAPS between the z-ranges are where the
    # dorsal breathing vents sit — the plate's distinct symbiotic zones,
    # not one forest.
    for k, (gtag, gxf, gzf, gr, gz0, gz1) in enumerate(_GARDENS):
        gsurf = _mound_surf(swell, b * gxf, l * gzf, gr)
        if gsurf is None:
            continue
        org.garden_fold(parts, glow, 'garden-%s' % gtag, hull_mat, glow_mat,
                        l * gz0, l * gz1, gsurf,
                        x=b * gxf, detail=d, seed=41 + 12 * k)

    # -- BREATHING VENTS: rows in FOUR separated body regions ---------------
    # Dorsal row in the calm gap between the fore and mid gardens, on the
    # swell skin; flank rows aft (starboard) and forward (port); a ventral
    # row beside the belly chamber. Breath travels across the whole body.
    # Row lengths count down below detail 2; the organ halves again at
    # detail 1 (four dark bowls carry the read at lod2).
    vent_keep = {3: (3, 3, 3, 3), 2: (3, 2, 2, 2), 1: (2, 1, 1, 1),
                 0: (0, 0, 0, 0)}[d]
    vent_rows = (
        ('vents-dorsal', 'y', _vent_row_top(swell, b * 0.150,
                                            [l * -0.146, l * -0.118,
                                             l * -0.089])),
        ('vents-flank-s', 'x', _vent_row_flank(stations, 1.0, h * 0.078,
                                               [l * 0.047, l * 0.094,
                                                l * 0.141])),
        ('vents-belly', 'y', _vent_row_bottom(stations, b * -0.128,
                                              [l * -0.153, l * -0.124,
                                               l * -0.094])),
        ('vents-flank-p', 'x', _vent_row_flank(stations, -1.0, h * -0.039,
                                               [l * -0.271, l * -0.241,
                                                l * -0.212])),
    )
    for (vname, vface, vpts), vkeep in zip(vent_rows, vent_keep):
        if not vkeep:
            continue
        org.breathing_vents(parts, glow, vname, hull_mat, glow_mat,
                            (0.0, 0.0, 0.0), face=vface, detail=d,
                            points=vpts[:vkeep])

    # -- FOLD CREASES + VEIN FANS: the deep folds and their light -----------
    # One upper and one lower crease per flank; each crease carries one
    # branching vein fan rooted in its floor. The lower pair drops below
    # detail 3 and the surviving pair shortens to the mid 60 % of its run
    # at detail 1 — the crease reads as a dark line before it costs lips.
    crease_specs = (
        ('up', h * 0.157, l * -0.259, l * -0.024),   # y +4.0, z -22..-2
        ('lo', h * -0.137, l * -0.188, l * 0.000),   # y -3.5, z -16..0
    )
    crease_rows = 2 if d >= 3 else 1
    for side, stag in ((1.0, 's'), (-1.0, 'p')):
        for ctag, cy, cz0, cz1 in crease_specs[:crease_rows]:
            if d <= 1:
                cmid = (cz0 + cz1) * 0.5
                cspan = (cz1 - cz0) * 0.6
                cz0, cz1 = cmid - cspan * 0.5, cmid + cspan * 0.5
            an.fold_crease(parts, 'fold-%s-%s' % (stag, ctag), hull_mat,
                           cz0, cz1, cy, sf.surf_flank(stations, cy),
                           side=side, detail=d)
            # vein fan: root and tips sampled inside the crease channel
            zmid = (cz0 + cz1) * 0.5
            fxr = sf.flank_x(stations, zmid, cy)
            if fxr <= 0.0:
                continue
            root = (side * (fxr - 0.20), cy, zmid)
            tips = []
            for k in range(6):
                tz = cz0 + (cz1 - cz0) * (k + 0.5) / 6.0
                ty = cy + (0.30 if k % 2 == 0 else -0.30)
                fxt = sf.flank_x(stations, tz, ty)
                if fxt <= 0.12:
                    continue
                tips.append((side * (fxt - 0.12), ty, tz))
            an.vein_fan(parts, glow, 'fold-%s-%s' % (stag, ctag),
                        hull_mat, glow_mat, root, tips, (side, 0.0, 0.0),
                        detail=d)

    # -- FLOW LINES: the pearl/indigo boundary and the garden spine ---------
    # Two long tonal boundary lines per flank, riding section-following
    # heights so they hold through the tapers; one bright crest line along
    # the swell's three-crest crown — the spine connecting the biomes. The
    # lower flank pair rests below detail 2; the survivors decimate at
    # detail 1 and collapse to single buried chords at detail 0.
    flow_n = {3: 13, 2: 9, 1: 7, 0: 5}[d]
    for side, stag in ((1.0, 's'), (-1.0, 'p')):
        an.flow_line(parts, 'flow-%s-up' % stag, hull_mat,
                     _flank_path(stations, side, l * -0.376, l * 0.353,
                                 flow_n, 0.55),
                     detail=d)
        if d >= 2:
            an.flow_line(parts, 'flow-%s-lo' % stag, hull_mat,
                         _flank_path(stations, side, l * -0.353, l * 0.306,
                                     flow_n, -0.50),
                         detail=d)
    an.flow_line(parts, 'flow-crest', hull_mat,
                 _crest_path(swell, l * -0.424, l * 0.341, flow_n),
                 detail=d)

    # -- HEALED SCAR: the one deliberate asymmetry, PORT upper forward flank
    # A pale welt sweeping UP across the fold — healed history, not a wound.
    an.healed_scar(parts, 'scar-port', hull_mat,
                   _flank_path(stations, -1.0, l * -0.235, l * -0.106,
                               7, (0.14, 0.44), inset=0.02),
                   thick=0.08, detail=d)

    # -- BELLY CHAMBER: the great protected pouch under the thorax ----------
    belly_z = l * -0.188
    belly_skin = sf.bottom_y(stations, belly_z, 0.0)
    pouch_half_h = 5.2 * 0.5
    org.belly_chamber(parts, glow, 'thorax', hull_mat, glow_mat,
                      (0.0, belly_skin - pouch_half_h + 0.5, belly_z),
                      (9.0, 5.2, 11.0), detail=d)

    # -- NURSERY HOLLOWS: the flank row and the ventral berth ---------------
    # A bounded row of deep violet hollows with grown irregular lips runs
    # along each flank — three starboard, two port, staggered in z and
    # height because the row is grown, not machined. Occupancy varies per
    # hollow and counts down with detail; 'nursery-s3' is always left OPEN
    # into shadowed shelter (its dim glow panel reads at detail 2+). Every
    # loc is sampled on the skin at its own station; ``min_d`` is the last
    # LOD the hollow survives to (inclusion is monotonic down the ladder).
    nursery_specs = (
        # name, side, mouth y, mouth z, occupants (d3, d2, d1, d0), min_d
        ('nursery-s1', 1.0, h * -0.078, l * -0.130, (2, 2, 1, 1), 0),
        ('nursery-s2', 1.0, h * -0.059, l * -0.024, (1, 1, 1, 1), 0),
        ('nursery-s3', 1.0, h * -0.039, l *  0.082, (0, 0, 0, 0), 2),
        ('nursery-p1', -1.0, h * -0.070, l * -0.106, (2, 1, 0, 0), 2),
        ('nursery-p2', -1.0, h * -0.051, l *  0.047, (1, 0, 0, 0), 3),
    )
    for k, (nname, nside, ny, nz, occs, min_d) in enumerate(nursery_specs):
        if d < min_d:
            continue
        occ = occs[3 - d]
        fx = sf.flank_x(stations, nz, ny)
        if fx <= 0.0:
            continue
        org.nursery_hollow(parts, glow, nname, hull_mat, glow_mat,
                           (nside * fx, ny, nz), face='x', occupants=occ,
                           detail=d, seed=101 + 17 * k)
    # Ventral nursery seated on the belly skin — present at every LOD
    # (a bare well at lod3), occupied only at lod0.
    vn_x, vn_z = b * 0.150, l * 0.012
    org.nursery_hollow(parts, glow, 'nursery-ventral', hull_mat, glow_mat,
                       (vn_x, sf.bottom_y(stations, vn_z, vn_x), vn_z),
                       face='y', occupants=1 if d >= 3 else 0,
                       detail=d, seed=191)

    # -- FREE COMPANIONS: the living-migration scale cue --------------------
    # Tiny young wayfinders grazing the colossal hull. Every one is seated
    # with its belly PIERCING a skin sampled at its own station — 0.08 of
    # bite — so no companion ever floats as an island. The flank pair is
    # full-detail only; the belly grazer holds to lod1.
    free_specs = (
        ('school-belly-aft',
         (b * -0.100,
          sf.bottom_y(stations, l * 0.060, b * -0.100) + 0.08,
          l * 0.060), 2),
        ('school-flank-s',
         (sf.flank_x(stations, l * -0.165, h * -0.020) - 0.08,
          h * -0.020, l * -0.165), 3),
        ('school-flank-p',
         (-(sf.flank_x(stations, l * -0.300, h * -0.060) - 0.08),
          h * -0.060, l * -0.300), 3),
    )
    for fname, floc, min_d in free_specs:
        if d < min_d:
            continue
        org.companion_craft(parts, glow, fname, hull_mat, glow_mat,
                            floc, detail=d)
