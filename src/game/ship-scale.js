/**
 * Ship scale charter — the single source of truth for NPC ship size.
 *
 * Authority: docs/FactionShipDesignBible.md §2 ("Relative size charter").
 * The NPC GLB asset pipeline and its validation tools consume this module.
 * Combat uses each loaded asset's collision proxy and only uses the class
 * proxy as a failure-safe fallback.
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
 * These are absolute world-unit reference dimensions for original asset
 * authoring. The GLB assets preserve these dimensions at export.
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

