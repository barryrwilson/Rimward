/**
 * The Freehold Compact — a home that happens to fly.
 *
 * Brief: docs/FactionShipDesignBible.md §4.3. Charter: src/game/ship-scale.js.
 * Plan: docs/FactionShipRebuildPlan.md.
 *
 * FIRST READ: maintained by neighbours, repaired for decades, useful before
 * beautiful, warm without being quaint. A Compact ship is donated hull sections
 * spliced onto a sound frame: barn red beside weathered cream beside faded
 * blue, greenhouses and water tanks carried outside, tools and rescue gear
 * where a crew can reach them, and warm windows wherever a person lives.
 * Patchwork is HISTORY, not neglect — the asymmetry says a different yard
 * fitted that module, never that the ship is damaged or improvised.
 *
 * THIS FILE IS A BARREL. The family is six separately authored body plans:
 *
 *   ./freehold/body.js       the shape core — splices, patch courses, the sound
 *                            frame, greenhouse and tank volumes
 *   ./freehold/motifs.js     the equipment and surface language
 *   ./freehold/light.js      family runabout — a glazed cab in front of an open work deck
 *   ./freehold/ace.js        local legend — the runabout rebuilt slim, waisted, deck deleted
 *   ./freehold/cutter.js     lane-keeper — a broad rescue bow under a boxy midships house
 *   ./freehold/heavy.js      militia monitor — bolt-on armour around an intact civilian core
 *   ./freehold/frigate.js    convoy keeper — one repaired keel carrying several yards' modules
 *   ./freehold/freighter.js  mobile homestead — a travelling neighbourhood on a spine
 *
 * WHY IT IS SPLIT, and why the shape core comes before the motifs, is recorded
 * at the top of src/systems/ships/veridian.js and in the plan's §2 "Body plans
 * first, motifs second". Wave 47 authored this faction as ONE builder called at
 * six sizes — the shortcut this wave retires. A homesteader fleet is not one
 * boat scaled six times: the runabout, the stripped ace, the rescue launch, the
 * armoured monitor, the community escort and the homestead are six anatomies
 * that happen to share a paint locker and a way of bolting things on.
 *
 * The generic sweep machinery is shared with every other rebuilt faction in
 * src/systems/ships/loft.js; ./freehold/body.js adds only what is Compact:
 * spliced donor sections, replaced-panel courses, the visible sound frame, and
 * the greenhouse and tank volumes a homestead carries in the open.
 *
 * The runtime contract is unchanged: `freeholdShip` is
 * `{ light, ace, cutter, heavy, frigate, freighter }`, each `{ glowZ, build }`,
 * writing exactly the `hull` and `lights` channels, nose −Z and stern +Z.
 */

import { freeholdLight } from './freehold/light.js';
import { freeholdAce } from './freehold/ace.js';
import { freeholdCutter } from './freehold/cutter.js';
import { freeholdHeavy } from './freehold/heavy.js';
import { freeholdFrigate } from './freehold/frigate.js';
import { freeholdFreighter } from './freehold/freighter.js';

export const freeholdShip = {
  light: freeholdLight,
  ace: freeholdAce,
  cutter: freeholdCutter,
  heavy: freeholdHeavy,
  frigate: freeholdFrigate,
  freighter: freeholdFreighter,
};
