/**
 * The Red Ledger — violence with terms and receipts.
 *
 * Brief: docs/FactionShipDesignBible.md §4.4. Charter: src/game/ship-scale.js.
 * Plan: docs/FactionShipRebuildPlan.md.
 *
 * FIRST READ: captured hardware reorganized into a deliberate predatory
 * machine. A Ledger ship is other people's hulls, cut apart and re-welded into
 * something that grasps: long boarding prows, visible clamps and grapples,
 * dark iron under tarnished copper, dried-red tally divisions cut where the
 * crew can count them, amber work light. The repairs are scarred but
 * PURPOSEFUL, and the asymmetry says "this part was taken", never "this ship
 * is broken". The Ledger is organized: it counts, it collects, it issues
 * receipts.
 *
 * THIS FILE IS A BARREL. The family is six separately authored body plans:
 *
 *   ./redledger/body.js       the shape core — captured-section hulls, plunder
 *                             courses, the ram, grapple arms, the haulage
 *                             spine, the breaching tube, vaults, tally bands
 *   ./redledger/motifs.js     the equipment and surface language
 *   ./redledger/light.js      account runner — a needle under an oversized dish
 *   ./redledger/ace.js        collector — a low blade with mismatched captured drives
 *   ./redledger/cutter.js     boarding talon — forked arms around a breaching tube
 *   ./redledger/heavy.js      tribute raider — a hammer built around a ram
 *   ./redledger/frigate.js    clan command ship — three zones on one keel
 *   ./redledger/freighter.js  tribute barge — an armoured train of seized cargo
 *
 * WHY IT IS SPLIT, and why the shape core comes before the motifs, is recorded
 * at the top of src/systems/ships/veridian.js and in the plan's §2 "Body plans
 * first, motifs second". Wave 47 authored this faction as one builder called at
 * six sizes — the shortcut waves 1-3 retired. A raiding clan's fleet is not one
 * boat scaled six times: the spotter, the collector, the boarding talon, the
 * tribute raider, the clan command ship and the tribute barge are six anatomies
 * that share a paint locker, a welding habit and a way of taking things.
 *
 * The generic sweep machinery is shared with every other rebuilt faction in
 * src/systems/ships/loft.js; ./redledger/body.js adds only what is Ledger:
 * seized sections welded at visible beads, scarred plate courses, the ram, the
 * grasping arm, the haulage spine, the breaching tube, the ransom vault and the
 * tally band.
 *
 * The runtime contract is unchanged: `redledgerShip` is
 * `{ light, ace, cutter, heavy, frigate, freighter }`, each `{ glowZ, build }`,
 * writing exactly the `hull` and `lights` channels, nose −Z and stern +Z.
 *
 * NEVER inline a class entry here. During wave 4 an author replaced the ace and
 * freighter imports with placeholder objects carrying an empty `build()`; both
 * sculpts then measured as "no hull chunk" in the fleet harnesses while
 * `probe-class` — which imports the class module directly — still reported PASS.
 * The barrel is imports only.
 */

import { redledgerLight } from './redledger/light.js';
import { redledgerAce } from './redledger/ace.js';
import { redledgerCutter } from './redledger/cutter.js';
import { redledgerHeavy } from './redledger/heavy.js';
import { redledgerFrigate } from './redledger/frigate.js';
import { redledgerFreighter } from './redledger/freighter.js';

export const redledgerShip = {
  light: redledgerLight,
  ace: redledgerAce,
  cutter: redledgerCutter,
  heavy: redledgerHeavy,
  frigate: redledgerFrigate,
  freighter: redledgerFreighter,
};
