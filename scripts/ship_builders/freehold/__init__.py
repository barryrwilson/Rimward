"""Freehold Compact pilot ship builders.

Bible §4.3: "a home that happens to fly … maintained by neighbours, repaired for
decades, useful before beautiful". Construction logic from the reference corpus
(SpaceShipIdeas/synthesis/20 §5, 21 G6): EXPOSED FRAME — open trusses between
two solid volumes, mismatched plate colours. The Compact refuses the closed
shell, the repeated module and the grown body.

Layout
------
surface.py   the shared hull-surface queries and the fleet human module.
<class>.py   one file per class; each owns its station list and its body plan.

Skin
----
Roles carry the patchwork, so the faction palette does the painting
(ship_skins/freehold.py, paint_parts_vc):
    ROLE_HULL    barn-red-brown original hull          #6A3B33
    ROLE_ARMOUR  donated sections and plate courses     #B8AC91 weathered cream
    ROLE_ACCENT  replaced panels and clamp-on lockers   #638092 faded blue,
                 thinned to 32 % by accent_density so two thirds stay brown —
                 the mismatch IS the history, not a uniform blue stripe.
    ROLE_TRIM    deck plating, rails, frames            cream × 1.12
    ROLE_RECESS  seams                                  base × 0.62
Emissive stays warm amber and small: windows, floods, nav markers, drive glow.

Proportions are checked by scripts/measure-ships.mjs, not asserted here.

LOD rules
---------
detail=3  full build
detail=2  no greeble fields, fewer window panes
detail=1  primary masses, frame, drives and plate courses only
"""
from .ace import build_ace
from .cutter import build_cutter
from .freighter import build_freighter
from .frigate import build_frigate
from .heavy import build_heavy
from .light import build_light

PILOT_CLASSES = ('light', 'ace', 'cutter', 'heavy', 'frigate', 'freighter')


def build(parts, glow, key, l, b, h, hull_mat, glow_mat, detail):
    """Dispatch to the per-class builder.

    parts / glow -- object lists the caller joins into RIMWARD_HULL and
                    RIMWARD_EMISSIVE.
    key          -- class key; only PILOT_CLASSES are handled here.
    l, b, h      -- class length, beam and height from CLASSES.
    detail       -- 3 (lod0) … 0 (lod3).
    """
    if key == 'light':
        build_light(parts, glow, l, b, h, hull_mat, glow_mat, detail)
    elif key == 'ace':
        build_ace(parts, glow, l, b, h, hull_mat, glow_mat, detail)
    elif key == 'cutter':
        build_cutter(parts, glow, l, b, h, hull_mat, glow_mat, detail)
    elif key == 'heavy':
        build_heavy(parts, glow, l, b, h, hull_mat, glow_mat, detail)
    elif key == 'frigate':
        build_frigate(parts, glow, l, b, h, hull_mat, glow_mat, detail)
    elif key == 'freighter':
        build_freighter(parts, glow, l, b, h, hull_mat, glow_mat, detail)
