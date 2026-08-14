"""Smoke-probe the Red Ledger shared construct modules under Blender.

Why this exists: `salvage.py` and `donors.py` are consumed by six class files.
A defect in one of them is otherwise diagnosed six times, once per class, after
it has already been baked into six sculpts. The rebuild plan records this as the
single highest-value instrument of the procedural waves, and it applies
unchanged to the Blender pipeline.

Run:
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b \
        -P scripts/probe-ledger-parts.py

For every construct, at every detail level, it reports:
  * whether the call raises,
  * the object count and the merged bounding box,
  * any NaN or non-finite vertex,
  * any object with a degenerate (zero-extent) bound,
  * the set of skin roles emitted, against the five legal roles,
  * the triangle count.

It asserts nothing about art direction. It only proves the foundation runs
clean, so a class-level failure cannot be blamed on it.
"""
import math
import sys
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

import ship_kit as kit
from ship_builders.redledger import donors as dn
from ship_builders.redledger import hardware as hw
from ship_builders.redledger import salvage as sv


LEGAL_ROLES = {kit.ROLE_HULL, kit.ROLE_ARMOUR, kit.ROLE_ACCENT,
               kit.ROLE_TRIM, kit.ROLE_RECESS, 'glow'}


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

    The view layer is updated first: kit builders that go through
    `_bmesh_finish` assign `obj.location` without flushing the depsgraph, so
    `matrix_world` is still identity until Blender re-evaluates. Reading it
    early reports every bmesh part as if it were stacked at the origin.
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
                bad.append('%s: degenerate extent %s' % (obj.name, [round(e, 4) for e in extent]))
        role = obj.get('skin_role')
        if role not in LEGAL_ROLES:
            bad.append('%s: illegal skin_role %r' % (obj.name, role))
    return tris, (lo, hi), bad


