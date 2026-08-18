/**
 * CPU review prints for the cargo-pod container hull.
 *
 * Builds via buildPodModel, extracts the single Mesh, and rasterises
 * face / quarter stills with per-pixel plate-map sampling so skin rivets
 * show up. Also checks the live-pod Mesh contract.
 *
 * Usage:
 *   node --import ./scripts/with-css-stub.mjs scripts/pod-render.mjs
 *
 * Output: out/pods/default-face.png, default-quarter.png,
 *         tinted-quarter.png, matrix.png
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { canvas, clearDepth, label, png } from './raster.mjs';

// Real pixel canvas so pods.js CanvasTexture paint survives headless Node.
function makeEl(tag = 'div') {
  const el = {
    tagName: String(tag).toUpperCase(),
    style: { setProperty() {}, cssText: '' },
    width: 0,
    height: 0,
    children: [],
    classList: { add() {}, remove() {}, contains() { return false; } },
    appendChild(c) { this.children.push(c); return c; },
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    remove() {},
    getContext: null,
  };
  if (tag === 'canvas') {
    let pixels = new Uint8ClampedArray(4);
    const sync = () => {
      const n = Math.max(4, (el.width | 0) * (el.height | 0) * 4);
      if (pixels.length !== n) pixels = new Uint8ClampedArray(n);
    };
    el.getContext = (kind) => {
      if (kind !== '2d') return null;
      return {
        canvas: el,
        createImageData: (w, h) => {
          const ww = h == null ? w.width : w;
          const hh = h == null ? w.height : h;
          return { width: ww, height: hh, data: new Uint8ClampedArray(Math.max(4, ww * hh * 4)) };
        },
        getImageData: (x, y, w, h) => {
          sync();
          const out = new Uint8ClampedArray(Math.max(4, w * h * 4));
          const cw = el.width | 0;
          for (let row = 0; row < h; row++) {
            const sy = y + row;
            if (sy < 0 || sy >= el.height) continue;
            for (let col = 0; col < w; col++) {
              const sx = x + col;
              if (sx < 0 || sx >= cw) continue;
              const si = (sy * cw + sx) * 4;
              const di = (row * w + col) * 4;
              out[di] = pixels[si];
              out[di + 1] = pixels[si + 1];
              out[di + 2] = pixels[si + 2];
              out[di + 3] = pixels[si + 3];
            }
          }
          return { width: w, height: h, data: out };
        },
        putImageData: (img, dx, dy) => {
          sync();
          const cw = el.width | 0;
          const ch = el.height | 0;
          const iw = img.width;
          for (let row = 0; row < img.height; row++) {
            const ty = dy + row;
            if (ty < 0 || ty >= ch) continue;
            for (let col = 0; col < iw; col++) {
              const tx = dx + col;
              if (tx < 0 || tx >= cw) continue;
              const si = (row * iw + col) * 4;
              const di = (ty * cw + tx) * 4;
              pixels[di] = img.data[si];
              pixels[di + 1] = img.data[si + 1];
              pixels[di + 2] = img.data[si + 2];
              pixels[di + 3] = img.data[si + 3];
            }
          }
        },
        fillRect() {},
        createRadialGradient: () => ({ addColorStop() {} }),
        createLinearGradient: () => ({ addColorStop() {} }),
      };
    };
  }
  return el;
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

const { buildPodModel, spawnPod, initPods } = await import('../src/game/pods.js');
const { ORE_TYPES } = await import('../src/game/state.js');

function fail(msg) {
  console.log(`CONTRACT FAIL: ${msg}`);
  process.exit(1);
}

const fakeScene = { add() {}, remove() {} };
const ctx = {
  scene: fakeScene,
  pods: [],
  world: { time: 0 },
  emit() {},
  ship: { object: { position: new THREE.Vector3() } },
  flags: { docked: false },
  cargo: [],
  cargoCapacity: 40,
};
const origin = new THREE.Vector3();
const liveA = spawnPod(ctx, [{ commodity: 'scrap', units: 1 }], origin);
const liveB = spawnPod(ctx, [{ commodity: 'scrap', units: 1 }], origin);
const liveTint = spawnPod(ctx, [{ commodity: 'rawOre', units: 1 }], origin, null, ORE_TYPES.rawOre.podTint);
const model = buildPodModel();
const modelTint = buildPodModel(ORE_TYPES.rawOre.podTint);
const sys = initPods(ctx);

if (!liveA.mesh?.isMesh) fail('spawnPod mesh is not THREE.Mesh');
if (!model.object?.isMesh) fail('buildPodModel object is not THREE.Mesh');
if (liveA.mesh.geometry !== liveB.mesh.geometry) fail('live pods do not share geometry');
if (liveA.mesh.geometry !== model.object.geometry) fail('browser model does not share live podGeo');
if (liveA.mesh.geometry !== liveTint.mesh.geometry) fail('tinted pod allocated its own geometry');
if (!(liveA.mesh.material instanceof THREE.MeshStandardMaterial)) fail('live material is not MeshStandardMaterial');
if (liveA.mesh.material.color.getHex() !== 0x8e939b) fail('4-arg spawnPod is not worn steel');
if (liveTint.mesh.material.color.getHex() !== ORE_TYPES.rawOre.podTint) fail('tinted spawnPod colour mismatch');
if (liveA.mesh.material === liveTint.mesh.material) fail('default and tinted share one material instance');
if (model.object.material === liveA.mesh.material) fail('buildPodModel did not clone material');
if (typeof liveA.mesh.material.emissiveIntensity !== 'number') fail('missing emissiveIntensity');
if (model.label !== 'Cargo pod') fail(`buildPodModel label is ${model.label}`);
if (typeof model.update !== 'function') fail('buildPodModel missing update');
if (typeof sys.update !== 'function') fail('initPods missing update');
if (liveA.mesh.children.length !== 0) fail('live mesh has child objects');
if (!liveA.mesh.material.map) fail('plate albedo map missing');
if (!liveA.mesh.material.bumpMap) fail('plate bump map missing');
if (liveA.mesh.material.map !== model.object.material.map) fail('cloned material did not share plate textures');
if (liveA.mesh.geometry.type === 'SphereGeometry') fail('rivets still use SphereGeometry');
if (liveA.mesh.geometry.getAttribute('position').count !== 60) fail('geometry is not a 20-face icosahedron');
if (!liveA.mesh.geometry.getAttribute('uv')) fail('per-face UVs missing');

const radius = liveA.mesh.geometry.boundingSphere?.radius ?? 0;
if (radius < 0.85 || radius > 1.05) fail(`bounding radius ${radius} left the ~0.9 icosahedron`);

const beforeGlitter = liveA.mesh.material.emissiveIntensity;
model.update(0.016, false);
if (model.object.material.emissiveIntensity === liveA.mesh.material.emissiveIntensity
  && model.object.material.emissiveIntensity !== beforeGlitter) {
  fail('browser glitter mutated the live material');
}

console.log(`contract ok: shared geo, Mesh+standard, default 0x${liveA.mesh.material.color.getHex().toString(16)}, tint 0x${liveTint.mesh.material.color.getHex().toString(16)}, r=${radius.toFixed(3)}, metalness=${liveA.mesh.material.metalness}, verts=${liveA.mesh.geometry.getAttribute('position').count}`);

// ---- Headless stills (sample plate UVs per pixel) ----

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

const FACE = makeView([0, 0, -1]);
const QUARTER = makeView([-0.62, -0.38, 0.69]);
const KEY = norm([-0.5, 0.75, 0.42]);
const FILL = norm([0.6, -0.25, 0.3]);

function rgbFromMaterial(mat) {
  const c = mat?.color;
  if (c && typeof c.r === 'number') return [c.r, c.g, c.b];
  return [1, 1, 1];
}

function imagePixels(tex) {
  if (!tex) return null;
  const img = tex.image;
  if (img && typeof img.getContext === 'function') {
    const g = img.getContext('2d');
    if (g?.getImageData) {
      const w = img.width | 0;
      const h = img.height | 0;
      const data = g.getImageData(0, 0, w, h).data;
      return { w, h, data, flipY: tex.flipY !== false };
    }
  }
  if (tex.image?.data && tex.image.width) {
    return { w: tex.image.width, h: tex.image.height, data: tex.image.data, flipY: !!tex.flipY };
  }
  return null;
}

function sampleRgba(img, u, v) {
  if (!img) return [1, 1, 1];
  const uu = Math.min(1, Math.max(0, u)) * (img.w - 1);
  const vv = (img.flipY ? 1 - Math.min(1, Math.max(0, v)) : Math.min(1, Math.max(0, v))) * (img.h - 1);
  const x0 = Math.floor(uu);
  const y0 = Math.floor(vv);
  const x1 = Math.min(img.w - 1, x0 + 1);
  const y1 = Math.min(img.h - 1, y0 + 1);
  const tx = uu - x0;
  const ty = vv - y0;
  const at = (x, y) => {
    const o = (y * img.w + x) * 4;
    return [img.data[o] / 255, img.data[o + 1] / 255, img.data[o + 2] / 255];
  };
  const a = at(x0, y0);
  const b = at(x1, y0);
  const c = at(x0, y1);
  const d = at(x1, y1);
  const mix = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  return mix(mix(a, b, tx), mix(c, d, tx), ty);
}

function expandMesh(root) {
  root.updateMatrixWorld(true);
  const hull = { pos: [], nor: [], uv: [], tint: rgbFromMaterial(root.material) };
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  let geo = root.geometry;
  if (!geo?.attributes?.position) {
    return { hullPos: new Float32Array(), hullNor: new Float32Array(), hullUv: new Float32Array(), tint: hull.tint, albedo: null, bump: null };
  }
  if (geo.index) geo = geo.toNonIndexed();
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  const mat = root.matrixWorld;
  const nmat = new THREE.Matrix3().getNormalMatrix(mat);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(mat);
    hull.pos.push(v.x, v.y, v.z);
    if (nor) {
      n.fromBufferAttribute(nor, i).applyNormalMatrix(nmat).normalize();
      hull.nor.push(n.x, n.y, n.z);
    } else {
      hull.nor.push(0, 1, 0);
    }
    if (uv) hull.uv.push(uv.getX(i), uv.getY(i));
    else hull.uv.push(0, 0);
  }
  if (geo !== root.geometry) geo.dispose();
  return {
    hullPos: new Float32Array(hull.pos),
    hullNor: new Float32Array(hull.nor),
    hullUv: new Float32Array(hull.uv),
    tint: hull.tint,
    albedo: imagePixels(root.material.map),
    bump: imagePixels(root.material.bumpMap),
  };
}

function project(view, x, y, z) {
  const p = [x, y, z];
  return [dot(p, view.right), dot(p, view.up), dot(p, view.forward)];
}

function bounds(view, buf) {
  let loU = Infinity;
  let hiU = -Infinity;
  let loV = Infinity;
  let hiV = -Infinity;
  for (let i = 0; i + 2 < buf.length; i += 3) {
    const [u, v2] = project(view, buf[i], buf[i + 1], buf[i + 2]);
    if (u < loU) loU = u;
    if (u > hiU) hiU = u;
    if (v2 < loV) loV = v2;
    if (v2 > hiV) hiV = v2;
  }
  return { loU, hiU, loV, hiV };
}

function frame(view, mesh, ox, oy, cellW, cellH, pad) {
  const b = bounds(view, mesh.hullPos);
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

function faceLit(nor, i) {
  const nx = (nor[i] + nor[i + 3] + nor[i + 6]) / 3;
  const ny = (nor[i + 1] + nor[i + 4] + nor[i + 7]) / 3;
  const nz = (nor[i + 2] + nor[i + 5] + nor[i + 8]) / 3;
  const nl = Math.hypot(nx, ny, nz) || 1;
  const fn = [nx / nl, ny / nl, nz / nl];
  return 0.22 + 0.78 * Math.max(0, dot(fn, KEY)) + 0.28 * Math.max(0, dot(fn, FILL));
}

function drawTextured(sheet, toPx, mesh, mode, cull) {
  const pos = mesh.hullPos;
  const nor = mesh.hullNor;
  const uvs = mesh.hullUv;
  const tint = mesh.tint;
  for (let i = 0, t = 0; i + 8 < pos.length; i += 9, t += 6) {
    const a = toPx(pos[i], pos[i + 1], pos[i + 2]);
    const b = toPx(pos[i + 3], pos[i + 4], pos[i + 5]);
    const c = toPx(pos[i + 6], pos[i + 7], pos[i + 8]);
    if (cull) {
      const area2 = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
      if (area2 >= 0) continue;
    }
    const lit = faceLit(nor, i);
    const ua = uvs[t];
    const va = uvs[t + 1];
    const ub = uvs[t + 2];
    const vb = uvs[t + 3];
    const uc = uvs[t + 4];
    const vc = uvs[t + 5];
    const [x0, y0] = a;
    const [x1, y1] = b;
    const [x2, y2] = c;
    const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
    const maxY = Math.min(sheet.h - 1, Math.ceil(Math.max(y0, y1, y2)));
    const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    const flat = Math.abs(area) < 1e-9;
    for (let y = minY; y <= maxY; y++) {
      const yc = y + 0.5;
      let lo = Infinity;
      let hi = -Infinity;
      const edge = (ax, ay, bx, by) => {
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) {
          const tt = (yc - ay) / (by - ay);
          const x = ax + (bx - ax) * tt;
          if (x < lo) lo = x;
          if (x > hi) hi = x;
        }
      };
      edge(x0, y0, x1, y1);
      edge(x1, y1, x2, y2);
      edge(x2, y2, x0, y0);
      if (lo > hi) continue;
      const xa = Math.max(0, Math.floor(lo));
      const xb = Math.min(sheet.w - 1, Math.ceil(hi));
      for (let x = xa; x <= xb; x++) {
        const pi = y * sheet.w + x;
        let z = a[2];
        let w0 = 1;
        let w1 = 0;
        if (!flat) {
          const xc = x + 0.5;
          w0 = ((x1 - xc) * (y2 - yc) - (x2 - xc) * (y1 - yc)) / area;
          w1 = ((x2 - xc) * (y0 - yc) - (x0 - xc) * (y2 - yc)) / area;
          z = w0 * a[2] + w1 * b[2] + (1 - w0 - w1) * c[2];
        }
        if (z >= sheet.z[pi]) continue;
        sheet.z[pi] = z;
        const w2 = 1 - w0 - w1;
        const u = w0 * ua + w1 * ub + w2 * uc;
        const v = w0 * va + w1 * vb + w2 * vc;
        const alb = sampleRgba(mesh.albedo, u, v);
        const bmp = sampleRgba(mesh.bump, u, v);
        const bump = 0.72 + 0.55 * bmp[0];
        const shade = mode === 'gray' ? 1 : lit * bump;
        const o = pi * 3;
        if (mode === 'gray') {
          const g = Math.min(255, Math.round(INK[0] * alb[0] * bump));
          sheet.px[o] = g;
          sheet.px[o + 1] = g;
          sheet.px[o + 2] = g;
        } else {
          const lift = 1 / 1.85;
          sheet.px[o] = Math.min(255, Math.round(255 * Math.pow(Math.min(1, tint[0] * alb[0] * shade), lift)));
          sheet.px[o + 1] = Math.min(255, Math.round(255 * Math.pow(Math.min(1, tint[1] * alb[1] * shade), lift)));
          sheet.px[o + 2] = Math.min(255, Math.round(255 * Math.pow(Math.min(1, tint[2] * alb[2] * shade), lift)));
        }
      }
    }
  }
}

function renderView(mesh, view, w, h, mode) {
  const sheet = canvas(w, h, PAPER);
  const toPx = frame(view, mesh, 0, 0, w, h, 48);
  if (!toPx) return sheet;
  clearDepth(sheet);
  drawTextured(sheet, toPx, mesh, mode === 'gray' ? 'gray' : 'hull', mode === 'shaded');
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

const OUT = 'out/pods';
mkdirSync(OUT, { recursive: true });

const defaultMesh = expandMesh(model.object);
const tintMesh = expandMesh(modelTint.object);
const hullTris = (defaultMesh.hullPos.length / 9) | 0;
if (!defaultMesh.albedo) fail('could not read plate albedo pixels for stills');

const face = renderView(defaultMesh, FACE, STILL_W, STILL_H, 'shaded');
const quarter = renderView(defaultMesh, QUARTER, STILL_W, STILL_H, 'shaded');
const tintQ = renderView(tintMesh, QUARTER, STILL_W, STILL_H, 'shaded');
const gray = renderView(defaultMesh, FACE, STILL_W, STILL_H, 'gray');

label(face, 'POD', 12, 12, 3, [20, 20, 20]);
label(quarter, 'POD', 12, 12, 3, [20, 20, 20]);

writeFileSync(`${OUT}/default-face.png`, png(face));
writeFileSync(`${OUT}/default-quarter.png`, png(quarter));
writeFileSync(`${OUT}/tinted-quarter.png`, png(tintQ));
writeFileSync(`${OUT}/default-gray.png`, png(gray));

const matrix = canvas(PAD + 2 * (CELL_W + PAD), PAD + CELL_H + PAD, PAPER);
blitDown(face, matrix, PAD, PAD, CELL_W, CELL_H);
blitDown(quarter, matrix, PAD + CELL_W + PAD, PAD, CELL_W, CELL_H);
writeFileSync(`${OUT}/matrix.png`, png(matrix));

console.log(`stills: ${OUT} (${hullTris} tris, 5 pngs)`);
