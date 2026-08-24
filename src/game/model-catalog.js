/**
 * Model catalog — flat, lazy index of every model the game can build.
 * Powers the Models Browser overlay on the RIMWARD start page. Every model
 * is a { id, label, category, faction?, build() | load() } entry. build()
 * returns a model immediately. load() resolves one after its required asset
 * template is ready.
 *
 * No geometry is allocated at module load. The browser calls an entry on
 * demand and caches its resolved model. Builders are thin wrappers around the
 * systems they pull from (npc.js for ships, station.js, gate.js, and others).
 *
 * NPC ship entries load the shared GLB asset templates. Beautiful and
 * Unknowables use the same asset and material path as every other faction.
 */

import * as THREE from 'three';
import { buildShipMesh, animateShipMesh } from '../systems/npc.js';
import { primeShipAsset } from '../systems/ship-assets.js';
import { makeLivingHull, makeVeinTexture } from '../systems/ship.js';
import { buildStationModel } from '../systems/station.js';
import { buildGateModel } from '../systems/gate.js';
import { buildLandmarkModel } from '../systems/landmarks.js';
import { buildStarModel, buildPlanetModel, PLANET_SLOT_COUNT } from '../systems/solarsystem.js';
import { buildAsteroidModel } from '../systems/asteroids.js';
import { buildPodModel } from '../game/pods.js';
import { FACTIONS, ORE_KEYS, COMMODITIES, CONVERGENCE, DEEPENING } from './state.js';
import { CLASS_ORDER } from './ship-scale.js';
import { AUTHORED_SYSTEMS } from './authored-systems.js';

export const MODEL_CATEGORIES = ['Ships', 'Stations', 'Gates', 'Landmarks', 'Celestial', 'Props'];

/**
 * @typedef {Object} ModelEntry
 * @property {string}  id        unique stable key
 * @property {string}  label     display name
 * @property {string}  category  one of MODEL_CATEGORIES
 * @property {string}  [faction] faction id when the model has one
 * @property {() => { object: import('three').Object3D,
 *                    update?: (elapsed: number, reducedMotion: boolean) => void }} [build]
 * @property {() => Promise<{ object: import('three').Object3D,
 *                    update?: (elapsed: number, reducedMotion: boolean) => void }>} [load]
 */

// ---- Ships ----
const FACTION_ORDER = [
  'freehold', 'veridian', 'redledger', 'ferrous', 'gilded',
  'congregation', 'assembly', 'lamplighter', 'independent',
  'hollow', 'beautiful', 'unknowables',
];

// Classes run in CHARTER ORDER — smallest to largest — so the Ships tab reads
// as a size ladder and a reviewer can walk one faction's family in the order
// docs/FactionShipRebuildPlan.md measures it. The old order here was wave 47's
// (light, cutter, ace, freighter, heavy, frigate), which predates the size
// charter and put the freighter fourth, between the ace and the heavy.

const ships = [];
for (const faction of FACTION_ORDER) {
  for (const classKey of CLASS_ORDER) {
    // Standard bake
    ships.push({
      id: `ship:${faction}:${classKey}`,
      label: `${FACTIONS[faction].name} — ${classKey.charAt(0).toUpperCase() + classKey.slice(1)}`,
      category: 'Ships',
      faction,
      load: async () => {
        await primeShipAsset(faction, classKey, 'trader');
        const object = buildShipMesh(classKey, faction, 'trader');
        return { object, update: (e, rm, camera) => animateShipMesh(object, e, rm, camera) };
      },
    });
    // Pirate bake
    ships.push({
      id: `ship:${faction}:${classKey}:pirate`,
      label: `${FACTIONS[faction].name} — ${classKey.charAt(0).toUpperCase() + classKey.slice(1)} (pirate)`,
      category: 'Ships',
      faction,
      load: async () => {
        await primeShipAsset(faction, classKey, 'pirate');
        const object = buildShipMesh(classKey, faction, 'pirate');
        return { object, update: (e, rm, camera) => animateShipMesh(object, e, rm, camera) };
      },
    });
  }
}

// Player ship — the scale anchor (docs/FactionShipRebuildPlan.md §5).
// The GEOMETRY is what the charter measures, so it comes straight from
// ship.js's exported sculpt rather than a copy. The flesh material is
// re-declared here because initShip owns the live one; a shared material would
// be mutated by the game's mood-colour lerp while the browser is showing it.
ships.push({
  id: 'ship:player',
  label: 'Player — Living Hull (scale anchor)',
  category: 'Ships',
  faction: 'beautiful',
  build: () => {
    const { geo } = makeLivingHull();
    const veinTex = makeVeinTexture();
    const fleshMat = new THREE.MeshPhysicalMaterial({
      color: 0x2b2145, // deep violet flesh
      roughness: 0.5,
      metalness: 0.05,
      clearcoat: 0.7, // wet, organic sheen
      clearcoatRoughness: 0.35,
      emissive: 0xffffff,
      emissiveMap: veinTex, // bioluminescent veins
      emissiveIntensity: 0.8,
    });
    const hull = new THREE.Mesh(geo, fleshMat);
    return { object: hull };
  },
});

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
// Unknowables origin — dedicated builder, not DETAIL_STATIONS (Wave 94)
stations.push({
  id: 'station:unknowables',
  label: `${FACTIONS.unknowables.name} Station`,
  category: 'Stations',
  faction: 'unknowables',
  build: () => buildStationModel('unknowables'),
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

for (const sys of Object.values(AUTHORED_SYSTEMS)) {
  for (const lm of sys.landmarks ?? []) {
    landmarks.push({
      id: `landmark:authored:${lm.id}`,
      label: lm.name,
      category: 'Landmarks',
      faction: sys.faction,
      build: () => buildLandmarkModel(lm.kind, sys.faction, lm.id),
    });
  }
}
landmarks.push({
  id: 'landmark:authored:convergence',
  label: CONVERGENCE.site.name,
  category: 'Landmarks',
  faction: 'hollow',
  build: () => buildLandmarkModel('anomaly', 'hollow', CONVERGENCE.site.id),
});
landmarks.push({
  id: 'landmark:authored:deepening',
  label: DEEPENING.site.name,
  category: 'Landmarks',
  faction: 'hollow',
  build: () => buildLandmarkModel('anomaly', 'hollow', DEEPENING.site.id),
});

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
// Wave 51: one prop per ORE_TYPES key instead of four seed-varied rawOre
// rocks — the nine ores have genuinely different geometry and materials, and
// this browser is how they get reviewed. buildAsteroidModel's optional second
// parameter selects the ore (added in systems/asteroids.js this wave). The
// seed is derived from the ore's index (1 + index), not a random draw, so
// every entry is deterministic across reloads.
for (const [index, oreKey] of ORE_KEYS.entries()) {
  props.push({
    id: `prop:asteroid:${oreKey}`,
    label: `${COMMODITIES[oreKey].name} asteroid`,
    category: 'Props',
    build: () => buildAsteroidModel(1 + index, oreKey),
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
