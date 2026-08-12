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
 *   - src/systems/combat.js           the collision proxy (FALLBACK only; real proxy
 *                                     derived per-sculpt by deriveProxy() in npc.js)
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
 *   proxy   FALLBACK collision capsule for hull-less ships ONLY.  Every ship that
 *           goes through buildShipMesh() with a hull channel (built, grown, and
 *           VC-fallback factions) derives its proxy in npc.js via deriveProxy()
 *           at bake time and stores it in group.userData.proxy.  These table
 *           entries are read by testNpcHits ONLY when userData.proxy is absent —
 *           currently the Unknowables energy field, which has no hull geometry.
 *           Do NOT update these values to tune live coverage: edit PROXY_PERCENTILE
 *           in npc.js and re-run scripts/measure-ships.mjs instead.
 *
 *   WHAT WENT WRONG (kept as design record).
 *   The proxy entries were hand-authored per class for the retired wave-47 hierarchy
 *   and never re-cut when wave 0 re-scaled the classes.  No harness pinned them
 *   against the actual sculpts, so the freehold heavy drifted to 20.1 % proxyCover
 *   — essentially unshootable — and the veridian cutter's circular hitbox stood
 *   2.3× the hull's height (the ellipse fix reduced that to +21 %).  A per-class
 *   capsule is structurally unable to serve factions whose hull cross-sections
 *   differ by 2×+: the ferrous cutter is a stout tug (spanY ≈ 5.3) while the
 *   veridian cutter is a flat blade (spanY ≈ 2.6) — a 2.06× ratio.  Any shared ry
 *   that covers the tug overshoots the blade by +94 %.  These are the root causes
 *   recorded as the sixth defect shape in docs/FactionShipRebuildPlan.md wave-3:
 *   "a charter constant that nothing pins drifts silently."  Per-sculpt derivation
 *   removes the constant and the drift simultaneously.
 *
 *   minLengthOverBeam / maxHeightOverLength  per-class relief on SHIP_PROPORTION
 */
