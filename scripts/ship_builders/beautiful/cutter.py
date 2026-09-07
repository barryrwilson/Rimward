"""Beautiful Ones Cutter — BLUE PILGRIM (blue glaucus sea slug).

Approved concept: reviews/beautiful-ones/small-ships.js buildBluePilgrim,
materials from reviews/beautiful-ones/organic.js. Sculpted in review
coordinates (forward = -Z, up = +Y), then uniformly fit to the class
length — no ratio distortion.

Body plan: a slender, sinuous, dorsoventrally flattened trunk (compressed
tube on a wandering axis, sx 1.15 / sy 0.55) with a soft forward prow and
paired rhinophores. Three bilateral tiers of cerata root in the flanks:
the front tier is the guardian cradle — fingers sweep low and forward,
then hook gently inward to shelter the prow; the mid tier stands lateral;
the aft tier sweeps back. A lens-shaped belly pouch rides the front
ventral seam. Sparse accent glow only: one lit finger per cerata cluster
and a short luminous seam along the pouch and open belly.

Anatomy:
- flattened sinuous trunk, prow swelling near t = 0.09
- paired rhinophores curling up off the prow
- three cerata tiers per side (6 / 5 / 5 fingers; cradle / lateral / aft)
- soft ventral pouch membrane, edges flush on the trunk
- warm lit fingertip per cluster; sparse ventral glow seam

Envelope (driver): l = 11.0. Beam/height emerge from the approved
concept proportions; the sculpt is uniformly fit to longitudinal span l.

LOD ladder
----------
detail=3  full: 6/5/5 fingers per tier, 3+3 seam lights, dense sampling.
detail=2  full anatomy, reduced tessellation.
detail=1  full anatomy, coarse tessellation.
detail=0  anatomy reduced to 4/3/3 fingers per tier and one light per
          seam; silhouette and cradle gesture never trim further.
"""
import math

from . import surface as sf

TAU = math.pi * 2.0

# Approved review anchors (small-ships.js buildBluePilgrim / organic.js).
_ACCENT = '#83cceb'

# Detail 3..0 segment multiplier and small-sphere resolution.
_MULT = (0.18, 0.30, 0.55, 1.0)
_SPHERE_SEG = (8, 8, 10, 12)

# Cerata tiers per side, review `tiers`: front guardian cradle, mid
# lateral fan, aft swept-back fan. `n` is the LOD0 finger count.
_TIERS = (
    {'t': 0.26, 'len': 2.20, 'n': 6, 'r': 0.130, 'cradle': True, 'sweep': 0.0,
     'tag': 'cradle'},
    {'t': 0.50, 'len': 1.85, 'n': 5, 'r': 0.115, 'cradle': False, 'sweep': -0.1,
     'tag': 'mid'},
    {'t': 0.74, 'len': 1.50, 'n': 5, 'r': 0.100, 'cradle': False, 'sweep': 0.8,
     'tag': 'aft'},
)

# Ventral seam photophores: riding the pouch dip, then the open belly aft.
_POUCH_TS = (0.24, 0.36, 0.48)
_POUCH_TS_LOW = (0.36,)
_AFT_TS = (0.64, 0.78, 0.90)
_AFT_TS_LOW = (0.78,)


def _clamp01(x):
    return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)


def _n3(v):
    n = math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) or 1.0
    return (v[0] / n, v[1] / n, v[2] / n)


def _axis(t):
    """Sinuous trunk centreline, concept space (review axisAt)."""
    return (0.22 * math.sin(t * math.pi * 1.1 + 0.3),
            0.12 * math.sin(t * TAU + 1.0),
            -4.5 + 8.4 * t)


def _radius(t):
    """Trunk radius profile with the soft prow swelling (review radAt)."""
    return (0.56 * math.sin(math.pi * _clamp01(t)) ** 0.52
            * (0.92 + 0.85 * math.exp(-((t - 0.09) / 0.10) ** 2)))


def _finger_points(tier, side, f):
    """One cerata finger's control points and tip (review fan loop)."""
    a = _axis(tier['t'])
    rr = _radius(tier['t'])
    # Root buried in the flank; R is the fan origin above it.
    root = (a[0] + side * rr * 1.0, a[1] + rr * 0.3, a[2])
    fan = (root[0] + side * 0.70,
           root[1] + (0.30 if tier['cradle'] else 0.50),
           root[2] - 0.05)
    length = tier['len'] * (1 - 0.22 * abs(f))
    points = [
        (root[0] - side * 0.15, root[1] - 0.08, root[2] + f * 0.05),
        (root[0] + side * 0.36, root[1] + 0.19, root[2] - 0.06),
        fan,
    ]
    if tier['cradle']:
        # Low forward fan that dips, then hooks inward — a cupped shelter.
        d = _n3((side * (0.95 + 0.25 * abs(f)),
                 0.10 + 0.35 * f,
                 -0.55 + 1.0 * f))
        points.append((fan[0] + d[0] * length * 0.36,
                       fan[1] + d[1] * length * 0.36 - 0.06,
                       fan[2] + d[2] * length * 0.36))
        points.append((fan[0] + d[0] * length * 0.70,
                       fan[1] + d[1] * length * 0.70 - 0.20,
                       fan[2] + d[2] * length * 0.70 + 0.02))
        tip = (fan[0] + d[0] * length - side * 0.34,
               fan[1] + d[1] * length - 0.05,
               fan[2] + d[2] * length + 0.06)
    else:
        d = _n3((side * (0.85 + 0.30 * abs(f)),
                 0.55 + 0.30 * f,
                 tier['sweep'] + 1.0 * f))
        points.append((fan[0] + d[0] * length * 0.36,
                       fan[1] + d[1] * length * 0.36 + 0.10,
                       fan[2] + d[2] * length * 0.36))
        points.append((fan[0] + d[0] * length * 0.70 + side * 0.05,
                       fan[1] + d[1] * length * 0.70 + 0.22,
                       fan[2] + d[2] * length * 0.70 + 0.04))
        tip = (fan[0] + d[0] * length,
               fan[1] + d[1] * length + 0.26,
               fan[2] + d[2] * length + 0.10)
    points.append(tip)
    return points, tip


