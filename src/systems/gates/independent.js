/**
 * Independent — secondhand Guild work. No plate. Seed varies dress.
 */
import {
  weather, box, cyl, torus, crate, lampRun, segmentedRing, shutterRings, rng,
} from './_kit.js';
import { BORE_RADIUS } from '../../game/gate-scale.js';

export const independentGate = {
  id: 'independent',
  build(b, shutterB, st, seed = 1) {
    const rand = rng(seed || 1);
    const W = weather;
    const HULL = st.hull;
    const DARK = st.hullDark;
    const TRIM = st.trim;
    const LIT = 0xffe8c8;
    const R = BORE_RADIUS;

    segmentedRing(b, 'hull', [HULL, W(HULL, 1), DARK, W(TRIM, 2)], {
      radius: R, tube: 2.1, depth: 3.4, segments: 14, seed, jitter: 0.32,
    });
    torus(b, 'hull', DARK, R, 0.3, 8, 24);
    shutterRings(shutterB, 'hull', W(HULL, 2), { radius: R - 2, count: 2, depth: 5 });
    if (rand() > 0.35) {
      box(b, 'hull', W(HULL, 1), 10 + rand() * 8, 3, 4, { x: -(R + 10), y: -2 + rand() * 4, z: 1 });
    }
    box(b, 'hull', DARK, 14, 2.2, 3.2, { x: R + 10, y: 1, z: 0 });
    cyl(b, 'hull', TRIM, 0.4, 0.4, 12, 6, { x: R + 16, y: 4, z: 0, rz: Math.PI / 3 });
    crate(b, 'hull', W(HULL, 2), { x: R + 8, y: -5, z: 4, s: 1.4 });
    lampRun(b, 'glow', LIT, { ax: -R, ay: R + 1.6, az: 1.4, bx: R * 0.2, by: R + 1.6, bz: 1.4 });
  },
};
