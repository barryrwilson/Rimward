"""Unknowables Ace — FAST KNOT.

Bible §4.7: "A denser, brighter field with tightly wound loops and a long
controlled lensing wake. Its signature is temporal precision, not more
random arcs."

Plate (docs/FactionExamples/07-unknowables-ship.png): ephemeral lace, not
haze and not a hull. A pointed travel tip (ship -Z), a compact cluster of
dark glossy energy cells, nested orbital loops, thin luminous threads, and
outer lensing arcs that stream cyan toward the wake (ship +Z).

Envelope (driver): l = 7.2, b = 2.88, h = 1.44. Span band [4.32, 10.08];
authored largest-dimension target ~7.2. Hull vertex band [4 000, 21 000].
The field is sculpted at that fixed ace envelope. Wake end sits at the
driver engine-glow sphere (z = +l*0.47 = +3.38). Relief uses the
unknowables floors: L/B >= 0.70, H/L <= 1.15, B/L >= 0.45.

Body plan — a tight traveling knot, not a plated dart:
- Pointed tip at z = -3.82 (sf.TIP_LEN meridians, not a metal prow).
- Compact cell cluster on the spine through the knot (MORE cells at
  CELL_R / CELL_PITCH, never bigger cells) plus two overlapping knot
  cells so the matter reads as a wound pack.
- Five nested orbital loops at the knot with small equal tilt steps,
  plus a short coil of face-Z loops along the same span.
- Long controlled lensing arcs and lace streams toward +Z; the lace
  ends at the engine glow. No random scatter.

-ESTIMATED- pre-bake (orchestrator re-derives after measure-ships):
  largest dim ~7.2 (tip to wake glow); beam from the outer wake arcs;
  cells + motes keep hull colours from reading as one material.

LOD ladder (matches field.py thinning)
----------
detail=3  five nested loops, four coil loops, three wake arcs, six
          knot-helix lace paths, three wake streams, spine lace,
          full tip, cell pack, two motes.
detail=2  nested loops kept (field.py), two coil, two arcs, four
          helix paths, two wake streams, spine, tip meridians 6.
detail=1  two nested loops (field.py), two coil, one arc, two helix
          paths, one wake stream, spine, tip meridians 4, one extra
          mote dropped.
detail=0  cell pack, one nested loop, tip (one ring), one sync mote.
"""
import math

from . import field as fd
from . import nodes as nd
from . import surface as sf


# ===========================================================================
# STATION LIST — compact knot, pointed tip, long wake
# ===========================================================================

def _ace_stations(l, b, h):
    """Field stations for the fast knot.

    Sculpted at the fixed ace driver (l = 7.2). Nose at z = -3.82, wake
    end at z = +3.38 beside +l*0.47. Max half-beam 1.72 (beam 3.44) so
    B/L stays at or above 0.45 even before the outer arcs add span.
    l, b, h name the driver; the stations do not scale from them.
    """
    _ = (l, b, h)
    return (
        sf.station(-3.82, 0.04, 0.04, 0.0),
        sf.station(-3.20, 0.22, 0.20, 0.0),
        sf.station(-2.40, 0.68, 0.62, 0.0),
        sf.station(-1.40, 1.42, 1.30, 0.0),
        sf.station(-0.40, 1.72, 1.58, 0.0),
        sf.station(+0.50, 1.52, 1.40, 0.0),
        sf.station(+1.50, 1.02, 0.94, 0.0),
        sf.station(+2.40, 0.56, 0.50, 0.0),
        sf.station(+3.38, 0.16, 0.14, 0.0),
    )


# ===========================================================================
# SURFACE PATH HELPERS — every point sampled from surface queries
# ===========================================================================

def _zs(z0, z1, n):
    if n < 2:
        return [z0]
    return [z0 + (z1 - z0) * float(i) / float(n - 1) for i in range(n)]


def _spine_path(stations, z0, z1, n):
    """Centreline polyline from z0 to z1."""
    return [sf.spine(stations, z) for z in _zs(z0, z1, n)]


def _helix_path(stations, z0, z1, n, phase, turns, inset):
    """Ordered elliptical helix inside the envelope. Deterministic."""
    zs = _zs(z0, z1, n)
    pts = []
    last = float(n - 1) if n > 1 else 1.0
    for i, z in enumerate(zs):
        t = float(i) / last
        hw, hh, yo = sf.interpolate(stations, z)
        rw = hw - inset
        rh = hh - inset
        if rw <= 0.06 or rh <= 0.06:
            pts.append(sf.spine(stations, z))
            continue
        ang = phase + turns * 2.0 * math.pi * t
        pts.append((
            rw * math.cos(ang),
            yo + rh * math.sin(ang),
            z,
        ))
    return pts


def _knot_majors(stations, knot_z):
    """Five close major radii inside the knot envelope."""
    r = sf.radius_at(stations, knot_z)
    start = r * 0.50
    step = r * 0.10
    return tuple(start + step * float(i) for i in range(5))


