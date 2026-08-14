"""Beautiful Ones anatomy — the faction's GROWN surface language.

Bible section 4.6: living kin, not organic machines. This module is the
surface of a grown body: the long FLOW LINES where pearl back meets indigo
flank, the branching luminous VEIN lattice in the deep folds, the swept
fleshy FLIPPER fins that carry the whole outline — each ONE welded
membrane: a crescent planform whose leading edge rides a sagging bezier,
a fleshy lens cross-section, a drooping trailing edge, a rounded paddle
tip, never a tube and never a bead chain — the fold creases the
veins live in, and the pale welts of healed scars. There are no plates, no
courses, no seams, no collars, no rivets, no kitbash: everything here is
soft, continuous and seated on the body it grows from.

THE ANCHOR RULE (pipeline §6): no construct here takes a typed y fraction of
the ship. Every run takes a ``surf`` callback from surface.py and re-samples
at its OWN station, skipping any element whose sample is 0.0 — a run past a
taper self-trims instead of floating. Every point path (flow lines, scars,
vein roots and tips) is computed by the class file from surface queries and
passed in explicitly. Roots handed inside the hull are used as given; that
burial is the connectivity.

PAINT (dual rule — kit role tags AND skin name selectors must agree, because
paint_parts_vc honours the role tag first and the name only when no tag
exists):
    pearl membrane   kit.ROLE_ARMOUR  names 'living-…' / 'fin-…'   #B0A8BE
    base tissue      kit.ROLE_HULL    (deep indigo body)           #6B617B
    violet nerve     kit.ROLE_ACCENT  names 'nerve-…' / 'sensory-…' #7850D4
    bright pearl     kit.ROLE_TRIM    flow lines, lips, welts      pearl x1.12
    crease floor     kit.ROLE_RECESS  dark indigo, the fold shadow base x0.62
    emissive         glow list, obj['skin_role'] = 'glow'          #69D8E2
Emissive is the vein lattice and nothing else here: thin cyan cores in the
folds, never on the calm pearl back, capped far below 5 % of hull area.

Size conventions (verified against the ship_kit.py source):
    kit.box           FULL extents (line 82: obj.scale = size / 2 on
                      Blender's default 2-unit cube)
    kit.taper_block   FULL extents; front=(fx, fy) scales the ship -Z face
    kit.sphere        scale is RADII per axis (unit sphere, obj.scale set)
    kit.strut         real radius between two ship-space points; returns
                      None for a near-zero span — always filter
    kit.hull_loft     stations (z, half_w, half_h, y_offset, chamfer);
                      centreline-locked, never used here for paired fins
Nothing here is scaled by ship l, b or h; filament, vein and flow-line sizes
come from the absolute sf.* living module.

Detail ladder: detail 3 = lod0 full, 2 = fewer repeats, 1 = primary form,
0 = primary masses only. Repeated elements count DOWN with detail
(``n = 8 if detail >= 2 else 4`` pattern); flow lines and scars thin to a
single chord rather than vanish; veins and frond fields drop at detail 0.

Flipper membrane cost (AUTHORED per-flipper metric, measured fleet totals are in the class docstrings):
  detail 3 = 13+3 stations x loop 12 (7 chord/side) = 384 tris / 194 verts
  detail 2 = 10+2 x loop 8 (5 chord) = 192/98
  detail 1 = 9+2 x loop 6 (4 chord) = 132/68
  detail 0 = 7+2 x loop 4 (3 chord) = 72/38. That is 43-69 % of
  The organ's own membrane skeleton is the GROWN skeleton (the spine
  defines the flipper shape; the beads are phantom; the skin is the
  final mesh). The True GROWN flesh flips over to an in-hull spool
  (more legible for the organ's own lofting).







```
"""
import math
import sys
from pathlib import Path

import bmesh
import bpy
import mathutils

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf


# ---------------------------------------------------------------------------
# Internal constants — ABSOLUTE world units, never scaled by ship size.
# ---------------------------------------------------------------------------
_MEM_THICK_MIN = 0.07   # membrane thickness floor: the island probe's voxel
                        #   is 0.06, anything thinner floats invisibly
_FLIP_TIP_ROUND = 0.60  # tip half-thickness >= root half-thickness *
                        #   this — a rounded paddle end, never a knife edge
_FLIP_SPAN_R    = 1.15  # seating bead along-span radius = local bead
                        #   spacing * this, so consecutive centres stay
                        #   < 0.55 * (rs_i + rs_j) (the probe's overlap
                        #   invariant); also sizes the loft's tip-cap arc
_FLIP_CURL_MIN  = 0.05  # auto curl (midpoint sag) as a fraction of span…
_FLIP_CURL_VAR  = 0.04  #   …plus this much seeded variation
_FLIP_BEADS     = {3: 5, 2: 4, 1: 3, 0: 3}   # seating-chain count by
                        #   detail (organ seating + the probe's overlap
                        #   invariant; GEOMETRY is the membrane fin below)
_FIN_SPAN   = {3: 13, 2: 10, 1: 9, 0: 7}  # membrane span stations by detail
_FIN_CHORD  = {3: 7, 2: 5, 1: 4, 0: 3}    # chord stations per surface
_FIN_CAP    = {3: 3, 2: 2, 1: 2, 0: 2}    # cosine stations in the tip closeout
_FIN_LEAD_U = 0.22   # lens thickness peak, this fraction of the chord
                     #   aft of the leading edge
_FIN_DROOP  = 0.28   # trailing-edge droop at the tip = local chord * this
                     #   (the membrane's own sag, growing with span)
