/**
 * In-system chart view — system scale/population Phase 3 (issue #340).
 *
 * Presentation-only companion to the galaxy chart (galaxychart.js owns the
 * dialog, its chart-open flag and the Galaxy | System switch). This module
 * builds ONE DOM/SVG snapshot of the current system in system-local
 * coordinates (sun at 0,0; chart x/z plane) and nothing else:
 *
 * - sun, planet orbit rings from the shared PLANET_ORBITS table and the
 *   live ctx.planetBodies when the current system publishes them
 * - station, physical gates with destination system names, hub junction
 * - the minable field and the Phase 1 far-scenery fields
 *   (game/asteroid-fields.js asteroidSceneryLayout)
 * - landmarks/clues with mystery-log known/unknown handling (known names
 *   only; unknown sites render faint with '?') plus hinted convergence /
 *   deepening sites
 * - abstract-traffic markers tiered near/mid/far from the world.js
 *   recordPosition estimator and the traffic-tiers.js thresholds
 *
 * No THREE import, no renderer writes, no scene objects, no persisted
 * field, no new key. The caller rebuilds on open / system change and may
 * ask for a 0.5 s dynamic refresh (planet phases + abstract traffic) while
 * the chart is open; static content never rebuilds per frame.
 *
 * Text safety: every world string is written through textContent /
 * setAttribute (no inner HTML markup injection).
 */

import { SYSTEMS, CONVERGENCE, DEEPENING } from '../game/state.js';
import { PLANET_ORBITS, shadowSeededPlanets } from '../game/courier-shadow.js';
import { asteroidSceneryLayout } from '../game/asteroid-fields.js';
import { recordPosition } from '../game/world.js';
import { NEAR_RANGE, MID_RANGE } from '../game/traffic-tiers.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const RING_RADII = Object.freeze([1000, 2000]);
const SCALE_BAR_UNITS = 400;
const LABEL_CLIP = 34;
const VIEW_PADDING = 80;

/** Fit ceiling named by issue #340 / P5a (playable extent max ~2800 u). */
export const SYSTEM_CHART_MAX_EXTENT = 2800;

/** Dynamic (planet phase / abstract traffic) refresh interval while open. */
export const SYSTEM_CHART_REFRESH_SECONDS = 0.5;

const EMPTY = Object.freeze([]);

function fin(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function clipText(text, max = LABEL_CLIP) {
  const s = typeof text === 'string' ? text : '';
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '\u2026';
}

/** [x, y, z] world position -> chart {x, z}; y stays authored/ignored. */
function vec2(p) {
  if (!Array.isArray(p)) return null;
  const x = p[0];
  const z = p[2];
  if (!fin(x) || !fin(z)) return null;
  return { x, z };
}

function clearChildren(node) {
  if (!node) return;
  const kids = node.children;
  if (kids && typeof kids.length === 'number') {
    while (kids.length) node.removeChild(kids[0]);
    return;
  }
  while (node.firstChild) node.removeChild(node.firstChild);
}

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const key of Object.keys(attrs)) el.setAttribute(key, String(attrs[key]));
  }
  return el;
}

function textEl(cls, x, y, text, attrs, size) {
  const el = svgEl('text', { class: cls, x, y, ...(attrs || {}) });
  if (fin(size) && size > 0) el.setAttribute('font-size', String(size));
  el.textContent = typeof text === 'string' ? text : '';
  return el;
}

/** Distance -> derived traffic tier (traffic-tiers.js contract, never persisted). */
export function trafficTierFor(distance) {
  const d = fin(distance) ? distance : 0;
  if (d <= NEAR_RANGE) return 'near';
  if (d <= MID_RANGE) return 'mid';
  return 'far';
}

/**
 * Session identity for the system view: system id + mystery discovery
 * state. galaxychart.js rebuilds the SVG when this changes; traffic and
 * planet phases are refreshed separately on the 0.5 s throttle.
 */
export function systemChartIdentity(ctx) {
  try {
    const world = ctx && ctx.world;
    const sysId = world && typeof world.currentSystem === 'string' ? world.currentSystem : '';
    const mystery = world && world.mystery && typeof world.mystery === 'object' ? world.mystery : null;
    const found = mystery && Array.isArray(mystery.found) ? mystery.found.join(',') : '';
    const visited = mystery && Array.isArray(mystery.visited) ? mystery.visited.join(',') : '';
    let hinted = '0000';
    if (mystery) {
      hinted = (mystery.convergeHinted === true ? '1' : '0')
        + (mystery.converged === true ? '1' : '0')
        + (mystery.deepHinted === true ? '1' : '0')
        + (mystery.deepened === true ? '1' : '0');
    }
    return sysId + '|' + found + '|' + visited + '|' + hinted;
  } catch {
    return '';
  }
}

