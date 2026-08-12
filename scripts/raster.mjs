/**
 * Tiny CPU rasteriser and PNG writer — the review instruments' shared kernel.
 *
 * WHY THIS EXISTS. The in-game Models Browser is the authority on how a sculpt
 * looks, but it needs WebGL, and the headless Chromium available to an agent
 * has none (`docs/FactionShipRebuildPlan.md` §6 records the same finding and
 * tells a human to launch real Chrome with swiftshader). That left every
 * automated check in this repo numeric, and numbers cannot see that six hulls
 * are the same shape — which is exactly the defect the Veridian rebuild had to
 * answer.
 *
 * So: project the merged geometry and scan-convert it here. No GPU, no browser,
 * no dependencies. It is not a renderer for the game; it is a review print.
 */

import { deflateSync } from 'node:zlib';

/** RGB canvas plus a depth buffer. Paper is white; depth starts at +Infinity. */
export function canvas(w, h, bg = 255) {
  return {
    w,
    h,
    px: new Uint8Array(w * h * 3).fill(bg),
    z: new Float32Array(w * h).fill(Infinity),
  };
}

export function clearDepth(c) {
  c.z.fill(Infinity);
}

/**
 * Scan-convert one triangle. With `z0/z1/z2` supplied the depth buffer decides
 * visibility per pixel; without them the triangle is a flat mask, which is what
 * a silhouette wants. Colour is a `[r, g, b]` triple already shaded by the
 * caller — this function has no opinion about light.
 */
export function tri(c, p0, p1, p2, rgb, depth = null, blend = false) {
  const [x0, y0] = p0;
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
  const maxY = Math.min(c.h - 1, Math.ceil(Math.max(y0, y1, y2)));
  const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
  const flat = Math.abs(area) < 1e-9;
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
    for (let x = xa; x <= xb; x++) {
      const i = y * c.w + x;
      if (depth) {
        // Barycentric depth. A degenerate triangle falls back to its first
        // vertex rather than dividing by a zero area.
        let z = depth[0];
        if (!flat) {
          const xc = x + 0.5;
          const w0 = ((x1 - xc) * (y2 - yc) - (x2 - xc) * (y1 - yc)) / area;
          const w1 = ((x2 - xc) * (y0 - yc) - (x0 - xc) * (y2 - yc)) / area;
          z = w0 * depth[0] + w1 * depth[1] + (1 - w0 - w1) * depth[2];
        }
        if (z >= c.z[i]) continue;
        if (!blend) c.z[i] = z;
      }
      const o = i * 3;
      if (blend) {
        c.px[o] = Math.min(255, c.px[o] + rgb[0]);
        c.px[o + 1] = Math.min(255, c.px[o + 1] + rgb[1]);
        c.px[o + 2] = Math.min(255, c.px[o + 2] + rgb[2]);
      } else {
        c.px[o] = rgb[0];
        c.px[o + 1] = rgb[1];
        c.px[o + 2] = rgb[2];
      }
    }
  }
}

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

/** 5x7 bitmap text, so a sheet's rows can be told apart without a caption. */
export function label(c, text, x0, y0, s = 2, rgb = [0, 0, 0]) {
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
            if (px < 0 || px >= c.w || py < 0 || py >= c.h) continue;
            const o = (py * c.w + px) * 3;
            c.px[o] = rgb[0];
            c.px[o + 1] = rgb[1];
            c.px[o + 2] = rgb[2];
          }
        }
      }
    }
    x += 6 * s;
  }
}

const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let k = n;
    for (let j = 0; j < 8; j++) k = k & 1 ? 0xedb88320 ^ (k >>> 1) : k >>> 1;
    t[n] = k;
  }
  return t;
})();

/** 8-bit truecolour PNG. */
export function png(c) {
  const stride = c.w * 3;
  const raw = Buffer.alloc((stride + 1) * c.h);
  for (let y = 0; y < c.h; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    raw.set(c.px.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const crc = (buf) => {
    let k = -1;
    for (const byte of buf) k = CRC[(k ^ byte) & 255] ^ (k >>> 8);
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
  ihdr[9] = 2; // truecolour
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
