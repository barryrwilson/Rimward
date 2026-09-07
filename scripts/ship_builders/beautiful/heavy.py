"""Beautiful Ones Heavy - VELVET BASTION, cuttlefish shieldback.

Approved concept: reviews/beautiful-ones/large-ships.js buildHeavy
(lines 26-139) and organic.js materials, accent #8fe8d8.

Broad thick oval mantle with layered muscular dorsal swells grown INTO
the profile (three overlapping gaussians ride the section itself, so the
silhouette stays one continuously differentiable surface with no add-on
lumps); a continuous undulating fin skirt blended along the whole flank,
fading to zero at nose and tail; a softly folded anterior arm crown of
eight short arms curling inward and downward like a half-closed flower
bud; two clubbed feeding tentacles; flush sensory creases on the head
flanks (no protruding eyeballs); sparse lateral photophores as
restrained threat-display embers, not a light show. Countershaded
mantle: satin violet-teal back meeting a lavender pearl underside at the
flank seam. Weight comes from living volume, not armour add-ons.

Conventions (matching the review): forward = -Z, up = +Y, concept
coordinates authored on a ~10-unit span and normalized to class length
by one uniform sf.fit_sculpt at the end.

Envelope (driver): l = 17.0, b = l*0.52 = 8.84, h = l*0.34 = 5.78.

LOD ladder (tessellation/repeats only — silhouette never trimmed)
-----------------------------------------------------------------
detail=3  review densities; 5 photophores per flank.
detail=2  0.55x tessellation; 5 photophores per flank.
detail=1  0.30x tessellation; 3 photophores per flank.
detail=0  0.18x tessellation; 1 photophore per flank keeps the emissive
          join alive. Mantle, dorsal swells, fin skirt, arm crown,
          feeding tentacles, clubs and creases all preserved.
"""
import math

from . import surface as sf

_PI = math.pi
_TAU = math.pi * 2
ACCENT = '#8fe8d8'

# Tessellation multiplier per detail tier; silhouette density floor.
_MULT = {3: 1.0, 2: 0.55, 1: 0.30, 0: 0.18}

# Review mantle spine: z = _Z0 + v * _LEN, nose at v = 0.
_Z0, _LEN = -4.3, 8.6


# ---------------------------------------------------------------------------
# Review math helpers — exact ports of large-ships.js clamp01/smooth/gauss.
# ---------------------------------------------------------------------------

def _clamp01(x):
    return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)


def _smooth(a, b, x):
    t = _clamp01((x - a) / (b - a))
    return t * t * (3.0 - 2.0 * t)


def _gauss(x, c, w):
    return math.exp(-((x - c) * (x - c)) / (2.0 * w * w))


def _seg(base, mult, lo=4):
    """LOD-tessellated segment count; ``lo`` keeps the silhouette alive."""
    return max(lo, int(round(base * mult)))


# ---------------------------------------------------------------------------
# Review profile — exact ports of buildHeavy's shape/prof/dorsalSwell.
# ---------------------------------------------------------------------------

def _shape(v):
    return math.sin(_PI * _clamp01(v) ** 1.22) ** 0.72


def _prof(v):
    """Return (z, rx, ry, cy) of the broad thick oval mantle at v."""
    s = _shape(v)
    return (_Z0 + v * _LEN,
            2.75 * s + 0.02,
            1.72 * s + 0.02,
            0.12 * math.sin(_PI * v))


def _dorsal_swell(v):
    """Dense shielding mass grown into the mantle: three muscular swells."""
    return (0.16 * _gauss(v, 0.3, 0.1)
            + 0.24 * _gauss(v, 0.52, 0.13)
            + 0.18 * _gauss(v, 0.74, 0.1))


def _surf_point(th, v, k=1.0):
    """Review surfPoint: swell lifts the dorsal sector of each section."""
    z, rx, ry, cy = _prof(v)
    f = (1.0 + _dorsal_swell(v) * max(0.0, math.sin(th)) ** 2.2) * k
    return (math.cos(th) * rx * f, math.sin(th) * ry * f + cy, z)


# ---------------------------------------------------------------------------
# BUILD FUNCTION
# ---------------------------------------------------------------------------

