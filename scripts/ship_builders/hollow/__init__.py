"""Hollow Reach (the last watch) pilot ship builders.

There is NO concept-art plate. Do not invent a Banner look.

Bible docs/FactionShipDesignBible.md §5.2: "sealed and shuttered hulls,
dusk-mauve and dark metal, wrap panels, long listening masts, dish ears,
minimal dim lighting, and patient station-keeping. Treat this as deep-rim
regional equipment, not a formal nation or secret villain fleet."

docs/FactionVisualUpdatePlan.md: "the shrouded. A sealed, shuttered hull
under wrap panels, long listening masts and dish ears standing clear of
the mass, very few lights and those dim. `trim` is the dominant plate
colour: the dark pair alone has no value contrast in a band-3 sun (the
wave-46 hollow lesson)."

src/game/faction-style.js hollow: hull #4a4054, hullDark #2c2634,
trim #8a7c96, accent #7a6a8a, glow #b09ac0.

Existing skin scripts/ship_skins/hollow.py: base #4a4054, panel #7a6a8a
(wrap), accent #5a6878 (dish), emissive #b09ac0, pattern shutter. Keep
name substrings wrap-panel and listening-dish.

Construction logic (assigned; synthesis/21 §G6 has no Hollow row):
CLOSED SHELL, SHUTTERED / SHROUDED. A sealed watch-hull wears wrap
panels and shutter banks. Joints are shutter seams and wrap straps.
Listening masts and dish ears stand CLEAR of the mass.

Refuse: open trusses, salvage booms, ISO crate racks, owner-modules,
ritual cans, radial fans, grown body, field lace, Lamplighter gate-arms,
Freehold homestead plates, visible windows as a habit.

Silhouette family (rule 6): sealed oblong watch-hull + bilateral wrap
panels + outboard listening masts/dish ears. Hold this family for
future classes.

Three zones (rule 1): bow shuttered sensor face / mid sealed hold + wrap
/ stern quiet drive. Visible shutter seams or wrap straps between zones.
No plate course crosses a zone boundary.

§G2 outline-breaker (≥ 15 % of hull length): the LISTENING MAST (with a
dish ear at the tip). Grow mast HEIGHT / boom reach with class later.
NEVER inflate dish diameter as the primary scale. Default
LISTENING_MAST_LEN is 2.40 ≥ 15 % of cutter length 11.0 = 1.65.

Emissive ≤ 5 %: one dim buried command lantern, one small drive glow
(driver still appends engine glow), almost no windows. Never edge-light
panels. Use HUMAN.lampGap 1.20.

Detail in one band (rule 2): sensor / shutter band. 55–80 % of hull
stays calm sealed metal.

Accent 3–8 % of area in ONE shape family (rule 8): the dish-ear face
(desaturated blue). accent_density MUST be 1.0.

Wave-46 lesson is binding: wrap/trim plates MUST carry the value
contrast. Do not ship a fleet that is only dark hull + dark hullDark.

Layout
------
surface.py    shared hull-surface queries, the absolute human + Hollow
              module, and the surf_* callback factories. No geometry,
              no ship_kit. Importable by plain CPython.
shroud.py     Hollow surface language — wrap panels, shutter banks,
              wrap straps, listening dishes, listening masts, shutter
              seams. Builds through ship_kit only. No hull queries.
hardware.py   Hollow equipment — buried lantern, docking collar, quiet
              drive face, flat radiators, passive arrays, sensor roots,
              fuel bladders, shielded holds. Builds through ship_kit
              only. No hull queries.
<class>.py    one file per class once authored. NOT present in this
              foundation wave.

Skin
----
Roles carry the paint (ship_skins/hollow.py, paint_parts_vc):
    ROLE_HULL    sealed dusk metal                             #4a4054
    ROLE_ARMOUR  wrap panels (panel / dusk-mauve)              #7a6a8a
    ROLE_ACCENT  dish-ear face (desaturated blue)              #5a6878
    ROLE_RECESS  shutter throats, collar bore
    ROLE_TRIM    wrap straps, seams, mast shafts               trim
    glow         dim mauve lantern / drive disc                #b09ac0
accent_density is 1.0: dish coverage is controlled with geometry
count (3–8 % of area, one shape family), never by random thinning.

Shared constructs are smoke-probed by scripts/probe-hollow-parts.py.

LOD rules
---------
detail=3  full build
detail=2  half the repeats
detail=1  primary masses only
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

    The class modules are imported lazily so this package imports
    cleanly while the class files are absent (this foundation wave).
    Missing class files no-op instead of raising.
    """
    if key not in PILOT_CLASSES:
        return
    try:
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
    except ImportError:
        return
