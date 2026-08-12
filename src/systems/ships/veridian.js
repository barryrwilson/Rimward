/**
 * Veridian Combine — ownership made physical.
 *
 * Brief: docs/FactionShipDesignBible.md §4.1. Charter: src/game/ship-scale.js.
 * Plan: docs/FactionShipRebuildPlan.md.
 *
 * FIRST READ: calm corporate authority, survey precision, modular extraction
 * hardware. A Veridian ship carries serialized, replaceable pressure modules,
 * detachable survey pods, and instruments treated as valuable equipment rather
 * than decoration.
 *
 * THIS FILE IS A BARREL. The family is six separately authored body plans:
 *
 *   ./veridian/body.js       the shape core — stations swept into a hull
 *   ./veridian/motifs.js     the equipment and surface language
 *   ./veridian/light.js      claim scout — a sensor head with a tail
 *   ./veridian/ace.js        patent demonstrator — a seamless teardrop that forks
 *   ./veridian/cutter.js     inspection launch — a flat blade with a bow ring
 *   ./veridian/heavy.js      claim enforcement — an anvil, widest at the prow
 *   ./veridian/frigate.js    survey command — twin keels under a citadel
 *   ./veridian/freighter.js  extraction carrier — an open lattice and a rack
 *
 * WHY IT IS SPLIT. The first version of this family was one 1,100-line file in
 * which all six classes called `hexSpine` and then hung motifs on the resulting
 * cylinder. Every review said the same thing: the classes are the same shape
 * wearing different greeble. The bible forbids exactly that ("Do not make one
 * faction hull and uniformly scale it into six classes… each must have anatomy
 * appropriate to its job"), and no amount of extra detail on a tube fixes it.
 *
 * Anatomy is now the unit of work, so anatomy is the unit of the file layout:
 * one class, one file, one station list read before anything is decorated.
 * Family resemblance comes from the SHARED MOTIFS and the chamfered
 * pressure-vessel cross-section they all sweep; class identity comes from where
 * the mass is. `hexSpine` is gone and is not coming back.
 *
 * The runtime contract is unchanged: `veridianShip` is
 * `{ light, ace, cutter, heavy, frigate, freighter }`, each `{ glowZ, build }`,
 * writing exactly the `hull` and `lights` channels, nose −Z and stern +Z.
 */

import { veridianLight } from './veridian/light.js';
import { veridianAce } from './veridian/ace.js';
import { veridianCutter } from './veridian/cutter.js';
import { veridianHeavy } from './veridian/heavy.js';
import { veridianFrigate } from './veridian/frigate.js';
import { veridianFreighter } from './veridian/freighter.js';

export const veridianShip = {
  light: veridianLight,
  ace: veridianAce,
  cutter: veridianCutter,
  heavy: veridianHeavy,
  frigate: veridianFrigate,
  freighter: veridianFreighter,
};
