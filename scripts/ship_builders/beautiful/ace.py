"""Beautiful Ones Ace — HUNTING SQUID.

Bible §4.6: a taut, fast adult with a narrow frontal area, bright nerve
lines, and controlled asymmetry from healed experience. Propulsion is a
whole-body traveling wave. The class read is a squid dart, not a manta
and not an octopus.

Body plan
---------
One fusiform mantle loft, pointed toward -Z, thickest in the forward
third, tapering aft into a head collar. Rhomboid mantle fins sit at the
AFT of the mantle (not mid-body). Eight arms leave a tight ventral
bundle at the head and trail toward +Z. Two longer feeding tentacles
tuck along the bundle; clubs reach the driver glow. A ventral siphon
is the jet. Thumbnail: tubular mantle + rear diamond fins + arm bundle.

Envelope (driver): l = 7.2, b = l*0.40 = 2.88, h = l*0.20 = 1.44.
Span band [4.32, 10.08]. Longer than wide (spanZ > spanX). Vertex aim
4 000-21 000. Authored spanZ ~8.82 (nose to stbd club), so ace sits
above light 8.5 and below cutter 11.0. Glow at z = +l*0.47; arm and
tentacle tips dissolve into that wake.

LOD ladder
----------
detail=3  full arms, suckers, concentrated vein fans, crown, scar.
detail=2  fewer suckers and vein branches (anatomy thins repeats).
detail=1  mantle + fins + arm masses; organ hints.
detail=0  mantle + fins + arm tubes. Silhouette is never trimmed.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf
from . import anatomy as an
from . import organs as org


def _mantle_stations(l, b, h):
    """Fusiform mantle, pointed at -Z, collar kept open at the head.

    Peak girth sits in the forward third. Aft stations are lifted so the
    mantle does not collapse to a second point — that collar is the head
    the arms grow from. Nose at -l*0.642 is the -Z stop of the envelope.
    Half-extents stay well inside class beam; the rhomboid fins carry
    spanX, kept narrower than the body length.
    """
    z_nose = -l * 0.642
    z_head = l * 0.100
    max_hw = min(0.64, b * 0.22)
    max_hh = min(0.52, h * 0.38)
    raw = an.fusiform_stations(z_nose, z_head, max_hw, max_hh,
                               y_offset=0.05, peak_t=0.28, n=11)
    out = []
    n = len(raw)
    for i, (z, hw, hh, yo, _ch) in enumerate(raw):
        t = i / (n - 1.0)
        if t >= 0.70:
            u = (t - 0.70) / 0.30
            hw = max(hw, 0.24 + 0.14 * u)
            hh = max(hh, 0.20 + 0.12 * u)
        out.append(sf.fair(z, hw, hh, yo))
    return out


def _head_stations(stations, z_hub):
    """Pearl head collar overlapping the open mantle. Buried into indigo."""
    out = []
    for z, pull, hh, bury in (
        (z_hub - 0.28, 0.04, 0.22, 0.16),
        (z_hub + 0.02, 0.02, 0.24, 0.14),
        (z_hub + 0.32, 0.06, 0.18, 0.12),
    ):
        _hw, _hh, yo, _ch = sf.section(stations, z)
        hw = sf.flank_x(stations, z, yo) - pull
        if hw <= 0.10:
            continue
        by = sf.bottom_y(stations, z)
        out.append(sf.fair(z, hw, hh, by + bury + hh * 0.15))
    return out


def _inboard(stations, side, z, y, inset=0.10):
    """One point inside the flank, or None when the section has fallen away."""
    fx = sf.flank_x(stations, z, y)
    if fx <= 0.0:
        return None
    return (side * max(0.04, fx - inset), y, z)


def _flank_path(stations, side, pairs, inset=0.04, bury=0.12):
    """Flank polyline from (z, y) pairs. Ends pull inboard to bury."""
    pts = []
    for z, y in pairs:
        p = _inboard(stations, side, z, y, inset=inset)
        if p is None:
            continue
        pts.append(p)
    if len(pts) < 2:
        return []
    x0, y0, z0 = pts[0]
    pts[0] = (x0 * 0.45, y0, z0)
    x1, y1, z1 = pts[-1]
    pts[-1] = (x1 * 0.45, y1 - bury * 0.3, z1)
    return pts


def _dorsal_path(stations, z0, z1, n=6, proud=0.02):
    """Centreline path on the mantle crown. Ends drop into the solid."""
    pts = []
    for i in range(n):
        z = z0 + (z1 - z0) * i / (n - 1.0)
        y = sf.top_y(stations, z, 0.0)
        pts.append((0.0, y + proud, z))
    if len(pts) >= 2:
        x, y, z = pts[0]
        pts[0] = (x, y - 0.12, z)
        x, y, z = pts[-1]
        pts[-1] = (x, y - 0.12, z)
    return pts


def _hub(stations, z_hub):
    """Arm-root hub inside the ventral head collar."""
    by = sf.bottom_y(stations, z_hub)
    _hw, _hh, yo, _ch = sf.section(stations, z_hub)
    return (0.0, (by + yo) * 0.5 - 0.04, z_hub)


def _arm_layout(hub, z_arm, z_tent, z_tent_port):
    """Eight tight trailing arms plus two feeding tentacles.

    Roots sit in a small ventral oval at the head. Tips trail toward +Z
    with a modest spread — a travel bundle, not a radial sunburst.
    """
    hx, hy, hz = hub
    arms = []
    for i in range(8):
        ang = 2.0 * math.pi * (i + 0.5) / 8.0
        dx = 0.20 * math.cos(ang)
        dy = 0.11 * math.sin(ang) - 0.07
        root = (hx + dx, hy + dy, hz + 0.05)
        tip_z = z_arm - 0.10 * (i % 3)
        tip = (hx + dx * 2.05, hy + dy * 1.7 - 0.18, tip_z)
        arms.append((i, root, tip, dx, dy))
    tents = (
        ('stbd', (hx + 0.15, hy - 0.03, hz + 0.10),
         (hx + 0.46, hy - 0.22, z_tent), 0.20),
        ('port', (hx - 0.15, hy - 0.03, hz + 0.10),
         (hx - 0.34, hy - 0.10, z_tent_port), 0.14),
    )
    return arms, tents


def _scar_path(stations):
    """Healed welt on the port mantle, diagonal toward the short tentacle."""
    raw = ((-1.10, 0.10, True), (-0.55, 0.02, False),
           (0.05, -0.08, False), (0.50, -0.14, True))
    pts = []
    for z, y, is_end in raw:
        fx = sf.flank_x(stations, z, y)
        if fx <= 0.0:
            continue
        x = fx - 0.14 if is_end else fx + 0.01
        pts.append((-x, y, z))
    return pts


def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones hunting squid (ace class).

    parts    -- ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS / ROLE_TRIM / ROLE_ACCENT.
    glow     -- emissive objects with skin_role 'glow'.
    l, b, h  -- class length, beam, height from the driver (7.2, 2.88, 1.44).
    detail   -- 3 full / 2 thinned repeats / 1 masses + hints / 0 tubes.
    """
    stations = _mantle_stations(l, b, h)
    z_glow = l * 0.47
    z_hub = l * 0.100
    z_fin = l * 0.042
    hub = _hub(stations, z_hub)

    # ── PRIMARY MASSES (always) — silhouette is never trimmed ───────────
    sf.grown_loft(parts, 'ace.hull', kit.ROLE_HULL, stations, hull_mat,
                  radial=28)

    head = _head_stations(stations, z_hub)
    if len(head) >= 2:
        sf.grown_loft(parts, 'living-head-ace', kit.ROLE_ARMOUR, head,
                      hull_mat, radial=20)

    # Rhomboid pair at the AFT mantle. loc is on the axis, buried.
    _fhw, _fhh, yo_fin, _fch = sf.section(stations, z_fin)
    # Aft diamond pair, not a mid-body cross. Span stays under the
    # mantle length so the thumbnail reads pointed body + arm bundle.
    an.squid_mantle_fins(parts, 'ace-mantle', hull_mat,
                         (0.0, yo_fin, z_fin),
                         span=1.54, chord=1.14, thick=0.15, detail=detail)

    # Stbd club at z_glow+0.585 plus club_r*1.15 (~0.23) is the +Z stop.
    # Port tentacle stays short (healed). Arms trail shy of the clubs.
    arms, tents = _arm_layout(hub, z_glow - 0.18, z_glow + 0.585, z_glow - 0.82)
    for i, root, tip, dx, dy in arms:
        inn = (-dx, 0.35, 0.0)
        an.squid_arm(parts, 'living-ace-arm-%d' % i, hull_mat,
                     root, tip, root_r=0.145, tip_r=0.065,
                     suckers=False, inward=inn, detail=detail)

    for tag, root, tip, club_r in tents:
        inn = (-1.0 if tag == 'stbd' else 1.0, 0.25, 0.0)
        an.feeding_tentacle(parts, 'living-ace-tentacle-%s' % tag, hull_mat,
                            root, tip, root_r=0.11, club_r=club_r,
                            suckers=False, inward=inn, detail=detail)

    # Jet: buried in the ventral mantle, aiming aft and slightly down.
    z_siphon = -l * 0.04
    by = sf.bottom_y(stations, z_siphon)
    an.siphon(parts, 'ace-siphon', hull_mat,
              (0.0, by + 0.14, z_siphon),
              length=0.72, radius=0.15, aim=(0.0, -0.22, 1.0),
              detail=detail)

    if detail < 1:
        return

    # ── ORGAN HINTS (detail 1+) ─────────────────────────────────────────
    # One injury: shortened port tentacle (layout) plus this port welt.
    scar = _scar_path(stations)
    if len(scar) >= 2:
        an.healed_scar(parts, 'ace-scar-port', hull_mat, scar,
                       thick=0.08, detail=detail)