_FOLD_PITCH    = 0.80   # z-length of one crease segment at detail 3
_FOLD_DEPTH    = 0.16   # crease floor depth inboard of the skin
_FOLD_LIP_R    = 0.07   # crease lip strut radius
_FOLD_LIP_BURY = 0.03   # lip centre sits this far inboard of the skin:
                        #   0.03 + lip radius 0.07 = 0.10 of material inside
_VEIN_SHEATH   = 1.5    # violet sheath radius = VEIN_R * this
_VEIN_CORE     = 0.55   # cyan core radius = VEIN_R * this
_VEIN_CORE_OUT = 0.05   # core offset outward from the sheath axis, so the
                        #   core's surface stands proud of the sheath and the
                        #   cyan line reads inside the violet nerve
_SCAR_SWELL    = 1.3    # scar welt swell radius = welt radius * this


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _glow_tag(obj):
    """Force an object's skin_role to 'glow' (cyan by role)."""
    if obj is not None:
        obj['skin_role'] = 'glow'
    return obj


def _ship_dir(bl_vec):
    """Convert a Blender-space direction back to ship space.

    The kit maps ship (x, y, z) -> Blender (x, -z, y) (kit._bloc), so the
    inverse is Blender (X, Y, Z) -> ship (X, Z, -Y).
    """
    return (bl_vec.x, bl_vec.z, -bl_vec.y)


# ---------------------------------------------------------------------------
# Flipper curve — the sagging bezier every fleshy span follows
# ---------------------------------------------------------------------------

def _flipper_curl(root, tip, seed=1, curl=None):
    """Return (length, bezier control point) for a flipper root -> tip.

    The flipper's spine is a quadratic bezier whose control point is the
    root->tip midpoint pulled PERPENDICULAR to the span, biased down and
    aft — the sag of a whale flipper under its own weight, so no span ever
    reads as a straight plank. ``curl`` is the offset distance; None derives
    a gentle seeded sag (5-9 % of the span), so a mirrored pair built with
    different seeds never curves identically. Every seating helper below
    re-derives the same curve from the same (root, tip, seed, curl), so
    flow lines, vein tips and filaments land exactly on the built flesh.
    Returns (0.0, None) when root == tip.
    """
    rx, ry, rz = root
    dx, dy, dz = tip[0] - rx, tip[1] - ry, tip[2] - rz
    length = math.sqrt(dx * dx + dy * dy + dz * dz)
    if length < 1e-6:
        return 0.0, None
    if curl is None:
        hsh = math.sin(seed * 12.9898 + length * 78.233) * 43758.5453
        curl = length * (_FLIP_CURL_MIN
                         + _FLIP_CURL_VAR * (hsh - math.floor(hsh)))
    d = (dx / length, dy / length, dz / length)
    for ref in ((0.0, -0.45, 0.89), (0.89, -0.45, 0.0), (0.0, -1.0, 0.0)):
        dot = ref[0] * d[0] + ref[1] * d[1] + ref[2] * d[2]
        px, py, pz = (ref[0] - d[0] * dot, ref[1] - d[1] * dot,
                      ref[2] - d[2] * dot)
        pl = math.sqrt(px * px + py * py + pz * pz)
        if pl >= 1e-3:
            break
    ux, uy, uz = px / pl, py / pl, pz / pl
    ctrl = ((rx + tip[0]) * 0.5 + ux * curl,
            (ry + tip[1]) * 0.5 + uy * curl,
            (rz + tip[2]) * 0.5 + uz * curl)
    return length, ctrl


def _bezier_at(root, ctrl, tip, t):
    """Point on the quadratic bezier root-ctrl-tip at fraction t."""
    a = (1.0 - t) * (1.0 - t)
    b = 2.0 * (1.0 - t) * t
    c = t * t
    return (root[0] * a + ctrl[0] * b + tip[0] * c,
            root[1] * a + ctrl[1] * b + tip[1] * c,
            root[2] * a + ctrl[2] * b + tip[2] * c)


def _bezier_frame(root, ctrl, tip, t):
    """(point, chord dir, normal dir, quaternion) at span fraction t.

    The local frame of the flipper: the tangent is the bezier derivative;
    chord and normal come from the same minimal-twist quaternion idiom the
    old taper_block span used (Blender +Y mapped onto the tangent, converted
    back to ship space), so the chord stays as near the horizontal plane as
    the curve allows. fleshy_sweep's loft rings lie in the plane spanned by
    chord and normal; the quaternion is returned for any caller that orients
    a construct on the frame — the idiom survives centre_parts and export
    through matrix_world.
    """
    p = _bezier_at(root, ctrl, tip, t)
    tx = 2.0 * (1.0 - t) * (ctrl[0] - root[0]) + 2.0 * t * (tip[0] - ctrl[0])
    ty = 2.0 * (1.0 - t) * (ctrl[1] - root[1]) + 2.0 * t * (tip[1] - ctrl[1])
    tz = 2.0 * (1.0 - t) * (ctrl[2] - root[2]) + 2.0 * t * (tip[2] - ctrl[2])
    tl = math.sqrt(tx * tx + ty * ty + tz * tz)
    if tl < 1e-6:
        tx, ty, tz, tl = tip[0] - root[0], tip[1] - root[1], \
            tip[2] - root[2], 1.0
        tl = math.sqrt(tx * tx + ty * ty + tz * tz) or 1.0
    d_bl = mathutils.Vector((tx / tl, -tz / tl, ty / tl))
    q = mathutils.Vector((0.0, 1.0, 0.0)).rotation_difference(d_bl)
    chord = _ship_dir(q @ mathutils.Vector((1.0, 0.0, 0.0)))
    normal = _ship_dir(q @ mathutils.Vector((0.0, 0.0, 1.0)))
    return p, chord, normal, q