function readPlayer(ctx) {
  try {
    const p = ctx && ctx.ship && ctx.ship.object && ctx.ship.object.position;
    if (p && fin(p.x) && fin(p.z)) return { x: p.x, z: p.z };
  } catch {
    /* fall through to origin */
  }
  return { x: 0, z: 0 };
}

function bankFor(world, sysId) {
  if (!world || typeof world !== 'object') return null;
  const banks = world.recordBanks;
  if (banks && typeof banks === 'object' && !Array.isArray(banks)) {
    const bank = banks[sysId];
    if (Array.isArray(bank)) return bank;
  }
  if (world.currentSystem === sysId && Array.isArray(world.records)) return world.records;
  return null;
}

// Zero-allocation recordPosition target (world.js writes through out.set).
const _scratch = {
  x: 0,
  y: 0,
  z: 0,
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  },
};

/** Abstract traffic records -> tier markers. Presentation only. */
function collectTraffic(world, sysId, player) {
  const traffic = [];
  const counts = { near: 0, mid: 0, far: 0 };
  const bank = bankFor(world, sysId);
  if (!bank) return { traffic, counts };
  for (let i = 0; i < bank.length; i++) {
    if (!Object.hasOwn(bank, i)) continue;
    const rec = bank[i];
    if (!rec || typeof rec !== 'object') continue;
    if (!Array.isArray(rec.route) || rec.route.length === 0) continue;
    let pos = null;
    try {
      pos = recordPosition(rec, _scratch);
    } catch {
      pos = null;
    }
    if (!pos || !fin(pos.x) || !fin(pos.z)) continue;
    const distance = Math.hypot(pos.x - player.x, pos.z - player.z);
    const tier = trafficTierFor(distance);
    counts[tier] += 1;
    traffic.push({
      id: typeof rec.id === 'string' ? rec.id : '',
      role: typeof rec.role === 'string' ? rec.role : '',
      tier,
      x: pos.x,
      z: pos.z,
    });
  }
  return { traffic, counts };
}

/**
 * Pure data snapshot for the in-system chart. Exported for the focused
 * test; the renderer below is the only production consumer.
 */
