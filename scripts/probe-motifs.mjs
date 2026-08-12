/**
 * Motif-level smoke probe — the foundation instrument for faction ship rebuilds.
 *
 * WHY IT EXISTS. The fleet harnesses (scripts/measure-ships.mjs,
 * scripts/attach-audit.mjs) import a faction's barrel, which pulls in every
 * class. One half-written class blanks the report for all five siblings, and
 * the barrel cannot run at all while body.js and motifs.js are being authored
 * in parallel. This probe imports only the two foundation modules and exercises
 * every geometry-emitting construct in isolation, before any class file exists.
 *
 * WHAT IT CATCHES. Each construct is built alone into its own
 * detailBuilder({ track: true }) so the following defects surface as a named
 * FAIL against that construct — not as a crash inside an unrelated class file
 * two passes later:
 *
 *   - A third channel opened by swapping the channel and colour arguments to
 *     box() — a channel named after a colour integer instead of 'hull' or
 *     'lights'. The fleet harness ignores the mislaid geometry silently; this
 *     probe prints the offending key.
 *   - A vertex colour that is NaN or pure black (#000000). NaN usually means
 *     an options object was passed where a hex integer was expected. Pure black
 *     usually means a weather() index outside 0..3 (SHADES[4] is undefined,
 *     NaN propagates through, and bitwise ops coerce it to 0).
 *   - A hull colour outside the faction's allowed palette ladder (base colours
 *     from st plus four weather() shades of each). Printed as #rrggbb.
 *   - A lights colour that is not near-white (every sRGB channel < 0.6). The
 *     additive material supplies the faction hue; vertex colours must stay pale.
 *   - An exact 1×1×1 cube from a box/cyl call with a missing dimension
 *     argument. THREE defaults every omitted dimension to 1 and emits no
 *     warning. windowRow(b, ch, hex, count) is the classic case: passing count
 *     positionally makes it an options object with no recognised keys and emits
 *     nothing, while a missing w/h/d on a box emits a silent unit cube.
 *   - A construct that emits no geometry at all (the positional windowRow case).
 *   - Floating parts: the AABB overlap graph must be fully connected
 *     (lonely === 0, attachedPct === 100) and the fine occupancy contact grid
 *     must also be fully connected. A part that only touches tangentially fails.
 *   - The end-band regression in patchCourse / armourCourse: a range whose
 *     from/to land exactly on a station z must still emit that band. Wave 2
 *     used a strict interior inequality and dropped both end bands on every
 *     full-length course. Two entries in the call table cover this: one with
 *     from/to on exact station z values, one clipped mid-band.
 *
 * WHY THE FLEET HARNESSES CANNOT CATCH IT. The fleet harnesses run after the
 * whole class family is assembled. A corrupt body.js or motifs.js fails every
 * class simultaneously; the report names the class file, not the foundation
 * routine. This probe names the exact construct and the reason on one line,
 * which six authors reading a parallel-build report can act on in one pass.
 *
 * Usage: node scripts/probe-motifs.mjs [faction]   (default: freehold)
 *   e.g. node scripts/probe-motifs.mjs freehold
 *        node scripts/probe-motifs.mjs ferrous
 *        node scripts/probe-motifs.mjs redledger
 */

import { detailBuilder } from '../src/systems/station-detail.js';
import { FACTION_STYLE } from '../src/game/faction-style.js';
import { allowedHull, hexesOf, measure } from './ship-metrics.mjs';
import {
  analyseAttachment, analyseContact, blameIsland, TOUCH_EPS, CONTACT_CELL,
} from './attachment.mjs';

// ── Faction argument ─────────────────────────────────────────────────────────

let faction = (process.argv[2] || 'freehold').toLowerCase();

if (!FACTION_STYLE[faction]) {
  console.error(
    `probe-motifs: unknown faction '${faction}'. `
    + `Known: ${Object.keys(FACTION_STYLE).join(', ')}`,
  );
  process.exit(1);
}

// ── Module loading with graceful fallback ─────────────────────────────────────
//
// body.js and motifs.js may be absent or half-written while sibling agents are
// still authoring them. We attempt the requested faction first and fall back to
// ferrous, which is always available as the wave-2 reference. A missing module
// produces a clear error naming the file; a syntax / runtime error in the module
// is re-thrown so the author sees the real stack.

const tryLoad = async (href) => {
  try {
    return { mod: await import(href), err: null };
  } catch (e) {
    if (e.code === 'ERR_MODULE_NOT_FOUND' || e.code === 'MODULE_NOT_FOUND') {
      return { mod: null, err: e };
    }
    throw e; // syntax or runtime error — let the author see it
  }
};

let bodyMod, motifsMod;
let loadedFaction = faction;

