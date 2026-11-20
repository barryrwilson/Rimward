/**
 * Deterministic far-asteroid scenery layout for issue #338 (system
 * scale/population Phase 1).
 *
 * The minable, instanced belt is still the authored def.field: it keeps its
 * 9-ore InstancedMesh structure, per-field cap and save caps unchanged. This
 * module adds 2–3 deterministic far fields per system so the SYSTEM total
 * reaches 600–800 visible rocks. Those far rocks are presentation-only: one
 * Points layer in asteroids.js, no collision/AI/save data, no matrix writes.
 *
 * Pure data + mulberry32 — no THREE, no Math.random, JSON-safe. Both
 * asteroids.js and the focused #338 test read the same layout so the visible
 * count and the issue cap cannot drift.
 */

export const ASTEROID_NEAR_CAP = 160; // instanced/minable belt cap (unchanged)
export const ASTEROID_TOTAL_CAP = 800; // issue #338 system-wide density cap
export const ASTEROID_SCENERY_MIN_FIELDS = 2;
export const ASTEROID_SCENERY_MAX_FIELDS = 3;
const SCENERY_MIN_TOTAL = 600;

function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic far-field layout for one system def.
 * @returns {{center:number[], radius:number, count:number}[]}
 */
export function asteroidSceneryLayout(def) {
  if (!def || !def.field) return [];
  const rng = makeRng(0xb3e000 + ((def.worldSeed | 0) >>> 0));
  const primary = Math.min(Math.max(0, def.field.count | 0), ASTEROID_NEAR_CAP);
  const target = Math.min(
    ASTEROID_TOTAL_CAP,
    SCENERY_MIN_TOTAL + Math.floor(rng() * (ASTEROID_TOTAL_CAP - SCENERY_MIN_TOTAL + 1)),
  );
  const extras = Math.max(0, target - primary);
  if (extras <= 0) return [];
  const fieldCount = ASTEROID_SCENERY_MIN_FIELDS
    + Math.floor(rng() * (ASTEROID_SCENERY_MAX_FIELDS - ASTEROID_SCENERY_MIN_FIELDS + 1));
  const per = Math.floor(extras / fieldCount);
  let rem = extras - per * fieldCount;
  const out = [];
  for (let i = 0; i < fieldCount; i++) {
    const count = per + (rem > 0 ? 1 : 0);
    if (rem > 0) rem -= 1;
    if (count <= 0) continue;
    const angle = rng() * Math.PI * 2;
    const dist = 1300 + rng() * 1300; // beyond the playable bubble
    const radius = 90 + rng() * 130;
    out.push({
      center: [
        Math.cos(angle) * dist,
        (rng() - 0.5) * 220,
        Math.sin(angle) * dist,
      ],
      radius,
      count,
    });
  }
  return out;
}

/** System-wide visible rock count (instanced belt + far Points belt). */
export function asteroidTotalCount(def) {
  if (!def || !def.field) return 0;
  const primary = Math.min(Math.max(0, def.field.count | 0), ASTEROID_NEAR_CAP);
  const extras = asteroidSceneryLayout(def).reduce((n, f) => n + f.count, 0);
  return Math.min(ASTEROID_TOTAL_CAP, primary + extras);
}
