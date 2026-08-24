"""Beautiful Ones pilot ship builders.

Bible §4.6: living kin, not organic machines. One tissue lineage, four
body plans. No panels, no windows, no nozzles, no turrets, no kit.box
faces that read as plating.

Body plans (class mapping for later workers — this package does not
sculpt the classes):

    SHARK     fusiform, heterocercal caudal, triangular dorsal,
              gill slits, pectorals.
              light    -> young reef shark
              cutter   -> thresher or hammerhead (must not be a scaled light)

    SQUID     mantle, rear rhomboid fins, 8 arms + 2 feeding tentacles,
              siphon.
              ace      -> hunting squid

    OCTOPUS   bulbous mantle, 8 muscular arms, interbrachial web.
              TRAVEL POSE: mantle toward -Z, arms trail toward +Z.
              Never a radial sunburst (that kills travel-direction gates).
              frigate  -> travel-pose octopus (web sanctuaries)

    WHALE     cetacean fusiform, HORIZONTAL fluke, blowhole / grown vents.
              heavy    -> humpback (long pectorals, dense chest)
              freighter-> blue-whale gardenback (extreme length, tiny
                          pectorals, dorsal gardens)

Tissue language is shared: pearl-bone dorsal, violet-indigo flanks,
cyan-violet veins, sensory crown, healed scars, breath. Class read comes
from anatomy, never from equipment. The driver glow sphere sits at
z = +l*0.47; bodies taper so the glow reads as wake. add_idle animates a
slow breathing scale; keep the pivot at the body's centre of mass.

Layout
------
surface.py    hull-surface queries, absolute living-scale constants,
              surf_* factories, grown_loft (true-ellipse body sweep).
              No geometry except grown_loft. No ship_kit.
anatomy.py    four-plan primitives: tissue, shark, squid, octopus, whale.
              Geometry through kit.* and grown lofts. Anchors via surf
              callbacks or explicit points; never a typed y fraction.
organs.py     sensory crown, breath, belly cradle, sanctuary / nursery
              hollows, companion craft, garden folds, dorsal mantles.
              Organs never query the hull; the class file passes anchors.
<class>.py    one file per class; each owns its station list and body plan.

Skin
----
paint_parts_vc honours the kit role tag first and falls back to the skin's
name selectors, so every construct keeps the two in agreement
(ship_skins/beautiful.py):
    ROLE_HULL    base indigo living tissue                       #6B617B
    ROLE_ARMOUR  pearl membrane: body masses 'living-body-…',
                 fins 'fin-…', lips 'living-lip-…'               #B0A8BE
    ROLE_ACCENT  violet nerve anatomy 'nerve-…' and crown
                 'sensory-crown-…'                               #7850D4
    ROLE_TRIM    bright pearl flow lines, welts, lip folds       pearl x1.12
    ROLE_RECESS  dark crease floors, hollow wells, vent bowls    base x0.62
Emissive is cyan bioluminescence (#69D8E2) only: vein lattice, crown
tips, vent and hollow breath — thin, in the creases, never on the calm
pearl back, capped far below 5 % of hull area. accent_density is 1.0:
accent coverage is geometry, never random thinning (pipeline §6).

Proportions are checked by scripts/measure-ships.mjs, not asserted here.
Shared constructs are smoke-probed by scripts/probe-beautiful-parts.py.

LOD rules
---------
detail=3  full build (filaments, branches, suckers, flow lines)
detail=2  fewer repeats
detail=1  primary masses plus a hint of each organ
detail=0  primary masses only
"""

PILOT_CLASSES = ('light', 'ace', 'cutter', 'heavy', 'frigate', 'freighter')


def build(parts, glow, key, l, b, h, hull_mat, glow_mat, detail):
    """Dispatch to the per-class builder.

    parts / glow -- object lists the caller joins into RIMWARD_HULL and
                    RIMWARD_EMISSIVE.
    key          -- class key; only PILOT_CLASSES are handled here.
    l, b, h      -- class length, beam and height from CLASSES.
    detail       -- 3 (lod0) … 0 (lod3).

    Class modules import lazily so this package imports cleanly before
    all six class files have landed.
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
