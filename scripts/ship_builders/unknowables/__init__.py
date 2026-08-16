"""Unknowables pilot ship builders — EPHEMERAL field body.

OWNER RULES
1. Not a conventional ship: no plates, wings, cockpit, nozzles, windows,
   armour, transom.
2. Not hazy fog blobs. Do not build large soft smoke spheres or haze_lobe
   clouds. Those read as nebula, not the plate.
3. Ephemeral: filaments, lace, thin loops, cell knots. Structure is
   implied by threads and cells.
4. The pointed tip and the cell line are field geometry, not a metal prow
   and not a keel.

The plate (docs/FactionExamples/07-unknowables-ship.png) is lace, not fog
and not a hull: a long traveling field that tapers to a bright POINT in
the travel direction (right on the plate = engine nose −Z); a procession
of dark glossy ENERGY CELLS along the centreline (pearls of matter inside
the field); nested dark ORBITAL LOOPS wrapping the volume; thousands of
thin luminous FILAMENTS / threads (cyan aft, white-gold forward) that
form a wispy envelope; outer dark lensing arcs. Translucent, insubstantial,
threadlike. You can see through it.

Bible §4.7: a coherent traveling energy configuration. Avoid lightning
blobs, faces, and random particle noise.

Layout
------
surface.py    field-envelope queries and the absolute module (CELL_R,
              LOOP_MINOR, ARC_MINOR, FILAMENT_R, CELL_PITCH, TIP_LEN).
              Pure math. No geometry, no ship_kit, no bpy.
field.py      ephemeral language — filament_thread, filament_lace,
              orbital_loop, nested_loops, lensing_arc, field_tip.
              kit.* only. Never queries the envelope.
nodes.py      physical knots on the hull channel — energy_cell,
              cell_procession, sync_mote.
<class>.py    one file per class; each owns its station list and field plan.

Skin
----
paint_parts_vc honours the kit role tag first and falls back to the skin's
name selectors, so every construct keeps the two in agreement
(ship_skins/unknowables.py):
    ROLE_ARMOUR  dark glossy cells 'cell-…'                      #272436
    ROLE_ACCENT  white-gold motes 'mote-…'                       #EEE0A8
    ROLE_HULL    unused in the foundation (no plated body)
    glow         loops, lace, tip  obj['skin_role'] = 'glow'     #81DDF2
accent_density is 1.0: accent coverage is controlled with geometry, never
by random thinning.

Shared constructs are smoke-probed by scripts/probe-unknowables-parts.py.
"""

PILOT_CLASSES = ('light', 'ace', 'cutter', 'heavy', 'frigate', 'freighter')


def build(parts, glow, key, l, b, h, hull_mat, glow_mat, detail):
    """Dispatch to the per-class builder.

    parts / glow -- object lists the caller joins into RIMWARD_HULL and
                    the field/glow mesh (driver assigns RIMWARD_FIELD as
                    glow_mat; engine glow stays RIMWARD_EMISSIVE).
    key          -- class key; only PILOT_CLASSES are handled here.
    l, b, h      -- class length, beam and height from CLASSES.
    detail       -- 3 (lod0) … 0 (lod3).

    The class modules are imported lazily so this package imports cleanly
    if one class file is missing.
    """
    if key == 'light':
        from .light import build_light
        build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail)
    elif key == 'ace':
        from .ace import build_ace
        build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail)
    elif key == 'cutter':
        from .cutter import build_cutter
        build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail)
    elif key == 'heavy':
        from .heavy import build_heavy
        build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail)
    elif key == 'frigate':
        from .frigate import build_frigate
        build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail)
    elif key == 'freighter':
        from .freighter import build_freighter
        build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail)
