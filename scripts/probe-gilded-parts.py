"""Smoke-probe the Gilded Chain shared construct modules under Blender.

Why this exists: `ship_builders/gilded/shell.py` and
`ship_builders/gilded/hardware.py` are consumed by six class files. A defect in
one shared construct is otherwise diagnosed six times, once per class, after it
has already been baked into six sculpts. This probe runs every construct at
every detail level before any class file exists, so a class-level failure
cannot be blamed on the foundation.

Run:
    "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b \
        -P scripts/probe-gilded-parts.py

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
reading `matrix_world`. Kit builders assign `obj.location` without flushing the
depsgraph, so an early read reports every bmesh part as if it were stacked at
the origin.

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
from ship_builders.gilded import hardware as hw
from ship_builders.gilded import shell as sh
from ship_builders.gilded import surface as sf


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


# A representative fair leaf loft: ~12 long, 3 across, 1.2 high, needle nose.
# Stations are (z, half_w, half_h, y_offset, chamfer); -z is the nose.
STATIONS = [
    sf.fair(-6.0, 0.15, 0.12, 0.0),
    sf.fair(-4.5, 0.90, 0.40, 0.0),
    sf.fair(-2.5, 1.40, 0.55, 0.0),
    sf.fair(0.0, 1.50, 0.60, 0.0),
    sf.fair(2.5, 1.30, 0.55, 0.0),
    sf.fair(4.5, 0.90, 0.40, 0.0),
    sf.fair(6.0, 0.50, 0.30, 0.0),
]

# Real surface callbacks, exactly as a class author derives them.
SURF_FLANK = sf.surf_flank(STATIONS, 0.0)
SURF_TOP = sf.surf_top(STATIONS)
SURF_BOTTOM = sf.surf_bottom(STATIONS)
SURF_FLAT = sf.surf_flat(STATIONS)


def flank_anchor(z, y, inset=0.03):
    """A surface-seated x anchor, as a class file computes it."""
    return sf.flank_x(STATIONS, z, y) - inset


def cases():
    """(label, callable(parts, glow, hull_mat, glow_mat, detail)) for every construct."""
    out = []

    # ---- shell.py ---------------------------------------------------------
    out.append(('shell.scale_course flank', lambda p, g, hm, gm, d: sh.scale_course(
        p, 'sc', hm, -5.0, 5.0, 0.0, 0.35, SURF_FLANK, detail=d)))

    def self_trim(p, g, hm, gm, d):
        # The run extends past BOTH loft ends (-6..6): it must self-trim via
        # the surf callback returning 0.0, not raise, and emit no more objects
        # than the in-loft run (one extra allowed for pitch-phase sampling).
        built = sh.scale_course(p, 'sct', hm, -8.0, 8.0, 0.0, 0.35,
                                SURF_FLANK, detail=d)
        scratch = []
        inner = sh.scale_course(scratch, 'sci', hm, -6.0, 6.0, 0.0, 0.35,
                                SURF_FLANK, detail=d)
        if len(built) > len(inner) + 1:
            raise RuntimeError('run did not self-trim past the loft: '
                               'extended run emitted %d objects, in-loft run %d'
                               % (len(built), len(inner)))
        return built

    out.append(('shell.scale_course self-trim', self_trim))
    out.append(('shell.scale_field dorsal', lambda p, g, hm, gm, d: sh.scale_field(
        p, 'sfld', hm, -4.5, 4.5, SURF_TOP, SURF_FLAT, 5, detail=d)))
    out.append(('shell.ivory_margin', lambda p, g, hm, gm, d: sh.ivory_margin(
        p, 'iv', hm, -5.5, -2.0, 0.0, 0.45, SURF_FLANK, detail=d)))
    out.append(('shell.gold_line', lambda p, g, hm, gm, d: sh.gold_line(
        p, 'gl', hm,
        [(flank_anchor(z, 0.10), 0.10, z) for z in (-5.0, -3.0, -1.0, 1.0, 3.0, 5.0)],
        detail=d)))
    out.append(('shell.collar_band', lambda p, g, hm, gm, d: sh.collar_band(
        p, 'cb', hm, sf.collar_ring(STATIONS, 0.0), 0.0, detail=d)))
    out.append(('shell.gallery_slot', lambda p, g, hm, gm, d: sh.gallery_slot(
        p, g, 'gs', hm, gm, -4.0, 1.0, -0.10, 0.30, SURF_FLANK, detail=d)))
    out.append(('shell.aperture_seam closed', lambda p, g, hm, gm, d: sh.aperture_seam(
        p, g, 'as0', hm, gm, (flank_anchor(-1.0, 0.20), 0.20, -1.0), 0.80,
        axis='z', open=0.0, detail=d)))
    out.append(('shell.aperture_seam open', lambda p, g, hm, gm, d: sh.aperture_seam(
        p, g, 'as6', hm, gm, (flank_anchor(1.0, 0.20), 0.20, 1.0), 0.80,
        axis='z', open=0.6, detail=d)))
    out.append(('shell.edge_keel', lambda p, g, hm, gm, d: sh.edge_keel(
        p, 'ek', hm, -5.0, 5.5, SURF_BOTTOM, detail=d)))

    # ---- hardware.py ------------------------------------------------------
    out.append(('hardware.tractor_lens', lambda p, g, hm, gm, d: hw.tractor_lens(
        p, g, 'tl', hm, gm, (flank_anchor(-2.0, 0.10), 0.10, -2.0), 0.28,
        detail=d)))
    out.append(('hardware.capture_collar', lambda p, g, hm, gm, d: hw.capture_collar(
        p, g, 'cc', hm, gm, (0.0, sf.bottom_y(STATIONS, 1.5), 1.5), detail=d)))
    out.append(('hardware.transfer_chamber', lambda p, g, hm, gm, d: hw.transfer_chamber(
        p, g, 'tc', hm, gm, (flank_anchor(2.0, 0.0), 0.0, 2.0),
        (0.45, 0.60, 0.80), detail=d)))
    out.append(('hardware.observation_rotunda', lambda p, g, hm, gm, d: hw.observation_rotunda(
        p, g, 'rot', hm, gm, (0.0, sf.top_y(STATIONS, -1.5), -1.5), 0.60, 0.35,
        detail=d)))
    out.append(('hardware.ventral_pylon', lambda p, g, hm, gm, d: hw.ventral_pylon(
        p, g, 'vp', hm, gm, (0.0, sf.bottom_y(STATIONS, 0.5) + 0.05, 0.5),
        (0.35, -2.0, 1.6), 1.60, 0.08, detail=d)))
    for n in (2, 4, 6, 8):
        def drive(p, g, hm, gm, d, n=n):
            hw_, hh_, yo_, _ch = sf.section(STATIONS, 6.0)
            return hw.drive_face(p, g, 'df%d' % n, hm, gm, (0.0, yo_, 6.10),
                                 hw_ * 0.8, hh_ * 0.8, nozzles=n, detail=d)
        out.append(('hardware.drive_face n=%d' % n, drive))
    out.append(('hardware.radiator_vane', lambda p, g, hm, gm, d: hw.radiator_vane(
        p, 'rv', hm, (flank_anchor(2.5, 0.20), 0.20, 2.5), 1.20, 0.70,
        detail=d)))
    out.append(('hardware.mast_cluster', lambda p, g, hm, gm, d: hw.mast_cluster(
        p, g, 'mc', hm, gm, (0.0, sf.top_y(STATIONS, 3.0), 3.0), 1.10,
        count=3, detail=d)))
    out.append(('hardware.marker_run', lambda p, g, hm, gm, d: hw.marker_run(
        p, g, 'mr', hm, gm, -5.0, 5.0, 0.15, SURF_FLANK, detail=d)))
    out.append(('hardware.vault_body', lambda p, g, hm, gm, d: hw.vault_body(
        p, 'vb', hm, (0.0, sf.top_y(STATIONS, 1.0), 1.0), (0.90, 0.50, 1.40),
        detail=d)))
    out.append(('hardware.docked_leaf', lambda p, g, hm, gm, d: hw.docked_leaf(
        p, g, 'dl', hm, gm, (0.0, sf.top_y(STATIONS, 4.0) + 0.20, 4.0), 1.40,
        detail=d)))
    return out


def main():
    hull_mat, glow_mat = mats()
    failures = []
    print('== Gilded Chain shared-construct smoke probe')
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
        print('GILDED PART PROBE: %d PROBLEM(S)' % len(failures))
        for line in failures:
            print('  - ' + line)
        sys.exit(1)
    print('GILDED PART PROBE: ALL CONSTRUCTS CLEAN')


if __name__ == '__main__':
    main()
