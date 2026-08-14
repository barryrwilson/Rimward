"""Beautiful Ones Heavy - SHIELDBACK.

Bible §4.6: "A mature defender with a dense central body, layered muscular
mantles, broad shielding fins, and luminous threat displays. Weapons should
read as focused biological energy or symbiotic organs, never barrels."
Plate: beautiful-heavy-shieldback.png — whale authority, defensive mass.

Body plan — a whale built like a fortress, the TALLEST and densest body of
the fleet relative to its length (spanY carries the class read):

- ONE grown loft (17 fair near-ellipse stations), thickest just aft of the
  head (z = l*-0.125, half-height l*0.155 — much deeper than the other
  combat classes), a broad blunt slightly DOWNTURNED snout (negative
  y_offset at the nose stations), drawn into a long tapering tail that ends
  at z = l*+0.462 so the driver's stern glow sphere (z = l*+0.47) reads as
  the body's own bioluminescent wake. Indigo base tissue, ROLE_HULL.
- THREE OVERLAPPING SWOLLEN DORSAL MANTLES (org.dorsal_mantles) from brow
  to mid-back: visibly swollen interpenetrating muscle masses with soft
  transitions, seeded lateral/aft jitter and the no-disc rule (every
  mantle's ry >= 0.55*rz, authored so no clamp fires) — whale muscle, never
  shell-plate borders, never a disc silhouette in top OR side profile. A
  low pearl dorsal crest loft rides the spine beneath and aft of the stack,
  carrying the pearl-bone line to the tail.
- TWO ENORMOUS SHIELD FINS (an.fin_membrane, path-loft flippers) rise
  steeply from thick roots buried in the shoulders, framing the torso like
  protective walls: root chord 5.0, thick 0.60, tips lifted ~2.7 over the
  span. A smaller lower pair continues the manta lineage, sweeping low and
  aft along the belly flank. Roots GIVEN INSIDE the hull — the burial is
  the connectivity.
- CYAN THREAT-DISPLAY VEINS concentrate where the muscle loads: two
  branching an.vein_fan clusters per flank rooted INSIDE the deep
  mantle-fold crease, one fan astride each shield-fin root crown, one at
  each lower-fin root. Cyan cores and branch nodes only, thin and in the
  folds — the calm pearl back stays dark (emissive far under 5 %).
- TWO FOLD CREASES per flank (an.fold_crease): the deep mantle fold at the
  mantle-skirt height and a lower skirt fold, both self-trimming at the
  head and tail tapers. The vein fans root inside these channels.
- Sensory crown REDUCED to a low sweep of short sensing filaments along the
  forward brow edge — watchful, not curious: count 8, raked forward-down,
  flat arc (arc=0.10), small fan.
- A protected ventral pouch (org.belly_chamber) beneath the thorax; its
  mass hangs below the centreline and balances the mantle stack about the
  pivot.
- SCAR HISTORY (the one deliberate asymmetry, bible rule 8): three pale
  diagonal healed welts grouped as one old defence wound on the PORT-aft
  flank only. Nothing answers them on the starboard flank.

Envelope (driver): l = 17.0, b = 8.84, h = 5.78.
AUTHORED largest-dimension target: spanZ ~15.4 (nose l*-0.440 to tail
l*+0.462) — the fleet ladder's heavy ≈ 15.5, inside the SHIP_SCALE heavy
span band [10.20, 23.80]; orchestrator fills measured numbers after bake.
Estimated spans (unverified — no gates run at authoring time):
  spanZ ~15.4; spanX ~14.2 (shield-fin tips +/-6.9 plus flesh — under the
  ~1.05*spanZ collision-proxy clamp); spanY ~7.6 (mantle-c top ~+4.6,
  pouch bottom ~-3.0) → height/length ~0.49, under the 0.60 ceiling.
Estimated lod0 vertex count MEASURED 2026-08-14: verts 40900; tris 22500/12020/4484 (measure-ships, gltf-transform tri count) (band 9 000-78 000):
  lofts ~430, mantles ~1 150 (segments=20), fins ~1 100, creases ~1 030,
  vein fans ~3 300, vents ~3 800, crown ~690, pouch ~290, scars and flow
  lines ~830.

LOD ladder
----------
detail=3  full build: both crease pairs with lips, all vein branches +
```
          nodes, all six vents per flank with breath glow, 8-filament
          crown, three scar welts with swells, all flow lines.
detail=2  constructs thin themselves: crease pitch 1.80, vein branches
          halved (root node kept), all vents (no breath glow), full crown,
          scars without swells, decimated boundary lines.
detail=1  primary masses + key anatomy: crease floors only (dark lines),
          one vein branch per fan, half the vents (bowls only), crown of
          4, scars as single chords, minimal flow lines.
detail=0  primary masses only: grown loft, dorsal crest, three mantles,
          both fin pairs (membranes only), belly pouch. Silhouette NEVER
          thins — only ring density, repeats and filaments do.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import anatomy as an
from . import organs as org
from . import surface as sf


# ===========================================================================
# STATION LIST
# ===========================================================================

def _heavy_stations(l, b, h):
    """Hull loft stations for the shieldback.

    sf.fair near-ellipse sections throughout — a grown body never shows a
    plank edge. Nose tip at l*-0.440 = -7.480, broad and blunt with a
    negative y_offset: the snout droops slightly while the dorsal line
    holds — the plate's downturned whale jaw. Thickest just aft of the head
    at l*-0.125 (half-beam l*0.219 = 3.723, half-height l*0.155 = 2.635 —
    far taller than the old combat-class sections; spanY is the class
    read). Tail tip at l*+0.462 = +7.854, tapering to half-extents
    (0.204, 0.170) so the stern glow at l*+0.47 = +7.990 is the body's
    wake, not a stuck-on bead.
    """
    return [
        # -- HEAD: broad blunt snout, slightly downturned, never a needle --
        sf.fair(l * -0.4400, l * 0.010, l * 0.012, l * -0.012),  # nose tip
        sf.fair(l * -0.4120, l * 0.045, l * 0.042, l * -0.011),
        sf.fair(l * -0.3750, l * 0.085, l * 0.070, l * -0.008),
        sf.fair(l * -0.3250, l * 0.140, l * 0.105, l * -0.002),
        sf.fair(l * -0.2650, l * 0.185, l * 0.130, l *  0.006),
        sf.fair(l * -0.1950, l * 0.212, l * 0.148, l *  0.013),  # brow

        # -- CENTRAL BODY: deep chest, thickest just aft of the head --
        sf.fair(l * -0.1250, l * 0.219, l * 0.155, l *  0.018),  # max
        sf.fair(l * -0.0450, l * 0.212, l * 0.150, l *  0.017),
        sf.fair(l *  0.0450, l * 0.200, l * 0.141, l *  0.014),
        sf.fair(l *  0.1350, l * 0.180, l * 0.126, l *  0.010),

        # -- TAIL: the long taper that turns the stern glow into a wake --
        sf.fair(l *  0.2150, l * 0.152, l * 0.104, l *  0.005),
        sf.fair(l *  0.2850, l * 0.123, l * 0.084, l *  0.000),
        sf.fair(l *  0.3450, l * 0.090, l * 0.062, l * -0.005),
        sf.fair(l *  0.3950, l * 0.062, l * 0.043, l * -0.007),
        sf.fair(l *  0.4280, l * 0.040, l * 0.029, l * -0.007),
        sf.fair(l *  0.4520, l * 0.024, l * 0.018, l * -0.005),
        sf.fair(l *  0.4620, l * 0.012, l * 0.010, l * -0.003),  # tail tip
    ]


def _crest_stations(stations):
    """Dorsal crest loft stations, riding the grown loft's back.

    The pearl-bone dorsal line: low beneath the mantle stack (where the
    mantles own the silhouette) and carrying the pearl read aft to the
    tail. Every station's y_offset is computed from sf.top_y at its OWN z
    so the crest's lower 62 % buries into the back — never placed at a
    typed y. Absolute half-extents: a mature defender's crest is bone, not
    a fin.
    """
    zs = (-6.40, -5.40, -4.20, -3.00, -1.60, -0.20,
          1.20, 2.60, 4.00, 5.20, 6.10, 6.70)
    hws = (0.34, 0.46, 0.58, 0.70, 0.80, 0.82,
           0.74, 0.60, 0.46, 0.34, 0.26, 0.18)
    hhs = (0.30, 0.38, 0.46, 0.54, 0.60, 0.60,
           0.54, 0.44, 0.36, 0.28, 0.23, 0.19)
    out = []
    for z, hw, hh in zip(zs, hws, hhs):
        yo = sf.top_y(stations, z, 0.0) - hh * 0.62
        out.append(sf.fair(z, hw, hh, yo))
    return out


# ===========================================================================
# SURFACE PATH HELPERS (every point computed from surface queries)
# ===========================================================================

def _flank_path(stations, side, z0, z1, n, y0, y1, proud=0.01, bury=0.12):
    """Points riding the flank from (z0, y0) to (z1, y1).

    Stations whose section has fallen away at the ride height are skipped
    (self-trim); the first and last kept points are pulled ``bury``
    inboard so the run's ends are inside the body (gilded margin idiom).
    """
    pts = []
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + (z1 - z0) * t
        y = y0 + (y1 - y0) * t
        fx = sf.flank_x(stations, z, y)
        if fx <= 0.05:
            continue
        x = fx + proud
        if not pts or i == n - 1:
            x -= bury
        pts.append((side * x, y, z))
    return pts


def _fold_fan(stations, side, z_root, y_crease, spread):
    """One threat-display vein fan rooted in the mantle-fold crease.

    Root and every tip sit 0.22 inboard of the skin at their OWN (z, y)
    and within +/-0.05 of the crease centre height, so each sheath
    endpoint lies past the crease floor's inner face (0.16 deep, floor
    height 0.12) and pierces it — the fold is the connectivity. Tips
    whose section has fallen away are skipped.
    """
    fx = sf.flank_x(stations, z_root, y_crease)
    root = (side * (fx - 0.22), y_crease, z_root)
    tips = []
    for dz, dy in spread:
        tz = z_root + dz
        ty = y_crease + dy
        fx = sf.flank_x(stations, tz, ty)
        if fx <= 0.30:
            continue
        tips.append((side * (fx - 0.22), ty, tz))
    return root, tips


def _fin_vein_tips(root, tip, root_chord, tip_chord, thick, seed, ts):
    """Vein tips seated astride a flipper's lofted crown.

    Each tip is anatomy.flipper_surface_point at span fraction t — the same
    sagging bezier and radii profile the matching fin_membrane call welds
    its path-loft over (same root, tip, chords, thick and seed), so each
    sheath end pierces the local flesh: lifted the loft's half-thickness
    along the crown normal plus 0.02, the sheath (radius sf.VEIN_R * 1.5)
    sinks into the fin and stands proud, never hovering beside it. The fin
    root burial connects the fan's inner end.
    """
    return [an.flipper_surface_point(root, tip, root_chord * 0.5,
                                     tip_chord * 0.5, thick * 0.5, t,
                                     seed=seed) for t in ts]


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones shieldback (heavy class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam and height from the driver
                (17.0, 8.84, 5.78).
    detail   -- 3 full  2 thinned repeats  1 primary masses + key anatomy
                0 primary masses only.
    """
    H = kit.ROLE_HULL
    A = kit.ROLE_ARMOUR

    stations = _heavy_stations(l, b, h)

    # ── PRIMARY MASS: the grown body (always, detail 0+) ─────────────────
    sf.grown_loft(parts, 'heavy-body', H, stations, hull_mat)

    # ── PRIMARY MASS: low pearl dorsal crest, brow to tail (always) ──────
    sf.grown_loft(parts, 'living-body-crest', A, _crest_stations(stations),
                  hull_mat)

    # ── PRIMARY MASS: three overlapping swollen dorsal mantles (always) ──
    # org.dorsal_mantles stacks three seeded ellipsoid masses from the
    # given lowest centre: each successive mass rises with a 40 % burial
    # into the one below, drifts aft and takes a small lateral jitter, so
    # the stack reads as overlapping whale muscle — scalloped in plan,
    # humps in profile, never coaxial discs (authored ry/rz = 0.57 for
    # every mass, above the 0.55 no-disc floor, so no clamp fires).
    # mantle-a (FULL size 5.2 x 3.3 x 5.8) centres at the brow with half
    # its ry buried in the hull back (top_y at z=-3.40 is ~2.74, so
    # loc y ~1.91 buries 0.83); its forward pole reaches z=-6.30 where the
    # hull top is ~1.05, so the brow end is swallowed too. mantle-c tops
    # out at y ~+4.6 — spanY carries the class read and stays at ~0.49 of
    # spanZ, under the 0.60 ceiling.
    mantle_size = (5.20, 3.30, 5.80)
    mantle_loc = (0.0, sf.top_y(stations, -3.40, 0.0) - 1.65 * 0.50, -3.40)
    org.dorsal_mantles(parts, 'heavy', hull_mat, mantle_loc, mantle_size,
                       count=3, seed=73, detail=detail)

    # ── PRIMARY MASS: the fin set (always — the fins ARE the outline) ────
    # TWO ENORMOUS SHIELD FINS rise steeply from thick roots buried in the
    # shoulders (root x 1.90 sits ~1.7 inside the local flank at its own
    # station), framing the torso like protective walls: root chord 5.0,
    # full root thickness 0.60, tips lifted +2.65 over the span and swept
    # aft past the cheek. Tips at x +/-6.90 keep spanX ~14.2 under the
    # ~1.05*spanZ collision-proxy clamp and under spanZ itself, so the
    # body's length stays the largest dimension (~15.4, the ladder's heavy
    # slot). The SMALLER LOWER PAIR continues the manta lineage, sweeping
    # low and aft along the belly flank. Roots are GIVEN INSIDE the hull —
    # the burial is the connectivity; never inset them back out.
    shield_root = (1.90, 0.90, -3.00)
    shield_tip = (6.90, 3.55, -0.70)
    lower_root = (1.50, -0.90, 0.90)
    lower_tip = (5.30, -2.30, 3.50)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        an.fin_membrane(parts, 'fin-shield-' + tag, hull_mat,
                        (side * shield_root[0], shield_root[1],
                         shield_root[2]),
                        (side * shield_tip[0], shield_tip[1],
                         shield_tip[2]),
                        5.00, 1.70, thick=0.60, detail=detail, flow=3,
                        seed=61 if side > 0.0 else 62)
        an.fin_membrane(parts, 'fin-lower-' + tag, hull_mat,
                        (side * lower_root[0], lower_root[1],
                         lower_root[2]),
                        (side * lower_tip[0], lower_tip[1], lower_tip[2]),
                        3.20, 1.05, thick=0.30, detail=detail, flow=2,
                        seed=63 if side > 0.0 else 64)

    # ── PRIMARY MASS: protected ventral pouch beneath the thorax ─────────
    # Seated so the pouch's upper 0.45 buries into the belly at its own
    # station (sf.bottom_y at z=-0.30 is ~-2.23). Its mass hangs below the
    # centreline and balances the mantle stack about the pivot. Pouch only
    # at detail 0 — it is primary mass, a real bulge in the outline.
    pouch_z = -0.30
    pouch_y = sf.bottom_y(stations, pouch_z, 0.0) - 0.60 + 0.45
    org.belly_chamber(parts, glow, 'heavy-chamber', hull_mat, glow_mat,
                      (0.0, pouch_y, pouch_z), (2.60, 1.20, 3.00),
                      detail=detail)

    if detail < 1:
        return

    # ── DEEP FOLDS — the creases the threat display lives in ─────────────
    # Two per flank, both self-trimming where the head and tail tapers fall
    # below the ride height: the MANTLE FOLD at the mantle-skirt height
    # (y = +1.55, under the mantle-a overhang — the loaded muscle seam) and
    # the lower SKIRT FOLD (y = +0.55) where the pearl skirt meets the
    # indigo flank.
    fold_y = 1.55
    skirt_y = 0.55
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        an.fold_crease(parts, 'heavy-fold-' + tag, hull_mat,
                       -5.40, -0.60, fold_y,
                       sf.surf_flank(stations, fold_y), side=side,
                       height=0.12, detail=detail)
        an.fold_crease(parts, 'heavy-skirt-' + tag, hull_mat,
                       -5.60, 2.00, skirt_y,
                       sf.surf_flank(stations, skirt_y), side=side,
                       height=0.12, detail=detail)

    # ── CYAN THREAT DISPLAY — glow from inside loaded muscle ─────────────
    # Symbiotic glow organs, never barrels. The display concentrates where
    # the plate concentrates it: two branching fans per flank rooted INSIDE
    # the deep mantle fold (endpoints 0.22 inboard, past the crease floor's
    # inner face), one fan astride each shield-fin root crown, one at each
    # lower-fin root. Cyan cores and branch nodes are the only emissive
    # here — thin, in the folds, never on the calm pearl back.
    spread = ((-1.60, 0.00), (-0.80, 0.04), (0.00, -0.05),
              (0.80, 0.04), (1.60, 0.00), (2.20, -0.04))
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        out = (side, 0.0, 0.0)
        for i, z_root in enumerate((-3.60, -1.40)):
            root, tips = _fold_fan(stations, side, z_root, fold_y, spread)
            an.vein_fan(parts, glow, 'heavy-fold-%s-%d' % (tag, i),
                        hull_mat, glow_mat, root, tips, out, detail=detail)
        # shield-fin root display: brightest where the shield meets the body
        sroot = (side * shield_root[0], shield_root[1], shield_root[2])
        stip = (side * shield_tip[0], shield_tip[1], shield_tip[2])
        an.vein_fan(parts, glow, 'heavy-shieldfin-' + tag, hull_mat,
                    glow_mat, sroot,
                    _fin_vein_tips(sroot, stip, 5.00, 1.70, 0.60,
                                   61 if side > 0.0 else 62,
                                   (0.12, 0.20, 0.28, 0.36, 0.44)),
                    (0.0, 1.0, 0.0), detail=detail)
        # lower-fin root display
        lroot = (side * lower_root[0], lower_root[1], lower_root[2])
        ltip = (side * lower_tip[0], lower_tip[1], lower_tip[2])
        an.vein_fan(parts, glow, 'heavy-lowerfin-' + tag, hull_mat,
                    glow_mat, lroot,
                    _fin_vein_tips(lroot, ltip, 3.20, 1.05, 0.30,
                                   63 if side > 0.0 else 64,
                                   (0.18, 0.30, 0.42)),
                    (0.0, 1.0, 0.0), detail=detail)

    # ── SENSORY CROWN — a low watchful sweep, not curiosity ──────────────
    # Reduced to eight short filaments raked forward-down over the brow
    # edge with a flat arc (a defender watches, not wonders). The root sits
    # 0.30 inside the head mass below the skin at its own station
    # (sf.top_y at z=-6.15 is ~1.28); the filaments exit through the skin —
    # that pierce is the connectivity. Tips reach z ~-7.2, short of the
    # nose tip, so the spanZ read stays the body's own.
    crown_z = -6.15
    crown_y = sf.top_y(stations, crown_z, 0.0) - 0.30
    org.sensory_crown(parts, glow, 'heavy', hull_mat, glow_mat,
                      (0.0, crown_y, crown_z),
                      forward=(0.0, -0.30, -0.95), fan=sf.FILAMENT_FAN * 1.3,
                      count=8, detail=detail, seed=71, arc=0.10)

    # ── BREATHING VENTS — one absolute-size row per flank ────────────────
    # Six mouths per flank (a denser organism breathes more), each centre
    # sampled from sf.flank_x at its OWN station — a row along a curving
    # flank never shares one x; vents are the absolute sf.VENT_R.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        vpts = []
        for vz in (-4.20, -2.40, -0.60, 1.20, 2.80, 4.40):
            fx = sf.flank_x(stations, vz, -0.70)
            if fx <= 0.35:
                continue
            vpts.append((side * fx, -0.70, vz))
        org.breathing_vents(parts, glow, 'heavy-vents-' + tag,
                            hull_mat, glow_mat, (0.0, 0.0, 0.0),
                            face='x', detail=detail, points=vpts)

    # ── PEARL / INDIGO BOUNDARY FLOW LINES ───────────────────────────────
    # The long gradual tonal boundary where the pearl mantle skirt meets
    # the indigo flank, one per side, riding the surface and buried at both
    # ends. Fin-span flow lines are carried by the membranes.
    n_flow = 9 if detail >= 3 else (6 if detail == 2 else 4)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        path = _flank_path(stations, side, -4.80, 2.40, n_flow, 2.00, 1.30)
        if path:
            an.flow_line(parts, 'heavy-boundary-' + tag, hull_mat, path,
                         detail=detail)

    # ── SCAR HISTORY: pale diagonal welts, PORT-aft flank only ───────────
    # One old defence wound (the bible rule 8 asymmetry) told as three
    # parallel diagonal welts aft of the port shield-fin root — the plate's
    # restrained history mark. Each welt rides the flank on a falling
    # diagonal (~32 degrees), both ends buried in the body. Nothing on the
    # starboard flank answers them.
    for i, (z0, z1, y0, y1) in enumerate((
            (0.60, 2.00, 1.15, 0.30),
            (1.20, 2.60, 1.20, 0.35),
            (1.80, 3.10, 1.15, 0.30))):
        welt = _flank_path(stations, -1.0, z0, z1, 5, y0, y1)
        if welt:
            an.healed_scar(parts, 'heavy-scar-port-%d' % i, hull_mat, welt,
                           thick=0.09, detail=detail)
