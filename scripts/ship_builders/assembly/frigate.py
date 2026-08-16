"""Assembly Frigate — ARCHIVE SURVEYOR.

Bible §4.8: "A long archive spine bearing repeated data vaults, an antenna
crown, probe launch petals, and a protected ancient core embedded off-center
by generations of growth." Construction logic is REPEATED MODULE: one part,
many copies, linear and radial arrays, visible joints. Variation is
copy-drift, not human patchwork.

Plate 08-assembly-ship.png is the closest class reference (long charcoal
spine, clamped off-white modules, a dorsal petal fan, a stern radial fan,
an antenna forest, teal irises, a dark nose collar). Honour the family.
Do not copy the plate vertex-for-vertex.

Envelope (driver): l = 32.0, b = 12.48, h = 8.32.
Span band [19.20, 44.80]; authored largest-dimension target ≈ 29.2 (spine
z-span plus the drive housing). Hull vertex band [16 000, 84 000].
Proportions 1.15 / 0.60 / 0.16 (length-leads-beam, height/length,
beam/length). Assembly has no FACTION_PROPORTION_RELIEF.

BODY PLAN
    A slim inner charcoal loft is the connective core only. The silhouette
    is the LONG SPINE of repeated ``ln.spine_segment`` bays with visible
    joint rings. Repeated data vaults are the same-size ``ln.shell_module``
    in linear arrays (copy_drift). A bow dorsal ``ln.radial_fan`` (xz) is
    the §G2 outline-breaker; a stern ``ln.radial_fan`` (xy) plus extra
    ``ln.fan_petal`` / ``hw.instrument_petal`` launchers are the probe
    launch petals. ``hw.antenna_forest`` sits as a CROWN on the mid spine
    (more masts, still absolute ANTENNA_H). The protected ancient core is
    a darker ROLE_HULL module with a different seed, embedded OFF-CENTRE
    on the starboard mid-bow — the required functional asymmetry.

    §G5: a visible starboard berth. A docked ``hw.daughter_probe``
    intersects an open cradle pad and a fabrication socket. It is not
    hidden inside a wall box. §G3: a flat ``hw.radiator_panel`` pair and
    ``hw.drive_face`` with 8 countable nozzles. Few orange patches.
    ``hw.docking_collar`` on the ventral mid. A fabrication iris in the
    dark nose collar.

STATION-LIST REASONING (z as fractions of l; half-extents are the SPINE
envelope in world units, never the class beam — the fans break the
outline, the spine stays a charcoal tube):
    Nose loft at l*-0.455 = -14.560; transom at l*0.445 = +14.240.
    Drive housing stands 0.12 aft of the transom → authored span ≈ 29.0.
    Bow/mid seam at l*-0.200 = -6.400; mid/stern seam at l*+0.180 = +5.760.
    Spine half-beam 0.48 → 0.82 → 0.64; half-height 0.46 → 0.76 → 0.58.

ZONES (no vault run crosses a seam; seam rings mark the joints):
    bow   l*-0.455..l*-0.200   25.5 % of hull length
    mid   l*-0.200..l*+0.180   38.0 %
    stern l*+0.180..l*+0.445   26.5 %

OUTLINE-BREAKER (§G2): the bow dorsal fan. Petal module stays
FAN_PETAL_LEN = 1.55. The fan grows by radius and count.
    R >= 0.15*l - 1.55 + 0.16
    At l = 32, R >= 3.41. Authored R_bow = max(that, 3.50), count 16.
    Outer reach = R + 1.55 - 0.16 >= 0.15*l.

EMISSIVE BUDGET (<= 5 % of hull area):
    Teal irises (nose socket, a few optics, daughter eyes), drive discs,
    one antenna-tip marker per forest, the collar slit. Orange is ROLE_ACCENT
    geometry, not glow. AUTHORED AIM: emissive ~= 0.4 % of hull area.

DETAIL LADDER (constructs count their own repeats down; gating is here):
    3  full: every construct, extra generation rings, extra probes
    2  half the vaults / bays / fan petals / masts
    1  primary masses (spine, hubs, drive, core, radiators, one berth
       probe, a short vault row). Watch the lod2 8 000 triangle cap.
    0  loft + coarse spine + fan hubs + drive only

MEASURED 2026-08-15 (measure-ships + three.js tri count):
    detail 3  52,668 hull verts / 30,632 lod0 triangles
    detail 2  10,356 triangles
    detail 1  2,252 triangles (under the 8 000 lod2 cap)
    max span 29.0; len/beam 3.04; ht/len 0.32; beam/len 0.33
    proxy cover 100 %; ONE CONNECTED BODY at 0.06 voxels
    inside SHIP_SCALE.frigate.hull [16 000, 84 000] and the
    60 000 / 24 000 / 8 000 LOD triangle caps
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import lineage as ln
from . import hardware as hw


# Absolute vault module — one size, many copies. Never scaled by l, b, h.
_VAULT = (0.70, 0.42, 1.40)
_OVERLAP = 0.12
_FAN_BURY = 0.16


# ===========================================================================
# STATION LIST
# ===========================================================================

def _frigate_stations(l, _b, _h):
    """Outer spine envelope for queries. Not a closed plated hull.

    Half-extents are the charcoal bay radius, not the class beam. Fans
    and vaults sit on this tube. Nose at l*-0.455; transom at l*0.445.
    """
    return [
        sf.fair(l * -0.455, 0.48, 0.46, 0.0),
        sf.fair(l * -0.380, 0.62, 0.58, 0.0),
        sf.fair(l * -0.280, 0.78, 0.72, 0.0),
        sf.fair(l * -0.200, 0.76, 0.70, 0.0),
        sf.fair(l * -0.060, 0.80, 0.74, 0.0),
        sf.fair(l *  0.060, 0.82, 0.76, 0.0),
        sf.fair(l *  0.180, 0.78, 0.72, 0.0),
        sf.fair(l *  0.300, 0.74, 0.68, 0.0),
        sf.fair(l *  0.380, 0.80, 0.76, 0.0),
        sf.fair(l *  0.445, 0.64, 0.58, 0.0),
    ]


def _core_stations(stations, inset=0.20):
    """Inner connective loft, buried inside the bay envelope."""
    out = []
    for z, half_w, half_h, yo, ch in stations:
        hw2 = max(half_w - inset, 0.20)
        hh2 = max(half_h - inset, 0.18)
        ch2 = min(ch, hw2 * 0.42, hh2 * 0.42)
        out.append((z, hw2, hh2, yo, ch2))
    return out


# ===========================================================================
# COUNTS AND SPANS
# ===========================================================================

def _n(detail, full, half=None, low=None, mass=None):
    if half is None:
        half = max(1, int(full) // 2)
    if low is None:
        low = max(1, int(full) // 3)
    if mass is None:
        mass = max(1, int(full) // 4)
    if detail >= 3:
        return int(full)
    if detail == 2:
        return int(half)
    if detail == 1:
        return int(low)
    return int(mass)


def _fill_span(z0, z1, n, overlap=_OVERLAP):
    """Return (bay_length, centres) that fill [z0, z1] with overlap >= 0.10."""
    n = max(1, int(n))
    span = z1 - z0
    if n == 1:
        return span, ((z0 + z1) * 0.5,)
    bay = (span - overlap) / float(n) + overlap
    if bay < 0.40:
        bay = 0.40
    pitch = bay - overlap
    cz0 = z0 + bay * 0.5
    return bay, tuple(cz0 + i * pitch for i in range(n))


def _fan_radius(l, floor):
    """§G2: outer reach >= 15 % of l. Petal module stays FAN_PETAL_LEN."""
    need = 0.15 * l - sf.FAN_PETAL_LEN + _FAN_BURY
    return max(need, floor)


def _keepout(z, centre, radius):
    return abs(z - centre) < radius


def _vault_loc(row, half_w, half_h, yo, cz):
    sx, sy, _sz = _VAULT
    if row == 'dorsal':
        return (0.0, yo + half_h + sy * 0.5 - _OVERLAP, cz)
    if row == 'ventral':
        return (0.0, yo - half_h - sy * 0.5 + _OVERLAP, cz)
    if row == 'port':
        return (-half_w - sx * 0.5 + _OVERLAP, yo, cz)
    return (half_w + sx * 0.5 - _OVERLAP, yo, cz)


def _place_vaults(parts, hull_mat, stations, detail, z0, z1, n, z_core,
                  z_berth, z_bow_fan, r_bow, prefix, skip_dorsal_fan=False):
    """Linear arrays of the same vault module. Inboard face overlaps >= 0.10."""
    if n < 1 or z1 <= z0:
        return
    _span, vaults = _fill_span(z0, z1, n, overlap=0.18)
    rows = ('dorsal', 'ventral', 'port', 'stbd')
    if detail <= 1:
        rows = ('dorsal', 'port')
    elif detail == 2:
        rows = ('dorsal', 'ventral', 'port')
    seed_row = {'dorsal': 200, 'ventral': 260, 'port': 320, 'stbd': 380}
    for row in rows:
        for i, cz in enumerate(vaults):
            if skip_dorsal_fan and row == 'dorsal':
                if _keepout(cz, z_bow_fan, r_bow * 0.80):
                    continue
            if row == 'stbd' and _keepout(cz, z_berth, 2.10):
                continue
            if row == 'stbd' and _keepout(cz, z_core, 1.60):
                continue
            half_w, half_h, yo, _ch = sf.section(stations, cz)
            if half_w <= 0.0 or half_h <= 0.0:
                continue
            loc = _vault_loc(row, half_w, half_h, yo, cz)
            ln.shell_module(
                parts, 'frigate.vault.%s.%s.%02d' % (prefix, row, i),
                hull_mat, loc, _VAULT, detail=detail,
                seed=seed_row[row] + i)


def _launch_petals(parts, hull_mat, stations, z_fan, radius, n, detail):
    """Extra launch petals aft of the bow fan, buried in the spine."""
    if n < 1:
        return
    # Sit just aft of the dorsal fan disc so they are not swallowed by the hub.
    z_ln = z_fan + radius * 0.62
    half_w, half_h, yo, _ch = sf.section(stations, z_ln)
    pl = sf.FAN_PETAL_LEN
    faces = ('port', 'starboard', 'up', 'down', 'port', 'starboard')
    for i in range(n):
        face = faces[i % len(faces)]
        bury = _OVERLAP
        if face == 'port':
            loc = (-half_w - pl * 0.5 + bury, yo + (0.18 if i > 3 else -0.18), z_ln)
        elif face == 'starboard':
            loc = (half_w + pl * 0.5 - bury, yo + (0.18 if i > 3 else -0.18), z_ln)
        elif face == 'up':
            loc = (0.0, yo + half_h + pl * 0.5 - bury, z_ln)
        else:
            loc = (0.0, yo - half_h - pl * 0.5 + bury, z_ln)
        ln.fan_petal(parts, 'frigate.launch.fan.%d' % i, hull_mat,
                     loc, facing=face, detail=detail, seed=300 + i)
        if detail >= 3 and i < 4:
            ip = sf.PETAL_LEN
            if face == 'port':
                iloc = (-half_w - ip * 0.5 + bury, yo + 0.36, z_ln + 0.45)
            elif face == 'starboard':
                iloc = (half_w + ip * 0.5 - bury, yo + 0.36, z_ln + 0.45)
            elif face == 'up':
                iloc = (0.28, yo + half_h + ip * 0.5 - bury, z_ln + 0.45)
            else:
                iloc = (0.28, yo - half_h - ip * 0.5 + bury, z_ln + 0.45)
            hw.instrument_petal(parts, 'frigate.launch.inst.%d' % i,
                                hull_mat, iloc, facing=face, detail=detail)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Assembly archive surveyor (frigate class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from CLASSES (32.0, 12.48, 8.32).
    detail   -- 3 full  2 halved repeats  1 primary masses + berth
                0 loft + coarse spine + hubs + drive.

    MEASURED 2026-08-15 (measure-ships assembly):
        detail 3  52,668 hull verts / 30,632 lod0 triangles
        max span 29.0, len/beam 3.04, ht/len 0.32, beam/len 0.33
        inside SHIP_SCALE.frigate.hull [16 000, 84 000] and the
        60 000 / 24 000 / 8 000 LOD triangle caps
    """
    H = kit.ROLE_HULL

    stations = _frigate_stations(l, b, h)
    core_st = _core_stations(stations)

    z_nose = l * -0.455
    z_bow_s = l * -0.200
    z_mid_s = l * 0.180
    z_trans = l * 0.445
    z_spine0 = l * -0.445
    z_spine1 = l * 0.435

    z_bow_fan = l * -0.280
    z_stern_fan = l * 0.380
    z_berth = l * 0.040
    z_core = l * -0.100

    r_bow = _fan_radius(l, 3.50)
    r_stern = _fan_radius(l, 3.42)
    n_bow_fan = 16
    n_stern_fan = 14

    # ── Inner connective loft (always). Hidden inside the bay envelope. ──
    kit.hull_loft(parts, 'frigate.coreloft', H, core_st, hull_mat)

    # ── CHARCOAL SPINE: repeated bays, many copies (always). ─────────────
    n_bay = _n(detail, 28, 14, 8, 5)
    bay_len, bay_zs = _fill_span(z_spine0, z_spine1, n_bay)
    for i, cz in enumerate(bay_zs):
        half_w, half_h, yo, _ch = sf.section(stations, cz)
        rad = max(min(half_w, half_h), 0.28)
        ln.spine_segment(parts, 'frigate.spine.%02d' % i, hull_mat,
                         (0.0, yo, cz), rad, bay_len,
                         detail=detail, seed=40 + i)
        if detail >= 3:
            # Second generation clamp. Extra joint, same module family.
            ln.joint_ring(parts, 'frigate.spine.%02d.gen' % i, hull_mat,
                          (0.0, yo, cz - bay_len * 0.22), rad + 0.05,
                          detail=detail)

    # ── DRIVE FACE (always): 8 countable nozzles at the transom. ─────────
    d_w, d_h, d_yo, _ = sf.section(stations, z_trans)
    hw.drive_face(parts, glow, 'frigate.drive', hull_mat, glow_mat,
                  (0.0, d_yo, z_trans), max(d_w, 0.62), max(d_h, 0.50),
                  nozzles=8, depth=0.55, detail=detail)

    # ── §G2 FANS (always): hubs at detail 0, petals count down inside. ───
    top_bow = sf.top_y(stations, z_bow_fan, 0.0)
    ln.radial_fan(parts, 'frigate.fan.bow', hull_mat,
                  (0.0, top_bow - 0.04, z_bow_fan),
                  count=n_bow_fan, radius=r_bow, plane='xz',
                  seed=110, detail=detail)
    yo_st = sf.section(stations, z_stern_fan)[2]
    ln.radial_fan(parts, 'frigate.fan.stern', hull_mat,
                  (0.0, yo_st, z_stern_fan),
                  count=n_stern_fan, radius=r_stern, plane='xy',
                  seed=120, detail=detail)

    if detail < 1:
        return

    # ── ZONE SEAM RINGS (detail 1+). ─────────────────────────────────────
    for tag, zs in (('bow', z_bow_s), ('stern', z_mid_s)):
        half_w, half_h, yo, _ = sf.section(stations, zs)
        ln.joint_ring(parts, 'frigate.seam.%s' % tag, hull_mat,
                      (0.0, yo, zs), max(half_w, half_h) + 0.04,
                      detail=detail)

    # ── NOSE FABRICATION COLLAR (detail 1+). ─────────────────────────────
    hw.fabrication_socket(parts, glow, 'frigate.nose', hull_mat, glow_mat,
                          (0.0, 0.0, z_nose + 0.06),
                          radius=sf.FAB_SOCKET_COLLAR_R, facing='nose',
                          detail=detail)

    # ── ANCIENT CORE (detail 1+): off-centre, darker, older seed. ────────
    # Starboard mid-bow. ROLE_HULL so the skin stays charcoal, not armour.
    # Embedded through the spine; the required functional asymmetry.
    half_c, _hh_c, yo_c, _ = sf.section(stations, z_core)
    core_loc = (half_c * 0.38, yo_c, z_core)
    kit.chamfer_block(parts, 'frigate.core.mass', H, core_loc,
                      (1.70, 1.45, 2.40), hull_mat, chamfer=0.28)
    ln.joint_ring(parts, 'frigate.core.ring0', hull_mat,
                  core_loc, 0.82, detail=detail)
    if detail >= 2:
        ln.joint_ring(parts, 'frigate.core.ring1', hull_mat,
                      (core_loc[0], core_loc[1], z_core + 0.55), 0.70,
                      detail=detail)
        ln.shell_module(parts, 'frigate.core.shell', hull_mat,
                        (core_loc[0] + 0.55, yo_c + 0.20, z_core - 0.15),
                        _VAULT, detail=detail, seed=909)
        hw.teal_optic(parts, glow, 'frigate.core.eye', hull_mat, glow_mat,
                      (core_loc[0] + 0.78, yo_c + 0.10, z_core),
                      facing='starboard', detail=detail)
    if detail >= 3:
        ln.joint_ring(parts, 'frigate.core.ring2', hull_mat,
                      (core_loc[0], core_loc[1], z_core - 0.55), 0.64,
                      detail=detail)
        ln.orange_patch(parts, 'frigate.core.patch', hull_mat,
                        (core_loc[0] + 0.70, yo_c + 0.40, z_core + 0.20),
                        detail=detail, seed=910)
        kit.plate_course(parts, 'frigate.core.plates', H,
                         (core_loc[0] + 0.10, yo_c + 0.55, z_core),
                         (1.10, 0.10, 2.00), hull_mat,
                         count=6, axis='z', gap=0.14, step=0.015)

    # ── §G3 RADIATORS (detail 1+): flat pair, no fins. ───────────────────
    z_rad = l * 0.300
    half_r, _hh_r, yo_r, _ = sf.section(stations, z_rad)
    rad_size = (0.14, 1.65, 2.50)
    for side, tag in ((1.0, 'stbd'), (-1.0, 'port')):
        hw.radiator_panel(parts, 'frigate.rad.%s' % tag, hull_mat,
                          (side * (half_r + 0.05), yo_r + 0.10, z_rad),
                          rad_size, detail=detail)

    # ── VENTRAL DOCKING COLLAR (detail 1+). ──────────────────────────────
    z_dock = l * 0.120
    keel = sf.bottom_y(stations, z_dock, 0.0)
    hw.docking_collar(parts, glow, 'frigate.dock', hull_mat, glow_mat,
                      (0.0, keel, z_dock), facing='down', detail=detail)

    # ── §G5 BERTH (detail 1+): open pad + socket, probe intersects both. ─
    # Starboard mid. Pad and socket stay visible. Probe is not boxed in.
    half_b, _hh_b, yo_b, _ = sf.section(stations, z_berth)
    sock_x = half_b - 0.02
    hw.fabrication_socket(parts, glow, 'frigate.berth.socket',
                          hull_mat, glow_mat,
                          (sock_x, yo_b, z_berth),
                          radius=0.72, facing='starboard', detail=detail)
    pad_c = (half_b + 0.95, yo_b - 1.18, z_berth)
    kit.box(parts, 'frigate.berth.pad', H, pad_c, (1.90, 0.20, 2.30), hull_mat)
    kit.box(parts, 'frigate.berth.arm', H,
            (half_b + 0.35, yo_b - 0.55, z_berth),
            (1.00, 0.36, 0.70), hull_mat)
    kit.box(parts, 'frigate.berth.cheek', kit.ROLE_RECESS,
            (half_b + 0.55, yo_b - 1.02, z_berth),
            (0.80, 0.16, 1.60), hull_mat)
    # Pad top at yo-1.08; probe belly at yo-1.23; overlap 0.15. Body bites the socket.
    probe_c = (half_b + 0.95, yo_b + 0.12, z_berth)
    hw.daughter_probe(parts, glow, 'frigate.berth.probe',
                      hull_mat, glow_mat, probe_c,
                      detail=detail, seed=501, petals=4)

    # ── DATA VAULTS (detail 1+): same-size linear arrays, copy_drift. ────
    n_mid = _n(detail, 12, 6, 3, 0)
    n_bow = _n(detail, 5, 2, 0, 0)
    n_stn = _n(detail, 6, 3, 0, 0)
    _place_vaults(parts, hull_mat, stations, detail,
                  z_bow_s + 0.20, z_mid_s - 0.20, n_mid,
                  z_core, z_berth, z_bow_fan, r_bow, 'mid')
    if n_bow > 0:
        _place_vaults(parts, hull_mat, stations, detail,
                      z_nose + 1.20, z_bow_s - 0.20, n_bow,
                      z_core, z_berth, z_bow_fan, r_bow, 'bow',
                      skip_dorsal_fan=True)
    if n_stn > 0:
        _place_vaults(parts, hull_mat, stations, detail,
                      z_mid_s + 0.20, z_stern_fan - 0.80, n_stn,
                      z_core, z_berth, z_bow_fan, r_bow, 'stern')

    # ── ANTENNA CROWN (detail 1+): more masts, absolute ANTENNA_H. ───────
    z_crown = (l * -0.040, l * 0.020, l * 0.080)
    n_mast = (8, 7, 6)
    for i, zc in enumerate(z_crown):
        if detail < 2 and i > 0:
            break
        deck = sf.top_y(stations, zc, 0.0)
        hw.antenna_forest(parts, glow, 'frigate.crown.%d' % i,
                          hull_mat, glow_mat, (0.0, deck, zc),
                          count=n_mast[i], detail=detail, seed=70 + i)

    if detail < 2:
        return

    # ── EXTRA LAUNCH PETALS (detail 2+). ─────────────────────────────────
    n_extra = _n(detail, 6, 3, 0, 0)
    _launch_petals(parts, hull_mat, stations, z_bow_fan, r_bow,
                   n_extra, detail)

    # ── TEAL OPTICS (detail 2+): few. ────────────────────────────────────
    for i, z_op in enumerate((l * -0.340, l * 0.000, l * 0.240)):
        if detail < 3 and i > 1:
            break
        half_o, _hh_o, yo_o, _ = sf.section(stations, z_op)
        face = 'port' if i == 1 else 'up'
        if face == 'up':
            loc_o = (0.0, sf.top_y(stations, z_op, 0.0), z_op)
        else:
            loc_o = (-half_o, yo_o, z_op)
        hw.teal_optic(parts, glow, 'frigate.optic.%d' % i, hull_mat, glow_mat,
                      loc_o, facing=face, detail=detail)

    # ── ORANGE PATCHES (detail 2+): few block accents. ───────────────────
    n_patch = 5 if detail >= 3 else 2
    patch_z = (l * -0.360, l * -0.160, l * 0.000, l * 0.140, l * 0.260)
    for i in range(n_patch):
        pz = patch_z[i]
        half_p, _hh_p, yo_p, _ = sf.section(stations, pz)
        side = 1.0 if (i % 2) == 0 else -1.0
        ln.orange_patch(parts, 'frigate.patch.%d' % i, hull_mat,
                        (side * half_p, yo_p + 0.18, pz),
                        detail=detail, seed=80 + i)

    if detail < 3:
        return

    # ── MID ARCHIVE HOOPS (detail 3): extra generation clamps. ───────────
    hoop_zs = _fill_span(z_bow_s + 0.40, z_mid_s - 0.40, 8)[1]
    for i, hz in enumerate(hoop_zs):
        half_h, half_hh, yo_h, _ = sf.section(stations, hz)
        ln.joint_ring(parts, 'frigate.archive.hoop.%d' % i, hull_mat,
                      (0.0, yo_h, hz), max(half_h, half_hh) + 0.08,
                      detail=detail)

    # ── EXTRA DOCKED DAUGHTERS (detail 3): more copies, same module. ─────
    for i, z_p in enumerate((l * -0.060, l * 0.160, l * -0.160)):
        keel_p = sf.bottom_y(stations, z_p, 0.0)
        hw.fabrication_socket(parts, glow, 'frigate.rack.sock.%d' % i,
                              hull_mat, glow_mat,
                              (0.0, keel_p, z_p),
                              radius=0.55, facing='down', detail=detail)
        kit.box(parts, 'frigate.rack.pad.%d' % i, H,
                (0.0, keel_p - 0.16, z_p),
                (1.40, 0.16, 1.60), hull_mat)
        # Sphere r=1.35. Centre 1.20 below keel → belly overlaps pad by 0.19.
        hw.daughter_probe(parts, glow, 'frigate.rack.probe.%d' % i,
                          hull_mat, glow_mat,
                          (0.0, keel_p - 1.20, z_p),
                          detail=detail, seed=520 + i, petals=3)
