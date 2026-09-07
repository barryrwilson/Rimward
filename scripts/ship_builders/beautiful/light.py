"""Beautiful Ones Light — GLASSFIN (pelagic ribbonfish).

Bible §4.6 family slot: small, curious, lightly built young wayfinder.
Class read is RIBBONFISH anatomy, approved in
reviews/beautiful-ones/small-ships.js buildGlassfin — nothing winged,
stalked, or insectoid.

Envelope (driver CLASSES.light): l = 7.8, b = l*0.42, h = l*0.24.
Geometry is authored in the review's concept coordinates and one
uniform sf.fit_sculpt at the end sets the longitudinal span to exactly
l; beam and height follow the approved proportions undistorted.

BODY PLAN
---------
One laterally compressed fusiform tube held on a gentle S-spine:
blunt integrated sensory prow toward -Z, deep trunk, drawn-out caudal
peduncle. A long undulating dorsal ribbon rides the whole back from
just behind the prow to the peduncle, its free edge leaning aft. A
short low ventral fin hangs amidships, dying out before the peduncle.
The tail is a deeply forked pair of sweeping vertical lobes — rooted
narrow, broad mid-chord, closing to soft rounded tips — each with a
slim reinforcing ray along its outer edge. Small low-set rounded
pectorals sweep back along the flank. Four slim dark gill pleats lie
flush in each flank behind the prow; sparse photophores ride the
lateral line and the ribbon root; two warm sensory pores sit
half-buried low on the prow.

Countershading lives in the body vertex colours: pearl belly grading
through teal flanks to an indigo back (flank #3c9c9d, dorsal #1c4766,
belly #bbdbcf over accent #5fc2c9). Fins are membrane, rays ridge,
pleats dark — the review palette. Material slots stay the production
hull/emissive pair; glow list carries photophores and pores only.

LOD: 3 full review anatomy; 2 and 1 keep every feature and repeat at
reduced tessellation (multipliers 1 / .55 / .30 / .18, floor 4); 0
keeps the full silhouette and only thins small repetition — gill
folds 4->2 per side, lateral photophores 6->3 per side, ribbon
photophores 3->1. Geometry stays within the production LOD triangle caps.
"""
import math

from . import surface as sf

TAU = math.pi * 2.0

# Approved review anchors (small-ships.js buildGlassfin / organic.js).
_ACCENT = '#5fc2c9'
_FLANK = '#3c9c9d'
_DORSAL = '#1c4766'
_BELLY = '#bbdbcf'

_LATERAL_TS = (0.20, 0.33, 0.46, 0.59, 0.72, 0.85)
_LATERAL_TS_LOW = (0.28, 0.52, 0.76)
_RIBBON_TS = (0.25, 0.5, 0.75)

# Detail 3..0 segment multiplier and small-sphere resolution.
_MULT = (0.18, 0.30, 0.55, 1.0)
_SPHERE_SEG = (8, 8, 10, 12)


def _clamp01(x):
    return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)


def _lerp(a, b, t):
    return a + (b - a) * t


def _n3(v):
    n = math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) or 1.0
    return (v[0] / n, v[1] / n, v[2] / n)


def _axis(t):
    """S-spine centreline, concept space."""
    return (0.26 * math.sin((t * 1.1 - 0.12) * math.pi),
            -0.06 + 0.20 * math.sin(t * math.pi * 0.85),
            -4.6 + 9.6 * t)


def _radius(t):
    """Trunk radius profile: blunt prow rise, long peduncle taper."""
    return 1.02 * math.sin(math.pi * _clamp01(t) ** 0.72) ** 0.62


def _body_point(t, th, lift=1.0):
    """Compressed body surface point; sx 0.40 flattens the section."""
    a = _axis(t)
    r = max(_radius(t), 0.02) * lift
    return (a[0] + math.cos(th) * r * 0.40,
            a[1] + math.sin(th) * r,
            a[2])


def _body_colors(flank, dorsal, belly):
    """Countershaded skin: teal flank grading to indigo back / pearl belly."""
    def at(u, _v):
        height = math.sin(u * TAU)
        t = abs(height) ** 0.7
        target = dorsal if height > 0.0 else belly
        return (flank[0] + (target[0] - flank[0]) * t,
                flank[1] + (target[1] - flank[1]) * t,
                flank[2] + (target[2] - flank[2]) * t)
    return at


