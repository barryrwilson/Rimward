"""Beautiful Ones Light — YOUNG WAYFINDER.

Bible §4.6: "The closest family resemblance to the Player ship: small,
curious, broad-winged, and lightly built, with a distinct crown and short
tail. Differentiate it through head and fin anatomy, not color alone."

Plate: beautiful-light-young-wayfinder.png — the most youthful, animal-like
class: a compact dolphin-manta. Broad diamond manta plan from above; raised
dolphin-like back and low belly in profile; a SOFT dorsal crest, never a
hard dorsal fin. The painting's obvious eye/dolphin face is interpretive —
no eye is built; the brow lobes and lifted throat carry the face. Fin ends
stay rounded paddles (anatomy._FLIP_TIP_ROUND).

Envelope (driver): l = 7.8, b = 3.28, h = 1.87.
Authored largest-dimension target: ~7.7 (spanZ nose-lobes to tail tip,
spanX wingtip to wingtip ~7.4 — spanX/spanZ ~0.95, inside the 1.05
collision-proxy clamp rule). SHIP_SCALE.light span band 4.08-9.52, hull
vertex band 4 000-25 000. Orchestrator fills measured numbers after bake.

BODY PLAN
---------
One grown loft, THICKEST AT THE SHOULDERS (station 4 of 9, z = -0.179l),
narrowing quickly into a SHORT tail that ends at z = l*0.462, just short of
the driver's engine-glow sphere at z = l*0.47, so the glow reads as the
body's own bioluminescent wake. Section y_offsets arch the back up over the
brow and shoulders and drop the belly low — the dolphin profile. The
outline is the FIN SET, not the loft:

- a broad forward WING PAIR (root chord 2.30, half-span 3.68, max span
  ~7.4 against the band 4.08-9.52) sweeping back past the shoulders to
  mid-body — the broad diamond manta plan from above — each wing carrying
  4 spanwise flow lines and one long trailing tip filament (the family's
  trailing-tip signature);
- a second SMALLER fin pair at the tail root (half-span 1.85), so the rear
  body reads complete, never cut off;
- a tiny whale-like FLUKE pair at the tail tip — horizontal paddles, the
  cetacean after-body.

The head is the class read: two soft pearl CEPHALIC LOBES (in-hull swell
spheres, manta not teeth) protruding past the nose and flanks, a pearl
throat swell under the head (the curious lifted chin), and the clearest
class cue — a full 8-filament SENSORY CROWN rising from the forehead and
leaning FORWARD (sensory_crown arc), each filament ending in a brighter
cyan droplet tip. The pearl back is one grown cap loft
('living-body-…', 6 stations, bottom edge buried 0.40 in the indigo hull)
kept CALM: nothing on it but the crown at its forward end and the SOFT
DORSAL CREST — a second narrow grown loft ('living-crest-…') whose swollen
ridge peaks 0.26 proud over the shoulders and tapers to nothing fore and
aft; a living crest, never a fitted fin. The pearl/indigo boundary is one
flow line per flank, plus a pale ventral keel line. The vein lattice lives
in the folds where the fins meet the body: 3 fans — one per wing fold, one
in the starboard aft-fin fold — each inside its own fold crease. One
breathing vent pair low on the mid flanks (radius 0.16, under the absolute
fleet vent: a young animal's small mouths).

DELIBERATE ASYMMETRY (bible rule 8): ONE pale DIAGONAL healed scar rides
the PORT flank under the wing root (z -1.60..+0.20, falling from y +0.30
to y -0.30) — low contrast, healed experience, not injury; the third vein
fan answers it on the STARBOARD aft fold. Nothing else breaks the mirror.

LOD LADDER
----------
detail=3  full build: crown of 8 with glow tips, 3 vein fans (6/6/3
          branches, nodes), all creases with lips, vents with breath glow,
          scar with swells, all flow lines.
detail=2  constructs thin themselves (crown 8, vein branches halved,
          crease pitch widens, vent glow drops, scar swells drop, flipper
          rings 13 -> 10).
detail=1  primary masses + a hint of each organ: crown of 4, one-branch
          veins, crease floors only, single-chord scar, one vent per
          flank, decimated flow lines, flipper rings 9. Trailing filaments
          kept (outline).
detail=0  primary masses only: grown loft, pearl back cap, dorsal crest,
          the three fin pairs, cephalic lobes, throat. Flipper rings 7.

Estimated vertex counts (path-loft flippers: 194/98/68/47 verts each at
detail 3/2/1/0):
    lod0 (detail 3) MEASURED 2026-08-14: verts 19260; tris lod0=12112 lod1=7572 lod2=3696 (measure-ships, gltf-transform tri count)
    lod1 (detail 2) hull band 4 000-25 000, tri cap 24 000
    lod2 (detail 1) tri cap 8 000
    lod3 (detail 0) ~  800   (light bakes lod0-2; freighter-only lod3)
Density is spent on anatomy — crown, veins, creases, vents — not on
subdivided primitives. The silhouette (loft, cap, crest, all three fin
pairs, lobes, throat) is never trimmed.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf
from . import anatomy as an
from . import organs as org


# ===========================================================================
# STATION LIST — authored first; every anchor below is read off it.
# ===========================================================================

def _light_stations(l, b, h):
    """Grown-body loft stations for the young wayfinder.

    Near-ellipse sections (sf.fair at the kit's 0.49 clamp): a swollen
    living section with no flat face and no corner. THICKEST AT THE
    SHOULDERS (z = -0.179l), narrowing quickly into a SHORT tail that
    tapers to a fine tip at z = l*0.462 so the driver's engine glow at
    l*0.47 reads as the wake. Positive y_offset over the brow and shoulders
    arches the dolphin back; the deep mid sections (half-height 1.24, past
    the driver's h/2 = 0.935 by the wave-8 lesson that spanY must not
    collapse) keep the belly low. Half-widths stay inside the envelope
    (b/2 = 1.64); the beam gate is met by the wings, not the body.
    """
    return [
        sf.fair(l * -0.520, 0.22, 0.30,  0.02),   # nose tip
        sf.fair(l * -0.410, 0.74, 0.80,  0.07),   # brow — raised forehead
        sf.fair(l * -0.308, 1.12, 1.08,  0.06),   # head
        sf.fair(l * -0.179, 1.56, 1.24,  0.05),   # SHOULDERS — thickest
        sf.fair(l * -0.038, 1.40, 1.10,  0.02),   # mid-body, narrowing
        sf.fair(l *  0.115, 1.02, 0.84,  0.00),   # aft body
        sf.fair(l *  0.244, 0.58, 0.50,  0.00),   # tail root (short tail)
        sf.fair(l *  0.372, 0.30, 0.27,  0.00),   # tail mid
        sf.fair(l *  0.462, 0.11, 0.12,  0.00),   # tail tip
    ]


# ===========================================================================
# SURFACE PATH HELPERS (gilded cutter idiom: sample, skip fallen sections,
# bury the ends)
# ===========================================================================

def _back_stations(stations, zs):
    """Pearl back-cap loft stations read off the hull stations.

    The cap's top stands 0.12 proud of the back and its bottom edge sits
    0.40 below the crest, buried in the hull — the cap pierces the loft
    along its whole run, so it can never float. Half-width is sampled on
    the hull flank 0.18 below the crest and pulled 0.10 inboard, so the
    cap's own flank stays inside the hull skin and the pearl/indigo
    boundary falls on the hull's upper roll, gradual, never a bounded
    two-tone region. Returns [] where the body has fallen too fine.
    """
    out = []
    for z in zs:
        ty = sf.top_y(stations, z)
        hwb = sf.flank_x(stations, z, ty - 0.18) - 0.10
        if hwb <= 0.12:
            continue                     # tail too fine — cap self-trims
        out.append(sf.fair(z, hwb, 0.26, ty - 0.14))
    return out


def _crest_stations(stations, profile):
    """Soft dorsal-crest loft stations read off the hull's spine.

    ``profile`` is a list of (z, half_w, proud) tuples. Each crest station
    is a narrow near-ellipse whose bottom edge sits 0.30 BELOW the hull's
    back (buried through the pearl cap into the hull — the crest can never
    float) and whose top stands ``proud`` above it: a swollen living ridge
    that peaks over the shoulders and tapers to nothing at both ends, the
    plate's soft dolphin crest — never a hard dorsal fin.
    """
    out = []
    for z, hw, proud in profile:
        if hw <= 0.10:
            continue
        ty = sf.top_y(stations, z)
        hh = (proud + 0.30) * 0.5
        out.append(sf.fair(z, hw, hh, ty + (proud - 0.30) * 0.5))
    return out


def _margin_path(stations, side, z0, z1, drop, n=8):
    """Points riding the hull flank at ``drop`` below the crest.

    The pearl/indigo boundary line. Stations where the flank has fallen
    away are skipped; both ends are pulled 0.12 inboard so the strut chain
    buries into the body (pipeline §6 floating-strip fix).
    """
    pts = []
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + (z1 - z0) * t
        y = sf.top_y(stations, z) - drop
        fx = sf.flank_x(stations, z, y)
        if fx <= 0.05:
            continue
        x = fx + 0.02
        if not pts or i == n - 1:
            x -= 0.12                    # bury the run's ends
        pts.append((side * x, y, z))
    if len(pts) < 2:
        return []
    return pts


def _keel_path(stations, z0, z1, n=10):
    """Points riding the belly centreline, ends lifted 0.12 into the body."""
    pts = []
    for i in range(n):
        t = i / (n - 1.0)
        z = z0 + (z1 - z0) * t
        by = sf.bottom_y(stations, z)
        y = by + 0.02
        if not pts or i == n - 1:
            y += 0.12                    # bury the run's ends
        pts.append((0.0, y, z))
    return pts


def _flank_path(stations, side, points, proud=0.03):
    """Points riding the flank along (z, y) pairs; both ends buried 0.12.

    The scar's diagonal sampler: each (z, y) is dropped to the skin with
    sf.flank_x; stations where the flank has fallen away are skipped.
    """
    pts = []
    for z, y in points:
        fx = sf.flank_x(stations, z, y)
        if fx <= 0.05:
            continue
        x = fx + proud
        if not pts or (z, y) == points[-1]:
            x -= 0.12 + proud            # end sits 0.12 inside the skin
        pts.append((side * x, y, z))
    if len(pts) < 2:
        return []
    return pts


def _crease_point(stations, side, y, z, inset=0.14):
    """One point inside the fold-crease floor: 0.14 inboard of the skin.

    The crease floor box spans 0.16 inboard from the skin, so a point at
    0.14 sits inside the floor, and the vein sheath (real radius 0.0675)
    around it always shares material with the floor and the hull behind
    it. Returns None where the flank has fallen away.
    """
    fx = sf.flank_x(stations, z, y)
    if fx <= 0.20:
        return None
    return (side * (fx - inset), y, z)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Beautiful Ones young wayfinder (light class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_RECESS /
                ROLE_TRIM / ROLE_ACCENT objects.
    glow     -- list that receives emissive objects (skin_role='glow'):
                vein cores and nodes, crown droplet tips, vent breath. All
                thin and in the folds or at the crown — never on the calm
                pearl back, far under the 5 % hull-area cap.
    l, b, h  -- class length, beam, height from the driver (7.8, 3.28, 1.87).
    detail   -- 3 full  2 thinned repeats  1 primary masses + organ hints
                0 primary masses only.
    """
    stations = _light_stations(l, b, h)

    # Zone anchors (absolute, world units)
    z_head  = l * -0.327    # ≈ -2.55  crown station, back-cap forward end
    z_wing  = l * -0.244    # ≈ -1.90  wing root station

    # ── PRIMARY MASSES (always, detail 0+) ───────────────────────────────
    # Grown body: indigo living tissue, one continuous loft.
    sf.grown_loft(parts, 'light.hull', kit.ROLE_HULL, stations, hull_mat)

    # Pearl back cap: a second grown loft seated through the hull's dorsal
    # skin (buried 0.40, proud 0.12). 'living-body-…' + ROLE_ARMOUR paints
    # it pearl membrane; the indigo flanks stay the base hull below.
    back = _back_stations(stations, [z_head, l * -0.231, l * -0.077,
                                     l * 0.077, l * 0.192, l * 0.269])
    if len(back) >= 2:
        sf.grown_loft(parts, 'living-body-light.back', kit.ROLE_ARMOUR,
                      back, hull_mat)

    # Soft dorsal crest: a narrow swollen loft on the spine, peaking 0.26
    # proud over the shoulders and tapering to nothing fore and aft — the
    # plate's raised dolphin back line, grown, never a hard dorsal fin.
    crest = _crest_stations(stations, [
        (l * -0.282, 0.16, 0.10),
        (l * -0.205, 0.24, 0.18),
        (l * -0.128, 0.30, 0.26),
        (l * -0.051, 0.28, 0.22),
        (l *  0.026, 0.22, 0.14),
        (l *  0.090, 0.14, 0.08),
    ])
    if len(crest) >= 2:
        sf.grown_loft(parts, 'living-crest-light', kit.ROLE_ARMOUR,
                      crest, hull_mat)

    # Broad forward wing pair — THE outline, the manta pectoral plane.
    # Roots GIVEN INSIDE the hull (the burial is the connectivity); tips
    # sweep back past the shoulders to mid-body: the broad diamond plan.
    # Max span ~7.4 (band 4.08-9.52). 4 spanwise flow lines each ride the
    # flipper's crown, sampled on the same bezier the loft is swept on.
    an.fin_membrane(parts, 'fin-wing-starboard', hull_mat,
                    (0.30, 0.06, z_wing), (3.52, -0.10, l * -0.013),
                    2.30, 1.00, thick=0.11, detail=detail, flow=4, seed=3)
    an.fin_membrane(parts, 'fin-wing-port', hull_mat,
                    (-0.30, 0.06, z_wing), (-3.52, -0.10, l * -0.013),
                    2.30, 1.00, thick=0.11, detail=detail, flow=4, seed=4)

    # Second SMALLER fin pair at the tail root — same idiom, shorter chord
    # and span, so the rear body reads as a complete animal, never cut off.
    an.fin_membrane(parts, 'fin-aft-starboard', hull_mat,
                    (0.22, -0.02, l * 0.141), (1.85, -0.18, l * 0.321),
                    1.10, 0.46, thick=0.09, detail=detail, flow=2, seed=5)
    an.fin_membrane(parts, 'fin-aft-port', hull_mat,
                    (-0.22, -0.02, l * 0.141), (-1.85, -0.18, l * 0.321),
                    1.10, 0.46, thick=0.09, detail=detail, flow=2, seed=6)

    # Tiny whale-like FLUKE pair at the tail tip — horizontal paddles, the
    # cetacean after-body, so the short tail ends in fins, not a cut.
    an.fin_membrane(parts, 'fin-fluke-starboard', hull_mat,
                    (0.08, 0.02, l * 0.385), (0.95, 0.06, l * 0.455),
                    0.62, 0.30, thick=0.09, detail=detail, flow=0, seed=7)
    an.fin_membrane(parts, 'fin-fluke-port', hull_mat,
                    (-0.08, 0.02, l * 0.385), (-0.95, 0.06, l * 0.455),
                    0.62, 0.30, thick=0.09, detail=detail, flow=0, seed=8)

    # Head anatomy: two soft pearl cephalic lobes (manta, not teeth, and
    # NOT eyes — the plate's dolphin face is interpretive). Centres inside
    # the head section; the swells protrude ~0.10 past the nose tip and
    # ~0.30 outboard of the head flank, below the brow line.
    for side, tag in ((1.0, 'starboard'), (-1.0, 'port')):
        kit.sphere(parts, 'living-lobe-%s' % tag, kit.ROLE_ARMOUR,
                   (side * 0.44, 0.04, l * -0.444), (0.44, 0.27, 0.70),
                   hull_mat, segments=16)
    # Pearl throat swell under the head — the curious lifted chin, keeping
    # the belly low in profile.
    kit.sphere(parts, 'living-throat-light', kit.ROLE_ARMOUR,
               (0.0, sf.bottom_y(stations, l * -0.333) + 0.10, l * -0.333),
               (0.55, 0.30, 0.65), hull_mat, segments=16)

    if detail < 1:
        return

    # ── TRAILING TIP FILAMENTS (detail 1+) ───────────────────────────────
    # The silhouette family's long trailing fin tips: one thin grown
    # filament trails aft from each wing tip's trailing edge. The wing is
    # a smooth welded path-loft with a ROUNDED paddle cap (tip half-chord
    # 0.50, tip half-thickness >= _FLIP_TIP_ROUND of root), so the filament
    # start is seated INSIDE the cap: sample the flipper's curved
    # centreline at t = 0.96 — inboard of the authored tip, inside the cap
    # arc — then step 0.25 along the horizontal aft perpendicular of the
    # span. The filament grows out of the rounded paddle, never floats
    # beside it. Seeds match the wing calls above so the curve sampled
    # here IS the built curve.
    for side, tag, fseed in ((1.0, 'starboard', 3), (-1.0, 'port', 4)):
        root = (side * 0.30, 0.06, z_wing)
        tip = (side * 3.68, -0.10, l * -0.013)
        dx, dz = tip[0] - root[0], tip[2] - root[2]
        n = math.hypot(dx, dz)
        # horizontal unit perpendicular to the span, pointing aft (+z)
        cx, cz = -dz / n * (1.0 if side > 0.0 else -1.0), abs(dx) / n
        px, py, pz = an.flipper_point(root, tip, 0.96, seed=fseed)
        a = (px + cx * 0.25, py, pz + cz * 0.25)
        b_pt = (px + cx * 1.60, py - 0.10, pz + cz * 1.60)
        kit.strut(parts, 'fin-wing-%s-trail' % tag, kit.ROLE_ARMOUR,
                  a, b_pt, hull_mat, radius=0.032, vertices=6)

    # ── SENSORY CROWN (detail 1+) ────────────────────────────────────────
    # The clearest class cue: a curious fan of 8 long fine filaments rising
    # from the forehead, leaning FORWARD (forward vector tilted down-nose;
    # arc 0.30 deepens the sea-grass bow past the 0.18 default), each
    # ending in a brighter cyan droplet tip. The root is buried 0.14 inside
    # the head crest, inside both the hull and the pearl cap.
    org.sensory_crown(parts, glow, 'light', hull_mat, glow_mat,
                      (0.0, sf.top_y(stations, z_head) - 0.14, z_head),
                      forward=(0.0, 0.40, -1.0), count=8, detail=detail,
                      seed=11, arc=0.30)

    # ── FOLD CREASES + VEIN FANS (detail 1+) ─────────────────────────────
    # The vein lattice lives in the folds where the fins meet the body:
    # one fan per wing fold, one in the starboard aft-fin fold.
    # fold_crease re-samples the flank per segment and self-trims.
    an.fold_crease(parts, 'light.fold.wing.starboard', hull_mat,
                   l * -0.333, l * -0.077, 0.04,
                   sf.surf_flank(stations, 0.04), side=1.0, detail=detail)
    an.fold_crease(parts, 'light.fold.wing.port', hull_mat,
                   l * -0.333, l * -0.077, 0.04,
                   sf.surf_flank(stations, 0.04), side=-1.0, detail=detail)
    an.fold_crease(parts, 'light.fold.aft.starboard', hull_mat,
                   l * 0.115, l * 0.295, -0.04,
                   sf.surf_flank(stations, -0.04), side=1.0, detail=detail)

    for side, tag in ((1.0, 'starboard'), (-1.0, 'port')):
        tips = []
        for tz in (-2.40, -2.10, -1.80, -1.50, -1.20, -0.90):
            p = _crease_point(stations, side, 0.04, tz)
            if p is not None:
                tips.append(p)
        root = _crease_point(stations, side, 0.04, -1.60)
        if root is not None and tips:
            an.vein_fan(parts, glow, 'wing-%s' % tag, hull_mat, glow_mat,
                        root, tips, (side, 0.0, 0.0), detail=detail)
    aft_tips = []
    for tz in (1.05, 1.55, 2.05):
        p = _crease_point(stations, 1.0, -0.04, tz)
        if p is not None:
            aft_tips.append(p)
    aft_root = _crease_point(stations, 1.0, -0.04, 1.40)
    if aft_root is not None and aft_tips:
        an.vein_fan(parts, glow, 'aft-starboard', hull_mat, glow_mat,
                    aft_root, aft_tips, (1.0, 0.0, 0.0), detail=detail)

    # ── FLOW LINES (detail 1+) ───────────────────────────────────────────
    # The pearl/indigo boundary: one long gradual line per flank riding
    # 0.20 below the crest, plus the pale ventral keel line. Fin-span flow
    # lines are grown by fin_membrane itself. Detail 1 decimates the runs.
    n_flow = 8 if detail >= 2 else 5
    for side, tag in ((1.0, 'starboard'), (-1.0, 'port')):
        path = _margin_path(stations, side, l * -0.308, l * 0.256, 0.20,
                            n=n_flow)
        if path:
            an.flow_line(parts, 'light.margin.%s' % tag, hull_mat, path,
                         detail=detail)
    keel = _keel_path(stations, l * -0.333, l * 0.410,
                      n=10 if detail >= 2 else 6)
    if keel:
        an.flow_line(parts, 'light.keel', hull_mat, keel, detail=detail)

    # ── BREATHING VENTS (detail 1+) ──────────────────────────────────────
    # One small vent per flank, low amidships — a young animal's mouths at
    # radius 0.16, under the fleet's absolute 0.30. Points sampled on the
    # skin at each vent's own station (never a typed y row).
    for side, tag in ((1.0, 'starboard'), (-1.0, 'port')):
        pts = []
        for vz in (l * 0.013, l * 0.103):
            fx = sf.flank_x(stations, vz, -0.30)
            if fx > 0.20:
                pts.append((side * fx, -0.30, vz))
        if pts:
            org.breathing_vents(parts, glow, 'light.vent.%s' % tag,
                                hull_mat, glow_mat, pts[0], face='x',
                                points=pts, radius=0.16, detail=detail)

    # ── HEALED SCAR — the ONE deliberate asymmetry (detail 1+) ──────────
    # ONE pale DIAGONAL welt on the PORT flank under the wing root, falling
    # from y +0.30 forward to y -0.30 aft — low contrast, healed
    # experience, not injury. Nothing mirrors it.
    scar = _flank_path(stations, -1.0, [
        (l * -0.205, 0.30),
        (l * -0.154, 0.18),
        (l * -0.090, 0.02),
        (l * -0.026, -0.16),
        (l *  0.026, -0.30),
    ])
    if scar:
        an.healed_scar(parts, 'light.scar.port', hull_mat, scar,
                       thick=0.08, detail=detail)