def cases():
    """(label, callable(parts, glow, hull_mat, glow_mat, detail)) for every construct."""
    out = []

    # ---- salvage.py -------------------------------------------------------
    out.append(('salvage.plate_quilt flank', lambda p, g, hm, gm, d: sv.plate_quilt(
        p, 'q', 1.6, 0.0, -3.0, 3.0, 1.2, hm, seed=11, detail=d)))
    # The `surf` path is the one a wedge hull actually uses: a tapering flank,
    # sampled per plate. The taper here falls from 1.6 to 0.9 over the run, and
    # returns 0.0 above y = 0.6 to exercise the "above the hull" skip.
    def taper(z, y):
        if y > 0.6:
            return 0.0
        t = (z + 3.0) / 6.0
        return 1.6 - 0.7 * max(0.0, min(1.0, t))

    out.append(('salvage.plate_quilt surf taper', lambda p, g, hm, gm, d: sv.plate_quilt(
        p, 'qs', 0.0, 0.0, -3.0, 3.0, 1.2, hm, seed=13, detail=d, surf=taper)))
    out.append(('salvage.stripe_group surf taper', lambda p, g, hm, gm, d: sv.stripe_group(
        p, 'sgs', 0.0, 0.2, -2.0, 0.0, hm, height=0.9, count=7, detail=d, surf=taper)))
    out.append(('salvage.plate_quilt deck', lambda p, g, hm, gm, d: sv.plate_quilt(
        p, 'qd', 0.0, 1.4, -3.0, 3.0, 1.6, hm, seed=12, detail=d, face='y')))
    out.append(('salvage.stripe_block', lambda p, g, hm, gm, d: sv.stripe_block(
        p, 's', 1.6, 0.2, -1.0, hm, height=0.9, detail=d)))
    out.append(('salvage.stripe_group', lambda p, g, hm, gm, d: sv.stripe_group(
        p, 'sg', 1.6, 0.2, -2.0, 0.0, hm, height=0.9, count=7, detail=d)))
    out.append(('salvage.salvage_boom', lambda p, g, hm, gm, d: sv.salvage_boom(
        p, g, 'boom', (0.0, -0.3, -2.0), (0.0, -1.1, -5.2), hm, gm,
        radius=0.07, jaw=0.5, detail=d)))

    # ---- hardware.py ------------------------------------------------------
    # A hull-sized reference section for the seam constructs: half-beam 1.6,
    # half-height 1.1, no vertical offset, chamfer 0.3.
    sec = (1.6, 1.1, 0.0, 0.3)
    out.append(('hardware.weld_bead', lambda p, g, hm, gm, d: hw.weld_bead(
        p, 'bead', sec[0], sec[1], sec[2], sec[3], -1.0, hm, detail=d)))
    out.append(('hardware.capture_collar', lambda p, g, hm, gm, d: hw.capture_collar(
        p, 'collar', sec[0], sec[1], sec[2], sec[3], 1.0, hm, depth=0.24, detail=d)))
    out.append(('hardware.tally_band', lambda p, g, hm, gm, d: hw.tally_band(
        p, 'tally', 1.55, 0.2, -1.5, 0.5, hm, strokes=8, inward=-1.0, detail=d)))
    out.append(('hardware.grapple_arm', lambda p, g, hm, gm, d: hw.grapple_arm(
        p, g, 'arm', (0.9, 0.0, -1.0), (1.6, -0.4, -3.2), hm, gm,
        radius=0.09, jaw=0.4, detail=d)))
    out.append(('hardware.clamp_pad', lambda p, g, hm, gm, d: hw.clamp_pad(
        p, 'pad', (0.6, 1.0, 0.4), hm, (0.3, 0.08, 0.4), detail=d)))
    out.append(('hardware.breach_tube', lambda p, g, hm, gm, d: hw.breach_tube(
        p, g, 'tube', -3.4, -0.6, hm, gm, radius=0.22, detail=d)))
    out.append(('hardware.shutter_well', lambda p, g, hm, gm, d: hw.shutter_well(
        p, 'well', (0.8, 0.9, 0.2), hm, (0.30, 0.10, 0.45), detail=d)))
    out.append(('hardware.vault_block', lambda p, g, hm, gm, d: hw.vault_block(
        p, g, 'vault', (0.0, 1.5, 1.0), hm, gm, (1.2, 0.8, 1.6), d)))
    out.append(('hardware.counting_house', lambda p, g, hm, gm, d: hw.counting_house(
        p, g, 'house', (0.8, 1.4, -0.5), hm, gm, (1.0, 0.7, 1.4), d)))
    out.append(('hardware.transfer_lock', lambda p, g, hm, gm, d: hw.transfer_lock(
        p, g, 'lock', (1.2, 0.1, 0.6), hm, gm, (0.5, 0.5, 0.9), d)))
    # The drive is the construct that hid a 15-unit-wide nozzle rail: assert the
    # emitted group stays inside the housing face by reading the printed extents.
    out.append(('hardware.captured_drive n=6', lambda p, g, hm, gm, d: hw.captured_drive(
        p, g, 'drive', (0.0, 0.0, 2.4), hm, gm, radius=0.9, depth=1.2,
        nozzles=6, detail=d)))
    out.append(('hardware.captured_drive n=2', lambda p, g, hm, gm, d: hw.captured_drive(
        p, g, 'drive2', (0.0, 0.0, 2.4), hm, gm, radius=0.45, depth=0.8,
        nozzles=2, detail=d)))
    out.append(('hardware.reverse_block', lambda p, g, hm, gm, d: hw.reverse_block(
        p, g, 'rev', (1.0, 0.2, -2.0), hm, gm, (0.35, 0.35, 0.6), d)))
    out.append(('hardware.ram_prow', lambda p, g, hm, gm, d: hw.ram_prow(
        p, 'ram', -4.6, -2.2, 0.7, 0.55, hm, courses=3, detail=d)))
    out.append(('hardware.lamp_run', lambda p, g, hm, gm, d: hw.lamp_run(
        p, g, 'lamps', 1.5, 0.9, -2.0, 2.0, gm, hm, 1.20, d)))
    out.append(('hardware.radiator_panel', lambda p, g, hm, gm, d: hw.radiator_panel(
        p, 'rad', (1.7, 0.3, 2.0), hm, (0.06, 0.5, 0.9), detail=d)))

    # ---- donors.py -------------------------------------------------------
    out.append(('donors.weld_strap', lambda p, g, hm, gm, d: dn.weld_strap(
        p, 'strap', (0.9, 0.6, -1.0), hm, (0.5, 0.06, 0.12), detail=d)))
    out.append(('donors.cut_edge', lambda p, g, hm, gm, d: dn.cut_edge(
        p, 'cut', (0.9, 0.6, -1.4), hm, (0.5, 0.10, 0.06), detail=d)))
    out.append(('donors.donor_veridian_head', lambda p, g, hm, gm, d: dn.donor_veridian_head(
        p, g, 'dv', (0.0, 0.8, -2.2), hm, gm, (0.9, 0.7, 1.0), detail=d)))
    out.append(('donors.donor_ferrous_ribs', lambda p, g, hm, gm, d: dn.donor_ferrous_ribs(
        p, g, 'df', (1.2, 0.2, 0.4), hm, gm, (0.25, 0.9, 2.4), detail=d)))
    out.append(('donors.donor_freehold_drum', lambda p, g, hm, gm, d: dn.donor_freehold_drum(
        p, g, 'dh', (0.0, 1.1, 1.4), hm, gm, (1.0, 1.0, 1.6), detail=d)))
    out.append(('donors.donor_gilded_panel', lambda p, g, hm, gm, d: dn.donor_gilded_panel(
        p, g, 'dg', (1.1, 0.4, -0.4), hm, gm, (0.2, 0.9, 1.8), detail=d)))
    return out


def main():
    hull_mat, glow_mat = mats()
    failures = []
    print('== Red Ledger shared-construct smoke probe')
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
                print('  FAIL %-34s detail=%d  %s: %s'
                      % (label, detail, type(exc).__name__, exc))
                continue
            objs = parts + glow
            tris, (lo, hi), bad = measure(objs)
            if detail == 0 and objs:
                failures.append('%s detail=0 emitted %d objects; detail 0 must be empty'
                                % (label, len(objs)))
            for message in bad:
                failures.append('%s detail=%d %s' % (label, detail, message))
            if not objs:
                print('  ok   %-34s detail=%d  empty' % (label, detail))
                continue
            print('  ok   %-34s detail=%d  objs=%3d tris=%5d  x[%6.2f,%6.2f] y[%6.2f,%6.2f] z[%6.2f,%6.2f]%s'
                  % (label, detail, len(objs), tris,
                     lo[0], hi[0], lo[2], hi[2], -hi[1], -lo[1],
                     '  ' + '; '.join(bad) if bad else ''))
    print('')
    if failures:
        print('LEDGER PART PROBE: %d PROBLEM(S)' % len(failures))
        for line in failures:
            print('  - ' + line)
    else:
        print('LEDGER PART PROBE: ALL CONSTRUCTS CLEAN')


if __name__ == '__main__':
    main()
