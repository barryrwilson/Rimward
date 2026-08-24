"""Beautiful Ones Freighter - BLUE-WHALE GARDENBACK.

Bible §4.6: "A colossal living carrier whose back and ventral folds support
symbiotic gardens, nursery hollows, and sheltered companion spaces. Slow
breathing must travel across separate body regions. Its body should dwarf
stations' ordinary berths and accept external cradle branches rather than
enter a hangar."

Body plan — a COLOSSAL elongate blue whale, not a humpback and not a manta:

- ONE grown fusiform loft ('body-main'), extreme length, relatively small
  head toward -Z, long torso, long tail. Tail tip at z = l*+0.462 so the
  driver glow at z = l*+0.47 reads as a vast bioluminescent wake.
- TINY pectorals: an.whale_pectoral style='blue'. HUGE HORIZONTAL fluke:
  an.whale_fluke. Soft an.dorsal_ridge only — never a shark triangle.
- Blunt-to-slightly-pointed head. Ventral throat grooves are nacre pads
  on the forward belly. an.blowhole plus org.breathing_vents in the
  calm gaps between gardens.
- THREE SEPARATED dorsal garden biomes. Each biome is a pearl mass loft
  on the whale back (primary mass at every LOD) plus org.garden_fold.
  Breathing gaps stay bare. Gardens sit ON the silhouette; they do not
  replace it.
- Flank nursery / sanctuary hollows with nested companions. One great
  belly_chamber for transfer. Free companions give scale.
- Ancient sensory crown. ONE port healed scar.

Envelope (driver): l = 85.0, b = l*0.55 = 46.75, h = l*0.30 = 25.5.
Authored largest-dimension target ~78 (spanZ, nose to tail tip). SHIP_SCALE
freighter span band [66.00, 109.20]. Hull vertex aim [34000, 154000].
minLengthOverBeam 1.05. maxHeightOverLength 0.62. beam/length >= 0.16.
Freighter is the only class with lod3 (detail=0).

LOD ladder
----------
detail=3  full gardens, hollows, nested and free companions, vents,
          throat grooves, crown, scar, veins, flow.
detail=2  fewer repeats (hollows, occupants, vents, folds, veins).
detail=1  primary masses + garden_fold hint + a few hollows/vents.
detail=0  loft + fluke + tiny pectorals + garden masses + ridge +
          throat mass + belly chamber. Silhouette never trimmed.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import anatomy as an
from . import organs as org
from . import surface as sf


# Garden biomes: (tag, z0_frac, z1_frac, seed). Calm gaps live between.
_GARDENS = (
    ('fore', -0.195, -0.055, 21),
    ('mid',   0.025,  0.155, 22),
    ('aft',   0.225,  0.345, 23),
)

# grown_loft is a true ellipse. Chamfer queries (sf.flank_x / top_y) sit
# outboard of that shell — inset and sample the ellipse instead.
_ELL_CLIP = 0.97
_SKIN_INSET = 0.22
_FLOW_INSET = 0.18
_FLOW_THICK = 0.08
# nacre_pads rx minus this = outboard overlap on the ellipse (> 0.10).
_NACRE_RX = 0.38
_NACRE_RY = 0.22
_NACRE_RZ = 0.60
_NACRE_OVERLAP = 0.14
_GROOVE_FRACS = (0.50, 0.34)


# ===========================================================================
# ELLIPSE SKIN (matches grown_loft rings)
# ===========================================================================

def _ell_hw(stations, z, y):
    """True-ellipse half-beam at (z, y), or 0.0 off the section."""
    hw, hh, yo, _ch = sf.section(stations, z)
    if hw <= 1e-6 or hh <= 1e-6:
        return 0.0
    t = (y - yo) / hh
    if abs(t) >= _ELL_CLIP:
        return 0.0
    return hw * math.sqrt(max(0.0, 1.0 - t * t))


def _ell_top(stations, z, x=0.0):
    """True-ellipse back height at (z, x), or 0.0 off the section."""
    hw, hh, yo, _ch = sf.section(stations, z)
    if hw <= 1e-6 or hh <= 1e-6:
        return 0.0
    t = abs(x) / hw
    if t >= _ELL_CLIP:
        return 0.0
    return yo + hh * math.sqrt(max(0.0, 1.0 - t * t))


def _ell_bot(stations, z, x=0.0):
    """True-ellipse belly height at (z, x), or 0.0 off the section."""
    hw, hh, yo, _ch = sf.section(stations, z)
    if hw <= 1e-6 or hh <= 1e-6:
        return 0.0
    t = abs(x) / hw
    if t >= _ELL_CLIP:
        return 0.0
    return yo - hh * math.sqrt(max(0.0, 1.0 - t * t))


def _surf_ell_top(stations, x=0.0, drop=0.0):
    """surf(z) -> ellipse back height minus drop. 0.0 off the run."""
    z0 = stations[0][0]
    z1 = stations[-1][0]

    def at(z):
        if z < z0 or z > z1:
            return 0.0
        hy = _ell_top(stations, z, x)
        if hy == 0.0:
            return 0.0
        return hy - drop
    return at


# ===========================================================================
# STATION LIST
# ===========================================================================

def _main_stations(l, _b, _h):
    """Elongate blue-whale stations. Small head, long torso, long tail.

    Nose at l*-0.450. Peak girth just aft of the nape (l*-0.145). Tail
    tip at l*+0.462, short of the wake glow at l*+0.47. Half-extents stay
    well inside the class envelope; the fluke carries spanX.
    """
    return [
        # -- HEAD: relatively small, blunt then slightly pointed ----------
        sf.fair(l * -0.4500, 0.38, 0.34,  0.05),
        sf.fair(l * -0.4220, 1.05, 0.95,  0.12),
        sf.fair(l * -0.3900, 1.95, 1.75,  0.20),
        sf.fair(l * -0.3480, 3.05, 2.70,  0.30),
        sf.fair(l * -0.3000, 4.35, 3.80,  0.38),
        # -- NAPE into long torso ----------------------------------------
        sf.fair(l * -0.2400, 5.55, 4.70,  0.42),
        sf.fair(l * -0.1850, 6.25, 5.20,  0.42),
        sf.fair(l * -0.1450, 6.50, 5.35,  0.40),
        sf.fair(l * -0.0800, 6.48, 5.30,  0.36),
        sf.fair(l * -0.0100, 6.40, 5.18,  0.32),
        sf.fair(l *  0.0600, 6.22, 4.95,  0.26),
        sf.fair(l *  0.1300, 5.90, 4.60,  0.20),
        sf.fair(l *  0.2000, 5.40, 4.15,  0.12),
        # -- LONG TAIL into the wake -------------------------------------
        sf.fair(l *  0.2650, 4.55, 3.40,  0.06),
        sf.fair(l *  0.3250, 3.40, 2.45,  0.01),
        sf.fair(l *  0.3750, 2.20, 1.60, -0.02),
        sf.fair(l *  0.4150, 1.25, 0.95, -0.04),
        sf.fair(l *  0.4420, 0.62, 0.50, -0.04),
        sf.fair(l *  0.4550, 0.28, 0.24, -0.03),
        sf.fair(l *  0.4620, 0.13, 0.11, -0.02),
    ]


def _garden_mass_stations(stations, z0, z1, n, hw_frac, proud, bury):
    """Pearl garden mound on the back. Ends taper. Lower half is buried."""
    out = []
    span = z1 - z0
    if span <= 0.0 or n < 2:
        return out
    for i in range(n):
        t = i / (n - 1.0)
        env = math.sin(math.pi * t)
        z = z0 + t * span
        ty = _ell_top(stations, z, 0.0)
        if ty == 0.0:
            continue
        hw = _ell_hw(stations, z, ty - 0.90) * hw_frac * max(0.28, env)
        if hw <= 0.22:
            continue
        pr = proud * max(0.22, env)
        hh = (pr + bury) * 0.5
        yo = ty + (pr - bury) * 0.5
        out.append(sf.fair(z, hw, hh, yo))
    return out


def _throat_mass_stations(stations, zs):
    """Indigo ventral throat swell under the head and chest."""
    out = []
    for z in zs:
        by = _ell_bot(stations, z, 0.0)
        if by == 0.0:
            continue
        hw = _ell_hw(stations, z, by + 1.15)
        if hw <= 0.28:
            continue
        hh = 1.45
        yo = by + 0.55
        out.append(sf.fair(z, hw * 0.58, hh, yo))
    return out


def _brow_stations(stations, zs):
    """Small pearl brow over the snout. Buried into the head loft."""
    out = []
    for z in zs:
        ty = _ell_top(stations, z, 0.0)
        if ty == 0.0:
            continue
        hw = _ell_hw(stations, z, ty - 0.28)
        if hw <= 0.18:
            continue
        hh = 0.55
        out.append(sf.fair(z, hw * 0.48, hh, ty - 0.28 + hh * 0.15))
    return out


def _garden_surf(stations, z0, z1, x, drop):
    """Back height through a garden biome, sunk into the skin, or 0.0."""
    def at(z):
        if z < z0 or z > z1:
            return 0.0
        hy = _ell_top(stations, z, x)
        if hy == 0.0:
            return 0.0
        span = z1 - z0
        t = (z - z0) / span
        env = math.sin(math.pi * max(0.0, min(1.0, t)))
        return hy - drop + 0.10 * max(0.20, env)

    return at


# ===========================================================================
# SURFACE PATH HELPERS
# ===========================================================================

def _flank_path(stations, side, z0, z1, n, y0, y1, inset=_FLOW_INSET):
    """Points on the ellipse flank from (z0, y0) to (z1, y1). Ends buried."""
    pts = []
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + (z1 - z0) * t
        y = y0 + (y1 - y0) * t
        fx = _ell_hw(stations, z, y)
        if fx <= 0.08:
            continue
        x = fx - inset
        if not pts or i == n - 1:
            x -= 0.12
        if x <= 0.04:
            continue
        pts.append((side * x, y, z))
    return pts


def _keel_path(stations, z0, z1, n, rise=0.16):
    """Belly-centreline points. Lifted into the body."""
    pts = []
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + (z1 - z0) * t
        y = _ell_bot(stations, z, 0.0)
        if y == 0.0:
            continue
        y = y + rise
        if not pts or i == n - 1:
            y += 0.14
        pts.append((0.0, y, z))
    return pts


def _groove_path(stations, side, z0, z1, n, y_frac, inset):
    """Ventral-flank nacre centres. Local Y. X inset so pads cut the ellipse."""
    pts = []
    if n < 2:
        return pts
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + (z1 - z0) * t
        _hw, hh, yo, _ch = sf.section(stations, z)
        if hh <= 1e-6:
            continue
        y = yo - hh * y_frac
        fx = _ell_hw(stations, z, y)
        if fx <= 0.22:
            continue
        x = fx - inset
        if x <= 0.06:
            continue
        pts.append((side * x, y, z))
    return pts


def _garden_vein_tips(stations, side, z_root, y, spread):
    """Vein tips inboard of the ellipse at a garden's skirt."""
    fx = _ell_hw(stations, z_root, y)
    if fx <= 0.30:
        return None, []
    root = (side * (fx - 0.40), y, z_root)
    tips = []
    for dz, dy in spread:
        tz = z_root + dz
        ty = y + dy
        tx = _ell_hw(stations, tz, ty)
        if tx <= 0.30:
            continue
        tips.append((side * (tx - 0.40), ty, tz))
    return root, tips


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones blue-whale gardenback (freighter).

    parts / glow -- object lists the driver joins into RIMWARD_HULL and
                    RIMWARD_EMISSIVE.
    l, b, h      -- class envelope 85.0 x 46.75 x 25.5.
    detail       -- 3 (lod0) … 0 (lod3).
    """
    d = min(max(int(detail), 0), 3)
    stations = _main_stations(l, b, h)
    radial = {3: 28, 2: 22, 1: 16, 0: 12}[d]
    # detail=3 organs drop one ladder step so lod0 stays under 60000 tris.
    trim = 2 if d >= 3 else d

    # ── PRIMARY MASS: elongate indigo body (always) ──────────────────────
    sf.grown_loft(parts, 'body-main', kit.ROLE_HULL, stations, hull_mat,
                  radial=radial)

    # ── PRIMARY MASS: small pearl brow (always) ──────────────────────────
    brow = _brow_stations(stations, (
        l * -0.415, l * -0.385, l * -0.355, l * -0.325,
    ))
    if len(brow) >= 2:
        sf.grown_loft(parts, 'living-body-brow', kit.ROLE_ARMOUR, brow,
                      hull_mat, radial=max(8, radial - 6))

    # ── PRIMARY MASS: indigo throat swell (always) ───────────────────────
    throat = _throat_mass_stations(stations, (
        l * -0.360, l * -0.310, l * -0.250, l * -0.190, l * -0.130,
    ))
    if len(throat) >= 2:
        sf.grown_loft(parts, 'body-throat', kit.ROLE_HULL, throat, hull_mat,
                      radial=max(8, radial - 4))

    # ── PRIMARY MASS: three SEPARATED garden mounds (always) ─────────────
    # Pearl masses on the whale back. Gaps between biomes stay bare.
    # Bury > proud so the mound interpenetrates the loft by > 0.15.
    garden_proud = 1.15
    garden_bury = 2.20
    garden_n = 5
    for tag, z0f, z1f, _seed in _GARDENS:
        z0, z1 = l * z0f, l * z1f
        mass = _garden_mass_stations(
            stations, z0, z1, n=garden_n, hw_frac=0.48,
            proud=garden_proud, bury=garden_bury)
        if len(mass) >= 2:
            sf.grown_loft(parts, 'living-body-garden-' + tag, kit.ROLE_ARMOUR,
                          mass, hull_mat, radial=max(10, radial - 4))

    # ── PRIMARY MASS: tiny soft dorsal ridge (always) ────────────────────
    # Far back, in the last breathing gap. Soft pads, not a shark triangle.
    ridge_z0, ridge_z1 = l * 0.168, l * 0.218
    an.dorsal_ridge(parts, 'ridge-freighter', hull_mat,
                    ridge_z0, ridge_z1,
                    _surf_ell_top(stations, 0.0, drop=0.20),
                    x=0.0, height=0.48, detail=d)

    # ── PRIMARY MASS: tiny blue-whale pectorals (always) ─────────────────
    # Short triangle paddles. Roots buried in the flank at max girth.
    z_pec = l * -0.125
    y_pec = sf.section(stations, z_pec)[2] - 0.85
    fx_pec = _ell_hw(stations, z_pec, y_pec)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        if fx_pec <= 0.40:
            continue
        root = (side * (fx_pec - 0.70), y_pec, z_pec)
        tip = (side * (fx_pec + 5.60), y_pec - 0.55, z_pec + 2.10)
        an.whale_pectoral(parts, 'fin-pectoral-' + tag, hull_mat,
                          root, tip, root_chord=2.55, tip_chord=0.95,
                          thick=0.42, style='blue', detail=d)

    # ── PRIMARY MASS: huge HORIZONTAL fluke (always) ─────────────────────
    z_ped = l * 0.438
    _hw, _hh, yo, _ch = sf.section(stations, z_ped)
    peduncle = (0.0, yo, z_ped)
    an.whale_fluke(parts, 'fluke', hull_mat, peduncle,
                   span=28.0, chord=7.6, thick=0.95, detail=d)

    # ── PRIMARY MASS: great transfer belly chamber (always) ──────────────
    z_belly = l * -0.095
    by = _ell_bot(stations, z_belly, 0.0)
    org.belly_chamber(parts, glow, 'freighter', hull_mat, glow_mat,
                      (0.0, by - 0.20, z_belly), (5.6, 2.35, 8.2),
                      detail=d)

    # ── PRIMARY MASS: wake motes inside the last taper (always) ──────────
    # Two motes at detail 0 so the glow join is never a single empty mesh.
    for i, zf in enumerate((0.448, 0.456, 0.461)):
        if d < 1 and i > 1:
            continue
        zw = l * zf
        _hw, _hh, wy, _c = sf.section(stations, zw)
        kit.sphere(glow, 'wake-freighter.%02d' % i, 'glow',
                   (0.0, wy, zw), (0.22 + i * 0.06, 0.18, 0.38 + i * 0.10),
                   glow_mat, segments=8)

    if d < 1:
        return

    # ── GARDEN FOLDS on the three biomes (detail 1+) ─────────────────────
    garden_drop = 0.32
    for tag, z0f, z1f, seed in _GARDENS:
        z0, z1 = l * z0f, l * z1f
        org.garden_fold(parts, glow, 'garden-' + tag, hull_mat, glow_mat,
                        z0, z1, _garden_surf(stations, z0, z1, 0.0, garden_drop),
                        x=0.0, detail=trim, seed=seed)

    # ── BLOWHOLE on the nape, ahead of the first garden (detail 1+) ──────
    z_blow = l * -0.248
    y_blow = _ell_top(stations, z_blow, 0.0)
    if y_blow != 0.0:
        an.blowhole(parts, glow, 'blowhole-freighter', hull_mat, glow_mat,
                    (0.0, y_blow - 0.10, z_blow), radius=0.42, detail=d, seed=31)

    # ── BREATHING VENTS in the calm garden gaps (detail 1+) ──────────────
    gap_pts = []
    for zf, xf in ((-0.028, 0.0), (-0.010, 0.55), (0.008, -0.40),
                   (0.178, 0.0), (0.195, 0.45), (0.210, -0.35)):
        vz = l * zf
        vy = _ell_top(stations, vz, xf)
        if vy == 0.0:
            continue
        gap_pts.append((xf, vy - 0.08, vz))
    if d == 1:
        gap_pts = gap_pts[:3]
    elif d >= 2:
        gap_pts = gap_pts[:4]
    if gap_pts:
        org.breathing_vents(parts, glow, 'vents-gap', hull_mat, glow_mat,
                            (0.0, 0.0, 0.0), face='y', detail=trim,
                            points=gap_pts)

    # ── NURSERY / SANCTUARY HOLLOWS along the flanks (detail 1+) ─────────
    # Absolute hollow size. Occupancy is the scale cue, not a scaled craft.
    # Starboard carries more nests. One port hollow stays empty sanctuary.
    hollow_spec = (
        (1.0, 'stbd', l * -0.175, 1, 41),
        (1.0, 'stbd', l * -0.040, 1, 42),
        (1.0, 'stbd', l *  0.090, 1, 43),
        (-1.0, 'port', l * -0.150, 1, 45),
        (-1.0, 'port', l *  0.020, 0, 46),
        (-1.0, 'port', l *  0.155, 1, 47),
    )
    if d == 1:
        hollow_spec = (hollow_spec[1], hollow_spec[4])
    elif d == 2:
        hollow_spec = hollow_spec[:2] + hollow_spec[3:5]
    y_hol = sf.section(stations, l * -0.040)[2] - 0.15
    for side, tag, hz, occ, seed in hollow_spec:
        hy = y_hol
        fx = _ell_hw(stations, hz, hy)
        if fx <= 0.80:
            continue
        loc = (side * (fx - 0.10), hy, hz)
        name = 'hollow-%s-%.0f' % (tag, hz)
        if occ > 0:
            if d < 3:
                occ = 1
            org.nursery_hollow(parts, glow, name, hull_mat, glow_mat, loc,
                               face='x', occupants=occ, detail=trim, seed=seed)
        else:
            org.sanctuary_hollow(parts, glow, name, hull_mat, glow_mat, loc,
                                 face='x', detail=trim, seed=seed)

    # ── ONE PORT SCAR on the upper forward flank (detail 1+) ─────────────
    y_fold = _ell_top(stations, l * -0.080, 0.0) - 1.55
    welt = _flank_path(stations, -1.0, l * -0.305, l * -0.175, 5,
                       y_fold + 0.45, y_fold - 0.35)
    if len(welt) >= 2:
        an.healed_scar(parts, 'scar-port', hull_mat, welt, thick=0.12,
                       detail=d)
