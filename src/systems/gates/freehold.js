/**
 * Freehold Compact — patched village ring, greenhouse, barn, open bore.
 * Plate: docs/FactionExamples/03-freehold-compact-jump-gate.png
 */
import {
  weather, box, cyl, sphere, torus, railing, windowGrid, panelSkin,
  crate, lampRun, segmentedRing, shutterRings,
} from './_kit.js';
import { BORE_RADIUS } from '../../game/gate-scale.js';

export const freeholdGate = {
  id: 'freehold',
  build(b, shutterB, st) {
    const W = weather;
    const CREAM = st.trim;
    const BROWN = st.hull;
    const DARK = st.hullDark;
    const RED = st.patch[0];
    const BLUE = st.patch[2];
    const LIT = 0xffffff;
    const LIT_WARM = 0xfff2e2;
    const GROW = 0x2b4a30;
    const R = BORE_RADIUS;

    segmentedRing(b, 'hull', [CREAM, W(CREAM, 1), RED, W(CREAM, 2), BLUE, W(BROWN, 1)], {
      radius: R, tube: 2.8, depth: 4.2, segments: 18, seed: 4403, jitter: 0.28,
    });
    torus(b, 'hull', DARK, R, 0.35, 8, 28);
    shutterRings(shutterB, 'hull', W(CREAM, 2), { radius: R - 2.2, count: 3, depth: 7, tube: 0.28 });

    // Greenhouse cluster (left).
    box(b, 'hull', W(CREAM, 1), 14, 7, 10, { x: -(R + 14), y: 2, z: 2 });
    box(b, 'glaze', GROW, 12, 5.2, 0.3, { x: -(R + 14), y: 2.4, z: 7.2 });
    box(b, 'glaze', GROW, 0.3, 5.2, 8, { x: -(R + 7.2), y: 2.4, z: 2 });
    windowGrid(b, 'glow', LIT_WARM, {
      rows: 2, cols: 5, rowGap: 1.6, colGap: 2.1, w: 1.1, h: 0.9, d: 0.2,
      x: -(R + 14), y: 2.2, z: 7.1,
    });
    cyl(b, 'hull', W(BLUE, 1), 2.2, 2.2, 5, 12, { x: -(R + 22), y: -2, z: 0 });
    cyl(b, 'hull', W(BLUE, 2), 1.8, 1.8, 4.2, 12, { x: -(R + 26), y: -2.4, z: 1.5 });

    // Barn (right).
    box(b, 'hull', RED, 16, 10, 12, { x: R + 16, y: 1, z: 1 });
    box(b, 'hull', W(RED, 1), 17, 1.2, 13, { x: R + 16, y: 6.4, z: 1 });
    windowGrid(b, 'glow', LIT, {
      rows: 2, cols: 4, rowGap: 2.2, colGap: 2.8, w: 1.4, h: 1.1, d: 0.25,
      x: R + 16, y: 1.4, z: 7.1,
    });

    // Landing apron toward +Z (approach).
    box(b, 'hull', W(CREAM, 2), 28, 0.7, 22, { y: -8, z: 18 });
    railing(b, 'hull', DARK, { ax: -12, ay: -7.6, az: 8, bx: -12, by: -7.6, bz: 28, height: 1.1, posts: 6, rail: 0.1 });
    railing(b, 'hull', DARK, { ax: 12, ay: -7.6, az: 8, bx: 12, by: -7.6, bz: 28, height: 1.1, posts: 6, rail: 0.1 });
    crate(b, 'hull', BROWN, { x: 8, y: -6.8, z: 16, s: 1.6 });
    crate(b, 'hull', W(RED, 2), { x: 10.2, y: -6.8, z: 18, s: 1.4 });

    // Underslung pods + masts.
    for (const a of [-0.7, 0.4, 2.2]) {
      sphere(b, 'hull', W(CREAM, 1), 2.4, 10, 8, { x: Math.cos(a) * (R + 3), y: Math.sin(a) * (R + 3) - 4, z: -2 });
    }
    cyl(b, 'hull', DARK, 0.28, 0.28, 14, 6, { x: -(R + 6), y: 12, z: -1 });
    cyl(b, 'hull', DARK, 0.22, 0.22, 11, 6, { x: R + 5, y: 11, z: -2 });
    lampRun(b, 'glow', LIT, { ax: -R, ay: R + 2, az: 1.8, bx: R, by: R + 2, bz: 1.8 });
    lampRun(b, 'glow', LIT_WARM, { ax: -10, ay: -7.2, az: 8, bx: 10, by: -7.2, bz: 8 });
  },
};
