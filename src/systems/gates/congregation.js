/**
 * Congregation — disc city, central well, shrine cones.
 * Plate: docs/FactionExamples/09-congregation-further-shore-jump-gate.png
 */
import {
  weather, box, cyl, cone, torus, windowGrid, lampRun, railing,
} from './_kit.js';
import { BORE_RADIUS } from '../../game/gate-scale.js';

export const congregationGate = {
  id: 'congregation',
  build(b, shutterB, st) {
    const W = weather;
    const NAVY = st.hull;
    const DARK = st.hullDark;
    const SILV = st.trim;
    const AMBER = st.accent;
    const LIT = 0xffe8c0;
    const R = BORE_RADIUS;

    cyl(b, 'hull', NAVY, R + 22, R + 22, 3.4, 28, { rx: Math.PI / 2 });
    cyl(b, 'hull', W(NAVY, 1), R + 16, R + 16, 2.2, 24, { z: 1.4, rx: Math.PI / 2 });
    torus(b, 'hull', SILV, R, 2.8, 10, 32);
    torus(b, 'glow', 0xc8b8ff, R - 1.2, 0.35, 8, 28);
    torus(b, 'glaze', st.patch[0], R - 2.2, 0.2, 6, 24);
    // Inner well lip (does not fill the bore).
    torus(shutterB, 'hull', DARK, R - 3.2, 0.4, 8, 24);

    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const rr = R + 14;
      cone(b, 'hull', W(NAVY, 1), 4.2, 11, 8, {
        x: Math.cos(ang) * rr,
        y: Math.sin(ang) * rr,
        z: 7,
        rx: Math.PI / 2,
      });
      box(b, 'hull', AMBER, 1.2, 1.2, 1.2, {
        x: Math.cos(ang) * rr,
        y: Math.sin(ang) * rr,
        z: 13,
      });
    }
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
      box(b, 'hull', SILV, 6, 2.2, 16, {
        x: Math.cos(ang) * (R + 26),
        y: Math.sin(ang) * (R + 26),
        z: 0,
        rz: ang,
      });
    }
    windowGrid(b, 'glow', LIT, {
      rows: 1, cols: 10, rowGap: 1, colGap: 4.4, w: 1.6, h: 0.7, d: 0.2,
      y: R + 8, z: 2.2,
    });
    railing(b, 'hull', SILV, { ax: -12, ay: R + 6, az: 2, bx: 12, by: R + 6, bz: 2, height: 0.9, posts: 7, rail: 0.08 });
    lampRun(b, 'glow', LIT, { ax: -R - 8, ay: R + 10, az: 3, bx: R + 8, by: R + 10, bz: 3 });
  },
};
