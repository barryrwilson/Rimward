"""Assembly pilot ship builders.

Bible §4.8: "inheritance copied until it became civilization … repeated
probe modules on charcoal structural spines". Construction logic from the
reference corpus (SpaceShipIdeas/synthesis/20 §5, 21 §G2/§G6): REPEATED
MODULE. One part, many copies, radial and linear arrays, visible joints.
Variation is systematic copy-drift, not human patchwork.

The Assembly is a SPINE WITH RADIAL FANS. It refuses Veridian's stepped
slab, Ferrous's segmented cigar, Freehold's empty truss gap, Ledger salvage
booms, the Gilded lapped leaf, Beautiful grown flesh, and Unknowables lace.
The silhouette family is SPINE-AND-PODS / cruciform fans, held across all
six classes. The outline-breaker (§G2, ≥ 15 % of hull length) is the
RADIAL MODULE FAN — keep and enlarge versus the plate's timid fans.

The 08-assembly-ship.png plate is CONCEPT ART, not a model to reproduce:
a long charcoal structural spine of repeating cylindrical bays with visible
joints; weathered off-white shell modules clamped onto the spine (not a
smooth closed hull); faded orange replacement panels as BLOCK accents
(one shape family, 3–8 % of area); teal circular optics; a dorsal petal-fan
near the bow and a stern radial fan; an antenna forest on the mid spine;
many small daughter probes; a fabrication iris in a dark nose collar.

Layout
------
surface.py    shared hull-surface queries, the absolute human + Assembly
              module, and the ``surf_*`` callback factories. No geometry,
              no ship_kit. Importable by plain CPython.
lineage.py    the Assembly surface language — spine bays, clamped shells,
              visible joint rings, orange replacement patches, radial fans,
              copy-drift. Builds through ship_kit only. No hull queries.
hardware.py   the Assembly equipment — teal optics, instrument petals,
              daughter probes, fabrication sockets, antenna forests, the
              countable drive face, flat radiators, docking collars.
              Builds through ship_kit only. No hull queries.
<class>.py    one file per class once authored; each owns its station list
              and its body plan. Not present in this foundation wave.

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
