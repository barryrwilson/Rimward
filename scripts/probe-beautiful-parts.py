"""Smoke-probe the Beautiful Ones shared construct modules under Blender.

Why this exists: `ship_builders/beautiful/anatomy.py` and
`ship_builders/beautiful/organs.py` are consumed by six class files. A defect
in one shared construct is otherwise diagnosed six times, once per class,
after it has already been baked into six sculpts. This probe runs every
construct at every detail level before any class file exists, so a
class-level failure cannot be blamed on the foundation. Foundation first,
and prove it — the wave-7 rule.

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
reading `matrix_world`. Kit builders assign `obj.location` (and the swept
membranes `obj.rotation_euler`) without flushing the depsgraph, so an early
read reports every bmesh part as if it were stacked at the origin.

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


# A representative manta-plan grown body: ~8 long, ~3.5 half-beam, ~1.0
# half-height, thickest just aft of the head, drawn into a long tail.
# Every section is sf.fair() — the near-ellipse the faction's soft roll needs.
# Stations are (z, half_w, half_h, y_offset, chamfer); -z is the nose.
STATIONS = [
    sf.fair(-4.0, 0.30, 0.12, 0.0),
    sf.fair(-3.0, 1.60, 0.45, 0.0),
    sf.fair(-1.5, 2.80, 0.80, 0.0),
    sf.fair(0.0, 3.50, 1.00, 0.0),
    sf.fair(1.5, 3.10, 0.85, 0.0),
    sf.fair(3.0, 2.20, 0.55, 0.0),
    sf.fair(4.0, 1.20, 0.30, 0.0),
]

# Real surface callbacks, exactly as a class author derives them.
SURF_FLANK = sf.surf_flank(STATIONS, 0.20)
SURF_TOP = sf.surf_top(STATIONS)
SURF_BOTTOM = sf.surf_bottom(STATIONS)
SURF_FLAT = sf.surf_flat(STATIONS)


def flank_anchor(z, y, inset=0.10):
    """A surface-seated x anchor, as a class file computes it (buried)."""
    return sf.flank_x(STATIONS, z, y) - inset


def cases():
    """(label, callable(parts, glow, hull_mat, glow_mat, detail)) for every construct."""
    out = []

    # ---- anatomy.py -------------------------------------------------------
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
    out.append(('anatomy.fin_membrane', lambda p, g, hm, gm, d: an.fin_membrane(
        p, 'fin-wing', hm,
        (flank_anchor(-0.5, 0.10, inset=0.40), 0.10, -0.5),
        (flank_anchor(0.5, 0.10) + 2.2, -0.15, 1.8),
        2.0, 0.5, thick=0.10, detail=d)))

    def fin_bead_overlap(p, g, hm, gm, d):
        # Same anchors as the anatomy.fin_membrane case above. Build the
        # flipper, then assert the bead chain has no gap: every consecutive
        # bead-centre distance must stay under 0.55 * the sum of the two
        # beads' along-span radii (the overlap invariant flipper_bead_layout
        # guarantees), so the chain is one smooth voxel-connected mass.
        root = (flank_anchor(-0.5, 0.10, inset=0.40), 0.10, -0.5)
        tip = (flank_anchor(0.5, 0.10) + 2.2, -0.15, 1.8)
        built = an.fin_membrane(p, 'fin-wing-gap', hm, root, tip,
                                2.0, 0.5, thick=0.10, detail=d)
        layout = an.flipper_bead_layout(root, tip, 1.0, 0.25, 0.05, detail=d)
        for i in range(len(layout) - 1):
            dist = math.sqrt(sum((layout[i + 1][1][k] - layout[i][1][k]) ** 2
                                 for k in range(3)))
            limit = 0.55 * (layout[i][2][2] + layout[i + 1][2][2])
            if dist >= limit:
                raise RuntimeError('bead gap: beads %d/%d centre distance '
                                   '%.3f >= 0.55 * span radii sum %.3f'
                                   % (i, i + 1, dist, limit))
        return built

    out.append(('anatomy.fin_membrane bead-overlap', fin_bead_overlap))

    def span_bead_overlap(p, g, hm, gm, d):
        # Same anchors as the first organs.grasping_fins finger: swept_span
        # is a fixed detail=3, seed=1 fleshy_sweep with FULL-extents chords
        # halved to radii — assert the same no-gap invariant on its chain.
        root = (flank_anchor(0.5, -0.30, inset=0.40), -0.30, 0.5)
        tip = (flank_anchor(0.5, -0.30) + 1.2, -0.75, -0.1)
        built = an.swept_span(p, 'fin-grasp-gap', kit.ROLE_ARMOUR, hm,
                              root, tip, 0.50, 0.16, 0.12)
        layout = an.flipper_bead_layout(root, tip, 0.25, 0.08, 0.06,
                                        seed=1, detail=3)
        for i in range(len(layout) - 1):
            dist = math.sqrt(sum((layout[i + 1][1][k] - layout[i][1][k]) ** 2
                                 for k in range(3)))
            limit = 0.55 * (layout[i][2][2] + layout[i + 1][2][2])
            if dist >= limit:
                raise RuntimeError('bead gap: beads %d/%d centre distance '
                                   '%.3f >= 0.55 * span radii sum %.3f'
                                   % (i, i + 1, dist, limit))
        return built

    out.append(('anatomy.swept_span bead-overlap', span_bead_overlap))

    def crease_self_trim(p, g, hm, gm, d):
        # The run extends past BOTH loft ends (-4..4): it must self-trim via
        # the surf callback returning 0.0, not raise, and emit no more
        # objects than the in-loft run plus the pitch-phase allowance.
        built = an.fold_crease(p, 'fold-t', hm, -6.0, 6.0, 0.20,
                               SURF_FLANK, detail=d)
        scratch = []
        inner = an.fold_crease(scratch, 'fold-i', hm, -4.0, 4.0, 0.20,
                               SURF_FLANK, detail=d)
        if len(built) > len(inner) + 2:
            raise RuntimeError('run did not self-trim past the loft: '
                               'extended run emitted %d objects, in-loft run %d'
                               % (len(built), len(inner)))
        return built

    out.append(('anatomy.fold_crease', lambda p, g, hm, gm, d: an.fold_crease(
        p, 'fold', hm, -2.5, 2.5, 0.20, SURF_FLANK, detail=d)))
    out.append(('anatomy.fold_crease self-trim', crease_self_trim))
    out.append(('anatomy.healed_scar', lambda p, g, hm, gm, d: an.healed_scar(
        p, 'scar', hm,
        [(0.30, sf.top_y(STATIONS, z, 0.30) - 0.10, z)
         for z in (-1.0, 0.0, 1.0, 2.0)], detail=d)))

    # ---- organs.py --------------------------------------------------------
    out.append(('organs.sensory_crown', lambda p, g, hm, gm, d: og.sensory_crown(
        p, g, 'crown', hm, gm, (0.0, 0.05, -3.4), detail=d)))
    vent_pts = [(0.0, sf.top_y(STATIONS, z, 0.0), z)
                for z in (-1.0, -0.1, 0.8, 1.7)]
    out.append(('organs.breathing_vents', lambda p, g, hm, gm, d: og.breathing_vents(
        p, g, 'vent', hm, gm, vent_pts[0], face='y', detail=d,
        points=vent_pts)))
    out.append(('organs.grasping_fins', lambda p, g, hm, gm, d: og.grasping_fins(
        p, 'grasp', hm,
        (flank_anchor(0.5, -0.30, inset=0.40), -0.30, 0.5),
        [(flank_anchor(0.5, -0.30) + 1.2, -0.75, -0.1),
         (flank_anchor(0.5, -0.30) + 1.4, -0.85, 0.5),
         (flank_anchor(0.5, -0.30) + 1.2, -0.75, 1.1)], detail=d)))
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
        # One extra in-range station costs up to five objects at detail 3
        # (ridge segment, nodule, frond, tip, bud), so the pitch-phase
        # allowance is six — the failure this guards is a run of parts
        # sailing PAST the taper, not one phase-shifted nodule.
        if len(built) > len(inner) + 6:
            raise RuntimeError('run did not self-trim past the loft: '
                               'extended run emitted %d objects, in-loft run %d'
                               % (len(built), len(inner)))
        return built

    out.append(('organs.garden_fold', lambda p, g, hm, gm, d: og.garden_fold(
        p, g, 'garden', hm, gm, -3.0, 3.0, SURF_TOP, detail=d)))
    out.append(('organs.garden_fold self-trim', garden_self_trim))
    return out


def main():
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
        print('BEAUTIFUL PART PROBE: %d PROBLEM(S)' % len(failures))
        for line in failures:
            print('  - ' + line)
        sys.exit(1)
    print('BEAUTIFUL PART PROBE: ALL CONSTRUCTS CLEAN')


if __name__ == '__main__':
    main()
