/**
 * Single-class sculpt probe — the authoring loop's instrument.
 *
 * `scripts/measure-ships.mjs` and `scripts/attach-audit.mjs` import a faction's
 * whole family through its barrel, so while six classes are being re-authored
 * in parallel one broken sibling blanks the report for the other five. This
 * imports ONE class module and reports the same numbers plus the attachment
 * verdict, so an author can budget extents, watch a vertex count and find a
 * floating part without waiting for the family to be whole.
 *
 * It is a probe, not a gate: the fleet harnesses remain the acceptance test.
 *
 * Usage: node scripts/probe-class.mjs <faction> <class>
 *   e.g. node scripts/probe-class.mjs veridian cutter
 *
 * Resolution order for the module: src/systems/ships/<faction>/<class>.js, then
 * the faction barrel src/systems/ships/<faction>.js. The class module must
 * export exactly one object carrying `{ glowZ, build }`.
 */

import { detailBuilder } from '../src/systems/station-detail.js';
import { FACTION_STYLE } from '../src/game/faction-style.js';
import { P, scaleFor, proportionFor, CLASS_ORDER, REBUILT_FACTIONS } from '../src/game/ship-scale.js';
import { allowedHull, hexesOf, massShare, orphanPct, measure, proxyCover, proxyFit } from './ship-metrics.mjs';
import { deriveProxy } from '../src/systems/npc.js';
import { analyseAttachment, analyseContact, blameIsland, TOUCH_EPS, CONTACT_CELL } from './attachment.mjs';

const [faction, ck] = process.argv.slice(2);
if (!faction || !CLASS_ORDER.includes(ck)) {
  console.log(`usage: node scripts/probe-class.mjs <faction> <${CLASS_ORDER.join('|')}>`);
  process.exit(2);
}

const load = async () => {
  for (const path of [`../src/systems/ships/${faction}/${ck}.js`, `../src/systems/ships/${faction}.js`]) {
    try {
      const mod = await import(path);
      const hit = Object.values(mod).find((v) => v && typeof v.build === 'function')
        ?? Object.values(mod).map((v) => v?.[ck]).find((v) => v && typeof v.build === 'function');
      if (hit) return { hit, path };
    } catch (err) {
      if (!/Cannot find module|Failed to load/.test(String(err.message))) throw err;
    }
  }
  return {};
};

const { hit: entry, path } = await load();
if (!entry) {
  console.log(`${faction} ${ck}: no module exporting { glowZ, build }`);
  process.exit(1);
}

const st = FACTION_STYLE[faction];
const charter = scaleFor(ck);
const rule = proportionFor(ck, faction);

const b = detailBuilder({ track: true });
entry.build(b, st);
const parts = b.parts();
const att = analyseAttachment(parts, TOUCH_EPS);
const geos = b.build();

// Channel discipline. `b.add(channel, ...)` takes the channel as its FIRST
// argument and `box()` takes it as its second, so a sculpt that calls a
// primitive with the wrong arity silently opens a THIRD channel named after a
// colour number and fills it with default-sized geometry. That defect passed an
// earlier version of this probe because it only ever looked at `geos.hull`.
const extra = Object.keys(geos).filter((k) => k !== 'hull' && k !== 'lights');
if (extra.length > 0 || !geos.hull || !geos.lights) {
  console.log(`${faction} ${ck}: channels ${Object.keys(geos).join(',')}`
    + ' — a sculpt writes exactly hull and lights');
  process.exit(1);
}
// A colour baked from a non-number (an options object passed where a hex was
// expected) comes out NaN and renders black or not at all.
for (const [name, geo] of Object.entries(geos)) {
  const col = geo.attributes.color;
  for (let i = 0; i < col.count; i++) {
    if (!Number.isFinite(col.getX(i)) || !Number.isFinite(col.getY(i)) || !Number.isFinite(col.getZ(i))) {
      console.log(`${faction} ${ck}: NaN vertex colour in '${name}' — a hex argument is not a number`);
      process.exit(1);
    }
  }
}

