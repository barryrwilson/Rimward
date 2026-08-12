/**
 * Ferrous Hegemony — readiness made monumental.
 *
 * Brief: docs/FactionShipDesignBible.md §4.2. Charter: src/game/ship-scale.js.
 * Plan: docs/FactionShipRebuildPlan.md.
 *
 * FIRST READ: disciplined military mass, exact symmetry, protected citizens
 * behind a hard line. A Ferrous ship carries a blunt reinforced prow, layered
 * citadel armour, formally paired weapon housings, restrained crimson
 * recognition bands and small brass service honours. Rescue capability is
 * present on every class, because this state believes it is humanity's shield.
 * Symmetry is doctrine, not styling: every side-mounted part is mirrored.
 *
 * THIS FILE IS A BARREL. The family is six separately authored body plans:
 *
 *   ./ferrous/body.js       the shape core — armour blocks, belts, courses, spine
 *   ./ferrous/motifs.js     the equipment and surface language
 *   ./ferrous/light.js      picket — a solid wedge, a doorstop with mass aft
 *   ./ferrous/ace.js        honour interceptor — a dart whose stern forks into twin drives
 *   ./ferrous/cutter.js     patrol launch — a stout tug with a boarding notch cut into the bow
 *   ./ferrous/heavy.js      bastion gunship — a hammerhead ziggurat behind a deep wedge prow
 *   ./ferrous/frigate.js    line escort — a long spine, a tower above and a hangar below
 *   ./ferrous/freighter.js  fleet logistics carrier — an articulated armoured train
 *
 * WHY IT IS SPLIT, and why the shape core comes before the motifs, is recorded
 * at the top of src/systems/ships/veridian.js and in the plan's §2 "Body plans
 * first, motifs second". The short version: a motif decorates a body, it cannot
 * make one, and six classes that sweep the same constant section are one shape
 * six times no matter how much greeble hangs off it. Anatomy is the unit of
 * work, so anatomy is the unit of the file layout.
 *
 * The generic sweep machinery is shared with every other rebuilt faction in
 * src/systems/ships/loft.js; ./ferrous/body.js adds only what is Hegemony:
 * blunt chamfers, layered armour belts, ranged armour courses and the
 * armoured logistics spine.
 *
 * The runtime contract is unchanged: `ferrousShip` is
 * `{ light, ace, cutter, heavy, frigate, freighter }`, each `{ glowZ, build }`,
 * writing exactly the `hull` and `lights` channels, nose −Z and stern +Z.
 */

import { ferrousLight } from './ferrous/light.js';
import { ferrousAce } from './ferrous/ace.js';
import { ferrousCutter } from './ferrous/cutter.js';
import { ferrousHeavy } from './ferrous/heavy.js';
import { ferrousFrigate } from './ferrous/frigate.js';
import { ferrousFreighter } from './ferrous/freighter.js';

export const ferrousShip = {
  light: ferrousLight,
  ace: ferrousAce,
  cutter: ferrousCutter,
  heavy: ferrousHeavy,
  frigate: ferrousFrigate,
  freighter: ferrousFreighter,
};
