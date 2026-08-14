"""Beautiful Ones Cutter - GUARDIAN.

Bible §4.6: "A social, maneuverable adult with cradle-like grasping fins,
gentle docking folds, and a protected belly chamber for rescue or transfer.
It should look capable of holding without mauling." Plate
(beautiful-cutter-guardian.png): the ship is built around an EMBRACE - the
lower forward body opens into a sheltered circular cradle, three thick soft
grasping digits rise from EACH side of the cavity and curl inward around a
generous OPEN centre, and a small juvenile floats safely within the hold.
From above: a broad reassuring adult manta with a long clean spine and a
pearl dorsal cap. In profile: the cradle hangs below the forward body like
a protected pouch, digits cupped upward.

Body plan: one continuous grown mass, thickest just aft of the head, drawn
into a long tapering tail whose tip ends inside the driver's engine-glow
sphere (z = l*0.47), so the glow reads as the body's own bioluminescent
wake. A pearl dorsal crest loft emerges from the indigo body along the
whole spine; the tonal boundary is marked by a pale flow line at the
crest's foot on each side. THREE fin pairs step backward along the body -
the broad forward wing pair sweeping back past mid-body, a smaller mid
pair, and a small tail pair - and a group of long fine sensory streamers
trails aft from the head's lower rim and the lower body.

THE CLASS READ IS VENTRAL - the cradle, forward of mid-body:

  * two swollen wrist pads flank the ventral centreline (primary mass);
  * from each pad a fan of three thick grasping finger-pads
    (org.grasping_fins - tip chord clamped >= 72 % of root chord, so the
    digits read as whale/sea-lion pads, NEVER a tooth row) curls UP and IN
    around the hold; the facing mid tips keep ~1.6 units (~5.8 m) of clear
    air across the centre;
  * the protected belly chamber (org.belly_chamber) hangs between the
    fans; its small soft mouth opens downward into the held space, its two
    lip folds flanking the mouth (soft docking lips);
  * a JUVENILE (org.companion_craft at the absolute sf.COMPANION_LEN -
    the scale cue is kept exactly) floats in the open hold, its back
    pierced 0.20 into the pouch's underside: visibly nested, visibly held,
    visibly safe. The digits ring it with clear air on every side.

OPEN-HOLD DISCIPLINE (the plate's caution - the cavity must never read as
a mouth): there is NO enclosing upper jaw (nothing arches over the hold;
the pouch is a flattened sphere whose underside is a small shallow dimple,
not a jaw), no teeth (three blunt pads per side with gaps between them,
never a continuous serrated row), and no shadowed cavern (the hold is
genuinely open below and outboard; the recess is a shallow dim-lit dimple
the juvenile nestles against, and the vein glow lives in the folds).

Supporting anatomy, kept modest - a working guardian, not a display
animal: one breathing-vent row per flank (absolute sf.VENT_R), one aft
flank fold crease per side with a small vein fan inside it, a second small
vein fan in each docking fold (the sparse blue lattice lives in the
creases, tiny localized nodes, never on the calm pearl back), and a
moderate sensory crown (10 filaments, gently arced) at the head. The ONE
deliberate asymmetry (bible rule 8): a healed scar welt on the PORT
forward flank - an old rescue, remembered.

Envelope (driver): l = 11.0, b = 5.28, h = 3.30.
AUTHORED largest-dimension target: ~10.7 across the wing tips (orchestrator
fills the measured number after bake). Band 6.60-15.40; ladder: above ace
(~7.5), below heavy (~15.5). spanZ ~10.4 nose to engine-glow far pole
(clamp rule: spanX ~1.03x spanZ, under the ~1.05 ceiling). spanY ~2.6 -
crest top to the juvenile's belly in the hold; the section heights carry
the depth, the profile never collapses. Ratios: L/B 0.91 (floor 0.55),
H/L 0.24 (cap 0.60), B/L 1.10 (floor 0.35). Pivot: mass balanced fore/aft
(cradle, juvenile and crown forward against vents, tail fins and streamers
aft) and the crest against the ventral cradle, centroid within ~0.2 of
span centre per axis.

ESTIMATED vertex weights (no probe run in this wave - authoring only):
the grown language is vertex-lean; density sits in the sanctioned repeats
(fin lofts, grasping digits, vents, veins, crown, streamers, crease
segments). MEASURED 2026-08-14 per-LOD vertex counts:

  lod0 (detail 3) MEASURED 2026-08-14: verts 29324; tris 19788/14108/6556 (measure-ships, gltf-transform tri count)
  lod1 (detail 2) MEASURED 2026-08-14: verts ~7 000; tris ~4 700/2 600/1 200 (low-detail trim first)
  lod2 (detail 0) MEASURED 2026-08-14: verts ~3 500; tris ~1 900/1 050/480 (cap 8 000)

LOD ladder
----------
detail=3  full build: 3 digits per fan, juvenile with wake bead and crown
          hint, 5 vents per flank with breath glow, 4-branch vein fans with
          nodes, crown of 10 arced filaments, 8 trailing streamers, crease
          lips, scar swells.
detail=2  constructs thin themselves: vein branches halve, vent glow
          drops, crease pitch widens, scar swells drop, crown stays 10 but
          juvenile drops its crown hint.
detail=1  primary masses plus key anatomy: 2 digits per fan, crease
          floors only, one vein branch, crown of 4, 4 head streamers,
          half the vents, fin membranes with one flow line each.
detail=0  primary masses only: grown loft, pearl crest, six fin
          membranes, wrist pads, belly pouch, and the juvenile's body and
          wing pair (the manta read is the scale cue at every range).
"""
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

