"""Red Ledger shared equipment language.

Every function builds geometry through ``ship_kit`` only.  No hull queries
live here.  The caller computes anchors with ``surface`` (sf.*) and passes
them as explicit absolute ship-space coordinates.

Ship-space convention (inherited from ship_kit):
    x = beam        (+ starboard,  - port)
    y = height      (+ up)
    z = length      (+ stern,  nose at -Z)

FACING notes appear in every docstring.  A construct mounted backwards passes
every numeric gate and only shows in the render.

SIZE convention, and it is load-bearing because the kit is NOT uniform:
    kit.box / kit.plate_grid / kit.panel_lines / kit.greeble_field  -> HALF-extents
    kit.plate_course -> axis figure is a FULL span, the two cross figures are HALF
    kit.chamfer_block / kit.taper_block / kit.wedge -> FULL extents (halved inside)
    kit.cyl / kit.torus / kit.strut -> real radius and depth
The absolute constants below are FULL sizes, so a `kit.box` call halves one
first. Getting this wrong is silent — no gate sees it — and it cost this wave a
round in both directions: full extents into `kit.box` made every seam bead a
copper frame twice the hull beam, and halved extents into `kit.taper_block`
detached the heavy's ram from its own hull.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

import math


# ---------------------------------------------------------------------------
# Human-scale absolute constants — NEVER multiplied by l, b or h.
# A larger Red Ledger ship carries MORE of these, never bigger ones.
# ---------------------------------------------------------------------------
_LAMP_SIZE    = (0.14, 0.12, 0.08)   # one amber work-lamp face
_TALLY_W      = 0.05                  # tally stroke width  (X)
_TALLY_H      = 0.22                  # tally stroke height (Y)  ≈ TALLY_SPACING
_TALLY_D      = 0.04                  # tally stroke depth  (Z)
_STATUS_SLIT  = (0.10, 0.05, 0.04)   # amber status slit (one unit)
_BOLT_HEAD    = (0.06, 0.06, 0.06)   # one bolt head on a door ring
_CAGE_BAR_R   = 0.025                # cage bar radius (transfer lock)
_PAD_H        = 0.20                 # stand-off pad height
_PAD_R        = 0.06                 # stand-off pad radius
_PORT_SPACING = 0.34                 # window centre-to-centre pitch
_PORT_LIGHT   = (0.20, 0.13, 0.06)  # one cabin window size
_AIRLOCK_SIZE = (0.72, 0.60, 0.42)  # rescue-hatch / airlock bounding volume


# ---------------------------------------------------------------------------
# Internal helper: glow-tagged box through kit — no direct bpy calls needed.
# kit.box appends to its first argument ('parts'); we pass 'glow' there so the
# object lands in the glow list, then we overwrite skin_role to 'glow'.
# ---------------------------------------------------------------------------
def _glow_box(glow, name, loc, size, glow_mat):
    """Create one emissive box appended to *glow*; skin_role forced to 'glow'."""
    obj = kit.box(glow, name, kit.ROLE_TRIM, loc, size, glow_mat)
    obj['skin_role'] = 'glow'
    return obj


# ===========================================================================
# 1.  WELD BEAD
# ===========================================================================
def weld_bead(parts, name, hw, hh, yo, ch, z, mat,
              thickness=0.10, over=0.06, detail=1):
    """Raised armour bead ring at a butt-welded section seam.

    Facing: symmetric — wraps the cross-section at ship-Z = ``z``; the ring
    has no preferred nose/stern face.

    Anchor: call ``sf.seam_ring(stations, z)`` → (hw, hh, yo, ch) and pass
    those four values here together with ``z`` as the absolute seam position.
    ``ch`` is accepted for caller convenience (seam_ring returns a 4-tuple)
    but is not used internally — the bead is a rectangular ring of four boxes.

    Detail:
        0 → nothing (decorative work suppressed)
        1+ → four overlapping ROLE_ARMOUR blocks forming a closed ring; each
              block sinks ``over`` into the loft on its inward face, guaranteeing
              intersection with the hull body on all four sides (anti-floating gate).
    """
    if detail < 1:
        return []
    objs = []
    # SIZE CONVENTION: every kit primitive takes HALF-extents. A strap that is
    # `thickness` proud and buried `over` deep is (thickness + over) FULL in the
    # radial axis, so its half-extent is half of that. Passing the full figure
    # here is what once made every seam render as a copper frame twice the beam.
    zh = thickness            # half of a 2 * thickness axial band
    rh = (thickness + over) * 0.5

    # Top strap: stands `thickness` proud of the section top, buried `over` deep.
    top_cy = yo + hh + thickness * 0.5 - over * 0.5
    objs.append(kit.box(parts, name + '.top', kit.ROLE_ARMOUR,
                        (0.0, top_cy, z),
                        (hw + thickness, rh, zh), mat))

    # Bottom strap
    bot_cy = yo - hh - thickness * 0.5 + over * 0.5
    objs.append(kit.box(parts, name + '.bot', kit.ROLE_ARMOUR,
                        (0.0, bot_cy, z),
                        (hw + thickness, rh, zh), mat))

    # Port strap: outboard of the port hull face, buried `over` inward (+X).
    port_cx = -(hw + thickness * 0.5 - over * 0.5)
    objs.append(kit.box(parts, name + '.port', kit.ROLE_ARMOUR,
                        (port_cx, yo, z),
                        (rh, hh, zh), mat))

    # Starboard strap
    stbd_cx = hw + thickness * 0.5 - over * 0.5
    objs.append(kit.box(parts, name + '.stbd', kit.ROLE_ARMOUR,
                        (stbd_cx, yo, z),
                        (rh, hh, zh), mat))

    return objs


# ===========================================================================
# 2.  CAPTURE COLLAR
# ===========================================================================
def capture_collar(parts, name, hw, hh, yo, ch, z, mat,
                   depth, ribs=4, detail=1):
    """Heavy zone-boundary collar: thick bead ring plus longitudinal ribs.

    Used at ZONE seams where two differently-captured hull sections are
    butt-joined.  The longitudinal ribs read as mechanical capture hardware
    binding the two sections together — the signature that the seam is a
    deliberate join, not a crack.  ROLE_ARMOUR throughout.

    Facing: symmetric at ``z``; ribs extend ``depth`` units toward +Z (stern).
    Call with ``z`` at the zone boundary.

    Anchor: call ``sf.seam_ring(stations, z)`` → (hw, hh, yo, ch), then pass
    those values plus ``z`` and an absolute ``depth`` (typically 0.18 – 0.30 m).

    Detail:
        0 → nothing
        1 → bead ring only (thicker than a plain weld_bead)
        2+ → bead ring plus ``ribs`` longitudinal straps at equal angular pitch
    """
    objs = []
    if detail < 1:
        return objs

    # Thicker bead ring
    objs.extend(weld_bead(parts, name + '.bead', hw, hh, yo, ch, z, mat,
                          thickness=0.14, over=0.08, detail=detail))

    if detail < 2:
        return objs

    # Longitudinal ribs binding the two captured sections together.
    #
    # These used to be projected from an even ANGULAR sweep onto the section's
    # rectangular perimeter, which puts a rib on the chamfered CORNERS — where
    # the real lofted hull has already fallen away, so the rib touches nothing
    # and the probe reports it as a floating group. Ribs are distributed across
    # the four FLAT faces instead, inside each face's straight span, where the
    # bead straps already sit.
    rib_w  = 0.08   # rib cross-section width (full)
    rib_t  = 0.06   # rib outward protrusion (full)
    rib_cz = z + depth * 0.5
    flat_hw = max(hw - ch, hw * 0.25)   # straight span of the top/bottom faces
    flat_hh = max(hh - ch, hh * 0.25)   # straight span of the port/stbd faces

    for i in range(ribs):
        face = i % 4                     # 0 top, 1 starboard, 2 bottom, 3 port
        step = i // 4                    # second lap sits inboard of the first
        frac = 0.62 if step == 0 else 0.30
        if face == 0:      # top face, offset in X, rib proud in +Y
            rib_cx = flat_hw * frac
            rib_cy = yo + hh + (rib_t - 0.10) * 0.5
        elif face == 2:    # bottom face
            rib_cx = -flat_hw * frac
            rib_cy = yo - hh - (rib_t - 0.10) * 0.5
        elif face == 1:    # starboard flank, offset in Y, rib proud in +X
            rib_cx = hw + (rib_t - 0.10) * 0.5
            rib_cy = yo + flat_hh * frac
        else:              # port flank
            rib_cx = -(hw + (rib_t - 0.10) * 0.5)
            rib_cy = yo - flat_hh * frac

        objs.append(kit.box(parts, '%s.rib.%02d' % (name, i), kit.ROLE_ARMOUR,
                            (rib_cx, rib_cy, rib_cz),
                            (rib_w * 0.5, rib_t * 0.5, depth * 0.5), mat))

    return objs


# ===========================================================================
# 3.  TALLY BAND
# ===========================================================================
def tally_band(parts, name, x, y, z0, z1, mat, strokes, inward, detail=1):
    """Disciplined run of ROLE_ACCENT dried-red tally strokes on one flank.

    Each stroke is a fixed-size box, half-buried into the hull flank to read
    as scratched-in prize marks.  Strokes are evenly pitched over the Z run;
    count is always supplied by the caller.

    Facing: strokes are mounted perpendicular to the hull flank, parallel to
    ship Y.  They face outward along the X axis.  A tally band on the starboard
    face uses a negative ``inward``; one on the port face uses a positive ``inward``.

    Anchor: ``x`` from ``sf.flank_anchor(stations, z, y, inset)``; mirror with
    negative sign for port.  ``y`` is the vertical centre of the band in
    absolute ship space.  ``inward`` is +1 to bury into the +X face (port) or
    -1 to bury into the -X face (starboard): each stroke shifts by
    ``inward * _TALLY_W * 0.5`` so its inner half is inside the hull surface.

    Detail:
        0 → nothing
        1+ → all ``strokes`` tally marks at even pitch across z0 – z1

    Strokes are NEVER scaled with the hull: _TALLY_W / _TALLY_H / _TALLY_D
    are absolute constants.  A larger ship carries more strokes, not bigger ones.
    """
    if detail < 1 or strokes < 1:
        return []
    objs = []
    run   = z1 - z0
    pitch = run / strokes
    # Half-bury: shift stroke centre into the hull surface by half its width
    sx = x + inward * _TALLY_W * 0.5

    for i in range(strokes):
        sz = z0 + (i + 0.5) * pitch
        objs.append(kit.box(parts, '%s.%02d' % (name, i), kit.ROLE_ACCENT,
                            (sx, y, sz),
                            (_TALLY_W * 0.5, _TALLY_H * 0.5, _TALLY_D * 0.5), mat))
    return objs


# ===========================================================================
# 4.  GRAPPLE ARM
# ===========================================================================
def grapple_arm(parts, glow, name, root, tip, mat, glow_mat, radius, jaw, detail):
    """Swept grasping arm from inside the hull body to a boarding tip.

    The arm sweeps outward from ``root`` (which MUST sit inside the hull
    volume) to ``tip`` through a jointed strut pair with a knuckle box at the
    midpoint, terminating in a two-piece converging jaw that opens toward -Z
    (the nose / approach direction).

    Facing: jaw opens toward -Z (nose).  The arm extends from hull interior
    outward; if ``root`` is outside the hull the arm will be detached and fail
    the connectivity gate.

    Anchor: derive ``root`` in the class file using ``sf.flank_x`` at a y below
    the section midline so the root coordinate is inboard of the hull surface.
    ``tip`` is the absolute boarding tip position.  ``jaw`` is the total jaw
    opening width in the X direction (beam axis) at the tip.

    Detail:
        0 → nothing
        1 → two strut segments root→knuckle→tip only (ROLE_ARMOUR)
        2 → segments + knuckle chamfer_block + converging two-piece jaw at tip
        3 → detail 2 + small amber sensor_mast status lamp at the knuckle joint
    """
    if detail < 1:
        return []
    objs = []
    rx, ry, rz = root
    tx, ty, tz = tip

    # Knuckle at arm midpoint
    kx = (rx + tx) * 0.5
    ky = (ry + ty) * 0.5
    kz = (rz + tz) * 0.5
    knuckle = (kx, ky, kz)

    # Two arm segments
    seg0 = kit.strut(parts, name + '.seg0', kit.ROLE_ARMOUR, root, knuckle, mat, radius)
    if seg0:
        objs.append(seg0)
    seg1 = kit.strut(parts, name + '.seg1', kit.ROLE_ARMOUR, knuckle, tip, mat, radius)
    if seg1:
        objs.append(seg1)

    if detail < 2:
        return objs

    # Knuckle box: chamfered armour block housing the joint.
    # kit.chamfer_block takes FULL extents, so this cube is 2.8 r on a side.
    ksize = radius * 2.8
    kbox = kit.chamfer_block(parts, name + '.knuckle', kit.ROLE_ARMOUR,
                             knuckle, (ksize, ksize, ksize), mat)
    objs.append(kbox)

    # Two-piece converging jaw: two struts diverge from a forward apex to the tip spread
    jaw_half  = jaw * 0.5
    jaw_r     = radius * 0.72
    jaw_apex  = (tx, ty, tz - jaw * 0.75)   # apex forward of tip, toward nose (-Z)
    jaw_a     = (tx - jaw_half, ty, tz)
    jaw_b     = (tx + jaw_half, ty, tz)
    j0 = kit.strut(parts, name + '.jaw.a', kit.ROLE_ARMOUR, jaw_apex, jaw_a, mat, jaw_r)
    j1 = kit.strut(parts, name + '.jaw.b', kit.ROLE_ARMOUR, jaw_apex, jaw_b, mat, jaw_r)
    jt = kit.box(parts, name + '.jaw.tip', kit.ROLE_ARMOUR,
                 jaw_apex, (jaw_r, jaw_r, jaw_r), mat)
    if j0:
        objs.append(j0)
    if j1:
        objs.append(j1)
    objs.append(jt)

    if detail < 3:
        return objs

    # Amber status lamp at the knuckle: sensor_mast provides housing + glow eye
    lamp_objs = kit.sensor_mast(parts, glow, name + '.lamp',
                                (kx, ky + ksize * 0.5 + 0.02, kz),
                                mat, glow_mat, 0.12, 0.04)
    objs.extend(lamp_objs)

    return objs


# ===========================================================================
# 5.  CLAMP PAD
# ===========================================================================
def clamp_pad(parts, name, loc, mat, size, teeth=3, detail=1):
    """Magnetic clamp pad with countable gripping teeth.

    Facing: teeth point in the +Y direction (away from the hull surface the
    pad mounts against).  Mount the pad with its -Y face flush against or
    slightly buried in the hull surface so it reads attached.

    Anchor: ``loc`` is the pad volume centre in absolute ship space.  No surface
    query needed; caller places the pad by offsetting from ``sf.top_y`` or
    ``sf.flank_x`` by half the pad Y size.

    Detail:
        0 → nothing
        1 → main pad body only (ROLE_ARMOUR box)
        2+ → pad body plus ``teeth`` gripping teeth on the +Y face; tooth height
              is a fixed absolute constant, never scaled by hull size
    """
    if detail < 1:
        return []
    lx, ly, lz = loc
    sx, sy, sz = size
    pad = kit.box(parts, name + '.pad', kit.ROLE_ARMOUR, loc, size, mat)
    objs = [pad]

    if detail < 2:
        return objs

    # Teeth: absolute size, evenly spaced along Z, sitting on the pad +Y face
    tooth_w = sx * 0.40   # tooth footprint in X (proportional to the pad, not hull)
    tooth_h = 0.06        # absolute height — never hull-scaled
    tooth_d = 0.04        # absolute depth in Z
    tooth_y = ly + sy * 0.5 + tooth_h * 0.5

    for i in range(teeth):
        tz = lz - sz * 0.5 + sz * (i + 0.5) / teeth
        objs.append(kit.box(parts, '%s.tooth.%02d' % (name, i), kit.ROLE_ARMOUR,
                            (lx, tooth_y, tz),
                            (tooth_w, tooth_h, tooth_d), mat))
    return objs


# ===========================================================================
# 6.  BREACH TUBE
# ===========================================================================
def breach_tube(parts, glow, name, z0, z1, mat, glow_mat, radius, detail):
    """Armoured centreline boarding/breaching tube running along ship Z.

    Facing: the MOUTH faces the NOSE (-Z direction).  ``z0`` is the nose
    (forward) end — the lit entry throat that points at the target.  ``z1``
    is the stern end where the tube is welded into the hull body.

    The tube is placed at ship x=0, y=0 (centreline) by this function.  The
    class file must choose z0 and z1 in absolute ship-Z coordinates.

    Anchor: ``z0`` and ``z1`` are absolute ship-Z values.  Caller derives them
    from hull station data; no hull query is made here.

    Detail:
        0 → nothing
        1 → main armoured cylinder only (ROLE_ARMOUR)
        2 → cylinder plus torus reinforcement rings along the length
        3 → detail 2 + lit nozzle_ring throat at z0 (the nose-facing mouth)
    """
    if detail < 1:
        return []
    objs  = []
    length = z1 - z0
    ctr_z  = (z0 + z1) * 0.5
    rot_z  = (math.pi * 0.5, 0.0, 0.0)   # align cylinder depth along ship +Z

    # Main body
    body = kit.cyl(parts, name + '.body', kit.ROLE_ARMOUR,
                   (0.0, 0.0, ctr_z), radius, length, mat, rotation=rot_z)
    objs.append(body)

    if detail < 2:
        return objs

    # Torus reinforcement rings: spaced along the tube length
    n_rings   = max(2, int(length / 1.5))
    ring_minor = radius * 0.10
    for i in range(n_rings):
        rz = z0 + (i + 1) * length / (n_rings + 1)
        ring = kit.torus(parts, '%s.ring.%02d' % (name, i), kit.ROLE_ARMOUR,
                         (0.0, 0.0, rz),
                         radius + ring_minor, ring_minor, mat,
                         rotation=rot_z)
        objs.append(ring)

    if detail < 3:
        return objs

    # Lit throat collar at the nose mouth (z0): nozzle_ring provides an
    # armoured annular collar and amber interior glow.
    throat_objs = kit.nozzle_ring(parts, glow, name + '.throat',
                                  (0.0, 0.0, z0), mat, glow_mat,
                                  radius, radius * 0.18)
    objs.extend(throat_objs)

    return objs


# ===========================================================================
# 7.  SHUTTER WELL
# ===========================================================================
def shutter_well(parts, name, loc, mat, size, plates=2, open_frac=0.0, detail=1):
    """Hidden weapon position: a recessed well with sliding shutter plates.

    Facing: the well opens in the +Y direction (hull surface normal); mount
    with the +Y face of the well at the hull surface.  Shutter plates slide
    in the X direction (beam axis) to reveal the weapon below.

    Anchor: ``loc`` is the well volume centre in absolute ship space.  No surface
    query needed; caller places the centre so the +Y face aligns with the hull
    surface (typically derived from ``sf.top_y``).

    ``open_frac`` 0.0 = plates fully closed (hairline seam at centreline);
    1.0 = plates fully retracted (weapon position completely exposed).

    Detail:
        0 → nothing
        1 → ROLE_RECESS well only
        2+ → well plus ``plates`` sliding cover panels (ROLE_HULL) arranged as
              left/right pairs; for plates > 2, pairs are stacked in Z slices
    """
    if detail < 1:
        return []
    lx, ly, lz = loc
    sx, sy, sz = size
    objs = []

    # Recessed well
    well = kit.box(parts, name + '.well', kit.ROLE_RECESS, loc, size, mat)
    objs.append(well)

    if detail < 2:
        return objs

    # Sliding cover plates: left/right pairs; for plates > 2, stacked in Z.
    plate_thick = 0.04   # absolute plate thickness
    pairs       = max(1, plates // 2)
    pair_sz     = sz / pairs

    for p in range(pairs):
        pair_z_ctr = lz - sz * 0.5 + (p + 0.5) * pair_sz
        for s, side in enumerate((+1, -1)):
            # Closed: centre at ±sx/4.  Open: centre at ±3*sx/4 (retracted past edge).
            cx  = lx + side * (sx * 0.25 + open_frac * sx * 0.50)
            cy  = ly + sy * 0.5 + plate_thick * 0.5
            idx = p * 2 + s
            objs.append(kit.box(parts, '%s.plate.%02d' % (name, idx),
                                kit.ROLE_HULL,
                                (cx, cy, pair_z_ctr),
                                (sx * 0.5, plate_thick, pair_sz), mat))

    return objs


# ===========================================================================
# 8.  VAULT BLOCK
# ===========================================================================
def vault_block(parts, glow, name, loc, mat, glow_mat, size, detail, pads=4):
    """Bolted ransom/cargo vault on stand-off pads.

    A heavy armoured chamfer_block raised above the hull on cylindrical stand-off
    pads.  The door face is on +Z (stern).  One amber status slit sits above
    the bolt ring on the door face.

    Facing: door on +Z (stern); bolt ring visible from behind the ship.
    Call with ``loc`` positioned so pad cylinder bottoms are buried inside the
    hull body — the pads are the connectivity element that anchors the vault.

    Anchor: ``loc`` is the vault box centre in absolute ship space.  Caller
    raises loc.y above the hull surface by (_PAD_H + size.y / 2) so pads
    reach down into the hull.  Derive the hull surface from ``sf.top_y``.

    Detail:
        0 → nothing
        1 → main vault chamfer_block only (ROLE_ARMOUR)
        2 → vault + stand-off pads (absolute _PAD_R / _PAD_H) + recessed door panel
        3 → detail 2 + countable bolt ring (8 × _BOLT_HEAD) + amber status slit
    """
    if detail < 1:
        return []
    lx, ly, lz = loc
    sx, sy, sz = size
    objs = []

    # Main vault body
    vault = kit.chamfer_block(parts, name + '.vault', kit.ROLE_ARMOUR, loc, size, mat)
    objs.append(vault)

    if detail < 2:
        return objs

    # Stand-off pads: arranged in a 2 × cols grid at the bottom face corners
    cols   = max(1, (pads + 1) // 2)
    emitted = 0
    for r in range(2):
        px = lx + (sx * 0.35 if r == 1 else -sx * 0.35)
        for c in range(cols):
            if emitted >= pads:
                break
            pz = lz + (-sz * 0.35 + c * sz * 0.70 / max(cols - 1, 1)) if cols > 1 else lz
            py = ly - sy * 0.5 - _PAD_H * 0.5
            obj = kit.cyl(parts, '%s.pad.%02d' % (name, emitted), kit.ROLE_ARMOUR,
                          (px, py, pz), _PAD_R, _PAD_H, mat)
            objs.append(obj)
            emitted += 1

    # Recessed door panel on the +Z (stern) face
    door_z = lz + sz * 0.5
    door   = kit.box(parts, name + '.door', kit.ROLE_RECESS,
                     (lx, ly, door_z + 0.02),
                     (sx * 0.74, sy * 0.74, 0.06), mat)
    objs.append(door)

    if detail < 3:
        return objs

    # Countable bolt ring: 8 bolt heads arranged in a circle around the door
    n_bolts     = 8
    bolt_ring_r = min(sx, sy) * 0.38
    bz          = door_z + _BOLT_HEAD[2] * 0.5
    for i in range(n_bolts):
        angle = 2.0 * math.pi * i / n_bolts
        bx = lx + bolt_ring_r * math.cos(angle)
        by = ly + bolt_ring_r * math.sin(angle)
        objs.append(kit.box(parts, '%s.bolt.%02d' % (name, i), kit.ROLE_ARMOUR,
                            (bx, by, bz), _BOLT_HEAD, mat))

    # Amber status slit above the bolt ring
    slit_loc = (lx, ly + bolt_ring_r + _STATUS_SLIT[1], door_z + _STATUS_SLIT[2] * 0.5)
    slit     = _glow_box(glow, name + '.slit', slit_loc, _STATUS_SLIT, glow_mat)
    objs.append(slit)

    return objs


# ===========================================================================
# 9.  COUNTING HOUSE
# ===========================================================================
def counting_house(parts, glow, name, loc, mat, glow_mat, size, detail):
    """Mobile counting-house command module.

    A squat armoured house for prize accounting and short-range coordination.
    Window row faces forward (-Z / nose) so the crew can watch the approach.
    Transfer hatch is on the stern face (+Z) for docking access.
    An amber interior band below the windows lights the work at detail 3.

    Facing: windows on -Z face (looking toward nose); hatch on +Z face (stern).
    Mount with the -Y face of the module at the hull surface.

    Anchor: ``loc`` is the module centre in absolute ship space.  Caller places
    it using ``sf.top_y`` for the deck height; loc.y = top_y + size.y / 2.

    Detail:
        0 → nothing
        1 → armoured house body only (ROLE_HULL chamfer_block)
        2 → house + forward window row (glow) + stern transfer hatch
        3 → detail 2 + amber interior light band below the windows
    """
    if detail < 1:
        return []
    lx, ly, lz = loc
    sx, sy, sz = size
    objs = []

    # Pre-compute positions used at both detail 2 and detail 3
    win_face_z = lz - sz * 0.5         # nose face (-Z)
    win_y      = ly + sy * 0.28        # upper portion of the face

    # Squat armoured house
    house = kit.chamfer_block(parts, name + '.house', kit.ROLE_HULL, loc, size, mat)
    objs.append(house)

    if detail >= 2:
        # Window row: _PORT_SPACING pitch, fixed absolute window size
        win_count = max(1, int(sx / _PORT_SPACING))
        wins = kit.window_row(glow, name + '.wins',
                              (lx, win_y, win_face_z),
                              glow_mat, win_count, _PORT_SPACING, _PORT_LIGHT)
        objs.extend(wins)

        # Transfer hatch on the stern face (+Z), human-scale size
        hatch_objs = kit.rescue_hatch(parts, glow, name + '.hatch',
                                      (lx, ly, lz + sz * 0.5),
                                      mat, glow_mat, _AIRLOCK_SIZE, face='z')
        objs.extend(hatch_objs)

    if detail >= 3:
        # Amber interior light band: thin glow strip just below the window row
        band_size = (sx * 0.65, 0.04, 0.04)
        band_loc  = (lx, win_y - _PORT_LIGHT[1] - 0.03, win_face_z + 0.02)
        band      = _glow_box(glow, name + '.band', band_loc, band_size, glow_mat)
        objs.append(band)

    return objs


# ===========================================================================
# 10. TRANSFER LOCK
# ===========================================================================
def transfer_lock(parts, glow, name, loc, mat, glow_mat, size, detail):
    """Caged prisoner/cargo transfer lock.

    An armoured bore collar running along Z, surrounded by a ring of cage bars,
    with a rescue hatch at the entry face (-Z / nose) and a hazard amber lamp
    at the cage crown.

    Facing: entry hatch on -Z face (nose); bore runs along Z from forward entry
    to aft interior.  Mount so the -Z face is accessible from outside the hull.

    Anchor: ``loc`` is the assembly centre in absolute ship space.  Derive it
    from ``sf.flank_x`` or ``sf.top_y`` so the hatch face aligns with the hull
    surface.  ``size.z`` sets cage depth; ``size.x`` / ``size.y`` set the cage
    cross-section (bore radius scales to 28 % of the smaller axis).

    Detail:
        0 → nothing
        1 → armoured bore collar + rescue hatch at -Z entry face
        2 → detail 1 + six cage bars (ROLE_ARMOUR struts) around the bore
        3 → detail 2 + amber hazard sensor_mast lamp at cage crown
    """
    if detail < 1:
        return []
    lx, ly, lz = loc
    sx, sy, sz = size
    objs = []

    bore_r = min(sx, sy) * 0.28          # bore radius, proportional to lock cross-section
    cage_r = bore_r * 1.90               # cage bar ring radius (pre-computed for detail 3)
    rot_z  = (math.pi * 0.5, 0.0, 0.0)  # cylinder along ship Z

    # Armoured bore collar
    bore = kit.cyl(parts, name + '.bore', kit.ROLE_ARMOUR,
                   (lx, ly, lz), bore_r, sz, mat, rotation=rot_z)
    objs.append(bore)

    # Entry hatch on the nose face (-Z), human-scale size
    hatch_objs = kit.rescue_hatch(parts, glow, name + '.hatch',
                                  (lx, ly, lz - sz * 0.5),
                                  mat, glow_mat, _AIRLOCK_SIZE, face='-z')
    objs.extend(hatch_objs)

    if detail >= 2:
        # Cage bar ring: six struts parallel to Z around the bore
        n_bars = 6
        for i in range(n_bars):
            angle = 2.0 * math.pi * i / n_bars
            bar_x = lx + cage_r * math.cos(angle)
            bar_y = ly + cage_r * math.sin(angle)
            bar   = kit.strut(parts, '%s.bar.%02d' % (name, i), kit.ROLE_ARMOUR,
                              (bar_x, bar_y, lz - sz * 0.5),
                              (bar_x, bar_y, lz + sz * 0.5),
                              mat, _CAGE_BAR_R)
            if bar:
                objs.append(bar)

    if detail >= 3:
        # Hazard amber lamp at the cage crown (top of cage ring)
        lamp_objs = kit.sensor_mast(parts, glow, name + '.lamp',
                                    (lx, ly + cage_r + 0.02, lz - sz * 0.25),
                                    mat, glow_mat, 0.12, 0.04)
        objs.extend(lamp_objs)

    return objs


# ===========================================================================
# 11. CAPTURED DRIVE
# ===========================================================================
def captured_drive(parts, glow, name, loc, mat, glow_mat, radius, depth, nozzles, detail):
    """A seized drive package welded onto the hull from a different ship family.

    The housing is a chamfer_block whose proportions deliberately do not match
    the surrounding hull section (wider, squatter), making the foreign origin
    legible at a glance.

    The adapter collar at the -Z (hull-facing) end is THE visual key: it is
    the raised weld ring that announces the drive was grafted in, not fitted
    from new.  Without the collar, the drive reads as original equipment.

    Callers MUST mount pairs deliberately mismatched: give each side a different
    ``radius``, ``depth``, and vertical / axial position in ``loc``.  Symmetric
    captured drives break the predatory asymmetry that is the Ledger's mark.

    Facing: nozzles face +Z (stern exhaust); adapter collar faces -Z (hull
    attachment end).  ``loc`` is the housing centre.

    Anchor: ``loc`` in absolute ship space; caller uses ``sf.flank_x`` and
    ``sf.top_y`` in the class file to place the housing clear of the main loft.

    Detail:
        0 → nothing
        1 → drive housing only (ROLE_HULL chamfer_block, foreign proportions)
        2 → housing + adapter collar at -Z face (ROLE_ARMOUR chamfer_block)
        3 → detail 2 + countable nozzle group at +Z face via engine_bank
    """
    if detail < 1:
        return []
    lx, ly, lz = loc
    objs = []

    # Housing: wide/squat proportions read as "not this hull's section family".
    # kit.chamfer_block takes FULL extents (it halves internally), unlike
    # kit.box — 2.4 r across the beam, 2.0 r tall, `depth` long.
    house_size = (radius * 2.4, radius * 2.0, depth)
    housing    = kit.chamfer_block(parts, name + '.housing', kit.ROLE_HULL,
                                   loc, house_size, mat)
    objs.append(housing)

    if detail >= 2:
        # Adapter collar: raised weld ring at hull-attachment end (-Z face)
        collar_d  = max(0.14, depth * 0.10)
        collar_sz = (radius * 2.6, radius * 2.2, collar_d)   # FULL extents
        collar_z  = lz - depth * 0.5 - collar_d * 0.5
        collar    = kit.chamfer_block(parts, name + '.collar', kit.ROLE_ARMOUR,
                                      (lx, ly, collar_z), collar_sz, mat)
        objs.append(collar)

    if detail >= 3:
        # Countable nozzle group on the stern face (+Z), laid as a GRID that is
        # BOUNDED BY THE HOUSING FACE.
        #
        # This used to hand `nozzles` and a radius-derived spacing to
        # kit.engine_bank, which lays every nozzle in ONE ROW along X. A
        # six-nozzle drive then measured 15 units across on the frigate — wider
        # than the ship's hull — and no gate could see it, because a wide part is
        # still a part and the span pins read the whole sculpt. A drive face is a
        # cluster, not a rail.
        cols = 1 if nozzles <= 1 else (2 if nozzles <= 4 else (3 if nozzles <= 6 else 4))
        rows = int(math.ceil(float(nozzles) / cols))
        face_hw = radius * 1.2          # housing half-width  (FULL 2.4 r)
        face_hh = radius * 1.0          # housing half-height (FULL 2.0 r)
        # Cell size that keeps the whole group inside the face, with a margin.
        cell_w = (face_hw * 1.86) / cols
        cell_h = (face_hh * 1.86) / rows
        noz_r  = min(cell_w, cell_h) * 0.42
        noz_d  = max(0.06, depth * 0.10)
        nozzle_z = lz + depth * 0.5
        emitted = 0
        for r in range(rows):
            for c in range(cols):
                if emitted >= nozzles:
                    break
                nx = lx + (c - (cols - 1) * 0.5) * cell_w
                ny = ly + (r - (rows - 1) * 0.5) * cell_h
                objs.extend(kit.nozzle_ring(parts, glow,
                                            '%s.nozzle.%02d' % (name, emitted),
                                            (nx, ny, nozzle_z),
                                            mat, glow_mat, noz_r, noz_d))
                emitted += 1

    return objs


# ===========================================================================
# 12. REVERSE BLOCK
# ===========================================================================
def reverse_block(parts, glow, name, loc, mat, glow_mat, size, detail):
    """Forward-facing reverse-thrust block for boarding deceleration.

    NOZZLES FACE -Z (TOWARD THE NOSE).  This block is mounted near the bow so
    exhaust is directed forward, braking the ship for a boarding approach.
    Nozzles are placed at the -Z face of the housing so that from the front of
    the ship you see the exhaust throats head-on.

    Mounting this block with the -Z face toward the stern points exhaust aft,
    which is a propulsion block, not a reverse block.  The class file must
    position the -Z face forward.

    Facing: nozzles on -Z face (nose direction).  Housing +Z face attaches to
    the hull body.

    Anchor: ``loc`` is the housing centre in absolute ship space.  Caller places
    it near the bow using ``sf.top_y`` or ``sf.flank_x`` for vertical offset.

    Detail:
        0 → nothing
        1 → armoured housing only (ROLE_ARMOUR chamfer_block)
        2 → housing + nozzle ring array at the -Z face (ROLE_HULL + glow)
    """
    if detail < 1:
        return []
    lx, ly, lz = loc
    sx, sy, sz = size
    objs = []

    # Armoured housing
    housing = kit.chamfer_block(parts, name + '.housing', kit.ROLE_ARMOUR,
                                loc, size, mat)
    objs.append(housing)

    if detail >= 2:
        # Nozzles at the nose-facing (-Z) face; engine_bank spaces them along X
        nozzle_r   = min(sx, sy) * 0.22
        n_nozzles  = max(2, int(sx / (nozzle_r * 2.6)))
        nozzle_spc = nozzle_r * 2.5
        nozzle_z   = lz - sz * 0.5   # the -Z (nose) face of the block
        noz_objs   = kit.engine_bank(parts, glow, name + '.nozzles',
                                     (lx, ly, nozzle_z),
                                     mat, glow_mat,
                                     nozzle_r, sz * 0.12,
                                     n_nozzles, nozzle_spc)
        objs.extend(noz_objs)

    return objs


# ===========================================================================
# 13. RAM PROW
# ===========================================================================
def ram_prow(parts, name, z_tip, z_root, half_w, half_h, mat, courses=3, detail=1):
    """Deep welded wedge ram: taper_block body with stepped plate_course strakes.

    The prow tapers from the root cross-section (half_w × half_h) at z_root
    down to a sharp tip at z_tip.  Plate courses are overlapping armour strakes
    that run the prow length; no course extends past the root seam.

    Facing: TIP at z_tip (nose, -Z direction); ROOT at z_root (joins the hull
    body, +Z side).  z_tip < z_root always (tip is more negative in Z).
    A reversed prow (z_tip > z_root) puts the sharp end at the stern and will
    fail the design review.

    Anchor: ``half_w`` and ``half_h`` at the root come from
    ``sf.section(stations, z_root)`` in the class file.  ``z_tip`` is the
    desired absolute forward protrusion in ship-Z.

    Detail:
        0 → nothing
        1 → taper_block body only (ROLE_ARMOUR)
        2+ → body + ``courses`` plate_course strakes (ROLE_ARMOUR), none
              extending past z_root
    """
    if detail < 1:
        return []
    objs    = []
    prow_len = z_root - z_tip          # positive; tip is more negative in Z
    ctr_z   = (z_tip + z_root) * 0.5
    tip_sc  = (0.08, 0.10)             # sharp tip: -Z face (nose) of taper_block

    # kit.taper_block takes FULL extents (it halves internally): the root face
    # is the full root section (2 * half_w by 2 * half_h) and the body is
    # prow_len long.
    body = kit.taper_block(parts, name + '.body', kit.ROLE_ARMOUR,
                           (0.0, 0.0, ctr_z),
                           (half_w * 2.0, half_h * 2.0, prow_len),
                           mat,
                           front=tip_sc,      # -Z face = nose = sharp tip
                           back=(1.0, 1.0))   # +Z face = root = full section
    objs.append(body)

    if detail < 2:
        return objs

    # Plate courses: overlapping strakes across the prow length.
    # kit.plate_course distributes over the AXIS size as a full span, but hands
    # the two cross-section figures to kit.box as HALF-extents — so the axis
    # gets course_len and the cross-section gets the section half-widths, a
    # hair proud of the ram body it clads.
    course_len   = prow_len * 0.94
    course_ctr_z = z_tip + prow_len * 0.03 + course_len * 0.5
    course_objs  = kit.plate_course(parts, name + '.courses', kit.ROLE_ARMOUR,
                                    (0.0, 0.0, course_ctr_z),
                                    (half_w * 1.02, half_h * 1.02, course_len),
                                    mat, count=courses, axis='z')
    objs.extend(course_objs)

    return objs


# ===========================================================================
# 14. LAMP RUN
# ===========================================================================
def lamp_run(parts, glow, name, x, y, z0, z1, glow_mat, mat, spacing, detail):
    """Amber work lamps at a fixed absolute pitch on a ROLE_TRIM mounting strip.

    The lamp count is derived from the run length divided by ``spacing``
    (caller passes 1.20 m); lamp SIZE is the fixed absolute constant _LAMP_SIZE
    regardless of run length or hull dimensions — a longer run carries MORE
    lamps, NEVER bigger ones.

    The mounting strip is built first so every lamp sits on a physical surface.
    No lamp group floats: the strip is the connectivity element that joins both
    Z endpoints to the hull.

    Facing: lamps face +Y (outward from hull surface); strip runs along +Z
    (stern direction).  ``x`` is the absolute lateral anchor; ``y`` is the
    strip centre height.

    Anchor: ``x`` from ``sf.flank_anchor(stations, z, y, inset)`` (mirror sign
    for port side); ``y`` from ``sf.top_y`` or ``sf.straight_top``.  All of
    ``x``, ``y``, ``z0``, ``z1``, and ``spacing`` (1.20) are absolute values;
    the function performs no hull queries.

    Detail:
        0 → nothing
        1 → ROLE_TRIM mounting strip only
        2+ → strip plus lamp boxes (glow-tagged, appended to glow list)
    """
    if detail < 1:
        return []
    objs    = []
    run_len = z1 - z0
    ctr_z   = (z0 + z1) * 0.5

    # Thin mounting strip spanning the run. HALF-extents throughout.
    strip_w = 0.06   # strip width in X (absolute, full)
    strip_h = 0.04   # strip height in Y (absolute, full)
    strip   = kit.box(parts, name + '.strip', kit.ROLE_TRIM,
                      (x, y, ctr_z),
                      (strip_w * 0.5, strip_h * 0.5, run_len * 0.5), mat)
    objs.append(strip)

    if detail < 2:
        return objs

    # Lamp count from run length / spacing — never from lamp size
    count  = max(1, int(run_len / spacing))
    pitch  = run_len / count          # actual pitch, ≤ spacing
    # Lamp base sinks 0.01 into the strip's top face so no lamp is ever its own
    # island at the 0.06 voxel the connectivity gate uses.
    lamp_y = y + strip_h * 0.5 + _LAMP_SIZE[1] * 0.5 - 0.01

    for i in range(count):
        lamp_z = z0 + (i + 0.5) * pitch
        lamp   = _glow_box(glow, '%s.lamp.%02d' % (name, i),
                           (x, lamp_y, lamp_z),
                           (_LAMP_SIZE[0] * 0.5, _LAMP_SIZE[1] * 0.5, _LAMP_SIZE[2] * 0.5),
                           glow_mat)
        objs.append(lamp)

    return objs


# ===========================================================================
# 15. RADIATOR PANEL
# ===========================================================================
def radiator_panel(parts, name, loc, mat, size, fins=0, detail=1):
    """Flat outline-breaking armour panel; carries NO fins or greeble by rule.

    The ``fins`` parameter is accepted for caller compatibility but is IGNORED.
    The Red Ledger design bible prohibits greeble on radiator panels: the
    flat dark-iron slab is the faction's secondary silhouette mark, and adding
    surface detail dissolves the contrast that makes it readable at thumbnail.

    Every heavy-class, frigate, and freighter in the Red Ledger fleet MUST
    include at least two of these panels on opposing flanks.

    Facing: the panel face is determined entirely by caller positioning of
    ``loc`` and ``size``.  The box has no preferred facing; caller must orient
    it against the correct hull face (typically +X / -X flank, or +Y top face).

    Anchor: ``loc`` is the panel centre in absolute ship space.  Caller places
    it using ``sf.flank_x`` or ``sf.top_y`` to seat the inward face flush
    against the hull surface.

    Detail:
        0 → nothing
        1+ → ROLE_ARMOUR box panel at ``loc`` with the given ``size``
    """
    if detail < 1:
        return []
    obj = kit.box(parts, name, kit.ROLE_ARMOUR, loc, size, mat)
    return [obj]