def _pouch(u, v):
    """Lens-shaped belly membrane flush on the front ventral seam."""
    t = 0.12 + 0.44 * v
    a = _axis(t)
    r = max(_radius(t), 0.03)
    phi = (u * 2 - 1) * 0.95                    # across the belly width
    end_taper = math.sin(math.pi * _clamp01(v)) ** 0.6
    x = a[0] + math.sin(phi) * r * 1.15
    y_belly = a[1] - math.cos(phi) * r * 0.55
    dip = 0.30 * end_taper * math.sin(math.pi * u) ** 1.2
    return (x, y_belly - dip, a[2])


def _pouch_dip(t):
    """Centreline dip of the pouch at trunk parameter t (u = 0.5)."""
    v = (t - 0.12) / 0.44
    return 0.30 * math.sin(math.pi * _clamp01(v)) ** 0.6


def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones Blue Pilgrim sea slug (cutter class).

    parts    -- list that receives hull-slot objects (trunk, rhinophores,
                cerata fingers, belly pouch).
    glow     -- list that receives emissive objects (lit fingertips,
                ventral seam photophores).
    l, b, h  -- class envelope from CLASSES (11.0, ...); the sculpt is
                uniformly fit to longitudinal span l.
    hull_mat -- RIMWARD_HULL slot; glow_mat -- RIMWARD_EMISSIVE slot.
    detail   -- 3 (lod0) … 0 (lod3).
    """
    d = 0 if detail < 0 else (3 if detail > 3 else int(detail))
    mult = _MULT[d]
    sph_seg = _SPHERE_SEG[d]

    def seg(n):
        return max(4, int(round(n * mult)))

    pal = sf.sculpt_palette(_ACCENT)

    parts0 = len(parts)
    glow0 = len(glow)

    # Trunk: closed flattened tube on the sinuous axis (sx 1.15, sy 0.55).
    def trunk(u, v):
        a = _axis(v)
        r = max(_radius(v), 0.015)      # floor keeps pole normals finite
        th = u * TAU
        return (a[0] + math.cos(th) * r * 1.15,
                a[1] + math.sin(th) * r * 0.55,
                a[2])

    sf.sculpt_surface(parts, 'trunk', trunk, hull_mat,
                      seg(40), seg(84), pal['skin'])

    # Rhinophores: paired sensory curls off the prow.
    for side, tag in ((1.0, 's'), (-1.0, 'p')):
        sf.sculpt_tendril(parts, 'rhinophore-%s' % tag, [
            (side * 0.10, 0.26, -3.75),
            (side * 0.17, 0.44, -4.10),
            (side * 0.13, 0.52, -4.40),
        ], 0.040, hull_mat, pal['skin'],
            tip=0.008, segments=seg(32), sides=seg(10))

    # Cerata: three bilateral tiers of thick rooted fingers fanning from
    # the flanks — cradle forward, mid lateral, aft swept back.
    for side, stag in ((1.0, 's'), (-1.0, 'p')):
        for tier in _TIERS:
            n = tier['n'] if d >= 1 else max(3, tier['n'] - 2)
            mid = n // 2
            for j in range(n):
                f = (j / (n - 1)) - 0.5     # -0.5 .. 0.5 across the fan
                points, tip = _finger_points(tier, side, f)
                sf.sculpt_tendril(
                    parts, 'cerata-%s-%s%d' % (tier['tag'], stag, j),
                    points, tier['r'] * 1.6, hull_mat, pal['skin'],
                    tip=0.012, segments=seg(40), sides=seg(12))
                if j == mid:
                    # One lit finger per cluster.
                    sf.sculpt_sphere(glow,
                                     'cerata-light-%s-%s' % (tier['tag'], stag),
                                     tip, (0.05, 0.045, 0.06),
                                     glow_mat, pal['warm'], segments=sph_seg)

    # Soft belly pouch: lens-shaped membrane swelling off the front belly;
    # both ends taper shut and the edges land flush on the trunk.
    sf.sculpt_surface(parts, 'pouch', _pouch, hull_mat,
                      seg(40), seg(44), pal['membrane'], thickness=0.02)

    # Sparse luminous seam riding the pouch, then the open belly aft.
    pouch_ts = _POUCH_TS if d >= 1 else _POUCH_TS_LOW
    for i, t in enumerate(pouch_ts):
        a = _axis(t)
        centre = (a[0], a[1] - _radius(t) * 0.55 - _pouch_dip(t) - 0.02, a[2])
        sf.sculpt_sphere(glow, 'seam-pouch-%d' % i, centre,
                         (0.04, 0.025, 0.075), glow_mat, pal['glow'],
                         segments=sph_seg)
    aft_ts = _AFT_TS if d >= 1 else _AFT_TS_LOW
    for i, t in enumerate(aft_ts):
        a = _axis(t)
        centre = (a[0], a[1] - _radius(t) * 0.55 - 0.01, a[2])
        sf.sculpt_sphere(glow, 'seam-aft-%d' % i, centre,
                         (0.04, 0.025, 0.075), glow_mat, pal['glow'],
                         segments=sph_seg)

    # One uniform fit: longitudinal span becomes exactly l, no distortion.
    sf.fit_sculpt(parts[parts0:] + glow[glow0:], l)