export function buildSystemChartModel(ctx) {
  const world = ctx && ctx.world;
  const sysId = world && typeof world.currentSystem === 'string' ? world.currentSystem : '';
  if (!sysId || !Object.hasOwn(SYSTEMS, sysId)) return null;
  const def = SYSTEMS[sysId];
  if (!def || typeof def !== 'object') return null;

  const mystery = world && world.mystery && typeof world.mystery === 'object' ? world.mystery : null;
  const found = mystery && Array.isArray(mystery.found) ? mystery.found : EMPTY;
  const visited = mystery && Array.isArray(mystery.visited) ? mystery.visited : EMPTY;

  const model = {
    systemId: sysId,
    systemName: typeof def.name === 'string' && def.name ? def.name : sysId,
    extent: 0,
    viewRadius: 0,
    sun: { radius: fin(def.sunRadius) ? Math.max(1, def.sunRadius) : 30 },
    planets: [],
    gates: [],
    station: null,
    hub: null,
    fields: [],
    landmarks: [],
    clues: [],
    sites: [],
    traffic: [],
    counts: { near: 0, mid: 0, far: 0 },
    player: readPlayer(ctx),
  };

  const grow = (x, z, radius) => {
    const d = Math.hypot(x, z) + (fin(radius) ? Math.max(0, radius) : 0);
    if (d > model.extent) model.extent = d;
  };

  // ---------- planets / orbit rings ----------
  const count = fin(def.planetCount)
    ? Math.min(Math.max(0, def.planetCount | 0), PLANET_ORBITS.length)
    : 0;
  const liveBodies = Array.isArray(ctx.planetBodies) ? ctx.planetBodies : null;
  const seeded = shadowSeededPlanets(def);
  for (let i = 0; i < count; i++) {
    const slot = PLANET_ORBITS[i];
    if (!slot) continue;
    const live = liveBodies && liveBodies.length === count ? liveBodies[i] : null;
    let body = { x: 0, z: 0, radius: slot.radius };
    if (live && fin(live.x) && fin(live.z)) {
      body = { x: live.x, z: live.z, radius: fin(live.radius) ? live.radius : slot.radius };
    } else if (seeded[i] && fin(seeded[i].x) && fin(seeded[i].z)) {
      body = { x: seeded[i].x, z: seeded[i].z, radius: fin(seeded[i].radius) ? seeded[i].radius : slot.radius };
    }
    model.planets.push({
      slot: i,
      orbitRadius: slot.orbitRadius,
      radius: body.radius,
      x: body.x,
      z: body.z,
    });
    grow(0, 0, slot.orbitRadius + (fin(slot.radius) ? slot.radius : 0));
  }

  // ---------- gates ----------
  const gates = Array.isArray(def.gates) ? def.gates : EMPTY;
  for (let i = 0; i < gates.length; i++) {
    if (!Object.hasOwn(gates, i)) continue;
    const gate = gates[i];
    const p = gate ? vec2(gate.position) : null;
    if (!p) continue;
    const to = gate && typeof gate.to === 'string' ? gate.to : '';
    const dest = to && Object.hasOwn(SYSTEMS, to) ? SYSTEMS[to] : null;
    const name = dest && typeof dest.name === 'string' && dest.name ? dest.name : to;
    model.gates.push({ x: p.x, z: p.z, to, name });
    grow(p.x, p.z);
  }

  // ---------- station ----------
  const stationDef = def.station;
  const stationPos = stationDef ? vec2(stationDef.position) : null;
  if (stationPos) {
    model.station = {
      x: stationPos.x,
      z: stationPos.z,
      name: typeof stationDef.name === 'string' && stationDef.name ? stationDef.name : 'Station',
    };
    grow(stationPos.x, stationPos.z);
  }

  // ---------- Lamplighter hub junction ----------
  const hubDef = def.hub;
  const hubPos = hubDef ? vec2(hubDef.position) : null;
  if (hubPos) {
    model.hub = {
      x: hubPos.x,
      z: hubPos.z,
      routes: Array.isArray(hubDef.routes) ? hubDef.routes.length : 0,
    };
    grow(hubPos.x, hubPos.z);
  }

  // ---------- minable field + Phase 1 far-scenery fields ----------
  const fieldDef = def.field;
  const fieldPos = fieldDef ? vec2(fieldDef.center) : null;
  if (fieldPos) {
    const radius = fin(fieldDef.radius) ? Math.max(0, fieldDef.radius) : 0;
    model.fields.push({ x: fieldPos.x, z: fieldPos.z, radius, far: false, count: fin(fieldDef.count) ? fieldDef.count : 0 });
    grow(fieldPos.x, fieldPos.z, radius);
  }
  const scenery = asteroidSceneryLayout(def);
  for (let i = 0; i < scenery.length; i++) {
    if (!Object.hasOwn(scenery, i)) continue;
    const far = scenery[i];
    const p = far ? vec2(far.center) : null;
    if (!p) continue;
    const radius = fin(far.radius) ? Math.max(0, far.radius) : 0;
    model.fields.push({ x: p.x, z: p.z, radius, far: true, count: fin(far.count) ? far.count : 0 });
    grow(p.x, p.z, radius);
  }

  // ---------- landmarks (known only after a visit) ----------
  const landmarks = Array.isArray(def.landmarks) ? def.landmarks : EMPTY;
  for (let i = 0; i < landmarks.length; i++) {
    if (!Object.hasOwn(landmarks, i)) continue;
    const lm = landmarks[i];
    const p = lm ? vec2(lm.position) : null;
    if (!p) continue;
    const id = typeof lm.id === 'string' ? lm.id : '';
    model.landmarks.push({
      id,
      name: typeof lm.name === 'string' ? lm.name : '',
      kind: typeof lm.kind === 'string' ? lm.kind : '',
      x: p.x,
      z: p.z,
      known: id !== '' && visited.includes(id),
    });
    grow(p.x, p.z);
  }

  // ---------- clues (known only after discovery) ----------
  const clues = Array.isArray(def.clues) ? def.clues : EMPTY;
  for (let i = 0; i < clues.length; i++) {
    if (!Object.hasOwn(clues, i)) continue;
    const clue = clues[i];
    const p = clue ? vec2(clue.position) : null;
    if (!p) continue;
    const id = typeof clue.id === 'string' ? clue.id : '';
    model.clues.push({
      id,
      line: typeof clue.line === 'string' ? clue.line : '',
      x: p.x,
      z: p.z,
      known: id !== '' && found.includes(id),
    });
    grow(p.x, p.z);
  }

  // ---------- hinted mystery sites ----------
  const siteDefs = [
    {
      site: CONVERGENCE && CONVERGENCE.site,
      hinted: mystery ? mystery.convergeHinted === true : false,
      known: mystery ? mystery.converged === true : false,
    },
    {
      site: DEEPENING && DEEPENING.site,
      hinted: mystery ? mystery.deepHinted === true : false,
      known: mystery ? mystery.deepened === true : false,
    },
  ];
  for (let i = 0; i < siteDefs.length; i++) {
    const entry = siteDefs[i];
    const site = entry.site;
    if (!site || site.system !== sysId || !entry.hinted) continue;
    const p = vec2(site.position);
    if (!p) continue;
    model.sites.push({
      id: typeof site.id === 'string' ? site.id : '',
      name: typeof site.name === 'string' ? site.name : '',
      x: p.x,
      z: p.z,
      known: entry.known,
    });
    grow(p.x, p.z, fin(site.radius) ? site.radius : 0);
  }

  // Keep the player marker inside the fitted view when they are still
  // within the playable ceiling; never blow the view up past that.
  const playerR = Math.hypot(model.player.x, model.player.z);
  if (playerR > model.extent && playerR <= SYSTEM_CHART_MAX_EXTENT) model.extent = playerR;

  if (!(model.extent > 0)) model.extent = 600;
  model.viewRadius = model.extent + VIEW_PADDING;

  const traffic = collectTraffic(world, sysId, model.player);
  model.traffic = traffic.traffic;
  model.counts = traffic.counts;
  return model;
}

