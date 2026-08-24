"""Beautiful Ones Light — YOUNG REEF SHARK.

Bible §4.6 family slot: small, curious, lightly built, with a distinct
crown and a short tail. Class read is SHARK anatomy, not colour.

Envelope (driver CLASSES.light): l = 7.8, b = l*0.42, h = l*0.24.
Span band 4.08-9.52. Hull vertex aim 4 000-25 000. Glow at z = +l*0.47.

BODY PLAN
---------
One fusiform grown loft. Blunt rounded snout toward -Z. Thickest just
aft of the gill basket. Short peduncle. Heterocercal caudal meets the
driver glow as a bioluminescent wake (no nozzle). Triangular first
dorsal. Paired triangular pectorals. Tiny pelvic pair. Five gill slits
per side. Short brow crown (fewer / shorter fan than an elder).

Outline-breakers are the dorsal triangle and the heterocercal caudal,
never a diamond wing. spanZ > spanX.

Paint dual rule: indigo ROLE_HULL body, pearl ROLE_ARMOUR fins and
nacre, violet ROLE_ACCENT nerves/crown, ROLE_TRIM flow and the port
scar, ROLE_RECESS gill wells, cyan glow veins.

LOD: 3 full; 2 fewer repeats; 1 primary + hints; 0 loft + dorsal +
caudal + pectorals. Silhouette never trimmed.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import anatomy as an
from . import organs as org
from . import surface as sf


def _shark_stations(l, b, h):
    """Blunt-snout reef-shark sections. Peak girth just aft of the head."""
    z_nose = -l * 0.49
    z_stern = l * 0.442
    max_hw = b * 0.36
    max_hh = h * 0.37
    yo = 0.04
    span = z_stern - z_nose
    # t from nose, half-width scale, half-height scale, y_offset.
    # First station stays round (not a needle, not a dolphin melon).
    rings = (
        (0.00, 0.36, 0.42, yo * 0.4),
        (0.10, 0.66, 0.74, yo * 0.7),
        (0.20, 0.90, 0.94, yo),
        (0.34, 1.00, 1.00, yo),
        (0.48, 0.94, 0.92, yo * 0.9),
        (0.62, 0.74, 0.78, yo * 0.6),
        (0.76, 0.46, 0.50, yo * 0.3),
        (0.88, 0.26, 0.30, 0.0),
        (1.00, 0.14, 0.18, 0.0),
    )
    stations = []
    for t, sw, sh, yoff in rings:
        z = z_nose + t * span
        stations.append(sf.fair(z, max_hw * sw, max_hh * sh, yoff))
    return stations, z_nose, z_stern


def _top_path(stations, z0, z1, n, x=0.0, drop=0.04):
    top = sf.surf_top(stations, x=x, drop=drop)
    path = []
    n = max(2, int(n))
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + t * (z1 - z0)
        y = top(z)
        if y == 0.0:
            continue
        path.append((x, y, z))
    return path


def _seam_path(stations, z0, z1, n, side, inset=0.04):
    """Pearl/indigo join along the chamfer corner. Side is +1 or -1."""
    path = []
    n = max(2, int(n))
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + t * (z1 - z0)
        y = sf.straight_top(stations, z)
        fx = sf.flank_x(stations, z, y)
        if fx == 0.0:
            continue
        x = fx - inset
        if x <= 0.0:
            continue
        path.append((side * x, y, z))
    return path


def _flank_path(stations, z0, z1, n, y, side, inset=0.05):
    fl = sf.surf_flank(stations, y, inset=inset)
    path = []
    n = max(2, int(n))
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + t * (z1 - z0)
        x = fl(z)
        if x == 0.0:
            continue
        path.append((side * x, y, z))
    return path


def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    d = 0 if detail < 0 else (3 if detail > 3 else int(detail))
    stations, z_nose, z_stern = _shark_stations(l, b, h)
    radial = (12, 16, 22, 32)[d]

    sf.grown_loft(parts, 'living-body-reef', kit.ROLE_HULL,
                  stations, hull_mat, radial=radial)

    z_gill0 = z_nose + (z_stern - z_nose) * 0.16
    z_gill1 = z_nose + (z_stern - z_nose) * 0.30
    z_pec = z_nose + (z_stern - z_nose) * 0.34
    z_dorsal = z_nose + (z_stern - z_nose) * 0.46
    z_pelvic = z_nose + (z_stern - z_nose) * 0.60
    z_brow = z_nose + (z_stern - z_nose) * 0.08

    _hw_p, _hh_p, yo_p, _ch_p = sf.section(stations, z_pec)
    y_pec = yo_p - 0.10
    fx_pec = sf.flank_x(stations, z_pec, y_pec)
    pec_span = 1.18
    pec_chord = 0.92
    pec_drop = 0.22
    pec_sweep = 0.32

    y_dorsal_root = sf.top_y(stations, z_dorsal, 0.0) - 0.08
    dorsal_root = (0.0, y_dorsal_root, z_dorsal)
    dorsal_tip = (0.0, y_dorsal_root + 0.92, z_dorsal + 0.16)
    an.shark_dorsal(parts, 'fin-dorsal', hull_mat, dorsal_root, dorsal_tip,
                    0.98, thick=0.14, detail=d)

    _hw_s, _hh_s, yo_s, _ch_s = sf.section(stations, z_stern)
    peduncle = (0.0, yo_s, z_stern - 0.06)
    upper_tip = (0.0, yo_s + 1.02, z_stern + 0.20)
    lower_tip = (0.0, yo_s - 0.58, z_stern + 0.12)
    an.shark_caudal(parts, 'fin-caudal', hull_mat, peduncle, upper_tip,
                    lower_tip, 0.52, thick=0.12, detail=d)

    for side, tag in ((1.0, 's'), (-1.0, 'p')):
        if fx_pec == 0.0:
            continue
        root = (side * (fx_pec - 0.12), y_pec, z_pec)
        tip = (side * (fx_pec + pec_span), y_pec - pec_drop, z_pec + pec_sweep)
        an.shark_pectoral(parts, 'fin-pectoral-%s' % tag, hull_mat, root, tip,
                          pec_chord, tip_chord=0.16, thick=0.12, detail=d)

    if d < 1:
        return

    _hw_g, _hh_g, yo_g, _ch_g = sf.section(stations, (z_gill0 + z_gill1) * 0.5)
    y_gill = yo_g - 0.06
    gill_surf = sf.surf_flank(stations, y_gill, inset=0.0)
    for side, tag in ((1.0, 's'), (-1.0, 'p')):
        an.gill_slits(parts, 'living-gill-%s' % tag, hull_mat,
                      z_gill0, z_gill1, gill_surf, y_gill, side=side,
                      count=5, height=0.34, detail=d)

    _hw_v, _hh_v, yo_v, _ch_v = sf.section(stations, z_pelvic)
    y_pelvic = yo_v - 0.16
    fx_v = sf.flank_x(stations, z_pelvic, y_pelvic)
    if fx_v != 0.0:
        for side, tag in ((1.0, 's'), (-1.0, 'p')):
            root = (side * (fx_v - 0.08), y_pelvic, z_pelvic)
            tip = (side * (fx_v + 0.36), y_pelvic - 0.10, z_pelvic + 0.12)
            an.shark_pectoral(parts, 'fin-pelvic-%s' % tag, hull_mat, root, tip,
                              0.36, tip_chord=0.10, thick=0.10, detail=d)

    scar_n = 4 if d >= 2 else 2
    scar = _flank_path(stations, z_pec + 0.15, z_pelvic + 0.10, scar_n,
                       y_pec + 0.08, -1.0, inset=0.03)
    if len(scar) >= 2:
        an.healed_scar(parts, 'living-scar-port', hull_mat, scar,
                       thick=0.08, detail=d, role=kit.ROLE_TRIM)