{
  const bHref = new URL(`../src/systems/ships/${faction}/body.js`, import.meta.url).href;
  const mHref = new URL(`../src/systems/ships/${faction}/motifs.js`, import.meta.url).href;

  const [bRes, mRes] = await Promise.all([tryLoad(bHref), tryLoad(mHref)]);

  if (bRes.err || mRes.err) {
    const missing = [];
    if (bRes.err) missing.push(`src/systems/ships/${faction}/body.js`);
    if (mRes.err) missing.push(`src/systems/ships/${faction}/motifs.js`);
    console.warn(`probe-motifs: file(s) not found: ${missing.join(', ')}`);

    if (faction !== 'ferrous') {
      console.warn(
        `probe-motifs: sibling agents may still be authoring ${faction}; `
        + `falling back to ferrous to verify the probe itself`,
      );
      loadedFaction = 'ferrous';
    } else {
      console.error('probe-motifs: ferrous foundation is missing — cannot run');
      process.exit(1);
    }
  } else {
    bodyMod = bRes.mod;
    motifsMod = mRes.mod;
  }

  if (loadedFaction === 'ferrous' && !bodyMod) {
    const fbH = new URL('../src/systems/ships/ferrous/body.js', import.meta.url).href;
    const fmH = new URL('../src/systems/ships/ferrous/motifs.js', import.meta.url).href;
    const [fbRes, fmRes] = await Promise.all([tryLoad(fbH), tryLoad(fmH)]);
    if (fbRes.err || fmRes.err) {
      console.error('probe-motifs: ferrous foundation is missing — cannot run');
      process.exit(1);
    }
    bodyMod = fbRes.mod;
    motifsMod = fmRes.mod;
  }
}

// ── Call tables ───────────────────────────────────────────────────────────────
//
// One entry per exported construct that emits geometry. Sweep-core re-exports
// (tri, quad, emitMesh, …) and scalar colour constants (LAMP, GLASS, …) are
// skipped — they are utilities, not faction constructs, and probing a function
// as a build target is meaningless.
//
// Each entry carries:
//   name  — printed in the report; must be unique in the table
//   kind  — 'body' or 'motif' (informational only, does not affect checks)
//   call  — (b, st) => void — exercises the construct against a builder

/**
 * Freehold Compact call table.
 *
 * Station list constructs (splicedHull, patchCourse, soundFrame, glassHouse,
 * tankVolume) receive a representative 5-station mid-size hull section so they
 * produce real geometry. patchCourse gets two entries: one with from/to landing
 * exactly on station z values (the end-band regression) and one clipped mid-band.
 */
