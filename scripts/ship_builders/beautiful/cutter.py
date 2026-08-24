"""Beautiful Ones Cutter — HAMMERHEAD GUARDIAN.

Bible §4.6: "A social, maneuverable adult with cradle-like grasping fins,
gentle docking folds, and a protected belly chamber for rescue or transfer.
It should look capable of holding without mauling."

Body plan: adult HAMMERHEAD SHARK, not a scaled reef shark and not a manta.
One fusiform grown loft, longer and thicker than the light wayfinder, with
a CEPHALOFOIL that breaks the outline at the brow. Head stations flare
wide and stay flat; paired nacre lobes on ±X finish the T-bar. Extra beam
at the brow is >= 15 % of hull length versus the thorax. Travel axis is
-Z (nose / foil) to +Z (tail into the wake glow at z = +l*0.47).

Anatomy:
- triangular dorsal (an.shark_dorsal)
- heterocercal caudal (an.shark_caudal)
- thick pectorals that cup inward (an.shark_pectoral) for boarding
- five gill slits per side (an.gill_slits)
- open ventral belly chamber (org.belly_chamber) under the thorax
- soft docking lips, no teeth, no upper jaw
- moderate sensory crown along the cephalofoil leading edge
- pearl back, indigo flanks, one port-forward healed scar

Envelope (driver): l = 11.0, b = l*0.48 = 5.28, h = l*0.30 = 3.30.
Span band [6.60, 15.40]. Vertex aim 6 000-47 000. Hammer beam is allowed
(Beautiful minBeamOverLength 0.35).

LOD ladder
----------
detail=3  full: five gills, foil-edge nacre, two tip crowns, veins, scar,
          docking lips, muscle folds, flow lines.
detail=2  fewer repeats (organs thin themselves).
detail=1  primary masses plus chamber hint, gills, crown, scar, lips.
detail=0  loft, hammer, dorsal, caudal, pectorals. Silhouette never trims.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import anatomy as an
from . import organs as org
from . import surface as sf


# ===========================================================================
# STATION LISTS
# ===========================================================================

def _cutter_stations(l, b, h):
    """Fusiform adult shark with a short wide cephalofoil at the brow.

    The foil is a T-bar, not a manta diamond: half-beam peaks in a short
    Z-run at the head, then snaps in at the neck. Thorax half-beam is the
    fusiform body. Tail tapers to the wake glow at l*+0.47.

    At l=11, b=5.28: foil half-beam b*0.520 = 2.75 (beam 5.49); thorax
    half-beam b*0.298 = 1.57 (beam 3.15). Extra brow beam = 2.34 = 0.213*l
    before the nacre lobes. Foil is flat (half-height h*0.10); the body is
    deep (half-height h*0.286).
    """
    return [
        # -- CEPHALOFOIL: wide, flat, short in Z (the hammer) --
        sf.fair(l * -0.478, b * 0.388, h * 0.068, h * 0.058),
        sf.fair(l * -0.452, b * 0.486, h * 0.088, h * 0.064),
        sf.fair(l * -0.418, b * 0.520, h * 0.100, h * 0.066),  # max foil
        sf.fair(l * -0.388, b * 0.470, h * 0.108, h * 0.055),
        sf.fair(l * -0.352, b * 0.318, h * 0.130, h * 0.036),
        # -- NECK: rapid constriction into the fusiform trunk --
        sf.fair(l * -0.305, b * 0.228, h * 0.182, h * 0.018),
        sf.fair(l * -0.248, b * 0.250, h * 0.224, h * 0.008),
        # -- THORAX: adult girth, longer than the light reef shark --
        sf.fair(l * -0.175, b * 0.286, h * 0.268, 0.0),
        sf.fair(l * -0.095, b * 0.298, h * 0.286, 0.0),  # max body
        sf.fair(l * -0.010, b * 0.286, h * 0.272, 0.0),
        sf.fair(l *  0.085, b * 0.252, h * 0.236, 0.0),
        sf.fair(l *  0.170, b * 0.206, h * 0.188, 0.0),
        # -- TAIL: long even taper into the wake --
        sf.fair(l *  0.255, b * 0.148, h * 0.136, 0.0),
        sf.fair(l *  0.340, b * 0.090, h * 0.088, 0.0),
        sf.fair(l *  0.410, b * 0.046, h * 0.052, 0.0),
        sf.fair(l *  0.462, b * 0.016, h * 0.028, 0.0),  # tail tip
    ]


def _pearl_stations(stations, l):
    """Narrow pearl dorsum. Not a manta crest, not a full-beam cap."""
    profile = (
        (l * -0.300, 0.22, 0.08),
        (l * -0.200, 0.34, 0.12),
        (l * -0.090, 0.42, 0.14),
        (l *  0.020, 0.40, 0.13),
        (l *  0.140, 0.32, 0.10),
        (l *  0.250, 0.22, 0.07),
        (l *  0.340, 0.14, 0.04),
    )
    bury = 0.20
    out = []
    for z, hw, proud in profile:
        ty = sf.top_y(stations, z)
        hh = (proud + bury) * 0.5
        yo = ty + (proud - bury) * 0.5
        out.append(sf.fair(z, hw, hh, yo))
    return out


# ===========================================================================
# SURFACE PATHS
# ===========================================================================

def _pearl_foot(stations, pearl, side, z0, z1, n):
    """Points along the indigo/pearl boundary at the dorsum foot."""
    pts = []
    for i in range(n):
        z = z0 + (z1 - z0) * i / (n - 1.0)
        x = sf.section(pearl, z)[0] + 0.04
        y = sf.top_y(stations, z, x) + 0.02
        if i == 0 or i == n - 1:
            y -= 0.12
        pts.append((side * x, y, z))
    return pts


def _flank_welt(stations, side, samples):
    """Port or starboard flank path from (z, y) samples. Ends buried."""
    pts = []
    for z, y in samples:
        fx = sf.flank_x(stations, z, y)
        if fx <= 0.05:
            continue
        x = fx + 0.02
        if not pts or (z, y) == samples[-1]:
            x -= 0.14
        pts.append((side * x, y, z))
    return pts


def _gill_y(stations, z0, z1):
    """Mid-flank height for the gill row, from the local section."""
    z = 0.5 * (z0 + z1)
    _, hh, yo, _ = sf.section(stations, z)
    return yo - hh * 0.10


# ===========================================================================
# BUILD
# ===========================================================================

def build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones hammerhead guardian (cutter class).

    parts    -- ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS / ROLE_TRIM / ROLE_ACCENT
    glow     -- emissive objects (skin_role='glow')
    l, b, h  -- driver envelope (11.0, 5.28, 3.30)
    detail   -- 3 full, 2 thinned, 1 primary+chamber, 0 silhouette masses
    """
    stations = _cutter_stations(l, b, h)
    pearl = _pearl_stations(stations, l)

    z_foil = l * -0.418
    z_pec = l * -0.018
    z_dorsal = l * 0.055
    z_ped = l * 0.348
    z_chamber = l * -0.088
    z_gill0 = l * -0.230
    z_gill1 = l * -0.068

    # -- GROWN BODY (always) ------------------------------------------------
    sf.grown_loft(parts, 'cutter.hull', kit.ROLE_HULL, stations, hull_mat,
                  radial=28)

    # -- PEARL DORSUM (always) — narrow adult back, not a manta cap --------
    sf.grown_loft(parts, 'living-body-cutter.pearl', kit.ROLE_ARMOUR,
                  pearl, hull_mat, radial=12)

    # -- CEPHALOFOIL LOBES (always) — T-bar muscle on ±X, not wings --------
    hw_f, hh_f, yo_f, _ = sf.section(stations, z_foil)
    segs = 14 if detail >= 2 else 10
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        kit.sphere(parts, 'living-hammer-cutter.tip.' + tag, kit.ROLE_ARMOUR,
                   (side * (hw_f - 0.16), yo_f, z_foil),
                   (hw_f * 0.34, hh_f * 0.92, l * 0.048),
                   hull_mat, segments=segs)
        kit.sphere(parts, 'living-hammer-cutter.bar.' + tag, kit.ROLE_ARMOUR,
                   (side * (hw_f * 0.68), yo_f + hh_f * 0.18, z_foil + l * 0.006),
                   (hw_f * 0.24, hh_f * 0.72, l * 0.038),
                   hull_mat, segments=segs)

    # -- DORSAL (always) — triangular shark blade --------------------------
    ty_d = sf.top_y(stations, z_dorsal)
    an.shark_dorsal(parts, 'fin-dorsal-cutter', hull_mat,
                    (0.0, ty_d - 0.16, z_dorsal),
                    (0.0, ty_d + h * 0.50, z_dorsal + l * 0.016),
                    root_chord=l * 0.118, thick=h * 0.055, detail=detail)

    # -- CAUDAL (always) — heterocercal, upper lobe into the wake ----------
    _, _, yo_p, _ = sf.section(stations, z_ped)
    an.shark_caudal(parts, 'fin-caudal-cutter', hull_mat,
                    (0.0, yo_p, z_ped),
                    (0.0, yo_p + h * 0.34, l * 0.454),
                    (0.0, yo_p - h * 0.20, l * 0.410),
                    root_chord=l * 0.072, thick=h * 0.042, detail=detail)

    # -- PECTORALS (always) — thick roots, inward cup, not a tooth row -----
    _, hh_p, yo_pec, _ = sf.section(stations, z_pec)
    y_pec = yo_pec - hh_p * 0.22
    fx_p = sf.flank_x(stations, z_pec, y_pec)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        root = (side * (fx_p - 0.22), y_pec, z_pec)
        tip = (side * (b * 0.465), y_pec - h * 0.30, z_pec + l * 0.048)
        an.shark_pectoral(parts, 'fin-pectoral-cutter.' + tag, hull_mat,
                          root, tip,
                          root_chord=l * 0.142, tip_chord=l * 0.052,
                          thick=h * 0.100, detail=detail)
        kit.sphere(parts, 'living-pectoral-cutter.root.' + tag,
                   kit.ROLE_ARMOUR,
                   (side * (fx_p - 0.06), y_pec, z_pec),
                   (l * 0.038, h * 0.085, l * 0.048),
                   hull_mat, segments=segs)
        mid = sf.span_ray(root, tip)(0.82)
        kit.sphere(parts, 'living-pectoral-cutter.curl.' + tag,
                   kit.ROLE_ARMOUR,
                   (mid[0] - side * 0.12, mid[1] - 0.08, mid[2]),
                   (l * 0.030, h * 0.072, l * 0.034),
                   hull_mat, segments=segs)

    if detail < 1:
        return

    # -- BELLY CHAMBER (detail 1+) — open round hold, no jaw ---------------
    by = sf.bottom_y(stations, z_chamber)
    pouch = (b * 0.380, h * 0.340, l * 0.148)
    hy = pouch[1] * 0.5
    loc_ch = (0.0, by + 0.14 - hy, z_chamber)
    org.belly_chamber(parts, glow, 'cutter', hull_mat, glow_mat,
                      loc_ch, pouch, detail=detail)

    # -- GILL SLITS (detail 1+) — five per side ----------------------------
    y_gill = _gill_y(stations, z_gill0, z_gill1)
    gill_surf = sf.surf_flank(stations, y_gill)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        an.gill_slits(parts, 'cutter.gills.' + tag, hull_mat,
                      z_gill0, z_gill1, gill_surf, y_gill,
                      side=side, count=5, height=0.42, detail=detail)

    # -- ONE ASYMMETRY: port-forward scar (detail 1+) ----------------------
    _, hh_s, yo_s, _ = sf.section(stations, l * -0.210)
    scar = _flank_welt(stations, -1.0, (
        (l * -0.268, yo_s + hh_s * 0.22),
        (l * -0.220, yo_s + hh_s * 0.05),
        (l * -0.172, yo_s - hh_s * 0.12),
        (l * -0.128, yo_s - hh_s * 0.04),
    ))
    if len(scar) >= 2:
        an.healed_scar(parts, 'cutter.scar.port', hull_mat, scar,
                       thick=0.09, detail=detail)
