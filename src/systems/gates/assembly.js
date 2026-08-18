/**
 * Assembly — fat wheel on a factory plaza, probe swarm.
 * Plate: docs/FactionExamples/08-assembly-jump-gate.png
 */
import {
  weather, box, cyl, sphere, torus, windowGrid, lampRun, segmentedRing, shutterRings,
} from './_kit.js';
import { BORE_RADIUS } from '../../game/gate-scale.js';

export const assemblyGate = {
  id: 'assembly',
  build(b, shutterB, st) {
    const W = weather;
    const WHITE = st.hull;
    const CHAR = st.hullDark;
    const ORNG = st.accent;
    const LIT = 0xd8ffff;
    const R = BORE_RADIUS;

    segmentedRing(b, 'hull', [WHITE, W(WHITE, 1), CHAR, W(ORNG, 1)], {
      radius: R, tube: 3.4, depth: 5.5, segments: 20, seed: 808, jitter: 0.12,
    });
    torus(b, 'hull', CHAR, R, 0.4, 8, 28);
    shutterRings(shutterB, 'hull', W(WHITE, 2), { radius: R - 2.6, count: 4, depth: 8 });
    torus(b, 'glaze', st.glow, R - 4, 0.4, 8, 28);
    torus(b, 'glow', LIT, R - 4, 0.16, 6, 24);

    cyl(b, 'hull', W(WHITE, 2), R + 18, R + 18, 2.4, 24, { y: -(R + 6), rx: Math.PI / 2 });
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      box(b, 'hull', i % 3 === 0 ? ORNG : WHITE, 5, 8, 5, {
        x: Math.cos(ang) * (R + 14),
        y: -(R + 2),
        z: Math.sin(ang) * (R + 14),
      });
    }
    windowGrid(b, 'glow', LIT, {
      rows: 1, cols: 8, rowGap: 1, colGap: 6, w: 1.2, h: 0.8, d: 0.2,
      x: 0, y: -(R + 4.6), z: R + 10,
    });
    // Probe swarm — same module at small scale.
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const rr = R + 22 + (i % 4) * 3;
      box(b, 'hull', i % 2 ? ORNG : WHITE, 1.4, 1.4, 1.4, {
        x: Math.cos(ang) * rr,
        y: ((i % 5) - 2) * 3,
        z: Math.sin(ang) * rr * 0.6,
      });
      sphere(b, 'glow', LIT, 0.35, 6, 4, {
        x: Math.cos(ang) * rr,
        y: ((i % 5) - 2) * 3 + 1,
        z: Math.sin(ang) * rr * 0.6,
      });
    }
    lampRun(b, 'glow', LIT, { ax: -(R + 10), ay: R + 4, az: 2, bx: R + 10, by: R + 4, bz: 2 });
  },
};
