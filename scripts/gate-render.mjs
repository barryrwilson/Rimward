/**
 * CPU review prints for the 12 faction jump gates.
 *
 * Builds the live sculpt via buildGateModel, extracts mesh triangles
 * (no sprites, Points, or charge tunnel), and rasterises face-on, quarter,
 * and labeled grayscale stills. No WebGL, no browser.
 *
 * Usage:
 *   node --import ./scripts/with-css-stub.mjs scripts/gate-render.mjs
 *   node --import ./scripts/with-css-stub.mjs scripts/gate-render.mjs veridian ferrous
 *
 * Output: out/gates/<faction>-face.png, -quarter.png, -gray.png, and matrix.png
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { GATE_REBUILD_ORDER } from '../src/game/gate-scale.js';
import { canvas, clearDepth, tri, label, png } from './raster.mjs';

// ---- Headless canvas / document (glow textures in gate.js + organic.js) ----

function makeCtx2d() {
  const gradient = { addColorStop() {} };
  return new Proxy(
    {
      canvas: null,
      createRadialGradient: () => gradient,
      createLinearGradient: () => gradient,
      createPattern: () => null,
      measureText: () => ({ width: 10 }),
      getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h * 4)) }),
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(4, (w || 1) * (h || 1) * 4)) }),
    },
    {
      get(target, prop) {
        if (prop in target) return target[prop];
        return typeof prop === 'string' ? function () {} : undefined;
      },
      set() { return true; },
    },
  );
}

function makeEl(tag = 'div') {
  return {
    tagName: String(tag).toUpperCase(),
    style: { setProperty() {}, cssText: '' },
    width: 0,
    height: 0,
    children: [],
    classList: { add() {}, remove() {}, contains() { return false; } },
    getContext: (kind) => (kind === '2d' ? makeCtx2d() : null),
    appendChild(c) { this.children.push(c); return c; },
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    remove() {},
  };
}

if (!globalThis.document) {
  const body = makeEl('body');
  globalThis.document = {
    createElement: (t) => makeEl(t),
    createElementNS: (_, t) => makeEl(t),
    body,
    documentElement: { style: {} },
    addEventListener() {},
  };
}
if (!globalThis.window) {
  globalThis.window = {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
  };
}

const { buildGateModel } = await import('../src/systems/gate.js');

// raster.mjs label() covers ACEFGHILNRTUVY. Faction keys also need these.
const EXTRA_GLYPHS = {
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  M: ['10001', '11011', '10101', '10001', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
};
const RASTER_LETTERS = new Set('ACEFGHILNRTUVY ');

function stampName(c, text, x0, y0, s = 2, rgb = [20, 20, 20]) {
  let x = x0;
  for (const raw of String(text).toUpperCase()) {
    if (RASTER_LETTERS.has(raw)) {
      label(c, raw, x, y0, s, rgb);
    } else {
      const g = EXTRA_GLYPHS[raw];
      if (g) {
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
      }
    }
    x += 6 * s;
  }
}

const STILL_W = 720;
const STILL_H = 720;
const CELL_W = 340;
const CELL_H = 340;
const PAD = 16;
const INK = [56, 56, 56];
const PAPER = 246;

const norm = (v) => {
  const d = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / d, v[1] / d, v[2] / d];
};
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function makeView(forward) {
  const f = norm(forward);
  const right = norm(cross(f, [0, 1, 0]));
  const up = cross(right, f);
  return { forward: f, right, up };
}

// Face-on: camera on +Z, looking through the bore toward the origin.
const FACE = makeView([0, 0, -1]);
// Three-quarter: above, starboard, and ahead of the bore.
const QUARTER = makeView([-0.62, -0.38, 0.69]);
const KEY = norm([-0.5, 0.75, 0.42]);
const FILL = norm([0.6, -0.25, 0.3]);

const ALLOWED = new Set(GATE_REBUILD_ORDER);
const want = process.argv.slice(2);
const targets = [];
if (want.length === 0) {
  targets.push(...GATE_REBUILD_ORDER);
} else {
  for (const f of want) {
    if (!ALLOWED.has(f)) {
      console.log(`Unknown faction: ${f}`);
      process.exit(2);
    }
    targets.push(f);
  }
}

function skipObject(obj) {
  if (!obj || !obj.isMesh) return true;
  if (obj.isSprite || obj.isPoints) return true;
  let cur = obj;
  while (cur) {
    const n = cur.name || '';
    if (n === 'unknowables-plasma' || n === 'unknowables-plasma-cell') return true;
    if (n === 'beautiful-bud') return true;
    cur = cur.parent;
  }
  return false;
}

function rgbFromMaterial(mat) {
  const c = mat?.color;
  if (c && typeof c.r === 'number') return [c.r, c.g, c.b];
  return [1, 1, 1];
}

function expandMeshes(root) {
  root.updateMatrixWorld(true);
  const hull = { pos: [], nor: [], col: [] };
  const glow = { pos: [], nor: [], col: [] };
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();

  root.traverse((obj) => {
    if (skipObject(obj)) return;
    let geo = obj.geometry;
    if (!geo?.attributes?.position) return;
    if (geo.index) geo = geo.toNonIndexed();

    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const vcol = geo.attributes.color;
    const mat = obj.matrixWorld;
    const nmat = new THREE.Matrix3().getNormalMatrix(mat);
    const basic = !!obj.material?.isMeshBasicMaterial;
    const target = basic ? glow : hull;
    const fallback = rgbFromMaterial(obj.material);

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mat);
      target.pos.push(v.x, v.y, v.z);
      if (nor) {
        n.fromBufferAttribute(nor, i).applyNormalMatrix(nmat).normalize();
        target.nor.push(n.x, n.y, n.z);
      } else {
        target.nor.push(0, 1, 0);
      }
      if (vcol) {
        target.col.push(vcol.getX(i), vcol.getY(i), vcol.getZ(i));
      } else {
        target.col.push(fallback[0], fallback[1], fallback[2]);
      }
    }
    if (geo !== obj.geometry) geo.dispose();
  });

  return {
    hullPos: new Float32Array(hull.pos),
    hullNor: new Float32Array(hull.nor),
    hullCol: new Float32Array(hull.col),
    glowPos: new Float32Array(glow.pos),
    glowNor: new Float32Array(glow.nor),
    glowCol: new Float32Array(glow.col),
  };
}

function project(view, x, y, z) {
  const p = [x, y, z];
  return [dot(p, view.right), dot(p, view.up), dot(p, view.forward)];
}

function bounds(view, ...bufs) {
  let loU = Infinity;
  let hiU = -Infinity;
  let loV = Infinity;
  let hiV = -Infinity;
  for (const buf of bufs) {
    for (let i = 0; i + 2 < buf.length; i += 3) {
      const [u, v2] = project(view, buf[i], buf[i + 1], buf[i + 2]);
      if (u < loU) loU = u;
      if (u > hiU) hiU = u;
      if (v2 < loV) loV = v2;
      if (v2 > hiV) hiV = v2;
    }
  }
  return { loU, hiU, loV, hiV };
}

function frame(view, mesh, ox, oy, cellW, cellH, pad) {
  const b = bounds(view, mesh.hullPos, mesh.glowPos);
  if (!Number.isFinite(b.loU)) return null;
  const scale = Math.min(
    (cellW - pad) / Math.max(b.hiU - b.loU, 1e-3),
    (cellH - pad) / Math.max(b.hiV - b.loV, 1e-3),
  );
  const cx = ox + cellW / 2 - ((b.loU + b.hiU) / 2) * scale;
  const cy = oy + cellH / 2 + ((b.loV + b.hiV) / 2) * scale;
  return (x, y, z) => {
    const [u, v2, d] = project(view, x, y, z);
    return [cx + u * scale, cy - v2 * scale, d];
  };
}

function shadeFace(nor, col, i, lift, ambient) {
  const nx = (nor[i] + nor[i + 3] + nor[i + 6]) / 3;
  const ny = (nor[i + 1] + nor[i + 4] + nor[i + 7]) / 3;
  const nz = (nor[i + 2] + nor[i + 5] + nor[i + 8]) / 3;
  const nl = Math.hypot(nx, ny, nz) || 1;
  const fn = [nx / nl, ny / nl, nz / nl];
  const lit = ambient + 0.78 * Math.max(0, dot(fn, KEY)) + 0.28 * Math.max(0, dot(fn, FILL));
  const cr = (col[i] + col[i + 3] + col[i + 6]) / 3;
  const cg = (col[i + 1] + col[i + 4] + col[i + 7]) / 3;
  const cb = (col[i + 2] + col[i + 5] + col[i + 8]) / 3;
  const ch = (ch0, c0) => Math.min(255, Math.round(255 * Math.pow(Math.min(1, ch0 * c0 * lit), lift)));
  return [ch(1, cr), ch(1, cg), ch(1, cb)];
}

function drawTris(sheet, toPx, pos, nor, col, mode, cull) {
  for (let i = 0; i + 8 < pos.length; i += 9) {
    const a = toPx(pos[i], pos[i + 1], pos[i + 2]);
    const b = toPx(pos[i + 3], pos[i + 4], pos[i + 5]);
    const c = toPx(pos[i + 6], pos[i + 7], pos[i + 8]);
    if (cull) {
      const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
      if (area >= 0) continue;
    }
    const rgb = mode === 'gray'
      ? INK
      : shadeFace(nor, col, i, mode === 'glow' ? 1 / 1.6 : 1 / 1.9, mode === 'glow' ? 0.42 : 0.22);
    const blend = mode === 'glow';
    const z = blend ? [a[2] - 0.01, b[2] - 0.01, c[2] - 0.01] : [a[2], b[2], c[2]];
    tri(sheet, a, b, c, rgb, z, blend);
  }
}

function renderView(mesh, view, w, h, mode) {
  const sheet = canvas(w, h, PAPER);
  const toPx = frame(view, mesh, 0, 0, w, h, 48);
  if (!toPx) return sheet;
  clearDepth(sheet);
  const cull = mode === 'shaded';
  drawTris(sheet, toPx, mesh.hullPos, mesh.hullNor, mesh.hullCol, mode === 'gray' ? 'gray' : 'hull', cull);
  drawTris(sheet, toPx, mesh.glowPos, mesh.glowNor, mesh.glowCol, mode === 'gray' ? 'gray' : 'glow', cull);
  return sheet;
}

function blitDown(src, dst, dx, dy, dw, dh) {
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(src.h - 1, Math.floor((y * src.h) / dh));
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(src.w - 1, Math.floor((x * src.w) / dw));
      const si = (sy * src.w + sx) * 3;
      const di = ((dy + y) * dst.w + (dx + x)) * 3;
      dst.px[di] = src.px[si];
      dst.px[di + 1] = src.px[si + 1];
      dst.px[di + 2] = src.px[si + 2];
    }
  }
}

const OUT = 'out/gates';
mkdirSync(OUT, { recursive: true });

const cols = 4;
const rows = Math.ceil(targets.length / cols);
const matrix = canvas(
  PAD + cols * (CELL_W + PAD),
  PAD + rows * (CELL_H + PAD),
  PAPER,
);

let wrote = 0;
for (let idx = 0; idx < targets.length; idx++) {
  const faction = targets[idx];
  let model;
  try {
    model = buildGateModel(faction, { hub: false, routes: 0 });
  } catch (err) {
    console.log(`${faction}: BUILD FAIL — ${err.message}`);
    continue;
  }

  const mesh = expandMeshes(model.object);
  if (mesh.hullPos.length < 9 && mesh.glowPos.length < 9) {
    console.log(`${faction}: no mesh geometry`);
    continue;
  }

  const face = renderView(mesh, FACE, STILL_W, STILL_H, 'shaded');
  const quarter = renderView(mesh, QUARTER, STILL_W, STILL_H, 'shaded');
  const gray = renderView(mesh, FACE, STILL_W, STILL_H, 'gray');

  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const mx = PAD + col * (CELL_W + PAD);
  const my = PAD + row * (CELL_H + PAD);
  blitDown(gray, matrix, mx, my, CELL_W, CELL_H);
  stampName(matrix, faction, mx + 8, my + 8, 2, [20, 20, 20]);

  stampName(gray, faction, 12, 12, 3, [20, 20, 20]);
  writeFileSync(`${OUT}/${faction}-face.png`, png(face));
  writeFileSync(`${OUT}/${faction}-quarter.png`, png(quarter));
  writeFileSync(`${OUT}/${faction}-gray.png`, png(gray));
  wrote += 3;

  const hullTris = (mesh.hullPos.length / 9) | 0;
  const glowTris = (mesh.glowPos.length / 9) | 0;
  console.log(`${faction}: face/quarter/gray (${hullTris} hull tris, ${glowTris} glow tris)`);
}

writeFileSync(`${OUT}/matrix.png`, png(matrix));
wrote += 1;
console.log(`matrix: ${OUT}/matrix.png (${targets.length} factions, ${wrote} pngs)`);