def _knot_tilts():
    """Small equal tilt steps around face-Z. Precision, not scatter."""
    face = math.pi * 0.5
    step = 0.16
    return (
        (face, 0.0, 0.0),
        (face, 0.0, step),
        (face, step, 0.0),
        (face + step, 0.0, step),
        (face, step, step),
    )


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Unknowables fast knot (ace class).

    parts    -- list that receives cells (ROLE_ARMOUR) and motes
                (ROLE_ACCENT).
    glow     -- list that receives lace, loops, arcs and the tip
                (skin_role='glow').
    l, b, h  -- class length, beam, height from the driver
                (7.2, 2.88, 1.44). Wake end is +l*0.47.
    detail   -- 3 full / 2 thinned repeats / 1 hint / 0 primary masses.
    """
    _ = (b, h)
    stations = _ace_stations(l, b, h)
    wake_z = l * 0.47
    tip = sf.tip_point(stations)
    nose = sf.nose_z(stations)
    knot_z = -0.40
    knot = sf.spine(stations, knot_z)

    # ── PRIMARY MASSES (always, detail 0+) ───────────────────────────────
    # Compact centreline pack through the knot. MORE cells, never bigger.
    nd.cell_procession(
        parts, 'cell-ace', hull_mat, -1.10, 0.90, knot[0], knot[1], detail
    )
    nd.energy_cell(
        parts, 'cell-ace-knot-a', hull_mat,
        (knot[0] + 0.18, knot[1] + 0.14, knot_z), detail,
    )
    nd.energy_cell(
        parts, 'cell-ace-knot-b', hull_mat,
        (knot[0] - 0.18, knot[1] - 0.14, knot_z), detail,
    )
    # One mote always, so hull colours are not uniform.
    nd.sync_mote(
        parts, 'mote-ace-knot', hull_mat,
        (knot[0] + 0.26, knot[1] + 0.20, knot_z), detail,
    )
    # Face-Z nest first so join() inherits that torus rotation. A diagonal
    # tip meridian as parts[0] inflates the exported AABB (wave 49 Box3
    # read ace 8.0 against a 7.2 vertex span).
    fd.nested_loops(
        glow, 'loop-ace-nest', glow_mat, knot,
        _knot_majors(stations, knot_z), _knot_tilts(), detail,
    )
    fd.field_tip(glow, 'tip-ace', glow_mat, tip, sf.TIP_LEN, detail)

    if detail < 1:
        return

    # ── COIL + SECOND MOTE (detail 1+) ───────────────────────────────────
    coil_zs = (-0.90, -0.55, -0.20, 0.15)
    n_coil = 4 if detail >= 2 else 2
    for i, z in enumerate(coil_zs[:n_coil]):
        major = sf.radius_at(stations, z) - 0.22
        if major <= sf.LOOP_MINOR:
            continue
        rot = (math.pi * 0.5, 0.0, 0.16 * float(i))
        fd.orbital_loop(
            glow, 'loop-ace-coil-%d' % i, glow_mat,
            sf.spine(stations, z), major, rot, detail,
        )
    fore = sf.spine(stations, -1.10)
    nd.sync_mote(
        parts, 'mote-ace-fore', hull_mat,
        (fore[0] + 0.10, fore[1] + 0.08, fore[2]), detail,
    )

    # ── LONG CONTROLLED LENSING WAKE (detail 1+) ─────────────────────────
    # Horizontal / slightly tilted arcs wrap the knot into the glow.
    # Small equal tilt steps. Not face-Z, so the ring is long on Z.
    wake_arcs = (
        (0.85, 2.15, (0.14, 0.0, 0.10)),
        (1.15, 2.28, (0.28, 0.0, 0.08)),
        (1.40, 1.92, (0.42, 0.0, 0.06)),
    )
    if detail >= 3:
        n_arc = 3
    elif detail >= 2:
        n_arc = 2
    else:
        n_arc = 1
    for i, (az, major, rot) in enumerate(wake_arcs[:n_arc]):
        if az > wake_z:
            continue
        fd.lensing_arc(
            glow, 'arc-ace-wake-%d' % i, glow_mat,
            sf.spine(stations, az), major, rot, detail,
        )

    # ── LACE (detail 1+) — ordered helix and wake streams ────────────────
    fd.filament_lace(
        glow, 'lace-ace-spine', glow_mat,
        _spine_path(stations, nose, wake_z, 12), detail,
    )
    if detail >= 3:
        n_helix = 6
    elif detail >= 2:
        n_helix = 4
    else:
        n_helix = 2
    for i in range(n_helix):
        phase = 2.0 * math.pi * float(i) / float(n_helix)
        fd.filament_lace(
            glow, 'lace-ace-knot-%d' % i, glow_mat,
            _helix_path(stations, -2.10, 0.85, 9, phase, 1.60, 0.10),
            detail,
        )
    if detail >= 3:
        n_wake = 3
    elif detail >= 2:
        n_wake = 2
    else:
        n_wake = 1
    for i in range(n_wake):
        phase = 2.0 * math.pi * float(i) / float(n_wake)
        fd.filament_lace(
            glow, 'lace-ace-wake-%d' % i, glow_mat,
            _helix_path(stations, 0.50, wake_z, 10, phase, 0.35, 0.08),
            detail,
        )
