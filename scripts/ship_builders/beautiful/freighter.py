"""Beautiful Ones Freighter - ORCHARD, mature spaceborne reef gardenback.

Approved review anatomy, ported from reviews/beautiful-ones/large-ships.js
buildFreighter (lines 305-629). A colossal filter-feeding leviathan grown
into a living carrier:

- ONE broad continuous body, indigo back over a pearl keel, integrated head
  and tapered tail. THREE terraced reef basins — folded rims, terrace steps
  and sheltered recessed floors — are deformed directly out of the dorsal
  skin (garden_lift), with recessed flank shelter crescents (shelter_at)
  sunk into the same surface. No glued-on mounds.
- Great cradle-like pectoral shielding folds on the forward flanks and a
  corrected forked vertical tail (upper blade larger) grown from the
  peduncle.
- A MATURE CANOPY rooted through the same surf_point: 18 cupped scalloped
  fans (sage / mint / lavender-coral pigment variants), 9 branching
  lavender coral clusters with rounded joints, and 12 layered mint ribbon
  fronds — three contiguous gardens with an open central channel.
- Fine gill folds, small deep-set eyes with glints, the wide filter-feeding
  mouth seam, fine ventral keel grooves, and sparse pearl photophore
  constellations along the lower flanks.

All geometry is authored in review concept coordinates (forward -Z, up +Y)
through the sf.sculpt_* helpers and uniformly fit to the class length by
ONE sf.fit_sculpt call at the end, preserving approved proportions.

Envelope (driver): l = 85.0, b = l*0.55, h = l*0.30.
Per-GLB triangle caps: detail3 <= 60000, detail2 <= 24000,
detail1 <= 8000, detail0 (freighter lod3) <= 4000.

LOD ladder
----------
detail=3  full canopy tessellation (fans 24x10, body 48x64 + belly 36x48),
          coral crown/branch tip spheres, photophores, gills, grooves.
detail=2  0.55x tessellation; full anatomy retained.
detail=1  0.30x tessellation; subpixel coral tip spheres dropped; canopy
          silhouette, shelters, fins, photophores, gills all persist.
detail=0  0.18x tessellation; canopy counts unchanged. Only truly subpixel
          details go: photophores, gill/groove/mouth tendrils, dark eye
          spheres (glow glints keep the eyes and the emissive join alive).
"""
import math

from . import surface as sf


_PI = math.pi


# ---------------------------------------------------------------------------
# Review math helpers — exact ports of large-ships.js smooth/gauss/hash.
# ---------------------------------------------------------------------------

def _clamp01(x):
    return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)


def _smooth(a, b, x):
    t = _clamp01((x - a) / (b - a))
    return t * t * (3.0 - 2.0 * t)


def _gauss(x, c, w):
    return math.exp(-((x - c) * (x - c)) / (2.0 * w * w))


def _hash(n):
    """Stable review hash: fract(sin(n*127.1 + 311.7) * 43758.5453)."""
    s = math.sin(n * 127.1 + 311.7) * 43758.5453
    return s - math.floor(s)


def _seg(base, mult, lo=4):
    """LOD-tessellated segment count; ``lo`` keeps the silhouette alive."""
    return max(lo, int(round(base * mult)))


# Terraced garden basins: (v, lv, aw, rise, rim, terrace, depth).
_BASINS = (
    (0.34, 0.105, 0.72, 0.14, 0.07, 0.05, 0.18),
    (0.54, 0.12, 0.76, 0.20, 0.08, 0.07, 0.24),
    (0.73, 0.10, 0.66, 0.12, 0.06, 0.05, 0.16),
)

# Sheltered flank crescents: longitudinal centres and mirrored angles.
_SHELTER_VS = (0.39, 0.57, 0.73)
_SHELTER_ANGLES = (1.04, _PI - 1.04)


# ---------------------------------------------------------------------------
# BUILD FUNCTION
# ---------------------------------------------------------------------------

