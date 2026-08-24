"""Smoke-probe the Beautiful Ones shared construct modules under Blender.

Why this exists: `ship_builders/beautiful/anatomy.py` and
`ship_builders/beautiful/organs.py` are consumed by six class files. A defect
in one shared construct is otherwise diagnosed six times, once per class,
after it has already been baked into six sculpts. This probe runs every
construct at every detail level before any class file exists.

Run:
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b \
        -P scripts/probe-beautiful-parts.py

For every construct, at every detail level 0..3, it reports:
  * whether the call raises (the exception is printed and the probe goes on),
  * the object count, the merged bounding box and the triangle count,
  * any NaN or non-finite vertex,
  * any object with a degenerate (zero-extent) bound,
  * any object whose extent is below 0.06 in EVERY axis -- the island probe's
    voxel size, so such a part would float invisibly (reported SUB-VOXEL),
  * the set of skin roles emitted, against the legal set
    {hull, armour, accent, recess, trim, glow}.

Depsgraph note: `measure()` calls `bpy.context.view_layer.update()` before
reading `matrix_world`. Kit builders assign `obj.location` without flushing
the depsgraph, so an early read reports every bmesh part as if it were
stacked at the origin.

It asserts nothing about art direction. It only proves the foundation runs
clean.
"""
import math
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

import ship_kit as kit
from ship_builders.beautiful import anatomy as an
from ship_builders.beautiful import organs as og
from ship_builders.beautiful import surface as sf


LEGAL_ROLES = {kit.ROLE_HULL, kit.ROLE_ARMOUR, kit.ROLE_ACCENT,
               kit.ROLE_TRIM, kit.ROLE_RECESS, 'glow'}

VOXEL = 0.06


def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)


def mats():
    hull = bpy.data.materials.get('probe-hull') or bpy.data.materials.new('probe-hull')
    glow = bpy.data.materials.get('probe-glow') or bpy.data.materials.new('probe-glow')
    return hull, glow


def measure(objs):
    """Return (tris, bbox, bad) for a list of objects."""
    bpy.context.view_layer.update()
    lo = [math.inf] * 3
    hi = [-math.inf] * 3
    tris = 0
    bad = []
    for obj in objs:
        if obj is None or obj.type != 'MESH':
            continue
        mesh = obj.data
        tris += sum(max(len(p.vertices) - 2, 0) for p in mesh.polygons)
        olo = [math.inf] * 3
        ohi = [-math.inf] * 3
        for vert in mesh.vertices:
            world = obj.matrix_world @ vert.co
            for i in range(3):
                value = world[i]
                if not math.isfinite(value):
                    bad.append('%s: non-finite vertex' % obj.name)
                    break
                lo[i] = min(lo[i], value)
                hi[i] = max(hi[i], value)
                olo[i] = min(olo[i], value)
                ohi[i] = max(ohi[i], value)
        if all(math.isfinite(v) for v in olo + ohi):
            extent = [ohi[i] - olo[i] for i in range(3)]
            if min(extent) <= 1e-6:
                bad.append('%s: degenerate extent %s'
                           % (obj.name, [round(e, 4) for e in extent]))
            elif max(extent) < VOXEL:
                bad.append('%s: SUB-VOXEL extent %s'
                           % (obj.name, [round(e, 4) for e in extent]))
        role = obj.get('skin_role')
        if role not in LEGAL_ROLES:
            bad.append('%s: illegal skin_role %r' % (obj.name, role))
    return tris, (lo, hi), bad


# Fusiform grown body: long, round section, thickest just aft of the head.
STATIONS = [
    sf.fair(-4.0, 0.18, 0.14, 0.0),
    sf.fair(-3.2, 0.55, 0.42, 0.0),
    sf.fair(-2.0, 0.85, 0.62, 0.0),
    sf.fair(-0.5, 0.95, 0.70, 0.0),
    sf.fair(1.2, 0.72, 0.52, 0.0),
    sf.fair(2.8, 0.40, 0.32, 0.0),
    sf.fair(4.0, 0.16, 0.12, 0.0),
]

SURF_FLANK = sf.surf_flank(STATIONS, 0.20)
SURF_TOP = sf.surf_top(STATIONS)
SURF_BOTTOM = sf.surf_bottom(STATIONS)
SURF_FLAT = sf.surf_flat(STATIONS)


def flank_anchor(z, y, inset=0.10):
    return sf.flank_x(STATIONS, z, y) - inset


