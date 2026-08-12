/**
 * Ship scale charter — the single source of truth for NPC ship size.
 *
 * Authority: docs/FactionShipDesignBible.md §2 ("Relative size charter") and
 * docs/FactionShipRebuildPlan.md. Every consumer reads this module; nothing
 * re-declares a class table of its own:
 *
 *   - src/systems/ships/<faction>.js  authoring envelopes + HUMAN module sizes
 *   - scripts/measure-ships.mjs       the fast authoring loop's pins
 *   - scripts/boot-test.mjs           the same pins inside the real spawn path
 *   - src/systems/combat.js           the collision proxy
 *
 * ---------------------------------------------------------------------------
 * P — THE PLAYER SHIP IS THE YARDSTICK
 * ---------------------------------------------------------------------------
 * The bible measures every NPC ship against the Player ship's largest
 * rest-pose dimension, P. The Player hull is sculpted by makeLivingHull() in
 * src/systems/ship.js and is NOT part of this rebuild. Measured at the neutral
 * pose (SphereGeometry(1, 64, 40) run through that sculpt, object scale 1):
 *
 *   spanX 6.60   spanY 0.70   spanZ 4.20   maxRadius 3.30
 *
 * The manta wingspan is the largest dimension, so P = 6.6 world units. The
 * bible's illustrative metre column treats P as 24 m, which fixes the world
 * scale at 1 unit ~= 3.64 m. That conversion is what makes HUMAN below real
 * rather than decorative.
 *
 * ---------------------------------------------------------------------------
 * WHAT THE OLD TABLE GOT WRONG (kept as the design note)
 * ---------------------------------------------------------------------------
 * Wave 47 pinned `ace < cutter < freighter < heavy << frigate` with the
 * freighter only 1.9 P and the frigate 7.0 P. Bulk carriers came out smaller
 * than gunships and the frigate outweighed everything in ordinary traffic. The
 * bible retires that hierarchy for:
 *
 *   ace ~= light < cutter < heavy < frigate << freighter
 *
 * A freighter has to read as a location the Player ship cannot dock inside; a
 * frigate has to outrank a heavy while a freighter dwarfs it in volume.
 */

/** Player ship largest rest-pose dimension, world units. The yardstick. */
export const P = 6.6;

/** World units per metre implied by P = 24 m. Documents HUMAN below. */
export const UNITS_PER_METRE = P / 24;

/**
 * The shared human-scale module (bible §2, acceptance test 5: "the smallest
 * repeated doors/windows/rails stay the same physical size across light,
 * frigate and freighter models").
 *
 * These are ABSOLUTE world units and never scale with the class. A sculpt that
 * wants a bigger window row adds more windows, never larger ones. Enforced by
 * construction: every faction sculpt imports these instead of hand-typing
 * literals, so the module cannot drift between classes or factions.
 */
export const HUMAN = {
  windowW: 0.20,  // ~0.73 m — a single cabin light
  windowH: 0.13,  // ~0.47 m
  windowD: 0.06,  // recess depth
  windowGap: 0.34, // ~1.24 m centre-to-centre in a row
  doorW: 0.34,    // ~1.24 m — a suited crew hatch
  doorH: 0.52,    // ~1.89 m
  railH: 0.30,    // ~1.09 m — catwalk handrail height
  railPost: 0.05,
  ladderW: 0.30,
  lampSize: 0.10, // ~0.36 m — one running/work lamp
  // Centre-to-centre pitch of a lamp run. This exists because the obvious
  // `count = runLength / lampSize` is wrong: it packs lamps edge to edge into a
  // continuous glowing strip. A Veridian freighter authored that way carried 805
  // lamps and 73,692 lit vertices against a 23,000 ceiling. Lamps are spaced
  // like lamps.
  lampGap: 1.20,  // ~4.4 m between work lamps on a walkway
  collarR: 0.62,  // ~2.26 m — a standard docking collar bore
  crateS: 0.85,   // ~3.09 m — one standardised cargo container edge
};

