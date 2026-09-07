import { MODEL_BY_ID } from '../../src/game/model-catalog.js';
import { configureShipAssets } from '../../src/systems/ship-assets.js';

const classes = new Set(['player', 'light', 'ace', 'cutter', 'heavy', 'frigate', 'freighter']);
const cachedModels = new Map();

// Reuse the game's Models Browser entries, including its actual material path.
// The gallery caches these entries for its lifetime; no shared assets are disposed.
async function buildOriginal(id, renderer) {
  if (!classes.has(id)) throw new Error(`Unknown Beautiful Ones ship: ${id}`);
  configureShipAssets(renderer);
  const entry = MODEL_BY_ID.get(id === 'player' ? 'ship:player' : `ship:beautiful:${id}`);
  const model = entry.load ? await entry.load() : entry.build();
  // Use the full-detail sculpt at every review zoom. LOD changes would make
  // a normalized, small-on-screen carrier an unfair geometry comparison.
  if (model.object.userData.lod) model.object.userData.lod.autoUpdate = false;
  return {
    object: model.object,
    update: (elapsed) => model.update?.(elapsed, true, undefined),
  };
}

export function loadOriginal(id, renderer) {
  if (!cachedModels.has(id)) {
    const pending = buildOriginal(id, renderer).catch((error) => {
      cachedModels.delete(id);
      throw error;
    });
    cachedModels.set(id, pending);
  }
  return cachedModels.get(id);
}