def cases():
    """(label, callable(parts, glow, hull_mat, glow_mat, detail)) for every construct."""
    out = []

    def grown_body(p, g, hm, gm, d):
        radial = {3: 16, 2: 12, 1: 8, 0: 6}[d]
        return [sf.grown_loft(p, 'living-body-probe', kit.ROLE_ARMOUR,
                              STATIONS, hm, radial=radial)]

    out.append(('surface.grown_loft', grown_body))

    def fusiform_loft(p, g, hm, gm, d):
        st = an.fusiform_stations(-4.0, 4.0, 0.95, 0.70, peak_t=0.32, n=7)
        if len(st) < 2:
            raise RuntimeError('fusiform_stations returned too few stations')
        radial = {3: 16, 2: 12, 1: 8, 0: 6}[d]
        return [sf.grown_loft(p, 'living-body-fusiform', kit.ROLE_ARMOUR,
                              st, hm, radial=radial)]

    out.append(('anatomy.fusiform_stations', fusiform_loft))

    out.append(('anatomy.flow_line', lambda p, g, hm, gm, d: an.flow_line(
        p, 'living-flow', hm,
        [(flank_anchor(z, 0.20), 0.20, z)
         for z in (-3.0, -1.5, 0.0, 1.5, 3.0)], detail=d)))
    out.append(('anatomy.vein_fan', lambda p, g, hm, gm, d: an.vein_fan(
        p, g, 'vein', hm, gm,
        (flank_anchor(0.0, 0.20), 0.20, 0.0),
        [(flank_anchor(z, 0.30), 0.30, z)
         for z in (-0.9, -0.3, 0.3, 0.9)],
        (1.0, 0.0, 0.0), detail=d)))
    out.append(('anatomy.healed_scar', lambda p, g, hm, gm, d: an.healed_scar(
        p, 'scar', hm,
        [(0.30, sf.top_y(STATIONS, z, 0.30) - 0.10, z)
         for z in (-1.0, 0.0, 1.0, 2.0)], detail=d)))
    out.append(('anatomy.nacre_pads', lambda p, g, hm, gm, d: an.nacre_pads(
        p, 'nacre', hm,
        [(0.0, sf.top_y(STATIONS, z) - 0.12, z)
         for z in (-2.0, -1.0, 0.0, 1.0, 2.0)],
        (0.28, 0.16, 0.36), detail=d, seed=2)))
    out.append(('anatomy.grown_lip', lambda p, g, hm, gm, d: an.grown_lip(
        p, 'lip', hm, (0.0, sf.top_y(STATIONS, 0.0), 0.0),
        (0.40, 0.0, 0.0), (0.0, 0.0, 0.50), (0.0, 1.0, 0.0),
        count=9, bead_r=0.12, detail=d)))

    def fold_self_trim(p, g, hm, gm, d):
        built = an.muscle_fold(p, 'fold-t', hm, -6.0, 6.0, SURF_FLANK, 0.20,
                               detail=d)
        scratch = []
        inner = an.muscle_fold(scratch, 'fold-i', hm, -4.0, 4.0, SURF_FLANK,
                               0.20, detail=d)
        if len(built) > len(inner) + 2:
            raise RuntimeError('run did not self-trim past the loft: '
                               'extended run emitted %d objects, in-loft run %d'
                               % (len(built), len(inner)))
        return built

    out.append(('anatomy.muscle_fold', lambda p, g, hm, gm, d: an.muscle_fold(
        p, 'fold', hm, -2.5, 2.5, SURF_FLANK, 0.20, detail=d)))
    out.append(('anatomy.muscle_fold self-trim', fold_self_trim))

    out.append(('anatomy.shark_dorsal', lambda p, g, hm, gm, d: an.shark_dorsal(
        p, 'fin-dorsal', hm,
        (0.0, sf.top_y(STATIONS, -0.4) - 0.12, -0.4),
        (0.0, sf.top_y(STATIONS, 0.2) + 1.1, 0.6),
        0.55, thick=0.16, detail=d)))
    out.append(('anatomy.shark_caudal', lambda p, g, hm, gm, d: an.shark_caudal(
        p, 'fin-caudal', hm,
        (0.0, 0.0, 3.4),
        (0.0, 0.85, 5.1),
        (0.0, -0.45, 4.4),
        0.48, thick=0.14, detail=d)))
    out.append(('anatomy.shark_pectoral', lambda p, g, hm, gm, d: an.shark_pectoral(
        p, 'fin-pectoral', hm,
        (flank_anchor(-0.6, 0.0, inset=0.20), 0.0, -0.6),
        (flank_anchor(-0.6, 0.0) + 1.6, -0.25, 0.4),
        0.55, 0.18, thick=0.12, detail=d)))
    out.append(('anatomy.gill_slits', lambda p, g, hm, gm, d: an.gill_slits(
        p, 'gill', hm, -2.4, -1.0, SURF_FLANK, 0.05, side=1.0,
        count=5, height=0.36, detail=d)))

    out.append(('anatomy.squid_mantle_fins', lambda p, g, hm, gm, d: an.squid_mantle_fins(
        p, 'mantlefin', hm, (0.0, 0.15, 2.6), span=1.6, chord=1.1,
        thick=0.14, detail=d)))
    out.append(('anatomy.squid_arm', lambda p, g, hm, gm, d: an.squid_arm(
        p, 'living-arm', hm, (0.4, -0.1, 0.8), (0.7, -0.4, 2.6),
        root_r=0.16, tip_r=0.07, detail=d)))
    out.append(('anatomy.feeding_tentacle', lambda p, g, hm, gm, d: an.feeding_tentacle(
        p, 'living-tentacle', hm, (0.25, -0.05, 0.6), (0.4, -0.3, 3.8),
        root_r=0.12, club_r=0.18, detail=d)))
    out.append(('anatomy.sucker_pads', lambda p, g, hm, gm, d: an.sucker_pads(
        p, 'sucker', hm,
        [(0.5, -0.2, z) for z in (1.0, 1.4, 1.8, 2.2)],
        (0.0, -1.0, 0.0), radius=0.08, detail=d)))
    out.append(('anatomy.siphon', lambda p, g, hm, gm, d: an.siphon(
        p, 'living-siphon', hm, (0.0, -0.25, 1.6), length=0.7,
        radius=0.16, detail=d)))

    hub = (0.0, 0.05, -0.4)
    arm_tips = an.travel_arm_tips(hub, 2.4, count=8, spread=0.38, drop=0.20)

    def travel_check(p, g, hm, gm, d):
        tips = an.travel_arm_tips(hub, 2.4, count=8, spread=0.38, drop=0.20)
        for tip in tips:
            if tip[2] <= hub[2]:
                raise RuntimeError('travel pose arm tip is not trailing +Z')
        return an.interbrachial_web(p, 'web-check', hm, hub, tips,
                                    thick=0.12, trail=0.30, detail=d)

    out.append(('anatomy.octopus_arm', lambda p, g, hm, gm, d: an.octopus_arm(
        p, 'living-oct-arm', hm, hub, arm_tips[0],
        root_r=0.22, tip_r=0.08, web_to=arm_tips[1], web_frac=0.28,
        detail=d)))
    out.append(('anatomy.interbrachial_web', lambda p, g, hm, gm, d:
                an.interbrachial_web(p, 'web', hm, hub, arm_tips,
                                     thick=0.12, trail=0.30, detail=d)))
    out.append(('anatomy.travel_arm_tips', travel_check))

    out.append(('anatomy.whale_fluke', lambda p, g, hm, gm, d: an.whale_fluke(
        p, 'fluke', hm, (0.0, 0.0, 3.5), span=2.4, chord=0.9,
        thick=0.16, detail=d)))
    out.append(('anatomy.whale_pectoral humpback', lambda p, g, hm, gm, d:
                an.whale_pectoral(
                    p, 'fin-hump-pect', hm,
                    (flank_anchor(0.0, -0.1, inset=0.18), -0.1, 0.0),
                    (flank_anchor(0.0, -0.1) + 2.4, -0.35, 0.8),
                    0.42, 0.20, thick=0.14, style='humpback', detail=d)))
    out.append(('anatomy.whale_pectoral blue', lambda p, g, hm, gm, d:
                an.whale_pectoral(
                    p, 'fin-blue-pect', hm,
                    (flank_anchor(0.2, -0.1, inset=0.16), -0.1, 0.2),
                    (flank_anchor(0.2, -0.1) + 0.85, -0.15, 0.45),
                    0.32, 0.14, thick=0.12, style='blue', detail=d)))
    out.append(('anatomy.dorsal_ridge', lambda p, g, hm, gm, d: an.dorsal_ridge(
        p, 'ridge', hm, -1.5, 2.0, SURF_TOP, x=0.0, height=0.22, detail=d)))
    out.append(('anatomy.blowhole', lambda p, g, hm, gm, d: an.blowhole(
        p, g, 'blow', hm, gm,
        (0.0, sf.top_y(STATIONS, -2.4), -2.4), radius=0.26, detail=d)))

    out.append(('organs.sensory_crown', lambda p, g, hm, gm, d: og.sensory_crown(
        p, g, 'crown', hm, gm, (0.0, 0.05, -3.4), detail=d)))
    vent_pts = [(0.0, sf.top_y(STATIONS, z, 0.0), z)
                for z in (-1.0, -0.1, 0.8, 1.7)]
    out.append(('organs.breathing_vents', lambda p, g, hm, gm, d: og.breathing_vents(
        p, g, 'vent', hm, gm, vent_pts[0], face='y', detail=d,
        points=vent_pts)))
    out.append(('organs.belly_chamber', lambda p, g, hm, gm, d: og.belly_chamber(
        p, g, 'belly', hm, gm,
        (0.0, sf.bottom_y(STATIONS, 0.5, 0.0) + 0.20, 0.5),
        (1.2, 0.7, 1.8), detail=d)))
    out.append(('organs.sanctuary_hollow', lambda p, g, hm, gm, d: og.sanctuary_hollow(
        p, g, 'hollow', hm, gm,
        (sf.flank_x(STATIONS, 1.5, 0.0), 0.0, 1.5), face='x', detail=d)))
    out.append(('organs.nursery_hollow n=1', lambda p, g, hm, gm, d: og.nursery_hollow(
        p, g, 'nursery', hm, gm,
        (sf.flank_x(STATIONS, 0.5, 0.0), 0.0, 0.5), face='x', occupants=1,
        detail=d)))
    out.append(('organs.nursery_hollow n=2', lambda p, g, hm, gm, d: og.nursery_hollow(
        p, g, 'nursery2', hm, gm,
        (sf.flank_x(STATIONS, 0.5, 0.0), 0.0, 0.5), face='x', occupants=2,
        detail=d)))
    out.append(('organs.companion_craft', lambda p, g, hm, gm, d: og.companion_craft(
        p, g, 'companion', hm, gm,
        (0.0, sf.top_y(STATIONS, 2.0, 0.0) + 0.05, 2.0), detail=d)))

    def garden_self_trim(p, g, hm, gm, d):
        built = og.garden_fold(p, g, 'garden-t', hm, gm, -6.0, 6.0,
                               SURF_TOP, detail=d)
        scratch = []
        inner = og.garden_fold(scratch, [], 'garden-i', hm, gm, -4.0, 4.0,
                               SURF_TOP, detail=d)
        if len(built) > len(inner) + 6:
            raise RuntimeError('run did not self-trim past the loft: '
                               'extended run emitted %d objects, in-loft run %d'
                               % (len(built), len(inner)))
        return built

    out.append(('organs.garden_fold', lambda p, g, hm, gm, d: og.garden_fold(
        p, g, 'garden', hm, gm, -3.0, 3.0, SURF_TOP, detail=d)))
    out.append(('organs.garden_fold self-trim', garden_self_trim))
    out.append(('organs.dorsal_mantles', lambda p, g, hm, gm, d: og.dorsal_mantles(
        p, 'mantle', hm, (0.0, sf.top_y(STATIONS, 0.0) - 0.10, 0.0),
        (1.6, 0.9, 1.8), count=3, detail=d)))
    return out


