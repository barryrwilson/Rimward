"""Beautiful Ones pilot ship builders.

Bible §4.6: "living kin, not organic machines … majestic animal intelligence,
tenderness, breath, and self-directed motion". Construction logic from the
reference corpus (SpaceShipIdeas/synthesis/21 §G2/§G6, pipeline §8): GROWN
BODY. One continuous swollen mass, thickest just aft of the head, drawn into
a long tapering tail. No panel lines, no plates, no courses, no seams, no
collars, no rivets, no kitbash — every previous faction's surface language
is kitbashing here, and this faction refuses all of it.

The silhouette family is MANTA / LENS with long trailing fin tips, held
across all six classes; the Player ship (spanX 6.6 vs spanZ 4.2) is the
direct anatomy reference, and FACTION_PROPORTION_RELIEF.beautiful
(minLengthOverBeam 0.55, minBeamOverLength 0.35) lets the fleet be wider
than it is long. The outline-breaker (§G2, far more than 15 % of hull
length) is the FIN SET: a broad forward wing pair sweeping back past the
body, then second and third smaller pairs — thin membranes, edge-thinned,
carrying spanwise flow lines. The class read comes from ANATOMY — head and
fin shape, body stage, scar history — never from equipment: no engine
nozzles, no windows, no armour, no turrets. The driver appends the
engine-glow sphere at the stern (z = +l*0.47), so the tail must taper until
the glow reads as the body's own wake. add_idle animates this faction with a
slow breathing scale; keep the pivot at the body's centre of mass.

Layout
------
surface.py    shared hull-surface queries, the absolute living module
              (crown filaments, vein pitch, breathing vents, the nursery
              hollow and the companion craft), and the ``surf_*`` / fin_ray
              callback factories. No geometry, no ship_kit.
anatomy.py    the surface language — flow lines, branching vein fans, fin
              membranes, fold creases, healed scars. Geometry only through
              kit.* primitives; anchors and surf callbacks, never typed y.
organs.py     the functional biology — sensory crown, breathing vents,
              grasping fins, belly chamber, sanctuary and nursery hollows
              with nested companion craft, garden folds. Organs never query
              the hull; the class file computes the anchor and passes it in.
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
Emissive is cyan bioluminescence (#69D8E2) only: the vein lattice in the
folds, crown tips, vent and hollow breath — thin, in the creases, never on
the calm pearl back, capped far below 5 % of hull area. The dorsal surface
is pearl-bone over violet-indigo flanks and the two meet in long gradual
FLOW LINES, never a bounded two-tone region. accent_density is 1.0: accent
coverage is controlled with geometry, never by random thinning (pipeline §6).

Proportions are checked by scripts/measure-ships.mjs, not asserted here.
Shared constructs are smoke-probed by scripts/probe-beautiful-parts.py.

LOD rules
---------
detail=3  full build (all filaments, branches, fronds, flow lines)
detail=2  fewer repeats (``n = 8 if detail >= 2 else 4`` on crowns and
          veins; creases and frond fields at wider pitch)
detail=1  primary masses plus a hint of each organ (crown of 4, one-vent
          rows, crease floors without lips)
detail=0  primary masses only: the grown loft, fin membranes, the pouch,
          hollow wells and companion bodies (freighter lod3)
"""

PILOT_CLASSES = ('light', 'ace', 'cutter', 'heavy', 'frigate', 'freighter')


def build(parts, glow, key, l, b, h, hull_mat, glow_mat, detail):
    """Dispatch to the per-class builder.

    parts / glow -- object lists the caller joins into RIMWARD_HULL and
                    RIMWARD_EMISSIVE.
    key          -- class key; only PILOT_CLASSES are handled here.
    l, b, h      -- class length, beam and height from CLASSES.
    detail       -- 3 (lod0) … 0 (lod3).

    The class modules are imported lazily so this package imports cleanly
    before all six class files have landed (foundation first: surface.py,
    anatomy.py and organs.py are smoke-probed before any class author is
    dispatched).
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