def flipper_radius_at(t, root_w, tip_w, thick):
    """(half-width, half-thickness) of a flipper's flesh at span fraction t.

    All arguments are RADII (kit.sphere convention): ``root_w``/``tip_w``
    are half-chords, ``thick`` the root half-thickness. The width
    interpolates root_w -> tip_w; the thickness starts at ``thick`` and
    thins gently to _FLIP_TIP_ROUND * thick at the tip — a rounded paddle
    end, never the old 42 % knife edge. Shared by fleshy_sweep, fin_membrane
    flow-line seating and the class-file surface seaters, so every construct
    agrees where the flesh is.
    """
    w = root_w + (tip_w - root_w) * t
    h = thick * (1.0 - (1.0 - _FLIP_TIP_ROUND) * t * t)
    return w, h


def _flipper_t_cut(root, tip, root_w, tip_w, thick, curl, seed, n):
    """(ctrl, t_cut): the bezier control and the centreline cutoff.

    The tip bead's span radius is sized first; the centreline run is then
    shortened by that radius so the flipper's OUTER SURFACE ends at the
    given tip — a bead centre on the tip would push the silhouette rs past
    the authored outline (and the span gates). Every seating helper scales
    t by the same t_cut, so a seated point always lands on the real chain.
    """
    _length, ctrl = _flipper_curl(root, tip, seed=seed, curl=curl)
    if ctrl is None:
        return None, 1.0
    ts = [i / (n - 1.0) for i in range(n)]
    centres = [_bezier_at(root, ctrl, tip, t) for t in ts]
    dists = [math.sqrt(sum((centres[i + 1][k] - centres[i][k]) ** 2
                           for k in range(3))) for i in range(n - 1)]
    tip_w = flipper_radius_at(1.0, root_w, tip_w, thick)[0]
    rs_tip = max(_FLIP_SPAN_R * dists[-1], tip_w)
    span = sum(dists)
    if span > rs_tip * 2.0:
        return ctrl, max(0.5, 1.0 - rs_tip / span)
    return ctrl, 1.0


def _flipper_tip_geometry(root, tip, root_w, tip_w, thick, curl, seed, n):
    """(ctrl, t_cap): the bezier control and the loft's cap-start fraction.

    The tip paddle's span radius rs_tip is derived exactly as
    _flipper_t_cut derives it (same ``n``, same spacing, same
    _FLIP_SPAN_R). fleshy_sweep's full-profile body runs out to ``t_cap``
    and the cosine cap then closes over one rs_tip of arc, so the loft's
    OUTER SURFACE ends exactly on the authored tip — the _flipper_t_cut
    semantics carried into the loft. The 0.25 floor keeps a degenerate
    stub (span shorter than its own tip radius) a swollen paddle instead
    of a ring stack collapsed on the root.
    """
    _length, ctrl = _flipper_curl(root, tip, seed=seed, curl=curl)
    if ctrl is None:
        return None, 1.0
    ts = [i / (n - 1.0) for i in range(n)]
    centres = [_bezier_at(root, ctrl, tip, t) for t in ts]
    dists = [math.sqrt(sum((centres[i + 1][k] - centres[i][k]) ** 2
                           for k in range(3))) for i in range(n - 1)]
    w_tip = flipper_radius_at(1.0, root_w, tip_w, thick)[0]
    rs_tip = max(_FLIP_SPAN_R * dists[-1], w_tip)
    span = sum(dists)
    if span < 1e-9:
        return None, 1.0
    return ctrl, max(0.25, 1.0 - rs_tip / span)


def _membrane_frame(root, ctrl, tip, t):
    """(point, chord dir, normal dir) for the membrane at span fraction t.

    The raw _bezier_frame with deterministic signs: chord points AFT
    (flipped to ship +Z when the minimal-twist idiom produced the fore
    direction — mirrored pairs mirror, so the Z sign is consistent across
    them), normal points UP (flipped to ship +Y). The membrane's leading
    edge rides the spine bezier at ``point``; the flesh extends from there
    along +chord. Every membrane consumer (geometry, seating helpers, flow
    lines) uses THIS frame, so seats land on the built skin.
    """
    p, chord, normal, _q = _bezier_frame(root, ctrl, tip, t)
    if chord[2] < 0.0:
        chord = (-chord[0], -chord[1], -chord[2])
    if normal[1] < 0.0:
        normal = (-normal[0], -normal[1], -normal[2])
    return p, chord, normal


def _membrane_point(p, chord, normal, c, h_max, f, u, side, h_floor):
    """Ship-space point on the membrane at span fraction f, chord
    fraction u (0 = leading edge, 1 = trailing edge), side +1 crown /
    -1 underside.

    The cross-section is a fleshy LENS: thickness peaks at _FIN_LEAD_U
    (just aft of the leading edge, like a whale flipper's muscular leading
    bolus) and thins toward both rims, floored at ``h_floor`` so the
    trailing edge never goes voxel-thin. The whole section droops along
    -normal toward the trailing edge — camber, not thickness — growing
    with span fraction: the trailing edge's own smooth sag. THE single
    source of truth for the membrane surface: geometry, flipper_surface_
    point and fin_membrane's flow lines all evaluate this function.
    """
    if u <= _FIN_LEAD_U:
        s = math.sin(0.5 * math.pi * u / _FIN_LEAD_U) ** 0.7
    else:
        s = (1.0 - (u - _FIN_LEAD_U) / (1.0 - _FIN_LEAD_U)) ** 0.75
    h = max(h_floor, h_max * s)
    droop = _FIN_DROOP * c * math.sin(0.5 * math.pi * f) * u * u
    off = c * u
    v = side * h - droop
    return (p[0] + chord[0] * off + normal[0] * v,
            p[1] + chord[1] * off + normal[1] * v,
            p[2] + chord[2] * off + normal[2] * v)


