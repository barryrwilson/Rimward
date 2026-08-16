"""Congregation of the Further Shore pilot ship builders.

Bible §4.9: "pilgrimage aimed outward". Construction logic from the
reference corpus (SpaceShipIdeas/synthesis/20 §5, 21 §G2/§G6): REPEATED
MODULE, ritual. One part, many copies. Signature: stacked reliquary cans;
a procession of identical shrines along a spine. A bigger ship carries
MORE cans / MORE ribs / MORE sail vanes, never bigger modules.

The Congregation is a CIGAR / ribbed cylindrical DRUM SPINE. It refuses
Assembly radial fans, Unknowables lace, Beautiful Ones grown flesh,
Freehold empty trusses, Ledger salvage booms, gold excess, and fantasy
churches pasted on hulls. No crosses or real-world religious symbols.
The silhouette family is CIGAR / drum spine, held across all six future
classes. Secondary family: folded triangular sail vanes. The
outline-breaker (§G2, ≥ 15 % of hull length) is the FOLDED SAIL VANE
set — rigid panels with a visible mast/boom and a membrane (thickness
≥ 0.08), never cloth and never a Freehold truss gap.

The 09-congregation-further-shore-ship.png plate is CONCEPT ART, not a
model to reproduce: midnight-blue plated drum; weathered silver rib
rings; a faceted geodesic observation nave (triangulated glass over a
warm interior) as the strong FORWARD AXIS toward the Rim; tall folded
sail vanes in a dorsal cluster plus at least one ventral vane;
underslung stowed-shelter canvas on the mid ventral; candle-amber
guidance lamps and nave interior; restrained violet Wakeglass as a few
small optics.

Layout
------
surface.py    shared hull-surface queries, the absolute human +
              Congregation module, and the ``surf_*`` callback factories.
              No geometry, no ship_kit. Importable by plain CPython.
ritual.py     the Congregation surface language — rib rings, shrine cans,
              shrine processions, drum bays, folded sail vanes, canvas
              drapes, nave glass cages. Builds through ship_kit only.
              No hull queries.
hardware.py   the Congregation equipment — observation nave, candle lamps,
              Wakeglass optic frames, archive boxes, receiving/rescue
              locks, the countable drive face, flat radiators, docking
              collars. Builds through ship_kit only. No hull queries.
<class>.py    one file per class once authored; each owns its station list
              and its body plan. NOT present in this foundation wave.

Skin
----
Roles carry the paint (ship_skins/congregation.py, paint_parts_vc):
    ROLE_HULL    midnight-blue plated drum                     #17263E
    ROLE_ARMOUR  weathered silver ribs / nave frames / shells  #AEB4B9
    ROLE_ACCENT  candle-amber plaques and lamp housings        #CD9A4B
    ROLE_RECESS  throats, wells
    ROLE_TRIM    booms, thin edges, optic frames
    glow         candle-amber nave, lamps, drive discs         #D8A25A
accent_density is 1.0: amber coverage is controlled with geometry count
(3–8 % of area), never by random thinning. Emissive ≤ 5 %: nave interior,
one window band, a few lamps, drive glow. Never edge-light panels.
Violet Wakeglass is restrained ROLE_TRIM frames / ROLE_ARMOUR panes.

Proportions: length-leads-beam 1.15, height/length ≤ 0.60, beam/length
≥ 0.16. Congregation has no FACTION_PROPORTION_RELIEF.
Shared constructs are smoke-probed by scripts/probe-congregation-parts.py.

LOD rules
---------
detail=3  full build
detail=2  half the repeats
detail=1  primary masses only (drum, nave, sail hub, drive housing)
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
    while the class files are absent (this foundation wave).
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