function freeholdCallTable(body, motifs) {
  const {
    splicedHull, patchCourse, donatedBlock, soundFrame, glassHouse, tankVolume,
  } = body;
  const {
    warmWindowRow, toolLocker, rescueWinch, towWinch, floodLamp, deckPlate,
    patchPanel, boltOnArmour, militiaTurret, airlockCollar, habDrum,
    cargoPod, craftDock, driveCluster, thrusterCluster,
  } = motifs;

  // Representative 5-station cross-section list — plausible cutter-scale hull.
  const STA = [
    { z: -3.0, w: 0.80, h: 0.60, c: 0.3 },
    { z: -1.5, w: 1.40, h: 0.90, c: 0.3 },
    { z:  0.0, w: 1.60, h: 1.00, c: 0.3 },
    { z:  1.5, w: 1.50, h: 0.90, c: 0.3 },
    { z:  3.0, w: 1.00, h: 0.70, c: 0.3 },
  ];
  // Exact station z endpoints — used by the end-band regression entry.
  const z0 = STA[0].z;
  const z1 = STA[STA.length - 1].z;

  return [
    // ── body constructs ──────────────────────────────────────────────────────
    {
      name: 'splicedHull', kind: 'body',
      // Donated sections in three donor tones with two seam straps. The seam
      // list exercises the strap geometry path that wave-2 omitted, leaving
      // plain hull-section boundaries with no proud strap band.
      call: (b, st) => splicedHull(b, 'hull',
        [st.hull, st.accent, st.patch[2]],
        { stations: STA, seams: [-1.5, 1.5], strap: 0.07, seed: 1 }),
    },
    {
      name: 'patchCourse (on-station)', kind: 'body',
      // END-BAND REGRESSION. from and to land exactly on station[0].z and
      // station[4].z. A strict interior inequality drops both end bands and
      // can produce empty output on a short section range. Wave 2 shipped
      // this bug; patchCourse must use a non-strict comparison.
      call: (b, st) => patchCourse(b, 'hull',
        [st.accent, st.trim],
        { stations: STA, from: z0, to: z1, rows: 2, cols: 1, seed: 1 }),
    },
    {
      name: 'patchCourse (mid-band)', kind: 'body',
      // Mid-band clipping: from/to fall between stations on both ends.
      // Tests sectionAt interpolation and the clipping arithmetic independently
      // of the end-band path.
      call: (b, st) => patchCourse(b, 'hull',
        [st.patch[0], st.patch[1]],
        { stations: STA, from: -1.2, to: 1.8, rows: 2, cols: 1, seed: 2 }),
    },
    {
      name: 'donatedBlock', kind: 'body',
      // Two-tone donated block with two strap bands. The strap bands must
      // overlap the block geometry; wave-2's equivalent placed straps flush
      // rather than proud and they failed the contact check.
      call: (b, st) => donatedBlock(b, 'hull',
        [st.accent, st.trim],
        { w: 1.2, h: 0.9, d: 1.8, c: 0.2, straps: 2, seed: 1 }),
    },
    {
      name: 'soundFrame', kind: 'body',
      // Open box girder. The attachment check verifies that chords, ring frames,
      // and diagonal braces all overlap each other — a girder whose braces only
      // touch tangentially fails the AABB overlap graph.
      call: (b, st) => soundFrame(b, 'hull', st.hullDark,
        { from: -2.0, to: 2.0, w: 1.0, h: 0.7, bay: 1.5, chord: 0.18, brace: 0.13 }),
    },
    {
      name: 'glassHouse', kind: 'body',
      // Emits both channels: hull ribs and lights-channel glazing panels.
      // The st argument is the whole style, not a single hex.
      call: (b, st) => glassHouse(b, st,
        { w: 1.4, h: 0.8, d: 2.0, y: 0, bays: 3, seed: 1 }),
    },
    {
      name: 'tankVolume', kind: 'body',
      // Hooped cylinder along Z with a valve head. The telltale lamp is in the
      // lights channel; the cylinder + hoops + saddle are hull-channel.
      call: (b, st) => tankVolume(b, st,
        { r: 0.5, len: 2.0, y: 0, axis: 'z', hoops: 3, seed: 1 }),
    },
    // ── motifs ───────────────────────────────────────────────────────────────
    {
      name: 'warmWindowRow', kind: 'motif',
      // Primary scale cue. Exercises the { count, sill } options object path
      // so a positional-count call (which emits nothing) fails immediately.
      call: (b, st) => warmWindowRow(b, st, { count: 3, sill: true }),
    },
    {
      name: 'toolLocker', kind: 'motif',
      // Clamp pads must reach back past z=0 so the motif connects to whatever
      // it is mounted on; lonely clamp pads fail the attachment check.
      call: (b, st) => toolLocker(b, st, { w: 0.5, h: 0.42, d: 0.72, seed: 1 }),
    },
    {
      name: 'rescueWinch', kind: 'motif',
      // The hook block must be seated on the drum, not hanging in space.
      call: (b, st) => rescueWinch(b, st, { r: 0.22, len: 0.34, hook: true, seed: 1 }),
    },
    {
      name: 'towWinch', kind: 'motif',
      call: (b, st) => towWinch(b, st, { r: 0.34, len: 0.6, seed: 1 }),
    },
    {
      name: 'floodLamp', kind: 'motif',
      // Bracket must reach back past z=0; the shroud sits at the forward end.
      // If the bracket is absent the shroud is lonely.
      call: (b, st) => floodLamp(b, st, { r: 0.14, arm: 0.26, tilt: 0 }),
    },
    {
      name: 'deckPlate', kind: 'motif',
      // Deck plate + railing + lamp posts. The railing must overlap the deck
      // plate — a floating railing (wrong y offset) fails the attachment check.
      call: (b, st) => deckPlate(b, st, { w: 2.0, d: 1.5, rail: true, lamps: 2, seed: 1 }),
    },
    {
      name: 'patchPanel', kind: 'motif',
      // Patch panel with i=0 (first donor tone). Bolt heads and weld strap
      // must overlap the panel box.
      call: (b, st) => patchPanel(b, st, { w: 0.8, h: 0.6, i: 0, proud: 0.05, seed: 1 }),
    },
    {
      name: 'boltOnArmour', kind: 'motif',
      // Standoff pads connect the slab to the hull; the slab alone floats.
      // The attachment check catches a slab with no pads or pads that do not
      // reach back past z=0.
      call: (b, st) => boltOnArmour(b, st, { w: 1.0, h: 0.8, d: 0.16, stand: 0.1, seed: 1 }),
    },
    {
      name: 'militiaTurret', kind: 'motif',
      // Low ring tub + mount + paired barrels. All three must overlap.
      call: (b, st) => militiaTurret(b, st, { r: 0.3, h: 0.28, barrels: 2, seed: 1 }),
    },
    {
      name: 'airlockCollar', kind: 'motif',
      // Shank behind the ring reaches into the hull face; ring alone floats.
      // Default r = HUMAN.collarR is supplied by the function itself.
      call: (b, st) => airlockCollar(b, st, { len: 0.4, seed: 1 }),
    },
    {
      name: 'habDrum', kind: 'motif',
      // Hooped cylinder with warm window bands, ladder, and porch light.
      // Window count is derived from circumference / HUMAN.windowGap, not from
      // a literal number — a positional count silently emits nothing.
      call: (b, st) => habDrum(b, st, { r: 1.2, len: 2.4, rings: 3, windows: true, seed: 1 }),
    },
    {
      name: 'cargoPod', kind: 'motif',
      // Donated-tone pod (i=0) with cream strapping and a lit telltale.
      call: (b, st) => cargoPod(b, st, { w: 1.8, h: 1.4, d: 2.2, i: 0, seed: 1 }),
    },
    {
      name: 'craftDock', kind: 'motif',
      // Open cradle — approach lamps must be seated on the cradle arms.
      call: (b, st) => craftDock(b, st, { w: 1.2, d: 1.8, seed: 1 }),
    },
    {
      name: 'driveCluster', kind: 'motif',
      // Housing + radiator fins + thrust throats (lights) + service piping.
      // The throats are the lights channel; the housing is hull. Both must share
      // the aft region so the contact check passes.
      call: (b, st) => driveCluster(b, st, { w: 1.4, h: 1.0, len: 1.6, throats: 2, seed: 1 }),
    },
    {
      name: 'thrusterCluster', kind: 'motif',
      // Three nozzles on a cream mount with visible plumbing. The mount is
      // what connects the nozzles; nozzles without a mount are all lonely.
      call: (b, st) => thrusterCluster(b, st, { r: 0.18, count: 3, seed: 1 }),
    },
  ];
}

