"""Assembly Ace — DIVERGENT SURVEYOR.

Bible §4.8: "A high-speed lineage with duplicated drive modules and slightly
mismatched recursive fins—the same design copied, corrected, and copied
again." Construction logic is REPEATED MODULE (synthesis §G6): one part,
many copies, radial and linear arrays, visible joints. Variation is
systematic copy-drift, not human patchwork.

The 08-assembly-ship.png escorts are the compact teal-eyed daughter probes
(the light class). This ace is the same lineage stretched into a longer,
slimmer spine: charcoal bays on a through-bolt, two recursive petal fans,
and a duplicated drive pair. It is not a daughter_probe used as a hull.

Body plan
---------
Silhouette family: SPINE-AND-PODS / cruciform fans. A slim octagonal loft
is the through-bolt (connectivity only — not a closed shell). Repeated
``ln.spine_segment`` bays clamp onto it at a fixed pitch. Off-white
``ln.shell_module`` pods bolt to the flanks. Twin ``hw.drive_face``
housings sit as stern pods (2 + 2 countable nozzles). Recursive fins are
TWO ``ln.radial_fan``s of the same absolute petal module: a stern XY fan
(generation 1) and a bow-dorsal XZ fan (generation 2). The second
generation uses a different seed and one fewer petal — that mismatch is
the class read.

Station z fractions (of l): -0.545 needle, -0.490, -0.420, -0.340 bow/mid
seam, -0.180, 0.000 max slim beam, +0.160 mid/stern seam, +0.300, +0.430,
+0.500 transom. Half-beam stays 0.28 at mid (0.56 across) — slimmer than
the light's compact probe body. The loft does not set the measured span.

Zone split (of the 7.53-unit loft, 1.045 l): bow 22 % (needle + optic +
generation-2 fan), mid 48 % (bay run, shells, orange, tiny mast), stern
30 % (generation-1 fan + twin drives). No shell crosses a seam.

G2 outline-breaker
------------------
``ln.radial_fan`` outer reach is ``R + FAN_PETAL_LEN - bury`` with
``bury = 0.16`` and ``FAN_PETAL_LEN = 1.55``. Floor:

    R >= 0.15 * l - 1.55 + 0.16
      = 0.15 * 7.2 - 1.39
      = -0.31

The numeric floor is below the hub. Authored R is 0.30 — just at the hub
floor (hub_r = max(0.28, R - 0.02)). Outer reach = 1.69 = 23.5 % of l.
Petals stay the absolute module; the fan is not grown by scaling petals
and no struts are added. Twin fans can blow the beam, so both fans keep
this same floor radius.

Asymmetry
---------
Exactly one functional mismatch: the two fans. Stern fan count=8 seed=41;
bow fan count=7 seed=73. Drives are duplicated twins (same housing, 2
nozzles each). Shells stay paired.

Surface / colour
----------------
Calm faces. Joint rings and a few shell lips carry the mid-band detail.
Orange is TWO ``ln.orange_patch`` blocks (one default ORANGE_PATCH on the
starboard mid shell, one thicker dorsal block so it pierces the deck by
>= 0.10) — authored aim 3–5 % of spine+shell area. Emissive is the nose
teal iris plus four drive discs, authored aim well under 5 %.

Envelope and authored aim
-------------------------
Driver envelope: l=7.2, b=2.88, h=1.44. Span band [4.32, 10.08]; class
target 7.2; this ace may sit slightly long of the future light (ladder
allows ace and light within 15 %).

    MEASURED 2026-08-15 (measure-ships + three.js tri count):
        max span 7.9 (Z)
        len/beam 2.45; ht/len 0.41; beam/len 0.41
        spanZ/spanX  2.45 >= 1.15
        spanY/spanZ  0.41 <= 0.60
        spanX/spanZ  0.41 >= 0.16
    MEASURED hull verts 17,672 at detail 3 (band 4 000–21 000);
    tris lod0/lod1/lod2 = 10,608/6,216/1,280.

Detail ladder
-------------
3  full: loft, every bay + bow flange, both fans at full count, five
   shells, two orange patches, twin drives, nose optic, tiny mast
2  half the bay repeats (double pitch); fans and shells count down
   inside the constructs; one orange; mast kept; optic + drives kept
1  loft + three primary bays (bow / mid / stern) + fan hubs (3 petals)
   + twin drive housings + nose optic
0  loft + twin drive housings (housing + 2 throats each) + fan hubs
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit
from . import surface as sf
from . import lineage as ln
from . import hardware as hw


# Absolute module sizes — never multiplied by l, b or h.
_BAY_R = 0.30
_BAY_LEN = 0.56
_BAY_PITCH = 0.42          # overlap 0.14; copy-drift ±0.03 still >= 0.10
_SHELL = (0.36, 0.26, 0.70)
_SHELL_BOW = (0.32, 0.24, 0.52)
_FAN_BURY = 0.16           # matches ln.radial_fan
_FAN_R_FLOOR = 0.30        # hub floor; G2 formula is below this at ace l
_DRIVE_HW = 0.22
_DRIVE_HH = 0.18
_DRIVE_DEP = 0.46
_ANT_H = 0.62              # tiny mast, not the default 1.45 forest height


# ===========================================================================
# STATION LIST
# ===========================================================================

def _ace_stations(l, b, h):
    """Slim high-speed through-bolt for the divergent surveyor.

    Half-extents are absolute slim-spine figures, not fractions of beam.
    ``b`` and ``h`` name the driver envelope; the loft stays inside both.
    Max half-beam 0.28 / half-height 0.26 — longer and slimmer than the
    light's compact probe body.
    """
    _ = (b, h)
    return [
        # -- BOW: drawn needle, optic host --
        sf.fair(l * -0.545, 0.14, 0.14, 0.0),   # needle tip
        sf.fair(l * -0.490, 0.22, 0.20, 0.0),
        sf.fair(l * -0.420, 0.26, 0.24, 0.0),
        sf.fair(l * -0.340, 0.28, 0.26, 0.0),   # bow / mid seam

        # -- MID: constant slim bay run --
        sf.fair(l * -0.180, 0.28, 0.26, 0.0),
        sf.fair(l *  0.000, 0.28, 0.26, 0.0),
        sf.fair(l *  0.160, 0.28, 0.26, 0.0),   # mid / stern seam

        # -- STERN: taper to the twin-drive transom --
        sf.fair(l *  0.300, 0.26, 0.24, 0.0),
        sf.fair(l *  0.430, 0.24, 0.22, 0.0),
        sf.fair(l *  0.500, 0.22, 0.20, 0.0),   # transom
    ]


def _fan_radius(l):
    """Return the G2 floor radius. Petal module is not scaled."""
    g2 = 0.15 * l - sf.FAN_PETAL_LEN + _FAN_BURY
    return max(g2, _FAN_R_FLOOR)


# ===========================================================================
# BUILD FUNCTION
# ===========================================================================

def build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail):
    """Build the Assembly divergent surveyor (ace class).

    parts    -- list that receives ROLE_HULL / ROLE_ARMOUR / ROLE_ACCENT /
                ROLE_TRIM / ROLE_RECESS objects.
    glow     -- list that receives emissive objects (skin_role='glow').
    l, b, h  -- class length, beam, height from the driver (7.2, 2.88, 1.44).
    detail   -- 3 full  2 half repeats  1 primaries  0 loft+hubs+drives.
    """
    _ = b
    stations = _ace_stations(l, b, h)

    z_nose = l * -0.545
    z_bow_s = l * -0.340
    z_mid_s = l * 0.160
    z_stern = l * 0.500
    fan_r = _fan_radius(l)

    # ── Through-bolt loft (always, detail 0+) ────────────────────────────
    # Slim ROLE_HULL core. Every bay, fan hub and drive housing bites this
    # volume by >= 0.10 so the island probe reads one body after copy-drift.
    kit.hull_loft(parts, 'ace.hull', kit.ROLE_HULL, stations, hull_mat)

    # ── TWIN DRIVE FACE (always, detail 0+) — duplicated modules ─────────
    # loc is the transom plane: housing forward 0.12 buries in the loft.
    # Two housings, two nozzles each (countable 2+2). Identical twins;
    # the fans carry the class mismatch.
    yo_stern = sf.section(stations, z_stern)[2]
    for side, tag in ((-1.0, 'port'), (1.0, 'stbd')):
        hw.drive_face(parts, glow, 'ace.drive.' + tag, hull_mat, glow_mat,
                      (side * 0.24, yo_stern, z_stern),
                      _DRIVE_HW, _DRIVE_HH,
                      nozzles=2, depth=_DRIVE_DEP, detail=detail)

    # ── RADIAL FANS (always — hubs are primary masses) ───────────────────
    # Generation 1: stern XY fan. Sets beam and height at the G2 floor.
    # Generation 2: bow-dorsal XZ fan. Same radius, seed 73, one petal
    # fewer. Outer Z of this fan is the authored bow extreme.
    z_fan_stern = l * 0.375
    z_fan_bow = l * -0.354
    y_fan_bow = sf.top_y(stations, z_fan_bow, 0.0) - 0.12
    ln.radial_fan(parts, 'ace.fan.stern', hull_mat,
                  (0.0, yo_stern, z_fan_stern),
                  count=8, radius=fan_r, plane='xy',
                  seed=41, detail=detail)
    ln.radial_fan(parts, 'ace.fan.bow', hull_mat,
                  (0.0, y_fan_bow, z_fan_bow),
                  count=7, radius=fan_r, plane='xz',
                  seed=73, detail=detail)

    if detail < 1:
        return

    # ── NOSE TEAL OPTIC (detail 1+) ──────────────────────────────────────
    hw.teal_optic(parts, glow, 'ace.optic.nose', hull_mat, glow_mat,
                  (0.0, 0.0, z_nose + 0.02),
                  radius=sf.OPTIC_COLLAR_R, facing='nose', detail=detail)

    # ── PRIMARY / REPEATED SPINE BAYS ────────────────────────────────────
    z_bay0 = l * -0.472
    z_bay1 = l * 0.458
    if detail == 1:
        bay_locs = (
            ('bow', l * -0.400),
            ('mid', l * -0.040),
            ('stern', l * 0.360),
        )
        for tag, z in bay_locs:
            yo = sf.section(stations, z)[2]
            ln.spine_segment(parts, 'ace.spine.' + tag, hull_mat,
                             (0.0, yo, z), _BAY_R, 0.90,
                             detail=detail, seed=110)
    else:
        pitch = _BAY_PITCH if detail >= 3 else _BAY_PITCH * 2.0
        n = int((z_bay1 - z_bay0) / pitch) + 1
        for i in range(n):
            z = z_bay0 + pitch * i
            if z > z_bay1 + 0.01:
                break
            yo = sf.section(stations, z)[2]
            ln.spine_segment(parts, 'ace.spine.%02d' % i, hull_mat,
                             (0.0, yo, z), _BAY_R, _BAY_LEN,
                             detail=detail, seed=100 + i)
            # Bow-face flange — second generation of the same joint, so
            # each bay reads as copied, clamped, copied again.
            if detail >= 2:
                ln.joint_ring(parts, 'ace.flange.%02d' % i, hull_mat,
                              (0.0, yo, z - _BAY_LEN * 0.5 + 0.05),
                              _BAY_R, detail=detail)

    # ── ZONE SEAM RINGS (detail 1+) ──────────────────────────────────────
    for tag, z in (('bow', z_bow_s), ('mid', z_mid_s)):
        sec_hw, _sec_hh, yo, _ch = sf.section(stations, z)
        ln.joint_ring(parts, 'ace.seam.' + tag, hull_mat,
                      (0.0, yo, z), max(sec_hw, _BAY_R) + 0.04,
                      detail=detail)

    # ── SHELL CLAMPS (detail 1+) — a few off-white pods ──────────────────
    # Inboard face overlaps the loft/bay by 0.14. Bow pair stays inside
    # the bow zone; mid pair and the dorsal clamp stay in mid.
    shells = (
        ('bow.stbd',  1.0, l * -0.430, _SHELL_BOW, 'flank'),
        ('bow.port', -1.0, l * -0.430, _SHELL_BOW, 'flank'),
        ('mid.stbd',  1.0, l * -0.050, _SHELL, 'flank'),
        ('mid.port', -1.0, l * -0.050, _SHELL, 'flank'),
    )
    if detail >= 2:
        shells = shells + (
            ('mid.dorsal', 0.0, l * 0.040, _SHELL, 'deck'),
        )
    if detail == 1:
        shells = shells[2:4]
    for tag, sxn, z, size, seat in shells:
        yo = sf.section(stations, z)[2]
        if seat == 'deck':
            top = sf.top_y(stations, z, 0.0)
            loc = (0.0, top + size[1] * 0.5 - 0.14, z)
        else:
            fx = sf.flank_x(stations, z, yo)
            loc = (sxn * (fx + size[0] * 0.5 - 0.14), yo, z)
        ln.shell_module(parts, 'ace.shell.' + tag, hull_mat,
                        loc, size, detail=detail, seed=200 + int(z * 40.0))

    if detail < 2:
        return

    # ── ORANGE REPLACEMENT BLOCKS (detail 2+) — two, geometry-count ──────
    # One on the starboard mid shell face, one on the dorsal mid bay.
    # Coverage is the patch count, never accent_density. Default patch
    # height 0.09 cannot pierce a deck by 0.10, so the dorsal block uses
    # a thicker Y (absolute) and stays fully overlapped with the shell.
    z_p0 = l * -0.050
    fx_p = sf.flank_x(stations, z_p0, 0.0)
    ln.orange_patch(parts, 'ace.patch.stbd', hull_mat,
                    (fx_p + 0.10, 0.02, z_p0),
                    detail=detail, seed=301)
    if detail >= 3:
        z_p1 = l * 0.040
        top_p = sf.top_y(stations, z_p1, 0.0)
        ln.orange_patch(parts, 'ace.patch.dorsal', hull_mat,
                        (0.06, top_p + 0.02, z_p1),
                        size=(0.52, 0.22, 0.40),
                        detail=detail, seed=302)

    # ── TINY ANTENNA (detail 2+) ─────────────────────────────────────────
    z_ant = l * -0.120
    hw.antenna_mast(parts, 'ace.ant.mid', hull_mat,
                    (0.0, sf.top_y(stations, z_ant, 0.0), z_ant),
                    height=_ANT_H, detail=detail)
