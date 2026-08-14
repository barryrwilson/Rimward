"""Beautiful Ones organs — the faction's functional biology.

Bible section 4.6: every class is a different life stage or body plan, and
the class read comes from ANATOMY, not equipment. This module is the working
biology: the SENSORY CROWN of fine filaments at the head, the breathing
vents, the cradle-like grasping fins, the protected belly chamber, the
sanctuary and nursery hollows with their nested companion craft (§G5
nesting), the freighter's dorsal garden folds, and the heavy's dorsal mantles.
No nozzles, no windows, no armour, no turrets — nothing here is a machine.

THE ANCHOR RULE (wave-7 hardware.py idiom): organs NEVER query the hull.
Every anchor point, surface plane and direction arrives as an argument the
class file computed from surface.py. The only surface import is the shared
absolute living module (FILAMENT_LEN, VENT_R, HOLLOW, COMPANION_LEN).

PAINT follows the dual rule documented in anatomy.py: role tag and name
selector agree. Pearl organs are kit.ROLE_ARMOUR named 'living-…', violet
nerve anatomy is kit.ROLE_ACCENT named 'nerve-…', crown filament shafts are
kit.ROLE_HULL pale flesh named 'sensory-crown-…', crease and hollow floors
are kit.ROLE_RECESS, and every emissive is a glow-list part with
obj['skin_role'] = 'glow' — cyan bioluminescence, tiny, far under the 5 %
hull-area cap.

Size conventions (verified against the ship_kit.py source):
    kit.box     FULL extents (obj.scale = size / 2 on the default 2-unit cube)
    kit.sphere  scale is RADII per axis
    kit.cyl     real radius / depth; rotation is a Blender-space Euler
    kit.torus   real major/minor radii; default axis is ship +Y
    kit.strut   real radius between ship-space points; None on zero span
The absolute sf.* sizes go in at their stated values, never halved, never
multiplied by ship l, b or h: a larger organism carries MORE vents, MORE
hollows and MORE companions, never bigger ones.

Connectivity: every organ overlaps its host by at least 0.10 of solid
material, or chains to something that does. A nested companion is seated
PIERCING its hollow's mouth plane — two nested closed shells share no voxel
(pipeline §6), so the companion's belly passes through the well's outer face
and its back stands proud: the nesting stays visible AND connected.

Detail ladder: detail 3 = full, 2 = fewer repeats, 1 = primary form,
0 = primary masses only (pouch, well and companion bodies survive; crowns,
vent glows and fronds drop).
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import anatomy as an
from . import surface as sf


# ---------------------------------------------------------------------------
# Internal constants — ABSOLUTE world units, never scaled by ship size.
# ---------------------------------------------------------------------------
_CROWN_CONE   = 0.55    # crown fan half-angle tangent (spread per unit length)
_VENT_BOWL    = 0.30    # vent bowl vertical radius = VENT_R * this
_VENT_GLOW    = 0.22    # vent breath glow radius = VENT_R * this
_WELL_DEPTH   = 0.50    # hollow well inboard depth from the skin plane
_LIP_PROUD    = 0.06    # hollow lip protrusion outboard of the skin plane
_LIP_BURY     = 0.30    # hollow lip inboard anchor (>= 0.10 burial gate)
_GLOW_PANEL_T = 0.05    # hollow glow panel FULL thickness; outer face 0.025
                        #   proud of the skin, below the lip plane (0.06)
_PAD_TIP_MIN  = 0.72    # grasping-finger tip is at least this fraction of root
                        #   chord — pads, not spikes
_MANTLE_RY_MIN = 0.55   # mantle vertical half-height ≥ this × stern half-length,
                        #   preventing disc silhouette
_BOW_DEFAULT  = 0.30    # default filament bow as fraction of length —
                        #   sea-grass sweep, not a whisker poke
_SHAFT_SCALE  = 0.5     # shaft radius = FILAMENT_R * this; plates show pale
                        #   hair-fine filaments, not rods


def _glow_tag(obj):
    """Force an object's skin_role to 'glow' (cyan by role)."""
    if obj is not None:
        obj['skin_role'] = 'glow'
    return obj


def _out_of(loc, face):
    """Unit outward direction for an organ anchored at loc on the given face.

    face 'y' → dorsal/ventral anchor, outward is +/- ship Y by sign of loc.y.
    face 'x' → flank anchor, outward is +/- ship X by sign of loc.x.
    """
    if face == 'x':
        return (1.0 if loc[0] >= 0.0 else -1.0, 0.0, 0.0)
    return (0.0, 1.0 if loc[1] >= 0.0 else -1.0, 0.0)


def _bezier_quadratic(p0, ctrl, p2, t):
    """Quadratic bezier point at t in [0, 1]."""
    u = 1.0 - t
    return (u * u * p0[0] + 2.0 * u * t * ctrl[0] + t * t * p2[0],
            u * u * p0[1] + 2.0 * u * t * ctrl[1] + t * t * p2[1],
            u * u * p0[2] + 2.0 * u * t * ctrl[2] + t * t * p2[2])


