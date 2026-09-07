import { buildSmallShip } from './small-ships.js';
import { buildLargeShip } from './large-ships.js';

export const ships = [
  {
    id: 'player', role: 'Player · Living Hull', name: 'Veilray', creature: 'Manta ray', accent: '#88dece',
    description: 'An optional companion study for the player hull: one broad living veil, folded cephalic lobes and a trailing sensory whip. The existing player sculpt remains the family reference, not a template copied onto the fleet.',
    changes: ['A continuous body-to-wing surface replaces attached fin shapes.', 'Curled sensory lobes and a soft belly preserve the gentle manta ancestry.', 'Light follows the wing margins instead of covering the body in luminous webbing.'],
  },
  {
    id: 'light', role: 'Light · Young wayfinder', name: 'Glassfin', creature: 'Pelagic ribbonfish', accent: '#97ead7',
    description: 'Revised after review: a young pelagic organism with one flowing fish body, a long dorsal ribbon and a forked swimming tail. Low-set pectorals and flush sensory folds replace the rejected insect-like wings, separate head and antennae.',
    changes: ['A continuous prow, trunk and caudal peduncle replace the bulbous head-and-body assembly.', 'A dorsal ribbon, low swept pectorals and a forked vertical tail establish a marine silhouette.', 'Pearl-to-indigo tissue and restrained lateral-line light replace the antennal stalks and petal-wing read.'],
  },
  {
    id: 'ace', role: 'Ace · Swift-bonded hunter', name: 'Needlewake', creature: 'Reef squid', accent: '#94b7f0',
    description: 'A fast, narrow-bodied adult whose long mantle and swept, tapering arms carry the speed read. An undulating tissue skirt replaces the hard fins of the current squid-inspired hull.',
    changes: ['Curving arms with thick living roots replace straight rod-like tentacles.', 'A continuous mantle skirt removes abrupt fin-to-body transitions.', 'Sparse nerve accents emphasize the direction of travel without hiding the sculpt.'],
  },
  {
    id: 'cutter', role: 'Cutter · Social guardian', name: 'Blue Pilgrim', creature: 'Blue glaucus sea slug', accent: '#83cceb',
    description: 'A maneuverable guardian with three paired fans of soft cerata. Forward appendages cup inward like protective hands; the six-lobed silhouette is distinct from both the player manta and the swift hunter.',
    changes: ['Branching, tapered tissue fans replace the hammerhead’s rigid planes.', 'Cupped forward appendages suggest rescue and holding, not mauling.', 'A sinuous trunk and rounded roots make the body feel grown as one organism.'],
  },
  {
    id: 'heavy', role: 'Heavy · Shieldback', name: 'Velvet Bastion', creature: 'Cuttlefish', accent: '#b4a2e4',
    description: 'A mature defender built around a broad, dense muscular mantle. A flowing fin skirt shields the flanks, while a gathered arm crown keeps the front calm and intelligent rather than armored or weaponized.',
    changes: ['A substantial mantle replaces the separate armor-like dorsal masses.', 'A rippling tissue skirt replaces flat pectoral slabs.', 'Pigment and restrained flank lights reveal the volume instead of competing with it.'],
  },
  {
    id: 'frigate', role: 'Frigate · Elder guardian', name: 'Cathedral', creature: 'Deep-sea jellyfish', accent: '#a0cfe7',
    description: 'An elder drifting beneath a scalloped living bell, with sheltered inner folds and long trailing sensory filaments. Radial anatomy creates a calm, unfamiliar spaceborne form rather than a barrel with tentacles attached.',
    changes: ['A scalloped bell and inner tissue folds form one coordinated body plan.', 'Long curved filaments replace the current straight, evenly splayed arm read.', 'A few luminous canals reveal the bell structure without a glowing wireframe.'],
  },
  {
    id: 'freighter', role: 'Freighter · Gardenback', name: 'Orchard', creature: 'Reef-bearing leviathan', accent: '#79cdbd',
    description: 'Revised after review: a mature living carrier whose back is a substantial reef habitat. Folded garden basins grow from the body itself, supporting layered fan canopies, fleshy branching corals and ribbon fronds. Sheltered pockets nest within the living folds rather than appearing as manufactured ports.',
    changes: ['Large reef gardens change the silhouette and occupy the back, replacing the sparse decorative sprouts.', 'Terraced basins, their grown rims and nursery shelters are shaped into the body instead of attached as caps or repeated dark portholes.', 'Broad cradle-like shielding fins and a flowing tail support the read of a colossal living migration vessel.'],
  },
];

export function buildConcept(id) {
  if (!ships.some((ship) => ship.id === id)) throw new Error(`Unknown ship concept: ${id}`);
  const object = ['player', 'light', 'ace', 'cutter'].includes(id)
    ? buildSmallShip(id)
    : buildLargeShip(id);
  object.name = `beautiful-concept-${id}`;
  return object;
}
