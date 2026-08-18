/**
 * Gilded Chain — vertical oval salon, turquoise lens.
 * Plate: docs/FactionExamples/05-gilded-chain-jump-gate.png
 */
import {
  weather, box, torus, windowGrid, lampRun, shutterRings,
} from './_kit.js';
import { BORE_RADIUS } from '../../game/gate-scale.js';

export const gildedGate = {
  id: 'gilded',
  build(b, shutterB, st) {
    const W = weather;
    const BLACK = st.hull;
    const IVORY = st.trim;
    const GOLD = st.accent;
    const LIT = 0xd8ffff;
    const R = BORE_RADIUS * 0.92;

    torus(b, 'hull', BLACK, R, 3.2, 12, 36, undefined, { sx: 0.72, sy: 1.22 });
    torus(b, 'hull', GOLD, R, 0.55, 8, 32, undefined, { sx: 0.72, sy: 1.22 });
    shutterRings(shutterB, 'hull', W(BLACK, 1), { radius: R - 2.4, count: 3, depth: 5, tube: 0.22 });
    torus(b, 'glaze', st.glow, R - 3.4, 0.35, 8, 28, undefined, { sx: 0.72, sy: 1.22 });
    torus(b, 'glow', LIT, R - 3.4, 0.16, 6, 24, undefined, { sx: 0.72, sy: 1.22 });

    // Inspection salons.
    box(b, 'hull', IVORY, 22, 18, 14, { x: -(R + 18), y: 0, z: 2 });
    box(b, 'hull', IVORY, 22, 18, 14, { x: R + 18, y: 0, z: 2 });
    box(b, 'hull', GOLD, 22.6, 0.5, 14.6, { x: -(R + 18), y: 9.2, z: 2 });
    box(b, 'hull', GOLD, 22.6, 0.5, 14.6, { x: R + 18, y: 9.2, z: 2 });
    windowGrid(b, 'glow', LIT, {
      rows: 3, cols: 4, rowGap: 2.6, colGap: 3.2, w: 2.2, h: 1.6, d: 0.2,
      x: -(R + 18), y: 0, z: 9.1,
    });
    windowGrid(b, 'glow', LIT, {
      rows: 3, cols: 4, rowGap: 2.6, colGap: 3.2, w: 2.2, h: 1.6, d: 0.2,
      x: R + 18, y: 0, z: 9.1,
    });
    box(b, 'glaze', 0x3a8888, 18, 12, 0.15, { x: -(R + 18), y: 0, z: 9.05 });
    box(b, 'glaze', 0x3a8888, 18, 12, 0.15, { x: R + 18, y: 0, z: 9.05 });

    // Causeways toward the camera.
    box(b, 'hull', W(IVORY, 1), 8, 0.7, 36, { x: -6, y: -8, z: 22 });
    box(b, 'hull', W(IVORY, 1), 8, 0.7, 36, { x: 6, y: -8, z: 22 });
    lampRun(b, 'glow', LIT, { ax: -6, ay: -7.4, az: 6, bx: -6, by: -7.4, bz: 38 });
    lampRun(b, 'glow', LIT, { ax: 6, ay: -7.4, az: 6, bx: 6, by: -7.4, bz: 38 });
  },
};