// ---------- rendering ----------

function addRing(layer, radius, cls, labelSize, label) {
  layer.appendChild(svgEl('circle', { class: cls, cx: 0, cy: 0, r: radius, fill: 'none' }));
  if (label) {
    layer.appendChild(textEl('rw-system-ring-label', 0, -radius - labelSize * 0.35, label, {
      'text-anchor': 'middle',
    }, labelSize));
  }
}

function addField(layer, labelLayer, field, labelSize) {
  layer.appendChild(svgEl('circle', {
    class: field.far ? 'rw-system-field rw-system-field-far' : 'rw-system-field rw-system-field-primary',
    cx: field.x,
    cy: field.z,
    r: field.radius,
    fill: 'none',
  }));
  labelLayer.appendChild(textEl('rw-system-field-label', field.x, field.z + field.radius + labelSize * 0.8,
    field.far ? 'far belt' : 'field', { 'text-anchor': 'middle' }, labelSize));
}

function addGate(layer, labelLayer, gate, markerR, labelSize) {
  const size = markerR * 1.35;
  layer.appendChild(svgEl('rect', {
    class: 'rw-system-gate',
    x: gate.x - size / 2,
    y: gate.z - size / 2,
    width: size,
    height: size,
    transform: 'rotate(45 ' + gate.x + ' ' + gate.z + ')',
  }));
  labelLayer.appendChild(textEl('rw-system-gate-label', gate.x + size * 0.9, gate.z + labelSize * 0.35,
    '\u2192 ' + clipText(gate.name, 26), { 'text-anchor': 'start' }, labelSize));
}

function addPoi(layer, labelLayer, poi, cls, markerR, labelSize, known, showUnknownName) {
  layer.appendChild(svgEl('circle', {
    class: cls + (known ? ' is-known' : ' is-unknown'),
    cx: poi.x,
    cy: poi.z,
    r: markerR * 0.85,
    fill: 'none',
  }));
  let label = '?';
  const raw = poi.name || poi.line || cls.replace('rw-system-', '');
  if (known) {
    label = clipText(raw, 28);
  } else if (showUnknownName && poi.name) {
    // Landmarks are physically visible in the world; the chart keeps their
    // name but marks the site faint/uncharted until it is visited.
    label = clipText(poi.name, 28);
  }
  labelLayer.appendChild(textEl(
    'rw-system-poi-label' + (known ? ' is-known' : ' is-unknown'),
    poi.x, poi.z + markerR + labelSize * 0.65, label,
    { 'text-anchor': 'middle' },
    labelSize,
  ));
}

