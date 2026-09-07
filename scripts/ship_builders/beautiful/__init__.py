"""Beautiful Ones production ship builders.

Bible §4.6: living kin, not organic machines. One tissue lineage, varied
marine body plans. No panels, windows, nozzles, turrets or box-like plating.

Approved production sculpts:
    light     Glassfin — compressed pelagic ribbonfish, dorsal ribbon,
              forked tail, small pectorals; no insect-like anatomy.
    ace       Needlewake — reef squid, mantle fins, eight curved arms
              and two longer sensory streamers.
    cutter    Blue Pilgrim — flattened sea slug, three bilateral cerata
              tiers, forward guardian cradle and soft ventral pouch.
    heavy     Velvet Bastion — broad cuttlefish mantle, muscular dorsal
              swells, continuous fin skirt and folded arm crown.
    frigate   Cathedral — scalloped jellyfish bell, sanctuary core,
              luminous canals, frilled oral arms and trailing tentacles.
    freighter Orchard — reef-bearing leviathan, three grown garden
              basins, mature fan/coral canopy and sheltering flank folds.

The review equations live in reviews/beautiful-ones/{small,large}-ships.js.
Each production sculpt preserves its anatomy and proportions through one
uniform fit to the class length. The player hull remains separate.

Layout
------
surface.py    hull-surface queries, living-scale constants, grown_loft,
              and sampled sculpt surfaces/curves with authored pigments.
anatomy.py    shared marine anatomy primitives for component authoring.
organs.py     sensory crowns, sanctuaries, nurseries and garden organs.
<class>.py    one file per class; each owns its reviewed sculpt equations.

Skin
----
paint_parts_vc preserves authored Col on all six production sculpts.
src/systems/ship-assets.js supplies map-free physical tissue and
vertex-tinted photophore emission. Do not obscure those pigments with
the old faction atlas or full-body vein map. Cathedral's joined hull
uses a transmitting membrane profile for its bell and sanctuary;
the other five classes share the opaque tissue profile.

The driver glow sits at z = +l*0.47. add_idle animates a slow breathing
scale; the sculpt fit centres the full authored envelope.
Proportions are checked by scripts/measure-ships.mjs.
Shared constructs are smoke-probed by scripts/probe-beautiful-parts.py.

LOD rules
---------
detail=3  near-review tessellation within the delivery triangle budget.
detail=2  reduced sampling; preserve all silhouette-defining anatomy.
detail=1  coarse sampling; preserve the body plan and defining organs.
detail=0  silhouette-preserving floors and reduced decorative repeats.
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