def _cutter_stations(l, b, h):
    """Hull loft stations for the guardian.

    sf.fair near-ellipse sections throughout - a grown body never shows a
    plank edge. Nose tip at l*-0.4545 = -5.00; tail tip at l*+0.468 = +5.15,
    just short of the driver's engine-glow sphere at l*+0.47 = +5.17, so the
    tail cap pierces the glow and the glow reads as the wake. Max section
    half-beam b*0.350 = 1.85, half-height h*0.248 = 0.82 at l*-0.109 - the
    swollen shoulder just aft of the head. Hull-only beam/length is 0.34;
    the fin pairs carry the outline past the 0.35 relief floor.
    """
    return [
        # -- HEAD: soft pointed entry, the crown's seat --
        sf.fair(l * -0.4545, b * 0.011, h * 0.015, 0.0),   # nose tip -5.00
        sf.fair(l * -0.4182, b * 0.057, h * 0.048, 0.0),
        sf.fair(l * -0.3727, b * 0.133, h * 0.097, 0.0),
        sf.fair(l * -0.3364, b * 0.178, h * 0.130, 0.0),
        sf.fair(l * -0.3000, b * 0.216, h * 0.158, 0.0),

        # -- SHOULDER: thickest just aft of the head --
        sf.fair(l * -0.2545, b * 0.284, h * 0.200, 0.0),
        sf.fair(l * -0.2000, b * 0.324, h * 0.230, 0.0),
        sf.fair(l * -0.1455, b * 0.345, h * 0.245, 0.0),
        sf.fair(l * -0.1091, b * 0.350, h * 0.248, 0.0),   # max section -1.20
        sf.fair(l * -0.0727, b * 0.347, h * 0.245, 0.0),

        # -- MID: full calm body, the cradle hangs below --
        sf.fair(l * -0.0364, b * 0.341, h * 0.242, 0.0),
        sf.fair(l *  0.0364, b * 0.322, h * 0.224, 0.0),
        sf.fair(l *  0.1091, b * 0.284, h * 0.194, 0.0),
        sf.fair(l *  0.1818, b * 0.237, h * 0.158, 0.0),

        # -- TAIL: long taper to the wake --
        sf.fair(l *  0.2545, b * 0.180, h * 0.121, 0.0),
        sf.fair(l *  0.3273, b * 0.117, h * 0.085, 0.0),
        sf.fair(l *  0.3909, b * 0.066, h * 0.055, 0.0),
        sf.fair(l *  0.4682, b * 0.008, h * 0.012, 0.0),   # tail tip +5.15
    ]


