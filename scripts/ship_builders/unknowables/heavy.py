"""Unknowables Heavy - COMPRESSION MANIFOLD.

Bible §4.7: "A thick toroidal configuration with multiple anchor masses
and broad plasma planes that flare defensively. It should occupy more
volume without appearing solid."
Plate: docs/FactionExamples/07-unknowables-ship.png — ephemeral lace,
not haze, not a hull. This class is the fat doughnut of that language:
a large nested torus family, several dark CELL_R knots at distinct
nodes, and ordered filament sheets that occupy volume without a shell.

Body plan — a compression manifold, not a keel and not a plated citadel:

- ONE LARGE TORUS FAMILY (fd.nested_loops) seated at the fat mid-field.
  Majors come from the local envelope radius (large: on the order of
  the half-beam). The first major is the cardinal ring so lod3 still
  reads as a doughnut. Mixed tilts thicken the nest in X, Y and Z.
- SEVERAL ANCHOR MASSES at distinct nodes, never one centreline keel:
  four short cell_procession bars on the cardinal ring, a forward triad
  of energy_cell knots, an aft pair. Every sphere is absolute CELL_R.
- BROAD PLASMA PLANES as fd.filament_lace sheets on ordered grids
  (rows then columns). The sheets flare past the envelope. Not boxes,
  not fog spheres, not haze_lobe.
- TRAVEL TIP (fd.field_tip) at the nose station. TIP_LEN is absolute.
- OUTER fd.lensing_arc around the nest, major larger than the family.
- SYNC MOTES (ROLE_ACCENT, prefix mote-) sit next to the cardinal
  cells so the hull channel is two colours, never a single panel fill.
- Longitudinal meridians (ordered lace) tie tip, nest and wake into
  one connected field. No ROLE_HULL loft, no armour plates, no turrets.

Envelope (driver): l = 17.0, b = 8.84, h = 5.78.
AUTHORED largest-dimension target: spanZ ~16.83 (nose l*-0.530 = -9.010
to wake l*+0.460 = +7.820) so the driver's stern glow (z = l*+0.47 =
+7.990) reads as the field's own cyan wake. Span band [10.20, 23.80].
Estimated spans (unverified — no gates run at authoring time):
  spanZ ~16.83; spanX ~11.3 (flared mid sheet 1.28 * half-beam);
  spanY ~9.02 (max half-h h*0.78) → L/B ~1.90 (>= 0.70), B/L ~0.525
  (>= 0.45), H/L ~0.536 (<= 1.15). Thick toroidal, not a needle.
Estimated lod0 vertex count (band 9 000-78 000), ~24 000:
  4 loops ~380, 1-2 arcs ~190, tip ~240, ~17 cells ~2 200, 4 motes
  ~300, lace sheets + meridians ~21 000 (detail-3 strands).

LOD ladder
----------
detail=3  full nest (4 loops), wrap arc, 5x6 mid+dors sheets, 6
          meridians, all anchors, motes beside the cardinals.
detail=2  nest kept, mid+up 4x5 sheets, 4 meridians, anchors, motes.
detail=1  two inner loops, outer arc, mid 3x3 sheet, 4 meridians,
          all anchors, motes.
detail=0  primary masses only: largest loop, tip, outer arc, mid
          3x3 sheet, 4 meridians, all anchor knots. Silhouette
          NEVER thins to a keel — only strand count and extra
          planes drop.
"""
import math

from . import field as fd
from . import nodes as nd
from . import surface as sf


# ===========================================================================
# STATION LIST
# ===========================================================================

def _heavy_stations(l, b, h):
    """Field-envelope stations for the compression manifold.

    A fat traveling doughnut, not a needle. Nose tip at l*-0.530 = -9.010
    pinches to a point; the mid third stays nearly circular (half-beam
    b*0.50 = 4.420, half-height h*0.78 = 4.508) so the nested torus
    family has a thick volume to occupy; wake tapers at l*+0.460 = +7.820
    so the engine glow at l*+0.47 is the field's own light. y_offset is
    zero — the manifold is centred on the travel axis.

    Envelope at the driver: length 16.830, beam 8.840, height 9.017.
    L/B = 1.904, B/L = 0.525, H/L = 0.536.
    """
    return [
        sf.station(l * -0.530, 0.05, 0.05, 0.0),
        sf.station(l * -0.455, b * 0.12, h * 0.16, 0.0),
        sf.station(l * -0.360, b * 0.28, h * 0.38, 0.0),
        sf.station(l * -0.220, b * 0.42, h * 0.62, 0.0),
        sf.station(l * -0.060, b * 0.49, h * 0.76, 0.0),
        sf.station(l *  0.080, b * 0.50, h * 0.78, 0.0),
        sf.station(l *  0.220, b * 0.46, h * 0.70, 0.0),
        sf.station(l *  0.340, b * 0.32, h * 0.46, 0.0),
        sf.station(l *  0.420, b * 0.16, h * 0.22, 0.0),
        sf.station(l *  0.460, 0.08, 0.08, 0.0),
    ]


# ===========================================================================
# ORDERED POINT HELPERS (every point from surface queries)
# ===========================================================================