//
// WAVE 3 — the ceilings are now SOFT, by the project owner's direction: "relax
// on the budgets, only become concerned if they go 40% out of spec; I'm more
// interested in good models than adhering to some initial guidelines." Every
// ceiling below is therefore its previous value plus 40%, and the reason is the
// same one recorded three separate times in the per-class comments that follow:
// an author asked to meet a number deletes the construction language the bible
// asks the class to carry, and the result passes every pin and gets rejected in
// review. The floors are unchanged — they are the "this is not a bare shell"
// pin and still bite. Spans, silhouette ratios, pivots, single mass, orphan
// lights, attachment and palette are NOT relaxed.
//
// The SPAN bands are soft on the same terms, and for the same reason: the
// authored `target` is the aim, and the band is now target +/- 40% rather than
// the tight window authors were contorting hulls to hit. Two guards make that
// safe, and both are load-bearing:
//
//   - The SIZE LADDER is pinned SEPARATELY, per faction, in scripts/boot-test.mjs
//     (`<faction>ClassOrdering`): light <= ace < cutter < heavy < frigate <
//     freighter, with light and ace allowed within 15% of each other. Bands may
//     now overlap between classes without the ladder loosening at all — a
//     faction still has to climb its own ladder.
//   - The FREIGHTER'S FLOOR IS HELD at 66.0 and is not widened downward. A
//     station sculpt measures roughly 57 units across, and bible §2's "never
//     fits inside a station; exterior berth only" is a read the player gets from
//     the silhouette beside the station. A 47-unit freighter would moor inside
//     the thing it is supposed to dwarf, so that bound is world coherence rather
//     than a budget. Its ceiling widens normally.
//
// The real collision proxy for every sculpted hull is now derived per-sculpt in
// npc.js (deriveProxy) at bake time and stored in group.userData.proxy.  The
// `proxy` entries below are a FALLBACK for hull-less ships (the Unknowables
// energy field) only.  `proxyCover` in scripts/ship-metrics.mjs pins the derived
// proxy against the sculpt, so a hull that grows into the wider span band fails
// loudly instead of quietly becoming unshootable.
export const SHIP_SCALE = {
  light: {
    role: 'scout, courier, interceptor, personal workboat',
    berth: 'fits an internal berth',
    pBand: [0.62, 1.44], span: [4.08, 9.52], target: 6.8,
    // 14,000 -> 18,000 in wave 2. The number was set for a slim scout with a
    // small skin area; the Ferrous picket is a SOLID WEDGE, and a wedge of this
    // length has roughly twice the flat surface of a dart. Two authoring passes
    // spent the whole 14,000 on the shell, the belt and the drive and had
    // nothing left for the plate courses, so the class rendered as an unbroken
    // black slab — the exact defect the reviewer rejected the fleet for. The
    // faction's surface language is not optional detail; it is what makes a
    // hull read as constructed. 18,000 is ~0.9 MB a bake.
    hull: [4000, 25000], lights: 260, cell: 0.6,
    // FALLBACK proxy (Unknowables only — built ships derive their proxy in npc.js).
    // History: pre-wave-3 circular r:1.5,halfLen:2.0 (retired wave-47 hierarchy,
    // never re-cut after wave 0 re-scaled classes; freehold light was 51 % covered).
    // Wave 3: ellipse { rx, ry } to decouple beam from height.
    proxy: { rx: 2.07, ry: 1.13, halfLen: 2.18 },
  },
  ace: {
    role: 'bespoke high-performance personal combat craft',
    berth: 'fits an internal berth',
    pBand: [0.65, 1.53], span: [4.32, 10.08], target: 7.2,
    hull: [4000, 21000], lights: 260, cell: 0.6,
    // FALLBACK proxy (Unknowables only — built ships derive their proxy in npc.js).
    // History: pre-wave-3 r:1.5,halfLen:2.2 (retired wave-47; ferrous ace 53 % covered).
    proxy: { rx: 1.94, ry: 0.74, halfLen: 2.11 },
  },
  cutter: {
    role: 'patrol, boarding, customs, rescue, raiding',
    berth: 'fits a large internal berth',
    pBand: [1.00, 2.33], span: [6.60, 15.40], target: 11.0,
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
    hull: [6000, 47000], lights: 400, cell: 0.8,
    // FALLBACK proxy (Unknowables only — built ships derive their proxy in npc.js).
    // History: pre-wave-3 r:2.1,halfLen:3.4 (retired wave-47; ferrous cutter 44 % covered).
    // The structural problem that produced the wave-3 cutter note — one shared ry unable
    // to serve ferrous tug (spanY 5.3) and veridian blade (spanY 2.6) at once — no longer
    // applies; per-sculpt derivation gives each faction its own (rx, ry).
    proxy: { rx: 3.02, ry: 2.51, halfLen: 3.31 },
  },
  heavy: {
    role: 'gunship, convoy escort, tough specialist vessel',
    berth: 'uses a large bay or exterior cradle',
    pBand: [1.55, 3.61], span: [10.20, 23.80], target: 17.0,
    // 40,000 rather than 34,000. Wave 1's review found that the gunship, the
    // frigate and the carrier all ended in bare spine wearing rib hoops — the
    // hull stopped and the ship trailed off into a cage. Closing the stern with a
    // real drive section (housing, radiators, recessed thrust throats) is mass
    // and function, not decoration, and it costs about 3,500 vertices.
    // 40,000 -> 48,000 in wave 2, for the same reason as the cutter's two
    // raises. The Ferrous bastion gunship is a hammerhead: a tall shouldered
    // citadel whose four large flat faces are most of the ship's visible
    // surface, and a gunship that cannot afford to clad them is a black box
    // with guns on it. Cladding all four faces plus the shoulder flares costs
    // ~11,000 plates' worth of vertices on top of the shell, the belt and the
    // prow. 48,000 is ~1.2 MB a bake, in line with the frigate's 60,000.
    // 48,000 -> 56,000 in wave 3: the Freehold militia monitor's stepped
    // citadel, silhouette-visible turrets and exposed civilian window band are
    // the class read, and the old ceiling predates all three.
    hull: [9000, 78000], lights: 600, cell: 1.1,
    // FALLBACK proxy (Unknowables only — built ships derive their proxy in npc.js).
    // History: pre-wave-3 r:3.2,halfLen:5.4 (retired wave-47; freehold heavy 20 % covered
    // — essentially unshootable).  Wave 3 ellipse re-solve left a residual conflict: the
    // single shared ry=3.57 overshot veridian height by +29 %.  Per-sculpt derivation
    // resolves both defects simultaneously.
    proxy: { rx: 5.21, ry: 3.57, halfLen: 4.42 },
  },
  frigate: {
    role: 'compact capital escort and command ship',
    berth: 'normally uses an exterior military clamp',
    pBand: [2.91, 6.79], span: [19.20, 44.80], target: 32.0,
    hull: [16000, 84000], lights: 1100, cell: 1.8,
    // FALLBACK proxy (Unknowables only — built ships derive their proxy in npc.js).
    // History: pre-wave-3 r:5.4,halfLen:10.5 (retired wave-47; rebuilt frigates
    // were borderline 88-93 % with a circular capsule).
    proxy: { rx: 5.93, ry: 4.14, halfLen: 12.34 },
  },
  freighter: {
    role: 'bulk carrier, mobile industry, migration vessel',
    berth: 'NEVER fits inside a station; exterior berth only',
    // Floor held at 66.0 on purpose — see the note above the table. Only the
    // ceiling widens.
    pBand: [10.0, 16.55], span: [66.00, 109.20], target: 78.0,
    // 110,000 rather than 100,000 for the same reason as the cutter: the wave-1
    // review added an instrument face to every class and the carrier had 2,700
    // vertices of headroom left. At ~5.2 MB a bake this costs about 9 MB across
    // twelve factions and two bakes if a reviewer opens every freighter, which is
    // the memory ceiling this table respects.
    hull: [34000, 154000], lights: 2400, cell: 3.2,
    // FALLBACK proxy (Unknowables only — built ships derive their proxy in npc.js).
    // History: pre-wave-3 r:12.0,halfLen:26.0 (retired wave-47; veridian freighter
    // was exactly 80 %, the minimum permitted).  Wave 3 ellipse extend halfLen to
    // clear all three rebuilt factions.
    proxy: { rx: 12.88, ry: 7.37, halfLen: 31.27 },
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
  'veridian',  // wave 1
  'ferrous',   // wave 2
  'freehold',  // wave 3
  'redledger', // wave 4
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
