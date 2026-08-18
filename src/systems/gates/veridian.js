/**
 * Veridian Combine — hex claim block on a plaza, emerald tunnel.
 * Plate: docs/FactionExamples/01-veridian-combine-jump-gate.png
 */
import {
  weather, box, cyl, torus, windowGrid, lampRun, hexCollar, shutterRings,
} from './_kit.js';
import { BORE_RADIUS } from '../../game/gate-scale.js';

export const veridianGate = {
  id: 'veridian',
  build(b, shutterB, st) {
    const W = weather;
    const GRAPH = st.hull;
    const DARK = st.hullDark;
    const ALLOY = st.trim;
    const LIT = 0xe8fff0;
    const R = BORE_RADIUS;

    hexCollar(b, 'hull', GRAPH, { radius: R + 2, thick: 5.4, depth: 7 });
    hexCollar(b, 'hull', W(GRAPH, 1), { radius: R - 1.2, thick: 2.2, depth: 5 });
    hexCollar(b, 'glaze', st.accent, { radius: R - 4.2, thick: 1.1, depth: 2.2 });
    shutterRings(shutterB, 'hull', W(ALLOY, 1), { radius: R - 3, count: 4, depth: 10, tube: 0.22 });
    torus(b, 'glow', LIT, R - 5, 0.18, 6, 24);

    // Claim plaza under the hex.
    box(b, 'hull', W(GRAPH, 2), 78, 2.2, 62, { y: -(R + 8), z: 6 });
    for (let i = -2; i <= 2; i++) {
      box(b, 'hull', W(GRAPH, 1), 8, 4, 10, { x: i * 12, y: -(R + 5), z: 18 });
      windowGrid(b, 'glow', LIT, {
        rows: 2, cols: 3, rowGap: 1.2, colGap: 1.8, w: 0.9, h: 0.7, d: 0.2,
        x: i * 12, y: -(R + 4.2), z: 23.2,
      });
    }
    for (const x of [-28, -14, 0, 14, 28]) {
      cyl(b, 'hull', ALLOY, 0.55, 0.55, 16, 8, { x, y: -(R - 2), z: 24 });
      box(b, 'glow', LIT, 1.4, 1.4, 1.4, { x, y: R - 18, z: 24 });
    }
    lampRun(b, 'glow', LIT, { ax: -30, ay: -(R + 6.6), az: 8, bx: 30, by: -(R + 6.6), bz: 8 });
    box(b, 'hull', DARK, 22, 3, 8, { y: -(R + 5), z: -18 });
  },
};
