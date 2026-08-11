/**
 * Ship sculpt measurement — wave 0 charter instrument.
 *
 * **Migration gate.** At wave 0 nothing has been rebuilt yet, so REBUILT_FACTIONS
 * is empty. Both harnesses pin a faction against SHIP_SCALE + proportionFor()
 * ONLY if REBUILT_FACTIONS.has(faction); otherwise they use LEGACY_SHIP_SCALE +
 * LEGACY_PROPORTION (exact wave-47 behaviour). This is how waves 1-12 add
 * rebuilt factions without turning the other fleets red.
 *
 * Builds every `src/systems/ships/<faction>.js` sculpt directly through
 * detailBuilder (built kind) or buildShipMesh (grown/field kinds) and reports
 * the numbers the pins care about, per faction x classKey: hull/lights vertices,
 * spans (size = max of spanX/spanY/spanZ), envelope ratios, single-mass share
 * over an EDGE-SAMPLED occupancy grid, orphan-lights share, palette strays, lights
 * tints below the 0.6 floor, and determinism.
 *
 * scripts/boot-test.mjs pins the same contract inside the real spawn path and
 * is the authority. This exists because it runs in 3 seconds across 72 sculpts
 * (12 factions × 6 classes) and names the offending class, which is what makes
 * a bring-up loop possible.
 *
 * **Retired pins.** The radius band (`rad`) and the wave-47 proportion pins
 * (`spanZ >= 2.4 * spanX`, `spanY <= 0.75 * spanX`) are gone — SHIP_PROPORTION
 * replaces them with ratios that match the bible (see docs/FactionShipRebuildPlan.md
 * §1 "Silhouette rules"). What survives is what the bible actually states.
 *
 * **Usage:** `node scripts/measure-ships.mjs [faction ...]`
 *
 * The script runs in bare Node and stubs DOM globals (document/window) needed by
 * organic.js for Beautiful Ones grown ships (canvas textures).
 */