def main():
    leftover = [n for n in dir(an) if n.startswith('_FLIP_') or n.startswith('_FIN_')]
    if leftover:
        print('LEFTOVER MANTA CONSTANTS: %s' % leftover)
        sys.exit(1)
    hull_mat, glow_mat = mats()
    failures = []
    print('== Beautiful Ones shared-construct smoke probe')
    for label, build in cases():
        for detail in (3, 2, 1, 0):
            clear()
            parts = []
            glow = []
            try:
                build(parts, glow, hull_mat, glow_mat, detail)
            except Exception as exc:  # noqa: BLE001 - probe reports every failure
                failures.append('%s detail=%d RAISED %s: %s'
                                % (label, detail, type(exc).__name__, exc))
                print('  FAIL %-38s detail=%d  %s: %s'
                      % (label, detail, type(exc).__name__, exc))
                continue
            objs = parts + glow
            tris, (lo, hi), bad = measure(objs)
            for message in bad:
                failures.append('%s detail=%d %s' % (label, detail, message))
            if not objs:
                print('  ok   %-38s detail=%d  empty' % (label, detail))
                continue
            print('  ok   %-38s detail=%d  objs=%3d tris=%5d  x[%6.2f,%6.2f] y[%6.2f,%6.2f] z[%6.2f,%6.2f]%s'
                  % (label, detail, len(objs), tris,
                     lo[0], hi[0], lo[2], hi[2], -hi[1], -lo[1],
                     '  ' + '; '.join(bad) if bad else ''))
    print('')
    if failures:
        print('BEAUTIFUL PART PROBE: %d PROBLEM(S)' % len(failures))
        for line in failures:
            print('  - ' + line)
        sys.exit(1)
    print('BEAUTIFUL PART PROBE: ALL CONSTRUCTS CLEAN')


if __name__ == '__main__':
    main()
