/**
 * Determinism guard for presentation-only scene construction (issue #338).
 *
 * Three.js creates a UUID for every Object3D/geometry/material and generates
 * it with the GLOBAL Math.random. The boot harness seeds Math.random so world
 * generation, traffic, events and route fixtures stay reproducible run-to-run.
 * A new visual layer that builds THREE objects during init would therefore
 * consume draws from that seeded stream and silently shift every later
 * content roll (traffic spawns, event gaps, docking routes).
 *
 * withoutGlobalRandom(fn) swaps in a local deterministic generator for the
 * duration of fn, then restores the caller's Math.random. Scene construction
 * (geometry/material/mesh/sprite/Points) is all that needs it: the layer's own
 * content must use its seeded makeRng, never Math.random.
 *
 * Do NOT wrap content generation that is supposed to consume the global seeded
 * stream (starfield star positions, world casts, ...).
 */
export function withoutGlobalRandom(fn) {
  const saved = Math.random;
  let n = 0x9e3779b9;
  Math.random = () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
  try {
    return fn();
  } finally {
    Math.random = saved;
  }
}