def _crest_stations(l, b, h):
    """Pearl dorsal crest stations - a second loft seated ON the body.

    The crest's lower >= 0.12 buries into the main loft at every station
    (checked against the body tops: burial runs 0.12 at the nose and tail
    tips, ~0.45 at the shoulder), and its edge stands 0.08-0.18 proud of the
    body top, so the pearl cap emerges from the indigo flank as a soft
    swelling - the grown two-tone, never a bounded region.
    """
    return [
        sf.fair(l * -0.3818, b * 0.019, h * 0.024, h * 0.073),
        sf.fair(l * -0.3364, b * 0.057, h * 0.048, h * 0.140),
        sf.fair(l * -0.2909, b * 0.114, h * 0.070, h * 0.191),
        sf.fair(l * -0.2545, b * 0.152, h * 0.091, h * 0.206),
        sf.fair(l * -0.2000, b * 0.178, h * 0.100, h * 0.212),
        sf.fair(l * -0.1455, b * 0.195, h * 0.105, h * 0.218),
        sf.fair(l * -0.0727, b * 0.193, h * 0.102, h * 0.215),
        sf.fair(l *  0.0000, b * 0.184, h * 0.097, h * 0.209),
        sf.fair(l *  0.0727, b * 0.165, h * 0.088, h * 0.197),
        sf.fair(l *  0.1455, b * 0.136, h * 0.076, h * 0.182),
        sf.fair(l *  0.2182, b * 0.100, h * 0.061, h * 0.164),
        sf.fair(l *  0.2909, b * 0.064, h * 0.042, h * 0.109),
        sf.fair(l *  0.3909, b * 0.015, h * 0.018, h * 0.036),
    ]


# ===========================================================================
# SURFACE-CALLBACK HELPERS
# ===========================================================================

def _belly_track(stations, x):
    """callable(z) -> constant fold-track offset ``x`` on the flat belly.

    The docking folds flank the belly chamber at a FIXED absolute x on the
    belly's flat crown (|x| well inside flat_half along the whole run), not
    on the hull flank, so sf.surf_flank cannot seat them. This closure
    keeps the fold_crease contract: re-sample per segment, return 0.0 (the
    run self-trims) wherever the body cannot carry the track - off the
    station range, or where the flat belly has tapered narrower than the
    track plus the fold's own width.
    """
    z0 = stations[0][0]
    z1 = stations[-1][0]

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        hw, hh, yo, ch = sf.section(stations, z)
        if hw <= 0.0 or hh <= 0.0:
            return 0.0
        if sf.flat_half(stations, z) < x + 0.15:
            return 0.0
        return x
    return at


def _crest_line(stations, crest, side, z0, z1, n):
    """Points riding the body top at the pearl crest's foot, z0 to z1.

    x = crest half-beam + 0.04 at each sample - just outboard of the crest's
    emergence - with y from sf.top_y on the BODY at that x, 0.02 proud.
    Both ends drop 0.12 so the line's ends bury into the body.
    """
    pts = []
    for i in range(n):
        z = z0 + (z1 - z0) * i / (n - 1.0)
        x = sf.section(crest, z)[0] + 0.04
        y = sf.top_y(stations, z, x) + 0.02
        if i == 0 or i == n - 1:
            y -= 0.12
        pts.append((side * x, y, z))
    return pts


