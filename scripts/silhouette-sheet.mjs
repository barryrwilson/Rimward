/**
 * Black-silhouette sheet — bible §6 deliverable 2, and the only instrument that
 * can answer the question the numeric harnesses cannot.
 *
 * `measure-ships` sees spans and ratios; `attach-audit` sees contact. Neither
 * can see that six hulls are the same shape. The bible's acceptance tests are
 * explicit that the family must be sortable BY CLASS at thumbnail size with no
 * colour and no materials, and readable as ONE FACTION from construction logic
 * in grayscale. This renders exactly that: every class as a filled black
 * silhouette from the side, the top and the front.
 *
 * Two sheets, because they answer different questions:
 *   <faction>-shape.png  each class fitted to its own cell — is the ANATOMY
 *                        different, or is it one hull six times?
 *   <faction>-scale.png  every class at one common world scale — is the size
 *                        ladder real? (`ace ≈ light < cutter < heavy < frigate
 *                        << freighter`)
 *
 * No WebGL: hull triangles are projected orthographically and scan-converted on
 * the CPU, so this runs anywhere `node` does, unlike the in-game Models Browser.
 *
 * Usage: node scripts/silhouette-sheet.mjs [faction ...]
 * Output: docs/silhouettes/<faction>-shape.png and -scale.png
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { detailBuilder } from '../src/systems/station-detail.js';
import { FACTION_STYLE } from '../src/game/faction-style.js';
import { CLASS_ORDER, FACTION_REBUILD_ORDER, measureKindFor } from '../src/game/ship-scale.js';

const CELL_W = 460;
const CELL_H = 210;
const PAD = 12;
const VIEWS = [
  { name: 'side', ax: 'z', ay: 'y', flipY: true },
  { name: 'top', ax: 'z', ay: 'x', flipY: false },
  { name: 'front', ax: 'x', ay: 'y', flipY: true },
];

/** Greyscale canvas, 0 = ink, 255 = paper. */
const canvas = (w, h) => ({ w, h, px: new Uint8Array(w * h).fill(255) });

/** Flat-shaded scanline fill of one triangle, no z-buffer: a silhouette is a mask. */
function fillTri(c, x0, y0, x1, y1, x2, y2, ink) {
  const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
  const maxY = Math.min(c.h - 1, Math.ceil(Math.max(y0, y1, y2)));
  for (let y = minY; y <= maxY; y++) {
    const yc = y + 0.5;
    let lo = Infinity;
    let hi = -Infinity;
    const edge = (ax, ay, bx, by) => {
      if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) {
        const t = (yc - ay) / (by - ay);
        const x = ax + (bx - ax) * t;
        if (x < lo) lo = x;
        if (x > hi) hi = x;
      }
    };
    edge(x0, y0, x1, y1);
    edge(x1, y1, x2, y2);
    edge(x2, y2, x0, y0);
    if (lo > hi) continue;
    const xa = Math.max(0, Math.floor(lo));
    const xb = Math.min(c.w - 1, Math.ceil(hi));
    for (let x = xa; x <= xb; x++) c.px[y * c.w + x] = ink;
  }
}

