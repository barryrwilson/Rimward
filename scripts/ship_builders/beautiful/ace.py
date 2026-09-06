"""Beautiful Ones Ace — NEEDLEWAKE (reef squid).

Approved concept: reviews/beautiful-ones/small-ships.js buildNeedlewake
(lines 271-343) and the tube helper (lines 22-29), accent #94b7f0.

Long sleek mantle tapering to a soft point aft; a continuous fin skirt
(broad fleshy ribbons on both rear flanks) wraps the rear two-thirds and
ripples around its margin; the blended forward head carries eight
S-curved arms in a funnel cluster ahead of the prow plus two longer
sensory streamers with warm tips. Sparse lateral-line photophores ride
the mantle flanks. Predator-forward silhouette — no rocket tube, no
straight rods.

Conventions (matching the review): forward = -Z, up = +Y, concept
coordinates authored on an ~11-unit span and normalized to class length
by a single uniform sf.fit_sculpt at the end.

Envelope (driver): l = 7.2, b = l*0.40 = 2.88, h = l*0.20 = 1.44.

LOD ladder (tessellation/repeats only — silhouette never trimmed)
-----------------------------------------------------------------
detail=3  review densities; 8 photophores.
detail=2  0.55x tessellation; 8 photophores.
detail=1  0.30x tessellation; 4 photophores.
detail=0  0.18x tessellation; photophores dropped; eight arms, two
          streamers, warm tips, fin ribbons all preserved.

"""
import math

from . import surface as sf

TAU = math.pi * 2
ACCENT = '#94b7f0'

# Tessellation multiplier per detail tier; silhouette density floor.
_MULT = {3: 1.0, 2: 0.55, 1: 0.30, 0: 0.18}


def _seg(n, mult, minimum=4):
    """Scale a review segment count by the LOD multiplier."""
    return max(minimum, int(round(n * mult)))


def _clamp01(x):
    return min(1.0, max(0.0, x))


# Review axisAt / radAt — mantle spine and girth, verbatim.
def _axis_at(t):
    return (0.0, 0.12 * math.sin(math.pi * t), -1.7 + 6.3 * t)


def _rad_at(t):
    return 0.85 * math.sin(math.pi * _clamp01(t * 1.02)) ** 0.75