// THREE's BoxGeometry/CylinderGeometry default every omitted dimension to 1.
// A helper called without its `w`/`h`/`d` therefore emits a silent unit cube
// rather than throwing: on the ace that was two 1x1x1 emissive boxes from a
// `windowRow` missing its HUMAN sizes, and it rendered as a white slab across
// the nose while every numeric pin stayed green. An exact 1.000 cube is never
// authored on purpose in this fleet — HUMAN parts are all far smaller and hull
// volumes are all irregular — so flag it.
const cubes = parts.filter((p) => [0, 1, 2].every((a) => Math.abs((p.max[a] - p.min[a]) - 1) < 1e-4));
if (cubes.length > 0) {
  console.log(`${faction} ${ck}: ${cubes.length} part(s) are an exact 1x1x1 cube`
    + ' — a primitive was called without its dimensions:');
  for (const p of cubes.slice(0, 4)) console.log(`      ${p.channel}  ${p.site}`);
  process.exit(1);
}
const contact = analyseContact(Object.values(geos), CONTACT_CELL);

const h = measure(geos.hull);
const l = geos.lights ? measure(geos.lights) : { verts: 0 };
const mass = massShare(geos.hull, charter.cell);
const orphan = geos.lights ? orphanPct(geos.hull, geos.lights, 1.0) : 100;
const size = Math.max(h.spanX, h.spanY, h.spanZ);
const axis = h.spanX >= h.spanY && h.spanX >= h.spanZ ? 'X' : h.spanY >= h.spanZ ? 'Y' : 'Z';

const bad = [];
const ok = (cond, msg) => { if (!cond) bad.push(msg); };
ok(size >= charter.span[0] && size <= charter.span[1],
  `size ${size.toFixed(2)} (${axis}) outside ${charter.span[0]}-${charter.span[1]} (${(size / P).toFixed(2)} P)`);
ok(h.spanZ / h.spanX >= rule.minLengthOverBeam, `spanZ/spanX ${(h.spanZ / h.spanX).toFixed(2)} < ${rule.minLengthOverBeam}`);
ok(h.spanY / h.spanZ <= rule.maxHeightOverLength, `spanY/spanZ ${(h.spanY / h.spanZ).toFixed(2)} > ${rule.maxHeightOverLength}`);
ok(h.spanX / h.spanZ >= rule.minBeamOverLength, `spanX/spanZ ${(h.spanX / h.spanZ).toFixed(2)} < ${rule.minBeamOverLength}`);
for (const a of ['x', 'y', 'z']) {
  const span = h[`span${a.toUpperCase()}`];
  ok(Math.abs(h.centre[a]) <= rule.maxPivotOffset * span,
    `pivot${a.toUpperCase()} ${(h.centre[a] / span).toFixed(3)} > ${rule.maxPivotOffset}`);
}
ok(h.verts >= charter.hull[0], `hull ${h.verts} < ${charter.hull[0]}`);
ok(h.verts <= charter.hull[1], `hull ${h.verts} > ${charter.hull[1]}`);
ok(l.verts >= charter.lights, `lights ${l.verts} < ${charter.lights}`);
ok(l.verts <= h.verts * 0.25, `lights ${l.verts} > 25% of hull (${Math.floor(h.verts * 0.25)})`);
ok(entry.glowZ > 0 && entry.glowZ <= h.sternZ + 1.2 && entry.glowZ >= 0.55 * h.sternZ,
  `glowZ ${entry.glowZ} vs stern ${h.sternZ.toFixed(2)}`);
