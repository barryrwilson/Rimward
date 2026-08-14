"""Gilded Chain shared equipment language.

Bible section 4.5: immaculate procedure concealing horror. This module is the
Chain's EQUIPMENT: the smooth quiet tractor apertures, the sealed transfer
routes, the swept ventral pylons that are the fleet's outline-breaker, the
observation rotunda, the countable drive nozzles and the flat empty radiator
vanes. Everything here is sealed, calm and ceremonially composed. Threats stay
hidden until used. No gore, no spikes, no gaudy gold, no visible mechanism.

THE ANCHOR RULE: hardware NEVER queries the hull. Every anchor point,
half-beam and deck height arrives as an argument that the class file computed
from surface.py. The only surface import is the shared absolute human module
constants (PORT_LIGHT, MARKER_LAMP, COLLAR_BORE, the spacings).

Size conventions (verified against the ship_kit.py source):
    kit.box / kit.plate_grid / kit.panel_lines / kit.greeble_field
    / kit.plate_course / kit.chamfer_block / kit.taper_block
    / kit.wedge / kit.hull_loft                     -> FULL extents
    kit.cyl / kit.torus / kit.strut                 -> real radius / depth
There is NO half-extent call in the kit: kit.box does ``obj.scale = size/2``
on Blender's default 2-unit cube, so the passed size IS the world full
extent. The absolute sf.* constants are FULL sizes and go into kit.box at
their stated values (axis-swapped where the face demands it, never halved).
Radius arguments are different: a 0.20-wide pane is a strut of real radius
0.10. Human module sizes are NEVER multiplied by ship l, b or h: a bigger
Chain ship carries MORE panes and lamps, never bigger ones.

Connectivity: every construct overlaps its host by at least 0.10 world units
of solid material, or is joined by a strut whose BOTH endpoints sit inside
solid bodies. Nothing thinner than 0.07 in every axis. Roots that are handed
to us inside the hull (ventral_pylon's root) are used as given, never inset
back out.

Detail ladder: detail 3 = lod0 full, 2 = fewer repeats, 1 = primary form
only, 0 = coarsest mass. Repeats (ribs, panes, lamps, nozzles, spires) count
DOWN with detail; at detail 0 only the primary mass survives. kit.cyl
vertices stay <= 12, kit.sphere segments <= 16.

Gold is a HAIRLINE: kit.ROLE_ACCENT parts are rings, edges and ribs at most
about 0.03 units thick. Gold never gets a face. Emissive parts go in the
glow list with obj['skin_role'] = 'glow', are turquoise by role, and stay
tiny: cold light seen through an aperture, never an edge-lit panel.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

import math

from . import surface as sf


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _glow_tag(obj):
    """Force an object's skin_role to 'glow' (turquoise by role)."""
    if obj:
        obj['skin_role'] = 'glow'
    return obj


def _face_frame(parts, name, mat, center, half_u, half_v, axis, thick=0.02):
    """One hairline gold rectangle on a face plane.

    center -- ship-space face centre; axis -- 'x', 'y' or 'z', the face normal.
    half_u / half_v -- half-extents of the rectangle in the two in-plane axes.
    Emitted as four kit.strut segments of radius ``thick`` that share
    endpoints, so the frame is one connected chain. Connectivity: the caller
    seats the frame half-buried in the face it trims.
    """
    cx, cy, cz = center
    if axis == 'x':
        pts = [(cx, cy - half_v, cz - half_u), (cx, cy - half_v, cz + half_u),
               (cx, cy + half_v, cz + half_u), (cx, cy + half_v, cz - half_u)]
    elif axis == 'y':
        pts = [(cx - half_u, cy, cz - half_v), (cx + half_u, cy, cz - half_v),
               (cx + half_u, cy, cz + half_v), (cx - half_u, cy, cz + half_v)]
    else:
        pts = [(cx - half_u, cy - half_v, cz), (cx + half_u, cy - half_v, cz),
               (cx + half_u, cy + half_v, cz), (cx - half_u, cy + half_v, cz)]
    objs = []
    for i in range(4):
        seg = kit.strut(parts, '%s.edge.%d' % (name, i), kit.ROLE_ACCENT,
                        pts[i], pts[(i + 1) % 4], mat, thick, vertices=6)
        if seg:
            objs.append(seg)
    return objs


def _outward(loc, axis):
    """Outward sign for a fitting seated at loc on the given axis face."""
    idx = {'x': 0, 'y': 1, 'z': 2}[axis]
    v = loc[idx]
    if v < 0.0:
        return -1.0
    return 1.0