def _core_z(stations):
    """z of the fattest station — the compression centre."""
    fattest = stations[0]
    for st in stations[1:]:
        if st[1] >= fattest[1]:
            fattest = st
    return fattest[0]


def _axis_samples(z0, z1, n, extras, gap=0.08):
    """n samples from z0 to z1, with node extras kept exactly."""
    regular = [z0 + (z1 - z0) * (i / (n - 1.0)) for i in range(n)]
    keep = [e for e in extras if z0 <= e <= z1]
    out = []
    for v in regular:
        near = False
        for e in keep:
            if abs(v - e) < gap:
                near = True
                break
        if not near:
            out.append(v)
    out.extend(keep)
    out.sort()
    return out


def _sheet_xz(stations, y, zs, nx, flare):
    """Ordered XZ grid at height y. ``flare`` > 1 pushes past the flank."""
    rows = []
    for z in zs:
        fx = sf.flank_x(stations, z, y)
        if fx < 0.20:
            fx = 0.20
        half = fx * flare
        row = []
        for j in range(nx):
            x = -half + (2.0 * half) * (j / (nx - 1.0))
            row.append((x, y, z))
        rows.append(row)
    return rows


def _sheet_yz(stations, x, zs, ny, flare):
    """Ordered YZ grid at offset x. ``flare`` > 1 pushes past top/bottom."""
    rows = []
    for z in zs:
        top = sf.top_y(stations, z, x)
        bot = sf.bottom_y(stations, z, x)
        mid = 0.5 * (top + bot)
        half = 0.5 * (top - bot)
        if half < 0.20:
            half = 0.20
        half = half * flare
        row = []
        for j in range(ny):
            y = mid - half + (2.0 * half) * (j / (ny - 1.0))
            row.append((x, y, z))
        rows.append(row)
    return rows


def _emit_lace_grid(glow, name, glow_mat, rows, detail):
    """Braid every row and every column of an ordered point grid."""
    if not rows:
        return
    for i, row in enumerate(rows):
        if len(row) >= 2:
            fd.filament_lace(glow, '%s-r%d' % (name, i), glow_mat, row, detail)
    width = min(len(row) for row in rows)
    for j in range(width):
        col = [row[j] for row in rows]
        if len(col) >= 2:
            fd.filament_lace(glow, '%s-c%d' % (name, j), glow_mat, col, detail)


def _meridian(stations, angle, zs):
    """Ordered polyline on the envelope at a fixed ellipse angle."""
    ca = math.cos(angle)
    sa = math.sin(angle)
    pts = []
    for z in zs:
        hw, hh, yo = sf.interpolate(stations, z)
        pts.append((hw * ca, yo + hh * sa, z))
    return pts