def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones Velvet Bastion cuttlefish shieldback.

    parts / glow -- object lists the driver joins into hull and emissive.
    l, b, h      -- class envelope 17.0 x 8.84 x 5.78.
    detail       -- 3 (lod0) … 0 (lod3).
    """
    d = min(max(int(detail), 0), 3)
    mult = _MULT[d]

    # Review palette: cloned materials override the accent-derived base.
    pal = sf.sculpt_palette(ACCENT)
    skin = sf.sculpt_color('#6d64a6')    # satin violet-teal mantle
    belly = sf.sculpt_color('#c0b2d6')   # lavender pearl underside
    fin_col = sf.sculpt_color('#7f9fce') # fin-skirt membrane
    dark = pal['dark']                   # flush sensory creases
    glow_col = pal['glow']               # photophore embers

    p0, g0 = len(parts), len(glow)

    # -- Mantle: one coherent tube, countershaded at the flank seam ------
    # Review grid 56x56 per shell.
    sf.sculpt_surface(parts, 'bastion-mantle-back',
                      lambda u, v: _surf_point(u * _PI, v), hull_mat,
                      _seg(56, mult, 10), _seg(56, mult, 10), skin)
    sf.sculpt_surface(parts, 'bastion-mantle-belly',
                      lambda u, v: _surf_point(_PI + u * _PI, v), hull_mat,
                      _seg(56, mult, 10), _seg(56, mult, 10), belly)

    # -- Continuous undulating fin skirt, blended along the whole flank --
    # Length fades to zero at nose and tail so the pair reads as one
    # membrane. Soft broad ripples with a faint second harmonic; amplitude
    # swells toward the free edge so the skirt flows instead of pleating.
    # Thin membrane: minimal solidify keeps it alive under front-face
    # culling. Review grid 22x110 per side.
    for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
        def skirt_point(u, v, side=side):
            z, rx, _ry, cy = _prof(v)
            length = 1.05 * max(math.sin(_PI * v), 0.0) ** 1.25 + 0.002
            x = side * (rx * 0.97 + length * u)
            edge = _smooth(0.0, 1.0, u)
            y = cy + edge * (0.22 * math.sin(v * _PI * 9 + side * 0.6 + u * 2.0)
                             + 0.06 * math.sin(v * _PI * 19 + u * 3.1))
            return (x, y, z + 0.06 * u * math.sin(v * _PI * 3))

        sf.sculpt_surface(parts, 'bastion-skirt-' + tag, skirt_point,
                          hull_mat, _seg(22, mult, 4), _seg(110, mult, 12),
                          fin_col, thickness=0.02)

    # -- Anterior arm crown: eight arms curling in like a closing bud ----
    arm_segments = _seg(40, mult, 6)
    arm_sides = _seg(10, mult, 3)
    for i in range(8):
        a = (i / 8) * _TAU + 0.22
        pts = []
        for k in range(8):
            t = k / 7.0
            rad = 0.34 * (1.0 - 0.72 * t) + 0.1 * math.sin(t * 2.6)
            pts.append((math.cos(a) * rad,
                        math.sin(a) * rad * 0.85 + 0.05 - 0.38 * t * t,
                        -3.86 - 1.55 * (t - 0.42 * t ** 2.4)))
        sf.sculpt_tendril(parts, 'bastion-arm-%d' % i, pts, 0.13,
                          hull_mat, skin, tip=0.02,
                          segments=arm_segments, sides=arm_sides)

    # -- Paired feeding tentacles with soft clubs -------------------------
    tent_segments = _seg(48, mult, 6)
    tent_sides = _seg(10, mult, 3)
    club_segments = _seg(16, mult, 5)
    for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
        pts = []
        for k in range(10):
            t = k / 9.0
            pts.append((side * (0.16 + 0.22 * math.sin(t * 2.4)),
                        -0.24 - 0.3 * t + 0.1 * math.sin(t * 3.0),
                        -3.8 - 1.85 * t + 0.3 * t * t))
        sf.sculpt_tendril(parts, 'bastion-tentacle-' + tag, pts, 0.085,
                          hull_mat, skin, tip=0.05,
                          segments=tent_segments, sides=tent_sides)
        tip = pts[-1]
        sf.sculpt_sphere(parts, 'bastion-club-' + tag,
                         (tip[0], tip[1], tip[2] - 0.16),
                         (0.13, 0.13, 0.32), hull_mat, skin,
                         segments=club_segments)

    # -- Flush sensory creases on the head flanks (no protruding eyes) ---
    crease_segments = _seg(16, mult, 4)
    crease_sides = _seg(6, mult, 3)
    for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
        pts = []
        for s in range(7):
            t = s / 6.0
            z = -3.45 + 0.6 * t
            v = (z - _Z0) / _LEN
            th = (0.0 if side > 0 else _PI) + side * (0.62 + 0.18 * math.sin(t * _PI))
            pts.append(_surf_point(th, v, 1.004))
        sf.sculpt_tendril(parts, 'bastion-crease-' + tag, pts, 0.022,
                          hull_mat, dark, tip=0.022,
                          segments=crease_segments, sides=crease_sides)

    # -- Sparse lateral photophores: threat-display embers ---------------
    # Review plants 5 per flank at v = 0.3 + k*0.115; far LODs keep the
    # same positions, thinned. One per flank survives to lod3 to hold the
    # emissive join.
    if d >= 2:
        photo_ks = (0, 1, 2, 3, 4)
    elif d == 1:
        photo_ks = (0, 2, 4)
    else:
        photo_ks = (2,)
    photo_segments = _seg(12, mult, 5)
    for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
        for k in photo_ks:
            v = 0.3 + k * 0.115
            px, py, pz = _surf_point(0.0 if side > 0 else _PI, v, 1.004)
            sf.sculpt_sphere(glow, 'bastion-photophore-%s-%d' % (tag, k),
                             (px, py - 0.15, pz), (0.075, 0.075, 0.11),
                             glow_mat, glow_col, segments=photo_segments)

    # -- ONE uniform fit of the complete anatomy to the class length ------
    # Centres the full envelope (tentacle clubs to mantle tail) and makes
    # the longitudinal span exactly l. No shape distortion.
    sf.fit_sculpt(parts[p0:] + glow[g0:], l)