def _membrane_loop(bm, p, chord, normal, c, h_max, f, n_chord, h_floor):
    """One closed lens loop across the fin's chord at a span station.

    Crown from the leading edge (u = 0, ON the spine bezier) to the
    trailing edge (u = 1), then back along the underside: 2*n_chord - 2
    verts, the same loop budget the old radial rings used.
    """
    loop = []
    for j in range(n_chord):
        u = j / (n_chord - 1.0)
        loop.append(bm.verts.new(kit._bloc(_membrane_point(
            p, chord, normal, c, h_max, f, u, 1.0, h_floor))))
    for j in range(n_chord - 2, 0, -1):
        u = j / (n_chord - 1.0)
        loop.append(bm.verts.new(kit._bloc(_membrane_point(
            p, chord, normal, c, h_max, f, u, -1.0, h_floor))))
    return loop


def flipper_bead_layout(root, tip, root_w, tip_w, thick, curl=None, seed=1,
                        detail=3, beads=None):
    """The phantom bead chain every flipper is parameterised by:
    [(t, centre, (rw, rh, rs))].

    Pure math, no geometry — the probe and the seating helpers share this
    exact layout. fleshy_sweep's GEOMETRY is now a membrane fin swept
    along the same curve with the same radii profile; this chain remains
    the shared contract for where flesh is. Bead centres ride the sagging
    bezier at even spacing out to t_cut (see _flipper_t_cut); rs is the
    bead's along-span radius, _FLIP_SPAN_R times the local bead spacing,
    which keeps every consecutive centre distance under
    0.55 * (rs_i + rs_j): the probe's one-mass overlap invariant. The tip
    bead's span radius is raised to its half-width so the paddle end reads
    round in plan — the loft's cap arc is sized from the same rs_tip.
    """
    n = beads if beads else _FLIP_BEADS.get(min(max(int(detail), 0), 3), 7)
    n = max(2, n)
    ctrl, t_cut = _flipper_t_cut(root, tip, root_w, tip_w, thick, curl,
                                 seed, n)
    if ctrl is None:
        return []
    fracs = [i / (n - 1.0) for i in range(n)]
    centres = [_bezier_at(root, ctrl, tip, f * t_cut) for f in fracs]
    dists = [math.sqrt(sum((centres[i + 1][k] - centres[i][k]) ** 2
                           for k in range(3))) for i in range(n - 1)]
    out = []
    for i, f in enumerate(fracs):
        w, h = flipper_radius_at(f, root_w, tip_w, thick)
        adj = []
        if i > 0:
            adj.append(dists[i - 1])
        if i < n - 1:
            adj.append(dists[i])
        rs = _FLIP_SPAN_R * (sum(adj) / len(adj))
        if i == n - 1:
            rs = max(rs, w)      # rounded paddle tip
        out.append((f * t_cut, centres[i], (w, h, rs)))
    return out


def flipper_point(root, tip, t, seed=1, curl=None):
    """Ship-space point on a flipper's curved spine at span fraction t.

    The spine is the sagging bezier the membrane's LEADING edge follows
    (t scaled by the layout's t_cut at the full-detail bead count) —
    class files seat trailing filaments and fin-root details on the real
    curve, never the old straight segment. The point sits on the
    membrane's leading edge; to seat mid-membrane, offset AFT along the
    chord of flipper_frame. Returns ``root`` when root == tip.
    """
    ctrl, t_cut = _flipper_t_cut(root, tip, 0.5, 0.3, 0.1, curl, seed,
                                 _FLIP_BEADS[3])
    if ctrl is None:
        return tuple(root)
    return _bezier_at(root, ctrl, tip, max(0.0, min(1.0, t)) * t_cut)


def flipper_frame(root, tip, t, seed=1, curl=None, root_w=0.5, tip_w=0.3,
                  thick=0.1):
    """(point, chord dir, normal dir) on a flipper's curve at fraction t.

    ``point`` is on the spine bezier — the membrane's LEADING edge.
    ``chord`` points AFT along the chord (the membrane's flesh extends
    from the leading edge along +chord), ``normal`` points up through the
    membrane's thickness; both signs are normalised (see
    _membrane_frame), so mirrored fin pairs get mirrored frames and seats
    computed from them land on the built skin. t is a fraction of the
    LAID-OUT chain (scaled by the layout's t_cut at the full-detail bead
    count), so frames land where the flesh really is.
    """
    ctrl, t_cut = _flipper_t_cut(root, tip, root_w, tip_w, thick, curl,
                                 seed, _FLIP_BEADS[3])
    if ctrl is None:
        return tuple(root), (1.0, 0.0, 0.0), (0.0, 1.0, 0.0)
    return _membrane_frame(root, ctrl, tip, max(0.0, min(1.0, t)) * t_cut)


