/**
 * Red Ledger — asymmetric tally circle, right keep, amber sun.
 * Plate: docs/FactionExamples/04-red-ledger-jump-gate.png
 */
import {
  weather, box, cyl, torus, crate, windowGrid, lampRun, segmentedRing, shutterRings,
} from './_kit.js';
import { BORE_RADIUS } from '../../game/gate-scale.js';

export const redledgerGate = {
  id: 'redledger',
  build(b, shutterB, st) {
    const W = weather;
    const IRON = st.hull;
    const DARK = st.hullDark;
    const COP = st.trim;
    const RED = st.accent;
    const LIT = 0xffe0c0;
    const R = BORE_RADIUS;

    segmentedRing(b, 'hull', [IRON, DARK, W(IRON, 1), COP], {
      radius: R, tube: 2.6, depth: 4.4, segments: 16, seed: 404, jitter: 0.16,
    });
    spokeTally(b, RED, R);
    torus(b, 'hull', DARK, R, 0.4, 8, 24);
    shutterRings(shutterB, 'hull', COP, { radius: R - 2, count: 3, depth: 6 });
    torus(b, 'glow', LIT, R - 3, 0.28, 6, 24);

    // Right-side toll keep.
    box(b, 'hull', DARK, 16, 22, 14, { x: R + 16, y: 2, z: 2 });
    box(b, 'hull', IRON, 12, 8, 10, { x: R + 18, y: 14, z: 2 });
    windowGrid(b, 'glow', LIT, {
      rows: 4, cols: 3, rowGap: 2.4, colGap: 2.6, w: 1.2, h: 1.5, d: 0.2,
      x: R + 16, y: 4, z: 9.1,
    });
    crate(b, 'hull', RED, { x: R + 10, y: -6, z: 8, s: 2.2 });
    crate(b, 'hull', COP, { x: R + 13, y: -6, z: 10, s: 1.8 });
    crate(b, 'hull', W(RED, 1), { x: R + 11, y: -4, z: 9, s: 1.5 });

    // Left boarding arm + bottom pier.
    box(b, 'hull', IRON, 18, 3.2, 4, { x: -(R + 12), y: 1, z: 0 });
    cyl(b, 'hull', COP, 0.6, 0.6, 10, 8, { x: -(R + 20), y: 1, z: 0, rz: Math.PI / 2 });
    box(b, 'hull', DARK, 20, 2, 8, { y: -(R + 4), z: 6 });
    lampRun(b, 'glow', LIT, { ax: R + 8, ay: -8, az: 10, bx: R + 22, by: -8, bz: 10 });
  },
};

function spokeTally(b, hex, R) {
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    box(b, 'hull', hex, 2.4, 1.1, 5.2, {
      x: Math.cos(ang) * (R + 1.4),
      y: Math.sin(ang) * (R + 1.4),
      rz: ang + Math.PI / 2,
    });
  }
}