/**
 * Ferrous Hegemony call table.
 *
 * Ferrous is the wave-2 reference faction and its foundation is always present,
 * so the probe can self-verify while the Freehold foundation is being written
 * in a parallel wave. Adding Ferrous here costs little and makes the instrument
 * reusable for later faction rebuilds without modification.
 */
function ferrousCallTable(body, motifs) {
  const {
    armourBlock, beltedHull, armourCourse, armouredSpine,
  } = body;
  const {
    citadelArmour, wedgeProw, weaponBlock, recognitionBand, serviceHonour,
    rescueLock, pointDefence, commandStep, containerBlock, driveBattery,
  } = motifs;

  // Same layout as the Freehold station list for comparable extents.
  const STA = [
    { z: -3.0, w: 0.80, h: 0.60, c: 0.14 },
    { z: -1.5, w: 1.40, h: 0.90, c: 0.14 },
    { z:  0.0, w: 1.60, h: 1.00, c: 0.14 },
    { z:  1.5, w: 1.50, h: 0.90, c: 0.14 },
    { z:  3.0, w: 1.00, h: 0.70, c: 0.14 },
  ];
  const z0 = STA[0].z;
  const z1 = STA[STA.length - 1].z;

  return [
    // ── body constructs ──────────────────────────────────────────────────────
    {
      name: 'armourBlock', kind: 'body',
      call: (b, st) => armourBlock(b, 'hull', [st.hull, st.hullDark],
        { w: 1.2, h: 0.9, d: 1.8, c: 0.14 }),
    },
    {
      name: 'beltedHull', kind: 'body',
      call: (b, st) => beltedHull(b, 'hull', [st.hull, st.trim],
        { stations: STA, belt: 0.10, beltAt: 0.0, trim: 0.15, bands: 1 }),
    },
    {
      name: 'armourCourse (on-station)', kind: 'body',
      // END-BAND REGRESSION — same test as Freehold patchCourse (on-station).
      call: (b, st) => armourCourse(b, 'hull', [st.trim, st.hull],
        { stations: STA, from: z0, to: z1, rows: 2, cols: 1 }),
    },
    {
      name: 'armourCourse (mid-band)', kind: 'body',
      call: (b, st) => armourCourse(b, 'hull', [st.trim, st.hull],
        { stations: STA, from: -1.2, to: 1.8, rows: 2, cols: 1 }),
    },
    {
      name: 'armouredSpine', kind: 'body',
      call: (b, st) => armouredSpine(b, 'hull', [st.hull, st.hullDark, st.trim],
        { from: -2.0, to: 2.0, w: 1.0, h: 0.7, bay: 2.0, chord: 0.42, brace: 0.26, plate: 0.3 }),
    },
    // ── motifs ───────────────────────────────────────────────────────────────
    {
      name: 'citadelArmour', kind: 'motif',
      call: (b, st) => citadelArmour(b, st,
        { w: 2.0, h: 1.5, d: 0.5, rows: 3, cols: 2, courses: 2, seed: 1 }),
    },
    {
      name: 'wedgeProw', kind: 'motif',
      call: (b, st) => wedgeProw(b, st, { w: 1.6, h: 1.0, len: 1.8, seed: 1 }),
    },
    {
      name: 'weaponBlock', kind: 'motif',
      call: (b, st) => weaponBlock(b, st, { w: 0.5, h: 0.4, d: 1.2, barrels: 2, seed: 1 }),
    },
    {
      name: 'recognitionBand', kind: 'motif',
      call: (b, st) => recognitionBand(b, st, { len: 2.0 }),
    },
    {
      name: 'serviceHonour', kind: 'motif',
      call: (b, st) => serviceHonour(b, st, { lit: true }),
    },
    {
      name: 'rescueLock', kind: 'motif',
      call: (b, st) => rescueLock(b, st, { len: 0.5 }),
    },
    {
      name: 'pointDefence', kind: 'motif',
      call: (b, st) => pointDefence(b, st, { r: 0.3, h: 0.3, seed: 1 }),
    },
    {
      name: 'commandStep', kind: 'motif',
      call: (b, st) => commandStep(b, st, { w: 2.0, h: 1.2, len: 1.5, seed: 1 }),
    },
    {
      name: 'containerBlock', kind: 'motif',
      call: (b, st) => containerBlock(b, st, { rows: 3, cols: 2, seed: 1 }),
    },
    {
      name: 'driveBattery', kind: 'motif',
      call: (b, st) => driveBattery(b, st,
        { w: 1.6, h: 1.2, len: 1.4, throats: 4, seed: 1 }),
    },
  ];
}