# ===========================================================================
# 1.  TRACTOR LENS
# ===========================================================================
def tractor_lens(parts, glow, name, hull_mat, glow_mat, loc, radius,
                 detail=3, face='x'):
    """Smooth flush tractor aperture: ceramic bezel, sunk lens, gold ring, pupil.

    Charter line: "smooth quiet tractor apertures" -- a sealed, controlled
    eye, not a mechanism. No pipes, no greeble, no visible workings.

    Sizes: all kit.cyl / kit.torus here take REAL radius and depth. ``radius``
    is the real bezel radius. Connectivity: the bezel drum is sunk so half its
    depth lies inboard of the surface plane the caller anchored ``loc`` on;
    that is >= 0.10 world units of solid overlap for any sane bezel depth.

    Detail ladder: 3/2 = bezel + dish + gold ring + pupil; 1 = bezel + pupil;
    0 = bezel only.
    """
    lx, ly, lz = loc
    out = _outward(loc, face)
    rot = sf.CYL_ALONG_X if face == 'x' else sf.CYL_ALONG_Z
    idx = 0 if face == 'x' else 2
    depth = max(0.24, radius * 0.5)

    def _at(off):
        # offset measured outward from the anchor plane
        p = [lx, ly, lz]
        p[idx] += out * off
        return tuple(p)

    objs = []
    # Ceramic bezel drum: centre half a depth inboard of the surface -> buried.
    bez = kit.cyl(parts, name + '.bezel', kit.ROLE_HULL, _at(-depth * 0.5 + 0.06),
                  radius, depth, hull_mat, rotation=rot, vertices=12)
    if bez:
        objs.append(bez)
    if detail >= 1:
        # Sunk lens dish: a dark recess disc set just inboard of the bezel face.
        dish = kit.cyl(parts, name + '.dish', kit.ROLE_RECESS, _at(0.02),
                       radius * 0.72, 0.06, hull_mat, rotation=rot, vertices=12)
        if dish:
            objs.append(dish)
        # ONE small turquoise pupil, deep in the dish.
        pup = kit.cyl(glow, name + '.pupil', kit.ROLE_RECESS, _at(0.028),
                      max(0.045, radius * 0.22), 0.04, glow_mat,
                      rotation=rot, vertices=8)
        if pup:
            objs.append(_glow_tag(pup))
    if detail >= 2:
        # Hairline gold ring flush with the surface, buried into the bezel.
        ring = kit.torus(parts, name + '.ring', kit.ROLE_ACCENT, _at(0.05),
                         radius * 0.86, 0.018, hull_mat, rotation=rot)
        if ring:
            objs.append(ring)
    return objs