function trafficShape(tier, x, z, markerR, id, role) {
  const common = { class: 'rw-system-traffic rw-system-traffic-' + tier, 'data-tier': tier };
  if (id) common['data-record-id'] = id;
  if (role) common['data-role'] = role;
  if (tier === 'near') {
    return svgEl('circle', { ...common, cx: x, cy: z, r: markerR * 0.8 });
  }
  if (tier === 'mid') {
    const r = markerR * 0.95;
    const points = [
      x, z - r,
      x + r * 0.9, z + r * 0.7,
      x - r * 0.9, z + r * 0.7,
    ].join(' ');
    return svgEl('polygon', { ...common, points });
  }
  const r = markerR * 0.75;
  return svgEl('rect', {
    ...common,
    x: x - r,
    y: z - r,
    width: r * 2,
    height: r * 2,
    transform: 'rotate(45 ' + x + ' ' + z + ')',
  });
}

function legendItem(cls, text) {
  const el = document.createElement('span');
  el.className = 'rw-system-legend-item ' + cls;
  el.textContent = text;
  return el;
}

/**
 * Build the system view into the host element. Returns { key, model, update }.
 * update(ctx) refreshes planet phases + abstract-traffic markers only;
 * the caller owns the 0.5 s throttle and the rebuild-on-system-change path.
 */