/**
 * Per-class charter.
 *
 *   pBand   [min, max] multiples of P for the LARGEST visible dimension
 *   span    [min, max] world units — pBand * P, precomputed
 *   target  the authored aim inside `span`; sculpts land here, pins allow the band
 *   hull    [min, max] vertices in the opaque `hull` channel
 *   lights  minimum vertices in the emissive `lights` channel (max is 25% of hull)
 *   cell    occupancy-grid cell for the singleMass flood fill, ~= 0.045 * target
 *   role    the modelling role from the bible, for reviewers
 *   berth   station relationship — the freighter's "exterior only" is a hard read
 *   proxy   collision capsule: sphere radius `r` swept along local Z +/- `halfLen`
 *   minLengthOverBeam / maxHeightOverLength  per-class relief on SHIP_PROPORTION
 *
 * The proxy follows the PRIMARY MASS only (bible §6): thin antennae, tendrils,
 * cranes, sails and field wakes are deliberately outside it, so a bolt can pass
 * through a mast without registering a hull hit. r/halfLen are set from the
 * target span, not from the ceiling, so a sculpt that lands mid-band is covered
 * without the capsule ballooning past its own plating.
 */
export const SHIP_SCALE = {
  light: {
    role: 'scout, courier, interceptor, personal workboat',
    berth: 'fits an internal berth',
    pBand: [0.90, 1.10], span: [5.94, 7.26], target: 6.8,
    hull: [4000, 14000], lights: 260, cell: 0.6,
    proxy: { r: 1.5, halfLen: 2.0 },
  },
  ace: {
    role: 'bespoke high-performance personal combat craft',
    berth: 'fits an internal berth',
    pBand: [0.90, 1.15], span: [5.94, 7.59], target: 7.2,
    hull: [4000, 15000], lights: 260, cell: 0.6,
    proxy: { r: 1.5, halfLen: 2.2 },
  },
  cutter: {
    role: 'patrol, boarding, customs, rescue, raiding',
    berth: 'fits a large internal berth',
    pBand: [1.45, 1.80], span: [9.57, 11.88], target: 11.0,
    // Ceiling raised twice, both times for the same reason: the number predates
    // the detail the bible asks this class to carry, and an author asked to fit
    // it deletes construction language instead of greeble.
    //
    // 22,000 -> 26,000 in wave 1's review pass, when every class gained a
    // detailed instrument FACE (bezel, sunk iris, mounting bosses, cabling)
    // because the reviewer's verdict was that the fronts of the larger vessels
    // were flat shapes with nothing on them. The cutter is the only class that
    // mounts three apertures, so it was the only one 22,000 could not absorb.
    //
    // 26,000 -> 34,000 in the body-plan rebuild. The inspection launch carries
    // more discrete equipment than anything else under a frigate: an impound
    // collar, three apertures, two stowed survey drones in flank recesses, a
    // ventral evidence-locker row and a working deck, all on a flat blade hull
    // whose plating area is large because the body is wide. Twice an author hit
    // 26,000 and switched the hull PLATING off to fit — which removes the
    // Combine's entire surface language and leaves a bare shell wearing
    // equipment. 34,000 is ~1.7 MB a bake, in line with the heavy's 40,000.
    hull: [6000, 34000], lights: 400, cell: 0.8,
    proxy: { r: 2.1, halfLen: 3.4 },
  },
  heavy: {
    role: 'gunship, convoy escort, tough specialist vessel',
    berth: 'uses a large bay or exterior cradle',
    pBand: [2.20, 2.80], span: [14.52, 18.48], target: 17.0,
    // 40,000 rather than 34,000. Wave 1's review found that the gunship, the
    // frigate and the carrier all ended in bare spine wearing rib hoops — the
    // hull stopped and the ship trailed off into a cage. Closing the stern with a
    // real drive section (housing, radiators, recessed thrust throats) is mass
    // and function, not decoration, and it costs about 3,500 vertices.
    hull: [9000, 40000], lights: 600, cell: 1.1,
    proxy: { r: 3.2, halfLen: 5.4 },
  },
  frigate: {
    role: 'compact capital escort and command ship',
    berth: 'normally uses an exterior military clamp',
    pBand: [4.00, 5.50], span: [26.40, 36.30], target: 32.0,
    hull: [16000, 60000], lights: 1100, cell: 1.8,
    proxy: { r: 5.4, halfLen: 10.5 },
  },
  freighter: {
    role: 'bulk carrier, mobile industry, migration vessel',
    berth: 'NEVER fits inside a station; exterior berth only',
    pBand: [10.0, 14.0], span: [66.00, 92.40], target: 78.0,
    // 110,000 rather than 100,000 for the same reason as the cutter: the wave-1
    // review added an instrument face to every class and the carrier had 2,700
    // vertices of headroom left. At ~5.2 MB a bake this costs about 9 MB across
    // twelve factions and two bakes if a reviewer opens every freighter, which is
    // the memory ceiling this table respects.
    hull: [34000, 110000], lights: 2400, cell: 3.2,
    proxy: { r: 12.0, halfLen: 26.0 },
    // A freighter may be broad and irregular (bible §2/§3), so it gets relief
    // on the beam rule — but its travel direction still has to be instant.
    minLengthOverBeam: 1.05,
    maxHeightOverLength: 0.62,
  },
};