/** Minimal 8-bit greyscale PNG. */
function png(c) {
  const raw = Buffer.alloc((c.w + 1) * c.h);
  for (let y = 0; y < c.h; y++) {
    raw[y * (c.w + 1)] = 0; // filter: none
    raw.set(c.px.subarray(y * c.w, (y + 1) * c.w), y * (c.w + 1) + 1);
  }
  const crcTable = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let k = n;
      for (let j = 0; j < 8; j++) k = k & 1 ? 0xedb88320 ^ (k >>> 1) : k >>> 1;
      t[n] = k;
    }
    return t;
  })();
  const crc = (buf) => {
    let k = -1;
    for (const byte of buf) k = crcTable[(k ^ byte) & 255] ^ (k >>> 8);
    return (k ^ -1) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(c.w, 0);
  ihdr.writeUInt32BE(c.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // greyscale
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Blit a 5x7 bitmap label so a reader can tell the rows apart. */
const GLYPHS = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};
function label(c, text, x0, y0, s = 2) {
  let x = x0;
  for (const raw of text.toUpperCase()) {
    const g = GLYPHS[raw] ?? GLYPHS[' '];
    for (let r = 0; r < 7; r++) {
      for (let k = 0; k < 5; k++) {
        if (g[r][k] !== '1') continue;
        for (let dy = 0; dy < s; dy++) {
          for (let dx = 0; dx < s; dx++) {
            const px = x + k * s + dx;
            const py = y0 + r * s + dy;
            if (px >= 0 && px < c.w && py >= 0 && py < c.h) c.px[py * c.w + px] = 0;
          }
        }
      }
    }
    x += 6 * s;
  }
}

const targets = (process.argv.slice(2).length > 0 ? process.argv.slice(2) : FACTION_REBUILD_ORDER)
  .filter((f) => measureKindFor(f) === 'built');

mkdirSync('docs/silhouettes', { recursive: true });

for (const faction of targets) {
  const mod = await import(`../src/systems/ships/${faction}.js`);
  const kit = mod[`${faction}Ship`];
  if (!kit) {
    console.log(`${faction}: no export named ${faction}Ship`);
    continue;
  }

  // Build every class once; keep the hull positions and the bounds.
  const models = [];
  for (const ck of CLASS_ORDER) {
    const b = detailBuilder();
    kit[ck].build(b, FACTION_STYLE[faction]);
    const geos = b.build();
    const p = geos.hull.attributes.position;
    const pos = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      pos[i * 3] = p.getX(i);
      pos[i * 3 + 1] = p.getY(i);
      pos[i * 3 + 2] = p.getZ(i);
    }
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.length; i += 3) {
      for (let a = 0; a < 3; a++) {
        if (pos[i + a] < lo[a]) lo[a] = pos[i + a];
        if (pos[i + a] > hi[a]) hi[a] = pos[i + a];
      }
    }
    models.push({ ck, pos, lo, hi });
    for (const g of Object.values(geos)) g.dispose();
  }

  const AXIS = { x: 0, y: 1, z: 2 };
  const draw = (c, m, view, cx, cy, scale) => {
    const ia = AXIS[view.ax];
    const ib = AXIS[view.ay];
    const ca = (m.lo[ia] + m.hi[ia]) / 2;
    const cb = (m.lo[ib] + m.hi[ib]) / 2;
    const sy = view.flipY ? -1 : 1;
    const { pos } = m;
    for (let i = 0; i < pos.length; i += 9) {
      fillTri(c,
        cx + (pos[i + ia] - ca) * scale, cy + sy * (pos[i + ib] - cb) * scale,
        cx + (pos[i + 3 + ia] - ca) * scale, cy + sy * (pos[i + 3 + ib] - cb) * scale,
        cx + (pos[i + 6 + ia] - ca) * scale, cy + sy * (pos[i + 6 + ib] - cb) * scale,
        0);
    }
  };

  const sheetW = PAD + VIEWS.length * (CELL_W + PAD);
  const sheetH = PAD + models.length * (CELL_H + PAD);

  // Sheet 1 — each class fitted to its cell. Answers "is the anatomy different?"
  const shape = canvas(sheetW, sheetH);
  models.forEach((m, row) => {
    VIEWS.forEach((view, col) => {
      const ia = AXIS[view.ax];
      const ib = AXIS[view.ay];
      const sa = m.hi[ia] - m.lo[ia];
      const sb = m.hi[ib] - m.lo[ib];
      const scale = Math.min((CELL_W - 40) / Math.max(sa, 1e-3), (CELL_H - 30) / Math.max(sb, 1e-3));
      draw(shape, m, view,
        PAD + col * (CELL_W + PAD) + CELL_W / 2,
        PAD + row * (CELL_H + PAD) + CELL_H / 2, scale);
    });
    label(shape, m.ck, PAD + 4, PAD + row * (CELL_H + PAD) + 4, 2);
  });
  writeFileSync(`docs/silhouettes/${faction}-shape.png`, png(shape));

  // Sheet 2 — one common scale for the whole family, in top view. Answers "is the
  // ladder real?" Rows are sized from each hull's own beam at that shared scale,
  // because a fixed row height clips the freighter: it is an order of magnitude
  // longer than a scout and correspondingly broad, which is the entire point.
  const longest = Math.max(...models.map((m) => m.hi[2] - m.lo[2]));
  const widest = Math.max(...models.map((m) => m.hi[0] - m.lo[0]));
  const common = Math.min((sheetW - 2 * PAD) / longest, 340 / widest);
  const rowH = models.map((m) => Math.max(64, Math.ceil((m.hi[0] - m.lo[0]) * common) + 26));
  const scaleSheet = canvas(sheetW, PAD + rowH.reduce((a, v) => a + v + PAD, 0));
  let y = PAD;
  models.forEach((m, row) => {
    draw(scaleSheet, m, VIEWS[1], sheetW / 2, y + rowH[row] / 2, common);
    label(scaleSheet, m.ck, PAD + 4, y + 4, 2);
    y += rowH[row] + PAD;
  });
  writeFileSync(`docs/silhouettes/${faction}-scale.png`, png(scaleSheet));

  console.log(`${faction}: docs/silhouettes/${faction}-shape.png, ${faction}-scale.png`
    + ` (${models.map((m) => `${m.ck} ${(m.hi[2] - m.lo[2]).toFixed(1)}`).join(', ')})`);
}
