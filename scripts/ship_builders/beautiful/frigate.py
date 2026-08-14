"""Beautiful Ones Frigate - ELDER GUARDIAN.

Bible §4.6: "A large, calm, long-bodied elder with multiple coordinated fin
pairs, sanctuary hollows for small companions, scar history, and a deep
sensory crown. Powerful, but still much smaller than a freighter organism."
Plate: beautiful-frigate-elder-guardian.png — a long calm elder carrying a
community: a shallow uninterrupted pearl arch from a broad forehead into a
tapering back, a deep-hanging indigo belly (a serene whale profile), four
coordinated fin pairs decreasing aft, four grown flank hollows with
juveniles nested forward, a wide slow crown fan, and a stern that DISSOLVES
into its own cyan wake.

Envelope (driver): l = 32.0, b = 12.48, h = 8.32.
Span band [19.20, 44.80]; AUTHORED LARGEST-DIMENSION TARGET ≈ 29.0 (the
body z-span; ladder: heavy 15.5 < frigate 29.0 << freighter 83.2). Hull
vertex band [16 000, 84 000]. spanX 28.93 (wing tips) <= 1.05 * spanZ
28.96 — inside the collision-proxy clamp rule. spanY ≈ 6.7-7.0 (the belly
hang carries it; never collapsed). Measured numbers are filled in by the
orchestrator after bake; the figures below are DESIGN estimates from the
kit primitive costs (wave-8 batch rule: py_compile only).

Body plan
---------
One grown loft, 22 sf.fair near-ellipse stations. Blunt broad forehead
(half-beam b*0.116 at l*-0.385), thickest just aft of the head (half-beam
b*0.236 = 2.95, half-height h*0.396 = 3.29 at l*-0.215). The belly HANGS:
station y-offsets fall to -0.075h amidships while half-heights stay near
0.37-0.40h, so the indigo underside runs at y ≈ -3.7 against a pearl crown
at y ≈ +3.0 — deeper-chested than the smaller classes, the serene whale
profile of the plate. The long taper ends in a wisp at l*+0.455
(half-beam 0.09) so the driver's engine-glow sphere at l*+0.47 reads as the
body's own curled cyan wake, never an exhaust. A second shallow fair loft
rides the back from forehead to mid-tail — the uninterrupted pearl arch,
half the local half-beam wide, buried 0.45 into the body and standing 0.30
proud — so the tonal split is two grown masses meeting, never paint.

FOUR coordinated fin pairs carry the outline, decreasing aft: the vast
forward wing pair (span 28.93, the manta silhouette), then mid, aft and
tail pairs, each a welded path-loft flipper with a seeded sag and a rounded
paddle tip, three spanwise flow lines at full detail. Roots are derived
from the station list (0.35 of the local half-beam) so the burial is the
connectivity.

EXACTLY FOUR flank hollows at absolute sf.HOLLOW size (a bigger ship
carries more hollows, never bigger ones): TWO forward NURSERY hollows (one
per flank) each holding one visibly nested juvenile companion, TWO aft
SANCTUARY hollows, darker and open (no glow panel). Every hollow gets its
own seed so the grown lip rings are irregular chambers, never a repeated
circular stamp of manufactured bays. Mouth centres are seated ON the skin
with sf.flank_x at y = 0.

Deep ancient crown: 14 filaments at detail 3 in a wide slow fan (fan disc
1.5x default, arc 0.32) sweeping up-forward from inside the forehead, cyan
tip droplets held away from the face. Fine blue nerves and vent lights
collect UNDER the dorsal overhang: the vein fans live inside the fold
creases (belly, lower, overhang), the vent row rides the upper flank at
0.62 of the local half-height, and the pearl back stays calm. Scar
history: THREE pale healed ridges together on the upper port flank, short
parallel welts climbing as they run aft — the class's one deliberate
asymmetry (bible rule 8). Eyes are omitted (concept-art artifact).

Estimated budgets MEASURED 2026-08-14 (from measure-ships, gltf-transform tri count):
lod0 (detail 3): MEASURED verts 73152; tris 41132/20636/6756 ≈ 41k tris / ≈ 18-22k verts — inside [16 000, 84 000] and under the 60 000 lod0 tri cap.
lod1 (detail 2): MEASURED ≈ 19.8k tris vs the 24 000 cap (vents 6/flank, lip rings 8, fan branches halved, fold pitch 1.80).
lod2 (detail 1): MEASURED ≈ 6.0-6.4k tris vs the 8 000 cap (target ≤ 7 600).
Wave 8 left lod2 RED at 11 068; the levers used here, in order:
  1. fin loft ring density: beads=2 at detail 1/0 (7 rings ≈ 108 tris per
     flipper instead of the old bead chains), one flow line at detail 1;
```
     flipper instead of the old bead chains), one flow line at detail 1;
  2. hollow lip beads: aft sanctuary hollows drop to detail-0 wells at
     lod2 (dark open mouths — the plate reads them darker anyway); the
     forward nurseries keep well + 6 grown lip beads + nested juveniles;
  3. crown filament count: 4 at detail 1 (the organ's own ladder);
  4. vent row: 6 points passed at detail ≤ 2 (the organ halves again at
     detail 1 → 3 bowls per flank);
```
  5. crest-margin flow lines reduce to single chords at detail 1;
  6. fold creases lose their lips at detail 1 (organ ladder), vein fans
```
  6. fold creases lose their lips at detail 1 (organ ladder), vein fans
     fall to one branch each.
```
  Silhouette (loft, arch, eight flippers, four hollow mouths) is NEVER
  trimmed at any detail level.

LOD ladder
----------
detail=3  full build: everything above (fans 6 branches with nodes, vents
          with breath glow, creases at 0.80 pitch with lips, scars with
          swell spheres, companions at detail 2, crown of 14)
detail=2  constructs self-thin: crease pitch 1.80, fan branches halved,
          vent glow off and 6 per flank, scar swells off, companions at
          detail 1, lip rings of 8
detail=1  primary masses + key anatomy: fins beads=2 with one flow line,
          crease floors only, fans one branch, 3 vent bowls per flank,
          crown of 4, scars as single chords, margin chords, nurseries
          keep lips + juveniles, aft hollows as dark wells
detail=0  primary masses only: body loft, pearl arch loft, the eight fin
          membranes (beads=2), hollow wells and companion bodies
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import anatomy as an
from . import organs as org


# ===========================================================================
# STATION LIST
# ===========================================================================

def _frigate_stations(l, b, h):
    """Hull loft stations for the elder guardian.

    sf.fair near-ellipse sections throughout - a grown body shows no flat
    face and no corner. Nose at l*-0.450 = -14.40; broad forehead at
    l*-0.385; thickest just aft of the head at l*-0.215 (half-beam
    b*0.236 = 2.95, half-height h*0.396 = 3.29). The y-offsets sag to
    -0.075h amidships while the half-heights stay deep: the belly hangs at
    y ≈ -3.69 against a crown at y ≈ +2.98, spanY ≈ 6.7 before the arch —
    the deep serene whale profile, and the spanY-collapse guard. Long even
    taper dissolving to a wisp at l*+0.455 = +14.56, just short of the
    driver's stern glow at l*+0.47 = +15.04. Body spans: z 28.96 (the max
    span bar the wing tips), x 5.9, y ~6.7.
    """
    return [
        # -- HEAD: the broad forehead swelling out of a blunt nose --
        sf.fair(l * -0.4500, b * 0.005, h * 0.010, h *  0.000),   # nose tip
        sf.fair(l * -0.4350, b * 0.030, h * 0.060, h *  0.005),
        sf.fair(l * -0.4125, b * 0.070, h * 0.130, h *  0.010),
        sf.fair(l * -0.3850, b * 0.116, h * 0.205, h *  0.010),   # forehead
        sf.fair(l * -0.3500, b * 0.160, h * 0.280, h *  0.005),
        sf.fair(l * -0.3100, b * 0.198, h * 0.335, h * -0.005),
        sf.fair(l * -0.2650, b * 0.222, h * 0.372, h * -0.020),
        sf.fair(l * -0.2150, b * 0.236, h * 0.396, h * -0.038),   # thickest

        # -- BODY: the long calm mid-run, the belly hanging deepest here --
        sf.fair(l * -0.1600, b * 0.232, h * 0.400, h * -0.055),
        sf.fair(l * -0.1050, b * 0.222, h * 0.388, h * -0.068),
        sf.fair(l * -0.0500, b * 0.208, h * 0.368, h * -0.075),   # deepest
        sf.fair(l *  0.0050, b * 0.192, h * 0.344, h * -0.075),
        sf.fair(l *  0.0600, b * 0.176, h * 0.318, h * -0.070),
        sf.fair(l *  0.1150, b * 0.158, h * 0.288, h * -0.062),
        sf.fair(l *  0.1700, b * 0.138, h * 0.254, h * -0.052),

        # -- TAIL: the long dissolve the wake glow finishes --
        sf.fair(l *  0.2250, b * 0.116, h * 0.216, h * -0.042),
        sf.fair(l *  0.2800, b * 0.094, h * 0.178, h * -0.032),
        sf.fair(l *  0.3300, b * 0.072, h * 0.140, h * -0.024),
        sf.fair(l *  0.3750, b * 0.052, h * 0.104, h * -0.016),
        sf.fair(l *  0.4125, b * 0.034, h * 0.070, h * -0.010),
        sf.fair(l *  0.4400, b * 0.018, h * 0.040, h * -0.005),
        sf.fair(l *  0.4550, b * 0.007, h * 0.016, h *  0.000),   # tail tip
    ]


def _crest_stations(l, h, stations):
    """Pearl-arch loft stations, derived from the body loft.

    The uninterrupted shallow arch of the plate: a second shallow fair loft
    riding the back from the broad forehead to mid-tail, 0.55 of the local
    half-beam wide, h*0.050 (0.42) tall, its underside buried ~0.45 into the
    body at every station so the two grown masses intersect as one volume,
    the arch standing ~0.30 proud. The body's own taper swallows it fore
    and aft, so the arch reads grown, never applied.
    """
    hh_c = h * 0.050
    cap = []
    for (z, hw, hh, yo, _ch) in stations:
        if z < l * -0.3850 or z > l * 0.3000:
            continue
        cap.append(sf.fair(z, hw * 0.55, hh_c, yo + hh - h * 0.014))
    return cap


# ===========================================================================
# FIN SET - the outline (four coordinated pairs, decreasing aft)
# ===========================================================================

# (tag, root z/l, tip x/l, tip y/h, tip z/l, root chord/l, tip chord/l, thick)
_FIN_SPEC = (
    ('wing', -0.2550, 0.4520, -0.075, -0.0550, 0.165, 0.0420, 0.12),
    ('mid',  -0.0200, 0.3260, -0.062,  0.0800, 0.110, 0.0300, 0.10),
    ('aft',   0.1450, 0.2260, -0.050,  0.2150, 0.078, 0.0230, 0.09),
    ('tail',  0.3000, 0.1420, -0.036,  0.3520, 0.052, 0.0160, 0.08),
)


def _fin_set(parts, stations, l, h, hull_mat, detail):
    """Four mirrored fin pairs. Roots are derived from the station list
    (0.35 of the local half-beam, y-offset plus 0.15 of the local
    half-height) so they are ALWAYS inside the hull - the burial is the
    connectivity. Tips are explicit outline points: the wing pair spans
    28.93 (the ship's max span with the body, 0.999 of spanZ - inside the
    proxy clamp rule), each pair smaller and further aft than the last,
    tips swept back and drooping, the flipper loft's own seeded curl
    sagging every membrane so no edge ever reads as a plank.
    """
    for side, stag in ((1.0, 'stbd'), (-1.0, 'port')):
        for i, (tag, rz, tx, ty, tz, rc, tc, th) in enumerate(_FIN_SPEC):
            z_root = l * rz
            hw, hh, yo, _ch = sf.section(stations, z_root)
            root = (side * hw * 0.35, yo + hh * 0.15, z_root)
            tip = (side * l * tx, h * ty, l * tz)
            an.fin_membrane(parts, 'fin-frigate.%s.%s' % (tag, stag),
                            hull_mat, root, tip, l * rc, l * tc,
                            thick=th, detail=detail, flow=3,
                            beads=None if detail >= 2 else 2,
                            seed=70 + i * 2 + (0 if side > 0.0 else 1))


# ===========================================================================
# SANCTUARY + NURSERY HOLLOWS - the elder carrying its community (G5)
# ===========================================================================

def _hollows(parts, glow, stations, l, hull_mat, glow_mat, detail):
    """EXACTLY FOUR flank hollows at absolute sf.HOLLOW size (a bigger ship
    carries MORE hollows, never bigger ones). Per flank: one forward
    NURSERY holding one visibly nested juvenile (its belly pierces the
    mouth plane - the nested-shell rule), one aft SANCTUARY left darker and
    open (no glow panel). Every hollow gets its own seed: irregular grown
    lips, never a perfectly circular repeated row of bays. Mouth centres
    are seated ON the skin with sf.flank_x at y = 0. At detail 1 the aft
    hollows degrade to their dark open wells (detail 0) - the plate reads
    them darker anyway - while the nurseries keep lips and juveniles.
    """
    for side, stag in ((1.0, 'stbd'), (-1.0, 'port')):
        z_fore = l * -0.1450                     # -4.64, hw ~2.9
        loc_fore = (side * sf.flank_x(stations, z_fore, 0.0), 0.0, z_fore)
        org.nursery_hollow(parts, glow, 'frigate.hollow.fore.' + stag,
                           hull_mat, glow_mat, loc_fore, face='x',
                           occupants=1, detail=detail,
                           seed=11 if side > 0.0 else 23)
        z_aft = l * 0.0400                       # +1.28, hw ~2.2
        loc_aft = (side * sf.flank_x(stations, z_aft, 0.0), 0.0, z_aft)
        org.sanctuary_hollow(parts, glow, 'frigate.hollow.aft.' + stag,
                             hull_mat, glow_mat, loc_aft, face='x',
                             detail=0 if detail == 1 else detail,
                             glow_panel=False,
                             seed=37 if side > 0.0 else 41)


# ===========================================================================
# PATH HELPERS - every point sampled from surface queries, never typed y
# ===========================================================================

def _crest_margin_path(stations, cap, side):
    """The pearl/indigo flow-line path: rides the body's back surface just
    outboard of the arch's emergence line, re-sampled at 18 stations. Both
    ends are pulled inboard and down to bury >= 0.10 into the body.
    """
    z0 = cap[0][0]
    z1 = cap[-1][0]
    pts = []
    n = 18
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + (z1 - z0) * t
        x = sf.section(cap, z)[0] + 0.06
        y = sf.top_y(stations, z, x)
        if y <= 0.0:
            continue
        y += 0.02
        if i == 0 or i == n - 1:
            x -= 0.14
            y -= 0.12
        pts.append((side * x, y, z))
    return pts


def _flank_scar_path(stations, side, z0, z1, yf0, yf1, n):
    """A healed-scar welt path riding the flank. The ride height is the
    section y-offset plus a fraction of the LOCAL half-height at every
    sample, so the welt follows the body's taper and its hanging belly;
    points sit 0.02 proud of the skin and both ends are pulled 0.14
    inboard to bury.
    """
    pts = []
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + (z1 - z0) * t
        _hw, hh, yo, _ch = sf.section(stations, z)
        y = yo + (yf0 + (yf1 - yf0) * t) * hh
        fx = sf.flank_x(stations, z, y)
        if fx <= 0.10:
            continue
        x = fx + 0.02
        if i == 0 or i == n - 1:
            x -= 0.14
        pts.append((side * x, y, z))
    return pts


def _vent_points(stations, side, l, y, n):
    """Breath-vent mouth centres ON the flank skin at height ``y``, each
    sampled at its own station with sf.flank_x (a row along a tapering
    flank can never share one x). Stations where the section has fallen to
    a sliver are skipped so no vent floats past the taper.
    """
    pts = []
    z0 = l * -0.2500
    z1 = l * 0.2125
    for i in range(n):
        z = z0 + (z1 - z0) * i / (n - 1.0)
        fx = sf.flank_x(stations, z, y)
        if fx <= 0.30:
            continue
        pts.append((side * fx, y, z))
    return pts


# ===========================================================================
# FOLDS AND VEINS - the elder's deep, calm light, gathered low and under
# the dorsal overhang, never on the calm pearl back
# ===========================================================================

# (tag, ride height as fraction of mid half-height from mid y-offset,
#  z0/l, z1/l) - belly and lower run BELOW the hollow band (mouths span
#  y +/-0.55), the overhang fold runs above the vent row, under the arch.
_FOLD_SPEC = (
    ('belly',    -0.62, -0.2800, 0.1400),
    ('lower',    -0.28, -0.2600, 0.2000),
    ('overhang',  0.72, -0.2400, 0.1400),
)

# (tag, fold height fraction, root z/l, tip z/l tuple) - each fan lives in
# the fold of the same height fraction, roots and tips inset 0.08 into the
# crease channel so sheath ends bury in the floor and walls.
_FAN_SPEC = (
    ('belly.fore', -0.62, -0.2000,
     (-0.2400, -0.2200, -0.1900, -0.1700, -0.1500, -0.1300)),
    ('belly.aft',  -0.62,  0.0200,
     (-0.0100, 0.0100, 0.0400, 0.0600, 0.0900, 0.1200)),
    ('lower',      -0.28, -0.0800,
     (-0.1300, -0.1100, -0.0900, -0.0600, -0.0400, -0.0200)),
    ('overhang',    0.72, -0.1000,
     (-0.1600, -0.1400, -0.1200, -0.0900, -0.0700, -0.0500)),
)


def _folds_and_veins(parts, glow, stations, l, hull_mat, glow_mat, detail):
    """Three long fold-crease runs per flank (belly, lower, overhang), each
    re-sampling its own surf_flank callback so the run self-trims at the
    tapers; four calm vein fans per flank living INSIDE those creases -
    fine blue nerves gathering low on the belly and under the dorsal
    overhang, never covering the calm pearl back.
    """
    _hw, hh_mid, yo_mid, _ch = sf.section(stations, 0.0)
    for side, stag in ((1.0, 'stbd'), (-1.0, 'port')):
        for tag, yf, z0f, z1f in _FOLD_SPEC:
            y = yo_mid + yf * hh_mid
            an.fold_crease(parts, 'frigate.fold.%s.%s' % (tag, stag),
                           hull_mat, l * z0f, l * z1f, y,
                           sf.surf_flank(stations, y), side=side,
                           detail=detail)
        for tag, yf, rzf, tzfs in _FAN_SPEC:
            y = yo_mid + yf * hh_mid
            fx = sf.flank_x(stations, l * rzf, y)
            if fx <= 0.20:
                continue
            root = (side * (fx - 0.08), y, l * rzf)
            tips = []
            for j, tzf in enumerate(tzfs):
                z = l * tzf
                fx = sf.flank_x(stations, z, y)
                if fx <= 0.20:
                    continue
                ty = y + (0.05 if j % 2 else -0.05)
                tips.append((side * (fx - 0.08), ty, z))
            an.vein_fan(parts, glow, 'frigate.fan.%s.%s' % (tag, stag),
                        hull_mat, glow_mat, root, tips, (side, 0.0, 0.0),
                        detail=detail)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones elder guardian (frigate class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow'):
                vein cores and nodes, vent breath, hollow panels, crown
                tips, companion wake beads.
    l, b, h  -- class length, beam, height from the driver (32.0, 12.48,
                8.32).
    detail   -- 3 full build  2 thinned repeats  1 primary masses + key
                anatomy  0 primary masses only (see module docstring).
    """
    stations = _frigate_stations(l, b, h)
    cap = _crest_stations(l, h, stations)

    # -- Primary masses (always, detail 0+) --------------------------------
    # The grown body: base indigo living tissue, belly hanging deep.
    sf.grown_loft(parts, 'frigate.hull', kit.ROLE_HULL, stations, hull_mat)
    # The pearl arch: a second grown mass intersecting the body from the
    # broad forehead to mid-tail, named for the skin's 'living' selector so
    # the two masses carry the tonal split between them.
    sf.grown_loft(parts, 'living-body-frigate.arch', kit.ROLE_ARMOUR,
                  cap, hull_mat)
    # The fin set IS the outline (always: membranes are primary mass).
    _fin_set(parts, stations, l, h, hull_mat, detail)
    # Four flank hollows: two nurseries with nested juveniles forward, two
    # dark open sanctuaries aft (always: wells and companion bodies are
    # primary mass at detail 0).
    _hollows(parts, glow, stations, l, hull_mat, glow_mat, detail)

    if detail < 1:
        return

    # -- Deep sensory crown (detail 1+) ------------------------------------
    # 14 filaments at full detail, rooted INSIDE the forehead mass at
    # l*-0.385, sweeping up and forward in a wide slow fan (1.5x root disc,
    # arc 0.32) - long fine filaments with cyan tip droplets held away from
    # the face, thin and fragile against the body's mass.
    org.sensory_crown(parts, glow, 'frigate.crown', hull_mat, glow_mat,
                      (0.0, h * 0.080, l * -0.3850),
                      forward=(0.0, 0.35, -1.0), fan=sf.FILAMENT_FAN * 1.5,
                      count=14, detail=detail, seed=61, arc=0.32)

    # -- Breathing vents (detail 1+) ----------------------------------------
    # One row of soft mouths per flank collecting UNDER the dorsal
    # overhang, at 0.62 of the mid half-height, between the hollow band and
    # the arch margin. Every mouth centre is sampled at its own station;
    # 8 per flank at full detail, 6 passed at detail <= 2 (the organ halves
    # again at detail 1 - three dark bowls carry the row at lod2).
    _hw, hh_mid, yo_mid, _ch = sf.section(stations, 0.0)
    y_vent = yo_mid + hh_mid * 0.62
    n_vent = 8 if detail >= 3 else 6
    for side, stag in ((1.0, 'stbd'), (-1.0, 'port')):
        pts = _vent_points(stations, side, l, y_vent, n_vent)
        if pts:
            org.breathing_vents(parts, glow, 'frigate.vents.' + stag,
                                hull_mat, glow_mat, pts[0], face='x',
                                points=pts, detail=detail)

    # -- Fold creases and the vein lattice inside them (detail 1+) ---------
    _folds_and_veins(parts, glow, stations, l, hull_mat, glow_mat, detail)

    # -- Arch-margin flow lines (detail 1+) ---------------------------------
    # The pearl arch meets the indigo flank in one long gradual flow line
    # per side, riding the body surface at the arch's emergence line. At
    # detail 1 the line reduces to its chord (it is never dropped).
    for side, stag in ((1.0, 'stbd'), (-1.0, 'port')):
        path = _crest_margin_path(stations, cap, side)
        if len(path) >= 2:
            an.flow_line(parts, 'frigate.margin.' + stag, hull_mat, path,
                         detail=0 if detail == 1 else detail)

    # -- Scar history (detail 1+) -------------------------------------------
    # THREE pale healed ridges together on the UPPER PORT flank: short
    # parallel welts above the hollow band, each climbing as it runs aft,
    # like old gill-rake wounds. This cluster is the class's ONE deliberate
    # functional asymmetry (bible rule 8; the healed scar is the sanctioned
    # source). Every path rides the local section and buries both ends.
    scars = (
        ('ridge.fore', l * -0.1750, l * -0.1200, 0.40, 0.55),
        ('ridge.mid',  l * -0.1300, l * -0.0750, 0.36, 0.50),
        ('ridge.aft',  l * -0.0850, l * -0.0300, 0.32, 0.45),
    )
    for tag, z0, z1, yf0, yf1 in scars:
        path = _flank_scar_path(stations, -1.0, z0, z1, yf0, yf1, 8)
        if len(path) >= 2:
            an.healed_scar(parts, 'frigate.scar.' + tag, hull_mat, path,
                           detail=detail)
