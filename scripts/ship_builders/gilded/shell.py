"""Gilded Chain shell surface language — the faction's ORDERED SKIN.

Charter served (bible 4.5, synthesis/21 G6: CLOSED SHELL, ORNAMENT):
    one continuous curve; edge-only precious trim; long thin light lines.
The Chain is the opposite of the Red Ledger on every axis. There is NO plate
quilt, NO role jitter, NO colour variation, NO dirt. Every construct here is
one ordered run: uniform pitch, uniform size within the run, ONE role.

    scale_course   — one fair fore-and-aft course of overlapping near-black
                     ceramic scales on a flank (the dorsal shell read).
    scale_field    — the dorsal shell: parallel scale courses across the deck,
                     following the sheer.
    ivory_margin   — the big forward-flank IVORY two-tone region: LONG fair
                     armour plates, one continuous run, never scale-sized.
    gold_line      — a hairline old-gold articulation line; a strut chain,
                     never a face.
    collar_band    — a gold collar ring around the hull; ribs on the FLAT
                     faces only, never on the chamfered corners.
    gallery_slot   — the faction signature: cold turquoise light seen DEEP
                     inside a long gallery recessed into the flank, hooded by
                     a rim that never stands further outboard than 0.07.
    aperture_seam  — a weapon/transfer aperture reading as a CLOSED hairline
                     flush with the shell; threats hidden until used.
    edge_keel      — a thin ivory leading-edge blade along the keel.

SIZE CONVENTION (verified against the ship_kit.py source, which is the
authority — its docstrings say "full extents", and kit-internal users such as
rail(), greeble_field() and panel_lines() only compute correctly under it;
the wave-contract note that kit.box takes half extents does NOT match the
shipped kit):
    kit.box / kit.plate_grid / kit.panel_lines / kit.greeble_field
        -> size is FULL ship-space extents.
    kit.chamfer_block / kit.taper_block / kit.wedge
        -> size is FULL ship-space extents.
    kit.cyl / kit.torus / kit.strut
        -> real radius / real depth.
Where a full figure is halved or doubled at a call site a comment says so.

HUMAN MODULE: every repeated element is an ABSOLUTE world-unit size from
surface.py (SCALE_LAP / SCALE_PROUD / SCALE_BURY / GALLERY_PANE /
PANE_SPACING). A bigger Chain ship carries MORE scales and panes, never
bigger ones. Nothing here is multiplied by l, b or h.

CONNECTIVITY RULE (probe-ship-islands gate, 0.06 voxels, one 26-connected
component): every run element re-samples its `surf` callable at its OWN
station and is SKIPPED when `surf` returns 0.0, so runs self-trim at a taper
instead of floating. Every seated element is buried at least sf.SCALE_BURY
(0.12) of solid material into the hull and stands sf.SCALE_PROUD (0.035)
proud. No emitted element is thinner than 0.07 in every axis except gold
hairlines (strut radius 0.022), which are decorative chains whose endpoints
the CALLER buries 0.10 into the hull — a hairline is sub-voxel and rides a
connected body.

DETAIL LADDER (3 = lod0 full ... 0 = coarsest):
    3  full pitch, all courses, all panes, arched slot ends
    2  roughly half the repeated elements (doubled pitch), arches kept
    1  primary form only: a course becomes a few long plates, a gallery
       keeps the well and lip frame and drops most panes and the arches
    0  nothing but what the mass needs to read; purely ornamental runs
       (scale courses, gold lines beyond a chord, keel blades) emit nothing
       or a single chord
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf


# ---------------------------------------------------------------------------
# Internal Chain constants — ABSOLUTE world units, never scaled by ship size.
# ---------------------------------------------------------------------------
_SCALE_PITCH   = 0.46   # fore-aft pitch of one ceramic scale (~1.7 m)
_WELL_PITCH    = 0.60   # z-length of one gallery wall segment at detail 3
_MARGIN_PITCH  = 1.80   # z-length of one ivory margin plate — LONG, not scale-sized
_MARGIN_LAP    = 0.10   # fore-aft overlap of one ivory plate over the next
_MARGIN_PROUD  = 0.02   # ivory sits nearly flush — a tonal split, not a ridge
_KEEL_PITCH    = 0.70   # z-length of one keel-blade segment at detail 3
_KEEL_PROUD    = 0.03   # how far the leading edge stands off the keel
_KEEL_BURY     = 0.10   # keel-blade burial into the hull (>= 0.10 gate)
_END_TRIM      = 0.06   # max seeded trim of a course's end plate
_SCALE_STEP    = 0.022  # per-scale outboard step inside a course (~0.08 m).
                        # Without it a course is a single flat shelf: every
                        # scale sits at the same offset, so the fore-aft laps
                        # and the lateral course joints are COPLANAR and the
                        # render shows a smooth black hull with no shell at
                        # all. Stepping the offset in a short cycle is the
                        # kit.plate_course "catching light" trick and costs no
                        # extra geometry.
_SCALE_CYCLE   = 3      # scales per step cycle, fore-aft and across courses
_SEAM_WIDTH    = 0.18   # full in-plane width of a closed aperture seam
_SEAM_SLIDE    = 0.16   # full lip travel at open = 1.0
_LIP_THICK     = 0.07   # gallery mouth lip thickness (probe-visible)


def _glow_box(glow, name, loc, size, glow_mat, role='glow'):
    """Emissive box appended to *glow*; skin_role forced to 'glow'.

    size is FULL extents per the module SIZE CONVENTION.
    """
    obj = kit.box(glow, name, kit.ROLE_TRIM, loc, size, glow_mat)
    obj['skin_role'] = role
    return obj


def _run_count(n0, detail, floor=1):
    """Count a repeated run down with detail; 0 is handled by the callers."""
    if detail >= 3:
        return n0
    if detail == 2:
        return max(1, n0 // 2)
    return max(floor, n0 // 4)


def _trim_last(rand, i, n, flen):
    """Return (full_z_length, dz_offset) for element i of n.

    The ONLY seeded micro-variation in the module: the last plate of a course
    is shortened by up to _END_TRIM so the course finishes fair instead of
    overshooting z1. Never used for role or colour jitter.
    """
    if i == n - 1 and n > 1:
        trim = rand() * _END_TRIM
        return flen - trim, -trim * 0.5
    return flen, 0.0


# ===========================================================================
# 1.  SCALE COURSE — one ordered course of overlapping ceramic scales
# ===========================================================================
def scale_course(parts, name, mat, z0, z1, y, height, surf, side=1.0, detail=3,
                 lap=None, proud=None, role=None, count=None, taper=1.0, seed=1):
    """One long fair COURSE of overlapping ceramic scales on a flank.

    Charter: the dorsal shell is small OVERLAPPING CERAMIC SCALES in long
    fair fore-and-aft courses, near-black, ONE role per course. Order is what
    separates this from a patchwork quilt: uniform pitch, uniform size, no
    per-plate jitter.

    Anchor: runs fore-and-aft from z0 to z1 (z0 toward the nose) at course
    centre height y. `surf(z)` returns the half-beam at that station and
    height (build it with sf.surf_flank); every scale re-samples at its OWN
    station and is skipped when `surf` returns 0.0. `side` +1.0 starboard /
    -1.0 port. `taper` scales scale height linearly toward z1 (1.0 = none).

    Sizes (kit.box takes FULL extents per the module SIZE CONVENTION): each
    scale is (proud + bury) thick normal to the flank, `height` tall, and
    pitch + `lap` long, so each scale laps the one behind it by `lap`
    (default sf.SCALE_LAP) and is buried sf.SCALE_BURY into the hull while
    standing `proud` (default sf.SCALE_PROUD) off it.

    Detail:
        0 → nothing (the loft carries the mass)
        1 → a few long plates (quarter count)
        2 → half count (doubled pitch, same lap)
        3 → full course at absolute _SCALE_PITCH
    """
    if detail < 1:
        return []
    span = z1 - z0
    if span <= 0.0 or height <= 0.0:
        return []
    if lap is None:
        lap = sf.SCALE_LAP
    if proud is None:
        proud = sf.SCALE_PROUD
    if role is None:
        role = kit.ROLE_HULL
    bury = sf.SCALE_BURY
    thick = proud + bury                 # full normal extent: 0.155, probe-visible
    n0 = count if count else max(1, int(round(span / _SCALE_PITCH)))
    n = _run_count(n0, detail, floor=2)
    pitch = span / n
    flen = pitch + lap                   # full z footprint: laps the scale behind
    rand = kit.rng(seed)
    objs = []
    for i in range(n):
        cz = z0 + (i + 0.5) * pitch
        sx = surf(cz)
        if sx == 0.0:
            continue                     # hull has fallen away — self-trim
        f = 1.0 + (taper - 1.0) * ((cz - z0) / span)
        plen, dz = _trim_last(rand, i, n, flen)
        cz += dz
        # Outboard step in a short cycle so each lap edge catches light. The
        # burial is measured from the surface, so a stepped scale is buried
        # `bury` and proud `proud + step` — connectivity is unaffected.
        step = _SCALE_STEP * (i % _SCALE_CYCLE)
        cx = side * (sx + (proud + step - bury) * 0.5)
        objs.append(kit.box(parts, '%s.s%02d' % (name, i), role,
                            (cx, y, cz),
                            (thick + step, height * f, plen), mat))
    return objs


# ===========================================================================
# 2.  SCALE FIELD — the dorsal shell, courses laid across the deck
# ===========================================================================
def scale_field(parts, name, mat, z0, z1, surf_y, surf_half, courses, detail=3,
                lap=None, proud=None, role=None, seed=1):
    """The dorsal shell: `courses` parallel scale courses across the deck.

    Charter: one continuous shell of overlapping near-black scales following
    the sheer. Courses run fore-and-aft, side by side between -surf_half(z)
    and +surf_half(z), each scale seated on surf_y(z) (build the pair with
    sf.surf_top and sf.surf_flat).

    Course centres are distributed over the WIDEST sampled half-width of the
    run; at any station where the deck has tapered narrower, the edge scales
    are skipped — the field self-trims to the sheer instead of floating.
    Courses touch laterally (no gap): the shell is one continuous skin.

    Sizes (kit.box FULL extents): each scale is course-width across,
    (proud + bury) tall, pitch + `lap` long. Buried sf.SCALE_BURY into the
    deck, standing sf.SCALE_PROUD off it.

    Detail:
        0 → nothing (the loft carries the mass)
        1 → half the courses, quarter lengthwise count
        2 → all courses, half lengthwise count
        3 → all courses at absolute _SCALE_PITCH
    """
    if detail < 1:
        return []
    span = z1 - z0
    if span <= 0.0 or courses < 1:
        return []
    if lap is None:
        lap = sf.SCALE_LAP
    if proud is None:
        proud = sf.SCALE_PROUD
    if role is None:
        role = kit.ROLE_HULL
    bury = sf.SCALE_BURY
    thick = proud + bury
    half0 = 0.0
    for k in range(5):                   # widest sampled half-width along the run
        half0 = max(half0, surf_half(z0 + span * k * 0.25))
    if half0 <= 0.0:
        return []
    c_eff = courses if detail >= 2 else max(1, courses // 2)
    cw = (2.0 * half0) / c_eff           # full course width; courses touch
    n0 = max(1, int(round(span / _SCALE_PITCH)))
    n = _run_count(n0, detail, floor=2)
    pitch = span / n
    flen = pitch + lap
    objs = []
    for c in range(c_eff):
        xc = -half0 + (c + 0.5) * cw
        rand = kit.rng(seed + c)
        for i in range(n):
            cz = z0 + (i + 0.5) * pitch
            if abs(xc) + cw * 0.5 > surf_half(cz):
                continue                 # deck narrower here — self-trim
            sy = surf_y(cz)
            if sy == 0.0:
                continue
            plen, dz = _trim_last(rand, i, n, flen)
            # Step outward on a cycle that advances BOTH fore-aft and across
            # courses, so the lap edges and the strake joints both catch
            # light instead of forming one flat deck shelf.
            step = _SCALE_STEP * ((i + c) % _SCALE_CYCLE)
            cy = sy + (proud + step - bury) * 0.5
            objs.append(kit.box(parts, '%s.c%02d_%02d' % (name, c, i), role,
                                (xc, cy, cz + dz), (cw, thick + step, plen), mat))
    return objs


# ===========================================================================
# 3.  IVORY MARGIN — the big forward-flank two-tone region
# ===========================================================================
def ivory_margin(parts, name, mat, z0, z1, y, height, surf, side=1.0, detail=3,
                 rows=1, proud=None, taper=1.0):
    """The forward-flank ivory region: one continuous run of LONG fair plates.

    Charter: a large IVORY two-tone region on the forward flank, one
    continuous teardrop bounded by a hairline gold line — a big deliberate
    tonal split, NOT per-plate variation. The plates are therefore LONG
    (absolute _MARGIN_PITCH), never scale-sized, and uniformly
    kit.ROLE_ARMOUR.

    Anchor: identical to scale_course — `surf(z)` is the half-beam at the
    band centre height (sf.surf_flank), re-sampled per plate, skipped at 0.0.
    `rows` stacks plates vertically inside `height`; keep the band inside the
    flank's straight span (sf.straight_top / sf.straight_bottom) so every row
    stays on the vertical flank. `taper` scales plate height toward z1.

    Sizes (kit.box FULL extents): each plate is (proud + sf.SCALE_BURY)
    thick, height/rows tall, pitch + _MARGIN_LAP long. Ivory sits nearly
    flush: `proud` defaults to _MARGIN_PROUD (0.02) — a tonal split, not a
    ridge. Burial is still sf.SCALE_BURY (0.12 >= 0.10 gate).

    Detail:
        0 → nothing
        1 → one row, a third of the plates (very long plates)
        2 → all rows, half the plates
        3 → all rows at absolute _MARGIN_PITCH
    """
    if detail < 1:
        return []
    span = z1 - z0
    if span <= 0.0 or height <= 0.0 or rows < 1:
        return []
    if proud is None:
        proud = _MARGIN_PROUD
    bury = sf.SCALE_BURY
    thick = proud + bury
    n0 = max(1, int(round(span / _MARGIN_PITCH)))
    if detail >= 3:
        n = n0
    elif detail == 2:
        n = max(1, n0 // 2)
    else:
        n = max(1, n0 // 3)
    r_eff = rows if detail >= 2 else 1
    pitch = span / n
    flen = pitch + _MARGIN_LAP
    rowh = height / r_eff
    objs = []
    for r in range(r_eff):
        ry = y - height * 0.5 + (r + 0.5) * rowh
        for i in range(n):
            cz = z0 + (i + 0.5) * pitch
            sx = surf(cz)
            if sx == 0.0:
                continue
            f = 1.0 + (taper - 1.0) * ((cz - z0) / span)
            cx = side * (sx + (proud - bury) * 0.5)
            objs.append(kit.box(parts, '%s.m%02d_%02d' % (name, r, i),
                                kit.ROLE_ARMOUR,
                                (cx, ry, cz), (thick, rowh * f, flen), mat))
    return objs


# ===========================================================================
# 4.  GOLD LINE — hairline old-gold articulation
# ===========================================================================
def gold_line(parts, name, mat, path, thick=0.022, detail=3, role=None):
    """A hairline gold articulation line along `path`.

    Charter: gold only as HAIRLINES — edge lines, thin ribs, collar rings.
    `path` is a list of >= 2 ship-space (x, y, z) points; each consecutive
    pair becomes one kit.strut of radius `thick` (default 0.022 — a hairline,
    never a face), so consecutive segments share endpoints and the chain is
    one connected run.

    Connectivity: a 0.022-radius strut is sub-voxel to the island probe, so
    the line cannot register as its own component; the CALLER places the path
    so both ends bury >= 0.10 into the hull (or into a seated construct), and
    intermediate points ride the surface.

    Detail:
        0 → a single chord between the path ends (the line is never dropped)
        1 → every second point, always keeping both ends
        2+ → the full path
    """
    if role is None:
        role = kit.ROLE_ACCENT
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
    objs = []
    for i in range(len(pts) - 1):
        seg = kit.strut(parts, '%s.g%02d' % (name, i), role,
                        pts[i], pts[i + 1], mat, radius=thick, vertices=8)
        if seg is not None:
            objs.append(seg)
    return objs


# ===========================================================================
# 5.  COLLAR BAND — a gold collar ring around the hull
# ===========================================================================
def collar_band(parts, name, mat, ring, z, width=0.10, ribs=8, detail=3):
    """A gold collar ring around the hull at station z.

    Charter: collar rings around mid-hull mechanisms are one of the few
    sanctioned gold elements. `ring` is the (half_w, half_h, y_offset,
    chamfer) tuple from sf.collar_ring, already expanded to clear the hull;
    the band is one solid kit.chamfer_block (FULL extents: 2*half_w x
    2*half_h x width) whose rim stands proud of the loft all around, so it
    always intersects the hull.

    Ribs: `ribs` small RECESS bars are distributed across the four FLAT faces
    of the section, evenly INSIDE each face's straight span (half_w - chamfer
    for the top/bottom faces, half_h - chamfer for the side faces) — never by
    even angular sweep, which lands ribs on the chamfered corners where the
    loft has fallen away (the wave-6 floating-rib failure). Each rib spans
    the band width, buried 0.09 into the band — the band is solid and
    contains the hull section, so every rib is connected through it.

    Detail:
        0 → the band only (the ring is the mass read)
        1 → four ribs, one per flat face
        2 → half the ribs
        3 → all ribs
    """
    hw, hh, yo, ch = ring
    objs = []
    band = kit.chamfer_block(parts, name + '.band', kit.ROLE_ACCENT,
                             (0.0, yo, z), (hw * 2.0, hh * 2.0, width), mat,
                             chamfer=ch)
    objs.append(band)
    if detail >= 3:
        n_ribs = ribs
    elif detail == 2:
        n_ribs = ribs // 2
    elif detail == 1:
        n_ribs = min(4, ribs)
    else:
        n_ribs = 0
    if n_ribs < 1:
        return objs
    per = [n_ribs // 4 + (1 if f < n_ribs % 4 else 0) for f in range(4)]
    rib_h = 0.12                         # full normal extent: 0.09 buried + 0.03 proud
    rib_w = 0.05
    idx = 0
    for face in range(4):
        cnt = per[face]
        if cnt < 1:
            continue
        if face < 2:
            # top (face 0) / bottom (face 1) flat faces: straight span along X
            yface = yo + hh if face == 0 else yo - hh
            cy = yface - 0.03 if face == 0 else yface + 0.03
            flat = 2.0 * (hw - ch)
            for i in range(cnt):
                fx = -flat * 0.5 + flat * (i + 1.0) / (cnt + 1.0)
                objs.append(kit.box(parts, '%s.r%02d' % (name, idx),
                                    kit.ROLE_RECESS,
                                    (fx, cy, z), (rib_w, rib_h, width), mat))
                idx += 1
        else:
            # starboard (face 2) / port (face 3) flat faces: span along Y
            xface = hw if face == 2 else -hw
            cx = xface - 0.03 if face == 2 else xface + 0.03
            flat = 2.0 * (hh - ch)
            for i in range(cnt):
                fy = yo - flat * 0.5 + flat * (i + 1.0) / (cnt + 1.0)
                objs.append(kit.box(parts, '%s.r%02d' % (name, idx),
                                    kit.ROLE_RECESS,
                                    (cx, fy, z), (rib_h, rib_w, width), mat))
                idx += 1
    return objs


# ===========================================================================
# 6.  GALLERY SLOT — the faction signature: light deep inside the hull
# ===========================================================================
def gallery_slot(parts, glow, name, hull_mat, glow_mat, z0, z1, y, height, surf,
                 side=1.0, depth=0.22, detail=3, panes=None, arch=True):
    """A long gallery slot: turquoise light seen DEEP inside through a slot.
    Charter: cold turquoise light lives INSIDE long recessed galleries on the
    ventral/mid flank, seen through arch-topped slots — never a strip laid on
    the surface, and never an applied light box. The gallery is a RECESS in
    the hull: nothing here stands further outboard than min(depth, 0.07), so
    the slot can never set the ship's measured beam.

    Construction (the loft is a solid skin and no boolean is available, so
    the well is sunk INBOARD and only hooded). `depth` is the INBOARD depth
    of the well measured from the hull skin at that station — it is not an
    outboard protrusion:
      back wall — ROLE_RECESS, outer face FLUSH with the skin at side*sx,
        body sunk `depth` inboard (keep depth >= sf.SCALE_BURY so the burial
        gate is met; default 0.22). The dark surface the panes read against.
      hood / sill — ROLE_RECESS channel walls above and below the opening.
        Each extends depth + sf.SCALE_BURY inboard (deeply anchored) and
        protrudes outboard only min(depth, 0.07) for the hood and
        min(depth, 0.05) for the sill: the hood is prouder, so the mouth
        self-shadows from above and the channel reads as a recess in any
        lighting.
      lip — the bright ROLE_TRIM mouth rim, seated at the hood/sill
        protrusion plane; never the widest thing on the ship.
      panes — GALLERY_PANE emissives half-embedded in the back wall face:
        outer face ~0.025 outboard of the skin, at the bottom of the
        hood/sill channel (0.045 below the hood rim at the default depth).
        The >= 0.12 burial rule is carried by the wall body (sunk `depth`)
        plus the pane's 0.025 half-embed, not by outboard geometry.
      ends — with `arch`, rounded TRIM cylinders (radius height/2 + 0.04,
        axis depth depth + sf.SCALE_BURY + hood protrusion) whose outer face
        is exactly the hood plane, so the cap can never become the bulge;
        without it, square RECESS end posts at the same plane.

    Anchor: `surf(z)` is the half-beam at the slot centre height y
    (sf.surf_flank); every wall segment, hood/sill segment, pane and end cap
    re-samples at its OWN station and is skipped at 0.0.

    Panes: count derives from run length at absolute sf.PANE_SPACING unless
    `panes` overrides it (the override is the detail-3 count). Pane size is
    absolute sf.GALLERY_PANE, flank-swapped so the long axis runs along Z.
    Emissive stays a row of panes, never a continuous bar (the <= 5 % hull
    area emissive cap).

    Maximum outboard protrusion of the whole construct: min(depth, 0.07).

    Detail:
        0 → the back wall only: from distance the slot reads as a dark line
        1 → wall, hood, sill, lips and square ends; a quarter of the panes
        2 → half the panes, coarser wall segmentation, arches kept
        3 → full: all panes, 0.60 wall segments, arch-topped ends
    """
    span = z1 - z0
    if span <= 0.0 or height <= 0.0:
        return []
    bury = sf.SCALE_BURY
    hood_p = min(depth, 0.07)            # hood protrusion outboard of the skin
    sill_p = min(depth, 0.05)            # sill is shallower: mouth self-shadows
    chan_x = depth + bury                # inboard extent of hood/sill/end closures
    objs = []

    # ── Well segments: back wall + hood + sill + lips, per-station ───────
    seg_pitch = _WELL_PITCH if detail >= 3 else (_WELL_PITCH * 1.5 if detail == 2
                                                 else _WELL_PITCH * 2.0)
    n_seg = max(1, int(math.ceil(span / seg_pitch)))
    seg = span / n_seg + 0.04            # full z length; 0.04 overlap between segments
    chan_h = 0.10                        # hood/sill thickness in Y
    for i in range(n_seg):
        cz = z0 + (i + 0.5) * (span / n_seg)
        sx = surf(cz)
        if sx == 0.0:
            continue
        # back wall: dark face FLUSH with the skin, body sunk `depth` inboard
        bx = side * (sx - depth * 0.5)
        objs.append(kit.box(parts, '%s.w%02d' % (name, i), kit.ROLE_RECESS,
                            (bx, y, cz), (depth, height, seg), hull_mat))
        if detail < 1:                   # detail 0: bare dark strip, no frame
            continue
        # hood and sill: channel walls, deeply anchored, barely proud
        for pr, sy_sign, tag in ((hood_p, 1.0, 'h'), (sill_p, -1.0, 's')):
            cx2 = side * (sx + (pr - chan_x) * 0.5)
            objs.append(kit.box(parts, '%s.%s%02d' % (name, tag, i),
                                kit.ROLE_RECESS,
                                (cx2, y + sy_sign * (height * 0.5 + chan_h * 0.5), cz),
                                (pr + chan_x, chan_h, seg), hull_mat))
        # lip: the bright mouth rim, seated at the hood/sill protrusion plane
        for pr, sy_sign, tag in ((hood_p, 1.0, 'h'), (sill_p, -1.0, 's')):
            lx = side * (sx + pr - _LIP_THICK * 0.5)
            objs.append(kit.box(parts, '%s.l%s%02d' % (name, tag, i),
                                kit.ROLE_TRIM,
                                (lx, y + sy_sign * (height * 0.5 + 0.03), cz),
                                (_LIP_THICK, 0.06, seg), hull_mat))

    # ── Slot ends: arch caps or square posts, outer face at the hood plane ──
    if detail >= 1:
        end_x = hood_p + chan_x          # full x extent of an end closure
        for z_end, tag in ((z0, 'n'), (z1, 's')):
            sx = surf(z_end)
            if sx == 0.0:
                continue
            cxx = side * (sx + (hood_p - chan_x) * 0.5)
            if arch and detail >= 2:
                # arch-topped end: cylinder axis along X (beam), kit.cyl takes
                # real radius/depth; its outer face is exactly the hood plane
                objs.append(kit.cyl(parts, '%s.a%s' % (name, tag),
                                    kit.ROLE_TRIM,
                                    (cxx, y, z_end),
                                    height * 0.5 + 0.04, end_x,
                                    hull_mat, rotation=sf.CYL_ALONG_X,
                                    vertices=12))
            else:
                objs.append(kit.box(parts, '%s.e%s' % (name, tag),
                                    kit.ROLE_RECESS,
                                    (cxx, y, z_end),
                                    (end_x, height + 0.10, 0.08),
                                    hull_mat))

    # ── Panes: absolute GALLERY_PANE at PANE_SPACING on the back wall ────
    if detail >= 1:
        n0 = panes if panes else int(span / sf.PANE_SPACING)
        n = _run_count(max(0, n0), detail, floor=1)
        if n > 0:
            # flank-swap of sf.GALLERY_PANE: long axis along Z, thin axis X
            pz_len = sf.GALLERY_PANE[0]
            pz_h = sf.GALLERY_PANE[1]
            pz_t = sf.GALLERY_PANE[2]
            for i in range(n):
                pz = z0 + span * 0.5 + (i - (n - 1) * 0.5) * sf.PANE_SPACING
                sx = surf(pz)
                if sx == 0.0:
                    continue
                # half-embedded in the back wall face (0.025, the proven
                # window idiom): outer face ~0.025 outboard of the skin, at
                # the bottom of the hood/sill channel
                px = side * sx
                objs.append(_glow_box(glow, '%s.p%02d' % (name, i),
                                      (px, y, pz), (pz_t, pz_h, pz_len),
                                      glow_mat))
    return objs


# ===========================================================================
# 7.  APERTURE SEAM — a closed hairline, threats hidden until used
# ===========================================================================
def aperture_seam(parts, glow, name, hull_mat, glow_mat, loc, length, axis='z',
                  open=0.0, hull_mat_role=None, detail=3, glow_mat_role=None):
    """A weapon or transfer aperture reading as a CLOSED HAIRLINE flush with
    the shell.

    Charter: weapon and transfer apertures are closed hairline seams flush
    with the shell; threats stay hidden until used. With open = 0.0 the seam
    emits NO emissive object at all — just the dark recess strip and two
    flush lips touching at the centreline. open in (0, 1] slides the lips
    apart and reveals one thin turquoise line at the recess floor.

    Anchor: `loc` is the seam centre, precomputed by the caller from a
    surface query (sf.flank_anchor / sf.top_y / sf.bottom_y). The seam runs
    along `axis`:
        axis='z' — a fore-and-aft seam on a FLANK: thin axis is X, lips
                   slide in Y. The sink direction is toward the centreline,
                   inferred from the sign of loc.x.
        axis='x' — a FORE-AFT seam on DECK or KEEL: the length still runs
                   along Z, the seam width lies across X, the thin axis is
                   Y, and the lips retract along Z (fore/aft) to open. This
                   is the ventral payload-chamber behaviour a class file
                   depends on; the sink direction is inferred from the sign
                   of loc.y.

    Sizes (kit.box FULL extents): the recess strip is 0.14 thick (0.12 buried,
    outer face 0.02 outboard of `loc` — flush read, real connectivity); each
    lip is 0.16 thick (0.13 buried) with its outer face 0.01 proud of the
    strip face, so the hairline never z-fights the strip; the glow line is
    half-embedded in the strip face, its outer surface 0.005 proud of the
    strip and 0.005 below the lip plane, so an open seam reads as a lit slot.
    Each lip is half the seam width plus a 0.01 overlap, so the closed seam
    reads as one hairline.

    Detail:
        0 → the recess strip only (a bare dark hairline)
        1+ → strip and lips; the glow line appears whenever open > 0
    """
    if length <= 0.0:
        return []
    lip_role = hull_mat_role if hull_mat_role is not None else kit.ROLE_HULL
    glow_role = glow_mat_role if glow_mat_role is not None else 'glow'
    o = min(1.0, max(0.0, open))
    lx, ly, lz = loc
    objs = []
    lip_w = _SEAM_WIDTH * 0.5 + 0.01     # lips overlap 0.01 at the hairline
    off = lip_w * 0.5 - 0.005 + o * _SEAM_SLIDE * 0.5
    if axis == 'z':
        ns = 1.0 if lx >= 0.0 else -1.0   # sink toward the centreline
        seam_loc = (lx - ns * 0.05, ly, lz)
        seam_size = (0.14, _SEAM_WIDTH, length)
        # lip outer face 0.01 proud of the strip face (no coplanar shimmer),
        # burial 0.13 into the hull; glow half-embedded in the strip face,
        # 0.005 proud of the strip and 0.005 below the lip plane — the open
        # seam reads as a lit slot, not a painted stripe
        lip_locs = ((lx - ns * 0.05, ly - off, lz), (lx - ns * 0.05, ly + off, lz))
        lip_size = (0.16, lip_w, length)
        glow_size = (0.04, max(0.04, o * _SEAM_SLIDE * 0.8), length * 0.90)
        glow_loc = (lx + ns * 0.005, ly, lz)
    else:
        ns = 1.0 if ly >= 0.0 else -1.0
        seam_loc = (lx, ly - ns * 0.05, lz)
        seam_size = (_SEAM_WIDTH, 0.14, length)
        lip_locs = ((lx, ly - ns * 0.05, lz - off), (lx, ly - ns * 0.05, lz + off))
        lip_size = (lip_w, 0.16, length)
        glow_size = (max(0.04, o * _SEAM_SLIDE * 0.8), 0.04, length * 0.90)
        glow_loc = (lx, ly + ns * 0.005, lz)
    objs.append(kit.box(parts, name + '.seam', kit.ROLE_RECESS,
                        seam_loc, seam_size, hull_mat))
    if detail >= 1:
        for i, lloc in enumerate(lip_locs):
            objs.append(kit.box(parts, '%s.lip%d' % (name, i), lip_role,
                                lloc, lip_size, hull_mat))
        if o > 0.0:
            objs.append(_glow_box(glow, name + '.line', glow_loc, glow_size,
                                  glow_mat, role=glow_role))
    return objs


# ===========================================================================
# 8.  EDGE KEEL — thin ivory leading-edge blade
# ===========================================================================
def edge_keel(parts, name, mat, z0, z1, surf_bottom, half_w=0.05, detail=3,
              role=None):
    """A thin ivory/gold leading-edge blade along the keel, z0 to z1.

    Charter: ivory structural edges — the blade is the faired leading edge of
    the leaf silhouette, a shallow narrow run on the keel, not an add-on.

    Anchor: `surf_bottom(z)` returns the keel height at that station
    (sf.surf_bottom); every segment re-samples at its OWN station and is
    skipped at 0.0, so the run self-trims past the bow and stern tapers.

    Sizes (kit.box FULL extents): the blade is 2 * `half_w` wide (the
    parameter is a HALF width; doubled at the call site), _KEEL_PROUD +
    _KEEL_BURY tall, segmented along Z. Each segment is buried 0.10 into the
    hull and stands 0.03 proud of the keel.

    Detail:
        0 → nothing (the loft carries the mass)
        1 → long segments (~2.0 u)
        2 → medium segments (~1.2 u)
        3 → full segmentation at _KEEL_PITCH
    """
    if detail < 1:
        return []
    span = z1 - z0
    if span <= 0.0:
        return []
    if role is None:
        role = kit.ROLE_ARMOUR
    pitch = _KEEL_PITCH if detail >= 3 else (1.20 if detail == 2 else 2.00)
    n = max(1, int(math.ceil(span / pitch)))
    seg = span / n + 0.03                # full z length; 0.03 overlap
    thick = _KEEL_PROUD + _KEEL_BURY
    objs = []
    for i in range(n):
        cz = z0 + (i + 0.5) * (span / n)
        sy = surf_bottom(cz)
        if sy == 0.0:
            continue
        # blade points DOWN from the keel: outer face proud, inner buried
        cy = sy + (_KEEL_BURY - _KEEL_PROUD) * 0.5
        objs.append(kit.box(parts, '%s.k%02d' % (name, i), role,
                            (0.0, cy, cz),
                            (half_w * 2.0, thick, seg), mat))
    return objs
