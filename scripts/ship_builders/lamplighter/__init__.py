"""Lamplighter Guild pilot ship builders.

Bible §4.10: "the network stays alive because workers do". Construction
logic from the reference corpus (SpaceShipIdeas/synthesis/20 §5, 21
§G2/§G6): EXPOSED FRAME, utility. Signature: gantries, cable runs, work
lights, clamp arms. A bigger ship carries MORE bays / MORE reels / MORE
lamps, never bigger modules. Grow the §G2 gate-arm fork with arm length,
never by inflating a shoulder hub (Wave 11 lesson).

The Lamplighter Guild is a BLOCKY SERVICE WORKBOAT / OPEN TRUSS. It
refuses a closed plated drum, Assembly radial fans, Congregation ritual
cans and sails, Freehold mismatched homestead plates, Ledger salvage,
Beautiful flesh, and Unknowables lace. No sleek racing shells, no
ornamental steampunk brass, no weapon-first silhouette, no inaccessible
surface detail, and no single giant wrench.

The silhouette family is blocky service workboat / open truss, held
across all six future classes. Three visible thrust zones (rule 1): bow
tools/collar, mid workshop + open frame, stern tug engines. Visible
seams or truss gaps between zones. The outline-breaker (§G2, ≥ 15 % of
hull length) is the GATE-ARM FORK — two articulated clamp arms that
fork toward a gate ring. Arms are structural (thickness that survives
the 0.06 island voxel), not wire.

The 10-lamplighter-guild-ship.png plate is CONCEPT ART, not a model to
reproduce: soot-dark service frame; weathered utility-yellow access
modules; cobalt diagnostic interiors and panels; warm work lamps;
exposed gantries, cable drums and clamp arms reaching a ring.

Layout
------
surface.py    shared hull-surface queries, the absolute human +
              Lamplighter module, and the ``surf_*`` callback factories.
              No geometry, no ship_kit. Importable by plain CPython.
service.py    the Guild surface language — truss bays, gantries, cable
              runs, cable reels, clamp arms, the gate-arm fork, utility
              modules, access handrails. Builds through ship_kit only.
              No hull queries.
hardware.py   the Guild equipment — work lamps, lamp bars, relay masts,
              diagnostic panels, docking collar, the countable drive
              face, flat radiators, tool pods / carousel, beacon rack,
              workshop volume. Builds through ship_kit only. No hull
              queries.
<class>.py    one file per class once authored; each owns its station
              list and its body plan. NOT present in this foundation wave.

Skin
----
Roles carry the paint (ship_skins/lamplighter.py, paint_parts_vc):
    ROLE_HULL    soot-dark frames                              #24211c
    ROLE_ARMOUR  cobalt diagnostic interiors / panels          #5a8ae0
    ROLE_ACCENT  weathered utility-yellow access modules       #d8a83a
    ROLE_RECESS  throats, wells, hatches
    ROLE_TRIM    rails, cables, thin edges
    glow         warm work lamps, drive discs                  #ffc06a
accent_density is 1.0: yellow coverage is controlled with geometry
count, never by random thinning. Emissive ≤ 5 %: drive glow, one
window/bay-light band, a small number of work lamps. Never edge-light
panels. Use HUMAN.lampGap (1.20), never pack lamps edge-to-edge.

Every part must look maintainable in a pressure suit. Handrails, clamp
points and access routes are primary features. Floodlights and
diagnostic panels are the equivalent of other factions' weapon mounts.
Detail belongs in one service band (20–30 % of length or one flank).

Class read will come later from anatomy (skiff / runner / tender / tug /
depot / yard). Foundation only supplies the MODULES.

Shared constructs are smoke-probed by scripts/probe-lamplighter-parts.py.

LOD rules
---------
detail=3  full build
detail=2  half the repeats
detail=1  primary masses only (truss, arm chain, module box, drive housing)
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