export function renderSystemChart(host, ctx) {
  const key = systemChartIdentity(ctx);
  const model = buildSystemChartModel(ctx);
  clearChildren(host);
  if (!model) {
    const empty = document.createElement('p');
    empty.className = 'rw-system-chart-empty';
    empty.textContent = 'No charted system.';
    host.appendChild(empty);
    return { key, model: null, update() { return false; } };
  }

  const extent = model.extent;
  const labelSize = Math.max(18, Math.round(extent * 0.022));
  const minorSize = Math.max(15, Math.round(extent * 0.016));
  const markerR = Math.max(18, Math.round(extent * 0.012));
  const R = model.viewRadius;

  const section = document.createElement('section');
  section.className = 'rw-system-chart';
  section.setAttribute('data-system-id', model.systemId);
  section.setAttribute('data-extent', String(Math.round(extent)));
  section.setAttribute('data-view-radius', String(Math.round(R)));
  section.setAttribute('data-traffic-near', String(model.counts.near));
  section.setAttribute('data-traffic-mid', String(model.counts.mid));
  section.setAttribute('data-traffic-far', String(model.counts.far));
  section.setAttribute('aria-label', 'In-system chart of ' + model.systemName);

  const head = document.createElement('div');
  head.className = 'rw-system-chart-head';
  const title = document.createElement('h3');
  title.className = 'rw-system-chart-title';
  title.textContent = model.systemName;
  const scale = document.createElement('span');
  scale.className = 'rw-system-chart-scale';
  scale.textContent = 'Rings 1000 / 2000 u \u00b7 extent ' + Math.round(extent) + ' u';
  head.appendChild(title);
  head.appendChild(scale);

  const svg = svgEl('svg', {
    class: 'rw-system-svg',
    viewBox: -R + ' ' + -R + ' ' + (R * 2) + ' ' + (R * 2),
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'In-system chart of ' + model.systemName
      + ': sun, ' + model.planets.length + ' planet orbits, station, '
      + model.gates.length + ' gates, ' + model.fields.length + ' asteroid fields, '
      + (model.landmarks.length + model.clues.length + model.sites.length) + ' landmarks/clues and '
      + model.traffic.length + ' abstract-traffic markers.',
  });

  const ringsLayer = svgEl('g', { class: 'rw-system-rings' });
  for (let i = 0; i < RING_RADII.length; i++) {
    const r = RING_RADII[i];
    if (r < extent) addRing(ringsLayer, r, 'rw-system-ring', minorSize, r + ' u');
  }
  addRing(ringsLayer, extent, 'rw-system-ring rw-system-ring-edge', minorSize, 'extent ' + Math.round(extent) + ' u');

  const fieldsLayer = svgEl('g', { class: 'rw-system-fields' });
  const orbitLayer = svgEl('g', { class: 'rw-system-orbits' });
  const sunLayer = svgEl('g', { class: 'rw-system-sun-layer' });
  const gatesLayer = svgEl('g', { class: 'rw-system-gates' });
  const stationLayer = svgEl('g', { class: 'rw-system-station-layer' });
  const hubLayer = svgEl('g', { class: 'rw-system-hub-layer' });
  const poiLayer = svgEl('g', { class: 'rw-system-pois' });
  const trafficLayer = svgEl('g', { class: 'rw-system-traffic-layer' });
  const playerLayer = svgEl('g', { class: 'rw-system-player-layer' });
  const labelLayer = svgEl('g', { class: 'rw-system-labels' });
  const scaleLayer = svgEl('g', { class: 'rw-system-scale' });

  // Sun (origin).
  const sunDrawR = Math.max(model.sun.radius, extent * 0.006);
  sunLayer.appendChild(svgEl('circle', {
    class: 'rw-system-sun',
    cx: 0,
    cy: 0,
    r: sunDrawR,
  }));
  labelLayer.appendChild(textEl('rw-system-label rw-system-sun-label', 0,
    sunDrawR + labelSize * 0.9, 'Sun', { 'text-anchor': 'middle' }, labelSize));

  // Planet orbit rings + live/deterministic planet dots.
  const planetDots = [];
  for (let i = 0; i < model.planets.length; i++) {
    const planet = model.planets[i];
    orbitLayer.appendChild(svgEl('circle', {
      class: 'rw-system-orbit',
      cx: 0,
      cy: 0,
      r: planet.orbitRadius,
      fill: 'none',
    }));
    const dot = svgEl('circle', {
      class: 'rw-system-planet',
      cx: planet.x,
      cy: planet.z,
      r: Math.max(markerR, fin(planet.radius) ? planet.radius : 0),
      'data-slot': String(planet.slot),
    });
    planetDots.push({ el: dot, slot: planet.slot });
    orbitLayer.appendChild(dot);
  }

  // Asteroid fields.
  for (let i = 0; i < model.fields.length; i++) {
    addField(fieldsLayer, labelLayer, model.fields[i], minorSize);
  }

  // Gates with destination names.
  for (let i = 0; i < model.gates.length; i++) {
    addGate(gatesLayer, labelLayer, model.gates[i], markerR, minorSize);
  }

  // Station.
  if (model.station) {
    stationLayer.appendChild(svgEl('circle', {
      class: 'rw-system-station',
      cx: model.station.x,
      cy: model.station.z,
      r: markerR * 1.5,
    }));
    labelLayer.appendChild(textEl('rw-system-station-label', model.station.x,
      model.station.z + markerR * 1.5 + labelSize, model.station.name, { 'text-anchor': 'middle' }, labelSize));
  }

  // Lamplighter hub junction.
  if (model.hub) {
    hubLayer.appendChild(svgEl('circle', {
      class: 'rw-system-hub',
      cx: model.hub.x,
      cy: model.hub.z,
      r: markerR * 1.3,
      fill: 'none',
    }));
    labelLayer.appendChild(textEl('rw-system-hub-label', model.hub.x,
      model.hub.z + markerR * 1.3 + labelSize, 'Lamplighter hub \u00b7 ' + model.hub.routes, {
        'text-anchor': 'middle',
      }, labelSize));
  }

  // Landmarks / clues / hinted mystery sites.
  for (let i = 0; i < model.landmarks.length; i++) {
    addPoi(poiLayer, labelLayer, model.landmarks[i], 'rw-system-landmark', markerR, minorSize, model.landmarks[i].known, true);
  }
  for (let i = 0; i < model.clues.length; i++) {
    addPoi(poiLayer, labelLayer, model.clues[i], 'rw-system-clue', markerR, minorSize, model.clues[i].known);
  }
  for (let i = 0; i < model.sites.length; i++) {
    addPoi(poiLayer, labelLayer, model.sites[i], 'rw-system-site', markerR, minorSize, model.sites[i].known);
  }

  const trafficNearEl = legendItem('rw-system-legend-near', '');
  const trafficMidEl = legendItem('rw-system-legend-mid', '');
  const trafficFarEl = legendItem('rw-system-legend-far', '');

  // Abstract-traffic tier markers (near/mid/far shapes differ, not hue only).
  const paintTraffic = (list, counts) => {
    clearChildren(trafficLayer);
    for (let i = 0; i < list.length; i++) {
      const t = list[i];
      trafficLayer.appendChild(trafficShape(t.tier, t.x, t.z, markerR, t.id, t.role));
    }
    section.setAttribute('data-traffic-near', String(counts.near));
    section.setAttribute('data-traffic-mid', String(counts.mid));
    section.setAttribute('data-traffic-far', String(counts.far));
    trafficNearEl.textContent = 'near \u2264' + NEAR_RANGE + ' u (' + counts.near + ')';
    trafficMidEl.textContent = 'mid \u2264' + MID_RANGE + ' u (' + counts.mid + ')';
    trafficFarEl.textContent = 'far >' + MID_RANGE + ' u (' + counts.far + ')';
  };

  // Player marker.
  playerLayer.appendChild(svgEl('circle', {
    class: 'rw-system-player',
    cx: model.player.x,
    cy: model.player.z,
    r: markerR,
    fill: 'none',
  }));
  labelLayer.appendChild(textEl('rw-system-label rw-system-player-label', model.player.x,
    model.player.z + markerR + labelSize * 0.9, 'You', { 'text-anchor': 'middle' }, labelSize));

  // Scale bar (400 u) at the bottom edge.
  const barY = R - 30;
  scaleLayer.appendChild(svgEl('line', {
    class: 'rw-system-scalebar',
    x1: -SCALE_BAR_UNITS / 2,
    y1: barY,
    x2: SCALE_BAR_UNITS / 2,
    y2: barY,
  }));
  scaleLayer.appendChild(textEl('rw-system-scale-label', 0, barY - minorSize * 0.4,
    SCALE_BAR_UNITS + ' u', { 'text-anchor': 'middle' }, minorSize));

  svg.appendChild(ringsLayer);
  svg.appendChild(fieldsLayer);
  svg.appendChild(orbitLayer);
  svg.appendChild(sunLayer);
  svg.appendChild(gatesLayer);
  svg.appendChild(stationLayer);
  svg.appendChild(hubLayer);
  svg.appendChild(poiLayer);
  svg.appendChild(trafficLayer);
  svg.appendChild(playerLayer);
  svg.appendChild(scaleLayer);
  svg.appendChild(labelLayer);

  const legend = document.createElement('div');
  legend.className = 'rw-system-chart-legend';
  legend.appendChild(trafficNearEl);
  legend.appendChild(trafficMidEl);
  legend.appendChild(trafficFarEl);
  legend.appendChild(legendItem('rw-system-legend-orbit', 'orbit'));
  legend.appendChild(legendItem('rw-system-legend-field', 'field'));
  legend.appendChild(legendItem('rw-system-legend-found', 'found'));
  legend.appendChild(legendItem('rw-system-legend-unknown', 'uncharted'));

  const note = document.createElement('p');
  note.className = 'rw-system-chart-note';
  note.textContent = 'M or Escape closes. Traffic markers are abstract-record positions tiered by distance from your ship; '
    + 'uncharted landmarks render faint until you visit them.';

  paintTraffic(model.traffic, model.counts);

  section.appendChild(head);
  section.appendChild(svg);
  section.appendChild(legend);
  section.appendChild(note);
  host.appendChild(section);

  function update(nextCtx) {
    try {
      const world = nextCtx && nextCtx.world;
      if (!world || world.currentSystem !== model.systemId) return false;
      const player = readPlayer(nextCtx);
      model.player = player;
      const playerCircle = playerLayer.children && playerLayer.children[0];
      if (playerCircle) {
        playerCircle.setAttribute('cx', String(player.x));
        playerCircle.setAttribute('cy', String(player.z));
      }
      const bodies = Array.isArray(nextCtx.planetBodies) ? nextCtx.planetBodies : null;
      if (bodies && bodies.length === model.planets.length) {
        for (let i = 0; i < planetDots.length; i++) {
          const dot = planetDots[i];
          const body = bodies[dot.slot];
          if (!body || !fin(body.x) || !fin(body.z)) continue;
          dot.el.setAttribute('cx', String(body.x));
          dot.el.setAttribute('cy', String(body.z));
        }
      }
      const fresh = collectTraffic(world, model.systemId, player);
      model.traffic = fresh.traffic;
      model.counts = fresh.counts;
      paintTraffic(fresh.traffic, fresh.counts);
      return true;
    } catch {
      return false;
    }
  }

  return { key, model, update };
}