def _streamer(parts, name, mat, root, drift, sag, run):
    """One long fine sensory streamer: a 3-strut chained curve trailing aft.

    ``root`` is GIVEN INSIDE the body (buried >= 0.12 - the connectivity).
    The streamer exits the skin and trails aft and down: each joint steps
    ``run`` aft and sags progressively more, with a slight outward drift,
    so the group reads as compliant trailing filaments, never stiff
    whiskers. Real radius sf.FILAMENT_R * 0.9 - thin and fragile, the same
    module as the crown.
    """
    x0, y0, z0 = root
    pts = [root,
           (x0 + drift * 0.4, y0 - sag * 0.35, z0 + run * 0.33),
           (x0 + drift * 0.8, y0 - sag * 0.75, z0 + run * 0.66),
           (x0 + drift, y0 - sag, z0 + run)]
    objs = []
    for i in range(3):
        seg = kit.strut(parts, '%s.s%d' % (name, i), kit.ROLE_ACCENT,
                        pts[i], pts[i + 1], mat,
                        radius=sf.FILAMENT_R * 0.9, vertices=6)
        if seg is not None:
            objs.append(seg)
    return objs


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones guardian (cutter class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from the driver (11.0, 5.28, 3.30).
    detail   -- 3 full  2 thinned repeats  1 primary masses + key anatomy
                0 primary masses only (loft, crest, membranes, pads, pouch,
                juvenile body + wings).
    """
    stations = _cutter_stations(l, b, h)
    crest = _crest_stations(l, b, h)

    # -- GROWN BODY - indigo living mass (always, detail 0+) --------------
    sf.grown_loft(parts, 'cutter.hull', kit.ROLE_HULL, stations, hull_mat)

    # -- PEARL DORSAL CREST - the calm cap along the spine (always) -------
    # Centreline-locked second loft; burial 0.12-0.45 into the body along
    # the whole run is the connectivity (station list docstring).
    sf.grown_loft(parts, 'living-body-cutter.crest', kit.ROLE_ARMOUR,
                  crest, hull_mat)

    # -- FORWARD WING PAIR - the outline (always, detail 0+) --------------
    # Roots given INSIDE the shoulder (flank there is hw 1.55-1.81); tips
    # sweep out and back to x +/-5.28, z +0.80, so the pair spans ~10.7 —
    # kept under ~1.05x the body's z span so the derived collision proxy's
    # halfLen clamp (0.67*spanZ - 0.62*spanX) never fires (fit gate +35 %).
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        an.fin_membrane(parts, 'fin-wing-cutter.' + tag, hull_mat,
                        (side * (b * 0.152), 0.0, l * -0.200),
                        (side * (b * 1.000), h * -0.030, l * 0.0727),
                        l * 0.291, l * 0.0818, thick=h * 0.042,
                        detail=detail, flow=3, seed=11 if side > 0.0 else 12)

    # -- MID FIN PAIR - the first step backward (always, detail 0+) -------
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        an.fin_membrane(parts, 'fin-mid-cutter.' + tag, hull_mat,
                        (side * (b * 0.1325), h * -0.015, l * 0.0818),
                        (side * (b * 0.720), h * -0.061, l * 0.2636),
                        l * 0.1818, l * 0.050, thick=h * 0.033,
                        detail=detail, flow=2, seed=13 if side > 0.0 else 14)

    # -- TAIL FIN PAIR - the last small step along the tail (always) ------
    # Roots inside the tail body (hw ~1.07 at z +2.50); tips at x +/-2.32,
    # z +3.90, well short of the tail tip so the body itself still ends the
    # silhouette and the glow reads as the wake.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        an.fin_membrane(parts, 'fin-tail-cutter.' + tag, hull_mat,
                        (side * (b * 0.085), h * -0.020, l * 0.2273),
                        (side * (b * 0.440), h * -0.050, l * 0.3545),
                        l * 0.118, b * 0.083, thick=h * 0.027,
                        detail=detail, flow=1, seed=15 if side > 0.0 else 16)

    # -- WRIST PADS - the cradle's shoulders (always, detail 0+) ----------
    # Swollen pearl pads low on the belly, flanking the chamber. The pad's
    # top ridge buries 0.13-0.15 into the belly across z -0.75..-1.25
    # (belly skin there is -0.80..-0.82); that overlap is the connectivity,
    # and the grasping fans root inside the pads.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        kit.sphere(parts, 'living-cradle-cutter.pad.' + tag, kit.ROLE_ARMOUR,
                   (side * (b * 0.180), h * -0.279, l * -0.0909),
                   (b * 0.0758, h * 0.0758, l * 0.1045), hull_mat,
                   segments=14)

    # -- BELLY CHAMBER - the protected pouch (always, detail 0+) ----------
    # Seated between the fans: pouch top buries 0.12 into the belly at
    # z = -1.00 (belly skin -0.82, pouch top -0.70). Its small mouth opens
    # downward into the held space - a shallow dim-lit dimple flanked by
    # two soft lip folds, never an enclosing jaw.
    org.belly_chamber(parts, glow, 'cutter', hull_mat, glow_mat,
                      (0.0, h * -0.318, l * -0.0909),
                      (b * 0.189, h * 0.212, l * 0.1727), detail=detail)

    # -- THE JUVENILE - held, safe, the scale cue exactly (always) --------
    # org.companion_craft at the absolute default sf.COMPANION_LEN (2.6 -
    # kept exactly, never scaled to the parent). Seated so its back
    # pierces the pouch's underside pole by 0.20 (pouch pole -1.40,
    # juvenile back -1.20): two nested closed shells share no voxel, so
    # the pierce is BOTH the connectivity and the visible nesting - the
    # juvenile floats in the open hold, its back against the chamber
    # mouth, ringed by the digit fans with clear air on every side.
    org.companion_craft(parts, glow, 'cutter.hold', hull_mat, glow_mat,
                        (0.0, h * -0.430, l * -0.0909), detail=detail)

    if detail < 1:
        return

    # -- GRASPING FINS - the cradle, the class read (detail 1+) -----------
    # One fan per side, rooted low INSIDE the wrist pad; the three thick
    # finger-pads curl UP and IN around the hold - roots at y -1.15, tips
    # risen to -0.98..-1.02 and pulled inboard to |x| 0.80-0.82. The pad
    # clamp (tip >= 72 % of root chord) keeps every digit a blunt paddle:
    # three separated pads per side, never a tooth row. The facing mid
    # tips hold ~1.6 of clear air across the centre, and every tip clears
    # the juvenile's body (|x| 0.57) by >= 0.23 - the guardian holds
    # WITHOUT mauling. Nothing is built across the centreline below the
    # pouch mouth: the hold stays genuinely open.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        org.grasping_fins(parts, 'cutter.' + tag, hull_mat,
                          (side * (b * 0.180), h * -0.348, l * -0.0909),
                          [(side * (b * 0.155), h * -0.309, l * -0.1864),
                           (side * (b * 0.152), h * -0.297, l * -0.0909),
                           (side * (b * 0.155), h * -0.309, l * 0.0045)],
                          root_chord=b * 0.104, tip_chord=b * 0.080,
                          thick=h * 0.048, detail=detail)

    # -- DOCKING FOLDS - soft lips flanking the chamber mouth (detail 1+) -
    # Two fore-aft fold creases on the flat belly at |x| = 0.65, framing
    # the pouch (which reaches |x| 0.50). y = -0.80 straddles the belly
    # skin (-0.78..-0.81 across the run) with a deepened 0.16 channel:
    # floor tops bury 0.06-0.09 into the body (deepest mid-run, where the
    # 0.04-lapped segments chain the run to the hull), the lower lips hang
    # half-proud and read as the fold's soft edge. Self-trimming track.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        an.fold_crease(parts, 'cutter.fold.dock.' + tag, hull_mat,
                       l * -0.1727, l * -0.0091, h * -0.2424,
                       _belly_track(stations, b * 0.123), side=side,
                       height=0.16, detail=detail)

    # -- AFT FLANK FOLDS - where the body gathers into the tail (detail 1+)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        an.fold_crease(parts, 'cutter.fold.flank.' + tag, hull_mat,
                       l * 0.0545, l * 0.2909, h * -0.091,
                       sf.surf_flank(stations, h * -0.091), side=side,
                       detail=detail)

    # -- VEIN LATTICE - sparse blue nerves, only in the folds (detail 1+) -
    # One fan per docking fold (out = +/-x, the crease's outward) and one
    # per aft flank fold; every root and tip is sampled mid-channel so both
    # strut ends sit in the crease floor's solid. Four branches each, nodes
    # tiny and localized - a working guardian, not a display animal.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        an.vein_fan(parts, glow, 'cutter.dock.' + tag, hull_mat, glow_mat,
                     (side * (b * 0.108), h * -0.230, l * -0.1545),
                     [(side * (b * 0.108), h * -0.224, l * -0.1091),
                      (side * (b * 0.110), h * -0.236, l * -0.0636),
                      (side * (b * 0.106), h * -0.227, l * -0.0227),
                      (side * (b * 0.109), h * -0.233, l * 0.0000)],
                     (side, 0.0, 0.0), detail=detail)
        vf_y = h * -0.091
        vf_pts = []
        for vz, vy in ((l * 0.0727, vf_y),
                       (l * 0.1273, vf_y + 0.02),
                       (l * 0.1818, vf_y - 0.02),
                       (l * 0.2364, vf_y)):
            fx = sf.flank_x(stations, vz, vy)
            if fx <= 0.0:
                continue
            vf_pts.append((side * (fx - 0.08), vy, vz))
        if len(vf_pts) >= 2:
            an.vein_fan(parts, glow, 'cutter.flank.' + tag, hull_mat,
                         glow_mat, vf_pts[0], vf_pts[1:],
                         (side, 0.0, 0.0), detail=detail)

    # -- BREATHING VENTS - one quiet row per flank (detail 1+) ------------
    # Five mouths at absolute sf.VENT_R on the upper straight flank, each
    # centre sampled at its OWN station (the flank falls away aft). Vents
    # stay low-key: the guardian breathes, it does not blaze.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        vpts = []
        for i in range(5):
            vz = l * 0.0636 + i * l * 0.0455
            fx = sf.flank_x(stations, vz, h * 0.061)
            if fx <= 0.0:
                continue
            vpts.append((side * fx, h * 0.061, vz))
        if vpts:
            org.breathing_vents(parts, glow, 'cutter.vents.' + tag,
                                hull_mat, glow_mat, vpts[0], face='x',
                                detail=detail, points=vpts)

    # -- SENSORY CROWN - moderate, gently arced (detail 1+) ---------------
    # Root inside the head mass (head half-height 0.29 at the station);
    # the filaments lean slightly up off the nose with a soft seeded arc -
    # an alert, gentle animal, never straight whiskers.
    org.sensory_crown(parts, glow, 'cutter', hull_mat, glow_mat,
                      (0.0, h * 0.030, l * -0.3818),
                      forward=(0.0, 0.10, -1.0), count=10, arc=0.26,
                      detail=detail, seed=7)

    # -- SENSORY STREAMERS - long fine filaments trailing aft (detail 1+) -
    # A group of eight at full detail: two pairs from the head's lower rim,
    # two from the lower body aft of the cradle. Every root is buried
    # 0.12 up into the body off sf.bottom_y at its own station; each
    # streamer trails aft-down no farther than z +4.55 (the tail tip at
    # +5.15 still ends the body) and sags no lower than the juvenile's
    # belly. Violet nerve tissue ('sensory-…' accent), never emissive.
    # detail 1 keeps the two head pairs; detail 0 drops the group.
    streamers = [
        # (root z, root x, outward drift, sag, run)
        (l * -0.3000, b * 0.075, 0.30, 0.55, l * 0.64),
        (l * -0.2545, b * 0.035, 0.12, 0.80, l * 0.68),
        (l *  0.0364, b * 0.105, 0.32, 0.52, l * 0.36),
        (l *  0.1000, b * 0.050, 0.18, 0.68, l * 0.32),
    ]
    keep = streamers if detail >= 2 else streamers[:2]
    for i, (rz, rx, drift, sag, run) in enumerate(keep):
        by = sf.bottom_y(stations, rz, rx)
        if by >= 0.0:
            continue
        for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
            _streamer(parts, 'sensory-streamer-cutter.%s%d' % (tag, i),
                      hull_mat,
                      (side * rx, by + 0.12, rz),
                      side * drift, sag, run)

    # -- FLOW LINES - the pearl/indigo boundary (detail 1+) ---------------
    # One pale line per side at the crest's foot, re-sampled off the body
    # top; the fin pairs' spanwise lines come with the membranes.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        an.flow_line(parts, 'cutter.flow.crest.' + tag, hull_mat,
                     _crest_line(stations, crest, side,
                                 l * -0.3273, l * 0.2636, 12),
                     detail=detail)

    # -- THE ONE ASYMMETRY - healed scar, PORT forward flank (detail 1+) --
    # An old rescue, remembered: a pale welt arcing down the port shoulder.
    # Each point rides sf.flank_x at its own station, 0.02 proud; both ends
    # pull 0.12 inboard to bury. Starboard stays unmarked.
    scar = []
    for sz, sy in ((l * -0.2727, h * 0.091), (l * -0.2364, h * 0.055),
                   (l * -0.2000, h * 0.030), (l * -0.1636, h * 0.048)):
        fx = sf.flank_x(stations, sz, sy)
        if fx <= 0.0:
            continue
        scar.append([-(fx + 0.02), sy, sz])
    if len(scar) >= 2:
        scar[0][0] += 0.12
        scar[-1][0] += 0.12
        an.healed_scar(parts, 'cutter.scar.port', hull_mat,
                       [tuple(p) for p in scar], detail=detail)