def _grid_counts(detail):
    # Keep lace sheets under validate-ship-assets triangle caps
    # (lod0 60k / lod1 24k / lod2 8k). Sheets stay grids, not fog.
    if detail >= 3:
        return 5, 6
    if detail >= 2:
        return 4, 5
    if detail >= 1:
        return 3, 3
    return 3, 3


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Unknowables compression manifold (heavy class).

    parts    -- list that receives ROLE_ARMOUR cells and ROLE_ACCENT motes.
    glow     -- list that receives emissive lace / loops / tip / arc.
    l, b, h  -- class length, beam and height from the driver
                (17.0, 8.84, 5.78).
    detail   -- 3 full  2 thinned sheets  1 mid planes + key nest
                0 primary torus, tip, arc, mid sheets, anchors.
    """
    stations = _heavy_stations(l, b, h)
    zc = _core_z(stations)
    cx, cy, _cz = sf.spine(stations, zc)
    fx = sf.flank_x(stations, zc, cy)
    hh = sf.top_y(stations, zc, 0.0) - cy
    if hh < 0.20:
        hh = 0.20
    if fx < 0.20:
        fx = 0.20
    ring_r = min(fx, hh) * 0.98
    r_rms = sf.radius_at(stations, zc)

    # ── PRIMARY MASS: one large torus family (always) ────────────────────
    # First major is the cardinal ring so the cells sit on it at every
    # lod. Remaining majors thicken the nest; nested_loops drops the
    # later ones as detail falls.
    majors = (ring_r, r_rms * 0.72, r_rms * 1.12, r_rms * 0.50)
    tilts = (
        sf.TORUS_FACE_Z,
        (0.0, 0.0, 0.0),
        (math.pi * 0.5, 0.0, 0.55),
        (0.40, 0.15, 0.35),
    )
    fd.nested_loops(
        glow, 'loop-manifold', glow_mat, (cx, cy, zc), majors, tilts, detail
    )

    # ── PRIMARY MASS: travel tip at the nose (always) ────────────────────
    fd.field_tip(glow, 'tip', glow_mat, sf.tip_point(stations), sf.TIP_LEN, detail)

    # ── PRIMARY MASS: outer lensing arc (always) ─────────────────────────
    fd.lensing_arc(
        glow, 'arc-outer', glow_mat, (cx, cy, zc),
        r_rms * 1.34, (0.55, 0.0, 0.20), detail,
    )

    # ── PRIMARY MASS: cardinal + forward + aft ANCHOR knots (always) ─────
    # Short processions on the four cardinals of the first loop — four
    # masses, not a keel. Pitch is sf.cell_link_pitch() (absolute).
    pitch = sf.cell_link_pitch()
    half_bar = pitch
    tags = (
        ('stbd', (cx + ring_r, cy, zc)),
        ('port', (cx - ring_r, cy, zc)),
        ('dors', (cx, cy + ring_r, zc)),
        ('vent', (cx, cy - ring_r, zc)),
    )
    for tag, loc in tags:
        nd.cell_procession(
            parts, 'cell-card-%s' % tag, hull_mat,
            loc[2] - half_bar, loc[2] + half_bar, loc[0], loc[1], detail,
        )

    z_fwd = stations[2][0]
    fwd = sf.spine(stations, z_fwd)
    nd.energy_cell(parts, 'cell-fwd-0', hull_mat, fwd, detail)
    nd.energy_cell(
        parts, 'cell-fwd-1', hull_mat,
        (fwd[0] + pitch * 0.70, fwd[1], z_fwd + pitch * 0.50), detail,
    )
    nd.energy_cell(
        parts, 'cell-fwd-2', hull_mat,
        (fwd[0] - pitch * 0.70, fwd[1], z_fwd + pitch * 0.50), detail,
    )

    z_aft = stations[7][0]
    aft_x = sf.flank_x(stations, z_aft, cy) * 0.45
    if aft_x < pitch:
        aft_x = pitch
    aft_stbd = (aft_x, cy, z_aft)
    aft_port = (-aft_x, cy, z_aft)
    nd.energy_cell(parts, 'cell-aft-stbd', hull_mat, aft_stbd, detail)
    nd.energy_cell(parts, 'cell-aft-port', hull_mat, aft_port, detail)

    # Threads from satellite masses onto the cardinal ring — not to the
    # empty torus centre, so lod3 stays one island.
    dors = (cx, cy + ring_r, zc)
    stbd = (cx + ring_r, cy, zc)
    port = (cx - ring_r, cy, zc)
    fd.filament_lace(glow, 'lace-anchor-fwd', glow_mat, [fwd, dors], detail)
    fd.filament_lace(glow, 'lace-anchor-aft-stbd', glow_mat, [aft_stbd, stbd], detail)
    fd.filament_lace(glow, 'lace-anchor-aft-port', glow_mat, [aft_port, port], detail)

    # ── PRIMARY MASS: mid plasma plane (always — it IS the volume) ───────
    nx, nz_n = _grid_counts(detail)
    z0 = stations[1][0]
    z1 = stations[8][0]
    zs = _axis_samples(z0, z1, nz_n, (zc, z_fwd, z_aft))
    _emit_lace_grid(
        glow, 'lace-plane-mid', glow_mat,
        _sheet_xz(stations, cy, zs, nx, 1.28), detail,
    )
    if detail >= 2:
        _emit_lace_grid(
            glow, 'lace-plane-up', glow_mat,
            _sheet_yz(stations, 0.0, zs, nx, 1.22), detail,
        )

    # Cardinal meridians always — they pierce the ring cells (hw ~= ring_r).
    n_mer_pts = 8 if detail >= 2 else 6
    mer_zs = _axis_samples(
        sf.nose_z(stations), sf.stern_z(stations), n_mer_pts, (zc, z_fwd, z_aft)
    )
    for i in range(4):
        ang = (0.5 * math.pi) * i
        fd.filament_lace(
            glow, 'lace-meridian-%d' % i, glow_mat,
            _meridian(stations, ang, mer_zs), detail,
        )

    # ── MOTES — white-gold knots so hull colour is not one panel ─────────
    # Seated on the +Z face of each cardinal cell (pitch*0.45 < CELL_R +
    # MOTE_R) so they kiss the matter bar and stay one island.
    mote_dz = pitch * 0.45
    for tag, loc in tags:
        nd.sync_mote(
            parts, 'mote-card-%s' % tag, hull_mat,
            (loc[0], loc[1], loc[2] + mote_dz), detail,
        )

    if detail < 1:
        return

    # ── EXTRA MERIDIANS ──────────────────────────────────────────────────
    if detail >= 3:
        extra = 2
        for i in range(extra):
            ang = (2.0 * math.pi * i) / extra + 0.25 * math.pi
            fd.filament_lace(
                glow, 'lace-meridian-x%d' % i, glow_mat,
                _meridian(stations, ang, mer_zs), detail,
            )

    # ── EXTRA DEFENSIVE PLANE + wrap arc (lod0 only) ─────────────────────
    if detail >= 3:
        y_dors = cy + hh * 0.38
        _emit_lace_grid(
            glow, 'lace-plane-dors', glow_mat,
            _sheet_xz(stations, y_dors, zs, nx, 1.18), detail,
        )
        fd.lensing_arc(
            glow, 'arc-wrap', glow_mat, (cx, cy, zc),
            r_rms * 1.18, (0.0, 0.25, 0.40), detail,
        )
