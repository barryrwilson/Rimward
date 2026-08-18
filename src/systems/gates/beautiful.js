/**
 * Beautiful Ones — petal manta over a buried machine ring.
 * Plate: docs/FactionExamples/06-beautiful-ones-jump-gate.png
 */
import {
  weather, box, sphere, hemi, torus, shutterRings,
} from './_kit.js';
import { BORE_RADIUS } from '../../game/gate-scale.js';

export const beautifulGate = {
  id: 'beautiful',
  build(b, shutterB, st) {
    const W = weather;
    const PEARL = st.trim;
    const FLESH = st.hull;
    const LIT = 0xf4fff8;
    const R = BORE_RADIUS * 0.72;

    torus(b, 'hull', W(FLESH, 1), R, 1.1, 10, 28);
    shutterRings(shutterB, 'hull', W(PEARL, 2), { radius: R - 1.4, count: 2, depth: 4, tube: 0.18 });
    torus(b, 'glow', LIT, R - 1.6, 0.14, 6, 24);

    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const reach = 22 + (i % 2) * 6;
      box(b, 'hull', PEARL, 7, 2.2, reach, {
        x: Math.cos(ang) * (R + reach * 0.38),
        y: Math.sin(ang) * (R + reach * 0.18),
        z: -2 + (i % 3) * 0.6,
        rz: ang,
        rx: 0.25,
      });
      hemi(b, 'glaze', 0x6a88c0, 5.5, 10, 8, {
        x: Math.cos(ang) * (R + 8),
        y: Math.sin(ang) * (R + 6),
        z: 2,
        rx: -0.8,
        rz: ang,
      });
    }
    sphere(b, 'hull', W(PEARL, 1), 4.2, 12, 10, { x: -(R + 10), y: -6, z: -3 });
    sphere(b, 'hull', W(PEARL, 2), 3.2, 10, 8, { x: R + 8, y: -8, z: -2 });
    box(b, 'glow', LIT, 1.2, 1.2, 1.2, { y: R + 4, z: 2 });
  },
};
