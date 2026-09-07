"""Beautiful Ones Frigate - CATHEDRAL, deep-sea jellyfish elder guardian.

Approved concept: reviews/beautiful-ones/large-ships.js buildFrigate
(lines 147-293) with the shared tissue palette from organic.js, accent
'#9fd8ff'. A substantial elongated scalloped bell leads along -Z with a
serene inner sanctuary core, sparse luminous radial canals, frilled oral
arms, and long flowing tentacles sweeping toward +Z. The mantle dominates
the silhouette:

- ONE elongated scalloped bell (10 lobes, soft radial fluting near the
  rim) in pale ice-blue transmission tissue, apex at -Z, open rim aft.
- A layered inner sanctuary core glimpsed through the bell: a warm
  glowing heart, a pearl ridge above it, and four small radiant pods.
- TEN sparse radial light canals riding the bell's surface relief.
- FOUR frilled oral arms: a soft core limb plus a rippled membrane frill.
- NINE long curved trailing tentacles, six short inner veil tentacles,
  and a delicate fringe hanging between the rim lobes, all toward +Z.

All geometry is authored in review concept coordinates (forward -Z, up
+Y) through the sf.sculpt_* helpers and uniformly fit to the class
length by ONE sf.fit_sculpt call at the end, preserving approved
proportions. Membranes (bell, oral frills) are solidified minimally so
front-side runtime materials keep them alive from every angle.

Envelope (driver): l = 32.0. Beam/height come from the approved sculpt
proportions via the uniform fit, not from the old tuning ratios.

LOD ladder (tessellation only - every lobe, canal, arm and tentacle
persists at every detail)
----------------------------------------------------------------------
detail=3  near-review densities (bell 96x48 solidified, tentacles
          72x10); ~51k triangles, under the 60k lod0 cap.
detail=2  0.55x tessellation; ~17k triangles.
detail=1  0.30x tessellation; ~8k triangles.
detail=0  0.18x tessellation with silhouette floors (bell keeps 40
          radial samples so all 10 scalloped lobes read); ~6.5k.
"""
import math

from . import surface as sf

TAU = math.pi * 2.0
ACCENT = '#9fd8ff'

# Review bell constants: 10 scalloped lobes, apex at -Z, rim aft.
LOBES = 10
Z_APEX = -3.0
Z_RIM = 1.7

# Tessellation multiplier per detail tier; floors keep the anatomy alive.
_MULT = (0.18, 0.30, 0.55, 1.0)


# ---------------------------------------------------------------------------
# Review math helpers - exact ports of large-ships.js clamp01/smooth/hash.
# ---------------------------------------------------------------------------

def _clamp01(x):
    return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)


def _smooth(a, b, x):
    t = _clamp01((x - a) / (b - a))
    return t * t * (3.0 - 2.0 * t)


def _hash(n):
    """Stable review hash: fract(sin(n*127.1 + 311.7) * 43758.5453)."""
    s = math.sin(n * 127.1 + 311.7) * 43758.5453
    return s - math.floor(s)


def _seg(base, mult, lo=4):
    """LOD-tessellated segment count; ``lo`` keeps the silhouette alive."""
    return max(lo, int(round(base * mult)))


# ---------------------------------------------------------------------------
# Review curve equations - verbatim ports.
# ---------------------------------------------------------------------------

def _bell_prof(v):
    """Bell profile: axial station and radius at normalized height v."""
    z = Z_APEX + v * (Z_RIM - Z_APEX)
    r = max(2.15 * math.sin((math.pi / 2.0) * _clamp01(v) ** 0.78) ** 0.9,
            0.02)
    return z, r


def _oral_point(i, t):
    """Frilled oral-arm spine: gentle outward curl trailing toward +Z."""
    ph = i * 1.7
    return (0.22 * math.cos(i * math.pi / 2.0) * (1.0 - t)
            + 0.34 * math.sin(t * 3.1 + ph) * t,
            -0.15 - 0.5 * t + 0.22 * math.sin(t * 4.3 + ph * 1.3) * t,
            0.9 + 3.2 * t)


