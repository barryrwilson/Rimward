/**
 * Shaded review print — the closest thing to the Models Browser that runs
 * without a GPU.
 *
 * `scripts/silhouette-sheet.mjs` answers "is the anatomy different?". This
 * answers the other half of the review: does the CONSTRUCTION LOGIC read? Plate
 * courses, rib frames, armour steps, recesses and the emissive channel are all
 * invisible in a filled silhouette, and they are most of what makes a hull look
 * like a Veridian hull rather than a grey solid.
 *
 * Orthographic three-quarter view, flat-shaded from the baked vertex colours
 * with one key light and one fill, plus the `lights` channel composited
 * additively in the faction's glow colour — the same two-channel contract the
 * game renders (see `vcMaterial` and the additive glow material in
 * `src/systems/npc.js`). It is a review print, not a game frame: no shadows, no
 * PBR, no post.
 *
 * Usage: node scripts/ship-render.mjs <faction> [class ...]
 * Output: docs/silhouettes/<faction>-render.png
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { detailBuilder } from '../src/systems/station-detail.js';
import { FACTION_STYLE } from '../src/game/faction-style.js';
import { CLASS_ORDER } from '../src/game/ship-scale.js';
import { canvas, clearDepth, tri, label, png } from './raster.mjs';

const CELL_W = 700;
const CELL_H = 380;
const PAD = 10;

// Three-quarter view: above, ahead and off the starboard bow, which is the
// angle the Models Browser frames a hull from.
const norm = (v) => {
  const d = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / d, v[1] / d, v[2] / d];
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const FORWARD = norm([-0.72, -0.42, 0.62]); // camera looks along this
const RIGHT = norm(cross(FORWARD, [0, 1, 0]));
const UP = cross(RIGHT, FORWARD);
const KEY = norm([-0.5, 0.75, 0.42]);
const FILL = norm([0.6, -0.25, 0.3]);

const [faction, ...want] = process.argv.slice(2);
if (!faction) {
  console.log('usage: node scripts/ship-render.mjs <faction> [class ...]');
  process.exit(2);
}
const classes = want.length > 0 ? want : CLASS_ORDER;

const mod = await import(`../src/systems/ships/${faction}.js`);
const kit = mod[`${faction}Ship`];
const st = FACTION_STYLE[faction];
const glow = [(st.glow >> 16) & 255, (st.glow >> 8) & 255, st.glow & 255];

mkdirSync('docs/silhouettes', { recursive: true });

const cols = classes.length <= 2 ? 1 : 2;
const rows = Math.ceil(classes.length / cols);
const sheet = canvas(PAD + cols * (CELL_W + PAD), PAD + rows * (CELL_H + PAD), 246);

classes.forEach((ck, idx) => {
  const b = detailBuilder();
  kit[ck].build(b, st);
  const geos = b.build();

  // Common frame: fit the hull's projected extent into the cell.
  const hp = geos.hull.attributes.position;
  let lo = [Infinity, Infinity];
  let hi = [-Infinity, -Infinity];
  let cz = 0;
  const project = (x, y, z) => [dot([x, y, z], RIGHT), dot([x, y, z], UP), dot([x, y, z], FORWARD)];
  for (let i = 0; i < hp.count; i++) {
    const [u, v] = project(hp.getX(i), hp.getY(i), hp.getZ(i));
    if (u < lo[0]) lo[0] = u;
    if (u > hi[0]) hi[0] = u;
    if (v < lo[1]) lo[1] = v;
    if (v > hi[1]) hi[1] = v;
  }
  const scale = Math.min((CELL_W - 46) / Math.max(hi[0] - lo[0], 1e-3),
    (CELL_H - 40) / Math.max(hi[1] - lo[1], 1e-3));
  const ox = PAD + (idx % cols) * (CELL_W + PAD) + CELL_W / 2 - ((lo[0] + hi[0]) / 2) * scale;
  const oy = PAD + Math.floor(idx / cols) * (CELL_H + PAD) + CELL_H / 2 + ((lo[1] + hi[1]) / 2) * scale;
  const toPx = (x, y, z) => {
    const [u, v, d] = project(x, y, z);
    return [ox + u * scale, oy - v * scale, d];
  };

  clearDepth(sheet);

  // Opaque hull, flat-shaded from the baked vertex colour.
  const hn = geos.hull.attributes.normal;
  const hc = geos.hull.attributes.color;
  for (let i = 0; i + 2 < hp.count; i += 3) {
    const a = toPx(hp.getX(i), hp.getY(i), hp.getZ(i));
    const bb = toPx(hp.getX(i + 1), hp.getY(i + 1), hp.getZ(i + 1));
    const c2 = toPx(hp.getX(i + 2), hp.getY(i + 2), hp.getZ(i + 2));
    const n = norm([
      (hn.getX(i) + hn.getX(i + 1) + hn.getX(i + 2)) / 3,
      (hn.getY(i) + hn.getY(i + 1) + hn.getY(i + 2)) / 3,
      (hn.getZ(i) + hn.getZ(i + 1) + hn.getZ(i + 2)) / 3,
    ]);
    // Review exposure, not game exposure. The Combine's graphite is 0x3a4442 —
    // at a physically honest ambient the whole fleet prints near black and the
    // plate courses, rib frames and armour steps this sheet exists to show
    // vanish. The key/fill/ambient below and the gamma lift are set so those
    // read on a white page; the game's own lighting is elsewhere.
    const lit = 0.42 + 0.85 * Math.max(0, dot(n, KEY)) + 0.34 * Math.max(0, dot(n, FILL));
    const shade = (ch) => Math.min(255, Math.round(255 * Math.pow(Math.min(1, ch * lit), 1 / 1.9)));
    tri(sheet, a, bb, c2,
      [shade(hc.getX(i)), shade(hc.getY(i)), shade(hc.getZ(i))],
      [a[2], bb[2], c2[2]]);
  }

  // Emissive channel, composited additively in the faction glow, depth-tested
  // against the hull but not writing depth — the same read as the game's
  // additive material.
  if (geos.lights) {
    const lp = geos.lights.attributes.position;
    const lc = geos.lights.attributes.color;
    for (let i = 0; i + 2 < lp.count; i += 3) {
      const a = toPx(lp.getX(i), lp.getY(i), lp.getZ(i));
      const bb = toPx(lp.getX(i + 1), lp.getY(i + 1), lp.getZ(i + 1));
      const c2 = toPx(lp.getX(i + 2), lp.getY(i + 2), lp.getZ(i + 2));
      tri(sheet, a, bb, c2, [
        Math.round(glow[0] * lc.getX(i) * 0.85),
        Math.round(glow[1] * lc.getY(i) * 0.85),
        Math.round(glow[2] * lc.getZ(i) * 0.85),
      ], [a[2] - 0.01, bb[2] - 0.01, c2[2] - 0.01], true);
    }
  }

  label(sheet, ck, PAD + (idx % cols) * (CELL_W + PAD) + 8,
    PAD + Math.floor(idx / cols) * (CELL_H + PAD) + 8, 2, [20, 20, 20]);

  for (const g of Object.values(geos)) g.dispose();
});

writeFileSync(`docs/silhouettes/${faction}-render.png`, png(sheet));
console.log(`${faction}: docs/silhouettes/${faction}-render.png (${classes.join(', ')})`);