# ===========================================================================
# 1.  SENSORY CROWN — the filament fan at the head
# ===========================================================================
def sensory_crown(parts, glow, name, hull_mat, glow_mat, loc,
                  forward=(0.0, 0.0, -1.0), fan=sf.FILAMENT_FAN, count=8,
                  detail=3, seed=1, arc=None):
    """A fan of fine curved filaments at the head, with luminous tip droplets.

    Charter: the sensory crown is the only fine detail allowed forward —
    thin and fragile against the body's mass, the closest thing this faction
    has to a mast. Each filament is a curved chain of kit.strut segments
    following a seeded quadratic bezier that bows like sea grass (default
    midpoint sag ~0.30 x length; ``arc`` scales it). Shaft radius is HALF
    the absolute sf.FILAMENT_R — hair-fine, never rod-like — and shafts are
    pale living flesh (kit.ROLE_HULL, named 'sensory-crown-…'); only the
    small cyan droplet at each tip glows. Anatomy, never strip lighting.

    Anchor: ``loc`` is the crown root, GIVEN INSIDE the head mass and used
    as given — the filaments' shared root region is the connectivity.
    ``forward`` is the unit direction the fan faces (ship -Z is the nose).
    ``fan`` is the root-fan radius: filaments leave from a disc of that radius.
    ``arc`` (optional) scales the bow strength (default ~0.30·length); per-
    class posture is already encoded via ``forward`` (Light leans forward-up,
    Ace is low-flat, Heavy rakes forward-down, Frigate/Freighter sweep deep
    and slow). Seeded per-filament jitter keeps the fan grown, not machined.

    Detail (count follows the ``8 if detail >= 2 else 4`` pattern):
        3/2 → ``count`` filaments with curved chains and tips
        1   → 4 filaments with tips
        0   → nothing (fine detail; the head mass carries the read)
    """
    if detail < 1:
        return []
    n = count if detail >= 2 else 4
    fx, fy, fz = forward
    fl = math.sqrt(fx * fx + fy * fy + fz * fz)
    if fl < 1e-6:
        return []
    fx, fy, fz = fx / fl, fy / fl, fz / fl
    # Fan basis: u / v span the disc perpendicular to `forward`.
    if abs(fy) < 0.9:
        ux, uy, uz = -fz, 0.0, fx
    else:
        ux, uy, uz = 1.0, 0.0, 0.0
    ul = math.sqrt(ux * ux + uy * uy + uz * uz)
    ux, uy, uz = ux / ul, uy / ul, uz / ul
    vx, vy, vz = (fy * uz - fz * uy, fz * ux - fx * uz, fx * uy - fy * ux)
    rand = kit.rng(seed)
    objs = []
    lx, ly, lz = loc
    # Bend basis for coherent sweep: bias toward +up and slightly -forward
    bend_x, bend_y, bend_z = (-fx * 0.3 + (0.0 if abs(fy) >= 0.9 else ux * 0.2),
                               1.0 - abs(fy) * 0.4, -fz * 0.3)
    bend_l = math.sqrt(bend_x * bend_x + bend_y * bend_y + bend_z * bend_z)
    if bend_l > 1e-6:
        bend_x, bend_y, bend_z = bend_x / bend_l, bend_y / bend_l, bend_z / bend_l
    else:
        bend_x, bend_y, bend_z = 0.0, 1.0, 0.0
    for i in range(n):
        ang = 2.0 * math.pi * i / n + rand() * 0.4
        ca, sa = math.cos(ang), math.sin(ang)
        # root on the fan disc
        rx = lx + (ux * ca + vx * sa) * fan * 0.4
        ry = ly + (uy * ca + vy * sa) * fan * 0.4
        rz = lz + (uz * ca + vz * sa) * fan * 0.4
        length = sf.FILAMENT_LEN * (0.85 + rand() * 0.30)
        spread = sf.FILAMENT_LEN * _CROWN_CONE
        tip_x = lx + fx * length + (ux * ca + vx * sa) * spread
        tip_y = ly + fy * length + (uy * ca + vy * sa) * spread
        tip_z = lz + fz * length + (uz * ca + vz * sa) * spread
        # Quadratic bezier control point for arc
        bow = length * (_BOW_DEFAULT if arc is None else arc)
        bow *= 0.8 + rand() * 0.4
        # seeded per-filament bend variation
        bend_var = rand() * 0.5 - 0.25
        ctrl_x = (rx + tip_x) * 0.5 + (bend_x + bend_var * (1.0 - abs(fy))) * bow * 2.0
        ctrl_y = (ry + tip_y) * 0.5 + (bend_y + bend_var * (1.0 - abs(fy))) * bow * 2.0
        ctrl_z = (rz + tip_z) * 0.5 + (bend_z + bend_var * (1.0 - abs(fy))) * bow * 2.0
        # Sample bezier at 4 segments (t = 0, 1/4, 2/4, 3/4, 1) so the arc
        # reads as one continuous bow, not a bent stick.
        segs = 4
        pts = [(rx, ry, rz)]
        for s in range(1, segs + 1):
            t = s / segs
            pts.append(_bezier_quadratic((rx, ry, rz), (ctrl_x, ctrl_y, ctrl_z),
                                          (tip_x, tip_y, tip_z), t))
        # Build curved filament as a chain of struts: HALF the module
        # filament radius, pearl living flesh (ROLE_HULL — the plates show
        # pale shafts); only the droplet tip glows.
        prev = pts[0]
        for s in range(1, len(pts)):
            cur = pts[s]
            seg_len = math.sqrt((cur[0] - prev[0])**2 + (cur[1] - prev[1])**2 +
                                (cur[2] - prev[2])**2)
            if seg_len < 1e-6:
                continue
            # Slight taper along the filament
            t_mid = (s - 0.5) / segs
            r = sf.FILAMENT_R * _SHAFT_SCALE * (1.0 - 0.35 * t_mid)
            fil = kit.strut(parts, 'sensory-crown-%s.f%02d.s%02d' % (name, i, s - 1),
                            kit.ROLE_HULL, prev, cur, hull_mat, radius=r,
                            vertices=6)
            if fil is not None:
                objs.append(fil)
            prev = cur
        # Tip droplet — fine cyan node at filament end
        tip = kit.sphere(glow, 'sensory-crown-%s.t%02d' % (name, i),
                         'glow', (tip_x, tip_y, tip_z), (0.05, 0.05, 0.05),
                         glow_mat, segments=8 if detail >= 3 else 6)
        if tip is not None:
            objs.append(_glow_tag(tip))
    return objs