# ---------------------------------------------------------------------------
# BUILD FUNCTION
# ---------------------------------------------------------------------------

def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones Cathedral jellyfish elder (frigate class).

    parts / glow -- object lists the driver joins into the hull and
                    emissive meshes (authored Col preserved).
    l, b, h      -- class envelope; the uniform fit owns the proportions.
    detail       -- 3 (lod0) ... 0 (lod3).
    """
    d = min(max(int(detail), 0), 3)
    mult = _MULT[d]

    # Review palette, all linear RGB via sf helpers.
    pal = sf.sculpt_palette(ACCENT)
    bell_col = sf.sculpt_color('#aacbea')   # ice-blue transmission tissue
    frill_col = sf.sculpt_color('#c3b4e2')  # lavender oral frills
    tent_col = sf.sculpt_color('#b6a4d8')   # violet trailing tentacles
    warm = pal['warm']                      # sanctuary heart
    ridge_col = pal['ridge']                # pearl ridge layer
    glow_col = pal['glow']                  # pods and light canals

    p0, g0 = len(parts), len(glow)

    # -- Elongated scalloped bell (review surface 100x52) ------------------
    # Soft radial fluting near the rim plus a 10-lobe scalloped margin.
    # Solidified: the open rim exposes the interior, and front-side
    # materials must see tissue from inside and out.
    def bell_fn(u, v):
        th = u * TAU
        z, r = _bell_prof(v)
        flute = 1.0 + 0.055 * math.sin(th * LOBES) * _smooth(0.45, 1.0, v)
        scallop = (0.34 * (0.5 + 0.5 * math.sin(th * LOBES + math.pi / LOBES))
                   * _smooth(0.72, 1.0, v))
        return (math.cos(th) * r * flute,
                math.sin(th) * r * flute,
                z + scallop)

    sf.sculpt_surface(parts, 'cathedral-bell', bell_fn, hull_mat,
                      _seg(96, mult, 40), _seg(48, mult, 14),
                      bell_col, thickness=0.05)

    # -- Layered inner sanctuary core (glimpsed through the bell) ---------
    sf.sculpt_sphere(glow, 'cathedral-core-warm', (0.0, -0.05, -0.85),
                     (0.78, 0.82, 1.65), glow_mat, warm,
                     segments=_seg(20, mult, 6))
    sf.sculpt_sphere(parts, 'cathedral-core-ridge', (0.0, 0.38, -1.15),
                     (0.42, 0.34, 0.9), hull_mat, ridge_col,
                     segments=_seg(16, mult, 5))
    for i in range(4):
        a = (i / 4.0) * TAU + math.pi / 4.0
        sf.sculpt_sphere(glow, 'cathedral-pod-%d' % i,
                         (math.cos(a) * 0.95, math.sin(a) * 0.95, 0.45),
                         (0.17, 0.17, 0.48), glow_mat, glow_col,
                         segments=_seg(12, mult, 5))

    # -- Sparse radial light canals (review tendrils 48 seg, 8 sides) -----
    # Each canal rides the bell's surface relief at 1.002x radius.
    for i in range(LOBES):
        a = (i / float(LOBES)) * TAU + math.pi / LOBES
        pts = []
        for k in range(9):
            v = 0.09 + 0.82 * (k / 8.0)
            z, r = _bell_prof(v)
            flute = (1.0 + 0.055 * math.sin(a * LOBES)
                     * _smooth(0.45, 1.0, v))
            scallop = (0.34 * (0.5 + 0.5 * math.sin(a * LOBES + math.pi / LOBES))
                       * _smooth(0.72, 1.0, v))
            pts.append((math.cos(a) * r * flute * 1.002,
                        math.sin(a) * r * flute * 1.002,
                        z + scallop))
        sf.sculpt_tendril(glow, 'cathedral-canal-%02d' % i, pts, 0.025,
                          glow_mat, glow_col, tip=0.01,
                          segments=_seg(40, mult, 10),
                          sides=_seg(6, mult, 4))

    # -- Frilled oral arms (review tendril + rippled frill membrane) ------
    for i in range(4):
        pts = [_oral_point(i, k / 10.0) for k in range(11)]
        sf.sculpt_tendril(parts, 'cathedral-arm-%d' % i, pts, 0.085,
                          hull_mat, frill_col, tip=0.02,
                          segments=_seg(40, mult, 8),
                          sides=_seg(8, mult, 4))
        rot = i * math.pi / 2.0 + math.pi / 4.0

        def frill_fn(u, v, i=i, rot=rot):
            c = _oral_point(i, v)
            w = ((0.05 + 0.26 * math.sin(math.pi * min(1.0, v * 1.12)))
                 * (1.0 - 0.35 * v))
            ripple = 0.09 * math.sin(v * 10.0 + u * 5.0 + i * 2.1)
            return (c[0] + math.cos(rot) * (u - 0.5) * 2.0 * w,
                    c[1] + ripple,
                    c[2] + math.sin(rot) * (u - 0.5) * 2.0 * w)

        sf.sculpt_surface(parts, 'cathedral-frill-%d' % i, frill_fn,
                          hull_mat, _seg(10, mult, 3), _seg(36, mult, 6),
                          frill_col, thickness=0.02)

    # -- Nine long flowing tentacles sweeping back past the rim -----------
    for j in range(9):
        a = (j / 9.0) * TAU + 0.35
        h1 = _hash(j * 3 + 1)
        h2 = _hash(j * 3 + 2)
        h3 = _hash(j * 3 + 3)
        length = 4.4 + 0.9 * h1
        pts = []
        for k in range(15):
            t = k / 14.0
            pts.append((
                math.cos(a) * (1.55 + 0.35 * math.sin(math.pi * t))
                + (0.5 + h2 * 0.3) * math.sin(t * TAU + j * 0.6) * t,
                math.sin(a) * (1.55 - 0.1 * t) - 0.2 * t
                + (0.65 + h3 * 0.35) * math.sin(t * TAU + j * 0.8)
                * math.sin(math.pi * t),
                1.55 + length * t))
        sf.sculpt_tendril(parts, 'cathedral-tentacle-%02d' % j, pts,
                          0.065 + 0.02 * h2, hull_mat, tent_col, tip=0.008,
                          segments=_seg(72, mult, 12),
                          sides=_seg(10, mult, 4))

    # -- Short inner veil tentacles ---------------------------------------
    for j in range(6):
        a = (j / 6.0) * TAU + 0.9
        pts = []
        for k in range(9):
            t = k / 8.0
            pts.append((
                math.cos(a) * 0.85 * (1.0 - 0.3 * t)
                + 0.2 * math.sin(t * 3.0 + j),
                math.sin(a) * 0.85 * (1.0 - 0.35 * t) - 0.3 * t
                + 0.08 * math.sin(t * 4.0 + j),
                1.4 + 2.3 * t))
        sf.sculpt_tendril(parts, 'cathedral-veil-%d' % j, pts, 0.03,
                          hull_mat, tent_col, tip=0.006,
                          segments=_seg(32, mult, 8),
                          sides=_seg(6, mult, 4))

    # -- Delicate fringe hanging between the rim lobes --------------------
    for i in range(LOBES):
        a = (i / float(LOBES)) * TAU
        pts = []
        for k in range(6):
            t = k / 5.0
            pts.append((
                math.cos(a) * (2.05 - 0.35 * t)
                + 0.04 * math.sin(t * 3.0 + i),
                math.sin(a) * (2.05 - 0.35 * t)
                + 0.04 * math.cos(t * 2.4 + i),
                1.62 + 0.75 * t))
        sf.sculpt_tendril(parts, 'cathedral-fringe-%02d' % i, pts, 0.02,
                          hull_mat, tent_col, tip=0.005,
                          segments=_seg(20, mult, 6),
                          sides=_seg(5, mult, 3))

    # -- UNIFORM FIT -------------------------------------------------------
    # One uniform normalization of everything appended above: centres the
    # full envelope (bell apex to longest tentacle tip) and makes the
    # longitudinal span exactly l. No shape distortion.
    sf.fit_sculpt(parts[p0:] + glow[g0:], l)