def _tail_lobe(ped, direction, length, rise):
    """One forked caudal lobe sweeping up/down off the peduncle tip."""
    def at(u, v):
        cx = ped[0] + 0.05 * math.sin(math.pi * u)
        cy = ped[1] + direction * rise * u ** 1.3
        cz = ped[2] + length * u
        dyd = direction * rise * 1.3 * max(u, 0.02) ** 0.3
        pl = math.hypot(length, dyd) or 1.0
        py = length / pl
        pz = -dyd / pl
        w = 0.92 * math.sin(math.pi * (0.12 + 0.88 * u)) ** 0.85
        camber = 0.06 * math.sin(math.pi * v) * math.sin(math.pi * u)
        return (cx + camber, cy + (v - 0.5) * w * py, cz + (v - 0.5) * w * pz)
    return at


def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones Glassfin ribbonfish (light class).

    parts    -- list that receives hull-slot objects (body, fins, rays,
                gill pleats).
    glow     -- list that receives emissive objects (photophores, pores).
    l, b, h  -- class envelope from CLASSES (7.8, 3.28, 1.87); the
                sculpt is uniformly fit to longitudinal span l.
    hull_mat -- RIMWARD_HULL slot; glow_mat -- RIMWARD_EMISSIVE slot.
    detail   -- 3 (lod0) … 0 (lod3).
    """
    d = 0 if detail < 0 else (3 if detail > 3 else int(detail))
    mult = _MULT[d]
    sph_seg = _SPHERE_SEG[d]

    def seg(n):
        return max(4, int(round(n * mult)))

    pal = sf.sculpt_palette(_ACCENT)
    flank = sf.sculpt_color(_FLANK)
    dorsal = sf.sculpt_color(_DORSAL)
    belly = sf.sculpt_color(_BELLY)

    parts0 = len(parts)
    glow0 = len(glow)

    # Body: closed compressed tube on the S-axis, countershaded skin.
    def body(u, v):
        return _body_point(v, u * TAU)

    sf.sculpt_surface(parts, 'living-body', body, hull_mat,
                      seg(48), seg(96), _body_colors(flank, dorsal, belly))

    # Flush sensory pores half-buried low on the prow — embedded, warm.
    for side, tag in ((1.0, 's'), (-1.0, 'p')):
        th = -0.28 if side > 0 else math.pi + 0.28
        p = _body_point(0.025, th, 1.005)
        sf.sculpt_sphere(glow, 'pore-prow-%s' % tag, p,
                         (0.018, 0.016, 0.025), glow_mat, pal['warm'],
                         segments=sph_seg)

    # Gill folds: slim dark pleats flush in each flank behind the prow.
    gill_count = 4 if d >= 1 else 2
    gill_step = 0.026 * (3.0 / (gill_count - 1))
    for side, tag in ((1.0, 's'), (-1.0, 'p')):
        for i in range(gill_count):
            t = 0.085 + i * gill_step
            points = []
            for j in range(9):
                a = -0.72 + j / 8.0 * 1.44
                th = a if side > 0 else math.pi - a
                points.append(_body_point(t + 0.012 * math.sin(a), th, 1.004))
            sf.sculpt_tendril(parts, 'gill-fold-%s%d' % (tag, i), points,
                              0.009, hull_mat, pal['dark'],
                              tip=0.005, segments=seg(28), sides=seg(6))

    # Lateral line: sparse photophores riding the mid-flank seam.
    lateral_ts = _LATERAL_TS if d >= 1 else _LATERAL_TS_LOW
    for side, tag in ((1.0, 's'), (-1.0, 'p')):
        for i, t in enumerate(lateral_ts):
            p = _body_point(t, 0.0 if side > 0 else math.pi, 1.03)
            sf.sculpt_sphere(glow, 'photophore-flank-%s%d' % (tag, i),
                             (p[0], p[1] + 0.04, p[2]),
                             (0.035, 0.028, 0.075), glow_mat, pal['glow'],
                             segments=sph_seg)

    # Dorsal ribbon: rooted behind the prow, running the back to the
    # peduncle; free edge softly undulating, leaning further aft.
    def ribbon(u, v):
        t = _lerp(0.055, 0.985, u)
        base = _body_point(t, math.pi / 2.0, 0.94)
        hgt = 1.35 * math.sin(math.pi * u) ** 0.7 * (1.0 - 0.45 * u)
        wave = (0.14 * math.sin(u * math.pi * 5.2 + v * 2.1)
                * v * v * math.sin(math.pi * u))
        camber = 0.06 * math.sin(math.pi * v) * math.sin(u * math.pi * 1.1)
        return (base[0] + camber, base[1] + v * hgt + wave,
                base[2] + 0.5 * v * hgt)

    sf.sculpt_surface(parts, 'fin-dorsal-ribbon', ribbon, hull_mat,
                      seg(110), seg(16), pal['membrane'], thickness=0.02)

    # Sparse photophores sprinkled along the ribbon's root.
    ribbon_ts = _RIBBON_TS if d >= 1 else (0.5,)
    for i, u in enumerate(ribbon_ts):
        p = _body_point(_lerp(0.055, 0.985, u), math.pi / 2.0, 1.0)
        sf.sculpt_sphere(glow, 'photophore-ribbon-%d' % i,
                         (p[0] + 0.055, p[1] + 0.05, p[2]),
                         (0.04, 0.03, 0.07), glow_mat, pal['glow'],
                         segments=sph_seg)

    # Ventral fin: short, low, swept aft, dying out before the peduncle.
    def ventral(u, v):
        t = _lerp(0.40, 0.88, u)
        base = _body_point(t, math.pi * 1.5, 0.94)
        hgt = 0.52 * math.sin(math.pi * u) ** 0.75
        wave = 0.06 * math.sin(u * math.pi * 3.0 + v) * v * math.sin(math.pi * u)
        return (base[0], base[1] - v * hgt - wave, base[2] + 0.42 * v * hgt)

    sf.sculpt_surface(parts, 'fin-ventral', ventral, hull_mat,
                      seg(44), seg(10), pal['membrane'], thickness=0.018)

    # Forked caudal: two sweeping vertical lobes off the peduncle tip,
    # each rooted narrow, broad mid-chord, closing to a soft rounded tip.
    ped = _axis(0.965)
    upper = _tail_lobe(ped, 1.0, 2.45, 1.62)
    lower = _tail_lobe(ped, -1.0, 2.20, 1.38)
    sf.sculpt_surface(parts, 'fin-caudal-upper', upper, hull_mat,
                      seg(56), seg(14), pal['membrane'], thickness=0.02)
    sf.sculpt_surface(parts, 'fin-caudal-lower', lower, hull_mat,
                      seg(56), seg(14), pal['membrane'], thickness=0.02)
    # A slim reinforcing ray along each lobe's leading (outer) edge.
    for fn, edge, tag in ((upper, 1.0, 'upper'), (lower, 0.0, 'lower')):
        pts = [fn(t, edge) for t in (0.18, 0.42, 0.66, 0.88, 0.99)]
        sf.sculpt_tendril(parts, 'ray-caudal-%s' % tag, pts, 0.030,
                          hull_mat, pal['ridge'],
                          tip=0.007, segments=seg(40), sides=seg(8))

    # Pectoral fins: small, low-set, rounded, swept back along the flank.
    for side, tag in ((1.0, 's'), (-1.0, 'p')):
        def pectoral(u, v, side=side):
            a = _axis(0.30)
            r = _radius(0.30)
            cx = a[0] + side * (r * 0.40 * 0.96 + 0.58 * u
                                + 0.10 * math.sin(math.pi * u))
            cy = a[1] - r * 0.52 - 0.34 * u - 0.05 * math.sin(math.pi * u)
            cz = a[2] + 1.30 * u
            w = 0.60 * math.sin(math.pi * (0.10 + 0.90 * u)) ** 0.8
            cd = _n3((side * 0.10, 0.38, 0.92))
            return (cx + (v - 0.5) * w * cd[0],
                    cy + (v - 0.5) * w * cd[1],
                    cz + (v - 0.5) * w * cd[2])

        sf.sculpt_surface(parts, 'fin-pectoral-%s' % tag, pectoral, hull_mat,
                          seg(30), seg(12), pal['membrane'], thickness=0.018)

    # One uniform fit: longitudinal span becomes exactly l, no distortion.
    sf.fit_sculpt(parts[parts0:] + glow[glow0:], l)
