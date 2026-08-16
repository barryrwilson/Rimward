"""Veridian Combine pilot ship builders.

Bible docs/FactionShipDesignBible.md §4.1: "calm corporate authority,
survey precision, modular extraction hardware." Fleet DNA: straight
load-bearing spine; hexagonal or chamfered pressure modules; detachable
survey pods; graphite hull; pale structural alloy; muted emerald optics.
Modules look serialized and replaceable.

Body plan (rewrite): SPINE AND HEX CANS. The ship is a thin graphite
keel (`md.keel_spine`) plus a countable string of 6-sided pressure
cans (`md.hex_module`). A lofted slab is forbidden as the primary hull.
Class identity is how the cans assemble: 2-can dart, fused split-tail,
single-file inspection string, compact stack, long citadel string,
open industrial keel with hung cargo.

Colour: graphite primary #29343A (ROLE_HULL keel), pale structural
alloy #8CA29E (ROLE_ARMOUR hex cans), muted emerald optics #4E9A7F /
#4DB88A (glow through INSET recesses only), brass as HAIRLINE trim
(ROLE_TRIM). Emissive ≤ 5 %. HUMAN.lampGap = 1.20.

Construction logic (synthesis/21 §G6): CLOSED SHELL, MACHINED.
Inset recess lighting only; no surface pipes. Flush plates dress a
can face. They do not make the hull.

Silhouette family (rule 6): SPINE-AND-PODS / HEX-CAN STRING.

Three zones (rule 1): bow 15–25 % / mid 45–60 % / stern 20–30 %.
No plate course crosses a zone boundary.

§G2 outline-breaker (≥ 15 % of hull length): CARGO CRADLE WINGS.
Grow REACH with class. NEVER inflate wing thickness as the scale cue.
Default CRADLE_WING_REACH is 2.40 ≥ 1.65 (15 % of cutter length 11.0).

Refuse: exposed-frame trusses (Freehold/Ledger/Lamplighter), gilded
lapped scales / ivory margins / ventral pylons, ferrous rib flares /
turret rails, Assembly radial fans, Congregation sails, Beautiful
flesh, Unknowables lace. No plate quilt that reads as Ledger salvage.
No surface pipes.

Class lines (constructs only; class files are not in this foundation):
    Light     — claim scout: sensor dart, faceted survey head, two
                sample canisters, thin ranging vanes.
    Ace       — patent demonstrator: seamless test craft, oversized
                emerald aperture, split-tail, high-output drive.
    Cutter    — inspection launch: docking/impound collar, evidence
                lockers, paired survey drones flush in flanks.
    Heavy     — claim-enforcement: armored core, recessed weapons,
                sample vaults, blunt legal-boundary prow.
    Frigate   — survey command: registry/data citadel, instrument
                fins, two launch bays, archive armor.
    Freighter — extraction carrier: open industrial spine, ore silos,
                refinery drums, detachable claim modules, tug docks,
                small crew block, nested craft/container in an open
                bay (§G5).

Layout
------
surface.py    shared hull-surface queries, the absolute human + Veridian
              module, and the surf_* callback factories. No geometry,
              no ship_kit. Importable by plain CPython.
modules.py    Veridian surface language — large flush plates, hex /
              chamfer serialized modules, inset recess lighting wells,
              machined zone collars, pale-alloy plate courses that
              STEP their outboard offset. Builds through ship_kit
              only. No hull queries.
hardware.py   Veridian equipment — faceted survey head, sample
              canisters, ranging vanes, docking/impound collar, flush
              survey drones, evidence lockers, sample vaults, cargo
              cradle wings, countable drive face, flat radiators, tug
              docks, ore silo / refinery drum, nested claim module or
              docked scout, marker/nav lamps. Builds through ship_kit
              only. No hull queries.
<class>.py    one file per class once authored. This foundation wave
              ships no class files.

Foundation window
-----------------
PILOT_CLASSES lists all six keys. build() lazy-imports each class
module and no-ops on ImportError. Until the class files exist, a
Veridian bake therefore emits EMPTY hulls. That is acceptable for
this foundation window: do not bake Veridian until the class files
land. The generic veridian() BUILDERS fallback in
scripts/build-ship-assets.py stays in place but is not reached for
keys listed in PILOT_CLASSES.

Skin
----
Roles carry the paint (ship_skins/veridian.py, paint_parts_vc):
    ROLE_HULL    graphite primary                              #29343A
    ROLE_ARMOUR  pale structural alloy, large flush plates     #8CA29E
    ROLE_ACCENT  muted emerald (name-matched survey / lamps)   #4E9A7F
    ROLE_RECESS  inset wells, throats, locker doors
    ROLE_TRIM    brass/gold hairline on panel edges only
    glow         emerald survey glass / nav lamps              #4DB88A
accent_density is 1.0: coverage is controlled with geometry, never
random thinning. Keep name substrings spine, canister, survey-head,
navigation-light, cradle.

Shared constructs are smoke-probed by scripts/probe-veridian-parts.py.

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

    Because every class is listed in PILOT_CLASSES, a bake of Veridian
    before the class files exist emits an empty hull. Do not bake
    Veridian in this foundation window.
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