/**
 * Silhouette rules that apply to every class unless a SHIP_SCALE entry
 * overrides them.
 *
 * These replace wave 47's `spanZ >= 2.4 * spanX` / `spanY <= 0.75 * spanX`
 * pins, which forbade shapes the bible explicitly asks for: the Gilded Chain's
 * low crescents, the Beautiful Ones' manta plan, and any broad freighter. The
 * surviving requirement is the one the bible actually states — travel direction
 * must be instantly legible, and the navigation silhouette is mostly longer
 * than it is tall.
 */
export const SHIP_PROPORTION = {
  /** spanZ / spanX floor: length leads beam, so the nose is never ambiguous. */
  minLengthOverBeam: 1.15,
  /** spanY / spanZ ceiling: "mostly longer than it is tall". */
  maxHeightOverLength: 0.60,
  /** spanX / spanZ floor: a hull, not a pencil. */
  minBeamOverLength: 0.16,
  /**
   * Bounding-box centre offset ceiling, as a fraction of the span on that
   * axis. The bible puts the root pivot at the stable centre of mass, not the
   * geometric centre of decorative fins; a sculpt authored around an offset
   * origin also throws the engine glow and the collision capsule.
   */
  maxPivotOffset: 0.15,
};

/**
 * Faction-level relief on SHIP_PROPORTION. Bible §2: "Faction-specific
 * exceptions may be wide, radial, or manta-like."
 *
 * The Player ship is itself manta-plan (spanX 6.6 vs spanZ 4.2), so the
 * Beautiful Ones — who use it as their direct anatomy reference — cannot be
 * held to a length-leads-beam floor above 1. The Unknowables have no hull and
 * are measured on the stable field envelope, which is a nested loop cage: it is
 * radial by construction and legitimately as tall as it is long.
 */
export const FACTION_PROPORTION_RELIEF = {
  beautiful: { minLengthOverBeam: 0.55, maxHeightOverLength: 0.60, minBeamOverLength: 0.35 },
  unknowables: { minLengthOverBeam: 0.70, maxHeightOverLength: 1.15, minBeamOverLength: 0.45 },
};

/**
 * How a faction's family is built, which decides how the harnesses read it.
 *
 *   'built' — detailBuilder(); measured from the merged `hull`/`lights`
 *             channels, and subject to the vertex budgets.
 *   'grown' — living tissue (Beautiful Ones); measured from the assembled
 *             THREE.Group, excluding userData.glow. Vertex budgets do not
 *             apply: an organic body is a few smooth sculpted surfaces, not a
 *             greeble field, and padding it with vertices would be a lie.
 *   'field' — no hull at all (Unknowables); measured from the stable field
 *             envelope of the assembled Group, excluding userData.glow.
 */
export const FACTION_MEASURE_KIND = {
  beautiful: 'grown',
  unknowables: 'field',
};

/** Own-key measure-kind lookup; anything unlisted is a built sculpt. */
export function measureKindFor(faction) {
  return Object.hasOwn(FACTION_MEASURE_KIND, faction) ? FACTION_MEASURE_KIND[faction] : 'built';
}

