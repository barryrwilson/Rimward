"""Smoke-probe the Veridian Combine shared construct modules under Blender.

Why this exists: `ship_builders/veridian/modules.py` and
`ship_builders/veridian/hardware.py` will be consumed by six class
files. A defect in one shared construct is otherwise diagnosed six times.
This probe runs every public construct at every detail level before any
class file exists.

Run:
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b \
        -P scripts/probe-veridian-parts.py

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
clean. Default cradle_wing long-axis span is checked against the
§G2 floor (15 % of cutter length 11.0 = 1.65).
"""
import math
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

import ship_kit as kit
from ship_builders.veridian import hardware as hw
from ship_builders.veridian import modules as md
from ship_builders.veridian import surface as sf


LEGAL_ROLES = {kit.ROLE_HULL, kit.ROLE_ARMOUR, kit.ROLE_ACCENT,
               kit.ROLE_TRIM, kit.ROLE_RECESS, 'glow'}

VOXEL = 0.06
G2_FLOOR = 11.0 * 0.15


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
    """Return (tris, bbox, bad) for a list of objects.

    The view layer is updated first: kit builders assign `obj.location`
    without flushing the depsgraph, so `matrix_world` is still identity until
    Blender re-evaluates. Reading it early reports every bmesh part as if it
    were stacked at the origin.
    """
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


# Dummy stepped-slab stations for surf-callback self-trim (class authors
# will own a real list). Used only to prove the factories return 0.0
# off-section.
STATIONS = [
    sf.fair(-5.0, 0.48, 0.36, 0.0),
    sf.fair(-2.0, 0.72, 0.50, 0.0),
    sf.fair(0.0, 0.78, 0.54, 0.0),
    sf.fair(2.5, 0.62, 0.46, 0.0),
    sf.fair(5.0, 0.40, 0.32, 0.0),
]


def cases():
    """(label, callable(parts, glow, hull_mat, glow_mat, detail)) for every construct."""
    out = []

    # ---- modules.py -------------------------------------------------------
    out.append(('modules.flush_plate', lambda p, g, hm, gm, d: md.flush_plate(
        p, 'fp', hm, (0.0, 0.0, 0.0), detail=d)))
    out.append(('modules.alloy_course', lambda p, g, hm, gm, d: md.alloy_course(
        p, 'ac', hm, (0.0, 0.0, 0.0), count=4, detail=d)))
    out.append(('modules.hex_module', lambda p, g, hm, gm, d: md.hex_module(
        p, 'hm', hm, (0.0, 0.0, 0.0), detail=d)))
    out.append(('modules.hex_run', lambda p, g, hm, gm, d: md.hex_run(
        p, 'hr', hm, (0.0, 0.0, 0.0), count=4, detail=d)))
    out.append(('modules.recess_well', lambda p, g, hm, gm, d: md.recess_well(
        p, g, 'rw', hm, gm, (0.0, 0.0, 0.0), detail=d)))
    out.append(('modules.zone_collar', lambda p, g, hm, gm, d: md.zone_collar(
        p, 'zc', hm, (0.0, 0.0, 0.0), detail=d)))
    out.append(('modules.spine_block', lambda p, g, hm, gm, d: md.spine_block(
        p, 'sb', hm, (0.0, 0.0, 0.0), detail=d)))
    out.append(('modules.keel_spine', lambda p, g, hm, gm, d: md.keel_spine(
        p, 'ks', hm, -3.0, 3.0, half_w=0.20, half_h=0.16, detail=d)))
    out.append(('modules.alloy_course surf-trim',
                lambda p, g, hm, gm, d: md.alloy_course(
                    p, 'acs', hm, (0.0, 0.0, 8.0), count=3,
                    surf=sf.surf_flank(STATIONS, 0.0), detail=d)))
    out.append(('modules.alloy_course surf-live',
                lambda p, g, hm, gm, d: md.alloy_course(
                    p, 'acl', hm, (0.0, 0.0, 0.0), count=3,
                    surf=sf.surf_flank(STATIONS, 0.0), detail=d)))

    # ---- hardware.py ------------------------------------------------------
    out.append(('hardware.survey_head', lambda p, g, hm, gm, d: hw.survey_head(
        p, g, 'sh', hm, gm, (0.0, 0.0, -1.2), detail=d)))
    out.append(('hardware.sample_canister', lambda p, g, hm, gm, d: hw.sample_canister(
        p, 'sc', hm, (0.4, 0.0, 0.0), detail=d)))
    out.append(('hardware.ranging_vane', lambda p, g, hm, gm, d: hw.ranging_vane(
        p, 'rv', hm, (0.6, 0.0, 0.0), detail=d)))
    out.append(('hardware.docking_collar', lambda p, g, hm, gm, d: hw.docking_collar(
        p, g, 'dc', hm, gm, (0.0, 0.0, -2.0), detail=d)))
    out.append(('hardware.survey_drone', lambda p, g, hm, gm, d: hw.survey_drone(
        p, g, 'sd', hm, gm, (0.8, 0.0, 0.2), detail=d)))
    out.append(('hardware.evidence_locker', lambda p, g, hm, gm, d: hw.evidence_locker(
        p, 'el', hm, (0.0, -0.2, 0.4), detail=d)))
    out.append(('hardware.sample_vault', lambda p, g, hm, gm, d: hw.sample_vault(
        p, 'sv', hm, (0.0, 0.2, 0.0), detail=d)))
    out.append(('hardware.cradle_wing', lambda p, g, hm, gm, d: hw.cradle_wing(
        p, 'cw', hm, (0.0, 0.0, 0.0), detail=d)))
    for n in (2, 4, 6, 8):
        def drive(p, g, hm, gm, d, n=n):
            return hw.drive_face(p, g, 'df%d' % n, hm, gm, (0.0, 0.0, 3.2),
                                 0.55, 0.40, nozzles=n, detail=d)
        out.append(('hardware.drive_face n=%d' % n, drive))
    out.append(('hardware.radiator', lambda p, g, hm, gm, d: hw.radiator(
        p, 'rd', hm, (1.10, 0.0, 1.6), detail=d)))
    out.append(('hardware.tug_dock', lambda p, g, hm, gm, d: hw.tug_dock(
        p, 'td', hm, (0.0, -0.2, 1.4), detail=d)))
    out.append(('hardware.ore_silo', lambda p, g, hm, gm, d: hw.ore_silo(
        p, 'os', hm, (0.0, 0.4, 0.0), detail=d)))
    out.append(('hardware.refinery_drum', lambda p, g, hm, gm, d: hw.refinery_drum(
        p, 'rf', hm, (0.0, 0.0, 1.0), detail=d)))
    out.append(('hardware.claim_module', lambda p, g, hm, gm, d: hw.claim_module(
        p, 'cm', hm, (0.0, -0.3, 0.2), detail=d)))
    out.append(('hardware.nested_scout', lambda p, g, hm, gm, d: hw.nested_scout(
        p, 'ns', hm, (0.0, -0.2, 0.4), detail=d)))
    out.append(('hardware.navigation_light', lambda p, g, hm, gm, d: hw.navigation_light(
        p, g, 'nl', hm, gm, (0.6, 0.2, -1.6), detail=d)))

    # ---- surface factories + G2 floors ------------------------------------
    out.append(('surface.surf self-trim', lambda p, g, hm, gm, d: _probe_surf()))
    out.append(('g2.cradle_wing span', lambda p, g, hm, gm, d: _probe_g2_wing(p, hm, d)))
    return out


