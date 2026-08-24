"""Beautiful Ones Heavy — HUMPBACK WHALE SHIELDBACK.

Bible §4.6: "A mature defender with a dense central body, layered muscular
mantles, broad shielding fins, and luminous threat displays. Weapons should
read as focused biological energy or symbiotic organs, never barrels."

Body plan (wave 106): a HUMPBACK WHALE, not a manta, not a shark, not a
blue whale. Dense cetacean fusiform. Blunt head toward -Z. Deep chest.
Thickest in the thorax. Long tapering tail into a HORIZONTAL fluke
(an.whale_fluke). LONG pectorals (an.whale_pectoral style='humpback') are
the outline-breaker: whale flippers, mid-flank roots, far reach, slight
droop, rounded paddle tips, span >= 15 % of hull length. Soft dorsal_ridge
(not a shark triangle). Blowhole on the crown plus grown-lip vents. Overlap
dorsal_mantles as whale muscle. Ventral pouch under the thorax. Low
watchful crown. One port-aft scar. Threat-display veins in pectoral roots
and mantle folds.

Thumbnail read: bulky body, long thin pectorals, horizontal fluke.

Envelope (driver CLASSES): l = 17.0, b = l*0.52, h = l*0.34.
Span band [10.20, 23.80]. Vertex aim 9000-78000. maxHeightOverLength 0.60.
Glow at z = +l*0.47 is wake. Stern tapers short of that sphere.

LOD
---
detail=3  full: veins, pads, crown, vents, scar, flow.
detail=2  fewer pads / veins (primitives count down).
detail=1  masses + fluke + pectorals (mantles, pouch, blowhole).
detail=0  loft + fluke + pectorals + ridge. Silhouette never trimmed.

Paint dual rule (out/w106/foundation/notes.md): role tag AND name selector.
No kit.box, no windows, no nozzles, no turrets.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import anatomy as an
from . import organs as org
from . import surface as sf


# ===========================================================================
# STATIONS — dense cetacean fusiform
# ===========================================================================

def _heavy_stations(l, b, h):
    """Blunt-head whale loft. Thickest in the thorax. Tail dies at the wake.

    Near-ellipse sections. Nose droops. Chest is deep and round. Stern
    station sits short of z = +l*0.47 so the driver glow reads as wake.
    Half-beam and half-height come from the class envelope so the body
    stays bulky (humpback), not a blue-whale needle.
    """
    hw = b * 0.440
    hh = h * 0.498
    return [
        # -- HEAD: blunt, slightly downturned, never a needle --
        sf.fair(l * -0.445, hw * 0.10, hh * 0.20, hh * -0.18),
        sf.fair(l * -0.405, hw * 0.28, hh * 0.38, hh * -0.12),
        sf.fair(l * -0.355, hw * 0.52, hh * 0.58, hh * -0.04),
        sf.fair(l * -0.295, hw * 0.74, hh * 0.76, hh *  0.04),
        sf.fair(l * -0.230, hw * 0.88, hh * 0.90, hh *  0.08),
        # -- THORAX: deep chest, the thickest station --
        sf.fair(l * -0.145, hw * 0.98, hh * 0.98, hh *  0.10),
        sf.fair(l * -0.070, hw * 1.00, hh * 1.00, hh *  0.10),
        sf.fair(l *  0.020, hw * 0.96, hh * 0.94, hh *  0.08),
        sf.fair(l *  0.110, hw * 0.88, hh * 0.84, hh *  0.05),
        sf.fair(l *  0.200, hw * 0.76, hh * 0.72, hh *  0.02),
        # -- TAIL: long taper into the fluke peduncle --
        sf.fair(l *  0.280, hw * 0.60, hh * 0.56, hh *  0.00),
        sf.fair(l *  0.345, hw * 0.44, hh * 0.42, hh * -0.02),
        sf.fair(l *  0.395, hw * 0.30, hh * 0.28, hh * -0.03),
        sf.fair(l *  0.430, hw * 0.18, hh * 0.18, hh * -0.03),
        sf.fair(l *  0.452, hw * 0.10, hh * 0.10, hh * -0.02),
        sf.fair(l *  0.462, hw * 0.05, hh * 0.055, hh * -0.01),
    ]


def _flank_run(stations, side, z0, z1, n, y0, y1, inset=0.14):
    """Points along one flank. Skip stations that have fallen away."""
    pts = []
    steps = max(2, int(n))
    for i in range(steps):
        t = i / (steps - 1.0)
        z = z0 + (z1 - z0) * t
        y = y0 + (y1 - y0) * t
        fx = sf.flank_x(stations, z, y)
        if fx <= 0.06:
            continue
        x = fx - inset
        if x <= 0.04:
            continue
        pts.append((side * x, y, z))
    return pts


def _pectoral_anchors(stations, l, side):
    """Mid-flank root inside the hull; far drooped paddle tip.

    Root uses flank_x at the local straight-flank height. Tip is the
    outline-breaker: long thin reach, slight drop, modest aft sweep.
    """
    z_root = l * -0.070
    st = sf.straight_top(stations, z_root)
    sb = sf.straight_bottom(stations, z_root)
    y_root = sb + (st - sb) * 0.40
    fx = sf.flank_x(stations, z_root, y_root)
    root = (side * (fx - 0.38), y_root, z_root)
    tip = (side * (l * 0.372), y_root - l * 0.095, z_root + l * 0.255)
    return root, tip


def _pectoral_vein_tips(root, tip, count):
    """Threat-display tips along the paddle upper face."""
    ray = sf.span_ray(root, tip)
    tips = []
    n = max(1, int(count))
    for i in range(n):
        t = 0.10 + (0.58 * i / max(1.0, n - 1.0))
        px, py, pz = ray(t)
        tips.append((px, py + 0.07, pz))
    return tips


# ===========================================================================
# BUILD
# ===========================================================================

def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones heavy as a humpback-whale shieldback.

    parts    -- ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS / ROLE_TRIM / ROLE_ACCENT.
    glow     -- emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height (17.0, 8.84, 5.78).
    detail   -- 3 full, 2 fewer repeats, 1 masses, 0 primary silhouette.
    """
    H = kit.ROLE_HULL

    stations = _heavy_stations(l, b, h)
    radial = 28 if detail >= 3 else (20 if detail == 2 else (16 if detail == 1 else 12))

    # ── PRIMARY MASS: grown whale body (always) ──────────────────────────
    sf.grown_loft(parts, 'heavy-body', H, stations, hull_mat, radial=radial)

    # ── PRIMARY MASS: long humpback pectorals (always — outline-breaker)
    # Whale flippers, not manta wings: modest chord, long span, mid-flank
    # burial, drooped rounded tips. Span is ~0.32 * l.
    root_chord = l * 0.095
    tip_chord = l * 0.022
    pec_thick = l * 0.012
    pec_roots = {}
    pec_tips = {}
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        root, tip = _pectoral_anchors(stations, l, side)
        pec_roots[tag] = root
        pec_tips[tag] = tip
        an.whale_pectoral(parts, 'fin-pectoral-' + tag, hull_mat,
                          root, tip, root_chord, tip_chord=tip_chord,
                          thick=pec_thick, style='humpback', detail=detail)

    # ── PRIMARY MASS: horizontal fluke (always — whale, not shark) ───────
    z_ped = l * 0.418
    yo_ped = sf.section(stations, z_ped)[2]
    peduncle = (0.0, yo_ped, z_ped)
    an.whale_fluke(parts, 'heavy-fluke', hull_mat, peduncle,
                   span=l * 0.34, chord=l * 0.118, thick=l * 0.013,
                   detail=detail)

    # ── PRIMARY MASS: soft dorsal ridge (always — not a shark triangle) ──
    an.dorsal_ridge(parts, 'body-ridge', hull_mat,
                    l * 0.040, l * 0.230, sf.surf_top(stations, 0.0, 0.02),
                    x=0.0, height=0.28, detail=detail)

    if detail < 1:
        return

    # ── MASSES: overlapping whale muscle on the back ─────────────────────
    mz = l * -0.080
    my = sf.top_y(stations, mz, 0.0) - 0.20
    org.dorsal_mantles(parts, 'heavy', hull_mat, (0.0, my, mz),
                       (b * 0.50, h * 0.26, l * 0.30), count=3, seed=9,
                       detail=detail)

    # ── MASS: protected ventral pouch under the thorax ───────────────────
    pz = l * -0.055
    by = sf.bottom_y(stations, pz, 0.0)
    pouch_h = h * 0.24
    pouch_y = by - pouch_h * 0.5 + 0.22
    org.belly_chamber(parts, glow, 'heavy', hull_mat, glow_mat,
                      (0.0, pouch_y, pz),
                      (b * 0.28, pouch_h, l * 0.22),
                      detail=detail)

    # ── Blowhole on the crown of the head ────────────────────────────────
    bz = l * -0.330
    by_bh = sf.top_y(stations, bz, 0.0)
    an.blowhole(parts, glow, 'heavy-blowhole', hull_mat, glow_mat,
                (0.0, by_bh, bz), radius=0.30, detail=detail, seed=21)

    if detail < 2:
        return

    # ── ONE port-aft scar (bible rule 8) ─────────────────────────────────
    z_fold = l * -0.090
    st_f = sf.straight_top(stations, z_fold)
    sb_f = sf.straight_bottom(stations, z_fold)
    fold_y = sb_f + (st_f - sb_f) * 0.70
    y_s0 = fold_y - 0.10
    y_s1 = fold_y - 0.55
    welt = _flank_run(stations, -1.0, l * 0.090, l * 0.210, 5,
                      y_s0, y_s1, inset=0.08)
    if len(welt) >= 2:
        an.healed_scar(parts, 'heavy-scar-port', hull_mat, welt,
                       thick=0.09, detail=detail)
