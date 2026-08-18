/**
 * Ferrous Hegemony — fortress circle, four bastions, ice-blue swirl.
 * Plate: docs/FactionExamples/02-ferrous-hegemony-jump-gate.png
 */
import {
  weather, box, cyl, torus, windowGrid, lampRun, segmentedRing, spokeBoxes, shutterRings,
} from './_kit.js';
import { BORE_RADIUS } from '../../game/gate-scale.js';

export const ferrousGate = {
  id: 'ferrous',
  build(b, shutterB, st) {
    const W = weather;
    const IRON = st.hull;
    const DARK = st.hullDark;
    const STEEL = st.trim;
    const CRIM = st.accent;
    const LIT = 0xe8f0f8;
    const R = BORE_RADIUS;

    segmentedRing(b, 'hull', [IRON, W(IRON, 1), DARK, W(IRON, 2)], {
      radius: R, tube: 3.1, depth: 5, segments: 24, seed: 202, jitter: 0.08,
    });
    torus(b, 'hull', DARK, R - 0.2, 0.45, 8, 32);
    shutterRings(shutterB, 'hull', STEEL, { radius: R - 2.4, count: 3, depth: 6, tube: 0.3 });
    torus(b, 'glow', LIT, R - 3.2, 0.2, 6, 28);

    spokeBoxes(b, 'hull', IRON, { count: 4, radius: R + 8, w: 8, h: 14, d: 10 });
    spokeBoxes(b, 'hull', DARK, { count: 4, radius: R + 14, w: 5, h: 7, d: 6 });
    spokeBoxes(b, 'hull', CRIM, { count: 4, radius: R + 16, w: 0.7, h: 11, d: 0.7 });
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      windowGrid(b, 'glow', LIT, {
        rows: 3, cols: 2, rowGap: 2.2, colGap: 2.4, w: 1.1, h: 1.4, d: 0.2,
        x: Math.cos(ang) * (R + 8), y: Math.sin(ang) * (R + 8), z: 5.2,
        ry: ang,
      });
    }
    // Parade docks left/right.
    box(b, 'hull', W(IRON, 1), 42, 2.4, 10, { x: -(R + 28), z: 4 });
    box(b, 'hull', W(IRON, 1), 42, 2.4, 10, { x: R + 28, z: 4 });
    lampRun(b, 'glow', LIT, { ax: -(R + 40), ay: 2, az: 8, bx: -(R + 16), by: 2, bz: 8 });
    lampRun(b, 'glow', LIT, { ax: R + 16, ay: 2, az: 8, bx: R + 40, by: 2, bz: 8 });
    cyl(b, 'hull', STEEL, 1.1, 1.1, 8, 8, { x: 0, y: R + 16, z: 0 });
  },
};