/**
 * Red Ledger call table.
 *
 * Station list constructs (capturedHull, plunderCourse, tallyBand) receive a
 * representative 5-station cutter-scale hull section. plunderCourse gets two
 * entries: one with from/to landing exactly on station z values (the end-band
 * regression) and one clipped mid-band. weaponShutter gets two entries: closed
 * and open=0.8, so both the shutter-panel and the revealed cavity geometry are
 * exercised.
 */
function redledgerCallTable(body, motifs) {
  const {
    capturedHull, plunderCourse, ramProw, grappleArm,
    haulSpine, breachTube, vaultBlock, tallyBand,
  } = body;
  const {
    tallyGrooves, weaponShutter, commsReceiver, lockBox,
    clampJaw, magClamp, winchDrum, transferLock,
    countingHouse, capturedDrive, reverseThruster, boardingSpike,
    prizeCradle, seizedContainer, workLampRun, crewWalk,
  } = motifs;

  // Representative 5-station cutter-scale hull — same extents as the other tables
  // so AABB checks use comparable geometry. c=0.3 matches Freehold rounding.
  const STA = [
    { z: -3.0, w: 0.80, h: 0.60, c: 0.3 },
    { z: -1.5, w: 1.40, h: 0.90, c: 0.3 },
    { z:  0.0, w: 1.60, h: 1.00, c: 0.3 },
    { z:  1.5, w: 1.50, h: 0.90, c: 0.3 },
    { z:  3.0, w: 1.00, h: 0.70, c: 0.3 },
  ];
  // Exact station z endpoints — the end-band regression entries must use these.
  const z0 = STA[0].z;
  const z1 = STA[STA.length - 1].z;

  return [
    // ── body constructs ──────────────────────────────────────────────────────
    {
      name: 'capturedHull', kind: 'body',
      // Multi-donor hull with two seam bands at the donor boundaries.
      // Seams exercise the proud-strap geometry path that the wave-2 Ferrous
      // reference proved was silently dropped on plain hull section boundaries.
      call: (b, st) => capturedHull(b, 'hull',
        [st.hull, st.accent, st.patch[2]],
        { stations: STA, seams: [-1.5, 1.5], seed: 1 }),
    },
    {
      name: 'plunderCourse (on-station)', kind: 'body',
      // END-BAND REGRESSION. from and to land exactly on station[0].z and
      // station[4].z. A strict interior inequality drops both end bands.
      // plunderCourse must use a non-strict (>=/<= ) comparison on station z.
      call: (b, st) => plunderCourse(b, 'hull',
        [st.accent, st.trim],
        { stations: STA, from: z0, to: z1, rows: 2, cols: 1, seed: 1 }),
    },
    {
      name: 'plunderCourse (mid-band)', kind: 'body',
      // Mid-band clipping: from/to fall between stations. Tests sectionAt
      // interpolation and clipping arithmetic independently of the end-band path.
      call: (b, st) => plunderCourse(b, 'hull',
        [st.patch[0], st.patch[1]],
        { stations: STA, from: -1.2, to: 1.8, rows: 2, cols: 1, seed: 2 }),
    },
    {
      name: 'ramProw', kind: 'body',
      // Pronged boarding prow at the nose (−Z). The shank at +Z must reach far
      // enough back that the prow connects to whatever hull face it mounts on.
      call: (b, st) => ramProw(b, 'hull',
        [st.hull, st.hullDark],
        { w: 0.9, h: 0.7, d: 1.4, tip: 0.25, ribs: 3, shank: 0.35, seed: 1 }),
    },
    {
      name: 'grappleArm', kind: 'body',
      // Multi-knuckle arm with claw. Every knuckle segment must overlap its
      // neighbour; a gap between segments fails the attachment graph.
      call: (b, st) => grappleArm(b, 'hull',
        [st.hull, st.trim],
        { len: 1.8, r: 0.35, knuckles: 2, sweep: 0.3, claw: true, seed: 1 }),
    },
    {
      name: 'haulSpine', kind: 'body',
      // Box-section spine running fore–aft. Braces must overlap both chords;
      // tangent-only contact fails the attachment graph.
      call: (b, st) => haulSpine(b, 'hull',
        [st.hull, st.hullDark],
        { from: -2.0, to: 2.0, w: 0.8, h: 0.5, bays: 4, chord: 0.32, brace: 0.16, seed: 1 }),
    },
    {
      name: 'breachTube', kind: 'body',
      // Breach tube with serrated teeth ring and internal rails. Rails must
      // overlap the tube cylinder; a rail that only grazes the outer surface fails.
      call: (b, st) => breachTube(b, 'hull',
        [st.hull, st.accent],
        { r: 0.8, len: 2.0, teeth: 10, rails: 4, seed: 1 }),
    },
    {
      name: 'vaultBlock', kind: 'body',
      // Armoured vault with hasp lock and strap bands. Straps must be proud
      // of the vault face so they make real contact, not tangency.
      call: (b, st) => vaultBlock(b, 'hull',
        [st.hull, st.hullDark],
        { w: 1.2, h: 0.9, d: 1.4, hasp: true, straps: 2, seed: 1 }),
    },
    {
      name: 'tallyBand', kind: 'body',
      // Tally ring at z=0 (midship). The band must project outward so it
      // overlaps the hull cross-section it circles — a flush ring is tangent only.
      call: (b, st) => tallyBand(b, 'hull',
        [st.accent, st.trim],
        { stations: STA, z: 0.0, marks: 5, seed: 1 }),
    },
    // ── motifs ───────────────────────────────────────────────────────────────
    {
      name: 'tallyGrooves', kind: 'motif',
      // Score marks cut into the hull. The backing plate must connect the
      // groove bars; isolated bars fail the attachment graph.
      call: (b, st) => tallyGrooves(b, st, { count: 6, len: 0.5, pitch: 0.16, seed: 1 }),
    },
    {
      name: 'weaponShutter (closed)', kind: 'motif',
      // Shutter closed — the panel must overlap its frame. A panel that
      // sits flush in a recess without a shank behind it will be lonely.
      call: (b, st) => weaponShutter(b, st, { w: 0.7, h: 0.4, open: 0, seed: 1 }),
    },
    {
      name: 'weaponShutter (open)', kind: 'motif',
      // Shutter open — the cavity geometry is exposed. Both the retracted panel
      // and the revealed interior box must remain attached to the frame.
      call: (b, st) => weaponShutter(b, st, { w: 0.7, h: 0.4, open: 0.8, seed: 2 }),
    },
    {
      name: 'commsReceiver', kind: 'motif',
      // Dish + mast; mast must reach back past z=0 so the dish is not lonely.
      call: (b, st) => commsReceiver(b, st, { r: 0.9, depth: 0.4, tilt: 0, seed: 1 }),
    },
    {
      name: 'lockBox', kind: 'motif',
      // Lock box with hasp and shackle. Shackle must overlap the body.
      call: (b, st) => lockBox(b, st, { w: 0.55, h: 0.45, d: 0.7, seed: 1 }),
    },
    {
      name: 'clampJaw', kind: 'motif',
      // Three-jaw clamp — jaws must overlap the hub; a jaw that only
      // touches tangentially at its root fails the contact check.
      call: (b, st) => clampJaw(b, st, { r: 0.5, jaws: 3, open: 0.4, seed: 1 }),
    },
    {
      name: 'magClamp', kind: 'motif',
      // Magnetic clamp pad. Ring and pad must share a face region.
      call: (b, st) => magClamp(b, st, { r: 0.45, seed: 1 }),
    },
    {
      name: 'winchDrum', kind: 'motif',
      // Winch drum + frame. Frame must reach behind the drum so the
      // combined assembly connects to whatever it mounts on.
      call: (b, st) => winchDrum(b, st, { r: 0.4, len: 0.7, seed: 1 }),
    },
    {
      name: 'transferLock', kind: 'motif',
      // Pressurised collar with cage. Default r = HUMAN.collarR is supplied
      // by the function. The cage bars must overlap the collar ring.
      call: (b, st) => transferLock(b, st, { len: 0.5, caged: true, seed: 1 }),
    },
    {
      name: 'countingHouse', kind: 'motif',
      // Multi-bay operations block (the Ledger's command core). Window rows must
      // overlap the hull box, not float in the gap between modules.
      call: (b, st) => countingHouse(b, st, { w: 2.0, h: 1.4, d: 2.4, rows: 2, seed: 1 }),
    },
    {
      name: 'capturedDrive', kind: 'motif',
      // Captured enemy drive housing; i=0 selects the first donor colour slot.
      // The throat nozzles (lights channel) and the housing (hull) must overlap.
      call: (b, st) => capturedDrive(b, st,
        { w: 1.4, h: 1.0, len: 1.6, throats: 2, i: 0, seed: 1 }),
    },
    {
      name: 'reverseThruster', kind: 'motif',
      // Two retro nozzles on a shared mount. Nozzles without a mount are all
      // lonely; the mount must connect them.
      call: (b, st) => reverseThruster(b, st, { r: 0.3, count: 2, seed: 1 }),
    },
    {
      name: 'boardingSpike', kind: 'motif',
      // Penetrating spike with shank. The shank must reach back past the
      // mounting face; a spike body that starts at z=0 floats on its own.
      call: (b, st) => boardingSpike(b, st, { len: 1.8, r: 0.22, seed: 1 }),
    },
    {
      name: 'prizeCradle', kind: 'motif',
      // Open cradle for a captured craft. Approach lamps must be seated on
      // the cradle arms; a lamp that only touches tangentially at the arm tip
      // fails the attachment check.
      call: (b, st) => prizeCradle(b, st, { w: 1.4, d: 2.2, craft: true, seed: 1 }),
    },
    {
      name: 'seizedContainer', kind: 'motif',
      // Captured cargo container with donor-colour markings (i=0). The markings
      // must overlap the container box, not float in front of it.
      call: (b, st) => seizedContainer(b, st, { w: 2.0, h: 1.6, d: 2.8, i: 0, seed: 1 }),
    },
    {
      name: 'workLampRun', kind: 'motif',
      // Linear amber lamp run along a working corridor. Lamp plates must sit
      // on a backing rail that spans the full run; isolated plates are lonely.
      call: (b, st) => workLampRun(b, st,
        { ax: -1.5, ay: 0.6, az: -2.0, bx: -1.5, by: 0.6, bz: 2.0, seed: 1 }),
    },
    {
      name: 'crewWalk', kind: 'motif',
      // Grated walkway with railing and lamp posts. The railing must overlap
      // the deck plate — a wrong y-offset makes the railing lonely.
      call: (b, st) => crewWalk(b, st, { w: 2.0, d: 1.2, rail: true, lamps: 2, seed: 1 }),
    },
  ];
}