/**
 * Resolve the silhouette rules for one faction × class. Per-class relief in
 * SHIP_SCALE applies first, then faction relief overrides it — a Beautiful Ones
 * freighter is both broad-for-a-freighter and manta-plan.
 */
export function proportionFor(classKey, faction) {
  const cls = Object.hasOwn(SHIP_SCALE, classKey) ? SHIP_SCALE[classKey] : SHIP_SCALE.light;
  const relief = faction !== undefined && Object.hasOwn(FACTION_PROPORTION_RELIEF, faction)
    ? FACTION_PROPORTION_RELIEF[faction] : null;
  const pick = (key) => relief?.[key] ?? cls[key] ?? SHIP_PROPORTION[key];
  return {
    minLengthOverBeam: pick('minLengthOverBeam'),
    maxHeightOverLength: pick('maxHeightOverLength'),
    minBeamOverLength: pick('minBeamOverLength'),
    maxPivotOffset: pick('maxPivotOffset'),
  };
}

/** Own-key class lookup; classKey is save-controlled, so never bracket-read raw. */
export function scaleFor(classKey) {
  return Object.hasOwn(SHIP_SCALE, classKey) ? SHIP_SCALE[classKey] : SHIP_SCALE.light;
}

/**
 * Class keys in charter order — smallest to largest. Authoring, measurement
 * and review all walk this order so a census reads as a size ladder.
 */
export const CLASS_ORDER = ['light', 'ace', 'cutter', 'heavy', 'frigate', 'freighter'];

/**
 * Faction rebuild order, straight from the bible's own section order
 * (§4.1-§4.10, then §5.1-§5.2). One faction per wave.
 */
export const FACTION_REBUILD_ORDER = [
  'veridian', 'ferrous', 'freehold', 'redledger', 'gilded',
  'beautiful', 'unknowables', 'assembly', 'congregation', 'lamplighter',
  'independent', 'hollow',
];

/**
 * Factions whose six-ship family has been rebuilt against this charter.
 *
 * MIGRATION GATE. The harnesses pin rebuilt factions against SHIP_SCALE and
 * unrebuilt ones against LEGACY_SHIP_SCALE, so a wave in progress cannot turn
 * the other eleven fleets red. Each faction wave adds its own key here in the
 * same commit as its sculpt. When this set covers FACTION_REBUILD_ORDER,
 * LEGACY_SHIP_SCALE and this set are both deleted and the pins apply
 * unconditionally.
 */
export const REBUILT_FACTIONS = new Set([
  'veridian', // wave 1
]);

/**
 * The retired wave-47 table. Read ONLY by the harnesses, ONLY for factions
 * absent from REBUILT_FACTIONS. Delete with REBUILT_FACTIONS.
 *
 * `env` is [maxX, maxY, maxZ] half-extents, `rad` the max-distance-from-origin
 * band, and the proportion pins were the fixed 2.4x / 0.75x pair.
 */
export const LEGACY_SHIP_SCALE = {
  light: { env: [1.3, 0.9, 3.4], hull: [3000, 12000], lights: 200, cell: 0.6, rad: [2.2, 3.5] },
  cutter: { env: [1.8, 1.2, 5.0], hull: [4000, 16000], lights: 260, cell: 0.7, rad: [3.0, 5.0] },
  ace: { env: [2.2, 1.3, 5.8], hull: [4000, 16000], lights: 260, cell: 0.7, rad: [4.4, 5.8] },
  freighter: { env: [2.8, 2.0, 7.4], hull: [6000, 24000], lights: 400, cell: 0.9, rad: [4.4, 7.2] },
  heavy: { env: [3.6, 2.4, 8.8], hull: [7000, 28000], lights: 460, cell: 1.0, rad: [6.0, 9.0] },
  frigate: { env: [9.0, 6.0, 26.0], hull: [15000, 60000], lights: 900, cell: 2.0, rad: [21.0, 32.0] },
};

/** Legacy proportion pins — the pair SHIP_PROPORTION replaces. */
export const LEGACY_PROPORTION = { minLengthOverBeam: 2.4, maxHeightOverBeam: 0.75 };
