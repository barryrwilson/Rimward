"""Ferrous Hegemony pilot ship builders.

Bible docs/FactionShipDesignBible.md §4.2: "disciplined military mass,
exact symmetry, protected citizens behind a hard line." Fleet DNA:
blunt reinforced prows; layered citadel armor; paired and formally
aligned weapon housings; iron gray; restrained crimson recognition
bands; small brass service honors. Rescue capability should always be
present. Symmetry is part of doctrine.

Refuse: chaotic guns, exposed pirate machinery, flamboyant wings,
skull-like intimidation, or asymmetry without clear battle damage.

Construction logic (synthesis/21 §G6): REPEATED MODULE, ARMOURED.
20–40 armour ribs at even pitch; turret modules repeated on a rail.

Silhouette family (rule 6): segmented cigar / monumental iron wedge +
citadel. Hold this family for later classes.

Three zones (rule 1): bow 15–25 % / mid 45–60 % / stern 20–30 %.
No plate course crosses a zone boundary.

§G2 outline-breaker (≥ 15 % of hull length): the ARMOUR RIB FLARE.
Grow REACH with class later. NEVER inflate rib thickness as the
primary scale. Default RIB_FLARE_REACH is 1.80 ≥ 15 % of cutter
length 11.0 = 1.65.

Emissive ≤ 5 %: one drive glow, one window/slit band, a few marker
points. Never edge-light panels. Use HUMAN.lampGap 1.20.

Layout
------
surface.py    shared hull-surface queries, the absolute human + Ferrous
              module, and the surf_* callback factories. No geometry,
              no ship_kit. Importable by plain CPython.
armour.py     Ferrous surface language — rib flare, rib runs, citadel
              plates, chamfered armour courses. Builds through ship_kit
              only. No hull queries.
hardware.py   Ferrous equipment — turret rails, battery modules, rescue
              panniers and hatches, countable drive face, flat
              radiators, hangar berth, crimson prow band, brass honor
              plates, navigation lights. Builds through ship_kit only.
              No hull queries.
<class>.py    one file per class once authored. light / cutter /
              freighter are the pilot ports. ace / heavy / frigate are
              not present in this foundation wave.

Skin
----
Roles carry the paint (ship_skins/ferrous.py, paint_parts_vc):
    ROLE_HULL    iron gray hull                                 #252A2E
    ROLE_ARMOUR  layered citadel / panel                        #5B6169
    ROLE_ACCENT  crimson recognition / battery                  #7A2D2E
    ROLE_RECESS  hatch throats, nozzle wells
    ROLE_TRIM    brass honors, rails
    glow         brass-warm drive / lamps                       #B89550
Keep name substrings prow, citadel, battery, navigation-light.

Shared constructs are smoke-probed by scripts/probe-ferrous-parts.py.

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