// Stub DOM globals for organic.js (canvas textures)
const elements = new Map();
function makeEl(tag = 'div') {
  const el = {
    tagName: tag.toUpperCase(),
    children: [],
    parent: null,
    _listeners: {},
    _attrs: {},
    width: tag === 'canvas' ? 256 : 0,
    height: tag === 'canvas' ? 256 : 0,
    style: { setProperty(k, v) { this[k] = v; } },
    classList: {
      _s: new Set(),
      _commit() { el.className = [...this._s].join(' '); },
      add(...c) { c.forEach((x) => this._s.add(x)); this._commit(); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); this._commit(); },
      toggle(c, f) { (f ?? !this._s.has(c)) ? this._s.add(c) : this._s.delete(c); this._commit(); },
      contains(c) { return this._s.has(c); },
    },
    dataset: {},
    innerHTML: '',
    value: '',
    appendChild(c) { c.parent = el; this.children.push(c); return c; },
    append(...c) { for (const x of c) if (x && typeof x === 'object') x.parent = el; this.children.push(...c); },
    prepend(...c) { for (const x of c) if (x && typeof x === 'object') x.parent = el; this.children.unshift(...c); },
    remove() { this.parent?.children.splice(this.parent.children.indexOf(this), 1); },
    replaceWith(...c) { const p = this.parent; const i = p?.children.indexOf(this); if (i >= 0) p.children.splice(i, 1, ...c); },
    insertBefore(c, r) { const p = this.parent; const i = p?.children.indexOf(r ?? this); if (i >= 0) { c.parent = p; p.children.splice(i, 0, c); } return c; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getAttribute(n) { return this._attrs[n]; },
    setAttribute(n, v) { this._attrs[n] = String(v); },
    removeAttribute(n) { delete this._attrs[n]; },
    addEventListener(e, fn) { (this._listeners[e] ??= []).push(fn); },
    removeEventListener(e, fn) { const a = this._listeners[e]; if (!a) return; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); },
    dispatchEvent(e) { const a = this._listeners[e.type]; if (!a) return; for (const fn of a) fn(e); },
    getBoundingClientRect() { return { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 }; },
    focus() {},
    blur() {},
    click() { this.dispatchEvent({ type: 'click' }); },
    textContent: '',
    className: '',
    getContext() { return { 
      createImageData() { return { data: new Uint8ClampedArray(0), width: 0, height: 0 }; },
      getImageData() { return { data: new Uint8ClampedArray(0), width: 0, height: 0 }; },
      putImageData() {},
      drawImage() {},
      fillRect() {},
      strokeRect() {},
      clearRect() {},
      fillText() {},
      strokeText() {},
      measureText() { return { width: 0 }; },
      restore() {},
      scale() {},
      translate() {},
      rotate() {},
      beginPath() {},
      closePath() {},
      moveTo() {},
      lineTo() {},
      quadraticCurveTo() {},
      bezierCurveTo() {},
      arc() {},
      fill() {},
      stroke() {},
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
    }; },
  };
  Object.defineProperty(el, 'className', { get() { return [...el.classList._s].join(' '); }, set(v) { el.classList._s = new Set(String(v).split(/\s+/).filter(Boolean)); } });
  return el;
}
globalThis.document = {
  createElement: (t) => makeEl(t),
  createElementNS: (_, t) => makeEl(t),
  createTextNode: (t) => ({ nodeType: 3, textContent: t, remove() {} }),
  createDocumentFragment: () => makeEl('fragment'),
  getElementById: (id) => {
    if (!elements.has(id)) elements.set(id, makeEl());
    return elements.get(id);
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  body: makeEl('body'),
  addEventListener() {},
  hidden: false,
};
const winListeners = {};
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
    getContext() { return { 
      createImageData() { return { data: new Uint8ClampedArray(0), width: 0, height: 0 }; },
      getImageData() { return { data: new Uint8ClampedArray(0), width: 0, height: 0 }; },
      putImageData() {},
      drawImage() {},
      fillRect() {},
      strokeRect() {},
      clearRect() {},
      fillText() {},
      strokeText() {},
      measureText() { return { width: 0 }; },
      save() {},
      restore() {},
      scale() {},
      translate() {},
      rotate() {},
      transform() {},
      setTransform() {},
      resetTransform() {},
      beginPath() {},
      closePath() {},
      moveTo() {},
      lineTo() {},
      quadraticCurveTo() {},
      bezierCurveTo() {},
      arc() {},
      arcTo() {},
      ellipse() {},
      rect() {},
      fill() {},
      stroke() {},
      clip() {},
      save() {},
      restore() {},
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      shadowBlur: 0,
      shadowColor: 'transparent',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      direction: 'ltr',
    }; },
  removeEventListener(type, fn) { const a = winListeners[type]; if (!a) return; const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); },
  dispatchEvent() {},
};

import * as THREE from 'three';
import { detailBuilder } from '../src/systems/station-detail.js';
import { FACTION_STYLE } from '../src/game/faction-style.js';
import {
  P,
  SHIP_SCALE,
  LEGACY_SHIP_SCALE,
  LEGACY_PROPORTION,
  SHIP_PROPORTION,
  proportionFor,
  scaleFor,
  measureKindFor,
  REBUILT_FACTIONS,
  CLASS_ORDER,
  FACTION_REBUILD_ORDER,
} from '../src/game/ship-scale.js';
import { buildShipMesh } from '../src/systems/npc.js';

const SHADES = [1.0, 0.86, 0.72, 0.6];

/** Build the set of allowed hull-colour hexes for a built faction. */
const allowedHull = (faction) => {
  const st = FACTION_STYLE[faction];
  const set = new Set();
  for (const hex of new Set([st.hull, st.hullDark, st.trim, st.accent, ...st.patch])) {
    const r = (hex >> 16) & 255;
    const g = (hex >> 8) & 255;
    const b = hex & 255;
    for (const s of SHADES) {
      set.add(((Math.round(r * s) << 16) | (Math.round(g * s) << 8) | Math.round(b * s)) >>> 0);
    }
  }
  return set;
};

const probe = new THREE.Color();
const toHex = (r, g, b) => {
  probe.setRGB(r, g, b);
  return probe.getHex();
};

/**
 * Distinct sRGB hexes in a geometry's colour attribute.
 */
