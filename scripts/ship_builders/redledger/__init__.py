"""Red Ledger pilot ship builders.

Bible §4.4: "violence with terms and receipts … captured hardware reorganized
into a deliberate predatory machine". Construction logic from the reference
corpus (SpaceShipIdeas/synthesis/20 §5, 21 G2/G3/G5): WELDED CAPTURED SECTIONS.
Mismatched hull sections are butt-welded into one predatory machine — every zone
seam carries a raised weld bead or a capture collar, adjacent sections read as
different captures, grasping and boarding hardware leads the ship, and
disciplined dried-red tally bands unify the mismatch.

The Ledger is CLOSED and armoured. It refuses Freehold's open exposed frame, it
refuses the Combine's instrument spars, and it refuses the anarchic scrap heap:
asymmetry reveals captured components, it never reads as damage or neglect.

Layout
------
surface.py    shared hull-surface queries and the fleet human module (no
              geometry, no ship_kit).
hardware.py   the Ledger equipment language — weld beads, capture collars,
              tally bands, grapple arms, breach tubes, shutter wells, ransom
              vaults, counting houses, transfer locks, captured drives, reverse
              blocks, ram prows, lamp runs and radiators. Never queries the
              hull; the class file computes the anchor and passes it in.
<class>.py    one file per class; each owns its station list and its body plan.

Skin
----
Roles carry the paint, so the faction palette does the painting
(ship_skins/redledger.py, paint_parts_vc):
    ROLE_HULL    dark iron captured plate                #242226
    ROLE_ARMOUR  tarnished-copper mechanism and adapter   #7B5C3A
    ROLE_ACCENT  dried-red tally strokes and the spike     #8C2E22, thinned to
                 30 % by accent_density — a tally band is a mark, not a stripe
    ROLE_TRIM    deck plating, rails, lamp strips          copper × 1.12
    ROLE_RECESS  seams, shutter wells                      iron × 0.62
Emissive is amber work light only: windows, work lamps, status slits, drive
glow. Never decorative, never edge-lit, ≤ 5 % of hull area.

Proportions are checked by scripts/measure-ships.mjs, not asserted here.

LOD rules
---------
detail=3  full build
detail=2  fewer repeats (half the greeble fields, thinned window and lamp runs)
detail=1  primary masses, seams, drives and plate courses only
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