def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones Orchard reef-bearing leviathan (freighter).

    parts / glow -- object lists the driver joins into RIMWARD_HULL and
                    RIMWARD_EMISSIVE.
    l, b, h      -- class envelope 85.0 x 46.75 x 25.5.
    detail       -- 3 (lod0) … 0 (lod3).
    """
    d = min(max(int(detail), 0), 3)
    mult = (0.18, 0.30, 0.55, 1.0)[d]

    # Review palette (accent '#8fd8e8'), all linear RGB via sf helpers.
    pal = sf.sculpt_palette('#8fd8e8')
    indigo = sf.sculpt_color('#42557e')      # deep indigo leviathan tissue
    reef_tissue = sf.sculpt_color('#4f8586')
    shadow = sf.sculpt_color('#193344')
    fin_col = sf.sculpt_color('#546a92')
    sage = sf.sculpt_color('#93bfa8')        # sage fan canopies
    mint = sf.sculpt_color('#a8d9c2')        # mint ribbon fronds
    coral_col = sf.sculpt_color('#b3a0cf')   # muted lavender reef coral
    belly_col = pal['underside']             # pearl keel
    dark = pal['dark']
    glow_col = pal['glow']

    p0, g0 = len(parts), len(glow)

    # -- Body profile and surface deformation (exact review port) ----------
    z_n, z_t = -6.0, 5.6
    length = z_t - z_n

    def endcap(v):
        return math.sin(_PI * _clamp01(v) ** 0.85) ** 0.38

    def prof(v):
        e = endcap(v)
        rx = (2.4 - 0.7 * v + 0.5 * _gauss(v, 0.16, 0.13)
              - 0.55 * _smooth(0.55, 0.95, v)) * e + 0.02
        ry = (1.3 + 0.45 * _gauss(v, 0.42, 0.18)
              - 0.5 * _smooth(0.6, 0.97, v)) * e + 0.02
        return (z_n + v * length, rx, ry,
                0.1 * math.sin(_PI * v) - 0.06 * v)

    def garden_lift(th, v):
        """Terraced basins folded straight out of the dorsal skin."""
        dorsal = _smooth(0.05, 0.5, math.sin(th))
        if dorsal <= 0.0:
            return 0.0
        lift = 0.0
        for bv, blv, aw, rise, rim, terrace, depth in _BASINS:
            dv = (v - bv) / blv
            da = (th - _PI / 2) / aw
            r = math.sqrt(dv * dv + da * da)
            if r > 2.4:
                continue
            lift += rise * (1.0 - _smooth(0.7, 1.5, r))
            lift += rim * _gauss(r, 1.0, 0.18)
            lift += terrace * _gauss(r, 0.55, 0.14)
            lift -= depth * (1.0 - _smooth(0.05, 0.8, r))
        return lift * dorsal

    def ridge_bump(th, c):
        return max(0.0, math.cos(th - c)) ** 6

    def fold_scale(th, v):
        """Flank pleats plus lateral keel swelling toward the peduncle."""
        pleat = (ridge_bump(th, 0.55) + ridge_bump(th, -0.55)
                 + ridge_bump(th, 1.05) + ridge_bump(th, -1.05)
                 + ridge_bump(th, _PI - 0.55) + ridge_bump(th, -(_PI - 0.55))
                 + ridge_bump(th, _PI - 1.05) + ridge_bump(th, -(_PI - 1.05)))
        mid = ridge_bump(th, 0.0) + ridge_bump(th, _PI)
        fade = _smooth(0.12, 0.3, v) * (1.0 - _smooth(0.78, 0.92, v))
        keel = 0.13 * _gauss(v, 0.86, 0.05)
        return 1.0 + (0.045 * pleat + 0.035 * mid) * fade + keel * mid

    def shelter_at(th, v):
        """Recessed nursery crescents sunk into the flank skin."""
        w = 0.0
        for c in _SHELTER_VS:
            for a in _SHELTER_ANGLES:
                dv = (v - c) / 0.031
                da = (th - a) / 0.16
                w = max(w, math.exp(-0.5 * (dv * dv + da * da)))
        return w

    def surf_point(th, v, k=1.0):
        z, rx, ry, cy = prof(v)
        f = fold_scale(th, v) * k
        lift = garden_lift(th, v)
        widen = 1.0 + 0.12 * lift  # basin foundations broaden the back
        recess = shelter_at(th, v)
        lip = shelter_at(th + (-0.17 if th < _PI / 2 else 0.17), v)
        return (math.cos(th) * rx * f * widen * (1.0 - 0.07 * recess),
                math.sin(th) * ry * f + cy + lift - 0.25 * recess + 0.12 * lip,
                z)

    # -- One coherent body, countershaded at the flank seam ----------------
    def back_point(u, v):
        return surf_point(u * _PI, v)

    def back_pigment(u, v):
        th = u * _PI
        reef = (math.sin(th) ** 8 * _smooth(0.18, 0.3, v)
                * (1.0 - _smooth(0.8, 0.9, v)))
        t1 = reef * 0.55
        t2 = shelter_at(th, v) * 0.75
        return tuple(
            (indigo[i] + (reef_tissue[i] - indigo[i]) * t1) * (1.0 - t2)
            + shadow[i] * t2
            for i in range(3))

    sf.sculpt_surface(parts, 'orchard-body-back', back_point, hull_mat,
                      _seg(48, mult, 10), _seg(64, mult, 12), back_pigment)
    sf.sculpt_surface(parts, 'orchard-body-keel',
                      lambda u, v: surf_point(_PI + u * _PI, v), hull_mat,
                      _seg(36, mult, 8), _seg(48, mult, 8), belly_col)

    # -- Great cradle-like pectoral shielding folds ------------------------
    for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
        def pectoral_point(u, v, side=side):
            taper = math.sqrt(max(0.0, 1.0 - u ** 1.8))  # rounded outline
            x = side * (1.55 + 3.5 * u ** 0.95)
            z_lead = -3.9 + 2.7 * u ** 1.25
            chord = 2.4 * taper + 0.001
            cup = 0.5 * math.sin(_PI * v) ** 1.5 * u ** 1.2 * taper
            rim = 0.55 * v ** 2.2 * (0.3 + 0.7 * u) * taper
            y = (-0.55 - 0.9 * u ** 1.7 + 0.3 * math.sin(_PI * u)
                 + rim - cup * 0.35)
            return (x, y, z_lead + v * chord)

        sf.sculpt_surface(parts, 'orchard-pectoral-' + tag, pectoral_point,
                          hull_mat, _seg(24, mult, 6), _seg(12, mult, 3),
                          fin_col, thickness=0.02)

    # -- Corrected forked vertical tail: rounded crescents, upper larger ---
    for up, tag in ((1.0, 'up'), (-1.0, 'down')):
        span = 2.0 if up > 0 else 1.4

        def fluke_point(u, v, up=up, span=span):
            taper = math.sqrt(max(0.0, 1.0 - u ** 1.6))
            y = up * span * u ** 1.05
            sweep = (1.6 if up > 0 else 1.2) * u ** 1.35
            chord = ((1.15 if up > 0 else 0.95) * taper
                     * (0.3 + 0.7 * math.sin(_PI * u * 0.8)) + 0.001)
            x = 0.07 * math.sin(_PI * u) * math.sin(v * _PI)
            return (x, y, 5.2 + sweep + v * chord)

        sf.sculpt_surface(parts, 'orchard-fluke-' + tag, fluke_point,
                          hull_mat, _seg(20, mult, 5), _seg(10, mult, 3),
                          fin_col, thickness=0.02)

    # -- Garden growth: everything roots through surf_point ----------------
    def fan(idx, th, v, w, hgt, lean, phase, lobes, base):
        root = surf_point(th, v, 0.97)
        yaw = phase * 0.83

        def fan_point(u, t):
            angle = (u - 0.5) * 2.65
            reach = t * (1.0 + 0.075 * math.sin(angle * lobes + phase) * t * t)
            x = w * math.sin(angle) * reach
            z = (lean * t + 0.25 * math.cos(angle * 2.4 + phase) * t * t
                 + 0.24 * t * t * t)
            ribs = 0.045 * math.cos(angle * 14) * t * (1.0 - 0.35 * t)
            return (root[0] + x * math.cos(yaw) + z * math.sin(yaw),
                    root[1] + hgt * (0.18 + 0.82 * math.cos(angle)) * reach + ribs,
                    root[2] - x * math.sin(yaw) + z * math.cos(yaw))

        def fan_pigment(u, t):
            # Review ramp multiplies the fan's base tissue colour.
            ribs = 0.06 * math.cos((u - 0.5) * 2.65 * 14)
            return (base[0] * (0.48 + t * 0.5 + ribs),
                    base[1] * (0.67 + t * 0.31 + ribs * 0.4),
                    base[2] * (0.62 + t * 0.34))

        sf.sculpt_surface(parts, 'orchard-fan.%02d' % idx, fan_point,
                          hull_mat, _seg(24, mult, 5), _seg(10, mult, 2),
                          fan_pigment, thickness=0.02)

    def ribbon(idx, th, v, hgt, lean, phase, w0, curl):
        root = surf_point(th, v, 0.985)

        def ribbon_point(u, t):
            width = (w0 * math.sin(_PI * min(1.0, 0.05 + 0.95 * t)) ** 0.6
                     * (1.0 - 0.8 * _smooth(0.65, 1.0, t)))
            sway = 0.1 * math.sin(t * 3.6 + phase) * t
            tip = curl * _smooth(0.55, 1.0, t) ** 2  # leaf tip rolls forward
            return (root[0] + (u - 0.5) * 2 * width + sway,
                    root[1] + t * hgt - 0.3 * tip * tip,
                    root[2] + lean * t + tip)

        sf.sculpt_surface(parts, 'orchard-ribbon.%02d' % idx, ribbon_point,
                          hull_mat, _seg(10, mult, 3), _seg(12, mult, 3),
                          mint, thickness=0.02)

    def coral(idx, th, v, seed, scale):
        root = surf_point(th, v, 0.985)
        hgt = (0.55 + 0.25 * _hash(seed)) * scale
        mid = (root[0] + 0.14 * (_hash(seed + 3) - 0.5),
               root[1] + hgt * 0.55,
               root[2] + 0.06 + 0.06 * _hash(seed + 2))
        top = (root[0] + 0.2 * (_hash(seed + 1) - 0.5),
               root[1] + hgt,
               root[2] + 0.14 + 0.08 * _hash(seed + 7))
        sf.sculpt_tendril(parts, 'orchard-coral.%02d-trunk' % idx,
                          [root,
                           ((root[0] + mid[0]) / 2, root[1] + hgt * 0.3,
                            (root[2] + mid[2]) / 2),
                           mid, top],
                          0.085 * scale, hull_mat, coral_col,
                          tip=0.05 * scale,
                          segments=_seg(18, mult), sides=_seg(8, mult, 3))
        if d >= 2:  # rounded crown joint — subpixel at far LODs
            sf.sculpt_sphere(parts, 'orchard-coral.%02d-crown' % idx, top,
                             (0.09 * scale, 0.085 * scale, 0.09 * scale),
                             hull_mat, coral_col, segments=_seg(8, mult))
        for s in (-1, 1):
            bh = hgt * (0.4 + 0.15 * _hash(seed + 4 + s))
            bt = (mid[0] + s * (0.22 + 0.14 * _hash(seed + 5 + s)),
                  mid[1] + bh,
                  mid[2] + 0.1 * (_hash(seed + 6 + s) - 0.3))
            stag = 'r' if s > 0 else 'l'
            sf.sculpt_tendril(parts,
                              'orchard-coral.%02d-branch-%s' % (idx, stag),
                              [mid,
                               ((mid[0] + bt[0]) / 2, mid[1] + bh * 0.6,
                                (mid[2] + bt[2]) / 2),
                               bt],
                              0.05 * scale, hull_mat, coral_col,
                              tip=0.035 * scale,
                              segments=_seg(12, mult), sides=_seg(8, mult, 3))
            if d >= 2:  # rounded branch joint — subpixel at far LODs
                sf.sculpt_sphere(parts,
                                 'orchard-coral.%02d-tip-%s' % (idx, stag),
                                 bt,
                                 (0.075 * scale, 0.07 * scale, 0.075 * scale),
                                 hull_mat, coral_col, segments=_seg(8, mult))

    # Mature reef canopy: three contiguous but distinct gardens, open
    # central channel, fans rooted at varied angles — a habitat, not flags.
    n_fan = n_ribbon = n_coral = 0
    for b_i, basin in enumerate(_BASINS):
        bv, blv = basin[0], basin[1]
        maturity = 1.12 if b_i == 1 else (1.0 if b_i == 0 else 0.85)
        for j in range(6):
            side = -1 if j % 2 == 0 else 1
            angle = _PI / 2 + side * (0.22 + 0.13 * (j % 3))
            v = bv + (j // 2 - 1) * blv * 0.62
            base = (coral_col if (j + b_i) % 4 == 0
                    else (mint if j % 3 == 0 else sage))
            fan(n_fan, angle, v,
                w=(0.88 + 0.25 * _hash(b_i * 29 + j)) * maturity,
                hgt=(1.22 + 0.48 * _hash(b_i * 43 + j + 8)) * maturity,
                lean=0.28 + 0.22 * _hash(j + b_i * 17),
                phase=b_i * 1.8 + j * 1.13,
                lobes=5 + (j % 3),
                base=base)
            n_fan += 1
        for j in range(3):
            angle = _PI / 2 + (j - 1) * 0.38
            v = bv + (0.035 if j % 2 == 0 else -0.03)
            coral(n_coral, angle, v, 17 + b_i * 37 + j * 13,
                  maturity * (1.3 + 0.2 * j))
            n_coral += 1
        for j in range(4):
            side = -1 if j % 2 == 0 else 1
            ribbon(n_ribbon,
                   _PI / 2 + side * (0.45 + 0.13 * (j // 2)),
                   bv + (j // 2 - 0.5) * blv,
                   hgt=(1.1 + 0.22 * j) * maturity,
                   w0=0.25 + 0.025 * j,
                   lean=0.38 + j * 0.08,
                   phase=b_i * 2.1 + j * 1.6,
                   curl=0.75)
            n_ribbon += 1

    # -- Sparse pearl photophores along the lower flanks (detail 1+) -------
    if d >= 1:
        for side in (1, -1):
            for r, row in enumerate((0.45, 0.8)):
                th = row if side > 0 else _PI - row
                for k in range(4):
                    v = 0.2 + (k / 3) * 0.55 + 0.02 * math.sin(k * 2.3 + r * 4)
                    s = 0.045 + 0.02 * _hash(
                        r * 31 + k * 7 + (0 if side > 0 else 3))
                    stag = 'stbd' if side > 0 else 'port'
                    sf.sculpt_sphere(
                        glow, 'orchard-light-%s-%d-%d' % (stag, r, k),
                        surf_point(th, v, 1.004), (s, s, s * 1.4),
                        glow_mat, glow_col, segments=_seg(8, mult))

    # -- Fine ventral grooves along the pearl keel (detail 1+) -------------
    if d >= 1:
        for side in (1, -1):
            for gi, th_off in enumerate((0.35, 0.62)):
                pts = []
                for s_i in range(11):
                    v = 0.14 + (s_i / 10) * 0.6
                    pts.append(surf_point(
                        _PI + side * th_off + side * 0.05 * math.sin(v * 9),
                        v, 1.003))
                stag = 'stbd' if side > 0 else 'port'
                sf.sculpt_tendril(parts,
                                  'orchard-groove-%s-%d' % (stag, gi), pts,
                                  0.014, hull_mat, dark, tip=0.01,
                                  segments=_seg(24, mult),
                                  sides=_seg(6, mult))

    # -- Gill folds, deep-set eyes, wide filter-feeding mouth seam ---------
    for side in (1, -1):
        stag = 'stbd' if side > 0 else 'port'
        if d >= 1:
            for k in range(3):
                v = (-3.4 + k * 0.42 - z_n) / length
                pts = []
                for s_i in range(7):
                    th = ((0.0 if side > 0 else _PI)
                          + side * (0.12 + (s_i / 6) * 0.55))
                    pts.append(surf_point(th, v, 1.004))
                sf.sculpt_tendril(parts,
                                  'orchard-gill-%s-%d' % (stag, k), pts,
                                  0.026, hull_mat, dark, tip=0.026,
                                  segments=_seg(16, mult),
                                  sides=_seg(6, mult))
            sf.sculpt_sphere(parts, 'orchard-eye-' + stag,
                             surf_point(0.42 if side > 0 else _PI - 0.42,
                                        (-4.35 - z_n) / length, 1.01),
                             (0.09, 0.08, 0.06), hull_mat, dark,
                             segments=_seg(10, mult))
        # Glow glint survives to lod3: keeps the eyes and the emissive join.
        sf.sculpt_sphere(glow, 'orchard-eye-glint-' + stag,
                         surf_point(0.42 if side > 0 else _PI - 0.42,
                                    (-4.35 - z_n) / length, 1.02),
                         (0.035, 0.03, 0.025), glow_mat, glow_col,
                         segments=_seg(8, mult))
    if d >= 1:
        sf.sculpt_tendril(parts, 'orchard-mouth',
                          [(-1.5, -0.62, -5.0), (-0.75, -0.7, -5.25),
                           (0.0, -0.74, -5.3), (0.75, -0.7, -5.25),
                           (1.5, -0.62, -5.0)],
                          0.05, hull_mat, dark, tip=0.05,
                          segments=_seg(24, mult), sides=_seg(6, mult))

    # -- ONE uniform fit of the complete anatomy to the class length -------
    sf.fit_sculpt(parts[p0:] + glow[g0:], l)