const hexesOf = (geo) => {
  if (!geo.attributes.color) return new Set([0xffffff]);
  const attr = geo.attributes.color;
  const seen = new Set();
  for (let i = 0; i < attr.count; i++) {
    seen.add(toHex(attr.getX(i), attr.getY(i), attr.getZ(i)));
  }
  return seen;
};

/**
 * Occupancy grid over EDGE SAMPLES. A BoxGeometry carries vertices only at its
 * 8 corners, so a vertex-only grid at these cell sizes reads a solid spine as a
 * chain of islands. Walking every TRIANGLE edge in half-cell steps keeps the
 * measurement honest at ship scale — and it must stay byte-identical in spirit
 * to boot-test.mjs's w49edgeSampledOccupancy, which is the authority.
 */
const massShare = (geo, cell) => {
  const p = geo.attributes.position;
  const grid = new Set();
  const mark = (x, y, z) => grid.add(`${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`);
  const step = cell / 2;
  for (let t = 0; t < p.count; t += 3) {
    for (let e = 0; e < 3; e++) {
      const i = t + e;
      const j = t + ((e + 1) % 3);
      const ax = p.getX(i); const ay = p.getY(i); const az = p.getZ(i);
      const bx = p.getX(j); const by = p.getY(j); const bz = p.getZ(j);
      const d = Math.hypot(bx - ax, by - ay, bz - az);
      const n = Math.max(1, Math.ceil(d / step));
      for (let k = 0; k <= n; k++) {
        const f = k / n;
        mark(ax + (bx - ax) * f, ay + (by - ay) * f, az + (bz - az) * f);
      }
    }
  }
  const neighbours = (key) => {
    const [ix, iy, iz] = key.split(',').map(Number);
    return [`${ix + 1},${iy},${iz}`, `${ix - 1},${iy},${iz}`, `${ix},${iy + 1},${iz}`,
      `${ix},${iy - 1},${iz}`, `${ix},${iy},${iz + 1}`, `${ix},${iy},${iz - 1}`];
  };
  const seen = new Set();
  const comps = []; // { size, min:[x,y,z], max:[x,y,z] } in world units
  for (const start of grid) {
    if (seen.has(start)) continue;
    let size = 0;
    const lo = [Infinity, Infinity, Infinity];
    const hi = [-Infinity, -Infinity, -Infinity];
    const stack = [start];
    seen.add(start);
    while (stack.length > 0) {
      const cur = stack.pop();
      size++;
      const idx = cur.split(',').map(Number);
      for (let a = 0; a < 3; a++) {
        if (idx[a] * cell < lo[a]) lo[a] = idx[a] * cell;
        if ((idx[a] + 1) * cell > hi[a]) hi[a] = (idx[a] + 1) * cell;
      }
      for (const n of neighbours(cur)) {
        if (grid.has(n) && !seen.has(n)) { seen.add(n); stack.push(n); }
      }
    }
    comps.push({ size, min: lo, max: hi });
  }
  comps.sort((a, b) => b.size - a.size);
  const largest = comps.length > 0 ? comps[0].size : 0;
  // Name the islands: a singleMass failure is almost always ONE part that
  // misses the hull, and its bounding box is the fastest way to find which.
  const islands = comps.slice(1, 4).map((c) => `${c.size} cells`
    + ` x[${c.min[0].toFixed(1)},${c.max[0].toFixed(1)}]`
    + ` y[${c.min[1].toFixed(1)},${c.max[1].toFixed(1)}]`
    + ` z[${c.min[2].toFixed(1)},${c.max[2].toFixed(1)}]`).join(' + ');
  return { share: grid.size > 0 ? largest / grid.size : 0, cells: grid.size, comps: comps.length, islands };
};

/**
 * Share of `detail` vertices with no hull vertex in their 3x3x3 cell block.
 * Math.floor, not Math.round — the boot test's w49orphanPct floors, and the two
 * harnesses have to agree or a sculpt passes one gate and fails the other.
 */
