"""Gilded Chain pilot ship builders.

Bible §4.5: "immaculate procedure concealing horror … reptilian auction-house
elegance, sealed and controlled". Construction logic from the reference corpus
(SpaceShipIdeas/synthesis/20 §5, 21 §G2/§G6): CLOSED SHELL, ORNAMENT. One
continuous curve; edge-only precious trim; long thin light lines.

The Chain is SEALED. It refuses the Ledger's exposed frame and mismatched
salvage, it refuses the Freehold's open trusses, and it refuses visible
mechanism and dirt: every hull is one ordered lapped shell, every threat is a
closed hairline seam, and every light is seen from deep inside the hull. The
silhouette family is BLADE / CRESCENT / LEAF with a needle prow, held across all
six classes — the longest, lowest family in the fleet. The outline-breaker
(§G2, ≥ 15 % of hull length) is the SWEPT VENTRAL PYLON SET.

Layout
------
surface.py    shared hull-surface queries, the absolute human module, and the
              ``surf_*`` callback factories. No geometry, no ship_kit.
shell.py      the Chain's surface language — lapped scale courses, the dorsal
              scale field, the ivory margin run, hairline gold lines, gold
              collar bands, the deep recessed gallery slot, the flush aperture
              seam and the ivory edge keel.
hardware.py   the Chain's equipment — tractor lenses, capture collars, sealed
              transfer chambers, the observation rotunda, ventral pylons, the
              drive face, radiator vanes, mast clusters, marker runs, vault
              bodies and the nested miniature leaf craft. Never queries the
              hull; the class file computes the anchor and passes it in.
<class>.py    one file per class; each owns its station list and its body plan.

Skin
----
Roles carry the paint, so the faction palette does the painting
(ship_skins/gilded.py, paint_parts_vc):
    ROLE_HULL    near-black ceramic scale field          #191B1D
    ROLE_ARMOUR  ivory margins and leading edges         #DED6BC
    ROLE_ACCENT  old-gold HAIRLINE articulation          #C8A444 — edges, ribs
                 and collar rings only, ~0.022 units thick, never a face
    ROLE_TRIM    bright ivory lip strips and deck edging  ivory × 1.12
    ROLE_RECESS  seams, aperture strips, gallery wells    ceramic × 0.62
Emissive is cold turquoise gallery light only, seen through long slots and
apertures: never edge-lit, never laid on the surface, ≤ 5 % of hull area.

Proportions are checked by scripts/measure-ships.mjs, not asserted here.
Shared constructs are smoke-probed by scripts/probe-gilded-parts.py.

LOD rules
---------
detail=3  full build
detail=2  fewer repeats (half the scales, thinned pane and lamp runs)
detail=1  primary masses, courses, galleries and drives only
detail=0  primary masses only (freighter lod3)
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