# ===========================================================================
# 2.  CAPTURE COLLAR
# ===========================================================================
def capture_collar(parts, glow, name, hull_mat, glow_mat, loc, bore=None,
                   ribs=8, detail=3):
    """Ventral capture collar at the fleet bore, mating face pointing -y.

    Charter line: "sealed transfer routes" -- one quiet collar at ONE fleet
    diameter (surface.COLLAR_BORE when ``bore`` is None), the same on every
    Chain hull, so any two ships in the fleet can mate.

    Sizes: kit.cyl / kit.torus take real radius; the bore default is the
    absolute fleet constant, never scaled. Connectivity: the barrel drum is
    raised into the keel so its upper 0.12 sits inside the hull the caller
    anchored ``loc`` on. Ribs sit ON the four flat cardinal faces of the
    barrel, inside each face's straight span -- never by even angular sweep,
    which would land them on the rounded crown where the barrel has fallen
    away.

    Detail ladder: 3/2 = barrel + bore disc + gold ring + ribs + status slit;
    1 = barrel + bore disc; 0 = barrel only.
    """
    if bore is None:
        bore = sf.COLLAR_BORE
    lx, ly, lz = loc
    r_bar = bore + 0.14
    depth = 0.34
    objs = []
    # Ceramic barrel, axis along ship y; centre raised so the top buries 0.12.
    bar = kit.cyl(parts, name + '.barrel', kit.ROLE_HULL,
                  (lx, ly + depth * 0.5 - 0.12, lz), r_bar, depth, hull_mat,
                  vertices=12)
    if bar:
        objs.append(bar)
    if detail >= 1:
        # Bore opening: a recess disc flush with the -y mating face.
        bd = kit.cyl(parts, name + '.bore', kit.ROLE_RECESS,
                     (lx, ly - 0.115, lz), bore, 0.05, hull_mat, vertices=12)
        if bd:
            objs.append(bd)
    if detail >= 2:
        # Hairline gold ring around the bore on the mating face.
        ring = kit.torus(parts, name + '.ring', kit.ROLE_ACCENT,
                         (lx, ly - 0.10, lz), bore + 0.03, 0.018, hull_mat)
        if ring:
            objs.append(ring)
        # Ribs on the four cardinal flat faces of the barrel wall.
        per_face = max(1, ribs // 4)
        half_h = depth * 0.5 - 0.06
        for f in range(4):
            base_ang = f * math.pi * 0.5
            for r in range(per_face):
                if per_face == 1:
                    ang = base_ang
                else:
                    ang = base_ang + (r / (per_face - 1.0) - 0.5) * 0.5
                rx = lx + (r_bar - 0.01) * math.cos(ang)
                rz = lz + (r_bar - 0.01) * math.sin(ang)
                rib = kit.strut(parts, '%s.rib.%d.%d' % (name, f, r),
                                kit.ROLE_ACCENT,
                                (rx, ly - half_h + 0.12, rz),
                                (rx, ly + half_h + 0.12, rz),
                                hull_mat, 0.016, vertices=6)
                if rib:
                    objs.append(rib)
        # One status slit beside the bore, recessed into the barrel wall.
        # Full extents, axis-swapped for the radial wall face; centre set so
        # the slit's outer face sits 0.01 below the barrel surface.
        slit = sf.STATUS_SLIT
        sl = kit.box(glow, name + '.slit', kit.ROLE_RECESS,
                     (lx + r_bar - 0.03, ly, lz),
                     (slit[2], slit[1], slit[0]), glow_mat)
        if sl:
            objs.append(_glow_tag(sl))
    return objs


# ===========================================================================
# 3.  TRANSFER CHAMBER
# ===========================================================================
def transfer_chamber(parts, glow, name, hull_mat, glow_mat, loc, size,
                     detail=3, face='x'):
    """A SEALED transfer chamber: fair ceramic block, flush hatch, gold frame.

    Charter line: "sealed transfer routes" -- nothing about this chamber is
    open. The hatch is a flush recess with a hairline gold frame and one
    status slit; the door never gapes.

    Sizes: ``size`` is FULL extents for kit.chamfer_block. The hatch uses the
    absolute sf.TRANSFER_HATCH door size at full extent, axis-swapped for the
    face. Connectivity:
    the caller seats ``loc`` so the block's inboard half is inside the hull;
    the hatch recess is half-buried in the block's own face.

    Detail ladder: 3/2 = block + hatch + frame + slit; 1 = block + hatch;
    0 = block only.
    """
    lx, ly, lz = loc
    sx, sy, sz = size
    out = _outward(loc, face)
    objs = []
    blk = kit.chamfer_block(parts, name + '.block', kit.ROLE_HULL, loc, size,
                            hull_mat, chamfer=min(sx, sy, sz) * 0.12)
    if blk:
        objs.append(blk)
    if detail >= 1:
        # Full absolute door size; hw_d / hh_d stay as HALF figures because
        # the gold frame below is strut endpoints (coordinates, not extents).
        hatch = sf.TRANSFER_HATCH
        hw_d, hh_d, rec = hatch[0] * 0.5, hatch[1] * 0.5, hatch[2]
        if face == 'x':
            fx = lx + out * (sx * 0.5 - rec * 0.5 + 0.01)
            hloc = (fx, ly, lz)
            hsize = (rec, hatch[1], hatch[0])
            frame_c = (lx + out * (sx * 0.5 + 0.005), ly, lz)
            fu, fv = hw_d + 0.03, hh_d + 0.03
        else:
            fz = lz + out * (sz * 0.5 - rec * 0.5 + 0.01)
            hloc = (lx, ly, fz)
            hsize = (hatch[0], hatch[1], rec)
            frame_c = (lx, ly, lz + out * (sz * 0.5 + 0.005))
            fu, fv = hw_d + 0.03, hh_d + 0.03
        ht = kit.box(parts, name + '.hatch', kit.ROLE_RECESS, hloc, hsize,
                     hull_mat)
        if ht:
            objs.append(ht)
    if detail >= 2:
        objs.extend(_face_frame(parts, name + '.frame', hull_mat, frame_c,
                                fu, fv, face, thick=0.018))
        slit = sf.STATUS_SLIT
        # The slit sits below the door, but a chamber shorter than about 0.81
        # full height has no room there and the slit would hang off the block
        # face. Clamp the drop to the block's own half-height, so the slit is
        # always ON the face it reads from. The slit SIZE stays absolute: it is
        # a human module, and a chamber too small to carry one is an authoring
        # error the render must show, not one the construct hides.
        drop = min(hh_d + 0.12, sy * 0.5 - slit[1] * 0.5 - 0.02)
        if face == 'x':
            sloc = (lx + out * (sx * 0.5 - 0.02), ly - drop, lz)
            ssize = (slit[2], slit[1], slit[0])
        else:
            sloc = (lx, ly - drop, lz + out * (sz * 0.5 - 0.02))
            ssize = (slit[0], slit[1], slit[2])
        sl = kit.box(glow, name + '.slit', kit.ROLE_RECESS, sloc, ssize,
                     glow_mat)
        if sl:
            objs.append(_glow_tag(sl))
    return objs


# ===========================================================================
# 4.  OBSERVATION ROTUNDA
# ===========================================================================
def observation_rotunda(parts, glow, name, hull_mat, glow_mat, loc, radius,
                        height, detail=3):
    """The frigate's unnervingly calm gallery: drum, gold base ring, lit band.

    Charter line: "cold turquoise gallery light" -- a low ceramic drum whose
    lit panes are RECESSED 0.10 into the drum wall, so the light is seen
    inside the body, never a strip laid on the surface. Panes are the
    absolute sf.PORT_LIGHT module at sf.PORT_SPACING pitch: a larger rotunda
    gets MORE panes, never bigger ones.

    Sizes: kit.cyl / kit.sphere take real radius; panes are radial struts of
    real radius PORT_LIGHT[0] * 0.5 and depth PORT_LIGHT[2]. Connectivity:
    the drum's lower 0.12 sits inside the deck the caller anchored ``loc``
    on; every pane strut's inboard end is inside the drum wall.

    Detail ladder: pane count = circumference // PORT_SPACING at detail 3,
    two-thirds at detail 2, four at detail 1, none at detail 0 (drum + cap
    only). Gold base ring at detail >= 2.
    """
    lx, ly, lz = loc
    objs = []
    drum = kit.cyl(parts, name + '.drum', kit.ROLE_HULL,
                   (lx, ly + height * 0.5 - 0.12, lz), radius, height,
                   hull_mat, vertices=12)
    if drum:
        objs.append(drum)
    cap = kit.sphere(parts, name + '.cap', kit.ROLE_HULL,
                     (lx, ly + height - 0.12, lz),
                     (radius, radius * 0.45, radius), hull_mat, segments=12)
    if cap:
        objs.append(cap)
    if detail >= 2:
        ring = kit.torus(parts, name + '.ring', kit.ROLE_ACCENT,
                         (lx, ly - 0.06, lz), radius + 0.02, 0.02, hull_mat)
        if ring:
            objs.append(ring)
    if detail >= 1:
        circ = 2.0 * math.pi * radius
        n = max(4, int(circ / sf.PORT_SPACING))
        if detail == 1:
            n = 4
        elif detail == 2:
            n = max(4, (n * 2) // 3)
        pr = sf.PORT_LIGHT[0] * 0.5
        pd = sf.PORT_LIGHT[2]
        band_y = ly + height * 0.55 - 0.12
        r_out = radius - 0.10          # recessed 0.10 into the wall
        for i in range(n):
            ang = 2.0 * math.pi * i / n
            dx, dz = math.cos(ang), math.sin(ang)
            a = (lx + dx * (r_out - pd), band_y, lz + dz * (r_out - pd))
            b = (lx + dx * r_out, band_y, lz + dz * r_out)
            pane = kit.strut(glow, '%s.pane.%02d' % (name, i),
                             kit.ROLE_RECESS, a, b, glow_mat, pr, vertices=8)
            if pane:
                objs.append(_glow_tag(pane))
    return objs


# ===========================================================================
# 5.  VENTRAL PYLON
# ===========================================================================
def ventral_pylon(parts, glow, name, hull_mat, glow_mat, root, tip, chord,
                  thick, detail=3, glow_edge=True):
    """THE OUTLINE-BREAKER: a swept ventral fin from root (in-hull) to tip.

    Charter line: the swept ventral pylon set, >= 15 % of hull length by the
    caller's sizing. Flat, calm, no greeble -- a blade, not a machine. The
    blade is a hull_loft whose side profile is the swept quadrilateral
    between the root chord and the tip chord (tip chord ~ 40 % of root):
    each loft station's vertical span is the slice between the leading-edge
    line and the trailing-edge line at that z.

    ``root`` is GIVEN INSIDE THE HULL and is used as given -- never inset
    back out; that burial is the connectivity. ``thick`` is the real blade
    thickness in x (clamped to >= 0.07 so the probe always sees the blade).

    CENTRELINE LOCK: kit.hull_loft stations carry no x term and the loft
    object is built at the origin, so the blade is a CENTRELINE loft that is
    repositioned in X afterwards via ``blade.location.x = xmid`` (Blender X
    IS ship X in the kit mapping, the transform is never applied, and both
    centre_parts and the exporter read it through matrix_world). Do not
    remove that line: without it every pylon in the set renders stacked at
    x = 0 and the gold edge / tip glow float beside a blade that is not
    there.

    Detail ladder: 3/2 = blade + hairline gold leading edge + (glow_edge)
    turquoise tip line; 1 = blade + gold edge; 0 = blade only.
    """
    rx, ry, rz = root
    tx, ty, tz = tip
    ct = chord * 0.40
    hw = max(thick, 0.07) * 0.5
    xmid = (rx + tx) * 0.5

    le_root_z, le_tip_z = rz - chord * 0.5, tz - ct * 0.5
    te_root_z, te_tip_z = rz + chord * 0.5, tz + ct * 0.5

    def _line(z, z_tip, z_root):
        if abs(z_root - z_tip) < 1e-6:
            t = 0.0
        else:
            t = (z - z_tip) / (z_root - z_tip)
        t = max(0.0, min(1.0, t))
        return ty + t * (ry - ty)

    z0 = min(le_root_z, le_tip_z)
    z1 = max(te_root_z, te_tip_z)
    n_st = 4 if detail >= 2 else 3
    stations = []
    for i in range(n_st):
        z = z0 + (z1 - z0) * i / (n_st - 1.0)
        y_le = _line(z, le_tip_z, le_root_z)
        y_te = _line(z, te_tip_z, te_root_z)
        y_lo = min(y_le, y_te)
        y_hi = max(y_le, y_te)
        if y_hi - y_lo < 0.06:
            y_hi = y_lo + 0.06
        hh = (y_hi - y_lo) * 0.5
        yo = (y_hi + y_lo) * 0.5
        ch = min(0.02, hh * 0.4, hw * 0.4)
        stations.append((z, hw, hh, yo, ch))
    objs = []
    blade = kit.hull_loft(parts, name + '.blade', kit.ROLE_HULL, stations,
                          hull_mat)
    if blade:
        # hull_loft builds at the origin with stations centred on x = 0;
        # shift the whole blade to the fin's real beam position. Blender X
        # is ship X and the transform is never applied, so this survives
        # centre_parts and export through matrix_world.
        blade.location.x = xmid
        objs.append(blade)
    if detail >= 1:
        # Hairline gold leading edge, root LE -> tip LE; both ends inside the
        # blade's solid cross-section, so the strut is joined at both ends.
        le = kit.strut(parts, name + '.edge', kit.ROLE_ACCENT,
                       (xmid, ry - 0.02, le_root_z + 0.02),
                       (xmid, ty + 0.04, le_tip_z + 0.02),
                       hull_mat, 0.02, vertices=6)
        if le:
            objs.append(le)
    if detail >= 2 and glow_edge:
        # One thin turquoise line half-buried in the INBOARD face near the
        # tip. The blade's solid x-span is [xmid - hw, xmid + hw] (after the
        # location.x offset above); at radius 0.02 and offset hw - 0.015 the
        # glow's x extent runs 0.035 INTO the blade and stands 0.005 proud.
        inb = -1.0 if xmid >= 0.0 else 1.0
        gx = xmid + inb * (hw - 0.015)
        glen = max(0.10, ct * 0.45)
        gl = kit.strut(glow, name + '.tipglow', kit.ROLE_RECESS,
                       (gx, ty + 0.06, tz),
                       (gx, ty + 0.06 + glen, tz),
                       glow_mat, 0.02, vertices=6)
        if gl:
            objs.append(_glow_tag(gl))
    return objs


# ===========================================================================
# 6.  DRIVE FACE
# ===========================================================================
def drive_face(parts, glow, name, hull_mat, glow_mat, loc, half_w, half_h,
               nozzles=4, depth=0.5, detail=3):
    """A distinct drive face: fair housing, gold hairline ring, COUNTABLE grid.

    Charter line: countable nozzle groups (2 / 4 / 6 / 8), each throat a
    recess with a turquoise disc set DEEP inside it. The throats are laid as
    a GRID BOUNDED BY the housing's own face half-extents -- never one row
    along X, which is how a 6-nozzle group once ended up wider than a hull.

    Sizes: kit.chamfer_block takes FULL extents (2 * half_w, 2 * half_h,
    depth); kit.cyl takes real radius. Connectivity: the housing's forward
    0.12 is buried in the stern the caller anchored ``loc`` on; every throat
    and disc is inside the housing.

    Detail ladder: detail >= 2 = full nozzle count + gold ring; detail 1 =
    half the nozzles (min 2), no ring; detail 0 = housing + 2 throats.
    """
    lx, ly, lz = loc
    n = nozzles
    if detail == 1:
        n = max(2, nozzles // 2)
    elif detail <= 0:
        n = 2
    grid = {2: (2, 1), 4: (2, 2), 6: (3, 2), 8: (4, 2)}
    if n in grid:
        cols, rows = grid[n]
    else:
        cols = int(math.ceil(math.sqrt(n)))
        rows = int(math.ceil(n / float(cols)))
    objs = []
    # Housing: back face stands at loc z; forward 0.12 buried in the hull.
    hz = lz - depth * 0.5 + 0.12
    hous = kit.chamfer_block(parts, name + '.housing', kit.ROLE_HULL,
                             (lx, ly, hz), (half_w * 2.0, half_h * 2.0, depth),
                             hull_mat, chamfer=min(half_w, half_h) * 0.25)
    if hous:
        objs.append(hous)
    face_z = lz + 0.12
    # Nozzle grid, inset to 70 % of the face half-extents so the group is
    # always bounded by the housing.
    span_x = half_w * 0.70
    span_y = half_h * 0.70
    pitch_x = (2.0 * span_x) / cols
    pitch_y = (2.0 * span_y) / rows
    r = max(0.06, min(pitch_x, pitch_y) * 0.32)
    made = 0
    for row in range(rows):
        for col in range(cols):
            if made >= n:
                break
            nx = lx - span_x + pitch_x * (col + 0.5)
            ny = ly - span_y + pitch_y * (row + 0.5)
            th = kit.cyl(parts, '%s.throat.%d' % (name, made),
                         kit.ROLE_RECESS, (nx, ny, face_z - 0.05), r, 0.14,
                         hull_mat, rotation=sf.CYL_ALONG_Z, vertices=10)
            if th:
                objs.append(th)
            disc = kit.cyl(glow, '%s.disc.%d' % (name, made), kit.ROLE_RECESS,
                           (nx, ny, face_z - 0.10), r * 0.62, 0.05, glow_mat,
                           rotation=sf.CYL_ALONG_Z, vertices=8)
            if disc:
                objs.append(_glow_tag(disc))
            made += 1
    if detail >= 2:
        objs.extend(_face_frame(parts, name + '.ring', hull_mat,
                                (lx, ly, face_z + 0.005),
                                half_w * 0.92, half_h * 0.92, 'z', thick=0.02))
    return objs


# ===========================================================================
# 7.  RADIATOR VANE
# ===========================================================================
def radiator_vane(parts, name, mat, loc, span, chord, thick=0.06, sweep=0.25,
                  detail=3, side=1.0):
    """A flat swept vane that breaks the outline and CARRIES NO DETAIL.

    Charter line: flat radiator panels; the emptiness is what makes the
    outline read (Donnager fins). One single taper_block blade, role
    kit.ROLE_ARMOUR, with a hairline gold trailing edge only at detail 3.
    Nothing else is ever seated on it.

    Sizes: kit.taper_block takes FULL extents (span, thick, chord). ``thick``
    is clamped to >= 0.07 so the probe always sees the vane. Connectivity:
    the caller anchors ``loc`` at the hull flank; the vane's inboard 0.10 of
    span lies inside the hull. ``side`` (+1 / -1) picks starboard / port.

    Detail ladder: 3 = vane + gold edge; 2/1/0 = vane only.
    """
    lx, ly, lz = loc
    th = max(thick, 0.07)
    tip_frac = max(0.30, 1.0 - sweep)
    # Centre shifted outboard so the inboard 0.10 of span buries in the hull.
    cx = lx + side * (span * 0.5 - 0.10)
    vane = kit.taper_block(parts, name + '.vane', kit.ROLE_ARMOUR,
                           (cx, ly, lz), (span, th, chord), mat,
                           front=(1.0, 1.0), back=(tip_frac, 1.0))
    objs = []
    if vane:
        objs.append(vane)
    if detail >= 3:
        # Hairline gold along the outboard tip edge; both ends buried in the
        # vane's solid material at the tip station.
        tx = cx + side * (span * 0.5 - 0.02)
        e = kit.strut(parts, name + '.edge', kit.ROLE_ACCENT,
                      (tx, ly, lz - chord * 0.5 + 0.02),
                      (tx, ly, lz + chord * 0.5 * tip_frac - 0.02),
                      mat, 0.018, vertices=6)
        if e:
            objs.append(e)
    return objs


# ===========================================================================
# 8.  MAST CLUSTER
# ===========================================================================
def mast_cluster(parts, glow, name, hull_mat, glow_mat, loc, height, count=3,
                 detail=3):
    """A cluster of thin fragile ceramic spires with tiny turquoise tips.

    Charter line: thin fragile masts; small spire clusters dorsally, the only
    vertical accent on an extremely low hull. Spire radius is clamped to
    >= 0.035 so the probe always sees each spire.

    Sizes: kit.strut real radius; tips are tiny absolute glow caps, never
    scaled with the ship. Connectivity: every spire root starts 0.10 BELOW
    the deck anchor ``loc``, so the root is buried in the deck.

    Detail ladder: detail >= 2 = ``count`` spires with tips; detail 1 =
    half the spires (min 1), tips kept; detail 0 = one spire, no tip.
    """
    lx, ly, lz = loc
    if detail >= 2:
        n = count
    elif detail == 1:
        n = max(1, count // 2)
    else:
        n = 1
    r = 0.04
    objs = []
    for i in range(n):
        if n == 1:
            ox, oz = 0.0, 0.0
        else:
            ang = 2.0 * math.pi * i / n
            ox = math.cos(ang) * 0.14
            oz = math.sin(ang) * 0.14
        lean = 0.06 * height
        base = (lx + ox, ly - 0.10, lz + oz)
        top = (lx + ox * 1.6 + lean, ly + height, lz + oz * 1.6)
        sp = kit.strut(parts, '%s.spire.%d' % (name, i), kit.ROLE_HULL,
                       base, top, hull_mat, r, vertices=6)
        if sp:
            objs.append(sp)
        if detail >= 1:
            tip = kit.sphere(glow, '%s.tip.%d' % (name, i), kit.ROLE_RECESS,
                             top, (0.035, 0.05, 0.035), glow_mat, segments=8)
            if tip:
                objs.append(_glow_tag(tip))
    return objs


# ===========================================================================
# 9.  MARKER RUN
# ===========================================================================
def marker_run(parts, glow, name, hull_mat, glow_mat, z0, z1, y, surf,
               side=1.0, spacing=None, detail=3):
    """Navigation markers at ABSOLUTE surface.LAMP_SPACING pitch on a flank.

    Charter line: scale from repetition at constant human pitch. Each marker
    is a small ceramic housing seated on the flank with one sf.MARKER_LAMP
    glow pane recessed into it. The pitch is the absolute constant, never
    scaled with the ship: a bigger ship gets MORE lamps.

    ``surf(z)`` returns the half-beam at station z (a surface.py callback);
    a lamp is SKIPPED where it returns 0.0, so the run self-trims past a
    taper instead of floating. Sizes: the absolute full-size constants go
    into kit.box at their stated values. Connectivity:
    each housing's inboard 0.10 overlaps the flank at surf(z).

    Detail ladder: detail >= 2 = every lamp; detail 1 = every other lamp;
    detail 0 = no markers (the run is pure detail, no primary mass).
    """
    if spacing is None:
        spacing = sf.LAMP_SPACING
    if detail <= 0:
        return []
    step = spacing if detail >= 2 else spacing * 2.0
    lamp = sf.MARKER_LAMP
    objs = []
    n = int((z1 - z0) / step)
    for i in range(n + 1):
        z = z0 + step * i
        s = surf(z)
        if s <= 0.0:
            continue
        # Housing: full extents 0.16 x 0.14 x 0.16; outboard face stands
        # 0.06 proud of the flank, inboard 0.10 buried in it.
        hx = side * (s - 0.02)
        hous = kit.box(parts, '%s.housing.%02d' % (name, i), kit.ROLE_HULL,
                       (hx, y, z), (0.16, 0.14, 0.16), hull_mat)
        if hous:
            objs.append(hous)
        # Pane at full MARKER_LAMP size, recessed 0.02 into the housing's
        # outboard face: centre = face - 0.02 - half the pane depth.
        px = side * (s + 0.06 - 0.02 - lamp[2] * 0.5)
        pane = kit.box(glow, '%s.lamp.%02d' % (name, i), kit.ROLE_RECESS,
                       (px, y, z),
                       (lamp[2], lamp[1], lamp[0]),
                       glow_mat)
        if pane:
            objs.append(_glow_tag(pane))
    return objs


# ===========================================================================
# 10. VAULT BODY
# ===========================================================================
def vault_body(parts, name, mat, loc, size, detail=3):
    """One sealed vault / gallery body for the freighter: a mass, not a host.

    Charter line: sealed and controlled. A fair ceramic volume with a
    hairline gold seam ring at each end and NOTHING else -- no greeble, no
    hatches, no machinery.

    Sizes: ``size`` is FULL extents for kit.chamfer_block. Connectivity: the
    caller overlaps ``loc`` with the spine or cradle the vault rides on by at
    least 0.10 world units.

    Detail ladder: 3/2 = body + both seam rings; 1/0 = body only.
    """
    sx, sy, sz = size
    objs = []
    body = kit.chamfer_block(parts, name + '.body', kit.ROLE_HULL, loc, size,
                             mat, chamfer=min(sx, sy) * 0.18)
    if body:
        objs.append(body)
    if detail >= 2:
        lx, ly, lz = loc
        for e in (-1, 1):
            zc = lz + e * (sz * 0.5 - 0.04)
            objs.extend(_face_frame(parts, '%s.seam.%s' % (name, 'a' if e < 0 else 'b'),
                                    mat, (lx, ly, zc),
                                    sx * 0.5 - 0.06, sy * 0.5 - 0.06, 'z',
                                    thick=0.018))
    return objs


# ===========================================================================
# 11. DOCKED LEAF
# ===========================================================================
def docked_leaf(parts, glow, name, hull_mat, glow_mat, loc, length, detail=3):
    """A miniature Chain leaf craft for a berth or open bay (section G5 cue).

    The same family in miniature: one lofted leaf body with a needle nose,
    two tiny ventral pylons, one turquoise drive disc. It is sized by its
    ``length`` argument, so a frigate berth and a freighter bay each get a
    real scale cue against the parent hull. Kept deliberately cheap: this
    craft is nested inside a bigger ship's triangle budget.

    Sizes: derived from ``length`` only (the craft's own overall length);
    loft stations take real half-widths. Connectivity: the CALLER overlaps
    the body with its cradle by at least 0.10; the pylons bury into the
    leaf's own belly and the drive disc is buried in the tail.

    CENTRELINE LOCK: like ventral_pylon, the body is a kit.hull_loft built
    at the origin with stations centred on x = 0, so it is repositioned in
    X via ``body.location.x = lx`` after creation. Without that line the
    berthed craft jumps to the ship centreline while its pylons and drive
    disc stay at the caller's x -- the frigate's hangar and the freighter's
    bay both break.

    Detail ladder: 3/2 = body + needle + 2 pylons + disc; 1 = body + disc;
    0 = body only.
    """
    lx, ly, lz = loc
    # 0.30 beam / 0.11 height of its own length: the family ratio a Chain
    # light-class hull carries. At 0.20 beam the nested craft read as a
    # splinter in the probe rather than a leaf, and the whole point of a
    # nested craft is that it is recognisably one of the fleet.
    hw = length * 0.15
    hh = length * 0.055
    cham = min(hw, hh) * 0.6
    stations = [
        (lz - length * 0.50, hw * 0.06, hh * 0.06, ly, cham * 0.06),
        (lz - length * 0.20, hw * 0.85, hh * 0.85, ly, cham),
        (lz + length * 0.30, hw, hh, ly, cham),
        (lz + length * 0.50, hw * 0.30, hh * 0.45, ly, cham * 0.4),
    ]
    objs = []
    body = kit.hull_loft(parts, name + '.body', kit.ROLE_HULL, stations,
                         hull_mat)
    if body:
        # hull_loft is centreline-locked (stations carry no x term); shift
        # the whole body to the caller's berth x. Blender X is ship X and
        # the transform is never applied, so the offset reads through
        # matrix_world at centre_parts and export time.
        body.location.x = lx
        objs.append(body)
    if detail >= 1:
        disc = kit.cyl(glow, name + '.drive', kit.ROLE_RECESS,
                       (lx, ly, lz + length * 0.485),
                       max(0.04, hw * 0.22), 0.05, glow_mat,
                       rotation=sf.CYL_ALONG_Z, vertices=8)
        if disc:
            objs.append(_glow_tag(disc))
    if detail >= 2:
        # Two tiny ventral pylons, full extents, roots buried in the belly:
        # the pylon's top sits ``ov`` INSIDE the body (belly at ly - hh).
        for s in (-1, 1):
            px = lx + s * hw * 0.5
            half_h = hh * 0.45
            ov = min(0.06, hh * 0.5)
            py = kit.box(parts, '%s.pylon.%s' % (name, 'p' if s > 0 else 's'),
                         kit.ROLE_HULL,
                         (px, ly - hh - half_h + ov, lz + length * 0.10),
                         (max(0.07, hw * 0.16), half_h * 2.0, length * 0.12),
                         hull_mat)
            if py:
                objs.append(py)
    return objs
