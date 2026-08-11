/**
 * Wave 43 station detail toolkit — merged-geometry greeble library
 *
 * Ruling (wave-39 resource budget pin, scripts/boot-test.mjs):
 * scene-wide geometry+material+texture count is pinned at ~195, with only 1
 * unit of margin between ten-jump checks. Therefore this module bakes
 * per-part colour into VERTEX COLOURS and merges each colour channel into a
 * single BufferGeometry, exactly like npc.js colorPart()/vcGeoFor(). The
 * whole detailed Freehold station therefore adds zero net resources while
 * carrying 350–550 primitive parts.
 *
 * All colours arrive from the caller as hex numbers; the toolkit knows nothing
 * about factions or FACTION_STYLE. Deterministic — scatter uses only the
 * exported seeded RNG. Geometries handed to add() are owned by the builder
 * and disposed in build().
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _color = new THREE.Color();
const _matrix = new THREE.Matrix4();
const _euler = new THREE.Euler();
const _quat = new THREE.Quaternion();
const _pos = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _side = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _out = new THREE.Vector3();
const _one = new THREE.Vector3(1, 1, 1);

// ---------- 1.1 seeded RNG (deterministic LCG) ----------
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------- 1.2 detailBuilder ----------
export function detailBuilder() {
  const channels = {}; // { [name]: BufferGeometry[] }
  const stack = []; // Matrix4[] frame stack
  let built = false;

  const topMatrix = () => (stack.length > 0 ? stack[stack.length - 1] : null);

  return {
    push(x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0) {
      if (built) throw new Error('detailBuilder: already built');
      // Scratch aliasing is fatal here: one _matrix cannot hold both the
      // translation and the rotation (makeRotationFromEuler would clobber the
      // translation before multiply() reads it, leaving R*R and no offset).
      // compose() builds T*R*1 in one step from the quaternion form.
      const frame = new THREE.Matrix4().compose(
        _pos.set(x, y, z), _quat.setFromEuler(_euler.set(rx, ry, rz)), _one);
      const current = topMatrix();
      stack.push(current ? frame.premultiply(current) : frame);
    },
    pop() {
      if (built) throw new Error('detailBuilder: already built');
      if (stack.length === 0) throw new Error('detailBuilder: pop on empty stack');
      stack.pop();
    },
    add(channel, geo, hex, opts = {}) {
      if (built) throw new Error('detailBuilder: already built');
      const { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1 } = opts;

      // Convert to non-indexed for mergeGeometries
      if (geo.index) {
        const ni = geo.toNonIndexed();
        geo.dispose();
        geo = ni;
      }

      // Transform order: scale, rotate, translate, then frame matrix
      if (sx !== 1 || sy !== 1 || sz !== 1) geo.scale(sx, sy, sz);
      if (rx || ry || rz) geo.applyMatrix4(_matrix.makeRotationFromEuler(_euler.set(rx, ry, rz)));
      geo.translate(x, y, z);

      const frame = topMatrix();
      if (frame) geo.applyMatrix4(frame);

      // Bake colour
      _color.setHex(hex);
      const n = geo.attributes.position.count;
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        col[i * 3] = _color.r;
        col[i * 3 + 1] = _color.g;
        col[i * 3 + 2] = _color.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

      if (!channels[channel]) channels[channel] = [];
      channels[channel].push(geo);
    },
    // Arbitrary-matrix placement, used by the oriented helpers (_member,
    // pipeRun, portholeRing, panelPatches) whose orientation cannot be
    // expressed as an Euler triple. Same colour-bake contract as add().
    _addMatrix(channel, geo, hex, matrix) {
      if (built) throw new Error('detailBuilder: already built');
      if (geo.index) {
        const ni = geo.toNonIndexed();
        geo.dispose();
        geo = ni;
      }
      geo.applyMatrix4(matrix);
      const frame = topMatrix();
      if (frame) geo.applyMatrix4(frame);
      _color.setHex(hex);
      const n = geo.attributes.position.count;
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        col[i * 3] = _color.r;
        col[i * 3 + 1] = _color.g;
        col[i * 3 + 2] = _color.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      if (!channels[channel]) channels[channel] = [];
      channels[channel].push(geo);
    },
    count(channel) {
      return channels[channel] ? channels[channel].length : 0;
    },
    total() {
      let total = 0;
      for (const ch in channels) total += channels[ch].length;
      return total;
    },
    build() {
      if (built) throw new Error('detailBuilder: already built');
      // An unclosed push silently offsets every later part in the build — the
      // wave-43 bring-up bug that threw the tank farm's frame over the docking
      // gantries, pipe runs and greeble scatter. Fail loudly instead.
      if (stack.length !== 0) throw new Error(`detailBuilder: ${stack.length} unclosed push() frame(s)`);
      built = true;
      const result = {};
      for (const ch in channels) {
        if (channels[ch].length > 0) {
          result[ch] = mergeGeometries(channels[ch], false);
          for (const part of channels[ch]) part.dispose();
        }
      }
      return result;
    },
  };
}

// ---------- 1.3 shape primitives ----------
export function box(b, ch, hex, w, h, d, o = {}) {
  b.add(ch, new THREE.BoxGeometry(w, h, d), hex, o);
}

export function cyl(b, ch, hex, rTop, rBot, h, seg, o = {}) {
  b.add(ch, new THREE.CylinderGeometry(rTop, rBot, h, seg), hex, o);
}

export function sphere(b, ch, hex, r, ws, hs, o = {}) {
  b.add(ch, new THREE.SphereGeometry(r, ws, hs), hex, o);
}

export function hemi(b, ch, hex, r, ws, hs, o = {}) {
  b.add(ch, new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, 0, Math.PI / 2), hex, o);
}

export function torus(b, ch, hex, r, tube, rseg, tseg, arc, o = {}) {
  const a = arc === undefined ? Math.PI * 2 : arc;
  b.add(ch, new THREE.TorusGeometry(r, tube, rseg, tseg, a), hex, o);
}

export function cone(b, ch, hex, r, h, seg, o = {}) {
  b.add(ch, new THREE.ConeGeometry(r, h, seg), hex, o);
}

// ---------- 1.4 composite greebles ----------
// Tori land in the plane perpendicular to the named axis. Each band is positioned along the named axis.
export function ribBands(b, ch, hex, { r, tube = 0.16, from, to, count, axis = 'x', tseg = 12 }) {
  const step = (to - from) / (count - 1 || 1);
  for (let i = 0; i < count; i++) {
    const t = from + i * step;
    // TorusGeometry lies in XY by default. Position along the named axis, then rotate to perpendicular:
    // axis='x' -> position (t,0,0), rotate Y 90° (XY->YZ)
    // axis='y' -> position (0,t,0), rotate X 90° (XY->XZ)
    // axis='z' -> position (0,0,t), no rotation (XY already perpendicular to Z)
    const pos = axis === 'x' ? { x: t, y: 0, z: 0 } : axis === 'y' ? { x: 0, y: t, z: 0 } : { x: 0, y: 0, z: t };
    const rot = axis === 'x' ? { ry: Math.PI / 2 } : axis === 'y' ? { rx: Math.PI / 2 } : {};
    torus(b, ch, hex, r, tube, 8, tseg, undefined, { ...pos, ...rot });
  }
}

// A row of `count` small boxes centred on (x, y, z), stepping `spacing` along
// the named axis. Only the named axis takes the offset — the other two hold.
export function windowRow(b, ch, hex, { count, spacing, w, h, d, x = 0, y = 0, z = 0, axis = 'x', ry = 0 }) {
  for (let i = 0; i < count; i++) {
    const off = (i - (count - 1) / 2) * spacing;
    box(b, ch, hex, w, h, d, {
      x: axis === 'x' ? x + off : x,
      y: axis === 'y' ? y + off : y,
      z: axis === 'z' ? z + off : z,
      ry,
    });
  }
}

// `count` flat pucks on a circle of radius r in the XZ plane at height y, each
// lying against the hull with its disc axis pointing radially OUTWARD. Built
// from an explicit basis rather than Euler angles, so the orientation does not
// depend on rotation order. `tilt` cants the axis upward.
export function portholeRing(b, ch, hex, { r, count, size, y = 0, tilt = 0, seg = 8 }) {
  const outward = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const ang = (i / count) * Math.PI * 2;
    const px = Math.cos(ang) * r;
    const pz = Math.sin(ang) * r;
    outward.set(Math.cos(ang), tilt, Math.sin(ang)).normalize();
    tangent.set(-Math.sin(ang), 0, Math.cos(ang));
    normal.crossVectors(tangent, outward).normalize();
    _matrix.makeBasis(tangent, outward, normal).setPosition(px, y, pz); // cylinder +Y = outward
    b._addMatrix(ch, new THREE.CylinderGeometry(size, size, size * 0.6, seg), hex, _matrix);
  }
}

// Private helper: ONE box member spanning A->B exactly, centred on the
// midpoint, optionally offset by `off` along the run's perpendicular. It
// clobbers the module scratch (_pos/_dir/_side/_axis/_matrix), so callers MUST
// hold their own vectors across a call — that aliasing was the wave-43
// bring-up bug that threw truss braces 200 units off the raft.
function _member(b, ch, hex, a, bEnd, thickness, off = 0) {
  _dir.subVectors(bEnd, a);
  const len = _dir.length();
  if (len > 1e-6) _dir.normalize();
  else _dir.set(0, 0, 1);
  _side.crossVectors(_dir, _up);
  if (_side.lengthSq() < 1e-6) _side.set(1, 0, 0);
  else _side.normalize();
  _axis.crossVectors(_side, _dir).normalize();
  _matrix.makeBasis(_side, _axis, _dir); // local +Z runs along A->B
  _pos.addVectors(a, bEnd).multiplyScalar(0.5);
  if (off !== 0) _pos.addScaledVector(_side, off);
  _matrix.setPosition(_pos);
  b._addMatrix(ch, new THREE.BoxGeometry(thickness, thickness, Math.max(len, 1e-4)), hex, _matrix);
}

// Lattice girder A->B: two chords offset +/-spread on the run's perpendicular,
// `bays` zig-zag braces, and a cross post at every bay boundary. Every member
// spans its own endpoints exactly and stays inside the A-B segment inflated by
// thickness and spread. A zero-length run collapses to A.
export function truss(b, ch, hex, { ax, ay, az, bx, by, bz, thickness = 0.28, bays = 4, spread = 0.9 }) {
  const A = new THREE.Vector3(ax, ay, az);
  const B = new THREE.Vector3(bx, by, bz);
  const run = A.distanceTo(B);
  const dir = new THREE.Vector3().subVectors(B, A);
  if (run > 1e-6) dir.normalize();
  else dir.set(0, 0, 1);
  const side = new THREE.Vector3().crossVectors(dir, _up);
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
  else side.normalize();
  const n = Math.max(1, bays | 0);
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  for (const s of [-spread, spread]) { // chords
    p0.copy(A).addScaledVector(side, s);
    p1.copy(B).addScaledVector(side, s);
    _member(b, ch, hex, p0, p1, thickness);
  }
  for (let i = 0; i < n; i++) { // zig-zag braces, bay i spanning i/n → (i+1)/n
    const alt = i % 2 === 0;
    p0.copy(A).addScaledVector(dir, (run * i) / n).addScaledVector(side, alt ? -spread : spread);
    p1.copy(A).addScaledVector(dir, (run * (i + 1)) / n).addScaledVector(side, alt ? spread : -spread);
    _member(b, ch, hex, p0, p1, thickness);
  }
  for (let i = 0; i <= n; i++) { // cross posts
    const t = (run * i) / n;
    p0.copy(A).addScaledVector(dir, t).addScaledVector(side, -spread);
    p1.copy(A).addScaledVector(dir, t).addScaledVector(side, spread);
    _member(b, ch, hex, p0, p1, thickness);
  }
}

// Catwalk handrail A->B: `posts` uprights of length `height` spaced evenly
// along the run, plus a top rail spanning A->B at +height. A zero-length run
// collapses to a single post and a stub rail at A.
export function railing(b, ch, hex, { ax, ay, az, bx, by, bz, height = 0.9, posts = 6, rail = 0.08 }) {
  const A = new THREE.Vector3(ax, ay, az);
  const B = new THREE.Vector3(bx, by, bz);
  const run = A.distanceTo(B);
  const n = Math.max(1, posts | 0);
  const p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    p.lerpVectors(A, B, n > 1 ? i / (n - 1) : 0);
    box(b, ch, hex, rail, height, rail, { x: p.x, y: p.y + height / 2, z: p.z });
  }
  const topA = new THREE.Vector3(A.x, A.y + height, A.z);
  const topB = new THREE.Vector3(B.x, B.y + height, B.z);
  if (run > 1e-6) _member(b, ch, hex, topA, topB, rail);
  else box(b, ch, hex, rail, rail, rail * 2, { x: topA.x, y: topA.y, z: topA.z });
}

// Plates lie tangent to cylinder surface at radius r + t/2, scattered between from/to along axis
export function panelPatches(b, ch, hexes, { r, from, to, count, seed, w = 3, h = 2, t = 0.22, axis = 'x' }) {
  const rnd = rng(seed);
  const len = to - from;
  for (let i = 0; i < count; i++) {
    const hex = hexes[i % hexes.length];
    // Jitter size ±30%
    const pw = w * (0.7 + rnd() * 0.6);
    const ph = h * (0.7 + rnd() * 0.6);
    // Position along axis and around circumference
    const along = from + rnd() * len;
    const ang = rnd() * Math.PI * 2;
    // Point on cylinder surface at radius r + t/2 (plate centre)
    const pr = r + t / 2;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    // Plate centre: cylinder axis coordinate vs radial coordinates
    let px, py, pz;
    if (axis === 'x') { px = along; py = cos * pr; pz = sin * pr; }
    else if (axis === 'y') { px = cos * pr; py = along; pz = sin * pr; }
    else { px = cos * pr; py = sin * pr; pz = along; }
    // Cylinder axis direction
    let cax = 0, cay = 0, caz = 0;
    if (axis === 'x') { cax = 1; }
    else if (axis === 'y') { cay = 1; }
    else { caz = 1; }
    // Basis: local Y along the cylinder axis, local Z radially outward. The
    // outward vector must drop the along-axis component or the plate tips.
    _axis.set(cax, cay, caz);
    _out.set(px, py, pz);
    if (axis === 'x') _out.x = 0; else if (axis === 'y') _out.y = 0; else _out.z = 0;
    _out.normalize();
    _side.crossVectors(_out, _axis).normalize(); // tangent (becomes local X)
    _matrix.makeBasis(_side, _axis, _out).setPosition(px, py, pz);
    b._addMatrix(ch, new THREE.BoxGeometry(pw, ph, t), hex, _matrix);
  }
}

// Pipe spanning A->B exactly (CylinderGeometry's +Y axis is aligned to the
// run), with `collars` fatter rings stepped from A — not from the midpoint,
// which is what pushed lamp and collar parts past B during wave-43 bring-up.
export function pipeRun(b, ch, hex, { ax, ay, az, bx, by, bz, r = 0.16, seg = 6, collars = 2 }) {
  const A = new THREE.Vector3(ax, ay, az);
  const B = new THREE.Vector3(bx, by, bz);
  const dir = new THREE.Vector3().subVectors(B, A);
  const len = dir.length();
  if (len > 1e-6) dir.normalize();
  else dir.set(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(dir, _up);
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
  else side.normalize();
  const normal = new THREE.Vector3().crossVectors(side, dir).normalize();
  const p = new THREE.Vector3().addVectors(A, B).multiplyScalar(0.5);
  _matrix.makeBasis(side, dir, normal).setPosition(p);
  b._addMatrix(ch, new THREE.CylinderGeometry(r, r, Math.max(len, 1e-4), seg), hex, _matrix);
  for (let i = 1; i <= collars; i++) {
    p.copy(A).addScaledVector(dir, (len / (collars + 1)) * i);
    _matrix.makeBasis(side, dir, normal).setPosition(p);
    b._addMatrix(ch, new THREE.CylinderGeometry(r * 1.4, r * 1.4, r * 1.5, seg), hex, _matrix);
  }
}
// Dense grid of rectangular hull plating: rows * cols plates on cylinder surface.
export function panelSkin(b, ch, hexes, { r, from, to, rows, cols, seed, t = 0.18, axis = 'x', inset = 0.22, jitter = 0.18 }) {
  const rnd = rng(seed);
  const len = to - from;
  const cellLength = len / rows;
  const cellWidth = 2 * r * Math.sin(Math.PI / cols);
  
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const hex = hexes[Math.floor(rnd() * hexes.length)];
      
      const lengthScale = 1 + (rnd() - 0.5) * 2 * jitter;
      const widthScale = 1 + (rnd() - 0.5) * 2 * jitter;
      
      const plateLength = cellLength * (1 - inset) * Math.min(lengthScale, 1);
      const plateWidth = cellWidth * (1 - inset) * Math.min(widthScale, 1);
      
      const along = from + j * cellLength + cellLength / 2;
      const ang = (i + 0.5) * (Math.PI * 2 / cols);
      
      const pr = r + t / 2;
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      
      let px, py, pz;
      if (axis === 'x') { px = along; py = cos * pr; pz = sin * pr; }
      else if (axis === 'y') { px = cos * pr; py = along; pz = sin * pr; }
      else { px = cos * pr; py = sin * pr; pz = along; }
      
      let cax = 0, cay = 0, caz = 0;
      if (axis === 'x') { cax = 1; }
      else if (axis === 'y') { cay = 1; }
      else { caz = 1; }
      
      _axis.set(cax, cay, caz);
      _out.set(px, py, pz);
      if (axis === 'x') _out.x = 0; else if (axis === 'y') _out.y = 0; else _out.z = 0;
      _out.normalize();
      _side.crossVectors(_out, _axis).normalize();
      _matrix.makeBasis(_side, _axis, _out).setPosition(px, py, pz);
      b._addMatrix(ch, new THREE.BoxGeometry(plateWidth, plateLength, t), hex, _matrix);
    }
  }
}

// Rectangular window grid centred on origin, columns step along axis, rows step along +Y (or +Z if axis is 'y').
export function windowGrid(b, ch, hex, { rows, cols, rowGap, colGap, w, h, d, x = 0, y = 0, z = 0, axis = 'x', ry = 0 }) {
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const colOff = (i - (cols - 1) / 2) * colGap;
      const rowOff = (j - (rows - 1) / 2) * rowGap;
      
      let wx = x, wy = y, wz = z;
      if (axis === 'x') {
        wx += colOff; wy += rowOff;
      } else if (axis === 'y') {
        wx += colOff; wz += rowOff;
      } else {
        wx += colOff; wy += rowOff;
      }
      
      box(b, ch, hex, w, h, d, { x: wx, y: wy, z: wz, ry });
    }
  }
}

// Pressurised connector A->B with collar rings at each end.
export function airlock(b, ch, hexBody, hexRing, { ax, ay, az, bx, by, bz, r = 1.4, seg = 12, rings = 2 }) {
  const A = new THREE.Vector3(ax, ay, az);
  const B = new THREE.Vector3(bx, by, bz);
  const dir = new THREE.Vector3().subVectors(B, A);
  const len = dir.length();
  if (len > 1e-6) dir.normalize();
  else dir.set(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(dir, _up);
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
  else side.normalize();
  const normal = new THREE.Vector3().crossVectors(side, dir).normalize();
  const p = new THREE.Vector3().addVectors(A, B).multiplyScalar(0.5);
  _matrix.makeBasis(side, dir, normal).setPosition(p);
  b._addMatrix(ch, new THREE.CylinderGeometry(r, r, Math.max(len, 1e-4), seg), hexBody, _matrix);
  
  const ringR = r * 1.18;
  const ringTube = r * 0.16;
  const ringMat = new THREE.Matrix4().makeBasis(dir, normal, side);
  
  const offsets = rings === 2 ? [0.1, 0.26, 0.74, 0.9] : [0.12, 0.88];
  for (const t of offsets) {
    p.copy(A).addScaledVector(dir, len * t);
    ringMat.setPosition(p);
    b._addMatrix(ch, new THREE.TorusGeometry(ringR, ringTube, 8, seg), hexRing, ringMat);
  }
}

// Walkway deck A->B with two handrails offset ±width/2 on the perpendicular.
export function bridge(b, ch, hexDeck, hexRail, { ax, ay, az, bx, by, bz, w = 1.8, railH = 0.8, posts = 6, deck = 0.22, rail = 0.08 }) {
  const A = new THREE.Vector3(ax, ay, az);
  const B = new THREE.Vector3(bx, by, bz);
  const dir = new THREE.Vector3().subVectors(B, A);
  const len = dir.length();
  if (len > 1e-6) dir.normalize();
  else dir.set(0, 0, 1);
  const side = new THREE.Vector3().crossVectors(dir, _up);
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
  else side.normalize();
  const normal = new THREE.Vector3().crossVectors(side, dir).normalize();
  const p = new THREE.Vector3().addVectors(A, B).multiplyScalar(0.5);
  _matrix.makeBasis(side, normal, dir).setPosition(p);
  b._addMatrix(ch, new THREE.BoxGeometry(w, deck, Math.max(len, 1e-4)), hexDeck, _matrix);
  
  const halfW = w / 2;
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const postMat = new THREE.Matrix4();
  const up = new THREE.Vector3(0, 1, 0);
  
  for (const s of [-halfW, halfW]) {
    p0.copy(A).addScaledVector(side, s);
    p1.copy(B).addScaledVector(side, s);
    const n = Math.max(1, posts | 0);
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0;
      const pt = new THREE.Vector3().lerpVectors(p0, p1, t);
      const postTop = new THREE.Vector3().copy(pt).addScaledVector(up, railH);
      postMat.makeBasis(side, up, dir).setPosition(postTop.x - side.x * rail / 2, postTop.y - up.y * rail / 2, postTop.z - dir.z * rail / 2);
      b._addMatrix(ch, new THREE.BoxGeometry(rail, railH, rail), hexRail, postMat);
    }
    const topA = new THREE.Vector3().copy(p0).addScaledVector(up, railH);
    const topB = new THREE.Vector3().copy(p1).addScaledVector(up, railH);
    if (len > 1e-6) {
      _dir.subVectors(topB, topA);
      const postLen = _dir.length();
      if (postLen > 1e-6) _dir.normalize();
      const postSide = new THREE.Vector3().crossVectors(_dir, up);
      if (postSide.lengthSq() < 1e-6) postSide.set(1, 0, 0);
      else postSide.normalize();
      const postNorm = new THREE.Vector3().crossVectors(postSide, _dir).normalize();
      _pos.addVectors(topA, topB).multiplyScalar(0.5);
      _matrix.makeBasis(postSide, postNorm, _dir).setPosition(_pos);
      b._addMatrix(ch, new THREE.BoxGeometry(rail, rail, Math.max(postLen, 1e-4)), hexRail, _matrix);
    }
  }
}

// A tapered mast of stacked cones with either a box tip or a tilted dish.
export function antenna(b, ch, hexMast, hexTip, { x = 0, y = 0, z = 0, h, r = 0.14, tip = 0.4, dish = 0 }) {
  const tiers = 3;
  const tierH = h / tiers;
  for (let i = 0; i < tiers; i++) {
    const r0 = r * (1 - i * 0.25);
    const yt = y + i * tierH + tierH / 2; // cones are centred on their own origin
    cone(b, ch, hexMast, r0, tierH, 6, { x, y: yt, z });
  }
  const top = y + h;
  if (dish > 0) hemi(b, ch, hexTip, dish, 8, 6, { x, y: top, z, rx: 0.6 });
  else box(b, ch, hexTip, tip, tip, tip, { x, y: top + tip / 2, z });
}

// Two stiles plus `rungs` cross rungs, the WHOLE assembly yawed by `ry` —
// the stile offsets rotate with it, so a yawed ladder stays a ladder.
export function ladder(b, ch, hex, { x = 0, y = 0, z = 0, h, w = 0.55, rungs = 5, rail = 0.07, ry = 0 }) {
  const cos = Math.cos(ry);
  const sin = Math.sin(ry);
  const px = (lx) => x + lx * cos;
  const pz = (lx) => z - lx * sin;
  const rungH = w - 2 * rail;
  const step = h / (rungs + 1);
  for (const lx of [-w / 2, w / 2]) {
    box(b, ch, hex, rail, h, rail, { x: px(lx), y: y + h / 2, z: pz(lx), ry });
  }
  for (let i = 1; i <= rungs; i++) {
    box(b, ch, hex, rungH, rail, rail, { x, y: y + i * step, z, ry });
  }
}

// A framed radiator of `w` x `h` in the local XY plane filled with `fins`,
// the whole panel yawed by `ry` (offsets rotate with it).
export function radiatorPanel(b, ch, hexFrame, hexFin, { x = 0, y = 0, z = 0, w, h, fins = 5, ry = 0, thick = 0.14 }) {
  const cos = Math.cos(ry);
  const sin = Math.sin(ry);
  const px = (lx) => x + lx * cos;
  const pz = (lx) => z - lx * sin;
  box(b, ch, hexFrame, w, thick, thick, { x, y: y + h / 2, z, ry });
  box(b, ch, hexFrame, w, thick, thick, { x, y: y - h / 2, z, ry });
  for (const lx of [-w / 2, w / 2]) {
    box(b, ch, hexFrame, thick, h, thick, { x: px(lx), y, z: pz(lx), ry });
  }
  const finStep = w / (fins + 1);
  for (let i = 1; i <= fins; i++) {
    const lx = -w / 2 + i * finStep;
    box(b, ch, hexFin, thick * 0.8, h * 0.9, thick * 0.3, { x: px(lx), y, z: pz(lx), ry });
  }
}

// `count` lamps spaced evenly from A to B inclusive. Stepped by lerp from A,
// so the string never runs past B.
export function lampString(b, ch, hex, { ax, ay, az, bx, by, bz, count, size = 0.3 }) {
  const A = new THREE.Vector3(ax, ay, az);
  const B = new THREE.Vector3(bx, by, bz);
  const n = Math.max(1, count | 0);
  const p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    p.lerpVectors(A, B, n > 1 ? i / (n - 1) : 0);
    box(b, ch, hex, size, size, size, { x: p.x, y: p.y, z: p.z });
  }
}

export function crate(b, ch, hex, { x = 0, y = 0, z = 0, s = 1.6, ry = 0, bands = 2, bandHex = hex }) {
  // Main box
  box(b, ch, hex, s, s, s, { x, y, z, ry });
  // Bands around it
  const bandW = s * 1.05;
  const bandH = s * 0.12;
  const bandD = s * 0.12;
  for (let i = 0; i < bands; i++) {
    const yt = y - s / 2 + (s / (bands + 1)) * (i + 1);
    box(b, ch, bandHex, bandW, bandH, bandD, { x, y: yt, z, ry });
  }
}