def flipper_surface_point(root, tip, root_w, tip_w, thick, t, seed=1,
                          lift=0.02, curl=None):
    """Point on the membrane's mid-chord crown at span fraction t.

    Evaluated with the SAME _membrane_point function the geometry is built
    from: the lens-section crown at chord fraction 0.5 (droop included),
    plus ``lift`` along the local up-normal. A strut END placed here
    pierces the membrane skin and stands ``lift`` proud — the seating
    rule for vein tips. ``thick`` is the root half-thickness, clamped to
    the same floor fin_membrane applies (half of _MEM_THICK_MIN).
    """
    thick = max(thick, _MEM_THICK_MIN * 0.5)
    f = max(0.0, min(1.0, t))
    p, chord, normal = flipper_frame(root, tip, t, seed=seed, curl=curl,
                                     root_w=root_w, tip_w=tip_w, thick=thick)
    w, h_max = flipper_radius_at(f, root_w, tip_w, thick)
    x, y, z = _membrane_point(p, chord, normal, 2.0 * w, h_max, f, 0.5,
                              1.0, _MEM_THICK_MIN * 0.5)
    return (x + normal[0] * lift, y + normal[1] * lift, z + normal[2] * lift)


def fleshy_sweep(parts, name, role, mat, root, tip, root_w, tip_w, thick,
                 curl=None, detail=3, seed=1, beads=None):
    """One fleshy flipper from an in-hull ``root`` to an explicit ``tip``:
    ONE continuous welded MEMBRANE fin along a sagging bezier.

    The shared limb/flipper building block behind fin_membrane, swept_span
    and the grasping fingers — whale/sea-lion anatomy, a manta's pectoral
    fin, never an aircraft wing and never a tapered tube:

    PLANFORM — a crescent/sickle in plan view. The LEADING edge is the
    root->tip sagging bezier itself (``curl``, auto-seeded when None); at
    span fraction f the local chord c(f) = lerp(2*root_w, 2*tip_w, f)
    extends AFT of the leading edge along the frame's chord direction, so
    the trailing edge is its own curve, sagging further than the leading
    edge (the _FIN_DROOP camber grows with span). No straight leading
    edge, no straight trailing edge.

    CROSS-SECTION — a fleshy LENS across the chord (see _membrane_point):
    thickest at _FIN_LEAD_U just aft of the leading edge, thinning toward
    the trailing edge (floored at the _MEM_THICK_MIN membrane minimum, so
    the rim never goes voxel-thin) and toward the tip (the
    _FLIP_TIP_ROUND floor keeps the tip a rounded paddle, never a knife
    edge or point).

    MESH — one welded grid of closed lens loops (span stations x chord
    stations), smooth-shaded, closed at the trailing edge and at the tip.
    The tip closeout is a rounded paddle: full-profile stations run to
    ``t_cap`` (see _flipper_tip_geometry), then cosine-shrinking loops
    round down to a pole EXACTLY on the authored tip — no overshoot, no
    shortfall, no straight tip cut. ``root`` is GIVEN INSIDE THE HULL and
    used as given — the first loop sits exactly on it, so the island
    probe still sees one connected body.

    Density scales with detail: 13/10/9/7 span stations and 7/5/4/3 chord
    stations per surface at detail 3/2/1/0, plus 3/2/2/2 cap stations and
    two pole fans — 384/192/132/72 tris per fin (54-69 % of the bead
    chain the membrane replaced). ``beads`` overrides the span-station
    count as stations = 2 * beads + 3, so the class files' budget lever
    (ace's beads=4 -> 11 stations, 336 tris) keeps working.

    Returns a one-element list with the membrane object ([] when root ==
    tip).
    """
    detail = min(max(int(detail), 0), 3)
    n = max(2, beads if beads else _FLIP_BEADS.get(detail, 7))
    ctrl, t_cap = _flipper_tip_geometry(root, tip, root_w, tip_w, thick,
                                        curl, seed, n)
    if ctrl is None:
        return []
    if beads:
        n_span = max(7, min(16, 2 * beads + 3))
    else:
        n_span = _FIN_SPAN[detail]
    n_chord = _FIN_CHORD[detail]
    cap = _FIN_CAP[detail]
    h_floor = _MEM_THICK_MIN * 0.5

    bm = bmesh.new()
    loops = []
    for k in range(n_span):
        f = k / (n_span - 1.0)
        w, h_max = flipper_radius_at(f, root_w, tip_w, thick)
        p, chord, normal = _membrane_frame(root, ctrl, tip, f * t_cap)
        loops.append(_membrane_loop(bm, p, chord, normal, 2.0 * w, h_max,
                                    f, n_chord, h_floor))
    w_tip, h_tip = flipper_radius_at(1.0, root_w, tip_w, thick)
    for j in range(1, cap + 1):
        theta = (math.pi * 0.5) * j / (cap + 1.0)
        s = math.cos(theta)
        p, chord, normal = _membrane_frame(
            root, ctrl, tip, t_cap + (1.0 - t_cap) * math.sin(theta))
        loops.append(_membrane_loop(bm, p, chord, normal, 2.0 * w_tip * s,
                                    h_tip * s, 1.0, n_chord, h_floor * s))
    n_loop = 2 * n_chord - 2
    for k in range(len(loops) - 1):
        l0, l1 = loops[k], loops[k + 1]
        for i in range(n_loop):
            j = (i + 1) % n_loop
            bm.faces.new((l0[i], l1[i], l1[j], l0[j]))
    # Poles close the shell into a manifold (recalc_face_normals then
    # guarantees outward normals). The root pole is nudged inboard of the
    # root loop — buried in the hull with it; the tip pole IS the authored
    # tip, so the outer surface ends exactly there.
    h_root = flipper_radius_at(0.0, root_w, tip_w, thick)[1]
    dx, dy, dz = ctrl[0] - root[0], ctrl[1] - root[1], ctrl[2] - root[2]
    dl = math.sqrt(dx * dx + dy * dy + dz * dz) or 1.0
    pole_root = bm.verts.new(kit._bloc((root[0] - dx / dl * h_root,
                                        root[1] - dy / dl * h_root,
                                        root[2] - dz / dl * h_root)))
    pole_tip = bm.verts.new(kit._bloc(_bezier_at(root, ctrl, tip, 1.0)))
    l0, ll = loops[0], loops[-1]
    for i in range(n_loop):
        j = (i + 1) % n_loop
        bm.faces.new((pole_root, l0[j], l0[i]))
        bm.faces.new((pole_tip, ll[i], ll[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj['skin_role'] = role
    parts.append(obj)
    return [obj]


def swept_span(parts, name, role, mat, root, tip, root_chord, tip_chord,
               thick):
    """One soft swept span from ``root`` to ``tip``: the shared limb
    building block behind the grasping fingers and the companion wings.

    Now a fleshy_sweep membrane fin — a fleshy rounded ray with a sagging
    leading edge, a drooping trailing edge and a rounded tip, never a
    straight taper_block plank. Chords and
    ``thick`` keep their historical FULL-extents meaning here (the old
    taper_block convention); fleshy_sweep takes radii, so they are halved.
    ``root`` is GIVEN INSIDE THE HULL and used as given — that burial is the
    connectivity. The curl is auto-seeded (seed fixed at 1: a finger fan
    varies because each finger's span direction differs).

    Returns the one-element membrane object list ([] when root == tip).
    """
    th = max(thick, _MEM_THICK_MIN)
    return fleshy_sweep(parts, name, role, mat, root, tip,
                        root_chord * 0.5, tip_chord * 0.5, th * 0.5,
                        detail=3, seed=1)


# ===========================================================================
# 1.  FLOW LINE — the long tonal boundary where pearl back meets indigo flank
# ===========================================================================
def flow_line(parts, name, mat, path, thick=sf.FLOW_R, detail=3, role=None):
    """A long thin flow line along an explicit surface ``path``.

    Charter: pearl-bone dorsal tissue meets the violet-indigo flanks in long
    GRADUAL flow lines that follow the body's own curvature — never a bounded
    two-tone region. The line itself is pale (kit.ROLE_TRIM, bright pearl):
    the tonal split it marks comes from the body masses either side, which
    the class file names 'living-body-…' (pearl) above and leaves base indigo
    below.

    ``path`` is a list of >= 2 ship-space (x, y, z) points the caller sampled
    from surface queries (surf_flank / surf_top / surf_bottom); each
    consecutive pair becomes one kit.strut of real radius ``thick``
    (default sf.FLOW_R — a line, never a ridge), so consecutive segments
    share endpoints and the chain is one connected run.

    Connectivity: the CALLER places the path so both ends bury >= 0.10 into
    the body (or into a seated construct) and intermediate points ride the
    surface; the strut is too thin to register as its own island component.

    Detail:
        0 → a single chord between the path ends (the line is never dropped)
        1 → every second point, always keeping both ends
        2+ → the full path
    """
    if role is None:
        role = kit.ROLE_TRIM
    pts = [tuple(p) for p in path]
    if len(pts) < 2:
        return []
    if detail <= 0:
        pts = [pts[0], pts[-1]]
    elif detail == 1 and len(pts) > 2:
        dec = pts[::2]
        if dec[-1] != pts[-1]:
            dec.append(pts[-1])
        pts = dec
    verts = 8 if detail >= 2 else 6
    objs = []
    for i in range(len(pts) - 1):
        seg = kit.strut(parts, '%s.f%02d' % (name, i), role,
                        pts[i], pts[i + 1], mat, radius=thick,
                        vertices=verts)
        if seg is not None:
            objs.append(seg)
    return objs


# ===========================================================================
# 2.  VEIN FAN — the branching luminous lattice in the deep folds
# ===========================================================================
def vein_fan(parts, glow, name, hull_mat, glow_mat, root, tips, out,
             detail=3, nodes=True):
    """One branching vein: a violet nerve sheath fanning from ``root`` to
    each of ``tips``, with a cyan luminous core riding proud of it.

    Charter: a lattice of luminous cyan-violet veins branches under the
    surface in the deep folds, brightest where the body creases — thin, in
    the folds, never on the calm pearl back, and capped far below 5 % of hull
    area. Each branch is TWO struts: the violet sheath (kit.ROLE_ACCENT,
    named 'nerve-…', real radius sf.VEIN_R * 1.5) and the cyan core (glow
    list, radius sf.VEIN_R * 0.55) offset ``out`` * 0.05 from the sheath
    axis, so the core's surface stands proud of the sheath and the light
    reads as a line inside the nerve. Bright node spheres (real radius
    sf.VEIN_NODE_R) sit at the root and at each branch tip — the crease
    points where the lattice is brightest.

    Anchors: ``root`` and ``tips`` are ship-space points the caller computed
    from surface queries INSIDE a fold crease (anatomy.fold_crease lays the
    channel they live in); ``out`` is the crease's unit outward direction.
    Both ends of every strut sit in solid tissue — the sheath endpoints bury
    into the crease floor and walls.

    Emissive budget: the cyan core is 0.05 in diameter and only the crest of
    each branch is exposed; a full fan is a few percent of one flank, far
    under the 5 % hull-area cap.

    Detail (branch count follows the ``8 if detail >= 2 else 4`` pattern):
        3 → all branches, cores and nodes
        2 → half the branches (min 1), cores kept, root node only
        1 → one branch with core, no nodes
        0 → nothing (the lattice is detail, not mass)
    """
    if detail < 1:
        return []
    tips = [tuple(t) for t in tips]
    if not tips:
        return []
    if detail >= 3:
        keep = len(tips)
    elif detail == 2:
        keep = max(1, len(tips) // 2)
    else:
        keep = 1
    ox, oy, oz = out
    sheath_r = sf.VEIN_R * _VEIN_SHEATH
    core_r = sf.VEIN_R * _VEIN_CORE
    objs = []
    for i in range(keep):
        tx, ty, tz = tips[i]
        sheath = kit.strut(parts, 'nerve-%s.b%02d' % (name, i),
                           kit.ROLE_ACCENT, root, tips[i], hull_mat,
                           radius=sheath_r, vertices=6)
        if sheath is not None:
            objs.append(sheath)
        ca = (root[0] + ox * _VEIN_CORE_OUT, root[1] + oy * _VEIN_CORE_OUT,
              root[2] + oz * _VEIN_CORE_OUT)
        cb = (tx + ox * _VEIN_CORE_OUT, ty + oy * _VEIN_CORE_OUT,
              tz + oz * _VEIN_CORE_OUT)
        core = kit.strut(glow, 'nerve-%s.c%02d' % (name, i), 'glow',
                         ca, cb, glow_mat, radius=core_r, vertices=6)
        if core is not None:
            objs.append(_glow_tag(core))
        if nodes and detail >= 3:
            node = kit.sphere(glow, 'nerve-%s.n%02d' % (name, i), 'glow',
                              cb, (sf.VEIN_NODE_R,) * 3, glow_mat, segments=8)
            if node is not None:
                objs.append(_glow_tag(node))
    if nodes and detail >= 2:
        rn = kit.sphere(glow, 'nerve-%s.nroot' % name, 'glow',
                        (root[0] + ox * _VEIN_CORE_OUT,
                         root[1] + oy * _VEIN_CORE_OUT,
                         root[2] + oz * _VEIN_CORE_OUT),
                        (sf.VEIN_NODE_R,) * 3, glow_mat, segments=8)
        if rn is not None:
            objs.append(_glow_tag(rn))
    return objs


# ===========================================================================
# 3.  FIN MEMBRANE — the swept fleshy flippers that ARE the outline
# ===========================================================================
def fin_membrane(parts, name, mat, root, tip, root_chord, tip_chord,
                 thick=0.10, detail=3, role=None, flow=2, seed=1,
                 beads=None):
    """One swept flipper fin from an in-hull ``root`` to an explicit ``tip``.

    Charter: multiple large FIN PAIRS carry the silhouette — fleshy flippers
    sweeping back past the body, rounded at the tip, carrying flow lines
    along the span. §G2's outline-breaker for this faction is the fin set.

    The flipper is one fleshy_sweep membrane fin: a thick muscular root
    (``root_chord`` full width — the chord runs roughly fore-aft along the
    body, extending AFT of the leading edge), thinning to a rounded paddle
    tip (``tip_chord`` full width), with a gentle seeded downward-aft curl
    so no edge ever reads as a straight plank. ``root`` is GIVEN INSIDE
    THE HULL and used as given — that burial is the connectivity; never
    inset it back out. ``thick`` (FULL root thickness) is clamped to >=
    0.07 so the probe always sees the flesh; chords and thick are halved
    into the radii fleshy_sweep takes. Paint is pearl membrane
    (kit.ROLE_ARMOUR, name 'fin-…'), matching the skin's 'fin' selector.

    Flow lines: ``flow`` spanwise pale lines (kit.ROLE_TRIM, real radius
    sf.FLOW_R) ride the membrane's crown at even chord fractions inside
    (0.2, 0.8), every sample evaluated with the SAME _membrane_point
    function the skin is built from (lens crown, droop included, +
    0.012), so every line is embedded in the flesh along its whole run
    and can never float beside it.

    Detail:
        3/2 → flipper + ``flow`` spanwise lines
        1   → flipper + one mid-chord flow line
        0   → flipper only (the fin is primary mass — it is the outline)
    """
    if role is None:
        role = kit.ROLE_ARMOUR
    th = max(thick, _MEM_THICK_MIN)
    rw, tw, th_h = root_chord * 0.5, tip_chord * 0.5, th * 0.5
    objs = fleshy_sweep(parts, name, role, mat, root, tip, rw, tw, th_h,
                        detail=detail, seed=seed, beads=beads)
    if not objs:
        return objs
    if detail < 1 or flow < 1:
        return objs
    n_lines = flow if detail >= 2 else 1
    n_beads = _FLIP_BEADS.get(min(max(int(detail), 0), 3), 7)
    ctrl, t_cut = _flipper_t_cut(root, tip, rw, tw, th_h, None, seed,
                                 n_beads)
    if ctrl is None:
        return objs
    t0, t1 = 0.12 * t_cut, 0.92 * t_cut
    steps = 3 if detail >= 2 else 2
    for i in range(n_lines):
        # Even chord fractions inside (0.2, 0.8): one line sits at 0.5.
        u = 0.5 if n_lines == 1 else 0.22 + 0.56 * i / (n_lines - 1.0)
        pts = []
        for k in range(steps + 1):
            t = t0 + (t1 - t0) * k / steps
            f = t / t_cut
            p, chord, normal = _membrane_frame(root, ctrl, tip, t)
            w, h_max = flipper_radius_at(f, rw, tw, th_h)
            # membrane crown at this chord fraction, plus paint lift
            x, y, z = _membrane_point(p, chord, normal, 2.0 * w, h_max, f,
                                      u, 1.0, _MEM_THICK_MIN * 0.5)
            pts.append((x + normal[0] * 0.012,
                        y + normal[1] * 0.012,
                        z + normal[2] * 0.012))
        for k in range(len(pts) - 1):
            seg = kit.strut(parts, '%s-flow-%02d.%d' % (name, i, k),
                            kit.ROLE_TRIM, pts[k], pts[k + 1], mat,
                            radius=sf.FLOW_R, vertices=6)
            if seg is not None:
                objs.append(seg)
    return objs


# ===========================================================================
# 4.  FOLD CREASE — the deep fold the veins live in
# ===========================================================================
def fold_crease(parts, name, mat, z0, z1, y, surf, side=1.0, depth=_FOLD_DEPTH,
                height=0.12, detail=3):
    """A long recessed fold in the flank: dark floor, two swollen lips.

    Charter: the body's deep folds are where the surface gathers — the vein
    lattice lives here, brightest in the crease. The fold is a RECESS, sunk
    inboard like the wave-7 gallery well (the proven flush-wall idiom): a
    dark floor strip (kit.ROLE_RECESS, FULL extents depth x height x segment)
    whose outer face sits flush with the skin and whose body sinks ``depth``
    inboard, flanked by two living lips (kit.ROLE_HULL struts, real radius
    0.07) whose centres ride 0.03 inboard of the skin — 0.10 of lip material
    inside the body, 0.04 standing proud.

    Anchor: ``surf(z)`` returns the half-beam at the crease centre height
    ``y`` (build it with sf.surf_flank); every segment re-samples at its OWN
    station and is skipped at 0.0, so the crease self-trims past the head
    and tail tapers. ``side`` +1.0 starboard / -1.0 port.

    Detail:
        3 → floor + lips, 0.80 segments
        2 → floor + lips, 1.80 segments
        1 → floor only, 2.40 segments (the crease reads as a dark line)
        0 → nothing (the loft carries the mass)
    """
    if detail < 1:
        return []
    span = z1 - z0
    if span <= 0.0 or height <= 0.0:
        return []
    pitch = _FOLD_PITCH if detail >= 3 else (1.80 if detail == 2 else 2.40)
    n_seg = max(1, int(math.ceil(span / pitch)))
    seg = span / n_seg + 0.04          # full z length; 0.04 overlap between segments
    objs = []
    for i in range(n_seg):
        cz = z0 + (i + 0.5) * (span / n_seg)
        sx = surf(cz)
        if sx == 0.0:
            continue                    # body has fallen away — self-trim
        # floor: outer face flush with the skin, body sunk `depth` inboard
        fx = side * (sx - depth * 0.5)
        objs.append(kit.box(parts, '%s.w%02d' % (name, i), kit.ROLE_RECESS,
                            (fx, y, cz), (depth, height, seg), mat))
        if detail < 2:
            continue
        # lips: one strut along each long edge, centre 0.03 inboard of skin
        for sy_sign, tag in ((1.0, 't'), (-1.0, 'b')):
            lx = side * (sx - _FOLD_LIP_BURY)
            ly = y + sy_sign * height * 0.5
            lip = kit.strut(parts, '%s.l%s%02d' % (name, tag, i),
                            kit.ROLE_HULL,
                            (lx, ly, cz - seg * 0.5), (lx, ly, cz + seg * 0.5),
                            mat, radius=_FOLD_LIP_R, vertices=6)
            if lip is not None:
                objs.append(lip)
    return objs


# ===========================================================================
# 5.  HEALED SCAR — a pale welt of remembered damage
# ===========================================================================
def healed_scar(parts, name, mat, path, thick=0.08, detail=3, role=None):
    """A healed scar: a pale raised welt along an explicit surface ``path``.

    Charter: scar history is class anatomy (the ace's controlled asymmetry,
    the elder frigate's long memory). A scar is a soft swollen welt
    (kit.ROLE_TRIM, bright pearl — healed tissue paler than the body around
    it), a strut chain along ``path`` with a low swell sphere at each
    interior point at detail 3. It is the ONLY sanctioned asymmetry source:
    one deliberate mark, never decoration.

    ``path`` is a list of >= 2 ship-space points the caller sampled from
    surface queries; both ends must bury >= 0.10 into the body.

    Detail:
        3 → full chain + interior swell spheres
        2 → full chain, no swells
        1 → a single chord between the path ends
        0 → nothing (a scar is pure surface history)
    """
    if detail < 1:
        return []
    if role is None:
        role = kit.ROLE_TRIM
    pts = [tuple(p) for p in path]
    if len(pts) < 2:
        return []
    if detail == 1:
        pts = [pts[0], pts[-1]]
    objs = []
    for i in range(len(pts) - 1):
        seg = kit.strut(parts, '%s.s%02d' % (name, i), role,
                        pts[i], pts[i + 1], mat, radius=thick, vertices=8)
        if seg is not None:
            objs.append(seg)
    if detail >= 3:
        for i in range(1, len(pts) - 1):
            sw = kit.sphere(parts, '%s.w%02d' % (name, i), role, pts[i],
                            (thick * _SCAR_SWELL,) * 3, mat, segments=8)
            if sw is not None:
                objs.append(sw)
    return objs