// ── Single-construct probe ────────────────────────────────────────────────────

/**
 * Build one construct in isolation and run every assertion from the contract.
 *
 * Returns a result object; does not print anything (the caller prints).
 * A thrown error is caught and turned into a FAIL so the loop continues to the
 * next construct rather than crashing the whole report.
 */
function probeOne(entry, allowedSet, st) {
  const b = detailBuilder({ track: true });
  const fails = [];
  const ok = (cond, msg) => { if (!cond) fails.push(msg); };

  // Build.
  let buildErr = null;
  try {
    entry.call(b, st);
  } catch (e) {
    buildErr = e;
    fails.push(`threw during build: ${e.message}`);
  }

  // parts() MUST be called before build().
  const parts = b.parts();

  // Merge. An unclosed push() also throws here.
  let geos = {};
  if (!buildErr) {
    try {
      geos = b.build();
    } catch (e) {
      fails.push(`threw during build(): ${e.message}`);
      buildErr = e;
    }
  }

  if (buildErr) {
    return {
      entry, nParts: parts.length, hullVerts: 0, litVerts: 0, extents: null,
      fails, parts, geos: {},
      att: { lonely: 0, attachedPct: 0, lonelyList: [], strayList: [] },
      contact: { attachedPct: 0, components: 0, islands: [] },
      cubes: [],
    };
  }

  // 1. Channel discipline — exactly 'hull' and/or 'lights'. Anything else is a
  //    channel name that came from a swapped argument or a colour integer passed
  //    where a channel string was expected.
  const extraCh = Object.keys(geos).filter((k) => k !== 'hull' && k !== 'lights');
  ok(
    extraCh.length === 0,
    `extra channels: ${extraCh.map((k) => JSON.stringify(k)).join(', ')}`
    + ' — channel and colour args to box() may be swapped',
  );

  // 2. At least one part emitted. A silent empty build usually means a required
  //    arg was missing (windowRow called positionally) or from/to clipped empty.
  ok(parts.length > 0, 'emitted no parts — check required arguments and from/to range');

  // 3. No NaN vertex colour. setHex(NaN) bakes NaN through bitwise coercion to
  //    0 (#000000), so NaN in the raw float attribute means a code path set RGB
  //    directly with a non-finite value. Both paths are caught.
  for (const [ch, geo] of Object.entries(geos)) {
    const col = geo.getAttribute('color');
    if (!col) { ok(false, `${ch} has no color attribute`); continue; }
    let nanIdx = -1;
    for (let i = 0; i < col.count; i++) {
      if (
        !Number.isFinite(col.getX(i))
        || !Number.isFinite(col.getY(i))
        || !Number.isFinite(col.getZ(i))
      ) { nanIdx = i; break; }
    }
    ok(nanIdx < 0,
      `${ch}: NaN vertex colour at index ${nanIdx} — a hex argument is not a number`);
  }

  // 4. No pure-black (#000000) vertex colour. setHex(NaN) bakes to 0x000000 via
  //    bitwise coercion (NaN | 0 = 0). An out-of-range weather() index (e.g.
  //    weather(hex, 4) where SHADES[4] is undefined) produces the same result.
  for (const [ch, geo] of Object.entries(geos)) {
    const blacks = [...hexesOf(geo)].filter((h) => h === 0);
    ok(blacks.length === 0,
      `${ch}: pure-black (#000000) vertex colour — likely a NaN hex baked to 0 `
      + 'via bitwise coercion or weather() called with index outside 0..3');
  }

  // 5. Hull palette — every hex must be in the faction's allowed ladder.
  if (geos.hull) {
    const strays = [...hexesOf(geos.hull)].filter((h) => !allowedSet.has(h));
    ok(
      strays.length === 0,
      `hull palette strays: ${strays.slice(0, 4).map((x) => '#' + x.toString(16).padStart(6, '0')).join(', ')}`,
    );
  }

  // 6. Lights near-white — every sRGB channel >= 0.6 (153/255 in 0-255 space).
  //    The additive material multiplies vertex colour by the faction glow tint;
  //    a dim vertex colour produces a black-body contribution instead of light.
  if (geos.lights) {
    const dim = [...hexesOf(geos.lights)]
      .filter((hex) => Math.min((hex >> 16) & 255, (hex >> 8) & 255, hex & 255) / 255 < 0.6);
    ok(
      dim.length === 0,
      `lights not near-white (min channel < 0.6): `
      + dim.slice(0, 4).map((x) => '#' + x.toString(16).padStart(6, '0')).join(', '),
    );
  }

  // 7. No exact 1×1×1 cube. THREE defaults every omitted box/cyl dimension to 1.
  //    An exact (1.000, 1.000, 1.000) extent in the tracked AABB is never
  //    authored intentionally — HUMAN window parts are far smaller and hull
  //    volumes are irregular.
  const cubes = parts.filter(
    (p) => [0, 1, 2].every((a) => Math.abs((p.max[a] - p.min[a]) - 1) < 1e-4),
  );
  ok(cubes.length === 0,
    `${cubes.length} exact 1×1×1 cube(s) — a box/cyl call is missing a dimension arg`);

  // 8. Attachment — every part must overlap at least one other part.
  //    lonely === 0 and attachedPct === 100 means the AABB overlap graph is
  //    fully connected; any part that only touches tangentially, or floats in
  //    space, shows here.
  const att = analyseAttachment(parts, TOUCH_EPS);
  ok(
    att.lonely === 0 && att.attachedPct === 100,
    `attachment lonely=${att.lonely} boxAttached=${att.attachedPct.toFixed(1)}%`,
  );

  // 9. Contact grid — fine occupancy check confirms the merged geometries share
  //    surface samples, not just overlapping bounding boxes.
  const geoArr = Object.values(geos).filter(Boolean);
  const contact = analyseContact(geoArr, CONTACT_CELL);
  ok(
    contact.attachedPct === 100,
    `contact grid ${contact.attachedPct.toFixed(1)}% — ${contact.components} component(s)`,
  );

  // Measure hull extents for the summary line.
  const hullM = geos.hull ? measure(geos.hull) : null;
  const litM  = geos.lights ? measure(geos.lights) : null;

  return {
    entry,
    nParts:    parts.length,
    hullVerts: hullM ? hullM.verts : 0,
    litVerts:  litM  ? litM.verts  : 0,
    extents:   hullM ? { x: hullM.spanX, y: hullM.spanY, z: hullM.spanZ } : null,
    fails,
    parts,
    geos,
    att,
    contact,
    cubes,
  };
}