def _probe_surf():
    flank = sf.surf_flank(STATIONS, 0.0)
    top = sf.surf_top(STATIONS)
    bot = sf.surf_bottom(STATIONS)
    flat = sf.surf_flat(STATIONS)
    if flank(-8.0) != 0.0 or flank(8.0) != 0.0:
        raise RuntimeError('surf_flank did not self-trim off-section')
    if top(-8.0) != 0.0 or bot(8.0) != 0.0 or flat(-9.0) != 0.0:
        raise RuntimeError('surf_top/bottom/flat did not self-trim off-section')
    if flank(0.0) <= 0.0:
        raise RuntimeError('surf_flank returned 0.0 on a live station')
    if sf.flank_x(STATIONS, 0.0, 4.0) != 0.0:
        raise RuntimeError('flank_x must return 0.0 above the section')
    if sf.CRADLE_WING_REACH < G2_FLOOR:
        raise RuntimeError('default CRADLE_WING_REACH must be >= 15 % of cutter length')
    if sf.CRADLE_WING_T < VOXEL:
        raise RuntimeError('CRADLE_WING_T is too thin to survive the island voxel')
    if sf.LAMP_SPACING != 1.20:
        raise RuntimeError('LAMP_SPACING must stay HUMAN.lampGap 1.20')
    if sf.PORT_LIGHT != (0.20, 0.13, 0.06):
        raise RuntimeError('PORT_LIGHT must stay HUMAN window size')
    if sf.PORT_SPACING != 0.34:
        raise RuntimeError('PORT_SPACING must stay HUMAN.windowGap 0.34')
    if sf.COLLAR_BORE != 0.62:
        raise RuntimeError('COLLAR_BORE must stay HUMAN.collarR 0.62')
    if sf.CARGO_CRATE != (0.85, 0.85, 0.85):
        raise RuntimeError('CARGO_CRATE must stay HUMAN.crateS 0.85')
    if sf.MARKER_LAMP != (0.10, 0.10, 0.06):
        raise RuntimeError('MARKER_LAMP must stay HUMAN.lampSize')
    if sf.STATUS_SLIT != (0.10, 0.05, 0.04):
        raise RuntimeError('STATUS_SLIT must stay the pilot human size')
    if sf.TRANSFER_HATCH != (0.34, 0.52, 0.06):
        raise RuntimeError('TRANSFER_HATCH must stay HUMAN door size')
    return []


def _long_span(lo, hi):
    return max(hi[i] - lo[i] for i in range(3))


def _probe_g2_wing(parts, hull_mat, detail):
    if detail != 3:
        return []
    objs = hw.cradle_wing(parts, 'g2cw', hull_mat, (0.0, 0.0, 0.0), detail=3)
    tris, (lo, hi), bad = measure(objs)
    span = _long_span(lo, hi)
    if span < G2_FLOOR:
        raise RuntimeError('cradle_wing default long-axis span %.3f < %.3f'
                           % (span, G2_FLOOR))
    return objs


def main():
    hull_mat, glow_mat = mats()
    failures = []
    print('== Veridian Combine shared-construct smoke probe')
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
        print('VERIDIAN PART PROBE: %d PROBLEM(S)' % len(failures))
        for line in failures:
            print('  - ' + line)
        sys.exit(1)
    print('VERIDIAN PART PROBE: ALL CONSTRUCTS CLEAN')


if __name__ == '__main__':
    main()
