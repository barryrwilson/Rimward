"""Freehold Compact — ACE, the local legend.

Bible §4.3: "a lovingly rebuilt runabout stripped of unnecessary mass, with
hand-fitted fairings, exposed tuned manoeuvring clusters, and one personal
but non-heraldic paint treatment."

Three zones with real seams between them (SpaceShipIdeas/synthesis/20 rule 1):
  bow  20 %  a long faired needle nose terminating in a single-seat bubble
             canopy (ROLE_ARMOUR — a salvaged replacement unit); ONE emissive
             cabin port, absolute size sf.PORT_LIGHT. A legend flies alone;
             no cabin window row.
  mid  48 %  the surviving body trimmed of dead mass; calm barn-red hull above
             and below the service band (§20 rule 2); two to four hand-fitted
             fairing strakes (ROLE_ARMOUR) over the section joints at detail 2+,
             each a different length because the owner fitted what the yard had;
             one ROLE_ACCENT plate course on the starboard flank only —
             non-heraldic, no emblem, no glow, asymmetric on purpose.
  stern 32 % an OPEN SOUND FRAME whose gap is 18 % of hull length — the
             Freehold thumbnail signature, left GENUINELY EMPTY (§21 G2
             outline breaker); four tuned manoeuvring thrusters on short
             outrigger stubs inside the bay at detail 2+; then a compact
             drive block (12 % of hull length) with TWO countable main nozzles,
             one STATUS_SLIT readout, and a pair of thin tapered radiator
             panels (§21 G3 visible thermal hardware). The stern zone is
             intentionally large: stripping the aft cladding for mass saving
             exposed more of the sound frame than a stock runabout shows.

Satisfies: §20 rule 1 (three zones + real seams), rule 2 (detail band localised
at course height, calm hull field above and below), rule 3 (emissive ≤ 5 %:
one PORT_LIGHT 0.20 m wide + two MARKER_LAMPs 0.10 m each + two main nozzle
glow discs + STATUS_SLIT 0.10 m; nothing else), rule 4 (scale from repetition:
frame hoop rhythm, fairing pitch, thruster array), rule 5 (exposed frame gap
genuinely empty), rule 6 (2 main + 4 manoeuvring = 6 countable nozzles),
§21 G3 (visible flat radiators and distinct drive face).

Measured target (scripts/measure-ships.mjs): span ≈ 7.1 m, ace band
[5.50, 9.00]; spanZ/spanX ≈ 3.7; spanY/spanZ ≈ 0.23; proxy cover ≥ 80 %.
Called with l=7.2  b=2.88  h=1.44 (from CLASSES).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf


def _ace_stations(l, b, h):
    """Runabout-family stations, slimmer and lower than the light.

    Ten stations from the needle nose to the narrow transom. k=0.28 (vs the
    fleet default 0.38) makes tighter chamfer radii — the hand-fitted fairings
    are precision work, not production moulding. A pinched waist just aft of
    centre records where the original aft cladding was stripped for mass saving:
    the section genuinely narrows before firming up again at the transom collar.
    """
    return [
        sf.fair(-l * 0.48, b * 0.15, h * 0.18, -h * 0.040, k=0.25),  # needle nose
        sf.fair(-l * 0.42, b * 0.22, h * 0.24, -h * 0.038, k=0.28),  # nose shoulder
        sf.fair(-l * 0.34, b * 0.30, h * 0.30, -h * 0.025, k=0.28),  # fwd max beam
        sf.fair(-l * 0.24, b * 0.33, h * 0.33, -h * 0.015, k=0.28),  # cockpit
        sf.fair(-l * 0.14, b * 0.31, h * 0.34, -h * 0.005, k=0.28),  # cockpit aft
        sf.fair(-l * 0.04, b * 0.28, h * 0.30,  h * 0.005, k=0.28),  # waist fore
        sf.fair( l * 0.02, b * 0.25, h * 0.27,  h * 0.007, k=0.28),  # waist — mass pinch
        sf.fair( l * 0.07, b * 0.23, h * 0.25,  h * 0.004, k=0.28),  # aft waist
        sf.fair( l * 0.11, b * 0.21, h * 0.23,  h * 0.002, k=0.28),  # transom approach
        sf.fair( l * 0.15, b * 0.18, h * 0.20,  0.0,       k=0.28),  # transom
    ]


# =============================================================================
# ACE — LOCAL LEGEND
# Called with l=7.2  b=2.88  h=1.44 (from CLASSES).
# =============================================================================
def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    H = kit.ROLE_HULL    # barn-red original body
    D = kit.ROLE_ARMOUR  # donated cream: canopy bubble, fairing strakes, plate courses
    A = kit.ROLE_ACCENT  # one personal paint treatment, starboard flank only
    T = kit.ROLE_TRIM    # frame, strakes, stubs

    st = _ace_stations(l, b, h)

    # Frame geometry — shared by spars, hoops and the diagonal brace.
    # The gap is larger than the light's: stripping the aft cladding for mass
    # savings exposed more of the sound frame. 18 % of hull length = top of the
    # 14–18 % research rule (§20 rule 5, §21 G2 outline breaker).
    frame_z0 = st[-1][0]           # transom of the surviving body: +l*0.15
    frame_z1 = l * 0.33            # front face of drive block
    frame_x  = b * 0.13            # spar half-span, inside hull flank
    frame_y  = h * 0.18            # spar half-height

    # Drive block — its own local anchors; a separated volume held off the body
    # by the open frame. drive_hw and drive_hh are chosen so the upper-corner
    # spars land inside the chamfered face (sum of clearances ≥ drive_ch).
    drive_z   = l * 0.39           # block centre
    drive_len = l * 0.12           # block length
    drive_cy  = h * 0.01           # slight downshift keeps nozzles on axis
    drive_hw  = b * 0.18           # half-width: 0.518; frame_x = 0.374, margin 0.144
    drive_hh  = h * 0.26           # half-height: 0.374; frame_y = 0.259, margin 0.115
    drive_ch  = h * 0.14           # chamfer: 0.202; sum of margins 0.259 > drive_ch ✓
    drive_top = drive_cy + drive_hh

    # Cockpit canopy — its own local anchors; a separated volume sitting proud
    # of the hull deck above the cockpit station.
    canopy_z   = -l * 0.24
    canopy_top = sf.top_y(st, canopy_z, 0.0)
    canopy_r   = h * 0.32          # bubble radius — single seat, not roomy
    canopy_cy  = canopy_top + canopy_r * 0.45

    # Plate-course band geometry — computed once, used inside detail >= 1 and 2.
    # Four stations spread across the mid section at fleet pitch.
    course_zs  = [-l * 0.18 + i * (l * 0.065) for i in range(4)]
    course_t   = b * 0.030         # plate thickness (the proud lip against the hull)
    course_h   = h * 0.15          # plate height in the vertical band
    course_top = min(sf.straight_top(st, z) for z in course_zs)
    course_cy  = course_top - course_h * 0.5

    # Main nozzle lateral offset: two nozzles, countable from any angle.
    nozzle_dx = b * 0.07

    # ── Primary masses (all detail levels) ────────────────────────────────────

    kit.hull_loft(parts, 'hull-body', H, st, hull_mat)

    # Nose cutwater: a pointed keel wedge under the needle tip. Its top face
    # overlaps the hull loft at the bow stations; both ends of the Z range are
    # clamped by sf.section to the first station, which is forward of the wedge
    # centre, so the hull and wedge share face voxels. The cutwater gives the
    # forward Z-span the measurement tools need for the correct class band.
    _nose_bottom = min(sf.bottom_y(st, z, 0.0) for z in (-l * 0.50, -l * 0.38))
    _nose_top    = _nose_bottom + h * 0.046    # straddle the keel: +5 % overlap
    kit.wedge(parts, 'nose-cutwater', H,
              (0.0, _nose_top - h * 0.060, -l * 0.44),
              (b * 0.14, h * 0.12, l * 0.12),
              hull_mat, taper=(0.08, 0.28), bevel=h * 0.008)

    # Bubble canopy — ROLE_ARMOUR because it is a donated replacement, likely
    # salvaged from a racing tender. Its cream tone against the red body is the
    # ace's most personal visual signature.
    kit.sphere(parts, 'canopy-bubble', D,
               (0.0, canopy_cy, canopy_z),
               (canopy_r * 0.82, canopy_r, canopy_r * 0.74),
               hull_mat, segments=12)

    # Drive block — compact and low so the thruster cluster in the frame bay
    # reads as the primary stern hardware at any distance.
    kit.chamfer_block(parts, 'drive-block', H,
                      (0.0, drive_cy, drive_z),
                      (drive_hw * 2.0, drive_hh * 2.0, drive_len),
                      hull_mat, chamfer=drive_ch, bevel=h * 0.010)

    # Radiator panels: one thin pair, each tapered to a swept leading edge so
    # they break the drive-block outline and read as fins. Empty of surface
    # detail — they shed heat, not labels (§20 rules 3 and 7).
    _rad_hw = b * 0.08
    _rad_cy = drive_cy + h * 0.02
    for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
        kit.taper_block(parts, 'radiator-%s' % side, D,
                        (sign * (drive_hw + _rad_hw - h * 0.04), _rad_cy,
                         drive_z - l * 0.01),
                        (_rad_hw * 2.0, h * 0.025, l * 0.11),
                        hull_mat, front=(0.50, 0.28), back=(0.90, 0.75),
                        bevel=h * 0.005)

    # Sound frame — four longitudinal spars spanning the OPEN gap. Both ends
    # overlap the volumes they join: the spar front dips l*0.008 into the hull
    # body transom (frame_x and frame_y both lie inside the station cross-section
    # there), and the spar rear dips l*0.008 into the drive block face (margins
    # verified above). One connected component guaranteed.
    for xi, yi, fname in ((-1, -1, 'lower-port'), (1, -1, 'lower-stbd'),
                          (-1,  1, 'upper-port'), (1,  1, 'upper-stbd')):
        kit.strut(parts, 'frame-spar-%s' % fname, T,
                  (xi * frame_x, yi * frame_y, frame_z0 - l * 0.008),
                  (xi * frame_x, yi * frame_y, frame_z1 + l * 0.008),
                  hull_mat, radius=h * 0.019)

    # Two hoops at the same longitudinal pitch as the cutter's frame so the
    # Freehold ring rhythm is legible across classes at a glance.
    for hi, hz in enumerate((l * 0.20, l * 0.27)):
        kit.strut(parts, 'frame-hoop-top.%02d' % hi, T,
                  (-frame_x, frame_y, hz), (frame_x, frame_y, hz),
                  hull_mat, radius=h * 0.015)
        kit.strut(parts, 'frame-hoop-bottom.%02d' % hi, T,
                  (-frame_x, -frame_y, hz), (frame_x, -frame_y, hz),
                  hull_mat, radius=h * 0.015)
        kit.strut(parts, 'frame-hoop-port.%02d' % hi, T,
                  (-frame_x, -frame_y, hz), (-frame_x, frame_y, hz),
                  hull_mat, radius=h * 0.015)
        kit.strut(parts, 'frame-hoop-stbd.%02d' % hi, T,
                  (frame_x, -frame_y, hz), (frame_x, frame_y, hz),
                  hull_mat, radius=h * 0.015)

    # One diagonal brace, port side only: the ace's frame was re-braced at a
    # local yard; the port diagonal runs the opposite way to the factory norm and
    # nobody thought it worth straightening. Asymmetric, functional.
    kit.strut(parts, 'frame-diagonal-port', T,
              (-frame_x, -frame_y, frame_z0),
              (-frame_x,  frame_y, frame_z1),
              hull_mat, radius=h * 0.013)

    # Two main nozzles: even spacing, countable from any angle (§20 rule 6).
    # loc at back face of drive block; depth extends the throat aftward to give
    # the nozzle Z-span that puts the total hull in the ace measurement band.
    for di, dx in ((0, -nozzle_dx), (1, nozzle_dx)):
        kit.nozzle_ring(parts, glow, 'main-drive.%02d' % di,
                        (dx, drive_cy, drive_z + drive_len * 0.5),
                        hull_mat, glow_mat, radius=h * 0.14, depth=l * 0.060)

    # ── Donated plate courses (detail 1+) ─────────────────────────────────────
    # Re-plating from salvage gives the flat flanks their cream secondary tone
    # over the barn-red original. Each plate is seated at its own station so it
    # sits flush with the hull sheer rather than floating off it.
    if detail >= 1:
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            for pi, pz in enumerate(course_zs):
                fx = sf.flank_x(st, pz, course_cy)
                kit.box(parts, 'donated-course-%s.%02d' % (side, pi), D,
                        (sign * (fx + course_t * 0.30), course_cy, pz),
                        (course_t,
                         course_h * (1.0 - 0.03 * (pi % 2)),
                         l * 0.068),
                        hull_mat, bevel=h * 0.008)

    # ── Fairings, panel seams, accent course, thruster cluster (detail 2+) ────
    if detail >= 2:
        # Two forward fairing strakes: cover the joint between the donated nose
        # section and the forward body. Port and starboard but different lengths
        # — the owner fitted what the yard had available.
        _ft = b * 0.032             # fairing plate thickness
        _fh = h * 0.22              # fairing plate height
        for _z_cen, _z_len, _sign, _suf in (
            (-l * 0.38, l * 0.14, -1.0, 'nose-port'),   # longer, port
            (-l * 0.30, l * 0.10,  1.0, 'nose-stbd'),   # shorter, starboard
        ):
            _fx = sf.flank_x(st, _z_cen, course_cy)
            kit.taper_block(parts, 'fairing-%s' % _suf, D,
                            (_sign * (_fx + _ft * 0.35), course_cy, _z_cen),
                            (_ft * 2.0, _fh, _z_len),
                            hull_mat,
                            front=(0.82, 0.92), back=(0.88, 0.96),
                            bevel=h * 0.006)

        # Panel-line seams between plate courses: one thin groove per joint so
        # the re-plating rhythm is legible on the calm hull flanks.
        for si in range(len(course_zs) - 1):
            sz = (course_zs[si] + course_zs[si + 1]) * 0.5
            kit.panel_lines(parts, 'body-seam.%02d' % si,
                            (0.0, course_cy, sz),
                            (sf.flank_x(st, sz, course_cy) * 2.0,
                             course_h * 0.85, l * 0.016),
                            hull_mat, count=1, axis='z', depth=0.28)

        # Personal paint treatment: ROLE_ACCENT plate course on the starboard
        # flank ONLY. The colour came from leftover paint, not a yard mark.
        # Positioned just above the donated cream course, so it stands apart
        # visually without competing with it.
        _az  = (course_zs[1] + course_zs[2]) * 0.5
        _acy = course_cy + h * 0.042
        _afx = sf.flank_x(st, _az, _acy)
        kit.plate_course(parts, 'accent-course-stbd', A,
                         (_afx + course_t * 0.28, _acy, _az),
                         (course_t * 2.0, h * 0.12, l * 0.17),
                         hull_mat, count=3, axis='z', gap=0.08,
                         step=0.012, bevel=h * 0.006)

        # Tuned manoeuvring cluster: four small nozzle_ring thrusters on short
        # outrigger stubs inside the frame bay. Arranged 2 × 2; their radii stay
        # well inside the proxy capsule (≤ 78 % of frame half-span). The stubs
        # run FROM the spar corners TO the thruster mounts and overlap the spar
        # body at their start, keeping the whole cluster one connected component.
        _tz   = (frame_z0 + frame_z1) * 0.50   # mid-bay longitudinal position
        _tr   = h * 0.060                        # thruster ring radius
        _sr   = h * 0.015                        # stub radius
        _tox  = frame_x * 0.78                   # thruster X — inboard of spar
        _toy  = frame_y * 0.74                   # thruster Y — inboard of spar
        for _tx, _ty, _tn in (
            (-_tox, -_toy, 'lower-port'),
            ( _tox, -_toy, 'lower-stbd'),
            (-_tox,  _toy, 'upper-port'),
            ( _tox,  _toy, 'upper-stbd'),
        ):
            # Stub from the corresponding spar corner to the thruster mount.
            # The start point is on the spar axis so the stub cylinder shares
            # a voxel column with the spar cylinder at their crossing.
            _sx = frame_x  if _tx > 0.0 else -frame_x
            _sy = frame_y  if _ty > 0.0 else -frame_y
            kit.strut(parts, 'thruster-stub-%s' % _tn, T,
                      (_sx, _sy, _tz),
                      (_tx, _ty, _tz),
                      hull_mat, radius=_sr)
            # Nozzle facing aft (+Z). loc at the ring face; depth extends the
            # throat aftward inside the frame bay — stays short so it does not
            # break out of the bay or the proxy capsule.
            kit.nozzle_ring(parts, glow, 'thruster-%s' % _tn,
                            (_tx, _ty, _tz),
                            hull_mat, glow_mat, radius=_tr, depth=l * 0.018)

    # ── Mid fairings and greeble (detail 3 only) ──────────────────────────────
    if detail >= 3:
        # Two mid fairings covering the joint between the rebuilt mid body and
        # the surviving aft section. Different sides and lengths from the nose
        # pair: four fairings total, all different, reads as hand-fitted not
        # production. _ft and _fh reuse the values set in detail >= 2 above.
        for _z_cen, _z_len, _sign, _suf in (
            (-l * 0.08, l * 0.11, -1.0, 'mid-port'),   # medium, port
            ( l * 0.02, l * 0.07,  1.0, 'mid-stbd'),   # short, starboard
        ):
            _fx = sf.flank_x(st, _z_cen, course_cy)
            kit.taper_block(parts, 'fairing-%s' % _suf, D,
                            (_sign * (_fx + _ft * 0.35), course_cy, _z_cen),
                            (_ft * 2.0, h * 0.22, _z_len),
                            hull_mat,
                            front=(0.82, 0.92), back=(0.88, 0.96),
                            bevel=h * 0.006)

        # Small greeble field on the nose shoulder: access panels and tie-downs
        # from the last rebuild. Not applied decoration — it explains why the
        # section joints are covered by fairings immediately aft.
        _gz = -l * 0.38
        kit.greeble_field(parts, 'nose-gear', T,
                          (0.0, sf.top_y(st, _gz, 0.0) - h * 0.012, _gz),
                          (sf.flat_half(st, _gz) * 1.20, h * 0.024, l * 0.10),
                          hull_mat, seed=401, count=6, detail=detail)

    # ── Emissive: canopy port, nav markers, status slit (detail 2+) ───────────
    # Budget: one PORT_LIGHT + two MARKER_LAMPs + STATUS_SLIT + two nozzle glow
    # discs. All absolute sizes from sf.*; never multiplied by l, b or h.
    if detail >= 2:
        # ONE canopy port: warm amber through the forward face of the bubble.
        # Absolute sf.PORT_LIGHT size. A single light reads as single-pilot more
        # clearly than a cabin row — the emissive budget goes where it tells a
        # story, not where it fills space.
        _cpz = canopy_z - canopy_r * 0.52      # forward face of bubble
        _cpy = canopy_cy - canopy_r * 0.08     # slightly below bubble centre
        kit.window_row(glow, 'canopy-port',
                       (0.0, _cpy, _cpz),
                       glow_mat, 1, 0.0, sf.PORT_LIGHT)

        # Navigation markers: one per quarter on the nose flanks. Absolute
        # sf.MARKER_LAMP size regardless of hull scale.
        _mz = -l * 0.36
        for sign, side in ((-1.0, 'port'), (1.0, 'stbd')):
            kit.window_row(glow, 'nav-marker-%s' % side,
                           (sign * sf.flank_x(st, _mz, -h * 0.012),
                            -h * 0.012, _mz),
                           glow_mat, 1, 0.0, sf.MARKER_LAMP)

        # Drive-status readout on the drive-block roof: ONE slit, machine-width.
        # The single slit reads as a rebuilt drive plant, not a factory spec.
        kit.window_row(glow, 'drive-status',
                       (0.0, drive_top, drive_z - drive_len * 0.26),
                       glow_mat, 1, 0.0, sf.STATUS_SLIT)
