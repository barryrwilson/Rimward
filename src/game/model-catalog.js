/**
 * Model catalog — flat, lazy index of every model the game can build.
 *
 * Powers the Models Browser overlay on the RIMWARD start page. Every model
 * is a { id, label, category, faction?, build() } entry; build() is a
 * zero-allocation closure that returns { object, update? } when called.
 *
 * No geometry is allocated at module load — the browser calls build()
 * on-demand and caches the result. All builders are thin wrappers around
 * the systems they pull from (npc.js for ships, station.js, gate.js, etc.).
 *
 * beautiful and unknowables ship factions route to their own grown/energy-
 * field builders inside buildShipMesh, which is why they need no special case.
 */

import { buildShipMesh, animateShipMesh } from '../systems/npc.js';
import { buildStationModel } from '../systems/station.js';
import { buildGateModel } from '../systems/gate.js';
import { buildLandmarkModel } from '../systems/landmarks.js';
import { buildStarModel, buildPlanetModel, PLANET_SLOT_COUNT } from '../systems/solarsystem.js';
import { buildAsteroidModel } from '../systems/asteroids.js';
import { buildPodModel } from '../game/pods.js';
import { FACTIONS } from './state.js';
import { SHIP_CLASSES } from './state.js';
import { AUTHORED_SYSTEMS } from './authored-systems.js';

export const MODEL_CATEGORIES = ['Ships', 'Stations', 'Gates', 'Landmarks', 'Celestial', 'Props'];

/**
 * @typedef {Object} ModelEntry
 * @property {string}  id        unique stable key
 * @property {string}  label     display name
 * @property {string}  category  one of MODEL_CATEGORIES
 * @property {string}  [faction] faction id when the model has one
 * @property {() => { object: import('three').Object3D,
 *                    update?: (elapsed: number, reducedMotion: boolean) => void }} build
 */

// ---- Ships ----
const FACTION_ORDER = [
  'freehold', 'veridian', 'redledger', 'ferrous', 'gilded',
  'congregation', 'assembly', 'lamplighter', 'independent',
  'hollow', 'beautiful', 'unknowables',
];

const CLASS_ORDER = ['light', 'cutter', 'ace', 'freighter', 'heavy', 'frigate'];

const ships = [];
for (const faction of FACTION_ORDER) {
  for (const classKey of CLASS_ORDER) {
    // Standard bake
    ships.push({
      id: `ship:${faction}:${classKey}`,
      label: `${FACTIONS[faction].name} — ${classKey.charAt(0).toUpperCase() + classKey.slice(1)}`,
      category: 'Ships',
      faction,
      build: () => {
        const object = buildShipMesh(classKey, faction, 'trader');
        return { object, update: (e, rm) => animateShipMesh(object, e, rm) };
      },
    });
    // Pirate bake
    ships.push({
      id: `ship:${faction}:${classKey}:pirate`,
      label: `${FACTIONS[faction].name} — ${classKey.charAt(0).toUpperCase() + classKey.slice(1)} (pirate)`,
      category: 'Ships',
      faction,
      build: () => {
        const object = buildShipMesh(classKey, faction, 'pirate');
        return { object, update: (e, rm) => animateShipMesh(object, e, rm) };
      },
    });
  }
}

// ---- Stations ----
const DETAIL_STATION_FACTIONS = [
  'freehold', 'veridian', 'ferrous', 'redledger', 'gilded',
  'congregation', 'assembly', 'lamplighter', 'independent', 'hollow',
];

const stations = [];
for (const faction of DETAIL_STATION_FACTIONS) {
  stations.push({
    id: `station:${faction}`,
    label: `${FACTIONS[faction].name} Station`,
    category: 'Stations',
    faction,
    build: () => buildStationModel(faction),
  });
}
// Beautiful Ones station
stations.push({
  id: 'station:beautiful',
  label: `${FACTIONS.beautiful.name} Station`,
  category: 'Stations',
  faction: 'beautiful',
  build: () => buildStationModel('beautiful'),
});
// Fallback placeholder sculpt
stations.push({
  id: 'station:placeholder',
  label: 'Placeholder Station',
  category: 'Stations',
  build: () => buildStationModel('unknown_faction_key'),
});

// ---- Gates ----
const gates = [];
for (const faction of FACTION_ORDER) {
  gates.push({
    id: `gate:${faction}`,
    label: `${FACTIONS[faction].name} Gate`,
    category: 'Gates',
    faction,
    build: () => buildGateModel(faction, { hub: false, routes: 1 }),
  });
}
// Hub junction variant
gates.push({
  id: 'gate:lamplighter:hub',
  label: 'Lamplighter Guild Gate — Hub Junction',
  category: 'Gates',
  faction: 'lamplighter',
  build: () => buildGateModel('lamplighter', { hub: true, routes: 3 }),
});

// ---- Landmarks ----
const LANDMARK_KINDS = ['wreck', 'beacon', 'monument', 'anomaly', 'clue'];
const LANDMARK_FACTIONS = ['independent', 'beautiful'];

const landmarks = [];
for (const kind of LANDMARK_KINDS) {
  for (const faction of LANDMARK_FACTIONS) {
    const label = kind.charAt(0).toUpperCase() + kind.slice(1);
    landmarks.push({
      id: `landmark:${kind}:${faction}`,
      label: faction === 'beautiful' ? `${label} (Beautiful Ones)` : label,
      category: 'Landmarks',
      faction,
      build: () => buildLandmarkModel(kind, faction),
    });
  }
}

// ---- Celestial ----
const celestial = [];
const authoredSystemIds = Object.keys(AUTHORED_SYSTEMS);

for (const systemId of authoredSystemIds) {
  celestial.push({
    id: `star:${systemId}`,
    label: `${AUTHORED_SYSTEMS[systemId].name} — Star`,
    category: 'Celestial',
    build: () => buildStarModel(systemId),
  });
  for (let i = 0; i < PLANET_SLOT_COUNT; i++) {
    celestial.push({
      id: `planet:${systemId}:${i}`,
      label: `${AUTHORED_SYSTEMS[systemId].name} — Planet ${i + 1}`,
      category: 'Celestial',
      build: () => buildPlanetModel(systemId, i),
    });
  }
}

// ---- Props ----
const props = [];
const asteroidSeeds = [1, 2, 3, 4];
for (const seed of asteroidSeeds) {
  props.push({
    id: `prop:asteroid:${seed}`,
    label: `Asteroid (seed ${seed})`,
    category: 'Props',
    build: () => buildAsteroidModel(seed),
  });
}
props.push({
  id: 'prop:pod',
  label: 'Cargo Pod',
  category: 'Props',
  build: () => buildPodModel(),
});

// ---- Catalog assembly ----
/** @type {ModelEntry[]} */
export const MODEL_CATALOG = [
  ...ships,
  ...stations,
  ...gates,
  ...landmarks,
  ...celestial,
  ...props,
];

/** id → entry. */
export const MODEL_BY_ID = new Map(MODEL_CATALOG.map((e) => [e.id, e]));
