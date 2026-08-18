/**
 * Lamplighter Guild — work torus, crane, depot, lamp crown.
 * Plate: docs/FactionExamples/10-lamplighter-guild-jump-gate.png
 */
import {
  weather, box, cyl, sphere, torus, windowGrid, lampRun, segmentedRing, shutterRings, truss,
} from './_kit.js';
import { BORE_RADIUS, HUMAN } from '../../game/gate-scale.js';

export const lamplighterGate = {
  id: 'lamplighter',
  build(b, shutterB, st) {
    const W = weather;
    const SOOT = st.hull;
    const DARK = st.hullDark;
    const YEL = st.trim;
    const LIT = 0xfff0d0;
    const R = BORE_RADIUS;

    segmentedRing(b, 'hull', [SOOT, DARK, W(SOOT, 1), YEL, SOOT, DARK], {
      radius: R, tube: 3.0, depth: 5.2, segments: 20, seed: 1010, jitter: 0.1,
    });
    torus(b, 'hull', DARK, R, 0.4, 8, 32);
    shutterRings(shutterB, 'hull', W(SOOT, 1), { radius: R - 2.4, count: 4, depth: 9, tube: 0.26 });
    torus(b, 'glow', LIT, R - 3.2, 0.2, 6, 28);

    // Crane boom (outline-breaker).
    box(b, 'hull', YEL, 4, 3, 28, { x: -(R + 18), y: 8, z: 0 });
    truss(b, 'hull', DARK, {
      ax: -(R + 6), ay: 6, az: 0, bx: -(R + 32), by: 10, bz: 0,
      thickness: 0.35, bays: 5, spread: 0.7,
    });
    box(b, 'hull', SOOT, 10, 12, 8, { x: R + 12, y: 2, z: 2 });
    windowGrid(b, 'glow', LIT, {
      rows: 3, cols: 3, rowGap: 2.2, colGap: 2.4, w: 1.1, h: 1.1, d: 0.2,
      x: R + 12, y: 2, z: 6.2,
    });

    // Depot at the foot.
    sphere(b, 'hull', W(SOOT, 1), 5.5, 12, 10, { x: -8, y: -(R + 6), z: 4 });
    sphere(b, 'hull', W(SOOT, 2), 4.2, 10, 8, { x: 8, y: -(R + 5), z: 3 });
    box(b, 'hull', DARK, 18, 2, 12, { y: -(R + 8), z: 6 });

    // Lamp crown — pitch from HUMAN.lampGap.
    const n = Math.max(8, Math.round((2 * Math.PI * (R + 3)) / HUMAN.lampGap));
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      box(b, 'glow', LIT, 0.35, 0.35, 0.35, {
        x: Math.cos(ang) * (R + 3.2),
        y: Math.sin(ang) * (R + 3.2),
        z: 2.4,
      });
    }
    lampRun(b, 'glow', LIT, { ax: -(R + 8), ay: -(R + 6.6), az: 8, bx: R + 8, by: -(R + 6.6), bz: 8 });
    cyl(b, 'hull', YEL, 0.8, 0.8, 10, 8, { y: R + 10, z: 0 });
  },
};
