"""Assembly pilot ship builders (2026-09 redesign, owner-approved).

Bible §4.8: the Assembly descends from ONE ancient human survey probe,
copied for ten thousand generations. A survey probe is an instrument
bus, a high-gain dish that points home, long booms and a power source;
the fleet grew from those four parts. Construction logic (synthesis/20
§5, 21 §G6): REPEATED MODULE — one part, many copies, linear arrays,
visible joints. Variation is systematic copy-drift (facet count 9/10/11,
plate step), never human patchwork.

Silhouette family, held across all six classes: SURVEY HEAD + CAN SPINE +
REPORT DISH. The §G2 outline-breaker is the annular REPORT DISH at the
stern (about 0.5 l across); the countable drive fires through its hole.
It refuses Veridian's stepped slab, Ferrous's segmented cigar, Freehold's
empty truss gap, Ledger salvage booms, the Gilded lapped leaf, Beautiful
grown flesh, Unknowables lace and Congregation's tight reliquary stack
(Assembly cans sit apart on a visible spine, and the dish is the tell).

Concept sheet: docs/FactionExamples/08-assembly-ship-concept-2026-09.png
(owner-approved: hero frigate, aft view, module callout, fleet line-up). The old 08-assembly-ship.png plate
is superseded for ships; its palette (off-white, charcoal, faded orange,
teal) is unchanged.

Layout
------
surface.py    shared hull-surface queries, the absolute human + Assembly
              module, and the ``surf_*`` callback factories. No geometry,
              no ship_kit. Importable by plain CPython.
lineage.py    the Assembly surface language — the BUS CAN (drum, end
              joints, edge seams, stepped shell plates, orange facet,
              registry band), spine bar, THE ANCIENT CORE, copy-drift.
              Builds through ship_kit only. No hull queries.
hardware.py   the Assembly equipment — teal optics, instrument petals,
              fabrication sockets, antenna forests, the REPORT DISH,
              stern_cluster (housing + neck + dish + countable nozzles),
              survey booms, radiator sets, manipulator arms, cradles and
              the nested daughter_craft. Builds through ship_kit only.
<class>.py    one file per class; each owns its body plan (can pitch,
              dish radius, what rides which can).

Skin
----
Roles carry the paint (ship_skins/assembly.py, paint_parts_vc):
    ROLE_HULL    charcoal spine / structure                 #3A3C3E
    ROLE_ARMOUR  weathered off-white shell modules          #B8B4A8
    ROLE_ACCENT  faded orange replacement panels            #B8763C
    ROLE_RECESS  joints, aperture wells
    ROLE_TRIM    antenna stems, thin mechanical edges
    glow         teal optics and drive glow only            #4FAEAE
accent_density is 1.0: orange coverage is controlled with geometry count,
never by random thinning. Emissive ≤ 5 %: teal irises, a few marker
points, drive glow. Never edge-light panels.

Proportions: length-leads-beam 1.15, height/length ≤ 0.60, beam/length
≥ 0.16. Assembly has no FACTION_PROPORTION_RELIEF.
Shared constructs are smoke-probed by scripts/probe-assembly-parts.py.

LOD rules
---------
detail=3  full build
detail=2  half the repeats
detail=1  primary masses only (spine, hub, drive housing, daughter body)
detail=0  coarsest masses only (freighter lod3)
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