ok(mass.share >= 0.97, `singleMass ${(100 * mass.share).toFixed(1)}% (${mass.comps} comps; ${mass.islands})`);
ok(orphan <= 2, `orphanLights ${orphan.toFixed(1)}%`);
const allowed = allowedHull(faction);
const strays = [...hexesOf(geos.hull)].filter((hex) => !allowed.has(hex));
ok(strays.length === 0, `hull palette strays ${strays.slice(0, 4).map((x) => `#${x.toString(16).padStart(6, '0')}`).join(',')}`);
if (geos.lights) {
  const dim = [...hexesOf(geos.lights)]
    .filter((hex) => Math.min((hex >> 16) & 255, (hex >> 8) & 255, hex & 255) / 255 < 0.6);
  ok(dim.length === 0, `lights below 0.6 ${dim.slice(0, 4).map((x) => `#${x.toString(16).padStart(6, '0')}`).join(',')}`);
}
ok(att.lonely === 0 && att.attachedPct === 100 && contact.attachedPct === 100,
  `attachment lonely=${att.lonely} boxAttached=${att.attachedPct.toFixed(1)}% contact=${contact.attachedPct.toFixed(1)}%`);

// Proxy coverage and fit (rebuilt factions only)
const isRebuilt = REBUILT_FACTIONS.has(faction);
let coverPct = null;
let fit = null;
let proxy = null;
if (isRebuilt) {
  // Derive from the hull geometry directly — same function the runtime uses;
  // SHIP_SCALE.proxy is a fallback only for hull-less shapes (Unknowables).
  proxy = geos.hull ? deriveProxy(geos.hull) : scaleFor(ck).proxy;
  coverPct = proxyCover(geos.hull, proxy);
  fit = proxyFit(h, proxy);
  ok(coverPct >= 80,
    `proxyCover ${coverPct.toFixed(1)}% < 80% (rx=${proxy.rx.toFixed(2)} ry=${proxy.ry.toFixed(2)} halfLen=${proxy.halfLen.toFixed(2)})`);
  ok(fit.pass,
    `proxyFit w=${fit.widthPct.toFixed(0)}% h=${fit.heightPct.toFixed(0)}% l=${fit.lengthPct.toFixed(0)}% exceeds +25%/+25%/+35%`);
}

console.log(`${faction} ${ck}  (${path})`);
console.log(`  span    X=${h.spanX.toFixed(2)}  Y=${h.spanY.toFixed(2)}  Z=${h.spanZ.toFixed(2)}`
  + `   size=${size.toFixed(2)} (${axis}) want ${charter.span[0]}-${charter.span[1]} target ${charter.target}`);
console.log(`  ratios  len/beam=${(h.spanZ / h.spanX).toFixed(2)} (>=${rule.minLengthOverBeam})`
  + `  ht/len=${(h.spanY / h.spanZ).toFixed(2)} (<=${rule.maxHeightOverLength})`
  + `  beam/len=${(h.spanX / h.spanZ).toFixed(2)} (>=${rule.minBeamOverLength})`);
console.log(`  pivot   x=${(h.centre.x / h.spanX).toFixed(3)} y=${(h.centre.y / h.spanY).toFixed(3)}`
  + ` z=${(h.centre.z / h.spanZ).toFixed(3)}  (|.| <= ${rule.maxPivotOffset})`);
console.log(`  verts   hull=${h.verts} (${charter.hull[0]}-${charter.hull[1]})`
  + `  lights=${l.verts} (${charter.lights}-${Math.floor(h.verts * 0.25)})`);
console.log(`  seating mass=${(100 * mass.share).toFixed(1)}%  orphanLights=${orphan.toFixed(1)}%`
  + `  parts=${att.total} lonely=${att.lonely} contact=${contact.attachedPct.toFixed(1)}%`);
if (coverPct !== null) {
  console.log(`  proxy   cover=${coverPct.toFixed(1)}%`
    + `  w=${fit.widthPct.toFixed(0)}%  h=${fit.heightPct.toFixed(0)}%  l=${fit.lengthPct.toFixed(0)}%`
    + `  rx=${proxy.rx.toFixed(2)}  ry=${proxy.ry.toFixed(2)}  halfLen=${proxy.halfLen.toFixed(2)}`);
}
console.log(`  stern   z=${h.sternZ.toFixed(2)}  glowZ=${entry.glowZ}`);

for (const line of att.lonelyList) console.log(`      LONELY   ${line}`);
for (const line of att.strayList) console.log(`      BOXSTRAY ${line}`);
for (const isl of contact.islands) {
  console.log(`      FLOATING ${isl.label}`);
  for (const line of blameIsland(parts, isl)) console.log(`               ${line}`);
}

if (bad.length === 0) {
  console.log('probe-class: PASS');
} else {
  for (const line of bad) console.log(`  FAIL  ${line}`);
  console.log(`probe-class: ${bad.length} FAILING`);
}
process.exitCode = bad.length === 0 ? 0 : 1;
