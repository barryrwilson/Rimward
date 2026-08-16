"""Assembly Light - DAUGHTER PROBE.

Bible 4.8 light: "A central teal optic, three or four repeated instrument
petals, small fabrication socket, and a tiny detachable copy nested beneath
it." This class IS the daughter-lineage craft. Do not call hw.daughter_probe
as the hull: that module is a light-class escort for larger ships, and
DAUGHTER_BODY_R = 1.35 would eat this envelope.

Construction logic: REPEATED MODULE (synthesis/20 §5, 21 §G2/§G6). One
part, many copies, radial and linear arrays, visible joints. Variation is
copy-drift, not human patchwork. Silhouette family: SPINE-AND-PODS /
cruciform fans. The plate's small escorts are the brief; the long foundry
spine is a later class.

BODY PLAN
    A short charcoal tube (hull_loft) with three ln.spine_segment bays
    clamped onto it, each bay the same absolute module. Visible joint_rings
    sit at the bay stern faces and at the two zone seams. A nose
    hw.teal_optic faces -Z. Four hw.instrument_petal copies sit cruciform
    on the mid bay (port / starboard / up / down). One small ln.radial_fan
    sits dorsal at the bow/mid seam (the §G2 outline-breaker). A small
    hw.fabrication_socket and a ventral pad open on the mid keel. A TINY
    detachable copy (body radius 0.40, not *l) intersects that pad and
    socket so the island probe reads one body. Off-white ln.shell_module
    copies clamp the flanks. A few ln.orange_patch blocks are the 3-8 %
    accent. Stern hw.drive_face carries two countable nozzles.

STATION-LIST REASONING (z as fractions of l; half-extents ABSOLUTE spine
radii, never *b or *h):
    Nose tip at l*-0.474 = -3.697; transom at l*0.455 = +3.549 -> loft
    z-span 7.25. Driver engine glow sits at z = l*0.47 = 3.666; the
    housing back face stands 0.12 aft of the transom so the glow reads
    as the drive flare. Bow/mid seam at l*-0.270 = -2.106; mid/stern
    seam at l*0.213 = +1.661.
    Tube half-extent 0.16 at the nose, 0.44 at mid, 0.34 at the transom.
    Bay radius is 0.50 throughout (one module). The tube stays inside the
    bays so the outer read is repeating clamps, not a closed shell.

ZONES (each boundary marked by a joint_ring; no course crosses a boundary):
    bow   l*-0.474..l*-0.270   22 % of loft length
    mid   l*-0.270..l* 0.213   52 %
    stern l* 0.213..l* 0.455   26 %
    Bow bay covers the bow and bites the mid seam. Mid bay is the long
    service run (petals, nest, most shells). Stern bay takes the drive.
    Shells and orange patches stay inside their own zone.

OUTLINE-BREAKER (G2): one small dorsal radial fan (plane xz, normal +Y)
    at the bow/mid seam. Fan seating is ln.radial_fan(..., radius=R).
    Outer reach = R + FAN_PETAL_LEN - 0.16 = R + 1.55 - 0.16.
    Need reach >= 0.15*l, so R >= 0.15*l - 1.55 + 0.16.
    At l = 7.8 that floor is -0.22; any positive R clears the length
    rule. Authored R = 0.48 (absolute, not scaled). Reach = 1.87 =
    24 % of l. Do not scale FAN_PETAL_*. Do not add struts; the hub
    already reaches the petal-root ring. Fan count is 6 (a small fan)
    so length still leads: authored spanX from the fan is ~3.74,
    spanZ/spanX ~= 2.07 (>= 1.15).

EMISSIVE BUDGET (<= 5 % of hull area):
    Nose teal iris, nest-socket iris, tiny-copy iris, two drive discs.
    No marker runs, no edge-lit panels. AUTHORED AIM: emissive ~= 2-3 %
    of hull area.

ORANGE BUDGET (3-8 %, accent_density is already 1.0):
    Four ln.orange_patch blocks, face ~0.58 x 0.44 each. AUTHORED AIM:
    ~1.0 square units on a ~22-28 unit hull ~= 4-5 %. The fourth patch
    is STARBOARD BOW only — the class's one deliberate functional
    asymmetry (a replacement panel that the port bow never received).

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: every construct below
    2  all constructs; shell count, mid rings, fan petals, orange
       patches and plate courses halve
    1  loft + three bays + zone joints + nose optic + drive + fan hub
       + cruciform petals + nest pad/socket + tiny body + two mid shells
    0  loft + three bays + nose optic + drive only

DENSITY (MEASURED 2026-08-15, measure-ships + three.js tri count):
    Commands: blender -b -P scripts/build-ship-assets.py -- assembly,
              node scripts/compress-ship-assets.mjs assembly,
              node scripts/measure-ships.mjs assembly,
              node scripts/probe-ship-islands.mjs assembly light lod0
    detail 3  MEASURED  12,708 verts / 7,128 lod0 triangles
    detail 2  MEASURED  4,896 triangles
    detail 1  MEASURED  1,524 triangles
    Max span MEASURED 7.5 (Z; band 7.4-8.2).
    len/beam 2.11; ht/len 0.41; beam/len 0.47.
    spanZ/spanX >= 1.15; spanY/spanZ <= 0.60; spanX/spanZ >= 0.16.
    Proxy cover 100 %; ONE CONNECTED BODY at 0.06 voxels.
    SHIP_SCALE.light.hull band 4,000-25,000.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import lineage as ln
from . import hardware as hw


# Absolute module sizes. Never multiply by l, b or h.
_SPINE_R = 0.50
_FAN_R = 0.48
_TINY_R = 0.40
_SOCK_R = 0.34
_BAY_OVER = 0.18


# ===========================================================================
# STATION LIST
# ===========================================================================

def _light_stations(l, b, h):
    """Charcoal tube the three bays clamp onto.

    Half-extents are absolute spine measures. z fractions of l. y_offset
    stays 0.0 so the tube is a straight structural spine, not a faired
    leaf. b and h are the class envelope; the tube does not use them.
    """
    _ = (b, h)
    return [
        # -- BOW: short probe tip, then the first bay lands on this tube --
        sf.fair(l * -0.474, 0.16, 0.16, 0.0),  # nose tip
        sf.fair(l * -0.440, 0.32, 0.32, 0.0),
        sf.fair(l * -0.360, 0.40, 0.40, 0.0),
        sf.fair(l * -0.270, 0.42, 0.42, 0.0),  # bow/mid seam

        # -- MID: fullest tube, still inside the 0.50 bay radius ----------
        sf.fair(l * -0.040, 0.44, 0.44, 0.0),
        sf.fair(l *  0.213, 0.42, 0.42, 0.0),  # mid/stern seam

        # -- STERN: calm run to the transom / drive plane -----------------
        sf.fair(l *  0.360, 0.38, 0.38, 0.0),
        sf.fair(l *  0.455, 0.34, 0.34, 0.0),  # transom
    ]


def _add(a, b, s=1.0):
    return (a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s)


def _tiny_copy(parts, glow, hull_mat, glow_mat, loc, detail):
    """Tiny detachable copy. Body radius is _TINY_R, never *l.

    Caller seats loc so the sphere intersects the ventral pad and the
    fabrication socket. Nested-only placement (a shell wholly inside a
    volume) floats on the 0.06 island voxel.
    """
    cx, cy, cz = loc
    segs = 16 if detail >= 2 else 10
    kit.sphere(parts, 'light.nest.body', kit.ROLE_HULL, loc,
               (_TINY_R, _TINY_R, _TINY_R), hull_mat, segments=segs)
    if detail < 1:
        return
    kit.torus(parts, 'light.nest.joint', kit.ROLE_RECESS, loc,
              _TINY_R * 0.94, sf.JOINT_MINOR, hull_mat,
              rotation=sf.CYL_ALONG_Z)
    hw.teal_optic(parts, glow, 'light.nest.eye', hull_mat, glow_mat,
                  (cx, cy, cz - _TINY_R + 0.04), radius=0.12,
                  facing='nose', detail=detail)
    if detail < 2:
        return
    # Three miniature petals. Custom size — full PETAL_LEN would dwarf
    # a 0.40 body. hw.instrument_petal aims the taper; do not scale
    # sf.PETAL_*.
    bury = 0.10
    plen = 0.28
    psize = (0.12, 0.06, plen)
    faces = ('starboard', 'port', 'down')
    radials = ((1.0, 0.0, 0.0), (-1.0, 0.0, 0.0), (0.0, -1.0, 0.0))
    drift = ln.copy_drift(41)
    for i, face in enumerate(faces):
        sc, _rot, off = drift()
        dist = _TINY_R + plen * 0.5 * sc[2] - bury
        pc = _add(_add(loc, off), radials[i], dist)
        hw.instrument_petal(parts, 'light.nest.petal.%d' % i, hull_mat, pc,
                            facing=face, size=psize, detail=detail)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Assembly daughter probe (light class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height envelope (7.8, 3.276, 1.872).
    detail   -- 3 full  2 halved repeats  1 primary masses
                0 spine + optic + drive only.

    MEASURED 2026-08-15 (measure-ships assembly):
        detail 3  12,708 hull verts / 7,128 lod0 triangles
        max span 7.5, len/beam 2.11, ht/len 0.41, beam/len 0.47
        proxy cover 100 %, ONE CONNECTED BODY at 0.06 voxels
        inside SHIP_SCALE.light.hull band 4,000-25,000
    """
    H = kit.ROLE_HULL

    stations = _light_stations(l, b, h)

    z_nose = l * -0.474     # = -3.697  loft nose
    z_bow = l * -0.270      # = -2.106  bow / mid seam
    z_mid = l * 0.213       # =  1.661  mid / stern seam
    z_trans = l * 0.455     # =  3.549  transom / drive loc

    # Three bays. Adjacent bays overlap by 2*_BAY_OVER so the island
    # probe stays one body after copy-drift (±4 % scale, ±0.03 offset).
    bow_len = (z_bow + _BAY_OVER) - (z_nose + 0.16)
    bow_cz = (z_nose + 0.16 + z_bow + _BAY_OVER) * 0.5
    mid_len = (z_mid + _BAY_OVER) - (z_bow - _BAY_OVER)
    mid_cz = (z_bow - _BAY_OVER + z_mid + _BAY_OVER) * 0.5
    stn_len = (z_trans - 0.02) - (z_mid - _BAY_OVER)
    stn_cz = (z_mid - _BAY_OVER + z_trans - 0.02) * 0.5

    # ── Primary spine (always, detail 0+) ────────────────────────────────
    kit.hull_loft(parts, 'light.tube', H, stations, hull_mat)
    ln.spine_segment(parts, 'light.bay.bow', hull_mat,
                     (0.0, 0.0, bow_cz), _SPINE_R, bow_len,
                     detail=detail, seed=4)
    ln.spine_segment(parts, 'light.bay.mid', hull_mat,
                     (0.0, 0.0, mid_cz), _SPINE_R, mid_len,
                     detail=detail, seed=5)
    ln.spine_segment(parts, 'light.bay.stern', hull_mat,
                     (0.0, 0.0, stn_cz), _SPINE_R, stn_len,
                     detail=detail, seed=6)

    # ── NOSE OPTIC (always): central teal iris, bible 4.8 ────────────────
    hw.teal_optic(parts, glow, 'light.optic', hull_mat, glow_mat,
                  (0.0, 0.0, z_nose + 0.06), facing='nose', detail=detail)

    # ── DRIVE FACE at the transom (always; 2 nozzles) ────────────────────
    # loc is the housing back-face. Housing buries its own forward 0.12
    # into the stern bay. Glow from the driver sits at z = l*0.47.
    hw.drive_face(parts, glow, 'light.drive', hull_mat, glow_mat,
                  (0.0, 0.0, z_trans), 0.40, 0.34,
                  nozzles=2, depth=0.36, detail=detail)

    if detail < 1:
        return

    # ── ZONE JOINTS (detail 1+): seams the bays already bite ─────────────
    ln.joint_ring(parts, 'light.seam.bow', hull_mat,
                  (0.0, 0.0, z_bow), _SPINE_R, detail=detail)
    ln.joint_ring(parts, 'light.seam.mid', hull_mat,
                  (0.0, 0.0, z_mid), _SPINE_R, detail=detail)

    # ── DORSAL FAN (detail 1+): the §G2 outline-breaker ──────────────────
    # plane xz: petals in XZ, hub along +Y. R = 0.48, reach = 1.87.
    # Hub centre on the bay crown so the disc overlaps the spine >= 0.10.
    # No struts.
    z_fan = z_bow
    ln.radial_fan(parts, 'light.fan', hull_mat,
                  (0.0, _SPINE_R - 0.04, z_fan),
                  count=6, radius=_FAN_R, plane='xz',
                  seed=11, detail=detail)

    # ── CRUCIFORM INSTRUMENT PETALS (detail 1+): 3-4 copies ──────────────
    # Buried 0.16 into the mid bay. Full PETAL_* module, never *l.
    z_pet = mid_cz - 0.15
    bury_p = 0.16
    dist_p = _SPINE_R + sf.PETAL_LEN * 0.5 - bury_p
    petal_set = (
        ('stbd', 'starboard', (1.0, 0.0, 0.0)),
        ('port', 'port', (-1.0, 0.0, 0.0)),
        ('up', 'up', (0.0, 1.0, 0.0)),
    )
    if detail >= 3:
        petal_set = petal_set + (('down', 'down', (0.0, -1.0, 0.0)),)
    for tag, face, radial in petal_set:
        pc = _add((0.0, 0.0, z_pet), radial, dist_p)
        hw.instrument_petal(parts, 'light.petal.' + tag, hull_mat, pc,
                            facing=face, detail=detail)

    # ── VENTRAL NEST (detail 1+): socket + pad + tiny copy ───────────────
    # Socket on a daughter uses a small radius. Pad is a charcoal seat.
    # Tiny body radius 0.40 intersects both (overlap >= 0.10).
    z_nest = mid_cz + 0.85
    y_keel = -_SPINE_R
    hw.fabrication_socket(parts, glow, 'light.socket', hull_mat, glow_mat,
                          (0.0, y_keel, z_nest), radius=_SOCK_R,
                          facing='down', detail=detail)
    kit.chamfer_block(parts, 'light.nest.pad', H,
                      (0.0, y_keel + 0.02, z_nest),
                      (0.64, 0.20, 0.64), hull_mat, chamfer=0.10)
    tiny_y = y_keel - _TINY_R + 0.22
    _tiny_copy(parts, glow, hull_mat, glow_mat,
               (0.0, tiny_y, z_nest), detail)

    # ── SHELL MODULES (detail 1+): off-white clamps, calm faces ──────────
    # Inboard face overlaps the bay by >= 0.10. Mid pair at detail 1;
    # bow/stern pair at detail 2; second mid pair at detail 3.
    shell_sx = 0.32
    shell_sy = 0.24
    shell_sz = 1.00
    shell_x = _SPINE_R + shell_sx * 0.5 - 0.16
    shells = [
        (1, 'mid.stbd', shell_x, mid_cz - 0.35, 21),
        (1, 'mid.port', -shell_x, mid_cz - 0.35, 22),
    ]
    if detail >= 2:
        shells.extend([
            (2, 'bow.stbd', shell_x, bow_cz, 23),
            (2, 'bow.port', -shell_x, bow_cz, 24),
            (2, 'stern.stbd', shell_x, stn_cz, 25),
            (2, 'stern.port', -shell_x, stn_cz, 26),
        ])
    if detail >= 3:
        shells.extend([
            (3, 'mid2.stbd', shell_x, mid_cz + 0.70, 27),
            (3, 'mid2.port', -shell_x, mid_cz + 0.70, 28),
        ])
    for _gate, tag, sx, sz, seed in shells:
        ln.shell_module(parts, 'light.shell.' + tag, hull_mat,
                        (sx, 0.0, sz), (shell_sx, shell_sy, shell_sz),
                        detail=detail, seed=seed)

    # ── ORANGE PATCHES (detail 1+): block accents, not thinning ──────────
    # Thickness 0.22 so each patch buries 0.12 and still stands proud.
    # Fourth patch is starboard bow only (the one asymmetry).
    patches = [
        (1, 'stern.deck', (0.0, _SPINE_R + 0.11 - 0.12, stn_cz),
         (0.58, 0.22, 0.44), 31),
        (1, 'mid.stbd', (_SPINE_R + 0.11 - 0.12, 0.10, mid_cz + 0.15),
         (0.22, 0.44, 0.58), 32),
    ]
    if detail >= 2:
        patches.append(
            (2, 'mid.port', (-_SPINE_R - 0.11 + 0.12, -0.08, mid_cz - 0.20),
             (0.22, 0.44, 0.58), 33))
    if detail >= 3:
        patches.append(
            (3, 'bow.stbd', (_SPINE_R + 0.11 - 0.12, 0.16, bow_cz + 0.10),
             (0.22, 0.40, 0.50), 34))
    for _gate, tag, loc, size, seed in patches:
        ln.orange_patch(parts, 'light.orange.' + tag, hull_mat, loc,
                        size=size, detail=detail, seed=seed)

    if detail < 2:
        return

    # ── MID COPY-RINGS (detail 2+): same joint module, linear array ──────
    # Confined to the mid zone. Half count at detail 2.
    n_rings = 8 if detail >= 3 else 4
    z0 = z_bow + 0.22
    z1 = z_mid - 0.22
    for i in range(n_rings):
        t = (i + 1) / float(n_rings + 1)
        ln.joint_ring(parts, 'light.ring.mid.%d' % i, hull_mat,
                      (0.0, 0.0, z0 + t * (z1 - z0)), _SPINE_R,
                      detail=detail)

    # ── FLANK PLATE COURSES (detail 2+): repeated off-white plates ───────
    # Large plates, length_vary 0.0: systematic copies, not patchwork.
    # Seated so the inboard face overlaps the bay by >= 0.10.
    n_pl = 12 if detail >= 3 else 6
    course_x = _SPINE_R + 0.07 - 0.16
    kit.plate_course(parts, 'light.plates.mid.stbd', kit.ROLE_ARMOUR,
                     (course_x, 0.0, mid_cz),
                     (0.14, 0.36, mid_len * 0.72), hull_mat,
                     count=n_pl, axis='z', gap=0.10, step=0.0,
                     bevel=0.012, length_vary=0.0)
    kit.plate_course(parts, 'light.plates.mid.port', kit.ROLE_ARMOUR,
                     (-course_x, 0.0, mid_cz),
                     (0.14, 0.36, mid_len * 0.72), hull_mat,
                     count=n_pl, axis='z', gap=0.10, step=0.0,
                     bevel=0.012, length_vary=0.0)
    if detail >= 3:
        kit.plate_course(parts, 'light.plates.bow.stbd', kit.ROLE_ARMOUR,
                         (course_x, 0.0, bow_cz),
                         (0.14, 0.32, bow_len * 0.70), hull_mat,
                         count=5, axis='z', gap=0.10, step=0.0,
                         bevel=0.012, length_vary=0.0)
        kit.plate_course(parts, 'light.plates.stern.port', kit.ROLE_ARMOUR,
                         (-course_x, 0.0, stn_cz),
                         (0.14, 0.32, stn_len * 0.70), hull_mat,
                         count=5, axis='z', gap=0.10, step=0.0,
                         bevel=0.012, length_vary=0.0)
