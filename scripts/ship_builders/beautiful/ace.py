"""Beautiful Ones Ace — SWIFT-BONDED HUNTER.

Bible §4.6: "A taut, fast adult with swept fins, narrow frontal area, bright
nerve lines, and controlled asymmetry from healed experience. Propulsion is
a powerful whole-body traveling wave."

Plate (beautiful-ace-swift-bonded-hunter.png): a taut, low dart-manta
organised around speed. Narrow pointed nose, slim thorax, long tail
stretching into the wake. The ENORMOUS forward fin pair sweeps dramatically
AFT and IS the entire silhouette; a smaller second pair echoes the same
sweep near the tail. A low flat fan of fine sensing filaments projects from
the NOSE (not a raised crown); its cyan tips continue into the nerve lines
curving back through the shoulders — brighter and more concentrated than
any other class, flowing S-curves, never a mechanical grid. The side study
reduces the ship to a thin undulating ribbon with almost no frontal mass.
Plate corrections honoured: the painted knife fin tips become rounded
paddles (anatomy's _FLIP_TIP_ROUND), and the nose filaments stay fine and
sensory (absolute sf.FILAMENT_R), never muscular or grasping.

Envelope (driver): l = 7.2, b = 2.88, h = 1.44. Span band [4.32, 10.08];
AUTHORED largest-dimension target ~7.5 (spanZ, nose filaments to tail tip;
orchestrator re-derives measured numbers after bake). Hull vertex band
[4 000, 21 000] — the fins keep the wave-8 beads=4 budget override at
detail >= 2 (11 loft rings ~336 tris/flipper at detail 3).

Body plan — one grown loft, a thin undulating ribbon: nose tip z = -3.38,
thickest just aft of the head (z = -0.90, half-beam only 0.72 — the fins,
not the hull, carry the span), long even taper to a tail tip at z = +3.42
beside the driver's engine-glow sphere (z = +l*0.47 = +3.38), so the glow
reads as the body's own bioluminescent wake. A gentle y-offset wave
(+0.05 nose / -0.02 thorax / +0.08 tail) gives the plate's undulating
profile without collapsing spanY. The class read is anatomy, not equipment:

- ONE enormous forward wing pair swept HARD aft: roots buried in the
  forward flank at z = -2.30, starboard tip (x +3.80, z +1.10) — 46 deg of
  sweep, past mid-body — carrying the silhouette and the max beam.
- A second smaller pair near the TAIL (roots z = +1.15, tips z = +2.75),
  echoing the same sweep.
- The pearl-bone back is a separate crest loft ('living-body-ace-crest')
  sunk 0.10 into the indigo hull; the tonal boundary is marked by one
  an.flow_line per flank riding the crest edge.
- The TRAVELING WAVE is the S-curve fold run: three overlapping
  an.fold_crease segments per flank whose ride height snakes +0.13 /
  -0.11 / +0.10 along the body, and the ace's emissive emphasis — TWO
  an.vein_fan calls per flank ('shoulder' 5 branches, 'wave' 6 branches),
  BOTH with bright nodes: the brightest, most concentrated nerve lattice
  of the small classes, every root and tip seated inside the folds by
  sf.flank_x.
- A LOW FLAT sensory fan at the NOSE (org.sensory_crown, 8 filaments,
  forward almost straight ahead with a gentle sea-grass arc) — projected
  sensing filaments, never a raised crown.
- One gill row of two breathing vents low on each flank.
- CONTROLLED ASYMMETRY (bible rule 8): the PORT main fin is healed-torn —
  span cut to x -3.05 (vs +3.80), its trailing region shortened (tip
  z +0.45 vs +1.10) with a ragged narrow tip chord (0.55 vs 0.90), a
  warped lifted tip and one fewer flow line; starboard stays long and
  clean. ONE an.healed_scar slashes across the STARBOARD aft flank.

-ESTIMATED- pre-bake (orchestrator re-derives after measure-ships):
  lod0 MEASURED 2026-08-14: verts 19044; tris 11280/6288/2812 (measure-ships, gltf-transform tri count); largest dim MEASURED 7.7 (spanZ filament tips to tail tip); spanX MEASURED ~6.9 (main wingtips, asymmetric); spanY MEASURED ~1.1; spanX/spanZ MEASURED ~0.90 (inside the <= ~1.05 proxy-clamp rule).

LOD ladder
----------
detail=3  full build: nose fan 8 + tips, both vein fans with nodes,
          creases floor+lips at 0.80 pitch, 2 vents/flank with breath
          glow, scar welt + swell spheres, all flow lines, fins beads=4.
detail=2  constructs count down: vein branches halved (root node only),
          crease pitch 1.80, vents kept without breath glow, scar without
          swells, flow lines full, fins beads=4.
detail=1  primary masses + a hint of each organ: crease floors only,
          one vein branch per fan, nose fan 4, 1 vent/flank, scar single
          chord, fin flow lines to centreline only, fin ring density
          trimmed (beads override released: 9 rings).
detail=0  primary masses only: grown hull loft, pearl crest loft, four
          fin membranes (7 rings).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf
from . import anatomy as an
from . import organs as org


# ===========================================================================
# STATION LIST — the grown dart body (sculpted at the fixed ace envelope)
# ===========================================================================

def _ace_stations(l, b, h):
    """Hull loft stations for the swift-bonded hunter.

    sf.fair near-ellipse sections throughout (k = 0.49, the kit clamp): a
    grown body shows no plank edge. Sculpted at the fixed driver envelope
    l = 7.2: nose tip z = -3.38, tail tip z = +3.42 (engine glow at
    +l*0.47 = +3.38 sits just inside the tail tip). The body is a THIN
    RIBBON — max half-beam 0.72 (b*0.25), max half-height 0.545 (h*0.38) —
    the fins, not the hull, carry the class span; the half-heights stay
    deep enough that spanY cannot collapse (wave-8 lesson).

    Thickest just aft of the head (z = -0.90), long even taper to the tail.
    A gentle y-offset wave (+0.05 nose / -0.02 thorax / +0.08 tail) is the
    plate's undulating side-profile ribbon.
    """
    return [
        # -- HEAD: narrow pointed nose, almost no frontal mass --
        sf.fair(-3.38, 0.05, 0.055, 0.050),   # nose tip
        sf.fair(-3.15, 0.14, 0.130, 0.045),
        sf.fair(-2.85, 0.24, 0.220, 0.035),   # narrow head
        sf.fair(-2.45, 0.40, 0.330, 0.020),
        # -- FORE-BODY: the shoulder swell, thickest just aft of the head --
        sf.fair(-1.95, 0.56, 0.440, 0.005),
        sf.fair(-1.40, 0.68, 0.520, -0.010),
        sf.fair(-0.90, 0.72, 0.545, -0.020),  # thickest — slim thorax
        sf.fair(-0.30, 0.70, 0.510, -0.015),
        # -- MID / TAIL: the long tapering drawn-out tail, rising slightly --
        sf.fair(+0.30, 0.62, 0.450, 0.000),
        sf.fair(+0.90, 0.50, 0.370, 0.020),
        sf.fair(+1.50, 0.37, 0.285, 0.040),
        sf.fair(+2.10, 0.25, 0.205, 0.055),
        sf.fair(+2.70, 0.14, 0.130, 0.070),
        sf.fair(+3.42, 0.05, 0.055, 0.080),   # tail tip at the glow
    ]


def _crest_stations(stations):
    """Pearl-back crest stations, derived from the hull loft.

    A second loft ('living-body-…' -> pearl membrane) riding the hull
    crown: half-width 55 % of the hull section, constant half-height 0.16,
    seated so the crest stands 0.06 proud of the crown and sinks 0.10 into
    the hull solid (the burial is the connectivity). Runs only where the
    hull is fat enough (half-beam >= 0.30): z -2.45 .. +1.50 — the pearl
    back fades into both tapers, keeping the ribbon profile clean.
    """
    crest = []
    for (z, hw, hh, yo, _ch) in stations:
        if hw < 0.30:
            continue
        top = yo + hh
        crest.append(sf.fair(z, max(0.10, hw * 0.55), 0.16, top - 0.10))
    return crest


# ===========================================================================
# SURFACE PATH HELPERS — every point sampled from surface queries
# ===========================================================================

def _crest_edge_path(stations, side, z0, z1, n):
    """Flow-line path riding the hull surface along the crest edge.

    x = crest half-width + 0.02 (just outboard of the pearl/indigo
    boundary), y = sf.top_y at that x, so each point sits exactly on the
    skin; both ends are pulled inboard and down 0.10 to bury the line ends
    inside the body.
    """
    pts = []
    for i in range(n):
        z = z0 + (z1 - z0) * i / (n - 1.0)
        hw, hh, yo, ch = sf.section(stations, z)
        x = max(0.10, hw * 0.55) + 0.02
        y = sf.top_y(stations, z, x)
        pts.append((side * x, y, z))
    if len(pts) >= 2:
        x, y, z = pts[0]
        pts[0] = (x * 0.45, y - 0.10, z)
        x, y, z = pts[-1]
        pts[-1] = (x * 0.45, y - 0.10, z)
    return pts


def _crease_pt(stations, side, z, y, inset=0.07):
    """One vein point inside the fold: flank_x - inset, or None off-body."""
    fx = sf.flank_x(stations, z, y)
    if fx < 0.18:
        return None
    return (side * (fx - inset), y, z)


def _scar_path(stations, side):
    """Healed-scar path across one flank: a diagonal slash on the aft body.

    Interior points ride 0.01 proud of the skin; both ends pull 0.14
    inboard to bury inside the hull solid.
    """
    raw = ((+0.70, +0.20, True), (+1.05, +0.06, False),
           (+1.40, -0.10, False), (+1.75, -0.16, True))
    pts = []
    for z, y, is_end in raw:
        fx = sf.flank_x(stations, z, y)
        if fx < 0.12:
            continue
        x = fx - 0.14 if is_end else fx + 0.01
        pts.append((side * x, y, z))
    return pts


def _vent_points(stations, side, y, zs):
    """Gill-row mouth centres sampled per vent from sf.flank_x."""
    pts = []
    for z in zs:
        fx = sf.flank_x(stations, z, y)
        if fx < 0.20:
            continue
        pts.append((side * fx, y, z))
    return pts


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones swift-bonded hunter (ace class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow'):
                vein cores and nodes, nose-fan tips, vent breath — thin cyan
                lines in the folds and at the filament tips, never on the
                calm pearl back.
    l, b, h  -- class length, beam, height from the driver (7.2, 2.88, 1.44).
    detail   -- 3 full / 2 thinned repeats / 1 hint of each organ /
                0 primary masses only (see module docstring).
    """
    stations = _ace_stations(l, b, h)
    # Vertex budget lever (wave 8): 11 loft rings ~336 tris/flipper at
    # detail 3; released at detail <= 1 so low LODs trim ring density first.
    fin_beads = 4 if detail >= 2 else None

    # ── PRIMARY MASSES (always, detail 0+) ───────────────────────────────
    # The grown body: one continuous loft, indigo living tissue — a thin
    # undulating ribbon; the fins, not the hull, carry the silhouette.
    sf.grown_loft(parts, 'ace.hull', kit.ROLE_HULL, stations, hull_mat)
    # The pearl-bone back: a second loft sunk 0.10 into the hull crown.
    crest = _crest_stations(stations)
    sf.grown_loft(parts, 'living-body-ace-crest', kit.ROLE_ARMOUR,
                  crest, hull_mat)

    # ── FIN SET (always, detail 0+) — the outline-breaker (§G2) ──────────
    # The ENORMOUS forward pair, swept dramatically aft: roots GIVEN INSIDE
    # the forward flank (burial is the connectivity), tips past mid-body.
    # ASYMMETRY: the port fin is healed-torn — shortened span, trailing
    # region cut forward, ragged narrow tip chord, warped tip, one fewer
    # flow line; starboard stays long and clean. Rounded paddle ends come
    # from anatomy's _FLIP_TIP_ROUND — the plate's sharp tips, softened.
    an.fin_membrane(parts, 'fin-ace-wing-stbd', hull_mat,
                    (0.30, 0.02, -2.30), (3.80, 0.02, +1.10),
                    root_chord=2.30, tip_chord=0.90, thick=0.16,
                    detail=detail, flow=3, seed=2, beads=fin_beads)
    an.fin_membrane(parts, 'fin-ace-wing-port', hull_mat,
                    (-0.30, 0.02, -2.30), (-3.05, 0.14, +0.45),
                    root_chord=2.30, tip_chord=0.55, thick=0.16,
                    detail=detail, flow=2, seed=3, beads=fin_beads)
    # Second smaller pair near the TAIL, echoing the same sweep.
    an.fin_membrane(parts, 'fin-ace-tail-stbd', hull_mat,
                    (0.22, -0.02, +1.15), (1.85, 0.02, +2.75),
                    root_chord=1.05, tip_chord=0.48, thick=0.09,
                    detail=detail, flow=2, seed=4, beads=fin_beads)
    an.fin_membrane(parts, 'fin-ace-tail-port', hull_mat,
                    (-0.22, -0.02, +1.15), (-1.85, 0.02, +2.75),
                    root_chord=1.05, tip_chord=0.48, thick=0.09,
                    detail=detail, flow=2, seed=5, beads=fin_beads)

    if detail < 1:
        return

    # ── TRAVELING-WAVE FOLDS (detail 1+) ─────────────────────────────────
    # Three overlapping crease segments per flank whose ride height snakes
    # down the body: +0.13 / -0.11 / +0.10 — the S-curve the propulsion
    # wave travels along. Each segment seats through its own surf callback
    # and self-trims off the taper.
    crease_segs = ((-2.45, -0.95, +0.13),
                   (-1.00, +0.65, -0.11),
                   (+0.60, +2.05, +0.10))
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        for i, (z0, z1, y) in enumerate(crease_segs):
            an.fold_crease(parts, 'ace-fold-%s-%d' % (tag, i), hull_mat,
                           z0, z1, y, sf.surf_flank(stations, y),
                           side=side, detail=detail)

    # ── NERVE LINES (detail 1+) — the ace's emissive emphasis ────────────
    # Two fans per flank, brighter and more concentrated than any other
    # class: 'shoulder' in the forward fold (5 branches), 'wave' following
    # the S-curve from the low mid fold up into the aft fold (6 branches) —
    # BOTH carry bright nodes at detail 3. Branch tips alternate high/low
    # along the folds so the lattice reads as flowing S-curves, never a
    # mechanical grid. Every root and tip is seated inside the folds by
    # sf.flank_x; points that fall off the body are dropped.
    shoulder = ((-2.30, +0.13),)  # root
    shoulder_tips = ((-2.42, +0.16), (-2.06, +0.09), (-1.70, +0.15),
                     (-1.32, +0.09), (-0.98, +0.14))
    wave = ((-0.85, -0.11),)      # root
    wave_tips = ((-0.45, -0.13), (+0.05, -0.09), (+0.55, +0.03),
                 (+1.05, +0.11), (+1.55, +0.12), (+1.95, +0.09))
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        out = (side, 0.0, 0.0)
        root = _crease_pt(stations, side, *shoulder[0])
        tips = [p for p in (_crease_pt(stations, side, z, y)
                            for z, y in shoulder_tips) if p is not None]
        if root is not None and tips:
            an.vein_fan(parts, glow, 'ace-shoulder-%s' % tag,
                        hull_mat, glow_mat, root, tips, out,
                        detail=detail, nodes=True)
        root = _crease_pt(stations, side, *wave[0])
        tips = [p for p in (_crease_pt(stations, side, z, y)
                            for z, y in wave_tips) if p is not None]
        if root is not None and tips:
            an.vein_fan(parts, glow, 'ace-wave-%s' % tag,
                        hull_mat, glow_mat, root, tips, out,
                        detail=detail, nodes=True)

    # ── FLOW LINES (detail 1+) — the pearl/indigo boundary ───────────────
    # One run per flank along the crest edge; fin spans carry their own.
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        an.flow_line(parts, 'ace-flow-crest-%s' % tag, hull_mat,
                     _crest_edge_path(stations, side, -2.40, +1.45, 6),
                     detail=detail)

    # ── HEALED SCAR (detail 1+) — the ONE sanctioned asymmetry mark ──────
    # A pale welt slashing across the STARBOARD aft flank (the torn fin is
    # port): healed experience, one mark, never decoration.
    scar = _scar_path(stations, 1.0)
    if len(scar) >= 2:
        an.healed_scar(parts, 'ace-scar-stbd', hull_mat, scar,
                       thick=0.08, detail=detail)

    # ── NOSE SENSORY FAN (detail 1+) — the only fine detail forward ──────
    # NOT a raised crown: a LOW FLAT fan of fine filaments projected from
    # the nose, forward almost straight ahead with a gentle sea-grass arc
    # (arc=0.22) so the cyan tips reach toward the shoulder nerve lines.
    # Root given INSIDE the narrow head mass. Absolute filament size
    # (sf.FILAMENT_*), never scaled — fine and sensory, never muscular.
    org.sensory_crown(parts, glow, 'ace', hull_mat, glow_mat,
                      (0.0, 0.03, -2.98), forward=(0.0, 0.05, -1.0),
                      count=8, detail=detail, seed=11, arc=0.22)

    # ── BREATHING VENTS (detail 1+) — one gill row low on each flank ─────
    # Two mouths per flank at the fleet-absolute sf.VENT_R, each centre
    # sampled from sf.flank_x at its own station (never a shared typed y).
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        pts = _vent_points(stations, side, -0.14, (-1.50, -0.60))
        if pts:
            org.breathing_vents(parts, glow, 'ace-gills-%s' % tag,
                                hull_mat, glow_mat, (0.0, 0.0, 0.0),
                                face='x', detail=detail, points=pts)
