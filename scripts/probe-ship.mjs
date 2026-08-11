/**
 * Ship sculpt call-site probe — the wave-47 instrument, kept.
 *
 * Attributes a sculpt's defects to the LINE that emitted them. Wraps the
 * detailBuilder, records every add()'s baked hex and post-transform bounding
 * box, then reports, grouped by ship-module call site:
 *   - palette strays (a hull hex off the faction's SHADES ladder, a lights hex
 *     with any sRGB channel below 0.6, or a wrong-arity hex argument)
 *   - NaN geometry (r: 0 on a cylinder-wrapping helper is the usual cause)
 *   - envelope overruns, naming the axis and the amount
 *   - the widest parts by bbox diagonal — the cage-finder from wave 45, which
 *     located the lamplighter station's whole-station cage in one pass
 *
 * measure-ships.mjs says WHICH class fails; this says WHICH LINE.
 *
 * Usage: node scripts/probe-ship.mjs <faction> <classKey>
 */
import * as THREE from 'three';
import { detailBuilder } from '../src/systems/station-detail.js';
import { FACTION_STYLE } from '../src/game/faction-style.js';

const ENV = {
  light: [2.4, 2.4, 3.8], cutter: [3.2, 2.8, 5.6], ace: [3.2, 2.6, 5.8],
  freighter: [4.6, 3.8, 7.4], heavy: [6.2, 3.6, 8.2], frigate: [18.0, 9.5, 26.0],
};
const SHADES = [1.0, 0.86, 0.72, 0.6];

const [faction, classKey] = process.argv.slice(2);
if (!faction || !classKey) {
  console.log('usage: node scripts/probe-ship.mjs <faction> <classKey>');
  process.exit(1);
}

const ladder = new Set();
{
  const st = FACTION_STYLE[faction];
  for (const hex of new Set([st.hull, st.hullDark, st.trim, st.accent, ...st.patch])) {
    const r = (hex >> 16) & 255; const g = (hex >> 8) & 255; const b = hex & 255;
    for (const s of SHADES) ladder.add(((Math.round(r * s) << 16) | (Math.round(g * s) << 8) | Math.round(b * s)) >>> 0);
  }
}

/** First stack frame inside src/systems/ships/ — the authored line, not the helper. */
const siteOf = (stack) => {
  for (const line of stack.split('\n').slice(1)) {
    if (line.includes('/ships/') || line.includes('\\ships\\')) {
      const m = line.match(/([^/\\]+:\d+:\d+)/);
      return m ? m[1] : line.trim();
    }
  }
  const m = stack.split('\n')[2]?.match(/([^/\\]+:\d+:\d+)/);
  return m ? m[1] : '?';
};

const log = [];
const record = (ch, geo, hex, site) => {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  log.push({
    ch, hex, site,
    min: [bb.min.x, bb.min.y, bb.min.z],
    max: [bb.max.x, bb.max.y, bb.max.z],
    verts: geo.attributes.position.count,
  });
};

const wrap = (b) => ({
  push: (...a) => b.push(...a),
  pop: () => b.pop(),
  count: (ch) => b.count(ch),
  total: () => b.total(),
  build: () => b.build(),
  add(ch, geo, hex, opts) {
    if (geo.index) { const ni = geo.toNonIndexed(); geo.dispose(); geo = ni; }
    const site = siteOf(new Error().stack);
    b.add(ch, geo, hex, opts);
    record(ch, geo, hex, site);
  },
  _addMatrix(ch, geo, hex, matrix) {
    if (geo.index) { const ni = geo.toNonIndexed(); geo.dispose(); geo = ni; }
    const site = siteOf(new Error().stack);
    b._addMatrix(ch, geo, hex, matrix);
    record(ch, geo, hex, site);
  },
});
const mod = await import(`../src/systems/ships/${faction}.js`);
const kit = mod[`${faction}Ship`];
const entry = kit?.[classKey];
if (!entry) { console.log(`no ${faction}Ship.${classKey}`); process.exit(1); }

const real = detailBuilder();
entry.build(wrap(real), FACTION_STYLE[faction]);
const env = ENV[classKey];

const bad = new Map(); // site → reasons
const note = (site, why) => {
  if (!bad.has(site)) bad.set(site, new Set());
  bad.get(site).add(why);
};

for (const e of log) {
  const nums = [...e.min, ...e.max];
  if (nums.some((v) => !Number.isFinite(v))) { note(e.site, 'NaN geometry'); continue; }
  const hex = typeof e.hex === 'number' ? e.hex : NaN;
  if (!Number.isFinite(hex)) note(e.site, `hex is ${typeof e.hex} (${e.hex}) — panelSkin/panelPatches need an ARRAY of hexes`);
  else if (e.ch === 'hull' && !ladder.has(hex >>> 0)) note(e.site, `hull stray #${(hex >>> 0).toString(16).padStart(6, '0')}`);
  else if (e.ch === 'lights') {
    const lo = Math.min((hex >> 16) & 255, (hex >> 8) & 255, hex & 255) / 255;
    if (lo < 0.6) note(e.site, `lights tint #${(hex >>> 0).toString(16).padStart(6, '0')} below the 0.6 floor`);
  }
  if (e.ch !== 'hull' && e.ch !== 'lights') note(e.site, `channel '${e.ch}' — only 'hull' and 'lights' exist`);
  if (env) {
    const ax = Math.max(Math.abs(e.min[0]), Math.abs(e.max[0]));
    const ay = Math.max(Math.abs(e.min[1]), Math.abs(e.max[1]));
    const az = Math.max(Math.abs(e.min[2]), Math.abs(e.max[2]));
    if (ax > env[0]) note(e.site, `x reaches ${ax.toFixed(2)} (ceiling ${env[0]})`);
    if (ay > env[1]) note(e.site, `y reaches ${ay.toFixed(2)} (ceiling ${env[1]})`);
    if (az > env[2]) note(e.site, `z reaches ${az.toFixed(2)} (ceiling ${env[2]})`);
  }
}

console.log(`${faction} ${classKey}: ${log.length} primitives, ${log.reduce((n, e) => n + e.verts, 0)} vertices`);
const byChannel = {};
for (const e of log) byChannel[e.ch] = (byChannel[e.ch] ?? 0) + e.verts;
console.log('channels:', JSON.stringify(byChannel));

if (bad.size === 0) console.log('no palette, channel, NaN or envelope defects attributable to a call site');
else {
  console.log(`\n${bad.size} offending call site(s):`);
  for (const [site, reasons] of [...bad].sort((a, b) => b[1].size - a[1].size)) {
    console.log(`  ${site}`);
    for (const r of reasons) console.log(`      ${r}`);
  }
}

// The cage-finder: a helper called with the wrong radius or axis shows up as a
// part whose bounding box swallows the ship (wave 45, lamplighter).
const diag = (e) => Math.hypot(e.max[0] - e.min[0], e.max[1] - e.min[1], e.max[2] - e.min[2]);
console.log('\nwidest primitives by bbox diagonal:');
for (const e of [...log].sort((a, b) => diag(b) - diag(a)).slice(0, 8)) {
  console.log(`  ${diag(e).toFixed(2)}  ${e.ch.padEnd(6)} ${e.site}`
    + `  x[${e.min[0].toFixed(1)},${e.max[0].toFixed(1)}]`
    + ` y[${e.min[1].toFixed(1)},${e.max[1].toFixed(1)}]`
    + ` z[${e.min[2].toFixed(1)},${e.max[2].toFixed(1)}]`);
}