// ── Main loop ─────────────────────────────────────────────────────────────────

const allowedSet = allowedHull(loadedFaction);
const st = FACTION_STYLE[loadedFaction];

// Call-table registry — one entry per supported faction. Other factions fail
// with a clear message rather than a destructuring error inside the table.
const CALL_TABLES = {
  freehold: freeholdCallTable,
  ferrous:  ferrousCallTable,
  redledger: redledgerCallTable,
};
const SUPPORTED_FACTIONS = new Set(Object.keys(CALL_TABLES));
if (!SUPPORTED_FACTIONS.has(loadedFaction)) {
  console.error(
    `probe-motifs: no call table defined for '${loadedFaction}'. `
    + `Supported: ${[...SUPPORTED_FACTIONS].join(', ')}. Add a *callTable() function to extend.`,
  );
  process.exit(1);
}
const callTable = CALL_TABLES[loadedFaction](bodyMod, motifsMod);

const fallbackNote = loadedFaction !== faction
  ? ` (target was ${faction}; fell back to ${loadedFaction})`
  : '';

console.log(`\nprobe-motifs: ${loadedFaction}${fallbackNote} — ${callTable.length} constructs`);
console.log('─'.repeat(80));

let nFail = 0;
const NAME_W = 30;

for (const entry of callTable) {
  const r = probeOne(entry, allowedSet, st);

  const extStr = r.extents
    ? `X=${r.extents.x.toFixed(2)} Y=${r.extents.y.toFixed(2)} Z=${r.extents.z.toFixed(2)}`
    : 'X=n/a Y=n/a Z=n/a';

  const status = r.fails.length === 0 ? 'PASS' : 'FAIL';

  // One summary line per construct — parseable by grep.
  console.log(
    `  ${entry.name.padEnd(NAME_W)}`
    + ` parts=${String(r.nParts).padStart(3)}`
    + ` hull=${String(r.hullVerts).padStart(6)}`
    + ` lit=${String(r.litVerts).padStart(5)}`
    + `  ${extStr}  ${status}`,
  );

  // Failure reasons — each names the construct and reason on one line so six
  // authors running concurrent builds can grep for FAIL without ambiguity.
  for (const msg of r.fails) {
    console.log(`    FAIL  ${entry.name}: ${msg}`);
  }

  // Auxiliary blame lines for attachment failures.
  for (const line of r.att.lonelyList)  console.log(`      LONELY   ${line}`);
  for (const line of r.att.strayList)   console.log(`      BOXSTRAY ${line}`);

  // Contact-grid islands name the floating geometry's world-space box, then
  // blame the tracked parts that fall inside it so an author can find the call.
  for (const isl of r.contact.islands) {
    console.log(`      FLOATING ${isl.label}`);
    for (const line of blameIsland(r.parts, isl)) {
      console.log(`               ${line}`);
    }
  }

  // Cube blame lines name the call site so the missing dimension is obvious.
  for (const p of r.cubes.slice(0, 4)) {
    console.log(`      CUBE     ${p.channel} @ ${p.site}`);
  }

  if (r.fails.length > 0) nFail++;
}

console.log('─'.repeat(80));

if (nFail === 0) {
  console.log('probe-motifs: ALL MOTIFS CLEAN');
} else {
  console.log(`probe-motifs: ${nFail} FAILED`);
}

process.exitCode = nFail === 0 ? 0 : 1;