def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones reef squid (ace class).

    parts    -- hull-slot objects (authored Col preserved by the pipeline).
    glow     -- emissive-slot objects (photophores, warm streamer tips).
    l, b, h  -- class length, beam, height from the driver (7.2, 2.88, 1.44).
    detail   -- 3 full / 2 thinned / 1 sparse / 0 silhouette-minimum.
    """
    detail = max(0, min(3, int(detail)))
    mult = _MULT[detail]
    pal = sf.sculpt_palette(ACCENT)
    skin = pal['skin']
    start_parts = len(parts)
    start_glow = len(glow)

    # ── MANTLE (review tube, uSeg 48 / vSeg 96, sy 0.92, floor 0.015) ──
    def mantle_fn(u, v):
        ax, ay, az = _axis_at(v)
        r = max(_rad_at(v), 0.015)
        th = u * TAU
        return (ax + math.cos(th) * r, ay + math.sin(th) * r * 0.92, az)

    sf.sculpt_surface(parts, 'ace-mantle', mantle_fn, hull_mat,
                      _seg(48, mult, 8), _seg(96, mult, 12), skin)

    # ── HEAD (blends into the mantle front; arms root inside it) ───────
    sf.sculpt_sphere(parts, 'ace-head', (0.0, 0.03, -2.15),
                     (0.60, 0.54, 1.00), hull_mat, skin,
                     segments=_seg(16, mult, 5))

    # ── LATERAL FIN RIBBONS (rear two-thirds, rippling margins) ────────
    # Broad fleshy sheets swept aft, closing to a rounded point at the
    # tail. Thin membrane: thickness keeps them alive under front-face
    # culling. Review grid 40x72; 36x64 loses no silhouette.
    for side in (-1, 1):
        def fin_fn(u, v, side=side):
            t = 0.32 + 0.66 * v
            ax, ay, az = _axis_at(t)
            r = max(_rad_at(t), 0.02)
            # Fin length along the mantle: swells mid-fin, shuts at ends.
            f_len = (1.55 * max(math.sin(math.pi * v), 0.0) ** 0.8
                     * (1 + 0.07 * math.sin(v * 13 + side)))
            wave = (f_len / 1.55) * u
            x = ax + side * (r * 0.85 + f_len * u)
            y = (ay + (0.10 * u + 0.22 * u * u) * f_len / 1.55
                 + 0.16 * math.sin(v * 7 + u * 2.5 + side * 2) * wave)
            z = az + u * f_len * 0.55  # progressive aft sweep to the margin
            return (x, y, z)

        sf.sculpt_surface(parts, 'ace-fin-%s' % ('port' if side < 0 else 'stbd'),
                          fin_fn, hull_mat,
                          _seg(36, mult, 4), _seg(64, mult, 6),
                          pal['membrane'], thickness=0.02)

    # ── EIGHT ARMS (individual S-curves flaring into a funnel cluster) ──
    arm_segments = _seg(64, mult, 8)
    arm_sides = _seg(10, mult, 4)
    for k in range(8):
        th = (k / 8) * TAU + 0.22
        wob = 0.12 * math.sin(k * 2.7)
        len_k = 1 + 0.07 * math.sin(k * 2.3)

        def P(r, dth, z, th=th, len_k=len_k):
            return (r * math.cos(th + dth),
                    r * math.sin(th + dth) * 0.92 + 0.02,
                    z * len_k)

        sf.sculpt_tendril(parts, 'ace-arm-%d' % k, [
            P(0.30, 0.00, -2.75),
            P(0.58, 0.12, -3.45),
            P(0.72, 0.30 + wob, -4.15),
            P(0.60, 0.52 + wob, -4.70),
            P(0.34, 0.72 + wob, -5.00 - 0.15 * math.sin(k * 1.9)),
        ], 0.085, hull_mat, skin, tip=0.013,
            segments=arm_segments, sides=arm_sides)

    # ── TWO SENSORY STREAMERS (travelling wave, warm tips) ─────────────
    streamer_segments = _seg(110, mult, 10)
    streamer_sides = _seg(10, mult, 4)
    tip_segments = _seg(12, mult, 6)
    for side in (-1, 1):
        tag = 'port' if side < 0 else 'stbd'
        pts = []
        for j in range(7):
            t = j / 6.0
            pts.append((
                side * (0.28 + 1.15 * t) + 0.12 * math.sin(t * 8 + side * 2),
                0.28 + 0.55 * t + 0.10 * math.sin(t * 6 + side),
                -2.6 - 3.7 * t,
            ))
        sf.sculpt_tendril(parts, 'ace-streamer-%s' % tag, pts, 0.05,
                          hull_mat, skin, tip=0.006,
                          segments=streamer_segments, sides=streamer_sides)
        sf.sculpt_sphere(glow, 'ace-streamer-tip-%s' % tag, pts[-1],
                         (0.05, 0.04, 0.07), glow_mat, pal['warm'],
                         segments=tip_segments)

    # ── SPARSE LATERAL-LINE PHOTOPHORES (mantle flanks) ────────────────
    # LOD thins the lights: 4 per side at detail >= 2, 2 per side at
    # detail 1, none at detail 0.
    if detail >= 2:
        photo_ts = (0.24, 0.42, 0.60, 0.78)
    elif detail == 1:
        photo_ts = (0.32, 0.66)
    else:
        photo_ts = ()
    photo_segments = _seg(10, mult, 5)
    for side in (-1, 1):
        for t in photo_ts:
            ax, ay, az = _axis_at(t)
            sf.sculpt_sphere(glow, 'ace-photophore-%s-%.2f'
                             % ('port' if side < 0 else 'stbd', t),
                             (side * (_rad_at(t) + 0.01), ay, az),
                             (0.05, 0.04, 0.11), glow_mat, pal['glow'],
                             segments=photo_segments)

    # ── UNIFORM FIT ─────────────────────────────────────────────────────
    # One uniform normalization of everything appended above: centres the
    # full envelope (streamer tips to mantle tail) and makes the
    # longitudinal span exactly l. No shape distortion.
    sf.fit_sculpt(parts[start_parts:] + glow[start_glow:], l)