const orphanPct = (hull, detail, cell = 1.0) => {
  const hp = hull.attributes.position;
  const occupied = new Set();
  for (let i = 0; i < hp.count; i++) {
    occupied.add(`${Math.floor(hp.getX(i) / cell)},${Math.floor(hp.getY(i) / cell)},${Math.floor(hp.getZ(i) / cell)}`);
  }
  const dp = detail.attributes.position;
  if (dp.count === 0) return 100;
  let orphans = 0;
  for (let i = 0; i < dp.count; i++) {
    const ix = Math.floor(dp.getX(i) / cell);
    const iy = Math.floor(dp.getY(i) / cell);
    const iz = Math.floor(dp.getZ(i) / cell);
    let near = false;
    for (let dx = -1; dx <= 1 && !near; dx++) {
      for (let dy = -1; dy <= 1 && !near; dy++) {
        for (let dz = -1; dz <= 1 && !near; dz++) {
          if (occupied.has(`${ix + dx},${iy + dy},${iz + dz}`)) near = true;
        }
      }
    }
    if (!near) orphans++;
  }
  return (100 * orphans) / dp.count;
};

/**
 * Measure a geometry: vertex count, ABSOLUTE half-extents per axis (what the
 * legacy envelope pins compare against), full spans, bbox centre (the pivot
 * pin), max radius from the local origin, and stern reach (largest positive z).
 *
 * maxX/maxY/maxZ are max(|coord|), NOT bbox.max — a hull whose nose reaches
 * z=-9 and stern z=+3 has a legacy maxZ of 9, and reading bbox.max.z would
 * silently pass a sculpt that is half again too long forward.
 */
const measure = (geo) => {
  const p = geo.attributes.position;
  let maxX = 0; let maxY = 0; let maxZ = 0; let sternZ = 0; let r2 = 0;
  let loX = Infinity; let hiX = -Infinity;
  let loY = Infinity; let hiY = -Infinity;
  let loZ = Infinity; let hiZ = -Infinity;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i);
    if (Math.abs(x) > maxX) maxX = Math.abs(x);
    if (Math.abs(y) > maxY) maxY = Math.abs(y);
    if (Math.abs(z) > maxZ) maxZ = Math.abs(z);
    if (z > sternZ) sternZ = z;
    if (x < loX) loX = x; if (x > hiX) hiX = x;
    if (y < loY) loY = y; if (y > hiY) hiY = y;
    if (z < loZ) loZ = z; if (z > hiZ) hiZ = z;
    const d = x * x + y * y + z * z;
    if (d > r2) r2 = d;
  }
  return {
    verts: p.count, maxX, maxY, maxZ, sternZ, radius: Math.sqrt(r2),
    spanX: hiX - loX, spanY: hiY - loY, spanZ: hiZ - loZ,
    centre: { x: (loX + hiX) / 2, y: (loY + hiY) / 2, z: (loZ + hiZ) / 2 },
  };
};

const want = process.argv.slice(2);
const targets = want.length > 0 ? want : FACTION_REBUILD_ORDER;
let failures = 0;

