/**
 * Hollow — shuttered, barely kept Guild work. No plate.
 */
import {
  weather, box, cyl, torus, lampRun, segmentedRing, shutterRings, rng,
} from './_kit.js';
import { BORE_RADIUS } from '../../game/gate-scale.js';

export const hollowGate = {
  id: 'hollow',
  build(b, shutterB, st, seed = 1) {
    const rand = rng(seed || 1);
    const W = weather;
    const HULL = st.hull;
    const DARK = st.hullDark;
    const LIT = 0xd8c8e8;
    const R = BORE_RADIUS;

    segmentedRing(b, 'hull', [DARK, W(HULL, 2), DARK, W(HULL, 3)], {
      radius: R, tube: 2.3, depth: 3.6, segments: 12, seed, jitter: 0.2,
    });
    torus(b, 'hull', DARK, R, 0.45, 8, 24);
    shutterRings(shutterB, 'hull', W(DARK, 1), { radius: R - 1.8, count: 3, depth: 5, tube: 0.34 });
    box(b, 'hull', DARK, 8 + rand() * 4, 10, 6, { x: R + 10, y: 2, z: -1 });
    cyl(b, 'hull', W(HULL, 2), 0.35, 0.35, 9, 6, { x: -(R + 4), y: 8, z: -2 });
    lampRun(b, 'glow', LIT, { ax: -4, ay: R + 2, az: 1.2, bx: 6, by: R + 2, bz: 1.2 });
  },
};
