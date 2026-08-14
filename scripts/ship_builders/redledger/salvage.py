"""Red Ledger salvage-frame surface language.

Three surface elements the reference image shows and the current fleet lacks:

  1. plate_quilt  — dense cut-and-welded plate patchwork covering a hull region.
                   This is the faction's dominant surface read: a quilt of small,
                   individually-outlined plates of varying tone with recessed
                   seams between them.  The whole hull reads as salvaged iron,
                   not a smooth shell.

  2. stripe_block — one vertical dried-red accent bar (ROLE_ACCENT).
     stripe_group  — disciplined cluster of vertical bars; the faction's tally
                   marks. ROLE_ACCENT only, 3-8 % of hull area limit applies.

  3. salvage_boom — long skeletal lattice boom slung under and forward of the bow.
                   The outline-breaker (§G2, §21 rule 6): identifiable at thumbnail.

All functions take ABSOLUTE ship-space coordinates from the caller.
No hull geometry is queried here.  No bpy, no random, no from . import surface.

Ship-space axes: x = beam, y = height, z = length, NOSE at -Z. Rotations radians.

SIZE CONVENTION — every kit primitive takes HALF-EXTENTS:
  A constant such as STRIPE_W = 0.34 is the FULL width.  The kit call receives
  STRIPE_W * 0.5.  Every place a full-size constant is halved before reaching kit
  is marked with a comment of the form:
      # halved: <NAME> is full <axis> extent, kit takes half-extents
  Passing the full value is silent — no gate catches it — but produces an object
  twice the intended size.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

import math


# ---------------------------------------------------------------------------
# Internal human-scale constants — ABSOLUTE, NEVER multiplied by l, b or h.
# A larger Red Ledger ship carries MORE instances, never larger ones.
# ---------------------------------------------------------------------------
_PLATE_PROUD_MIN = 0.03   # minimum plate protrusion above hull surface (full)
_PLATE_PROUD_MAX = 0.06   # maximum plate protrusion above hull surface (full)
_PLATE_BURY      = 0.12   # fixed plate burial into hull (full); satisfies >= 0.10 gate
_SEAM_THICK      = 0.025  # seam strip thickness across the row boundary (full)
_SEAM_PROUD      = 0.006  # seam strip protrusion — recessed relative to plates (full)
_STRIPE_BURY     = 0.12   # fixed stripe burial into hull (full); satisfies >= 0.10 gate

# Knuckle work-lamp absolute size — matches surface.WORK_LAMP = (0.10, 0.10, 0.08)
_LAMP_FULL = (0.10, 0.10, 0.08)


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------
def _role_for(v, role_mix):
    """Return ROLE_HULL, ROLE_ARMOUR, or ROLE_RECESS for normalised value v in [0,1).

    Selection is by index into the cumulative distribution of role_mix; never by
    reading or comparing colour values.
    """
    h, a, _ = role_mix
    if v < h:
        return kit.ROLE_HULL
    if v < h + a:
        return kit.ROLE_ARMOUR
    return kit.ROLE_RECESS


def _glow_box(glow, name, loc, size, glow_mat):
    """Emissive box appended to *glow*; skin_role forced to 'glow'.

    Replicates the private _glow_box pattern from hardware.py so salvage.py
    needs no cross-module import.  size is half-extents per SIZE CONVENTION.
    """
    obj = kit.box(glow, name, kit.ROLE_TRIM, loc, size, glow_mat)
    obj['skin_role'] = 'glow'
    return obj


# ===========================================================================
# 1.  PLATE QUILT
# ===========================================================================
def plate_quilt(parts, name, x, y, z0, z1, height, mat, seed, detail,
                rows=3, pitch=0.9, face='x', role_mix=(0.62, 0.30, 0.08),
                surf=None):
    """Dense cut-and-welded plate patchwork — the Ledger's dominant surface read.

    Facing:
        face='x'  — starboard flank; plates protrude in +X from the surface at x.
        face='-x' — port flank; plates protrude in -X from the surface at x.
        face='y'  — deck surface; plates protrude in +Y from the surface at y.
        face='-y' — keel underside; plates protrude in -Y from the surface at y.

    Anchor:
        face='x'/'-x': x is the absolute hull outer-flank x-coordinate at the
          quilt midpoint, e.g. sf.flank_x(st, z_mid, y_mid) or equivalently
          sf.flank_anchor(st, z_mid, y_mid, 0.0).  y is the vertical centre of
          the quilt band.  height is the full Y-span of the quilt region.
        face='y'/'-y': y is the deck/keel surface y-coordinate (sf.top_y or
          sf.bottom_y).  x is the lateral centre of the quilt.  height is the
          full X-span of the quilt region.
        z0 / z1 are absolute Z limits (z0 < z1; z0 is toward the nose).

        `surf` is the anchor that a WEDGE hull requires, and on any tapering run
        it is not optional. A single `x` (or `y`) is only correct where the hull
        does not change section over the run; a Ledger hull tapers everywhere,
        so plates seated from one figure float as soon as the surface falls
        away. Pass `surf` as a callable the class file builds over its own
        station list, and this function re-samples the surface for EVERY plate:
            face='x'   surf(z, y) -> +X flank surface at that station and height
            face='-x'  surf(z, y) -> the port surface (negative x)
            face='y'   surf(z, x) -> deck y at that station and lateral offset
            face='-y'  surf(z, x) -> keel y
        e.g. `surf=lambda z, yy: sf.flank_x(st, z, yy)` for a starboard flank,
        or `surf=lambda z, xx: sf.top_y(st, z, xx)` for a deck. When `surf` is
        None the flat `x`/`y` figure is used, which is correct only on a
        constant-section run such as a spine segment or a separated block face.

    Connectivity:
        Each plate is buried _PLATE_BURY = 0.12 units into the hull surface —
        above the 0.10-unit minimum required by the probe-ship-islands gate at
        0.06-voxel resolution.  With `surf` supplied the burial is real at every
        station; without it, the caller owns the error.

    Role selection:
        Roles are chosen by seed-driven deterministic RNG per plate, selecting
        from role_mix by index — never by reading or comparing colour values.
        iron (ROLE_HULL) at ~62 % dominates; weathered plate (ROLE_ARMOUR) at
        ~30 % gives tonal variation; recessed-tone plates (ROLE_RECESS) at ~8 %
        read as panel gaps.  This three-tone spread is what makes the hull read
        as cut-and-welded salvage instead of a painted shell.

    Vertex cost estimate (detail=3, rows=3, pitch=0.9):
        n_cols = ceil(z_span / pitch).  Each plate = 12 triangles (un-bevelled
        box).  Seam strips = (rows - 1) x 12 triangles.
        At rows=3, pitch=0.9, z_span=10 units:
          ~34 plates * 12 + 2 seam strips * 12 = ~432 triangles.
        Class authors should budget 42-50 triangles per unit Z at detail=3, rows=3.
        Both flanks of a freighter (z_span ~20 units each side): ~1 700 triangles.
        Reduce detail to 2 or 1 in the stern zone to stay within class triangle cap.

    Detail:
        0 → nothing
        1 → single course of large plates (2x pitch), no seam strips
        2 → half the rows, 1.4x pitch (reduced density, no seam strips)
        3 → full quilt: all rows at nominal pitch plus ROLE_RECESS seam strips
            between every pair of adjacent courses
    """
    if detail < 1:
        return []

    z_span = z1 - z0
    if z_span <= 0.0 or height <= 0.0:
        return []

    # Detail degradation
    if detail == 1:
        eff_rows  = 1
        eff_pitch = pitch * 2.0
    elif detail == 2:
        eff_rows  = max(1, rows // 2)
        eff_pitch = pitch * 1.4
    else:
        eff_rows  = rows
        eff_pitch = pitch

    objs  = []
    rng   = kit.rng(seed)
    n_cols = max(1, int(math.ceil(z_span / eff_pitch)))
    col_w  = z_span / n_cols        # actual full cell pitch in Z (spans exactly z0..z1)
    row_h  = height / eff_rows      # full cell height in the cross-hull direction

    for r in range(eff_rows):

        for c in range(n_cols):
            # Deterministic per-plate jitter ± 18 % on footprint size
            jz    = 1.0 + (rng() - 0.5) * 0.36   # Z size multiplier in [0.82, 1.18]
            jcrs  = 1.0 + (rng() - 0.5) * 0.36   # cross-hull size multiplier
            proud = _PLATE_PROUD_MIN + rng() * (_PLATE_PROUD_MAX - _PLATE_PROUD_MIN)
            role  = _role_for(rng(), role_mix)

            # Full extents of this plate
            pz_full  = col_w * jz     # full Z footprint
            pcrs_full = row_h * jcrs  # full cross-hull footprint

            # Longitudinal (Z) centre of this plate
            cz = z0 + (c + 0.5) * col_w

            # Normal-axis geometry:
            #   outer face = surface + proud (proud of hull)
            #   inner face = surface - _PLATE_BURY (buried into hull)
            #   centre     = surface + (proud - _PLATE_BURY) * 0.5
            #   full normal extent = proud + _PLATE_BURY
            #
            # Half-extents for kit.box (SIZE CONVENTION: kit.box takes half-extents):
            hn   = (proud + _PLATE_BURY) * 0.5   # halved: proud+bury is full normal extent
            hz   = pz_full  * 0.5                  # halved: pz_full is full Z extent
            hcrs = pcrs_full * 0.5                 # halved: pcrs_full is full cross extent

            pname = '%s.p%02d_%02d' % (name, r, c)

            if face == 'x':
                # Starboard flank — normal = +X.
                y_r = y - height * 0.5 + (r + 0.5) * row_h
                # Re-sample the surface at THIS plate's own station and height:
                # a wedge hull falls away along the run, and one figure for the
                # whole quilt leaves every aft plate hanging in open space.
                sx_here = surf(cz, y_r) if surf is not None else x
                if sx_here == 0.0 and surf is not None:
                    continue           # above the hull here — no surface to plate
                cx  = sx_here + (proud - _PLATE_BURY) * 0.5
                obj = kit.box(parts, pname, role, (cx, y_r, cz), (hn, hcrs, hz), mat)

            elif face == '-x':
                # Port flank — normal = -X; surf returns the port surface.
                y_r = y - height * 0.5 + (r + 0.5) * row_h
                sx_here = surf(cz, y_r) if surf is not None else x
                if sx_here == 0.0 and surf is not None:
                    continue
                cx  = sx_here - (proud - _PLATE_BURY) * 0.5
                obj = kit.box(parts, pname, role, (cx, y_r, cz), (hn, hcrs, hz), mat)

            elif face == 'y':
                # Deck — normal = +Y.  'rows' stack in X; 'height' is the X-span.
                x_r = x - height * 0.5 + (r + 0.5) * row_h
                sy_here = surf(cz, x_r) if surf is not None else y
                cy  = sy_here + (proud - _PLATE_BURY) * 0.5
                obj = kit.box(parts, pname, role, (x_r, cy, cz), (hcrs, hn, hz), mat)

            else:  # '-y'
                # Keel underside — normal = -Y.
                x_r = x - height * 0.5 + (r + 0.5) * row_h
                sy_here = surf(cz, x_r) if surf is not None else y
                cy  = sy_here - (proud - _PLATE_BURY) * 0.5
                obj = kit.box(parts, pname, role, (x_r, cy, cz), (hcrs, hn, hz), mat)

            objs.append(obj)

        # ── Seam strips between this course and the next (detail=3 only) ─────
        if detail >= 3 and r < eff_rows - 1:
            # One strip per COLUMN, not one strip for the whole run: a single
            # full-length strip is the documented "full-beam paper-thin floating
            # group" defect the moment the surface it rides changes station.
            hcrs_seam = _SEAM_THICK * 0.5                  # halved: full cross extent
            hn_seam   = (_SEAM_PROUD + _PLATE_BURY) * 0.5  # halved: full normal extent
            for c in range(n_cols):
                sname   = '%s.seam%02d_%02d' % (name, r, c)
                seam_cz = z0 + (c + 0.5) * col_w
                hz_seam = col_w * 0.5                      # halved: full Z extent

                if face in ('x', '-x'):
                    sy = y - height * 0.5 + (r + 1) * row_h
                    s_here = surf(seam_cz, sy) if surf is not None else x
                    if s_here == 0.0 and surf is not None:
                        continue
                    sign = 1.0 if face == 'x' else -1.0
                    scx  = s_here + sign * (_SEAM_PROUD - _PLATE_BURY) * 0.5
                    obj  = kit.box(parts, sname, kit.ROLE_RECESS,
                                   (scx, sy, seam_cz),
                                   (hn_seam, hcrs_seam, hz_seam), mat)
                else:
                    sx_off = x - height * 0.5 + (r + 1) * row_h
                    s_here = surf(seam_cz, sx_off) if surf is not None else y
                    sign   = 1.0 if face == 'y' else -1.0
                    scy    = s_here + sign * (_SEAM_PROUD - _PLATE_BURY) * 0.5
                    obj    = kit.box(parts, sname, kit.ROLE_RECESS,
                                     (sx_off, scy, seam_cz),
                                     (hcrs_seam, hn_seam, hz_seam), mat)

                objs.append(obj)

    return objs


# ===========================================================================
# 2.  STRIPE BLOCK — one vertical dried-red accent bar
# ===========================================================================
def stripe_block(parts, name, x, y, z, mat, height,
                 width=0.34, depth=0.05, inward=-1.0, detail=1):
    """One vertical dried-red stripe block on a hull flank — ROLE_ACCENT.

    Facing:
        The stripe stands perpendicular to the hull flank, oriented in ship Y
        (vertical).  inward=-1.0 protrudes outward in +X (starboard stripe,
        buried toward -X / hull interior).  inward=+1.0 is the mirror for port.

    Anchor:
        x is the absolute outer-surface x-coordinate of the hull flank at the
        stripe position, e.g. sf.flank_x(st, z, y_mid) or sf.flank_anchor with
        inset=0.  y is the absolute vertical centre of the stripe.  z is the
        absolute longitudinal centre.

    Connectivity:
        A fixed burial of _STRIPE_BURY = 0.12 units into the hull surface is
        always applied, satisfying the probe-ship-islands connectivity minimum
        of 0.10 units at 0.06-voxel resolution.  The caller must supply x such
        that the hull body extends at least _STRIPE_BURY = 0.12 units inward
        from x in the inward direction.

    Design rules (enforced by the class author):
        - Stripes are NEVER scaled with the hull: width and height are absolute
          constants, not fractions of b or h.  A larger ship carries more stripe
          groups, never wider or taller stripes.
        - Total ROLE_ACCENT coverage across the whole ship must stay inside
          3-8 % of hull surface area.  A single stripe_block (width=0.34,
          height=hull_height) on one flank is typically << 1 % on its own.
        - Clusters belong in the forward detail band (the bow zone where the
          reference shows prize-tally marks), not spaced evenly along the hull.

    Detail:
        0 → nothing
        1+ → one ROLE_ACCENT stripe box at the supplied position
    """
    if detail < 1:
        return []

    # Centre-X offset so the outer face stands `depth` proud and the inner face
    # is buried _STRIPE_BURY into the hull.
    #   For inward=-1 (starboard):
    #     outer face = cx + hn = x + depth  →  cx = x + (depth - _STRIPE_BURY) * 0.5
    #   General form (inward sign moves centre in the bury direction):
    #     cx = x + inward * (_STRIPE_BURY - depth) * 0.5
    cx = x + inward * (_STRIPE_BURY - depth) * 0.5

    # Half-extents for kit.box (SIZE CONVENTION: kit.box takes half-extents):
    hn = (depth + _STRIPE_BURY) * 0.5   # halved: depth + bury is full normal (X) extent
    hh = height * 0.5                    # halved: height is full Y extent
    hw = width  * 0.5                    # halved: width  is full Z extent

    obj = kit.box(parts, name, kit.ROLE_ACCENT, (cx, y, z), (hn, hh, hw), mat)
    return [obj]


# ===========================================================================
# 3.  STRIPE GROUP — disciplined cluster of vertical accent stripes
# ===========================================================================
def stripe_group(parts, name, x, y, z0, z1, mat, height, count,
                 gap=0.22, inward=-1.0, detail=1, surf=None):
    """A disciplined cluster of `count` vertical dried-red stripe blocks.

    The cluster is centred between z0 and z1.  Stripes are placed at constant
    absolute pitch `gap` (centre-to-centre) regardless of hull dimensions — gap
    must never be computed as a fraction of hull length or beam.

    Facing:
        Same as stripe_block.  inward=-1.0 for starboard, +1.0 for port.

    Anchor:
        x = absolute hull flank outer-surface x-coordinate (same as stripe_block),
          used only when `surf` is None.
        `surf` is a callable (z, y) -> flank surface x at that station, built by
          the class file over its own station list, e.g.
          `surf=lambda z, yy: sf.flank_x(st, z, yy)`. On a tapering wedge run a
          single x figure leaves the aft stripes of a cluster hanging clear of
          the hull; with `surf` every stripe is seated at its own station. A
          station where the callable returns 0.0 is above the hull and is
          skipped rather than emitted into open space.
        y = absolute vertical centre of the stripe cluster.
        z0, z1 = absolute Z limits of the zone in which the cluster is placed;
          the cluster is centred between them.  If (count-1)*gap exceeds the zone,
          stripes overflow symmetrically — the zone is a guide, not a hard limit.

    Connectivity:
        Each stripe inherits _STRIPE_BURY = 0.12 burial from stripe_block,
        satisfying the >= 0.10 unit connectivity requirement.

    Design rules (MUST be enforced by the class author):
        - Stripes are NEVER scaled with hull dimensions.  More stripes, never
          bigger ones.  The gap default 0.22 m (= sf.TALLY_SPACING) is absolute.
        - Total ROLE_ACCENT coverage across the whole ship must stay inside
          3-8 % of hull surface area.  Count all stripe_group calls on all classes
          and verify against hull surface area before committing.
        - Clusters go in the forward detail band (bow zone), not evenly along the
          hull.  The reference shows a short dense burst of tally marks, not a
          uniform stripe running the hull length.

    Detail:
        0 → nothing
        1+ → all `count` stripes at absolute gap pitch, centred in the zone
    """
    if detail < 1 or count < 1:
        return []

    objs    = []
    z_mid   = (z0 + z1) * 0.5
    # Centre the cluster: first stripe at z_mid - (count-1)*gap/2
    z_start = z_mid - (count - 1) * gap * 0.5

    for i in range(count):
        sz = z_start + i * gap
        sx = surf(sz, y) if surf is not None else x
        if surf is not None and sx == 0.0:
            continue
        objs.extend(stripe_block(parts, '%s.%02d' % (name, i),
                                 sx, y, sz, mat, height,
                                 inward=inward, detail=detail))
    return objs


# ===========================================================================
# 4.  SALVAGE BOOM — outline-breaking lattice arm
# ===========================================================================
def salvage_boom(parts, glow, name, root, tip, mat, glow_mat,
                 radius, jaw, detail, bays=4):
    """Long skeletal lattice boom slung under and forward of the bow.

    The salvage boom is the Red Ledger's mandatory outline-breaker (§G2, §21
    rule 6).  It must meet these three design requirements, enforced by the
    class author:

      1. MINIMUM LENGTH: the boom (root-to-tip distance) must be at least 15 %
         of the hull's full Z length.  A frigate (l ≈ 14 units) needs a boom
         of at least 2.1 units; a freighter (l ≈ 24 units) needs at least 3.6.

      2. BELOW KEEL: the boom hangs BELOW the keel line (tip.y < keel_y at
         tip.z) so it breaks the ship silhouette in side view.  The root may
         be at keel level but the body of the boom must drop below it.

      3. FLEET-WIDE: every hull class in the fleet carries one boom, sized to
         its own hull.  radius and jaw scale with class size; the STRUCTURE
         (two chords, zig-zag braces, jaw) is constant at every scale.

    Structure:
        Two parallel longitudinal chords (port and starboard of the boom
        centreline) run as struts from root to near tip at lateral offset
        ± (4 × radius).  `bays` diagonal cross-braces form a visible zig-zag
        between the chords.  Short vertical drop struts hang from each bay node.
        A chamfered knuckle box marks the single articulation point at the boom
        midpoint.  A two-piece converging jaw at tip opens toward -Z (the nose /
        approach direction).

    Facing:
        Boom hangs below the keel and projects toward -Z.  The jaw opens toward
        -Z so an approaching vessel is caught by the open tips.

    Anchor:
        root is supplied by the caller using hull geometry (e.g. sf.bottom_y at
        the forward belly zone).  tip is the absolute end-of-boom coordinate in
        ship space.  ALL coordinates are absolute; no hull queries are performed
        inside this function.

    Connectivity:
        root MUST be placed INSIDE the hull volume.  The caller must ensure that
        root.z and root.y are within the hull body at root.x, so the chord
        struts that start at root overlap the hull mesh by at least the strut
        radius (>= 0.10 units).  A root that touches but does not penetrate the
        hull will produce a disconnected boom and fail the probe-ship-islands gate.

    Detail:
        0 → nothing
        1 → two longitudinal chords (root → tip) + jaw stub — minimum readable
            silhouette; usable at lod2/lod3
        2 → detail 1 + `bays` zig-zag cross-braces + chamfered knuckle box
        3 → detail 2 + short vertical drop struts at bay nodes
              + amber work lamp at the knuckle joint
    """
    if detail < 1:
        return []

    objs = []
    rx, ry, rz = root
    tx, ty, tz = tip

    # Lateral chord offset: 4 × strut radius so the structure reads as open
    # and light passes visibly through it.
    cs = radius * 4.0    # full lateral offset from centreline to each chord

    # The two chord endpoints (port A and starboard B)
    rA = (rx - cs, ry, rz)    # root, port chord
    rB = (rx + cs, ry, rz)    # root, starboard chord
    tA = (tx - cs, ty, tz)    # tip, port chord
    tB = (tx + cs, ty, tz)    # tip, starboard chord

    # ── Detail 1 : two longitudinal chords + jaw stub ─────────────────────
    chA = kit.strut(parts, name + '.chord.A', kit.ROLE_ARMOUR, rA, tA, mat, radius)
    chB = kit.strut(parts, name + '.chord.B', kit.ROLE_ARMOUR, rB, tB, mat, radius)
    if chA:
        objs.append(chA)
    if chB:
        objs.append(chB)

    # Jaw: two converging struts opening toward -Z.  The apex is forward of the
    # boom tip (toward the nose); the jaw tips spread in X at the tip plane.
    jaw_r    = radius * 0.72
    jaw_apex = (tx, ty, tz - jaw * 0.65)    # apex toward -Z from tip
    jaw_pA   = (tx - jaw * 0.5, ty, tz)     # port jaw tip
    jaw_pB   = (tx + jaw * 0.5, ty, tz)     # starboard jaw tip

    j0 = kit.strut(parts, name + '.jaw.A', kit.ROLE_ARMOUR, jaw_apex, jaw_pA, mat, jaw_r)
    j1 = kit.strut(parts, name + '.jaw.B', kit.ROLE_ARMOUR, jaw_apex, jaw_pB, mat, jaw_r)
    # Small junction box at the jaw apex — half-extent = jaw_r (full = 2 * jaw_r)
    jT = kit.box(parts, name + '.jaw.tip', kit.ROLE_ARMOUR,
                 jaw_apex,
                 (jaw_r, jaw_r, jaw_r),   # jaw_r is already the half-extent here
                 mat)
    if j0:
        objs.append(j0)
    if j1:
        objs.append(j1)
    objs.append(jT)

    if detail < 2:
        return objs

    # ── Detail 2 : zig-zag cross-braces + knuckle box ─────────────────────
    # Interpolate node positions along each chord at each bay boundary.
    def node_A(k):
        t = k / float(bays)
        return (rx - cs + t * (tx - rx),
                ry + t * (ty - ry),
                rz + t * (tz - rz))

    def node_B(k):
        t = k / float(bays)
        return (rx + cs + t * (tx - rx),
                ry + t * (ty - ry),
                rz + t * (tz - rz))

    # Zig-zag: even bays go A[k]→B[k+1], odd bays go B[k]→A[k+1]
    brace_r = radius * 0.80    # cross-brace struts slightly thinner than chords
    for k in range(bays):
        if k % 2 == 0:
            pa = node_A(k)
            pb = node_B(k + 1)
        else:
            pa = node_B(k)
            pb = node_A(k + 1)
        br = kit.strut(parts, name + '.brace.%02d' % k,
                       kit.ROLE_ARMOUR, pa, pb, mat, brace_r)
        if br:
            objs.append(br)

    # Knuckle box at the boom midpoint — chamfered armour block for the joint.
    # ksize is the half-extent passed to chamfer_block (full size = 2 * ksize).
    # The box overlaps both chords (chord radius < ksize) so connectivity is met.
    kx = rx + 0.5 * (tx - rx)
    ky = ry + 0.5 * (ty - ry)
    kz = rz + 0.5 * (tz - rz)
    knuckle = (kx, ky, kz)
    ksize   = radius * 2.0    # half-extent of the knuckle box
    kbox = kit.chamfer_block(parts, name + '.knuckle', kit.ROLE_ARMOUR,
                             knuckle,
                             (ksize * 2.0, ksize * 2.0, ksize * 2.0),
                             # halved: ksize*2 is the full extent each axis;
                             # chamfer_block divides sx by 2 internally, so
                             # passing the full extent gives the correct geometry.
                             mat, chamfer=radius * 0.8)
    objs.append(kbox)

    if detail < 3:
        return objs

    # ── Detail 3 : vertical drop struts + amber work lamp ─────────────────
    # Drop struts at each interior bay node (not root or tip) on chord A.
    # Each strut hangs downward (-Y) from the chord node.
    drop_full = radius * 3.5    # full drop strut length
    drop_r    = radius * 0.55
    for k in range(1, bays):
        na = node_A(k)
        drop_bot = (na[0], na[1] - drop_full, na[2])
        ds = kit.strut(parts, name + '.drop.%02d' % k,
                       kit.ROLE_ARMOUR, na, drop_bot, mat, drop_r)
        if ds:
            objs.append(ds)

    # Amber work lamp at the knuckle: emissive box sunk into the knuckle face.
    # _LAMP_FULL = (0.10, 0.10, 0.08) full extents; halve before kit call.
    lamp_lx, lamp_ly, lamp_lz = _LAMP_FULL
    # Position the lamp below the knuckle, sunk 0.02 into it for connectivity.
    lamp_y = ky - ksize - lamp_ly * 0.5 + 0.02
    lamp_obj = _glow_box(
        glow,
        name + '.lamp',
        (kx, lamp_y, kz),
        (lamp_lx * 0.5, lamp_ly * 0.5, lamp_lz * 0.5),
        # halved: lamp_l* are full extents, kit.box takes half-extents
        glow_mat
    )
    objs.append(lamp_obj)

    return objs
