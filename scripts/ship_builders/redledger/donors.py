"""Red Ledger — captured parts of other factions, bolted on.

Construction signature (§G6, docs/SpaceShipIdeas/synthesis/21-rimward-gap-analysis.md):
    "exposed frame, salvage: cut-and-welded seams; captured parts of
    other factions bolted on."

A Red Ledger ship must show, at a glance, that pieces of other people's
ships have been cut off and welded on.  Every construct here carries the
shape language of its source faction while painted entirely in Ledger roles —
the Ledger repaints its prizes.  The SHAPE is the faction tell, not the colour.

Role assignments (applies to every construct in this file):
    ROLE_HULL   — the donor's own plate field (Ledger iron tone, dominant)
    ROLE_ARMOUR — mechanisms, straps, bosses, rib armour (secondary)
    ROLE_TRIM   — ivory edge margin (Gilded panel only) and thin rails
    ROLE_RECESS — seams, apertures, cut edges, window wells
    ROLE_ACCENT — not used in donors; accent is the Ledger's own tally mark

Public API:
    donor_veridian_head(parts, glow, name, loc, mat, glow_mat, size, detail)
        Captured Veridian Combine faceted instrument head.
    donor_ferrous_ribs(parts, glow, name, loc, mat, glow_mat, size, detail, n_ribs=6)
        Captured Ferrous Hegemony armour rib belt.
    donor_freehold_drum(parts, glow, name, loc, mat, glow_mat, size, detail)
        Captured Freehold Compact habitation/greenhouse drum.
    donor_gilded_panel(parts, glow, name, loc, mat, glow_mat, size, detail)
        Captured Gilded Chain overlapping scale panel.
    weld_strap(parts, name, loc, mat, size, bolts=6, detail=1)
        Bolted hold-down strap — apply to any donor part, at least two per part.
    cut_edge(parts, name, loc, mat, size, teeth=5, detail=1)
        Ragged torch-cut margin — what makes a donor read as severed,
        not fitted from new.

No hull queries: every function takes explicit absolute ship-space coordinates.
No imports from surface.py, hardware.py, or any sibling module.

Coordinate system: x = beam, y = height, z = length, NOSE AT -Z.
Rotations in radians.

SIZE CONVENTION (load-bearing):
    Every kit primitive receives the actual object size in each axis.  Derived
    sizes used in face-position arithmetic are the caller's full extents divided
    by 2 (half-extents); wherever that halving occurs the comment marks it.
    The absolute hardware constants below (_BOSS_H, _RIB_W, etc.) are object
    sizes, NOT hull fractions — a larger Ledger ship carries MORE of them,
    never bigger ones.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

import math


# ---------------------------------------------------------------------------
# Cylinder/torus orientation helpers
# ---------------------------------------------------------------------------
# Blender's cylinder and torus default axis is Blender Z (= ship Y).
# To align the long axis with ship Z pass this rotation to kit.cyl / kit.torus.
_CYL_ALONG_Z = (math.pi / 2.0, 0.0, 0.0)


# ---------------------------------------------------------------------------
# Human-scale absolute constants — sizes passed to kit calls.
# Physical scale: 1 world unit ≈ 3.64 m  (P = 6.6 u = 24 m).
# These are NEVER scaled by hull l / b / h.
# ---------------------------------------------------------------------------

# Veridian instrument head geometry
_BOSS_R      = 0.05   # mounting boss cylinder radius             ≈ 18 cm diam
_BOSS_H      = 0.20   # mounting boss full height; centred on     ≈ 73 cm boss
                       #   the nose face so half protrudes forward
                       #   and half is buried in the block (≥ 0.10 overlap) ✓
_BOSS_FRAC   = 0.50   # boss XY offset as fraction of block half-size
_APERTURE_R  = 0.12   # Veridian sensor aperture radius           ≈ 87 cm diam
_BEZEL_MAJOR = 0.17   # bezel torus major radius (aperture + lip) ≈ 62 cm
_BEZEL_MINOR = 0.04   # bezel torus minor cross-section radius    ≈ 29 cm tube
_BEZEL_D     = 0.08   # aperture recess full depth                ≈ 29 cm

# Ferrous armour rib geometry
_RIB_W       = 0.09   # Ferrous rib full thickness in Z           ≈ 33 cm per rib
_BACK_FRAC   = 0.30   # fraction of block full height that is the backing strap

# Weld strap and cut edge (human scale; never hull-scaled)
_BOLT_SIDE   = 0.05   # bolt head cube full side                  ≈ 18 cm
_TOOTH_W     = 0.06   # cut-edge tooth full width in X            ≈ 22 cm
_TOOTH_D_LO  = 0.04   # shallow cut tooth full depth in Z         ≈ 15 cm
_TOOTH_D_HI  = 0.10   # deep cut tooth full depth in Z            ≈ 36 cm

# Freehold habitation drum windows
_WIN_W       = 0.10   # drum window full width (tangential dim)   ≈ 36 cm
_WIN_H       = 0.06   # drum window full height (axial dim in Z)  ≈ 22 cm
_WIN_D       = 0.04   # drum window full recess depth (radial)    ≈ 15 cm

# Gilded Chain scale panel geometry
_SCALE_OVL_F = 0.25   # fraction of scale pitch that overlaps the next scale
_SCALE_T     = 0.05   # scale tile full thickness above backing   ≈ 18 cm
_EDGE_W      = 0.04   # ivory edge strip full width               ≈ 15 cm
_EDGE_T      = 0.04   # ivory edge strip full thickness           ≈ 15 cm


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------
def _glow_box(glow, name, loc, size, glow_mat):
    """Emissive box appended to *glow*; skin_role forced to 'glow'."""
    obj = kit.box(glow, name, kit.ROLE_TRIM, loc, size, glow_mat)
    obj['skin_role'] = 'glow'
    return obj


# ===========================================================================
# 1.  WELD STRAP
# ===========================================================================
def weld_strap(parts, name, loc, mat, size, bolts=6, detail=1):
    """Bolted hold-down strap securing a captured donor part to the Ledger hull.

    A flat ROLE_ARMOUR bar with a countable bolt row.  The strap bridges the
    gap between the donor body and the Ledger hull, with both Z-ends buried
    inside their respective bodies to satisfy probe-ship-islands connectivity:

        probe-ship-islands: 0.06-voxel grid, one 26-connected component required.
        Each Z-end (loc.z ± sz*0.5) must overlap its target body by >= 0.10 units.
        Caller is responsible for this placement; it cannot be checked here.

    Every donor part requires at least two weld_straps.  Straps run perpendicular
    to the donor's long axis and are spaced no more than half the donor length apart.

    loc    -- absolute ship-space centre of the strap
    size   -- (sx, sy, sz): full extents.
              sx = strap full width in X.
              sy = strap full thickness in Y (keep thin: 0.06–0.12 suggested).
              sz = strap full length in Z; must span from inside the donor body
                   to inside the hull body with >= 0.10 units overlap at each end.
    bolts  -- number of bolt heads along Z; automatically fewer at detail 2.
    detail:
        0 → nothing
        1 → strap body only (ROLE_ARMOUR)
        2+ → strap body + bolt row

    Usable on any donor part.
    """
    if detail < 1:
        return []

    lx, ly, lz = loc
    sx, sy, sz = size   # full extents of the strap bounding box
    objs = []

    # Strap body — flat ROLE_ARMOUR bar
    strap = kit.box(parts, name + '.body', kit.ROLE_ARMOUR, loc, size, mat)
    objs.append(strap)

    if detail < 2:
        return objs

    # Bolt row: centres on the strap's +Y face, evenly spaced along Z.
    # SIZE CONVENTION: sy is the full strap thickness; sy * 0.5 is the half-extent
    # giving the +Y face position.  _BOLT_SIDE * 0.5 is the half-bolt offset above.
    n     = max(2, bolts if detail >= 3 else max(2, bolts // 2))
    top_y = ly + sy * 0.5 + _BOLT_SIDE * 0.5   # bolt cube centre Y

    for i in range(n):
        # Z positions: n evenly spaced across the full strap length sz.
        # SIZE CONVENTION: sz * 0.5 = half-extent → face at lz ± sz*0.5.
        frac = i / max(n - 1, 1)
        bz   = lz - sz * 0.5 + frac * sz
        bolt = kit.box(parts, '%s.bolt.%02d' % (name, i), kit.ROLE_ARMOUR,
                       (lx, top_y, bz),
                       (_BOLT_SIDE, _BOLT_SIDE, _BOLT_SIDE), mat)
        objs.append(bolt)

    return objs


# ===========================================================================
# 2.  CUT EDGE
# ===========================================================================
def cut_edge(parts, name, loc, mat, size, teeth=5, detail=1):
    """Ragged torch-cut margin along one edge of a donor part — ROLE_RECESS.

    A row of small alternating-depth ROLE_RECESS blocks at the severed edge of
    a donor component.  This is what distinguishes a bolted-on captured part from
    new-build equipment: every cut_edge reads the violence of removal and identifies
    the piece as cut from its original ship, not manufactured for this hull.

    Without cut_edge a donor part looks like it was ordered from a catalogue.
    With it the part reads as taken.

    loc    -- absolute ship-space centre of the cut zone.  Place loc.z at the
              face of the donor body (the actual severed edge); teeth extend
              inward from there (in the +Z direction).
    size   -- (sx, sy, sz): full extents of the cut zone.
              sx = full width of the tooth row in X.
              sy = full tooth height in Y (match the donor face height).
              sz = the depth zone (ignored for individual tooth sizing; teeth use
                   absolute _TOOTH_D_LO / _TOOTH_D_HI constants so the cut reads
                   the same scale regardless of hull size).
    teeth  -- number of teeth; alternating shallow / deep.
    detail:
        0 → nothing
        1 → half the tooth count (max(2, ceil(teeth/2))), alternating depths
        2+ → full tooth count

    Usable on any donor part.  Apply at each severed Z-end of the donor body.
    Connectivity: each tooth overlaps the donor body by its full depth (_TOOTH_D_HI
    up to 0.10 units), so no island is introduced.
    """
    if detail < 1:
        return []

    lx, ly, lz = loc
    sx, sy, sz = size   # full extents of the cut zone
    objs = []

    n     = max(2, teeth if detail >= 2 else max(2, (teeth + 1) // 2))
    # SIZE CONVENTION: sx is full width; sx * 0.5 is the face half-extent.
    pitch = sx / n   # X spacing per tooth across the full row width

    for i in range(n):
        tx = lx - sx * 0.5 + (i + 0.5) * pitch   # tooth centre X

        # Alternate shallow / deep cuts: ragged torch-cut appearance.
        # SIZE CONVENTION: _TOOTH_D_LO / _HI are full depths; halved for centre offset.
        td      = _TOOTH_D_LO if i % 2 == 0 else _TOOTH_D_HI
        tooth_z = lz + td * 0.5   # spans [lz, lz + td] — bites into the donor body
        tooth   = kit.box(parts, '%s.tooth.%02d' % (name, i), kit.ROLE_RECESS,
                          (tx, ly, tooth_z),
                          (_TOOTH_W, sy, td), mat)
        objs.append(tooth)

    return objs


# ===========================================================================
# 3.  DONOR — VERIDIAN COMBINE INSTRUMENT HEAD
# ===========================================================================
def donor_veridian_head(parts, glow, name, loc, mat, glow_mat, size, detail):
    """Captured Veridian Combine instrument head (Bible §4.1).

    Veridian Combine shape tell (§G6, closed-shell machined):
        A hard chamfer_block body with no surface pipes, large flush plates, a
        sunk circular sensor aperture, a raised bezel ring, and corner mounting
        bosses.  The aperture geometry and the chamfered block profile are
        unmistakably Veridian even after Ledger repainting: the Combine machines
        instruments; the Ledger welds scrap.  These two construction logics cannot
        be confused.

    Facing: sensor aperture on -Z (nose-facing).  Intended to mount nose-forward
    on a Ledger bow or dorsal flat as a sensor the Ledger did not manufacture.

    Anchor: loc is the instrument head centre in absolute ship space.  The -Z
    face of the block must overlap the host hull body by >= 0.10 units, OR the
    caller supplies weld_strap (x2) whose ends sit >= 0.10 units inside both the
    instrument block and the Ledger hull body.

    Connectivity: probe-ship-islands requires one 26-connected component at
    0.06-voxel resolution.  The >= 0.10 unit overlap satisfies this gate.

    Requires: weld_strap (x2).

    Detail:
        0 → nothing
        1 → chamfer_block body only (ROLE_HULL)
        2 → body + sunk aperture (ROLE_RECESS) + bezel torus (ROLE_ARMOUR)
              + sensor glow inside the aperture
        3 → detail 2 + four mounting bosses at the nose face corners (ROLE_ARMOUR)
    """
    if detail < 1:
        return []

    lx, ly, lz = loc
    sx, sy, sz = size   # full extents of the instrument block
    objs = []

    # Primary mass: chamfer_block — Veridian's closed-shell machined form.
    # ROLE_HULL because the Ledger repaints everything it takes.
    body = kit.chamfer_block(parts, name + '.body', kit.ROLE_HULL,
                             loc, size, mat, chamfer=0.14)
    objs.append(body)

    if detail < 2:
        return objs

    # -Z (nose) face of the block.
    # SIZE CONVENTION: sz is the full block length; sz * 0.5 is the half-extent,
    # giving the distance from centre to the -Z face.
    nose_z = lz - sz * 0.5

    # Sunk circular sensor aperture on the nose face — ROLE_RECESS.
    # Cylinder axis along ship Z: rotation = _CYL_ALONG_Z.
    # Centre offset so cylinder spans [nose_z - _BEZEL_D, nose_z].
    # SIZE CONVENTION: _BEZEL_D * 0.5 is the half-depth for the centre position.
    aper = kit.cyl(parts, name + '.aperture', kit.ROLE_RECESS,
                   (lx, ly, nose_z - _BEZEL_D * 0.5),
                   _APERTURE_R, _BEZEL_D, mat,
                   rotation=_CYL_ALONG_Z)
    objs.append(aper)

    # Bezel ring flush with the nose face, encircling the aperture.
    # _BEZEL_MAJOR > _APERTURE_R so the ring sits outside the recess bore.
    bezel = kit.torus(parts, name + '.bezel', kit.ROLE_ARMOUR,
                      (lx, ly, nose_z),
                      _BEZEL_MAJOR, _BEZEL_MINOR, mat,
                      rotation=_CYL_ALONG_Z)
    objs.append(bezel)

    # Emissive glow inside the aperture (Ledger glow_mat — Ledger repainted it).
    # SIZE CONVENTION: _APERTURE_R * 0.70 shrinks the glow disc to fit inside
    # the aperture bore (_APERTURE_R * 0.70 < _APERTURE_R, no extra halving).
    gw = _glow_box(glow, name + '.glow',
                   (lx, ly, nose_z - _BEZEL_D * 0.65),
                   (_APERTURE_R * 0.70, _APERTURE_R * 0.70, _WIN_D),
                   glow_mat)
    objs.append(gw)

    if detail < 3:
        return objs

    # Four mounting bosses at the ±X / ±Y corners of the nose face.
    # Each boss is centred ON the nose face so it protrudes _BOSS_H * 0.5 forward
    # AND is buried _BOSS_H * 0.5 into the block — burial = 0.10 units >= 0.10 ✓.
    # _BOSS_FRAC sets offset as a fraction of the block's X / Y half-sizes.
    # SIZE CONVENTION: sx * 0.5 and sy * 0.5 are the block X / Y half-extents;
    # multiplied by _BOSS_FRAC gives the boss XY offset from centre.
    for bi, (xs, ys) in enumerate([(-1, -1), (1, -1), (1, 1), (-1, 1)]):
        bx = lx + xs * sx * 0.5 * _BOSS_FRAC
        by = ly + ys * sy * 0.5 * _BOSS_FRAC
        boss = kit.cyl(parts, '%s.boss.%d' % (name, bi), kit.ROLE_ARMOUR,
                       (bx, by, nose_z),
                       _BOSS_R, _BOSS_H, mat,
                       rotation=_CYL_ALONG_Z)
        objs.append(boss)

    return objs


# ===========================================================================
# 4.  DONOR — FERROUS HEGEMONY ARMOUR RIB BELT
# ===========================================================================
def donor_ferrous_ribs(parts, glow, name, loc, mat, glow_mat, size, detail,
                       n_ribs=6):
    """Captured Ferrous Hegemony armour rib belt (Bible §4.2).

    Ferrous Hegemony shape tell (§G6, repeated module / armoured):
        20-40 armour ribs at even pitch on a backing strap.  The Hegemony's
        construction logic is formal repetition — every element is identical,
        aligned, and paired.  A row of evenly-spaced standing ribs is instantly
        recognisable as Ferrous hardware even stripped of the grey iron paint.

    The rib belt is cut off at both ends so the severed backing plate is visible
    (apply cut_edge at the -Z and +Z ends of the assembly after placement).

    Facing: ribs stand proud in +Y; the backing strap's -Y face is placed
    against or inside the Ledger hull.

    Anchor: loc is the assembly centre in absolute ship space.  The backing
    strap's -Y face must overlap the host hull body by >= 0.10 units.
    SIZE CONVENTION: sy * 0.5 gives the Y half-extent; backing bottom is at
    ly - sy * 0.5.  Caller buries this inside the hull by >= 0.10 units.

    Connectivity: probe-ship-islands requires one 26-connected component at
    0.06-voxel resolution.  The backing strap's -Y face buried in the hull
    satisfies this gate; weld_straps (x2) add redundant connectivity.

    Requires: weld_strap (x2), cut_edge (x2 at ±Z ends).

    n_ribs: number of armour ribs (4–8); gated by detail level.
    glow / glow_mat: accepted for API uniformity; not used internally.

    Detail:
        0 → nothing
        1 → backing strap only (ROLE_HULL)
        2 → backing + reduced rib count (max(4, n_ribs - 2))
        3 → backing + full n_ribs rib count
    """
    if detail < 1:
        return []

    lx, ly, lz = loc
    sx, sy, sz = size   # full extents of the rib-belt bounding box
    objs = []

    # Backing strap occupies the lower _BACK_FRAC of the full height.
    # SIZE CONVENTION: sy is full height; sy * _BACK_FRAC is backing full height,
    # sy * _BACK_FRAC * 0.5 is its Y half-extent for face / centre arithmetic.
    back_h  = sy * _BACK_FRAC         # backing strap full height
    # Bottom of the bounding box: ly - sy * 0.5.
    # Backing centre Y: bottom + back_h * 0.5.
    back_cy = (ly - sy * 0.5) + back_h * 0.5

    backing = kit.box(parts, name + '.backing', kit.ROLE_HULL,
                      (lx, back_cy, lz),
                      (sx, back_h, sz), mat)
    objs.append(backing)

    if detail < 2:
        return objs

    # Armour ribs: stand proud from the backing's +Y face in the +Y direction.
    # Rib full height = sy - back_h (remaining height above the backing).
    # SIZE CONVENTION: rib_h is the full rib height; rib_h * 0.5 is the half-extent.
    rib_h   = sy - back_h              # full rib height (proud portion)
    rib_h   = max(rib_h, 0.10)         # guard against degenerate size
    # Backing +Y face: back_cy + back_h * 0.5.
    # Rib base is at the backing +Y face; rib centre is one rib_h * 0.5 above.
    rib_cy  = (back_cy + back_h * 0.5) + rib_h * 0.5

    n_actual = n_ribs if detail >= 3 else max(4, n_ribs - 2)
    n_actual = max(1, n_actual)

    # Distribute n_actual ribs evenly across the full Z length sz.
    # SIZE CONVENTION: sz is full length; sz * 0.5 is half-extent = end offset.
    for i in range(n_actual):
        frac = (i + 0.5) / n_actual
        rz   = lz - sz * 0.5 + frac * sz
        # _RIB_W is the absolute rib thickness (full width in Z).
        rib  = kit.box(parts, '%s.rib.%02d' % (name, i), kit.ROLE_ARMOUR,
                       (lx, rib_cy, rz),
                       (sx, rib_h, _RIB_W), mat)
        objs.append(rib)

    return objs


# ===========================================================================
# 5.  DONOR — FREEHOLD COMPACT HABITATION DRUM
# ===========================================================================
def donor_freehold_drum(parts, glow, name, loc, mat, glow_mat, size, detail):
    """Captured Freehold Compact habitation or greenhouse drum (Bible §4.3).

    This was somebody's home.  A Freehold greenhouse can or crew habitation
    cylinder — warm-windowed, community-built, loved — cut from its ship and
    lashed onto a Ledger hull as cargo.  The Freehold builds warm lived-in
    spaces; the cylindrical form with a window band and a warm interior glow
    are unmistakably Compact hardware even after Ledger repainting.

    Freehold Compact shape tell (§G6, exposed frame):
        Cylinder body (not a box), visible window band around the equator,
        warm interior glow visible through the windows.  The cylinder itself
        is the foreign shape: the Ledger uses welded wedge and box forms;
        a smooth cylinder reads as taken.

    Facing: drum axis along ship Z; window band visible from abeam (+X / -X)
    and from above (+Y).

    Anchor: loc is the drum centre in absolute ship space.  The drum cylinder
    must overlap the host hull body by >= 0.10 units on its -Y face (the bottom
    of the cylinder should be buried inside the hull).  The retaining straps
    (weld_strap x2) provide redundant connectivity running from inside the drum
    to inside the hull.

    Connectivity: probe-ship-islands requires one 26-connected component at
    0.06-voxel resolution.  The >= 0.10 unit -Y face burial satisfies this gate.

    Requires: weld_strap (x2 along Z, perpendicular to the drum axis).

    Detail:
        0 → nothing
        1 → drum cylinder only (ROLE_HULL)
        2 → drum + 4 cardinal window recesses (ROLE_RECESS) with warm interior
              glow (glow_mat) at the equator
        3 → detail 2 + 4 additional windows at diagonal positions around the
              equator, for 8 windows total
    """
    if detail < 1:
        return []

    lx, ly, lz = loc
    sx, sy, sz = size   # full extents of the drum bounding box
    objs = []

    # Drum cylinder: radius from the smaller XY dimension, length along Z.
    # SIZE CONVENTION: sx and sy are full extents; * 0.5 gives the Y/X half-extents
    # (= radius of the cylinder that fits inside the bounding box).
    radius = min(sx, sy) * 0.5   # cylinder radius: half of the smaller cross dimension
    # sz is the full drum length along Z (passed directly as cylinder depth).
    drum = kit.cyl(parts, name + '.drum', kit.ROLE_HULL,
                   loc, radius, sz, mat,
                   rotation=_CYL_ALONG_Z)
    objs.append(drum)

    if detail < 2:
        return objs

    # Window band around the drum equator (Z = lz).
    # Four cardinal positions at detail 2; eight (adding diagonals) at detail 3.
    # Windows are ROLE_RECESS boxes sunk into the drum surface from outside inward.
    # Each window overlaps the drum cylinder by its recess depth (_WIN_D) so
    # no floating island is introduced.
    #
    # Window positions by face direction (dx, dy in XY plane):
    #   direction (0, +1)  → top face: window faces +Y
    #   direction (0, -1)  → bottom face: faces -Y
    #   direction (-1, 0)  → port face: faces -X
    #   direction (+1, 0)  → starboard face: faces +X
    #
    # Glow boxes inside each window use glow_mat — Ledger keeps its own glow colour.

    _sq2 = 1.0 / math.sqrt(2.0)
    cardinal_dirs = [(0.0, 1.0), (0.0, -1.0), (-1.0, 0.0), (1.0, 0.0)]
    diagonal_dirs = [( _sq2,  _sq2), (-_sq2,  _sq2),
                     ( _sq2, -_sq2), (-_sq2, -_sq2)]
    dirs = cardinal_dirs + (diagonal_dirs if detail >= 3 else [])

    for wi, (dx, dy) in enumerate(dirs):
        # SIZE CONVENTION: radius is already the half-extent (derived above from
        # sx * 0.5 / sy * 0.5).  Window centre sunk _WIN_D * 0.5 inward from
        # the cylinder surface so the box overlaps the cylinder.
        surf_x = lx + dx * radius
        surf_y = ly + dy * radius
        win_cx = lx + dx * (radius - _WIN_D * 0.5)
        win_cy = ly + dy * (radius - _WIN_D * 0.5)

        # Window box size: choose depth axis along the dominant radial direction.
        # For top/bottom (|dy| > |dx|): depth in Y, aperture in XZ.
        # For port/stbd (|dx| > |dy|): depth in X, aperture in YZ.
        # Diagonal windows use the top/bottom size for simplicity.
        if abs(dy) >= abs(dx):
            win_sx, win_sy, win_sz = _WIN_W, _WIN_D, _WIN_H
        else:
            win_sx, win_sy, win_sz = _WIN_D, _WIN_W, _WIN_H

        win = kit.box(parts, '%s.win.%02d' % (name, wi), kit.ROLE_RECESS,
                      (win_cx, win_cy, lz),
                      (win_sx, win_sy, win_sz), mat)
        objs.append(win)

        # Warm interior glow — sized slightly smaller than the window aperture.
        gw = _glow_box(glow, '%s.glow.%02d' % (name, wi),
                       (win_cx, win_cy, lz),
                       (win_sx * 0.75, win_sy * 0.60, win_sz * 0.75),
                       glow_mat)
        objs.append(gw)

    return objs


# ===========================================================================
# 6.  DONOR — GILDED CHAIN SCALE PANEL
# ===========================================================================
def donor_gilded_panel(parts, glow, name, loc, mat, glow_mat, size, detail):
    """Captured Gilded Chain overlapping scale panel (Bible §4.5).

    Gilded Chain shape tell (§G6, closed shell / ornament):
        Overlapping smooth lapped scale plates — like black ceramic fish-scales —
        with a thin ivory structural edge margin.  The Chain's scales are sleek
        and flawlessly smooth; the Ledger's own surface is scarred weld-bead iron.
        The contrast is the tell.

    The Ledger repaints the scales in its own ROLE_HULL iron tone; only the ivory
    edge margin retains ROLE_TRIM (the Chain uses ivory structural edges — the
    Ledger keeps that distinction because it reads as foreign against its own flat-
    painted surfaces).  Scale plates carry NO surface pipes, NO weld seams, and
    NO tally marks.

    Facing: scale plates on the +Y face (top / outward face); scales lap from
    stern (+Z) toward nose (-Z) so each scale's forward edge is exposed.

    Anchor: loc is the panel centre in absolute ship space.  The -Y face of the
    backing must overlap the host hull body by >= 0.10 units.
    SIZE CONVENTION: sy * 0.5 gives the Y half-extent; backing -Y face is at
    ly - sy * 0.5.  Caller buries this inside the hull by >= 0.10 units.

    Connectivity: probe-ship-islands requires one 26-connected component at
    0.06-voxel resolution.  Backing -Y face buried in hull satisfies this gate;
    weld_straps (x2) add redundant connectivity at the panel ±Z ends.

    Requires: weld_strap (x2), cut_edge (x2 at panel ±Z ends).

    glow / glow_mat: at detail 3 a cold emissive strip runs along the stern
    edge of the scale layer — the Gilded Chain's "cold illuminated gallery"
    (§4.5), here assigned glow_mat (Ledger repainted it).

    Detail:
        0 → nothing
        1 → flat backing plate only (ROLE_HULL)
        2 → backing + overlapping scale tiles (ROLE_HULL, reduced count)
              + ivory edge strips (ROLE_TRIM)
        3 → detail 2 + full scale count + stern-edge glow strip
    """
    if detail < 1:
        return []

    lx, ly, lz = loc
    sx, sy, sz = size   # full extents of the panel bounding box
    objs = []

    # Backing plate: flat ROLE_HULL slab (Ledger-painted)
    backing = kit.box(parts, name + '.backing', kit.ROLE_HULL, loc, size, mat)
    objs.append(backing)

    if detail < 2:
        return objs

    # Overlapping scale tiles on the +Y face of the backing.
    # Tiles lap from +Z toward -Z: each tile's -Z (forward) edge is exposed.
    # _SCALE_OVL_F = fraction of tile pitch that overlaps the next tile.
    n_scales = 6 if detail >= 3 else 3
    n_scales = max(1, n_scales)

    # SIZE CONVENTION: sz is full panel length; sz / n_scales = tile pitch (full).
    pitch    = sz / n_scales
    tile_sz  = pitch * (1.0 + _SCALE_OVL_F)   # tile Z length = pitch + overlap

    # Tile +Y face aligns with the backing +Y face (ly + sy * 0.5), then the
    # tile stands _SCALE_T proud above it.
    # SIZE CONVENTION: sy * 0.5 is the backing Y half-extent (face position);
    # _SCALE_T * 0.5 is the tile half-thickness for centre offset.
    tile_cy = (ly + sy * 0.5) + _SCALE_T * 0.5

    for i in range(n_scales):
        # Tile Z centre: tiles start at -Z end and progress toward +Z.
        # Each tile's -Z (nose) edge is at lz - sz*0.5 + i * pitch.
        tile_z = (lz - sz * 0.5 + i * pitch) + tile_sz * 0.5
        # SIZE CONVENTION: sx * 0.92 leaves a small gap at port/stbd so the
        # ivory edge margin reads distinct from the scale face.
        tile = kit.box(parts, '%s.scale.%02d' % (name, i), kit.ROLE_HULL,
                       (lx, tile_cy, tile_z),
                       (sx * 0.92, _SCALE_T, tile_sz), mat,
                       bevel=0.02)
        objs.append(tile)

    # Ivory edge margin — ROLE_TRIM — around the perimeter of the scale face.
    # This is the only ROLE_TRIM use in this module: the Chain's structural edge
    # language is the shape tell, kept even after repainting.
    edge_cy = tile_cy   # same Y level as scale tile centres

    # Port and starboard long strips (running along Z)
    for xs, sfx in [(-1, 'port'), (1, 'stbd')]:
        # SIZE CONVENTION: sx * 0.5 is the X half-extent of the panel.
        # Edge strip inset: (sx * 0.5 - _EDGE_W * 0.5) from centre = near outer edge.
        ex = lx + xs * (sx * 0.5 - _EDGE_W * 0.5)
        strip = kit.box(parts, '%s.edge.%s' % (name, sfx), kit.ROLE_TRIM,
                        (ex, edge_cy, lz),
                        (_EDGE_W, _EDGE_T, sz), mat)
        objs.append(strip)

    # Nose (-Z) and stern (+Z) short strips (running along X)
    for zs, sfx in [(-1, 'nose'), (1, 'stern')]:
        # SIZE CONVENTION: sz * 0.5 is the Z half-extent of the panel.
        ez = lz + zs * (sz * 0.5 - _EDGE_W * 0.5)
        strip = kit.box(parts, '%s.edge.%s' % (name, sfx), kit.ROLE_TRIM,
                        (lx, edge_cy, ez),
                        (sx, _EDGE_T, _EDGE_W), mat)
        objs.append(strip)

    if detail < 3:
        return objs

    # Stern-edge glow strip: cold gallery light (Gilded Chain §4.5, "cold
    # illuminated gallery running deep inside").  Here glow_mat because the
    # Ledger repaints its prizes — but the strip's position on the stern
    # scale edge reads as Chain hardware regardless of colour.
    # SIZE CONVENTION: _EDGE_W * 0.5 is the half-width for centre placement.
    stern_gz = lz + sz * 0.5 - _EDGE_W * 0.5
    gstrip = _glow_box(glow, name + '.gallery',
                       (lx, edge_cy, stern_gz),
                       (sx * 0.80, _EDGE_T * 0.70, _EDGE_W),
                       glow_mat)
    objs.append(gstrip)

    return objs