for (const faction of targets) {
  const kind = measureKindFor(faction);
  const isRebuilt = REBUILT_FACTIONS.has(faction);
  const spec = isRebuilt ? 'charter' : 'legacy';
  
  // For unrebuilt beautiful/unknowables, print census but pin nothing
  const isUnpinned = !isRebuilt && (kind === 'grown' || kind === 'field');
  
  if (kind === 'built') {
    // Built kind: import the faction's ship file
    let mod;
    try {
      mod = await import(`../src/systems/ships/${faction}.js`);
    } catch (err) {
      console.log(`${faction}: MODULE LOAD FAIL — ${err.message}`);
      failures++;
      continue;
    }
    const kit = mod[`${faction}Ship`];
    if (!kit) {
      console.log(`${faction}: no export named ${faction}Ship (got ${Object.keys(mod).join(',')})`);
      failures++;
      continue;
    }
    
    const allowed = allowedHull(faction);
    
    for (const ck of CLASS_ORDER) {
      const entry = kit[ck];
      if (!entry || typeof entry.build !== 'function' || typeof entry.glowZ !== 'number') {
        console.log(`${faction} ${ck}: MISSING or malformed entry`);
        failures++;
        continue;
      }
      
      let geos;
      let geosB;
      try {
        const b = detailBuilder();
        entry.build(b, FACTION_STYLE[faction]);
        geos = b.build();
        const b2 = detailBuilder();
        entry.build(b2, FACTION_STYLE[faction]);
        geosB = b2.build();
      } catch (err) {
        console.log(`${faction} ${ck}: BUILD THREW — ${err.message}`);
        failures++;
        continue;
      }
      
      const bad = [];
      if (!geos.hull) bad.push('no hull chunk');
      if (!geos.lights) bad.push('no lights chunk');
      const extra = Object.keys(geos).filter((k) => k !== 'hull' && k !== 'lights');
      if (extra.length > 0) bad.push(`extra channels ${extra.join(',')}`);
      if (!geos.hull) {
        console.log(`${faction} ${ck}: ${bad.join('; ')}`);
        failures++;
        continue;
      }
      
      const h = measure(geos.hull);
      const l = geos.lights ? measure(geos.lights) : { verts: 0 };
      const cell = isRebuilt ? scaleFor(ck).cell : (LEGACY_SHIP_SCALE[ck]?.cell ?? 1.0);
      const mass = massShare(geos.hull, cell);
      const orphan = geos.lights ? orphanPct(geos.hull, geos.lights, cell) : 100;
      
      // Choose pin set based on rebuild status
      if (isRebuilt) {
        // Charter pins
        const rule = proportionFor(ck, faction);
        const charter = scaleFor(ck);
        
        // Size: max(spanX, spanY, spanZ) in WORLD UNITS against `span`.
        // `pBand` is the same band expressed in multiples of P and is printed
        // for the reviewer only — pinning against it would compare 6.4 units
        // to 1.1 and fail every sculpt in the fleet.
        const size = Math.max(h.spanX, h.spanY, h.spanZ);
        const sizeAxis = h.spanX >= h.spanY && h.spanX >= h.spanZ ? 'X' : h.spanY >= h.spanZ ? 'Y' : 'Z';
        if (size < charter.span[0] || size > charter.span[1]) {
          bad.push(`size=${size.toFixed(1)} (${sizeAxis}) outside ${charter.span[0]}-${charter.span[1]}`
            + ` (${(size / P).toFixed(2)} P, want ${charter.pBand[0]}-${charter.pBand[1]} P)`);
        }
        
        // Proportion ratios
        const lengthBeam = h.spanZ / h.spanX;
        const heightLength = h.spanY / h.spanZ;
        const beamLength = h.spanX / h.spanZ;
        
        if (lengthBeam < rule.minLengthOverBeam) {
          bad.push(`spanZ/spanX=${lengthBeam.toFixed(2)} < ${rule.minLengthOverBeam}`);
        }
        if (heightLength > rule.maxHeightOverLength) {
          bad.push(`spanY/spanZ=${heightLength.toFixed(2)} > ${rule.maxHeightOverLength}`);
        }
        if (beamLength < rule.minBeamOverLength) {
          bad.push(`spanX/spanZ=${beamLength.toFixed(2)} < ${rule.minBeamOverLength}`);
        }
        
        // Pivot offset: centre must be within 15% of each span
        const maxPivot = rule.maxPivotOffset;
        if (Math.abs(h.centre.x) > maxPivot * h.spanX) {
          bad.push(`pivotX=${(h.centre.x / h.spanX).toFixed(2)} > ${maxPivot}`);
        }
        if (Math.abs(h.centre.y) > maxPivot * h.spanY) {
          bad.push(`pivotY=${(h.centre.y / h.spanY).toFixed(2)} > ${maxPivot}`);
        }
        if (Math.abs(h.centre.z) > maxPivot * h.spanZ) {
          bad.push(`pivotZ=${(h.centre.z / h.spanZ).toFixed(2)} > ${maxPivot}`);
        }
        
        // Hull/lights vertex budgets
        if (h.verts < charter.hull[0]) bad.push(`hull ${h.verts} < ${charter.hull[0]}`);
        if (h.verts > charter.hull[1]) bad.push(`hull ${h.verts} > ${charter.hull[1]}`);
        if (l.verts < charter.lights) bad.push(`lights ${l.verts} < ${charter.lights}`);
        if (l.verts > h.verts * 0.25) bad.push(`lights ${l.verts} > 25% of hull`);
        
        // glowZ: must be positive, within stern reach + 1.2, and at least 55% of stern
        if (!(entry.glowZ > 0 && entry.glowZ <= h.sternZ + 1.2 && entry.glowZ >= 0.55 * h.sternZ)) {
          bad.push(`glowZ ${entry.glowZ} vs stern ${h.sternZ.toFixed(2)}`);
        }
        
        // Single-mass share
        if (mass.share < 0.97) bad.push(`singleMass ${(100 * mass.share).toFixed(1)}% (${mass.comps} comps; islands: ${mass.islands})`);
        
        // Orphan lights
        if (orphan > 2) bad.push(`orphanLights ${orphan.toFixed(1)}%`);
        
        // Palette strays and lights floor
        const strays = [...hexesOf(geos.hull)].filter((hex) => !allowed.has(hex));
        if (strays.length > 0) {
          bad.push(`hull strays ${strays.slice(0, 4).map((x) => `#${x.toString(16).padStart(6, '0')}`).join(',')}`);
        }
        if (geos.lights) {
          const dim = [...hexesOf(geos.lights)].filter((hex) => Math.min((hex >> 16) & 255, (hex >> 8) & 255, hex & 255) / 255 < 0.6);
          if (dim.length > 0) {
            bad.push(`lights below 0.6 ${dim.slice(0, 4).map((x) => `#${x.toString(16).padStart(6, '0')}`).join(',')}`);
          }
        }
        
        // Determinism
        if (geosB.hull) {
          const a1 = geos.hull.attributes.position.array;
          const b1 = geosB.hull.attributes.position.array;
          const same = a1.length === b1.length && a1.every((v, i) => v === b1[i]);
          if (!same) bad.push('non-deterministic');
        }
      } else {
        // Legacy pins (wave-47 behaviour)
        const legacy = LEGACY_SHIP_SCALE[ck];
        if (!legacy) {
          console.log(`${faction} ${ck}: [unpinned: not in legacy table]`);
          continue;
        }
        
        // Per-axis half-extent ceilings
        if (h.maxX > legacy.env[0]) bad.push(`x ${h.maxX.toFixed(2)} > ${legacy.env[0]}`);
        if (h.maxY > legacy.env[1]) bad.push(`y ${h.maxY.toFixed(2)} > ${legacy.env[1]}`);
        if (h.maxZ > legacy.env[2]) bad.push(`z ${h.maxZ.toFixed(2)} > ${legacy.env[2]}`);
        
        // Radius band
        if (h.radius < legacy.rad[0]) bad.push(`radius ${h.radius.toFixed(2)} < ${legacy.rad[0]}`);
        if (h.radius > legacy.rad[1]) bad.push(`radius ${h.radius.toFixed(2)} > ${legacy.rad[1]}`);
        
        // Legacy proportion pins
        if (h.spanZ < LEGACY_PROPORTION.minLengthOverBeam * h.spanX) {
          bad.push(`tooStubby ${h.spanZ.toFixed(1)} vs ${h.spanX.toFixed(1)} (need >= 2.4x)`);
        }
        if (h.spanY > LEGACY_PROPORTION.maxHeightOverBeam * h.spanX) {
          bad.push(`tooTall ${h.spanY.toFixed(1)} vs ${h.spanX.toFixed(1)} (need <= 0.75x)`);
        }
        
        // Hull/lights vertex budgets
        if (h.verts < legacy.hull[0]) bad.push(`hull ${h.verts} < ${legacy.hull[0]}`);
        if (h.verts > legacy.hull[1]) bad.push(`hull ${h.verts} > ${legacy.hull[1]}`);
        if (l.verts < legacy.lit) bad.push(`lights ${l.verts} < ${legacy.lit}`);
        if (l.verts > h.verts * 0.25) bad.push(`lights ${l.verts} > 25% of hull`);
        
        // glowZ
        if (!(entry.glowZ > 0 && entry.glowZ <= h.sternZ + 1.2 && entry.glowZ >= 0.55 * h.sternZ)) {
          bad.push(`glowZ ${entry.glowZ} vs stern ${h.sternZ.toFixed(2)}`);
        }
        
        // Single-mass share
        if (mass.share < 0.97) bad.push(`singleMass ${(100 * mass.share).toFixed(1)}% (${mass.comps} comps; islands: ${mass.islands})`);
        
        // Orphan lights
        if (orphan > 2) bad.push(`orphanLights ${orphan.toFixed(1)}%`);
        
        // Palette strays and lights floor
        const strays = [...hexesOf(geos.hull)].filter((hex) => !allowed.has(hex));
        if (strays.length > 0) {
          bad.push(`hull strays ${strays.slice(0, 4).map((x) => `#${x.toString(16).padStart(6, '0')}`).join(',')}`);
        }
        if (geos.lights) {
          const dim = [...hexesOf(geos.lights)].filter((hex) => Math.min((hex >> 16) & 255, (hex >> 8) & 255, hex & 255) / 255 < 0.6);
          if (dim.length > 0) {
            bad.push(`lights below 0.6 ${dim.slice(0, 4).map((x) => `#${x.toString(16).padStart(6, '0')}`).join(',')}`);
          }
        }
        
        // Determinism
        if (geosB.hull) {
          const a1 = geos.hull.attributes.position.array;
          const b1 = geosB.hull.attributes.position.array;
          const same = a1.length === b1.length && a1.every((v, i) => v === b1[i]);
          if (!same) bad.push('non-deterministic');
        }
      }
      
      // Size calculation for census line
      const size = Math.max(h.spanX, h.spanY, h.spanZ);
      const sizeAxis = h.spanX >= h.spanY && h.spanX >= h.spanZ ? 'X' : h.spanY >= h.spanZ ? 'Y' : 'Z';
      const ratios = `len/beam=${(h.spanZ / h.spanX).toFixed(2)} ht/len=${(h.spanY / h.spanZ).toFixed(2)} beam/len=${(h.spanX / h.spanZ).toFixed(2)}`;
      
      const line = `${faction.padEnd(13)} ${ck.padEnd(10)} spec=${spec.padEnd(7)}`
        + ` hull=${String(h.verts).padStart(6)} lights=${String(l.verts).padStart(5)}`
        + ` size=${size.toFixed(1)} (${sizeAxis})`
        + ` ${ratios}`
        + ` stern=${h.sternZ.toFixed(1)} glowZ=${entry.glowZ}`
        + ` mass=${(100 * mass.share).toFixed(1)}%`
        + ` orphan=${orphan.toFixed(1)}%`;
      
      if (bad.length > 0) {
        failures++;
        console.log(`${line}\n    FAIL: ${bad.join(' | ')}`);
      } else {
        console.log(line);
      }
      
      for (const g of [...Object.values(geos), ...Object.values(geosB)]) g.dispose();
    }
  } else {
    // Grown (beautiful) or field (unknowables) kind: use buildShipMesh
    for (const ck of CLASS_ORDER) {
      let group;
      try {
        group = buildShipMesh(ck, faction, 'trader');
      } catch (err) {
        console.log(`${faction} ${ck}: MESH BUILD THREW — ${err.message}`);
        failures++;
        continue;
      }
      
      if (!group) {
        console.log(`${faction} ${ck}: buildShipMesh returned null`);
        failures++;
        continue;
      }
      
      // Update world matrices before measuring
      group.updateMatrixWorld(true);
      
      // Collect all non-glow meshes
      const meshes = [];
      const glowObj = group.userData.glow;
      group.traverse((obj) => {
        if (obj.isMesh && obj !== glowObj && !(glowObj && obj.isDescendantOf && obj.isDescendantOf(glowObj))) {
          meshes.push(obj);
        }
      });
      
      if (meshes.length === 0) {
        console.log(`${faction} ${ck}: no measurable meshes`);
        failures++;
        continue;
      }
      
      // Measure the union of all mesh geometries in group-local space
      let totalVerts = 0;
      let glowVerts = 0;
      const unionBbox = new THREE.Box3();
      const _v = new THREE.Vector3();
      const _m = new THREE.Matrix4();
      
      for (const mesh of meshes) {
        const geo = mesh.geometry;
        if (!geo || !geo.attributes.position) continue;
        
        totalVerts += geo.attributes.position.count;
        
        // Transform vertices into group-local space
        _m.copy(mesh.matrixWorld);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          _v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
          _v.applyMatrix4(_m);
          unionBbox.expandByPoint(_v);
        }
      }
      
      // Count glow vertices (informational only)
      if (glowObj && glowObj.isMesh && glowObj.geometry) {
        glowVerts = glowObj.geometry.attributes.position?.count ?? 0;
      }
      
      // Compute measurements from the union bbox
      const { min, max } = unionBbox;
      const span = new THREE.Vector3().subVectors(max, min);
      const centre = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
      const sternZ = max.z;
      
      // Radius: max distance from origin
      let r = 0;
      for (const mesh of meshes) {
        const geo = mesh.geometry;
        if (!geo || !geo.attributes.position) continue;
        
        _m.copy(mesh.matrixWorld);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          _v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
          _v.applyMatrix4(_m);
          r = Math.max(r, _v.length());
        }
      }
      
      const size = Math.max(span.x, span.y, span.z);
      const sizeAxis = span.x >= span.y && span.x >= span.z ? 'X' : span.y >= span.z ? 'Y' : 'Z';
      const ratios = `len/beam=${(span.z / span.x).toFixed(2)} ht/len=${(span.y / span.z).toFixed(2)} beam/len=${(span.x / span.z).toFixed(2)}`;
      
      // Census line (no pins for unrebuilt grown/field)
      const line = `${faction.padEnd(13)} ${ck.padEnd(10)} spec=${spec.padEnd(7)}`
        + ` verts=${String(totalVerts).padStart(6)} glow=${String(glowVerts).padStart(5)}`
        + ` size=${size.toFixed(1)} (${sizeAxis})`
        + ` ${ratios}`
        + ` stern=${sternZ.toFixed(1)}`
        + (isUnpinned ? ' [unpinned: not yet rebuilt]' : '');
      
      // Apply pins only if rebuilt
      if (isRebuilt) {
        const bad = [];
        const rule = proportionFor(ck, faction);
        const charter = scaleFor(ck);
        
        // Size in WORLD UNITS against `span`; `pBand` is the P-multiple form,
        // printed for the reviewer only. Same trap as the built path.
        if (size < charter.span[0] || size > charter.span[1]) {
          bad.push(`size=${size.toFixed(1)} (${sizeAxis}) outside ${charter.span[0]}-${charter.span[1]}`
            + ` (${(size / P).toFixed(2)} P, want ${charter.pBand[0]}-${charter.pBand[1]} P)`);
        }
        
        // Proportion ratios
        const lengthBeam = span.z / span.x;
        const heightLength = span.y / span.z;
        const beamLength = span.x / span.z;
        
        if (lengthBeam < rule.minLengthOverBeam) {
          bad.push(`spanZ/spanX=${lengthBeam.toFixed(2)} < ${rule.minLengthOverBeam}`);
        }
        if (heightLength > rule.maxHeightOverLength) {
          bad.push(`spanY/spanZ=${heightLength.toFixed(2)} > ${rule.maxHeightOverLength}`);
        }
        if (beamLength < rule.minBeamOverLength) {
          bad.push(`spanX/spanZ=${beamLength.toFixed(2)} < ${rule.minBeamOverLength}`);
        }
        
        // Pivot offset
        const maxPivot = rule.maxPivotOffset;
        if (Math.abs(centre.x) > maxPivot * span.x) {
          bad.push(`pivotX=${(centre.x / span.x).toFixed(2)} > ${maxPivot}`);
        }
        if (Math.abs(centre.y) > maxPivot * span.y) {
          bad.push(`pivotY=${(centre.y / span.y).toFixed(2)} > ${maxPivot}`);
        }
        if (Math.abs(centre.z) > maxPivot * span.z) {
          bad.push(`pivotZ=${(centre.z / span.z).toFixed(2)} > ${maxPivot}`);
        }
        
        if (bad.length > 0) {
          failures++;
          console.log(`${line}\n    FAIL: ${bad.join(' | ')}`);
        } else {
          console.log(line);
        }
      } else {
        console.log(line);
      }
      
      // Cleanup
      for (const mesh of meshes) {
        if (mesh.geometry) mesh.geometry.dispose();
      }
    }
  }
}

console.log(failures === 0 ? 'measure-ships: ALL PASS' : `measure-ships: ${failures} FAILING SCULPTS`);
process.exitCode = failures === 0 ? 0 : 1;
