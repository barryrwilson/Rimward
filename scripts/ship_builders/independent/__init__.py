"""Independent (Drifters) pilot ship builders.

Bible §5.1: "every ship has a previous life". Commercially available
frames, secondhand modules, practical field repairs, neutral grays,
occasional old-looking commercial parts (NOT captured other-faction
signatures), warm universal navigation lights. Independent does NOT
mean random junk.

docs/FactionVisualUpdatePlan.md: "the lash-up. No two plates from the
same yard: donated hull sections bolted over a working frame, external
cargo netted down, patch welds, a single amber lamp run. Grey value
contrast comes from the weathering ladder, not from colour."

Construction logic (assigned; synthesis/21 §G6 has no Independent row):
REPEATED COMMERCIAL MODULE / LASH-UP. A civilian chassis or tug core
receives bolted secondhand modules and standardized ISO crates. Joints,
patch plates and clamp straps are the surface language. Refuse: closed
ornamental shell, grown body, field lace, ritual cans, identical radial
fans, salvage-boom captured Banner parts, Lamplighter gate-arms,
Freehold homestead trusses.

Silhouette family (rule 6): spine-and-pods, held across all six future
classes. Three visible thrust zones (rule 1): bow civilian cabin, mid
crate+module rack, stern tug drive. Visible seams or straps between
zones. The outline-breaker (§G2, ≥ 15 % of hull length) is the
STANDARDIZED CRATE RACK (and/or one bolted secondhand owner-module).
Grow rack LENGTH with class; NEVER inflate crate size (HUMAN.crateS =
0.85). Default rack length is 1.80 ≥ 15 % of cutter l 11.0.

There is NO concept-art plate for Independent. Do not invent a banner
look.

Layout
------
surface.py    shared hull-surface queries, the absolute human +
              Independent module, and the ``surf_*`` callback factories.
              No geometry, no ship_kit. Importable by plain CPython.
surplus.py    the Independent surface language — patch plates, field
              welds, strap clamps, ISO crates, the crate rack, the
              owner-module, cargo nets, civilian cabins, zone straps.
              Builds through ship_kit only. No hull queries.
hardware.py   the Independent equipment — nav lamps, lamp runs, docking
              collar, the countable drive face, flat radiators, mission
              pods, container clamp pairs, tug core. Builds through
              ship_kit only. No hull queries.
<class>.py    one file per class once authored; each owns its station
              list and its body plan. NOT present in this foundation wave.

Skin
----
Roles carry the paint (ship_skins/independent.py, paint_parts_vc):
    ROLE_HULL    commercial gray chassis                       #6a7076
    ROLE_ARMOUR  charcoal secondhand plates / crates           #3a3f45
    ROLE_ACCENT  slate-blue owner mark / one owner-module      #9aa7b8
    ROLE_RECESS  throats, hatches, dark ports
    ROLE_TRIM    straps, rails, thin edges
    glow         warm amber nav lamps, drive discs             #ffa54a
accent_density is 1.0: owner-mark coverage is controlled with geometry
count (3–8 % of area, one shape family), never by random thinning.
Emissive ≤ 5 %: one drive glow, one small window/port band, a few
nav/hazard points. Never edge-light panels. Use HUMAN.lampGap (1.20).

Class read will come later from anatomy (shuttle / hot-rod / tug /
escort / consortium / hauler). Foundation only supplies the MODULES.

Shared constructs are smoke-probed by scripts/probe-independent-parts.py.

LOD rules
---------
detail=3  full build
detail=2  half the repeats
detail=1  primary masses only (cabin, rack frame, tug core, drive housing)
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
