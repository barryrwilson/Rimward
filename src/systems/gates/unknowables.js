/**
 * Unknowables — ghost ring + field cells. Charge plasma is mounted in gate.js.
 * Plate: docs/FactionExamples/07-unknowables-jump-gate.png
 */
import { torus, sphere } from './_kit.js';
import { BORE_RADIUS } from '../../game/gate-scale.js';

export const unknowablesGate = {
  id: 'unknowables',
  build(b, shutterB, st) {
    const R = BORE_RADIUS;
    torus(b, 'hull', st.hull, R, 0.55, 8, 36);
    torus(b, 'glow', st.beacon, R + 2.4, 0.12, 6, 40);
    torus(b, 'glow', st.accent, R * 0.7, 0.1, 6, 32, Math.PI * 1.4, { rx: 0.7 });
    torus(b, 'glow', st.patch[0], R * 0.85, 0.1, 6, 32, Math.PI * 1.2, { ry: 0.9 });
    torus(b, 'glow', st.glow, R * 1.15, 0.08, 6, 36, Math.PI * 1.6, { rz: 0.4 });
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2;
      const rr = R * (0.4 + (i % 3) * 0.35);
      sphere(b, 'glow', i % 2 ? st.beacon : st.accent, 0.9 + (i % 4) * 0.35, 8, 6, {
        x: Math.cos(ang) * rr,
        y: Math.sin(ang) * rr * 0.85,
        z: ((i % 5) - 2) * 1.6,
      });
    }
    sphere(b, 'glow', st.beacon, 2.2, 10, 8);
  },
};
