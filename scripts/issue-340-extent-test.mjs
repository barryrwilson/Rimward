#!/usr/bin/env node
/**
 * Issue #340 (system scale/population Phase 3, P5a) focused extent test.
 *
 * Pins the owner decision: uniform x2 playable extent on x/z, y authored.
 * Covers:
 *  - the three duplicated planet slot tables agree exactly (orbit radii
 *    500/840/1280/1840/2800, radii unchanged, ORBIT_K still 1500);
 *  - authored-system positions are exactly x2 on x/z with y identical, and
 *    the authored field radius is scaled x2 with its centre;
 *  - generated-system geometry is exactly x2 on x/z with y identical and the
 *    field radius exactly x2; generated content sits inside the new bounds;
 *  - generated landmark separation invariants (station 800, gate/hub 600,
 *    field radius + 400, 2000u bubble) and the one re-solved landmark (the
 *    y axis stays authored, so a doubled 3D separation can reject the scaled
 *    pre-x2 candidate) are both valid;
 *  - generator determinism (two regenerations are byte-identical);
 *  - record totals stay 25-50/system, chart coordinates and all non-geometry
 *    fields are unchanged, and no persistent field/key was added;
 *  - Phase 1 deep-field band moved beyond the ~2,800u playable extent
 *    (BAND_MIN 3200, maxima kept <= 8000), starfield extent coupling, and
 *    far-asteroid scenery beyond the playable content;
 *  - far-asteroid scenery determinism and 600-800 system density.
 *
 * Base comparison uses the branch base commit (68e89d9) so the pre-x2 data is
 * read from git, not hard-coded. The GitHub CI checkout is shallow (it fetches
 * only the PR head), so when git cannot resolve the base commit the same files
 * are read from raw.githubusercontent.com for this public repo. If neither
 * source is reachable, the migration-diff checks are skipped with an explicit
 * notice while every absolute post-x2 assertion still runs.
 */
import { readFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = '68e89d9';
const BASE_REPO = 'barryrwilson/Rimward';
const GEN_REL = 'src/game/galaxy.generated.js';
const BASE_MODE = process.env.ISSUE340_BASE_SOURCE || 'auto';
const FORCE_RAW = BASE_MODE === 'raw';

let pass = 0;
const failures = [];
let skippedGroups = 0;
function check(cond, msg, detail) {
  if (cond) { pass++; return true; }
  failures.push(msg + (detail === undefined ? '' : ' (' + detail + ')'));
  console.error('FAIL: ' + msg + (detail === undefined ? '' : ' (' + detail + ')'));
  return false;
}
function skipBase() { skippedGroups++; }
function read(rel) { return readFileSync(join(ROOT, rel), 'utf8'); }
const baseCache = new Map();
async function baseSource(rel) {
  if (baseCache.has(rel)) return baseCache.get(rel);
  let src = null;
  if (BASE_MODE === 'off') { baseCache.set(rel, null); return null; }
  if (!FORCE_RAW) {
    try {
      src = execFileSync('git', ['show', BASE + ':' + rel], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      src = null;
    }
  }
  if (src === null) {
    try {
      const res = await fetch('https://raw.githubusercontent.com/' + BASE_REPO + '/' + BASE + '/' + rel, { signal: AbortSignal.timeout(15000) });
      if (res.ok) src = await res.text();
    } catch {
      src = null;
    }
  }
  baseCache.set(rel, src);
  return src;
}
function parseGenerated(src) {
  const marker = 'export const GENERATED_SYSTEMS = ';
  const start = src.indexOf(marker);
  if (start < 0) throw new Error('GENERATED_SYSTEMS export not found');
  const open = src.indexOf('{', start);
  const close = src.lastIndexOf('}');
  return JSON.parse(src.slice(open, close + 1));
}
async function loadData(src, exportName) {
  const mod = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(src));
  return mod[exportName];
}
function sha256(text) { return createHash('sha256').update(text).digest('hex'); }

// ---------------------------------------------------------------- generator
// Determinism must be checked against the on-disk file first: a stale or
// hand-edited generated file fails here even before the data checks.
const hBefore = sha256(read(GEN_REL));
const run1 = spawnSync('node', ['scripts/generate-galaxy.mjs'], { cwd: ROOT, encoding: 'utf8' });
check(run1.status === 0, 'generator exits 0', run1.status === 0 ? undefined : (run1.stderr || '').trim().slice(-400));
check(/landmarks: 94 \(1 per generated system\)/.test(run1.stdout || ''), 'generator reports 94 landmarks');
const h1 = sha256(read(GEN_REL));
const run2 = spawnSync('node', ['scripts/generate-galaxy.mjs'], { cwd: ROOT, encoding: 'utf8' });
check(run2.status === 0, 'generator second run exits 0', run2.status === 0 ? undefined : (run2.stderr || '').trim().slice(-400));
const h2 = sha256(read(GEN_REL));
check(hBefore === h1 && h1 === h2, 'generator is byte-identical across regenerations', hBefore.slice(0, 12) + ' -> ' + h1.slice(0, 12) + ' -> ' + h2.slice(0, 12));
const fallbackMatch = /landmark position fallbacks \(authored y kept\): (\d+)/.exec(run1.stdout || '');
check(fallbackMatch !== null, 'generator reports landmark fallback count');
const reportedFallbacks = fallbackMatch ? Number(fallbackMatch[1]) : -1;

const authored = await loadData(read('src/game/authored-systems.js'), 'AUTHORED_SYSTEMS');
const generated = await loadData(read(GEN_REL), 'GENERATED_SYSTEMS');
const baseAuthoredSrc = await baseSource('src/game/authored-systems.js');
const baseGeneratedSrc = await baseSource(GEN_REL);
const baseAuthored = baseAuthoredSrc === null ? null : await loadData(baseAuthoredSrc, 'AUTHORED_SYSTEMS');
const baseGenerated = baseGeneratedSrc === null ? null : parseGenerated(baseGeneratedSrc);
const haveBase = baseAuthored !== null && baseGenerated !== null;
if (!haveBase) {
  console.error('NOTE: base commit ' + BASE + ' data unavailable (shallow checkout and no network);');
  console.error('      migration-diff checks will be skipped; absolute post-x2 assertions still run.');
}

check(Object.keys(generated).length === 94, 'generated system count 94', Object.keys(generated).length);
check(Object.keys(authored).length === 7, 'authored system count 7', Object.keys(authored).length);
check(Object.keys(generated).length + Object.keys(authored).length === 101, 'total system count 101');

// ------------------------------------------------------- planet slot tables
function planetTable(src, marker) {
  const start = src.indexOf(marker);
  if (start < 0) return null;
  const end = src.indexOf('];', start);
  if (end < 0) return null;
  const block = src.slice(start, end + 2);
  const out = [];
  const re = /radius:\s*(\d+),\s*orbitRadius:\s*(\d+)/g;
  let m;
  while ((m = re.exec(block))) out.push([Number(m[1]), Number(m[2])]);
  return out;
}
const EXPECTED_TABLE = [[9, 500], [14, 840], [16, 1280], [12, 1840], [30, 2800]];
const SOLAR_MARK = 'const SLOTS = [';
const AST_MARK = 'const PLANET_SLOTS = [';
const SHADOW_MARK = 'export const PLANET_ORBITS = Object.freeze([';
const solarTable = planetTable(read('src/systems/solarsystem.js'), SOLAR_MARK);
const astTable = planetTable(read('src/systems/asteroids.js'), AST_MARK);
const shadowTable = planetTable(read('src/game/courier-shadow.js'), SHADOW_MARK);
const baseSolarSrc = await baseSource('src/systems/solarsystem.js');
const baseAstSrc = await baseSource('src/systems/asteroids.js');
const baseShadowSrc = await baseSource('src/game/courier-shadow.js');
const baseSolar = baseSolarSrc === null ? null : planetTable(baseSolarSrc, SOLAR_MARK);
const baseAst = baseAstSrc === null ? null : planetTable(baseAstSrc, AST_MARK);
const baseShadow = baseShadowSrc === null ? null : planetTable(baseShadowSrc, SHADOW_MARK);
check(JSON.stringify(solarTable) === JSON.stringify(EXPECTED_TABLE), 'solarsystem.js SLOTS orbit radii/radii', JSON.stringify(solarTable));
check(JSON.stringify(astTable) === JSON.stringify(EXPECTED_TABLE), 'asteroids.js PLANET_SLOTS orbit radii/radii', JSON.stringify(astTable));
check(JSON.stringify(shadowTable) === JSON.stringify(EXPECTED_TABLE), 'courier-shadow.js PLANET_ORBITS orbit radii/radii', JSON.stringify(shadowTable));
check(JSON.stringify(solarTable) === JSON.stringify(astTable) && JSON.stringify(astTable) === JSON.stringify(shadowTable), 'all three planet tables agree exactly');
for (const [name, baseTable] of [['solarsystem', baseSolar], ['asteroids', baseAst], ['courier-shadow', baseShadow]]) {
  if (baseTable === null) { skipBase(); continue; }
  check(baseTable !== null && baseTable.length === 5, name + ' base planet table has 5 slots');
  check(baseTable.every((slot, i) => slot[1] * 2 === EXPECTED_TABLE[i][1] && slot[0] === EXPECTED_TABLE[i][0]), name + ' base table is the x2 source (radius unchanged, orbit doubled)');
}
const solarSrc = read('src/systems/solarsystem.js');
const astSrc = read('src/systems/asteroids.js');
check(/const ORBIT_K = 1500;/.test(solarSrc), 'solarsystem.js ORBIT_K stays 1500');
check(/const ORBIT_K = 1500;/.test(astSrc), 'asteroids.js ORBIT_K stays 1500');
check(/export const PLANET_SLOT_COUNT = SLOTS.length;/.test(solarSrc), 'planet slot count export preserved');

// ------------------------------------------------------------ geometry data
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const radial = (p) => Math.hypot(p[0], p[1], p[2]);
const isVec = (p) => Array.isArray(p) && p.length === 3 && p.every((v) => typeof v === 'number' && Number.isFinite(v));
function checkVecX2(a, b, label) {
  return check(isVec(a) && isVec(b) && b[0] === a[0] * 2 && b[1] === a[1] && b[2] === a[2] * 2, label);
}
function positionsOf(def) {
  const pairs = [];
  if (def.station && def.station.position) pairs.push(['station.position', def.station.position]);
  if (def.field && def.field.center) pairs.push(['field.center', def.field.center]);
  for (const [i, g] of (def.gates || []).entries()) pairs.push(['gates[' + i + '].position', g.position]);
  if (def.hub && def.hub.position) pairs.push(['hub.position', def.hub.position]);
  for (const [i, lm] of (def.landmarks || []).entries()) pairs.push(['landmarks[' + i + '].position', lm.position]);
  for (const [i, c] of (def.clues || []).entries()) pairs.push(['clues[' + i + '].position', c.position]);
  return pairs;
}
function stripGeometry(def) {
  const copy = structuredClone(def);
  const zero = (p) => { if (Array.isArray(p)) { p[0] = null; p[1] = null; p[2] = null; } };
  if (copy.station) zero(copy.station.position);
  if (copy.field) { zero(copy.field.center); delete copy.field.radius; }
  for (const g of copy.gates || []) zero(g.position);
  if (copy.hub) zero(copy.hub.position);
  for (const lm of copy.landmarks || []) zero(lm.position);
  for (const c of copy.clues || []) zero(c.position);
  // Issue #355 (P5b): regions/lanes are new data keys on the def, validated
  // by issue-355-regions-test.mjs. Excluding them here keeps this pin's
  // contract — every field that existed before P5b is unchanged — intact.
  delete copy.regions;
  delete copy.lanes;
  return copy;
}

// authored systems: exact x2, y unchanged, field radius x2 with its centre.
if (haveBase) {
  for (const id of Object.keys(baseAuthored)) {
    const oldDef = baseAuthored[id];
    const newDef = authored[id];
    check(newDef !== undefined, 'authored system ' + id + ' still present');
    if (!newDef) continue;
    const oldPairs = positionsOf(oldDef);
    const newPairs = positionsOf(newDef);
    check(oldPairs.length === newPairs.length, id + ' authored position-field count unchanged');
    for (let i = 0; i < oldPairs.length; i++) {
      checkVecX2(oldPairs[i][1], newPairs[i][1], id + ' ' + oldPairs[i][0] + ' authored x2/y-identical');
    }
    check(newDef.field && oldDef.field && newDef.field.radius === oldDef.field.radius * 2, id + ' authored field radius exactly x2');
    check(newDef.field && newDef.field.radius >= 160 && newDef.field.radius <= 320, id + ' authored field radius in 160-320', newDef.field && newDef.field.radius);
    for (const [, p] of newPairs) check(radial(p) <= 2800, id + ' authored position within 2800u', radial(p).toFixed(1));
    check(JSON.stringify(stripGeometry(oldDef)) === JSON.stringify(stripGeometry(newDef)), id + ' authored non-geometry fields unchanged');
  }
  check(Object.keys(authored).every((id) => id in baseAuthored), 'no authored system added');
} else {
  skipBase();
  for (const [id, newDef] of Object.entries(authored)) {
    check(newDef.field && newDef.field.radius >= 160 && newDef.field.radius <= 320, id + ' authored field radius in 160-320', newDef.field && newDef.field.radius);
    for (const [, p] of positionsOf(newDef)) check(radial(p) <= 2800, id + ' authored position within 2800u', radial(p).toFixed(1));
  }
}

// generated systems: exact x2 geometry, y unchanged, bounds.
const generatedIds = Object.keys(generated);
if (haveBase) {
  check(generatedIds.length === Object.keys(baseGenerated).length, 'generated system id set size unchanged');
  let generatedX2 = 0;
  for (const id of generatedIds) {
    const oldDef = baseGenerated[id];
    const newDef = generated[id];
    check(oldDef !== undefined, 'generated system ' + id + ' exists in base');
    if (!oldDef) continue;
    checkVecX2(oldDef.station.position, newDef.station.position, id + ' station x2/y-identical');
    check(newDef.station.position[1] >= 15 && newDef.station.position[1] <= 45, id + ' station y authored range');
    check(oldDef.gates.length === newDef.gates.length, id + ' gate count unchanged');
    for (let i = 0; i < oldDef.gates.length; i++) {
      checkVecX2(oldDef.gates[i].position, newDef.gates[i].position, id + ' gate[' + i + '] x2/y-identical');
      check(newDef.gates[i].to === oldDef.gates[i].to, id + ' gate[' + i + '] destination unchanged');
      check(radial(newDef.gates[i].position) <= 2401.5, id + ' gate[' + i + '] inside 2400u radius (rounding tolerance)', radial(newDef.gates[i].position).toFixed(1));
    }
    checkVecX2(oldDef.field.center, newDef.field.center, id + ' field center x2/y-identical');
    check(newDef.field.radius === oldDef.field.radius * 2, id + ' field radius exactly x2');
    check(newDef.field.radius >= 170 && newDef.field.radius <= 320, id + ' field radius in 170-320', newDef.field.radius);
    check(Math.abs(newDef.station.position[0]) <= 1300 && Math.abs(newDef.station.position[2]) <= 1300, id + ' station inside +/-1300 x/z');
    check(Math.abs(newDef.field.center[0]) <= 1100 && Math.abs(newDef.field.center[2]) <= 1100, id + ' field center inside +/-1100 x/z');
    if (oldDef.hub) {
      checkVecX2(oldDef.hub.position, newDef.hub.position, id + ' hub x2/y-identical');
      const dx = newDef.hub.position[0] - newDef.station.position[0];
      const dz = newDef.hub.position[2] - newDef.station.position[2];
      check(dx >= 300 && dx <= 560, id + ' hub x offset in 300-560', dx);
      check(dz >= -520 && dz <= -240, id + ' hub z offset in -520..-240', dz);
      check(newDef.hub.position[1] >= -80 && newDef.hub.position[1] <= 120, id + ' hub y authored range');
    }
    check(JSON.stringify(stripGeometry(oldDef)) === JSON.stringify(stripGeometry(newDef)), id + ' generated non-geometry fields unchanged');
    generatedX2++;
  }
  check(generatedX2 === 94, 'all 94 generated systems checked');
} else {
  skipBase();
  for (const id of generatedIds) {
    const newDef = generated[id];
    check(newDef.station.position[1] >= 15 && newDef.station.position[1] <= 45, id + ' station y authored range');
    for (const [i, g] of newDef.gates.entries()) {
      check(radial(g.position) <= 2401.5, id + ' gate[' + i + '] inside 2400u radius (rounding tolerance)', radial(g.position).toFixed(1));
    }
    check(newDef.field.radius >= 170 && newDef.field.radius <= 320, id + ' field radius in 170-320', newDef.field.radius);
    check(Math.abs(newDef.station.position[0]) <= 1300 && Math.abs(newDef.station.position[2]) <= 1300, id + ' station inside +/-1300 x/z');
    check(Math.abs(newDef.field.center[0]) <= 1100 && Math.abs(newDef.field.center[2]) <= 1100, id + ' field center inside +/-1100 x/z');
    if (newDef.hub) {
      const dx = newDef.hub.position[0] - newDef.station.position[0];
      const dz = newDef.hub.position[2] - newDef.station.position[2];
      check(dx >= 300 && dx <= 560, id + ' hub x offset in 300-560', dx);
      check(dz >= -520 && dz <= -240, id + ' hub z offset in -520..-240', dz);
      check(newDef.hub.position[1] >= -80 && newDef.hub.position[1] <= 120, id + ' hub y authored range');
    }
  }
}

// generated landmarks: metadata unchanged (covered above), positions inside
// 2000u and separation invariants; the fallback count is bounded.
let landmarkX2 = 0;
const fallbackIds = [];
for (const id of generatedIds) {
  const oldDef = haveBase ? baseGenerated[id] : null;
  const newDef = generated[id];
  const oldLm = oldDef && oldDef.landmarks && oldDef.landmarks[0];
  const newLm = newDef.landmarks && newDef.landmarks[0];
  check(newDef.landmarks && newDef.landmarks.length === 1, id + ' has exactly one landmark');
  check(newLm && newLm.id === id + '_lm', id + ' landmark id scheme');
  if (oldLm) {
    check(newLm && newLm.id === oldLm.id && newLm.kind === oldLm.kind && newLm.name === oldLm.name && newLm.line === oldLm.line, id + ' landmark metadata unchanged');
  } else if (haveBase) {
    check(false, id + ' landmark missing from base');
  } else {
    skipBase();
  }
  const p = newLm.position;
  check(radial(p) <= 2000, id + ' landmark inside 2000u bubble', radial(p).toFixed(1));
  check(dist3(p, newDef.station.position) >= 800, id + ' landmark >=800u from station', dist3(p, newDef.station.position).toFixed(1));
  check(newDef.gates.every((g) => dist3(p, g.position) >= 600), id + ' landmark >=600u from every gate');
  check(dist3(p, newDef.field.center) >= newDef.field.radius + 400, id + ' landmark outside field buffer radius+400', dist3(p, newDef.field.center).toFixed(1));
  check(!newDef.hub || dist3(p, newDef.hub.position) >= 600, id + ' landmark >=600u from hub');
  if (oldLm && oldLm.position[0] * 2 === p[0] && oldLm.position[1] === p[1] && oldLm.position[2] * 2 === p[2]) {
    landmarkX2++;
  } else {
    fallbackIds.push(id);
  }
}
if (haveBase) {
  check(landmarkX2 + fallbackIds.length === 94, 'all 94 generated landmarks classified');
  check(fallbackIds.length <= 5, 'landmark fallbacks bounded', fallbackIds.length + ': ' + fallbackIds.join(','));
  check(fallbackIds.length === reportedFallbacks, 'fallback count matches generator report', fallbackIds.length + ' vs ' + reportedFallbacks);
} else {
  skipBase();
}

// record totals stay in the Phase 2 contract for every system.
function recordTotal(def) {
  const cast = def.cast || {};
  const crowd = def.crowd || {};
  return (cast.traders || 0) + (cast.pirates || 0) + (cast.patrols || 0) + (cast.ace === true ? 1 : 0)
    + (crowd.traders || 0) + (crowd.pirates || 0) + (crowd.patrols || 0) + (crowd.miners || 0);
}
let minTotal = Infinity;
let maxTotal = 0;
for (const [id, def] of [...Object.entries(authored), ...Object.entries(generated)]) {
  const total = recordTotal(def);
  minTotal = Math.min(minTotal, total);
  maxTotal = Math.max(maxTotal, total);
  check(total >= 25 && total <= 50, id + ' record total in 25-50', total);
}
check(minTotal >= 25 && maxTotal <= 50, 'record totals range 25-50', minTotal + '-' + maxTotal);

// chart coordinates unchanged (explicit, in addition to stripGeometry).
if (haveBase) {
  for (const id of generatedIds) {
    check(JSON.stringify(generated[id].chart) === JSON.stringify(baseGenerated[id].chart), id + ' generated chart coords unchanged');
  }
  for (const id of Object.keys(baseAuthored)) {
    check(JSON.stringify(authored[id].chart) === JSON.stringify(baseAuthored[id].chart), id + ' authored chart coords unchanged');
  }
} else {
  skipBase();
}

// no new persistent field beyond the two issue-355 (P5b) data keys: top-level
// key sets unchanged apart from regions/lanes, which must be all-or-nothing.
if (haveBase) {
  for (const [id, oldDef, newDef] of [
    ...generatedIds.map((id) => [id, baseGenerated[id], generated[id]]),
    ...Object.keys(baseAuthored).map((id) => [id, baseAuthored[id], authored[id]]),
  ]) {
    const oldKeys = Object.keys(oldDef).sort();
    const newKeys = Object.keys(newDef).sort();
    const added = newKeys.filter((k) => !oldKeys.includes(k));
    const removed = oldKeys.filter((k) => !newKeys.includes(k));
    check(removed.length === 0, id + ' persistent field set loses no key');
    const p5bOnly = added.length === 0
      || (added.length === 2 && added.includes('lanes') && added.includes('regions'));
    check(p5bOnly, id + ' persistent field set gains only the issue-355 regions/lanes keys', added);
  }
} else {
  skipBase();
}

// ------------------------------------------------------- phase 1 deep field
const df = read('src/systems/deepfield.js');
check(/const BAND_MIN = 3200;/.test(df), 'deepfield BAND_MIN 3200');
check(/const BAND_MAX = 8000;/.test(df), 'deepfield BAND_MAX 8000');
check(df.includes('placeInBand(rng, BAND_MIN, 6800)'), 'deepfield planet band starts at BAND_MIN, max 6800');
check(df.includes('placeInBand(rng, 5200, BAND_MAX)'), 'deepfield companion band 5200-BAND_MAX');
check(df.includes('placeInBand(rng, 3600, 7200)'), 'deepfield ring band 3600-7200');
check(df.includes('placeInBand(rng, 4000, BAND_MAX)'), 'deepfield nebula band 4000-BAND_MAX');
check(/const beaconStart = 3600 \+ rng\(\) \* 600;/.test(df), 'deepfield beacon start 3600-4200');
check(/const beaconEnd = 5800 \+ rng\(\) \* 1500;/.test(df), 'deepfield beacon end 5800-7300');
check(!/Math\.random\(/.test(df), 'deepfield uses no global Math.random draw');
check(/const RNG_SALT = 0x9e370000;/.test(df), 'deepfield RNG salt unchanged');
check(/2,800|2800/.test(df), 'deepfield band documented beyond ~2800u extent');

// starfield: reference doubles with the extent; shells/clamp unchanged.
const sf = read('src/systems/starfield.js');
const baseSf = await baseSource('src/systems/starfield.js');
check(/const EXTENT_REFERENCE = 2200;/.test(sf), 'starfield EXTENT_REFERENCE 2200');
check(/const SCALE_MIN = 0\.9;/.test(sf) && /const SCALE_MAX = 1\.15;/.test(sf), 'starfield clamp 0.9-1.15 unchanged');
if (baseSf !== null) {
  check(/const EXTENT_REFERENCE = 1100;/.test(baseSf), 'starfield base EXTENT_REFERENCE 1100');
  const shellPairs = (src) => [...src.matchAll(/minRadius:\s*(\d+),\s*maxRadius:\s*(\d+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  check(JSON.stringify(shellPairs(sf)) === JSON.stringify(shellPairs(baseSf)), 'starfield shell radii unchanged', JSON.stringify(shellPairs(sf)));
  check((sf.match(/Math\.random\(/g) || []).length === (baseSf.match(/Math\.random\(/g) || []).length, 'starfield global random draw count unchanged');
} else {
  skipBase();
}

// far asteroid scenery: beyond the playable extent, density unchanged.
const af = read('src/game/asteroid-fields.js');
check(/export const ASTEROID_NEAR_CAP = 160;/.test(af), 'asteroid near cap 160');
check(/export const ASTEROID_TOTAL_CAP = 800;/.test(af), 'asteroid total cap 800');
check(/export const ASTEROID_SCENERY_MIN_FIELDS = 2;/.test(af), 'asteroid scenery min fields 2');
check(/export const ASTEROID_SCENERY_MAX_FIELDS = 3;/.test(af), 'asteroid scenery max fields 3');
check(/const SCENERY_MIN_TOTAL = 600;/.test(af), 'asteroid scenery min total 600');
check(/const dist = 3000 \+ rng\(\) \* 2000;/.test(af), 'far scenery starts beyond 2800u extent');
check(/const radius = 90 \+ rng\(\) \* 130;/.test(af), 'far scenery radius 90-220');
check(!/Math\.random\(/.test(af), 'asteroid-fields uses no global Math.random draw');
const afMod = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(af));
for (const [id, def] of [...Object.entries(authored), ...Object.entries(generated)]) {
  const layout = afMod.asteroidSceneryLayout(def);
  const layoutAgain = afMod.asteroidSceneryLayout(def);
  check(JSON.stringify(layout) === JSON.stringify(layoutAgain), id + ' far asteroid layout deterministic');
  check(layout.length >= 2 && layout.length <= 3, id + ' far asteroid field count 2-3', layout.length);
  for (const f of layout) {
    check(radial(f.center) >= 3000, id + ' far asteroid center beyond 3000u', radial(f.center).toFixed(1));
    check(radial(f.center) <= 5200, id + ' far asteroid center inside 5200u', radial(f.center).toFixed(1));
    check(f.radius >= 90 && f.radius <= 220, id + ' far asteroid radius 90-220', f.radius);
  }
  const total = afMod.asteroidTotalCount(def);
  check(total >= 600 && total <= 800, id + ' system asteroid density 600-800', total);
}

// playable extent vs scenery bands.
const maxOrbit = Math.max(...EXPECTED_TABLE.map((slot) => slot[1]));
check(maxOrbit === 2800, 'max planet orbit is the ~2800u extent', maxOrbit);
check(maxOrbit < 3200, 'deep-field band starts beyond max planet orbit');
check(maxOrbit < 3000, 'far asteroid scenery starts beyond max planet orbit');
check(maxOrbit < 8000 * 0.9, 'starfield inner shell stays beyond the content edge');

// --------------------------------------------------------------------- done
console.log('');
console.log('issue-340 extent test: ' + pass + ' checks passed, ' + failures.length + ' failed');
if (skippedGroups > 0) console.log('base-diff groups skipped (no base commit in this checkout): ' + skippedGroups);
if (failures.length > 0) {
  console.log('failures:');
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
}
console.log('PASS');
