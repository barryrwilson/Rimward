/**
 * Issue #340 focused test — in-system chart view (system scale/population
 * Phase 3, P6).
 *
 * Pins the owner decision that the in-system chart ships in this PR:
 * - Galaxy | System switch lives inside the EXISTING chart dialog; KeyM /
 *   Escape remain the only open/close path (no new keybinding).
 * - System view DOM shows sun, planet orbit rings from PLANET_ORBITS, station,
 *   gates with destination names, minable + Phase 1 far-scenery fields,
 *   unknown landmarks, rings/scale legend and near/mid/far traffic markers
 *   derived from abstract record positions + traffic-tiers.js.
 * - Text-safe DOM: a world string containing markup renders as text.
 * - Zero THREE render cost: renderer.info and scene children unchanged.
 * - Overlay policy (docked/paused/hail card) still gates opening.
 * - No persisted field: ctx.world is byte-identical across open/switch.
 * - galaxychart.js stays the only ctx.flags.chartOpen writer; systemchart.js
 *   is presentation-only, imports no THREE, writes no chart flag.
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-340-chart-test.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SYSTEMS, CONVERGENCE } from '../src/game/state.js';
import { PLANET_ORBITS } from '../src/game/courier-shadow.js';
import { asteroidSceneryLayout } from '../src/game/asteroid-fields.js';
import { recordPosition } from '../src/game/world.js';
import { NEAR_RANGE, MID_RANGE } from '../src/game/traffic-tiers.js';
import { trafficTierFor, buildSystemChartModel, SYSTEM_CHART_MAX_EXTENT } from '../src/systems/systemchart.js';

let checks = 0;
const pass = (label) => { checks += 1; console.log('PASS ' + label); };
const clone = (value) => JSON.parse(JSON.stringify(value));

function recordPos(rec) {
  const out = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } };
  recordPosition(rec, out);
  return out;
}

function makeRecord(id, role, x, z) {
  return {
    id,
    role,
    route: [{ x, y: 0, z }, { x, y: 0, z: z + 60 }],
    leg: 0,
    legT: 0,
    state: 'enroute',
  };
}

// ---------------------------------------------------------------------------
// 1. Pure model: tier derivation, system content, mystery known/unknown.
// ---------------------------------------------------------------------------
assert.equal(trafficTierFor(NEAR_RANGE), 'near');
assert.equal(trafficTierFor(NEAR_RANGE + 0.001), 'mid');
assert.equal(trafficTierFor(MID_RANGE), 'mid');
assert.equal(trafficTierFor(MID_RANGE + 0.001), 'far');
assert.equal(SYSTEM_CHART_MAX_EXTENT, 2800);
pass('traffic tiers derive from traffic-tiers.js constants; fit ceiling pinned');

const redmarch = SYSTEMS.redmarch;
const redLandmark = (redmarch.landmarks ?? [])[0];
const redClue = (redmarch.clues ?? [])[0];
assert.ok(redLandmark && redClue, 'redmarch carries one authored landmark and clue');

const bankRecords = [
  makeRecord('near-rec', 'trader', 0, 100),
  makeRecord('mid-rec', 'pirate', 0, 1500),
  makeRecord('far-rec', 'patrol', 0, 3000),
];
const modelCtx = {
  world: {
    currentSystem: 'redmarch',
    mystery: { found: [], visited: [], convergeHinted: false, converged: false, deepHinted: false, deepened: false },
    recordBanks: { redmarch: bankRecords },
  },
  ship: { object: { position: { x: 0, y: 0, z: 0 } } },
  planetBodies: null,
};
const worldBefore = JSON.stringify(modelCtx.world);
const model = buildSystemChartModel(modelCtx);
assert.ok(model, 'model built for an authored system');
assert.equal(model.systemId, 'redmarch');
assert.equal(model.systemName, redmarch.name);
assert.equal(model.planets.length, Math.min(redmarch.planetCount, PLANET_ORBITS.length));
for (let i = 0; i < model.planets.length; i++) {
  assert.equal(model.planets[i].orbitRadius, PLANET_ORBITS[i].orbitRadius);
}
assert.ok(model.extent >= PLANET_ORBITS[model.planets.length - 1].orbitRadius);
assert.ok(model.extent > 2000, 'fitted extent covers the new x2 playable space');
assert.equal(model.viewRadius, model.extent + 80);
assert.equal(model.gates.length, redmarch.gates.length);
for (const gate of model.gates) {
  assert.ok(gate.name, 'every gate carries a destination name');
  assert.equal(gate.name, SYSTEMS[gate.to].name);
}
assert.equal(model.station.name, redmarch.station.name);
assert.equal(model.hub.routes, redmarch.hub.routes.length);
assert.equal(model.fields.filter((f) => !f.far).length, 1);
assert.equal(model.fields.filter((f) => f.far).length, asteroidSceneryLayout(redmarch).length);
assert.equal(model.landmarks.length, redmarch.landmarks.length);
assert.ok(model.landmarks.every((lm) => lm.known === false));
assert.equal(model.clues.length, redmarch.clues.length);
assert.ok(model.clues.every((cl) => cl.known === false));
assert.deepEqual(model.counts, { near: 1, mid: 1, far: 1 });
assert.equal(JSON.stringify(modelCtx.world), worldBefore, 'model build never mutates persisted world');
pass('model: planets/gates/station/hub/fields/landmarks/clues + tiers from records, no world writes');

modelCtx.world.mystery.visited.push(redLandmark.id);
modelCtx.world.mystery.found.push(redClue.id);
const knownModel = buildSystemChartModel(modelCtx);
assert.ok(knownModel.landmarks.every((lm) => lm.known === true));
assert.ok(knownModel.clues.every((cl) => cl.known === true));
pass('mystery visited/found flip landmark/clue known handling');

const convCtx = {
  world: {
    currentSystem: CONVERGENCE.site.system,
    mystery: { found: [], visited: [], convergeHinted: true, converged: false, deepHinted: false, deepened: false },
  },
  ship: { object: { position: { x: 0, y: 0, z: 0 } } },
};
const convModel = buildSystemChartModel(convCtx);
assert.equal(convModel.sites.length, 1);
assert.equal(convModel.sites[0].name, CONVERGENCE.site.name);
assert.equal(convModel.sites[0].known, false);
convCtx.world.mystery.converged = true;
assert.equal(buildSystemChartModel(convCtx).sites[0].known, true);
pass('hinted convergence site renders unknown until converged');

// ---------------------------------------------------------------------------
// 2. Source pins: text-safe DOM, one chartOpen writer, no new key/digit/THREE.
// ---------------------------------------------------------------------------
const chartSrc = readFileSync(new URL('../src/systems/galaxychart.js', import.meta.url), 'utf8');
const sysSrc = readFileSync(new URL('../src/systems/systemchart.js', import.meta.url), 'utf8');
assert.ok(!chartSrc.includes('innerHTML'), 'galaxychart never uses innerHTML');
assert.ok(!sysSrc.includes('innerHTML'), 'systemchart never uses innerHTML');
assert.ok(!chartSrc.includes('preventDefault(') && !chartSrc.includes('stopPropagation('));
assert.ok(!sysSrc.includes('preventDefault(') && !sysSrc.includes('stopPropagation('));
assert.ok(!chartSrc.includes('mystery'), 'galaxychart source stays mystery-free (existing pin)');
assert.equal((chartSrc.match(/Digit/g) || []).length, 1, 'chart keeps only its pre-existing Digit 9 mention');
assert.ok(!sysSrc.includes('Digit'), 'system view adds no aim-glass digit');
assert.ok(!sysSrc.includes("from 'three'"), 'systemchart imports no THREE');
assert.equal((chartSrc.match(/ctx\.flags\.chartOpen\s*=\s*next/g) || []).length, 1, 'one chartOpen writer');
assert.ok(!sysSrc.includes('chartOpen'), 'systemchart never writes the chart flag');
assert.equal((chartSrc.match(/codeOf\(ctx, '/g) || []).length, 1, 'one chart binding id');
assert.ok(chartSrc.includes("codeOf(ctx, 'chart')"));
assert.ok(chartSrc.includes('rw-chart-viewtab'));
assert.ok(chartSrc.includes("renderSystemChart") && chartSrc.includes("systemChartIdentity"));
pass('source pins: text-safe, single chartOpen writer, one binding id, no digit, no THREE');

// ---------------------------------------------------------------------------
// 3. Booted integration: existing key path, DOM content, overlay, render cost.
// ---------------------------------------------------------------------------
seedBootRandom();
const dom = installDomStubs();
const boot = await bootGameSystems();
const { ctx, systems, renderer, scene } = boot;
const chartSystem = systems.find(([name]) => name === 'galaxychart')[1];
assert.ok(chartSystem && typeof chartSystem.update === 'function', 'galaxy chart system initialized');

function byClass(root, cls) {
  const out = [];
  if (!root) return out;
  for (const node of dom.walkDom(root)) {
    const attr = typeof node.getAttribute === 'function' ? node.getAttribute('class') : null;
    if (typeof attr === 'string' && attr.split(/\s+/).includes(cls)) out.push(node);
  }
  return out;
}

const chartRoot = (() => {
  for (const node of dom.walkDom(document.body)) {
    if (typeof node.className === 'string' && node.className.split(/\s+/).includes('rw-galaxy-chart')) return node;
  }
  return null;
})();
assert.ok(chartRoot, 'existing chart dialog is in the DOM');

// A fresh harness boot sits behind the title screen, which owns the screen
// for overlay-policy purposes; dismiss it exactly like boot-test wave 21.
const titleNewBtn = (() => {
  for (const node of dom.walkDom(document.body)) {
    if (node.dataset && node.dataset.titleAction === 'new') return node;
  }
  return null;
})();
assert.ok(titleNewBtn, 'title NEW GAME action exists');
titleNewBtn.click();
assert.ok(![...dom.walkDom(document.body)].some((node) => node.id === 'rw-title'), 'title overlay dismissed');

ctx.flags.docked = false;
ctx.flags.paused = false;
ctx.flags.hailOpen = false;
ctx.flags.berthOpen = false;
if (ctx.flags.chartOpen === true) dom.dispatchKey('KeyM');
assert.equal(ctx.flags.chartOpen, false);

// Overlay policy still gates opening (no new bypass).
ctx.flags.docked = true;
dom.dispatchKey('KeyM');
assert.equal(ctx.flags.chartOpen, false);
assert.ok(chartRoot.classList.contains('is-hidden'));
ctx.flags.docked = false;
ctx.flags.paused = true;
dom.dispatchKey('KeyM');
assert.equal(ctx.flags.chartOpen, false);
ctx.flags.paused = false;
ctx.flags.hailOpen = true;
dom.dispatchKey('KeyM');
assert.equal(ctx.flags.chartOpen, false);
ctx.flags.hailOpen = false;
pass('overlay policy: docked, paused and hail-card states keep the chart closed');

renderer.info = { render: { calls: 42, triangles: 1234 }, memory: { geometries: 7, textures: 3 } };
const infoBefore = clone(renderer.info);
const sceneBefore = scene.children.length;
const worldBeforeChart = JSON.stringify(ctx.world);

dom.dispatchKey('KeyM');
assert.equal(ctx.flags.chartOpen, true);
assert.ok(!chartRoot.classList.contains('is-hidden'));
assert.equal(chartRoot.getAttribute('aria-hidden'), 'false');
assert.equal((chartRoot.getAttribute('class') || '').split(/\s+/).includes('is-system-view'), false);
pass('KeyM opens the existing chart dialog (no new binding)');

const tabs = byClass(chartRoot, 'rw-chart-viewtab');
assert.equal(tabs.length, 2, 'Galaxy | System switch exists inside the dialog');
const galaxyTab = tabs.find((t) => t.getAttribute('data-view') === 'galaxy');
const systemTab = tabs.find((t) => t.getAttribute('data-view') === 'system');
assert.ok(galaxyTab && systemTab);
assert.equal(galaxyTab.getAttribute('aria-pressed'), 'true');
systemTab.click();
assert.equal(systemTab.getAttribute('aria-pressed'), 'true');
assert.equal(galaxyTab.getAttribute('aria-pressed'), 'false');

const host = byClass(chartRoot, 'rw-system-chart-host')[0];
assert.ok(host && !host.classList.contains('is-hidden'));
assert.equal(host.getAttribute('aria-hidden'), 'false');
assert.ok(byClass(chartRoot, 'rw-galaxy-svg')[0].classList.contains('is-view-hidden'));
assert.ok(chartRoot.classList.contains('is-system-view'));
pass('System switch shows the in-system host and hides galaxy-only controls');

let section = byClass(chartRoot, 'rw-system-chart')[0];
assert.ok(section, 'system chart section rendered');
const sysId = ctx.world.currentSystem;
const def = SYSTEMS[sysId];
assert.equal(section.getAttribute('data-system-id'), sysId);
assert.equal(section.getAttribute('aria-label'), 'In-system chart of ' + def.name);
assert.equal(byClass(section, 'rw-system-sun').length, 1);
const orbitEls = byClass(section, 'rw-system-orbit');
assert.equal(orbitEls.length, Math.min(def.planetCount, PLANET_ORBITS.length));
for (let i = 0; i < orbitEls.length; i++) {
  assert.equal(Number(orbitEls[i].getAttribute('r')), PLANET_ORBITS[i].orbitRadius);
}
assert.equal(byClass(section, 'rw-system-planet').length, orbitEls.length);
assert.equal(byClass(section, 'rw-system-station').length, 1);
assert.equal(byClass(section, 'rw-system-station-label')[0].textContent, def.station.name);
const gateLabels = byClass(section, 'rw-system-gate-label').map((el) => el.textContent);
assert.equal(gateLabels.length, def.gates.length);
for (const gate of def.gates) {
  const destName = SYSTEMS[gate.to].name;
  assert.ok(gateLabels.some((label) => label.includes(destName)), 'gate label names destination ' + destName);
}
const scenery = asteroidSceneryLayout(def);
assert.equal(byClass(section, 'rw-system-field').length, 1 + scenery.length);
assert.equal(byClass(section, 'rw-system-field-far').length, scenery.length);
assert.ok(byClass(section, 'rw-system-field-far').length >= 2, 'Phase 1 far scenery fields are charted');
const landmarkEls = byClass(section, 'rw-system-landmark');
assert.equal(landmarkEls.length, def.landmarks.length);
assert.ok(landmarkEls.every((el) => el.classList.contains('is-unknown')));
const unchartedLabels = byClass(section, 'rw-system-poi-label').map((el) => el.textContent);
assert.ok(unchartedLabels.includes(def.landmarks[0].name), 'uncharted landmark keeps its name faintly');
assert.ok(byClass(section, 'rw-system-ring').length >= 2);
const ringLabels = byClass(section, 'rw-system-ring-label').map((el) => el.textContent);
assert.ok(ringLabels.some((label) => label.includes('1000 u')));
assert.ok(ringLabels.some((label) => label.includes('2000 u')));
assert.equal(byClass(section, 'rw-system-scalebar').length, 1);
assert.ok(byClass(section, 'rw-system-scale-label')[0].textContent.includes('400 u'));
const extent = Number(section.getAttribute('data-extent'));
const viewRadius = Number(section.getAttribute('data-view-radius'));
// The fitted view covers the authored playable space and the Phase 1 far
// scenery belts, which sit outside it (issue #340 doubled both); the ceiling
// below is the farthest charted object, not the playable extent.
const farMax = Math.max(0, ...scenery.map((s) => Math.hypot(s.center[0], s.center[2]) + s.radius));
assert.ok(extent > 2000 && extent <= 5600, 'fit covers the x2 extent incl. far belts (got ' + extent + ' u)');
assert.ok(extent >= farMax, 'fit reaches the farthest far-scenery field (' + farMax + ' u)');
assert.equal(viewRadius, extent + 80);
pass('system view DOM: sun, orbits, station, named gates, fields incl far belt, unknown landmarks, rings/scale');

const bank = ctx.world.recordBanks[sysId];
const ship = ctx.ship.object.position;
const expected = { near: 0, mid: 0, far: 0 };
for (const rec of bank) {
  if (!Array.isArray(rec.route) || rec.route.length === 0) continue;
  const pos = recordPos(rec);
  const tier = trafficTierFor(Math.hypot(pos.x - ship.x, pos.z - ship.z));
  expected[tier] += 1;
}
const markers = byClass(section, 'rw-system-traffic');
assert.equal(markers.length, expected.near + expected.mid + expected.far);
const got = { near: 0, mid: 0, far: 0 };
for (const marker of markers) {
  const tier = marker.getAttribute('data-tier');
  assert.ok(tier === 'near' || tier === 'mid' || tier === 'far');
  assert.ok((marker.getAttribute('class') || '').includes('rw-system-traffic-' + tier));
  got[tier] += 1;
}
assert.deepEqual(got, expected, 'marker tiers match recordPosition + traffic-tiers');
assert.equal(Number(section.getAttribute('data-traffic-near')), expected.near);
assert.equal(Number(section.getAttribute('data-traffic-mid')), expected.mid);
assert.equal(Number(section.getAttribute('data-traffic-far')), expected.far);
const legendText = byClass(section, 'rw-system-legend-item').map((el) => el.textContent).join(' | ');
assert.ok(legendText.includes('near') && legendText.includes('mid') && legendText.includes('far'));
pass('traffic markers derive from abstract record positions and traffic tiers');

// Text-safe: a known landmark name containing markup renders as one text node.
const landmark = def.landmarks[0];
const originalName = landmark.name;
const mystery = ctx.world.mystery;
assert.ok(mystery && Array.isArray(mystery.visited), 'mystery discovery log exists');
const visitedLen = mystery.visited.length;
mystery.visited.push(landmark.id);
landmark.name = 'Wreck <b>A</b>';
systemTab.click();
section = byClass(chartRoot, 'rw-system-chart')[0];
const poiLabels = byClass(section, 'rw-system-poi-label').map((el) => el.textContent);
assert.ok(poiLabels.includes(landmark.name), 'markup in a world string is preserved literally');
for (const label of byClass(section, 'rw-system-poi-label')) {
  assert.equal(label.children.length, 0, 'labels contain no markup child elements');
}
landmark.name = originalName;
mystery.visited.length = visitedLen;
systemTab.click();
section = byClass(chartRoot, 'rw-system-chart')[0];
pass('text-safe DOM: landmark line containing markup renders as text');

// Zero render cost + no persisted field write from opening/switching.
assert.deepEqual(renderer.info, infoBefore, 'renderer.info unchanged by the chart');
assert.equal(scene.children.length, sceneBefore, 'no THREE scene objects added');
assert.equal(JSON.stringify(ctx.world), worldBeforeChart, 'ctx.world unchanged (no persisted field)');
pass('zero render cost: renderer.info, scene children and persisted world unchanged');

// Dynamic refresh is throttled: static SVG is not rebuilt per frame.
const staticSvg = byClass(chartRoot, 'rw-system-svg')[0];
chartSystem.update(0.01, ctx);
chartSystem.update(0.01, ctx);
assert.equal(byClass(chartRoot, 'rw-system-svg')[0], staticSvg, 'no static rebuild on the hot path');
ctx.elapsed += 0.6;
chartSystem.update(0.01, ctx);
assert.equal(byClass(chartRoot, 'rw-system-svg')[0], staticSvg, '0.5 s refresh touches only dynamic layers');
pass('dynamic refresh throttled; static system SVG never rebuilds per frame');

// Existing close path (Escape) closes and resets to Galaxy; KeyM toggles.
dom.dispatchKey('Escape');
assert.equal(ctx.flags.chartOpen, false);
assert.ok(chartRoot.classList.contains('is-hidden'));
assert.equal(byClass(chartRoot, 'rw-system-chart-host')[0].classList.contains('is-hidden'), true);
assert.ok(!byClass(chartRoot, 'rw-galaxy-svg')[0].classList.contains('is-view-hidden'));
dom.dispatchKey('KeyM');
assert.equal(ctx.flags.chartOpen, true);
assert.ok(byClass(chartRoot, 'rw-system-chart-host')[0].classList.contains('is-hidden'));
assert.ok(!byClass(chartRoot, 'rw-galaxy-svg')[0].classList.contains('is-view-hidden'));
dom.dispatchKey('KeyM');
assert.equal(ctx.flags.chartOpen, false);
pass('existing KeyM/Escape path opens and closes both views; close resets to Galaxy');

// System change rebuilds the system view (systemLoaded-equivalent identity).
dom.dispatchKey('KeyM');
byClass(chartRoot, 'rw-chart-viewtab').find((t) => t.getAttribute('data-view') === 'system').click();
const originalSys = ctx.world.currentSystem;
ctx.world.currentSystem = 'veridian';
chartSystem.update(0.05, ctx);
let rebuilt = byClass(chartRoot, 'rw-system-chart')[0];
assert.equal(rebuilt.getAttribute('data-system-id'), 'veridian');
assert.equal(byClass(rebuilt, 'rw-system-station-label')[0].textContent, SYSTEMS.veridian.station.name);
ctx.world.currentSystem = originalSys;
chartSystem.update(0.05, ctx);
rebuilt = byClass(chartRoot, 'rw-system-chart')[0];
assert.equal(rebuilt.getAttribute('data-system-id'), originalSys);
dom.dispatchKey('Escape');
assert.equal(ctx.flags.chartOpen, false);
pass('system view rebuilds on currentSystem change and restores');

console.log('issue-340 in-system chart: ' + checks + ' checks passed');