# ===========================================================================
# 2.  BREATHING VENTS — a row of soft mouths along the body
# ===========================================================================
def breathing_vents(parts, glow, name, hull_mat, glow_mat, loc,
                    step=(0.0, 0.0, 1.0), count=4, face='y', detail=3,
                    radius=sf.VENT_R, points=None):
    """A row of breathing vents at absolute sf.VENT_R, seated on one surface.

    Charter: breath — slow breathing is fleet DNA, and the freighter's
    breathing must travel across separate body regions (one call per region).
    Each vent is three parts on three planes (pipeline §6 aperture rule):
    the dark bowl (kit.ROLE_RECESS flattened sphere, radii (r, 0.30r, r) for
    face 'y') sunk so its outer pole sits FLUSH with the skin — 0.60r of
    burial, the connection; the lip (kit.torus, real major r x 1.05, minor
    0.05, kit.ROLE_HULL living tissue) straddling the skin plane; and the
    breath glow (sphere radius 0.22r) whose outer pole stands 0.01 proud of
    the bowl's face and BELOW the lip plane, so the light reads inside the
    mouth, never painted on.

    Anchor: pass ``points`` — an explicit list of mouth centres the caller
    sampled per vent from sf.top_y / sf.bottom_y / sf.flank_x (a row along
    a curving back can NEVER share one fixed y; pipeline §6). The
    loc + step x count form is kept for flat test jigs only. ``face`` is
    'y' (dorsal or ventral surface) or 'x' (flank). Vent radius is the
    absolute sf.VENT_R unless the caller overrides: a bigger organism gets
    MORE vents.

    Detail:
        3/2 → all vents; breath glow at detail 3 only
        1   → half the vents (min 1), bowl only, no lip, no glow
        0   → nothing (vents are surface biology, not mass)
    """
    if detail < 1:
        return []
    if points is not None:
        centres = [tuple(p) for p in points]
    else:
        centres = [(loc[0] + step[0] * i, loc[1] + step[1] * i,
                    loc[2] + step[2] * i) for i in range(count)]
    if detail < 2:
        centres = centres[:max(1, len(centres) // 2)]
    if not centres:
        return []
    ox, oy, oz = _out_of(centres[0], face)
    rot = None if face == 'y' else (0.0, math.pi / 2.0, 0.0)
    bowl_r = radius * _VENT_BOWL
    objs = []
    for i, (cx, cy, cz) in enumerate(centres):
        # bowl: outer pole flush with the skin, deep pole 0.60r inboard
        bx = cx - ox * bowl_r
        by = cy - oy * bowl_r
        bz = cz - oz * bowl_r
        if face == 'y':
            bscale = (radius, bowl_r, radius)
        else:
            bscale = (bowl_r, radius, radius)
        bowl = kit.sphere(parts, '%s.bowl%02d' % (name, i), kit.ROLE_RECESS,
                          (bx, by, bz), bscale, hull_mat,
                          segments=12 if detail >= 3 else 8)
        if bowl is not None:
            objs.append(bowl)
        # lip: torus straddling the skin plane, living tissue (detail 2+;
        # at detail 1 the dark bowl alone carries the mouth read)
        if detail >= 2:
            lip_args = ((cx, cy, cz), radius * 1.05, 0.05, hull_mat)
            if rot is None:
                lip = kit.torus(parts, '%s.lip%02d' % (name, i),
                                kit.ROLE_HULL, *lip_args)
            else:
                lip = kit.torus(parts, '%s.lip%02d' % (name, i),
                                kit.ROLE_HULL, *lip_args, rotation=rot)
            if lip is not None:
                objs.append(lip)
        if detail >= 3:
            # breath glow: outer pole 0.01 proud of the bowl face, below the
            # lip plane; its far hemisphere pierces the bowl — connected.
            gr = radius * _VENT_GLOW
            gx = cx - ox * (gr - 0.01)
            gy = cy - oy * (gr - 0.01)
            gz = cz - oz * (gr - 0.01)
            gb = kit.sphere(glow, '%s.breath%02d' % (name, i), 'glow',
                            (gx, gy, gz), (gr, gr, gr), glow_mat, segments=8)
            if gb is not None:
                objs.append(_glow_tag(gb))
    return objs


# ===========================================================================
# 3.  GRASPING FINS — the guardian's cradle
# ===========================================================================
def grasping_fins(parts, name, mat, root, tips, root_chord=0.50,
                  tip_chord=0.16, thick=0.12, detail=3):
    """A fan of soft grasping finger-pads from one root — the cutter's cradle.

    Charter: cradle-like grasping fins that hold without mauling. Each
    finger is a fleshy swept span (anatomy.swept_span: a bead chain of
    overlapping ellipsoids on a sagging curve) from the shared ``root`` to
    an explicit ``tip`` the caller curled inboard from surface queries.
    To read as whale- or sea-lion-like pads rather than teeth, the tip chord
    is clamped to at least 72% of the root chord — blunt ends, no taper.
    Pearl membrane tissue (kit.ROLE_ARMOUR, names 'fin-grasp-…') hits the
    skin's 'fin' selector.

    Anchor: ``root`` is GIVEN INSIDE THE HULL and used as given — the shared
    root burial is the connectivity. ``tips`` are 2–3 ship-space points
    curling toward the cradle's centre; the caller mirrors the whole call
    for the other side.

    Detail:
        3/2 → all fingers
        1   → two fingers (the outer pair carries the cradle read)
        0   → nothing (the body mass carries the silhouette)
    """
    if detail < 1:
        return []
    tips = [tuple(t) for t in tips]
    if not tips:
        return []
    keep = tips if detail >= 2 else tips[:2]
    # Enforce pad taper minimum: tip never less than _PAD_TIP_MIN of root
    pad_tip = max(tip_chord, root_chord * _PAD_TIP_MIN)
    objs = []
    for i, tip in enumerate(keep):
        objs.extend(an.swept_span(parts, 'fin-grasp-%s.f%02d' % (name, i),
                                  kit.ROLE_ARMOUR, mat, root, tip,
                                  root_chord, pad_tip, thick))
    return objs


# ===========================================================================
# 4.  BELLY CHAMBER — the protected ventral pouch
# ===========================================================================
def belly_chamber(parts, glow, name, hull_mat, glow_mat, loc, size, detail=3):
    """A swollen ventral pouch with a soft dark mouth — rescue and transfer.

    Charter: the guardian's protected belly chamber holds what it rescues.
    The pouch is a flattened sphere of pearl living tissue (kit.ROLE_ARMOUR,
    named 'living-belly-…'; kit.sphere scale is RADII per axis, so the FULL
    ``size`` argument is halved at the call site here — read the kit source:
    sphere takes radii, box takes full extents). The mouth is a dark recess
    ellipsoid piercing the pouch's underside; the dim breath glow sits in
    the mouth, 0.01 proud of the mouth's pole and below the lip folds —
    three planes, pipeline §6.

    Anchor: ``loc`` is the pouch centre; the CALLER seats it so the pouch's
    upper >= 0.10 buries into the belly (sf.bottom_y at the station).

    Detail:
        3/2 → pouch + mouth + glow + two lip folds
        1   → pouch + mouth
        0   → pouch only (it is primary mass — a real bulge in the outline)
    """
    sx, sy, sz = size
    hx, hy, hz = sx * 0.5, sy * 0.5, sz * 0.5
    lx, ly, lz = loc
    objs = []
    pouch = kit.sphere(parts, 'living-belly-%s.pouch' % name, kit.ROLE_ARMOUR,
                       loc, (hx, hy, hz), hull_mat,
                       segments=12 if detail >= 2 else 8)
    if pouch is not None:
        objs.append(pouch)
    if detail < 1:
        return objs
    # mouth: dark recess ellipsoid piercing the pouch's underside pole;
    # its outer pole stands 0.02 below the pouch surface
    mouth_c = (lx, ly - hy - 0.02 + hy * 0.18, lz)
    mouth = kit.sphere(parts, 'living-belly-%s.mouth' % name, kit.ROLE_RECESS,
                       mouth_c, (hx * 0.55, hy * 0.18, hz * 0.55), hull_mat,
                       segments=10 if detail >= 2 else 8)
    if mouth is not None:
        objs.append(mouth)
    if detail < 2:
        return objs
    # breath glow deep in the mouth: pole 0.01 proud of the mouth's pole
    # (mouth pole is at mouth_c.y - hy * 0.18); the glow's far hemisphere
    # stays inside the mouth's solid — the pierce is the connection
    gr = min(hx, hz) * 0.20
    glow_c = (lx, mouth_c[1] - hy * 0.18 - 0.01 + gr, lz)
    gb = kit.sphere(glow, 'living-belly-%s.breath' % name, 'glow', glow_c,
                    (gr, gr, gr), glow_mat, segments=8)
    if gb is not None:
        objs.append(_glow_tag(gb))
    # two lip folds flanking the mouth, pearl flow tissue
    for s in (-1.0, 1.0):
        a = (lx + s * hx * 0.62, ly - hy * 0.55, lz - hz * 0.50)
        b = (lx + s * hx * 0.62, ly - hy * 0.55, lz + hz * 0.50)
        fold = kit.strut(parts, 'living-belly-%s.fold%s' % (name, 'p' if s > 0 else 's'),
                         kit.ROLE_TRIM, a, b, hull_mat, radius=sf.FLOW_R,
                         vertices=6)
        if fold is not None:
            objs.append(fold)
    return objs


# ===========================================================================
# 5.  SANCTUARY HOLLOW — a sheltered berth in the flank
# ===========================================================================
def sanctuary_hollow(parts, glow, name, hull_mat, glow_mat, loc, size=None,
                     face='x', detail=3, glow_panel=True, seed=1):
    """An open hollow in the body where a companion can shelter (§G5).

    Charter: sanctuary hollows are the frigate's visible care for smaller
    kin. No boolean exists, so the hollow is the wave-7 flush-well idiom: a
    dark WELL box (kit.ROLE_RECESS, FULL extents) whose outer face is FLUSH
    with the skin plane and whose body sinks _WELL_DEPTH inboard — the dark
    backdrop the companion reads against; and a GROWN LIP RING of overlapping
    swollen bead-spheres straddling the skin plane, seeded per-bead radius
    and placement variation — irregular and grown, not a perfectly circular
    repeated stamp. One dim glow panel (half-embedded in the well's inner
    face, its outer face 0.025 proud of the skin and below the lip plane)
    completes the three-plane §6 aperture rule.

    Anchor: ``loc`` is the mouth centre ON the surface (the caller computes
    it from sf.flank_x / sf.top_y / sf.bottom_y). ``size`` is the absolute
    sf.HOLLOW (w, h, d FULL extents) unless overridden; ``face`` is 'x'
    (flank) or 'y' (dorsal/ventral). ``seed`` controls lip irregularity.

    Detail:
        3/2 → well + grown lip ring + glow panel
        1   → well + lip ring
        0   → well only (the dark mouth still reads at range)
    """
    if size is None:
        size = sf.HOLLOW
    w, hh, dd = size
    ox, oy, oz = _out_of(loc, face)
    lx, ly, lz = loc
    rand = kit.rng(seed)
    objs = []
    # well: outer face flush with the skin plane, body sunk inboard
    if face == 'x':
        well_size = (_WELL_DEPTH, hh, dd)
        well_loc = (lx - ox * _WELL_DEPTH * 0.5, ly, lz)
        panel_size = (_GLOW_PANEL_T, hh * 0.55, dd * 0.55)
    else:
        well_size = (w, _WELL_DEPTH, dd)
        well_loc = (lx, ly - oy * _WELL_DEPTH * 0.5, lz)
        panel_size = (w * 0.55, _GLOW_PANEL_T, dd * 0.55)
    well = kit.box(parts, '%s.well' % name, kit.ROLE_RECESS, well_loc,
                   well_size, hull_mat, bevel=0.10)
    if well is not None:
        objs.append(well)
    if detail < 1:
        return objs
    # Grown lip ring: overlapping bead-spheres around the mouth ellipse
    n_lip = 10 if detail >= 3 else (8 if detail >= 2 else 6)
    # ellipse semi-axes in the mouth plane (increased by proud offset)
    if face == 'x':
        a_y = hh * 0.5 + _LIP_PROUD
        a_z = dd * 0.5 + _LIP_PROUD
    else:
        a_x = w * 0.5 + _LIP_PROUD
        a_z = dd * 0.5 + _LIP_PROUD
    for i in range(n_lip):
        ang = 2.0 * math.pi * i / n_lip + rand() * 0.25
        ca, sa = math.cos(ang), math.sin(ang)
        # seeded radius and axis variation for grown look
        bead_r = 0.14 + rand() * 0.08
        axis_var = 1.0 + (rand() - 0.5) * 0.3
        # centre on ellipse, straddling the skin plane
        if face == 'x':
            cy = ly + a_y * ca * axis_var
            cz = lz + a_z * sa * axis_var
            # centre offset inboard/outboard: outboard protrusion = _LIP_PROUD
            # bead centre is at plane + ox * (PROUD - r * 0.55) so outer pole ~PROUD
            centre = (lx + ox * (_LIP_PROUD - bead_r * 0.55), cy, cz)
        else:
            cx = lx + a_x * ca * axis_var
            cz = lz + a_z * sa * axis_var
            centre = (cx, ly + oy * (_LIP_PROUD - bead_r * 0.55), cz)
        bead = kit.sphere(parts, 'living-lip-%s.b%02d' % (name, i),
                          kit.ROLE_ARMOUR, centre, (bead_r, bead_r, bead_r),
                          hull_mat, segments=10 if detail >= 3 else 8)
        if bead is not None:
            objs.append(bead)
    if detail >= 2 and glow_panel:
        panel = kit.box(glow, '%s.glow' % name, 'glow', loc, panel_size,
                        glow_mat)
        if panel is not None:
            objs.append(_glow_tag(panel))
    return objs


# ===========================================================================
# 6.  COMPANION CRAFT — a nested young wayfinder (§G5)
# ===========================================================================
def companion_craft(parts, glow, name, hull_mat, glow_mat, loc, length=None,
                    detail=3):
    """A miniature Beautiful Ones manta, light-class anatomy, for a hollow.

    The family in miniature: one swollen living body (kit.sphere, RADII —
    derived from ``length`` only), one soft flipper pair swept back from a
    shared in-body root (anatomy.swept_span bead chains — fleshy rounded
    paddles, never a plank), a faint tail-wake bead, and at full detail a
    two-filament crown hint. Sized by its ``length`` argument, defaulting
    to the absolute sf.COMPANION_LEN — a frigate berth and a freighter
    nursery each get a real scale cue against the parent body.

    Connectivity: the CALLER seats ``loc`` so the body PIERCES the hollow's
    mouth plane or cradle pad by at least 0.10 — two nested closed shells
    share no voxel (pipeline §6), so the companion's belly must pass through
    a surface, and its back standing proud is exactly the visible nesting
    §G5 asks for.

    Detail:
        3   → body + flipper pair + wake bead + crown hint
        2   → body + flipper pair + wake bead
        1/0 → body + flipper pair (the manta read is the scale cue)
    """
    if length is None:
        length = sf.COMPANION_LEN
    lx, ly, lz = loc
    span = length * 0.85               # manta plan: wider than long is legal
    objs = []
    body = kit.sphere(parts, 'living-companion-%s.body' % name,
                      kit.ROLE_ARMOUR, loc,
                      (length * 0.22, length * 0.085, length * 0.38),
                      hull_mat, segments=12 if detail >= 2 else 8)
    if body is not None:
        objs.append(body)
    # flipper pair: two fleshy bead chains from a shared root inside the
    # body sphere, swept aft and out — rounded paddles, never a plank.
    # Detail 2+ keeps the full swept_span chain; detail 1/0 thin to short
    # low-segment chains (same root, same tip — the paddle reach is kept).
    for s, stag in ((1.0, 's'), (-1.0, 'p')):
        wname = 'fin-companion-%s.wing-%s' % (name, stag)
        wroot = (lx, ly + length * 0.01, lz - length * 0.10)
        wtip = (lx + s * span * 0.5, ly, lz + length * 0.22)
        if detail >= 2:
            objs.extend(an.swept_span(parts, wname, kit.ROLE_ARMOUR,
                                      hull_mat, wroot, wtip,
                                      length * 0.55, length * 0.22,
                                      length * 0.05))
        else:
            wth = max(length * 0.05, 0.07)
            objs.extend(an.fleshy_sweep(
                parts, wname, kit.ROLE_ARMOUR, hull_mat, wroot, wtip,
                length * 0.275, length * 0.11, wth * 0.5,
                detail=detail, seed=1, beads=(3 if detail >= 1 else 2)))
    if detail < 2:
        return objs
    # tail-wake bead on a thin tail strut: the chained pair reads as the
    # nested craft's own wake, and the strut keeps the bead connected
    tail_a = (lx, ly, lz + length * 0.34)
    tail_b = (lx, ly, lz + length * 0.47)
    tail = kit.strut(parts, 'fin-companion-%s.tail' % name, kit.ROLE_ARMOUR,
                     tail_a, tail_b, hull_mat, radius=length * 0.014,
                     vertices=6)
    if tail is not None:
        objs.append(tail)
        bead = kit.sphere(glow, 'living-companion-%s.wake' % name, 'glow',
                          tail_b, (length * 0.035,) * 3, glow_mat, segments=8)
        if bead is not None:
            objs.append(_glow_tag(bead))
    if detail >= 3:
        # crown hint: two forward filaments, absolute crown radius
        for s in (-1.0, 1.0):
            fa = (lx + s * length * 0.05, ly + length * 0.02,
                  lz - length * 0.30)
            fb = (lx + s * length * 0.14, ly + length * 0.06,
                  lz - length * 0.52)
            fil = kit.strut(parts, 'sensory-crown-%s.f%s' % (name, 'p' if s > 0 else 's'),
                            kit.ROLE_ACCENT, fa, fb, hull_mat,
                            radius=sf.FILAMENT_R, vertices=6)
            if fil is not None:
                objs.append(fil)
    return objs


# ===========================================================================
# 7.  NURSERY HOLLOW — a sanctuary hollow with companions visibly nested
# ===========================================================================
def nursery_hollow(parts, glow, name, hull_mat, glow_mat, loc, size=None,
                   face='x', occupants=1, detail=3, seed=None):
    """A sanctuary hollow carrying ``occupants`` nested companion craft (§G5).

    Charter: the gardenback freighter's nursery hollows shelter young kin,
    and the nesting must be VISIBLE — the companion's back stands proud of
    the mouth while its belly pierces the well's outer face (two nested
    shells share no voxel; the pierce is both the connectivity and the
    read). Companions are spaced along the hollow's long axis at even pitch
    and built at one detail level lower than the hollow — they are nested
    inside the parent's triangle budget. ``seed`` controls lip irregularity.

    Anchor: exactly as sanctuary_hollow — ``loc`` is the mouth centre ON the
    surface, ``size`` the absolute sf.HOLLOW unless overridden, ``face``
    'x' or 'y'.

    Detail:
        3/2 → hollow (full) + occupants
        1   → hollow (well + lips) + occupants, no glow panel
        0   → well + companion bodies only (the nesting still reads)
    """
    if seed is None:
        # deterministic seed derived from name and loc
        seed_val = hash((name, loc, face)) % 10000
    else:
        seed_val = seed
    objs = sanctuary_hollow(parts, glow, name, hull_mat, glow_mat, loc,
                            size=size, face=face, detail=detail,
                            glow_panel=(detail >= 2 and occupants == 0),
                            seed=seed_val)
    if size is None:
        size = sf.HOLLOW
    dd = size[2]
    ox, oy, oz = _out_of(loc, face)
    sub_detail = max(0, detail - 1)
    for i in range(occupants):
        frac = (i + 0.5) / occupants - 0.5
        cz = loc[2] + frac * dd * 0.8
        # belly 0.10 inboard of the mouth plane: the body pierces the well's
        # outer face and stands proud — connected AND visibly nested
        cloc = (loc[0] + ox * (sf.COMPANION_LEN * 0.085 - 0.10),
                loc[1] + oy * (sf.COMPANION_LEN * 0.085 - 0.10), cz)
        objs.extend(companion_craft(parts, glow, '%s.n%d' % (name, i),
                                    hull_mat, glow_mat, cloc,
                                    detail=sub_detail))
    return objs


# ===========================================================================
# 8. GARDEN FOLD — the freighter's dorsal symbiotic growth
# ===========================================================================
def garden_fold(parts, glow, name, hull_mat, glow_mat, z0, z1, surf, x=0.0,
                detail=3, seed=1):
    """A raised dorsal fold carrying large swollen garden ridges (simplified).

    Charter: the migration vessel's back supports symbiotic gardens; slow
    breathing travels across the separate regions. This function builds a
    few LARGE readable garden swells (2-3 per fold, separated by breathing
    gaps) each a swollen ellipsoid mass that follows the back surface and
    interpenetrates with neighbours to form one continuous ridge. At full
    detail, each swell raises one broad frond with a pearl tip; every other
    swell carries a tiny cyan bud — the garden's share of the 5 % emissive
    budget, far sparser than the old dense coral.

    Anchor: ``surf(z)`` is the back height at lateral offset ``x`` (build it
    with sf.surf_top(stations, x)); every swell re-samples at its OWN
    station and is skipped at 0.0. Three separate calls (fore/mid/aft) with
    gaps between them create the three separated biomes the reference plate
    shows.

    Detail:
        3 → swells (3) + fronds + pearl tips + cyan buds
        2 → swells (2) + fronds, no buds
        1 → one swell only
        0 → nothing (the loft carries the mass)
    """
    if detail < 1:
        return []
    span = z1 - z0
    if span <= 0.0:
        return []
    n_swell = 3 if detail >= 3 else (2 if detail >= 2 else 1)
    rand = kit.rng(seed)
    objs = []
    # Swell centres distributed along the span, biased toward fore
    for i in range(n_swell):
        t = (i + 0.7) / (n_swell + 0.4)  # fore-biased placement
        z = z0 + t * span
        sy = surf(z)
        if sy == 0.0:
            continue
        # Swollen ellipsoid radii (world units)
        ry = 0.24 + rand() * 0.06    # vertical half-height
        rz = 0.18 + rand() * 0.06    # along-span half-length
        rx = 0.12 + rand() * 0.04    # lateral half-width
        centre = (x, sy - ry * 0.4, z)  # 40% buried into the back
        swell = kit.sphere(parts, '%s.s%02d' % (name, i), kit.ROLE_HULL,
                           centre, (rx, ry, rz), hull_mat,
                           segments=12 if detail >= 3 else 8)
        if swell is not None:
            objs.append(swell)
        if detail < 2:
            continue
        # Broad frond rising from the swell
        ftop = (x, sy + 0.25 + rand() * 0.12, z)
        fmid = (centre[0], centre[1] + ry * 0.7, centre[2])
        fr = kit.strut(parts, '%s.fr%02d' % (name, i), kit.ROLE_HULL,
                       fmid, ftop, hull_mat, radius=0.06, vertices=6)
        if fr is not None:
            objs.append(fr)
            tip = kit.sphere(parts, '%s.ft%02d' % (name, i), kit.ROLE_TRIM,
                            ftop, (0.10, 0.12, 0.10), hull_mat,
                            segments=8)
            if tip is not None:
                objs.append(tip)
                if detail >= 3 and rand() < 0.45:
                    # cyan bud on every other swell
                    bud = kit.sphere(glow, '%s.fb%02d' % (name, i), 'glow',
                                     (ftop[0], ftop[1] + 0.08, ftop[2]),
                                     (0.04, 0.04, 0.04), glow_mat, segments=8)
                    if bud is not None:
                        objs.append(_glow_tag(bud))
    return objs


# ===========================================================================
# 9. DORSAL MANTLES — the heavy's stacked shieldback masses
# ===========================================================================
def dorsal_mantles(parts, name, mat, loc, size, count=3, seed=1, detail=3):
    """Three overlapping swollen dorsal masses forming the heavy's shieldback.

    Charter: the heavy's layered muscular mantles are three swollen ellipsoid
    spheres stacked over the central back, deeply interpenetrating with soft
    biological transitions — more whale muscle / ray cartilage than shell
    plates. Each mass is offset aftward and laterally (seeded jitter) so
    they are NOT coaxial discs; no disc silhouette at any angle. The lowest
    mass (index 0) centres at ``loc`` (GIVEN so it buries ≥ 0.10 into the
    hull). Successive masses rise, each burying 40% of its vertical half-
    height into the one below, creating one continuous shield. Radii obey
    the 'no disc' rule: ry ≥ 0.55 * rz for every mass.

    ``size`` is the FULL extents (w, h, d) of the LOWEST (largest) mantle.
    ``count`` is 3 by default (class brief); ``detail`` controls sphere
    segmentation (20 segments at detail ≥ 2, 12 at detail 0/1).

    Detail:
        3/2/1/0 → all masses (mantles are primary mass, always present)
    """
    w, h, d = size
    rx_base = w * 0.5
    ry_base = h * 0.5
    rz_base = d * 0.5
    rand = kit.rng(seed)
    objs = []
    prev_centre = loc
    prev_ry = ry_base
    prev_rz = rz_base
    segments = 20 if detail >= 2 else 12
    for i in range(count):
        # Scale down successive mantles
        scale = 1.0 - i * 0.22  # a=1.0, b=0.78, c=0.56
        rx = rx_base * scale
        ry = ry_base * scale
        rz = rz_base * scale
        # Enforce no-disc silhouette: ry ≥ 0.55 * rz
        min_ry = _MANTLE_RY_MIN * rz
        if ry < min_ry:
            ry = min_ry
        # Offsets for interpenetration and jitter
        if i == 0:
            # First mantle centre is given (loc)
            centre = prev_centre
        else:
            # Aftward offset: 35% overlap of along-span radii
            z_drift = (rz + prev_rz) * 0.5 * 0.35
            # Seeded lateral jitter to avoid coaxial look
            x_jitter = (rand() - 0.5) * rx * 0.12
            z_jitter = (rand() - 0.5) * rz * 0.12
            # Vertical rise: 40% burial of current ry into previous mass
            dy = prev_ry * 0.5 + ry * 0.15  # same formula as comment
            centre = (prev_centre[0] + x_jitter,
                      prev_centre[1] + dy,
                      prev_centre[2] + z_drift + z_jitter)
        mantle = kit.sphere(parts, 'living-body-mantle-%s' % chr(97 + i),
                            kit.ROLE_ARMOUR, centre, (rx, ry, rz),
                            mat, segments=segments)
        if mantle is not None:
            objs.append(mantle)
            prev_centre = centre
            prev_ry = ry
            prev_rz = rz
    return objs
