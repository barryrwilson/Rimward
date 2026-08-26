import { SYSTEMS, FACTIONS, RANK_LADDER, rankFor } from '../game/state.js';
import { clearRoute, plotRoute, sanitizeSystemId } from '../game/nav.js';
import { hoverModel } from '../game/chart-hover.js';
import { standingRead } from '../game/data-trade.js';
import { tryEngage, disengage, apLine, apRefuseToken, guardAutopilotSpace } from '../game/autopilot.js';
import { canOpenPlayCard, playSurfaceBlocked, isTypingFocus } from './overlay-policy.js';
import '../ui/hud.css';

/**
 * Runtime galaxy chart (wave 21) — a DOM/SVG overlay of the whole rim,
 * built ONCE at init from the live SYSTEMS/FACTIONS records. No fs, no
 * dev-script imports, no network, no static SVG fetch: every node and edge
 * is derived from the same data the simulation runs on.
 *
 * Geometry: system.chart is [x, y] in a ~2000×1400 chart box. The SVG
 * viewBox is fitted to the actual data bounding box plus MARGIN, so
 * generated systems can never fall outside the frame.
 *
 * Content (§25 — navigation information only): system names, faction
 * colors, physical gates (.rw-galaxy-gate, deduped undirected pairs), and
 * one-way hub routes (.rw-galaxy-route, hub → destination). Hub systems
 * get a dashed ring. Fit view labels the authored seven, hub systems, and
 * pinned specials. Zoom scale ≥ 2 also names in-view charted systems.
 * Clue ids/text and landmark discovery state are NEVER read here.
 * Zoom/pan/filter are session only; close resets the fitted view.
 *
 * Interaction: KeyM toggles (suppressed while docked — the station overlay
 * owns that screen), Escape or the close button closes. The chart does not
 * pause gameplay. Wheel and Zoom buttons change the SVG viewBox. Flight
 * keys keep working; the close control is a real <button> in tab order.
 * Click a charted hit disc or a system name to plot (or click current /
 * Clear to drop). The Destination list under the description plots any
 * charted system from the keyboard. Hover a hit disc or label to inspect
 * name, control, and Digit 9 standing. Hover does not plot, does not write
 * world.nav, and does not emit.
 *
 * Per-frame cost: update() only diffs ctx.world.currentSystem against a
 * cached id — on change it moves .is-current between node elements and
 * repositions one pre-created marker ring. Plot overlay retargets when nav
 * / currentSystem identity changes. No full SVG rebuild on the hot path.
 * save.js swaps world records wholesale; currentSystem is re-read from
 * ctx.world every frame, so restores are picked up live.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const MARGIN = 80; // chart units of breathing room around the data bbox
const NODE_R = 8;
const HUB_RING_R = 15;
const MARKER_R = 22;
const HIT_CSS_DIAMETER = 24;
const MAP_SCALE_MIN = 1;
const MAP_SCALE_MAX = 8;
const MAP_ZOOM_STEP = 1.5;
const MAP_WHEEL_STEP = 1.15;
const MAP_LABEL_SCALE = 2;
const MAP_DRAG_PX = 4;

// Authored seven (their records live in game/authored-systems.js — wave 22 —
// and state.js does not re-export them; ids are stable and boot tests pin
// them). Pinned specials are wave-19 landmarks of the
// generated rim that the design doc calls out by name.
const AUTHORED_IDS = new Set(['freehold', 'veridian', 'redmarch', 'hollowreach', 'hush', 'verge', 'veil']);
const PINNED_IDS = new Set(['stolenwomb', 'lastbeacon', 'blackstation', 'fx_bastion', 'gc_auction']);

const FALLBACK_COLOR = 0x9aa7b8; // FACTIONS.independent gray

function hexColor(n) {
  return `#${(typeof n === 'number' ? n : FALLBACK_COLOR).toString(16).padStart(6, '0')}`;
}

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
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

function isHitDisc(el) {
  if (!el || typeof el.getAttribute !== 'function') return false;
  const cls = el.getAttribute('class') || '';
  const parts = cls.split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'rw-galaxy-hit') return true;
  }
  return false;
}

function isPlotTarget(el) {
  if (!el || typeof el.getAttribute !== 'function') return false;
  if (!el.getAttribute('data-system-id')) return false;
  const cls = el.getAttribute('class') || '';
  const parts = cls.split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'rw-galaxy-hit' || parts[i] === 'rw-galaxy-label' || parts[i] === 'rw-galaxy-node') return true;
  }
  return false;
}

function destLabel(id) {
  const sid = sanitizeSystemId(id);
  if (!sid || !Object.hasOwn(SYSTEMS, sid)) return '';
  const n = SYSTEMS[sid].name;
  return typeof n === 'string' && n ? n : sid;
}

function factionKeyOf(id) {
  if (!id || !Object.hasOwn(SYSTEMS, id)) return '';
  const key = SYSTEMS[id].faction;
  if (typeof key !== 'string' || !key) return '';
  if (!Object.hasOwn(FACTIONS, key)) return '';
  return key;
}

function factionDisplayName(key) {
  if (!key || !Object.hasOwn(FACTIONS, key)) return 'Unknown';
  const n = FACTIONS[key].name;
  return typeof n === 'string' && n ? n : 'Unknown';
}

function hasGateTo(fromId, toId) {
  if (!fromId || !toId || !Object.hasOwn(SYSTEMS, fromId)) return false;
  const gates = SYSTEMS[fromId].gates;
  if (!Array.isArray(gates)) return false;
  for (let i = 0; i < gates.length; i++) {
    if (!Object.hasOwn(gates, i)) continue;
    const g = gates[i];
    if (!g || typeof g !== 'object' || Array.isArray(g)) continue;
    if (sanitizeSystemId(g.to) === toId) return true;
  }
  return false;
}

function hasHubRouteTo(fromId, toId) {
  if (!fromId || !toId || !Object.hasOwn(SYSTEMS, fromId)) return false;
  const hub = SYSTEMS[fromId].hub;
  if (!hub || typeof hub !== 'object' || Array.isArray(hub)) return false;
  const routes = hub.routes;
  if (!Array.isArray(routes)) return false;
  for (let i = 0; i < routes.length; i++) {
    if (!Object.hasOwn(routes, i)) continue;
    if (sanitizeSystemId(routes[i]) === toId) return true;
  }
  return false;
}

function gateTypeToken(fromId, toId) {
  if (!fromId || !toId) return 'unknown';
  const gate = hasGateTo(fromId, toId);
  const hub = hasHubRouteTo(fromId, toId);
  if (gate && hub) return 'gate + hub';
  if (gate) return 'gate';
  if (hub) return 'hub route';
  return 'unknown';
}

function pirateTraffic(id) {
  if (!id || !Object.hasOwn(SYSTEMS, id)) return 0;
  const cast = SYSTEMS[id].cast;
  if (!cast || typeof cast !== 'object' || Array.isArray(cast)) return 0;
  if (!Object.hasOwn(cast, 'pirates')) return 0;
  const n = cast.pirates;
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return 0;
  return n;
}

function setHiddenClass(el, hidden) {
  if (!el || !el.classList) return;
  el.classList.toggle('is-filter-hidden', !!hidden);
}

function jumpPhrase(n) {
  return n === 1 ? '1 jump' : `${n} jumps`;
}

export function initGalaxyChart(ctx) {
  const ids = Object.keys(SYSTEMS);

  // ---------- bounding box over every charted system ----------
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const id of ids) {
    const c = SYSTEMS[id].chart;
    if (!Array.isArray(c)) continue; // defensive: uncharted records are skipped
    if (c[0] < minX) minX = c[0];
    if (c[0] > maxX) maxX = c[0];
    if (c[1] < minY) minY = c[1];
    if (c[1] > maxY) maxY = c[1];
  }
  if (!Number.isFinite(minX)) { minX = 0; minY = 0; maxX = 1; maxY = 1; } // empty galaxy guard
  const viewX = minX - MARGIN;
  const viewY = minY - MARGIN;
  const viewW = (maxX - minX) + MARGIN * 2;
  const viewH = (maxY - minY) + MARGIN * 2;

  // ---------- root dialog ----------
  const root = document.createElement('div');
  root.className = 'rw-galaxy-chart is-hidden';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'false'); // gameplay continues underneath
  root.setAttribute('aria-labelledby', 'rw-galaxy-chart-title');
  root.setAttribute('aria-describedby', 'rw-galaxy-chart-desc');
  root.setAttribute('aria-hidden', 'true');

  const panel = document.createElement('div');
  panel.className = 'rw-galaxy-chart-panel';

  const header = document.createElement('div');
  header.className = 'rw-galaxy-chart-header';

  const title = document.createElement('h2');
  title.className = 'rw-galaxy-chart-title';
  title.id = 'rw-galaxy-chart-title';
  title.textContent = 'Galaxy Chart';

  const actions = document.createElement('div');
  actions.className = 'rw-galaxy-chart-actions';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'rw-galaxy-clear';
  clearBtn.textContent = 'Clear route';

  const apLive = document.createElement('div');
  apLive.className = 'rw-galaxy-ap-live';
  apLive.id = 'rw-galaxy-ap-live';
  apLive.setAttribute('role', 'status');
  apLive.setAttribute('aria-live', 'polite');
  apLive.textContent = '';

  const apCluster = document.createElement('div');
  apCluster.className = 'rw-galaxy-ap-cluster';

  const apBtn = document.createElement('button');
  apBtn.type = 'button';
  apBtn.className = 'rw-galaxy-ap';
  apBtn.textContent = 'Autopilot';
  apBtn.setAttribute('aria-label', 'Autopilot');
  apBtn.setAttribute('aria-describedby', 'rw-galaxy-ap-live');
  apBtn.addEventListener('keydown', guardAutopilotSpace);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'rw-galaxy-close';
  closeBtn.setAttribute('aria-label', 'Close galaxy chart');
  closeBtn.textContent = '×';

  apCluster.appendChild(apBtn);
  apCluster.appendChild(closeBtn);
  actions.appendChild(clearBtn);
  actions.appendChild(apCluster);
  header.appendChild(title);
  header.appendChild(apLive);
  header.appendChild(actions);

  const desc = document.createElement('p');
  desc.className = 'rw-galaxy-chart-desc';
  desc.id = 'rw-galaxy-chart-desc';
  desc.textContent = 'Names, factions, and gate routes of the known rim. Solid lines are two-way gates; dashed gold lines are one-way Lamplighter hub routes. Click a system to plot a route. M or Escape closes.';

  const destField = document.createElement('div');
  destField.className = 'rw-galaxy-dest-field';
  const destLbl = document.createElement('label');
  destLbl.className = 'rw-galaxy-dest-label';
  destLbl.htmlFor = 'rw-galaxy-dest';
  destLbl.setAttribute('for', 'rw-galaxy-dest');
  destLbl.textContent = 'Destination';
  const destSelect = document.createElement('select');
  destSelect.id = 'rw-galaxy-dest';
  destSelect.className = 'rw-galaxy-dest';
  const destPlaceholder = document.createElement('option');
  destPlaceholder.value = '';
  destPlaceholder.textContent = 'Plot a system';
  destSelect.appendChild(destPlaceholder);
  const destOpts = [];
  const destOptById = new Map();
  for (const id of Object.keys(SYSTEMS)) {
    if (!Object.hasOwn(SYSTEMS, id)) continue;
    const sys = SYSTEMS[id];
    if (!sys || !Array.isArray(sys.chart)) continue;
    const sid = sanitizeSystemId(id);
    if (!sid) continue;
    destOpts.push({ id: sid, name: destLabel(sid) });
  }
  destOpts.sort((a, b) => {
    const byName = String(a.name).localeCompare(String(b.name));
    if (byName !== 0) return byName;
    return String(a.id).localeCompare(String(b.id));
  });
  for (let i = 0; i < destOpts.length; i++) {
    const rec = destOpts[i];
    const opt = document.createElement('option');
    opt.value = rec.id;
    opt.textContent = rec.name;
    destSelect.appendChild(opt);
    destOptById.set(rec.id, opt);
  }
  destField.appendChild(destLbl);
  destField.appendChild(destSelect);

  const filterRow = document.createElement('div');
  filterRow.className = 'rw-galaxy-filters';

  const factionLbl = document.createElement('label');
  factionLbl.className = 'rw-galaxy-filter-label';
  factionLbl.htmlFor = 'rw-galaxy-filter-faction';
  factionLbl.setAttribute('for', 'rw-galaxy-filter-faction');
  factionLbl.textContent = 'Faction';
  const factionSelect = document.createElement('select');
  factionSelect.id = 'rw-galaxy-filter-faction';
  factionSelect.className = 'rw-galaxy-filter-faction';
  const factionAll = document.createElement('option');
  factionAll.value = '';
  factionAll.textContent = 'All';
  factionSelect.appendChild(factionAll);
  const factionKeys = Object.keys(FACTIONS);
  for (let fi = 0; fi < factionKeys.length; fi++) {
    const fk = factionKeys[fi];
    if (!Object.hasOwn(FACTIONS, fk)) continue;
    const fopt = document.createElement('option');
    fopt.value = fk;
    fopt.textContent = factionDisplayName(fk);
    factionSelect.appendChild(fopt);
  }

  const standingLbl = document.createElement('label');
  standingLbl.className = 'rw-galaxy-filter-label';
  standingLbl.htmlFor = 'rw-galaxy-filter-standing';
  standingLbl.setAttribute('for', 'rw-galaxy-filter-standing');
  standingLbl.textContent = 'Standing';
  const standingSelect = document.createElement('select');
  standingSelect.id = 'rw-galaxy-filter-standing';
  standingSelect.className = 'rw-galaxy-filter-standing';
  const standingAll = document.createElement('option');
  standingAll.value = '';
  standingAll.textContent = 'All';
  standingSelect.appendChild(standingAll);
  for (let ri = 0; ri < RANK_LADDER.length; ri++) {
    if (!Object.hasOwn(RANK_LADDER, ri)) continue;
    const rung = RANK_LADDER[ri];
    const rname = rung && typeof rung.name === 'string' ? rung.name : '';
    if (!rname) continue;
    const ropt = document.createElement('option');
    ropt.value = rname;
    ropt.textContent = rname;
    standingSelect.appendChild(ropt);
  }
  const standingUnknown = document.createElement('option');
  standingUnknown.value = 'Unknown';
  standingUnknown.textContent = 'Unknown';
  standingSelect.appendChild(standingUnknown);

  const zoomCluster = document.createElement('div');
  zoomCluster.className = 'rw-galaxy-zoom-cluster';
  const zoomInBtn = document.createElement('button');
  zoomInBtn.type = 'button';
  zoomInBtn.id = 'rw-galaxy-zoom-in';
  zoomInBtn.className = 'rw-galaxy-zoom';
  zoomInBtn.textContent = 'Zoom in';
  zoomInBtn.setAttribute('aria-label', 'Zoom in');
  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.type = 'button';
  zoomOutBtn.id = 'rw-galaxy-zoom-out';
  zoomOutBtn.className = 'rw-galaxy-zoom';
  zoomOutBtn.textContent = 'Zoom out';
  zoomOutBtn.setAttribute('aria-label', 'Zoom out');
  const zoomResetBtn = document.createElement('button');
  zoomResetBtn.type = 'button';
  zoomResetBtn.id = 'rw-galaxy-zoom-reset';
  zoomResetBtn.className = 'rw-galaxy-zoom';
  zoomResetBtn.textContent = 'Reset view';
  zoomResetBtn.setAttribute('aria-label', 'Reset view');
  zoomCluster.appendChild(zoomInBtn);
  zoomCluster.appendChild(zoomOutBtn);
  zoomCluster.appendChild(zoomResetBtn);

  filterRow.appendChild(factionLbl);
  filterRow.appendChild(factionSelect);
  filterRow.appendChild(standingLbl);
  filterRow.appendChild(standingSelect);
  filterRow.appendChild(zoomCluster);

  const itinerary = document.createElement('section');
  itinerary.id = 'rw-galaxy-itinerary';
  itinerary.className = 'rw-galaxy-itinerary';
  itinerary.hidden = true;
  itinerary.setAttribute('aria-hidden', 'true');
  const itineraryTitle = document.createElement('h3');
  itineraryTitle.className = 'rw-galaxy-itinerary-title';
  itineraryTitle.textContent = 'Itinerary';
  const itineraryList = document.createElement('ol');
  itineraryList.className = 'rw-galaxy-itinerary-list';
  itinerary.appendChild(itineraryTitle);
  itinerary.appendChild(itineraryList);

  const legend = document.createElement('div');
  legend.className = 'rw-galaxy-legend';
  const legendGate = document.createElement('span');
  legendGate.className = 'rw-galaxy-legend-item rw-galaxy-legend-gate';
  legendGate.textContent = 'gate';
  const legendRoute = document.createElement('span');
  legendRoute.className = 'rw-galaxy-legend-item rw-galaxy-legend-route';
  legendRoute.textContent = 'hub route';
  const legendHub = document.createElement('span');
  legendHub.className = 'rw-galaxy-legend-item rw-galaxy-legend-hub';
  legendHub.textContent = 'hub';
  const legendPlot = document.createElement('span');
  legendPlot.className = 'rw-galaxy-legend-item rw-galaxy-legend-plot';
  legendPlot.textContent = 'plotted route';
  legend.appendChild(legendGate);
  legend.appendChild(legendRoute);
  legend.appendChild(legendHub);
  legend.appendChild(legendPlot);

  // ---------- svg ----------
  const svg = svgEl('svg', {
    class: 'rw-galaxy-svg',
    viewBox: `${viewX} ${viewY} ${viewW} ${viewH}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': `Map of ${ids.length} rim systems and their gate connections`,
  });

  // Physical gates: deduped undirected pairs.
  const gateLayer = svgEl('g', { class: 'rw-galaxy-gates' });
  const seenEdges = new Set();
  const edgeEls = [];
  for (const id of ids) {
    const from = SYSTEMS[id];
    if (!Array.isArray(from.chart)) continue;
    for (const gate of from.gates ?? []) {
      const to = SYSTEMS[gate.to];
      if (!to || !Array.isArray(to.chart)) continue;
      const key = id < gate.to ? `${id}|${gate.to}` : `${gate.to}|${id}`;
      if (seenEdges.has(key)) continue;
      seenEdges.add(key);
      const line = svgEl('line', {
        class: 'rw-galaxy-gate',
        x1: from.chart[0], y1: from.chart[1],
        x2: to.chart[0], y2: to.chart[1],
        'data-from': id,
        'data-to': gate.to,
      });
      gateLayer.appendChild(line);
      edgeEls.push(line);
    }
  }
  svg.appendChild(gateLayer);

  // Hub routes: one-way hub → destination (the physical back-gate is
  // already drawn above as part of the gate network).
  const routeLayer = svgEl('g', { class: 'rw-galaxy-routes' });
  for (const id of ids) {
    const from = SYSTEMS[id];
    if (!from.hub || !Array.isArray(from.chart)) continue;
    for (const destId of from.hub.routes ?? []) {
      const to = SYSTEMS[destId];
      if (!to || !Array.isArray(to.chart)) continue;
      const line = svgEl('line', {
        class: 'rw-galaxy-route',
        x1: from.chart[0], y1: from.chart[1],
        x2: to.chart[0], y2: to.chart[1],
        'data-from': id,
        'data-to': destId,
      });
      routeLayer.appendChild(line);
      edgeEls.push(line);
    }
  }
  svg.appendChild(routeLayer);

  // Player plot overlay (above hub gold, below painted nodes).
  const plotLayer = svgEl('g', { class: 'rw-galaxy-plot-layer' });
  svg.appendChild(plotLayer);

  // Nodes (+ hub rings). nodesById feeds the live current-system highlight.
  const nodeLayer = svgEl('g', { class: 'rw-galaxy-nodes' });
  const labelLayer = svgEl('g', { class: 'rw-galaxy-labels' });
  const hitLayer = svgEl('g', { class: 'rw-galaxy-hits' });
  const nodesById = new Map(); // id → { el, x, y, hit }
  for (const id of ids) {
    const sys = SYSTEMS[id];
    if (!Array.isArray(sys.chart)) continue;
    const [x, y] = sys.chart;
    const faction = FACTIONS[sys.faction];
    const node = svgEl('circle', {
      class: 'rw-galaxy-node',
      cx: x, cy: y, r: NODE_R,
      'data-system-id': id,
      'data-faction': sys.faction ?? 'independent',
    });
    node.style.setProperty('--rw-node-color', hexColor(faction?.color));
    nodeLayer.appendChild(node);

    let hubRing = null;
    if (sys.hub) {
      hubRing = svgEl('circle', {
        class: 'rw-galaxy-hub-ring',
        cx: x, cy: y, r: HUB_RING_R,
      });
      nodeLayer.appendChild(hubRing);
    }

    const hit = svgEl('circle', {
      class: 'rw-galaxy-hit',
      cx: x, cy: y, r: NODE_R,
      fill: 'transparent',
      'fill-opacity': '0',
      'pointer-events': 'all',
      'data-system-id': id,
    });
    hitLayer.appendChild(hit);

    const alwaysLabel = AUTHORED_IDS.has(id) || PINNED_IDS.has(id) || !!sys.hub;
    const lid = sanitizeSystemId(id);
    const labelAttrs = {
      class: alwaysLabel ? 'rw-galaxy-label' : 'rw-galaxy-label rw-galaxy-label-zoom',
      x, y: y + HUB_RING_R + 16,
      'text-anchor': 'middle',
    };
    if (lid) labelAttrs['data-system-id'] = lid;
    const label = svgEl('text', labelAttrs);
    label.textContent = sys.name ?? id;
    if (!alwaysLabel) {
      label.classList.add('is-zoom-hidden');
    }
    labelLayer.appendChild(label);
    nodesById.set(id, { el: node, x, y, hit, label, hubRing, alwaysLabel });
  }
  svg.appendChild(nodeLayer);
  svg.appendChild(hitLayer);
  svg.appendChild(labelLayer);

  // Single reused current-system marker (dashed accent ring + center dot,
  // so "current" never relies on fill color alone, §18.4/§20).
  const marker = svgEl('circle', {
    class: 'rw-galaxy-current-marker is-hidden',
    cx: 0, cy: 0, r: MARKER_R,
  });
  svg.appendChild(marker);

  const hoverMarker = svgEl('circle', {
    class: 'rw-galaxy-hover-marker is-hidden',
    cx: 0,
    cy: 0,
    r: NODE_R + 10,
    fill: 'none',
  });
  svg.appendChild(hoverMarker);

  const hoverReadout = document.createElement('div');
  hoverReadout.className = 'rw-galaxy-hover is-hidden';
  hoverReadout.setAttribute('role', 'status');
  hoverReadout.setAttribute('aria-live', 'polite');
  hoverReadout.setAttribute('aria-hidden', 'true');
  const hoverNameEl = document.createElement('div');
  hoverNameEl.className = 'rw-galaxy-hover-name';
  const hoverControlEl = document.createElement('div');
  hoverControlEl.className = 'rw-galaxy-hover-control';
  const hoverStandingEl = document.createElement('div');
  hoverStandingEl.className = 'rw-galaxy-hover-standing';
  hoverReadout.appendChild(hoverNameEl);
  hoverReadout.appendChild(hoverControlEl);
  hoverReadout.appendChild(hoverStandingEl);

  const status = document.createElement('p');
  status.className = 'rw-galaxy-plot-status is-hidden';
  status.setAttribute('aria-live', 'polite');
  status.textContent = '';

  panel.appendChild(header);
  panel.appendChild(desc);
  panel.appendChild(destField);
  panel.appendChild(filterRow);
  panel.appendChild(itinerary);
  panel.appendChild(svg);
  panel.appendChild(hoverReadout);
  panel.appendChild(status);
  panel.appendChild(legend);
  root.appendChild(panel);
  document.body.appendChild(root);

  // ---------- open/close ----------
  let open = false;
  let appliedScale = 0; // forces first apply on open
  let hoverId = null;
  let hoverNode = null;
  let lastHoverAria = '';
  let mapScale = MAP_SCALE_MIN;
  let camX = viewX;
  let camY = viewY;
  let camW = viewW;
  let camH = viewH;
  let panDrag = null;
  let panMovedThisGesture = false;
  let plottedIdThisGesture = null;
  let lastItinKey = '';

  function hoverControlValue(model) {
    if (!model || model.political === 'unknown') return 'Unknown';
    if (model.political === 'independent') return 'Independent';
    return model.factionName || 'Unknown';
  }

  function hoverStandingValue(model) {
    if (!model || !model.showStanding) return 'Unknown';
    const rep = model.rep;
    const signed = `${rep >= 0 ? '+' : ''}${Math.round(rep)}`;
    return `${model.factionName}: ${model.rankName} (${signed})`;
  }

  function paintHoverHighlight(id) {
    if (hoverNode) hoverNode.classList.remove('is-hover');
    hoverId = id;
    const rec = id ? nodesById.get(id) : null;
    hoverNode = rec ? rec.el : null;
    if (rec) {
      rec.el.classList.add('is-hover');
      hoverMarker.setAttribute('cx', String(rec.x));
      hoverMarker.setAttribute('cy', String(rec.y));
      hoverMarker.classList.remove('is-hidden');
    } else {
      hoverMarker.classList.add('is-hidden');
    }
  }

  function paintHoverReadout(model) {
    if (!model) {
      hoverReadout.setAttribute('aria-hidden', 'true');
      hoverReadout.classList.add('is-hidden');
      if (lastHoverAria !== '') {
        hoverNameEl.textContent = '';
        hoverControlEl.textContent = '';
        hoverStandingEl.textContent = '';
        lastHoverAria = '';
      }
      return;
    }
    const standingLine = `Standing: ${hoverStandingValue(model)}`;
    const ariaKey = `${model.id}\n${standingLine}`;
    if (ariaKey !== lastHoverAria) {
      lastHoverAria = ariaKey;
      hoverNameEl.textContent = model.name;
      hoverControlEl.textContent = `Control: ${hoverControlValue(model)}`;
      hoverStandingEl.textContent = standingLine;
    }
    hoverReadout.removeAttribute('aria-hidden');
    hoverReadout.classList.remove('is-hidden');
  }

  function clearHover() {
    paintHoverHighlight(null);
    paintHoverReadout(null);
  }

  function applyHoverId(id) {
    if (!id || !nodesById.has(id)) {
      clearHover();
      return;
    }
    const model = hoverModel(ctx, id);
    if (!model) {
      clearHover();
      return;
    }
    if (hoverId !== id) paintHoverHighlight(id);
    paintHoverReadout(model);
  }

  function standingBandOf(id, forFilter) {
    try {
      const key = factionKeyOf(id);
      if (!key) return 'Unknown';
      if (forFilter && key === 'independent') return 'Unknown';
      const bag = ctx && ctx.world ? ctx.world.reputation : undefined;
      if (!bag || typeof bag !== 'object' || Array.isArray(bag)) return 'Unknown';
      const rep = standingRead(bag, key);
      const rank = rankFor(rep);
      if (!rank || typeof rank.name !== 'string' || !rank.name) return 'Unknown';
      return rank.name;
    } catch {
      return 'Unknown';
    }
  }

  function knownRiskText(id) {
    const rank = standingBandOf(id);
    const standingClause = (rank === 'Suspect' || rank === 'Marked') ? 'hostile standing' : rank;
    const pirates = pirateTraffic(id);
    if (pirates > 0) return `${standingClause}; pirate traffic ${pirates}`;
    return standingClause;
  }

  function navBag() {
    const bag = ctx.world && ctx.world.nav;
    if (!bag || typeof bag !== 'object' || Array.isArray(bag)) return null;
    return bag;
  }

  function mapAnchors() {
    const out = new Set();
    try {
      const here = sanitizeSystemId(ctx.world && ctx.world.currentSystem);
      if (here) out.add(here);
      const bag = navBag();
      if (!bag) return out;
      const dest = sanitizeSystemId(typeof bag.dest === 'string' ? bag.dest : '');
      const st = typeof bag.status === 'string' ? bag.status : '';
      if (dest && (st === 'plotted' || st === 'blocked' || st === 'arrived')) out.add(dest);
      if (st === 'plotted' && Array.isArray(bag.path)) {
        for (let i = 0; i < bag.path.length; i++) {
          if (!Object.hasOwn(bag.path, i)) continue;
          const hid = sanitizeSystemId(bag.path[i]);
          if (hid) out.add(hid);
        }
      }
    } catch { /* fail closed */ }
    return out;
  }

  function systemPassesFilters(id) {
    if (!id || !nodesById.has(id)) return false;
    const factionWant = factionSelect.value;
    if (factionWant) {
      if (factionKeyOf(id) !== factionWant) return false;
    }
    const standingWant = standingSelect.value;
    if (standingWant) {
      if (standingBandOf(id, true) !== standingWant) return false;
    }
    return true;
  }

  function svgViewScale() {
    const rect = svg.getBoundingClientRect();
    const cssW = rect && rect.width;
    const cssH = rect && rect.height;
    const scale = Math.min(
      (typeof cssW === 'number' && cssW > 0 && camW > 0) ? cssW / camW : 0,
      (typeof cssH === 'number' && cssH > 0 && camH > 0) ? cssH / camH : 0,
    );
    const ox = (typeof cssW === 'number' && scale > 0) ? (cssW - camW * scale) / 2 : 0;
    const oy = (typeof cssH === 'number' && scale > 0) ? (cssH - camH * scale) / 2 : 0;
    return { rect, scale, ox, oy };
  }

  function clientToChart(clientX, clientY) {
    const { rect, scale, ox, oy } = svgViewScale();
    if (!(scale > 0) || !rect) return { x: camX + camW / 2, y: camY + camH / 2 };
    return {
      x: camX + (clientX - rect.left - ox) / scale,
      y: camY + (clientY - rect.top - oy) / scale,
    };
  }

  function clampCam() {
    if (!(mapScale >= MAP_SCALE_MIN)) mapScale = MAP_SCALE_MIN;
    if (mapScale > MAP_SCALE_MAX) mapScale = MAP_SCALE_MAX;
    if (mapScale < MAP_SCALE_MIN) mapScale = MAP_SCALE_MIN;
    camW = viewW / mapScale;
    camH = viewH / mapScale;
    const maxX = viewX + viewW;
    const maxY = viewY + viewH;
    if (camX < viewX) camX = viewX;
    if (camY < viewY) camY = viewY;
    if (camX + camW > maxX) camX = maxX - camW;
    if (camY + camH > maxY) camY = maxY - camH;
  }

  function nodeInView(x, y) {
    return x >= camX && x <= camX + camW && y >= camY && y <= camY + camH;
  }

  function updateZoomLabels() {
    const zoomed = mapScale >= MAP_LABEL_SCALE;
    for (const rec of nodesById.values()) {
      const label = rec.label;
      if (!label) continue;
      if (rec.alwaysLabel) {
        label.classList.remove('is-zoom-hidden');
        continue;
      }
      const show = zoomed && nodeInView(rec.x, rec.y);
      label.classList.toggle('is-zoom-hidden', !show);
    }
  }

  function applyView() {
    try {
      clampCam();
      svg.setAttribute('viewBox', `${camX} ${camY} ${camW} ${camH}`);
      updateHitRadii();
      updateZoomLabels();
    } catch { /* keep flying */ }
  }

  function resetView() {
    mapScale = MAP_SCALE_MIN;
    camX = viewX;
    camY = viewY;
    camW = viewW;
    camH = viewH;
    panDrag = null;
    try { svg.classList.remove('is-panning'); } catch { /* ignore */ }
    applyView();
  }

  function zoomAt(clientX, clientY, factor) {
    try {
      const pt = clientToChart(clientX, clientY);
      const next = mapScale * factor;
      mapScale = Math.min(MAP_SCALE_MAX, Math.max(MAP_SCALE_MIN, next));
      camW = viewW / mapScale;
      camH = viewH / mapScale;
      const { rect, scale, ox, oy } = svgViewScale();
      if (scale > 0 && rect) {
        camX = pt.x - (clientX - rect.left - ox) / scale;
        camY = pt.y - (clientY - rect.top - oy) / scale;
      }
      applyView();
    } catch { /* fail closed */ }
  }

  function zoomTowardCenter(factor) {
    try {
      const { rect } = svgViewScale();
      if (!rect) {
        mapScale = Math.min(MAP_SCALE_MAX, Math.max(MAP_SCALE_MIN, mapScale * factor));
        applyView();
        return;
      }
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
    } catch { /* fail closed */ }
  }

  function applyFilters() {
    try {
      const anchors = mapAnchors();
      const pinnedSelect = new Set();
      const here = sanitizeSystemId(ctx.world && ctx.world.currentSystem);
      if (here) pinnedSelect.add(here);
      const bag = navBag();
      const dest = bag ? sanitizeSystemId(typeof bag.dest === 'string' ? bag.dest : '') : null;
      const st = bag && typeof bag.status === 'string' ? bag.status : '';
      if (dest && (st === 'plotted' || st === 'blocked' || st === 'arrived')) pinnedSelect.add(dest);

      for (const [id, rec] of nodesById) {
        const pass = systemPassesFilters(id) || anchors.has(id);
        const hide = !pass;
        setHiddenClass(rec.el, hide);
        setHiddenClass(rec.hit, hide);
        setHiddenClass(rec.label, hide);
        if (rec.hubRing) setHiddenClass(rec.hubRing, hide);
      }

      for (let i = 0; i < edgeEls.length; i++) {
        const line = edgeEls[i];
        const a = line.getAttribute('data-from');
        const b = line.getAttribute('data-to');
        const keepAnchor = anchors.has(a) || anchors.has(b);
        const bothFail = !systemPassesFilters(a) && !systemPassesFilters(b);
        setHiddenClass(line, bothFail && !keepAnchor);
      }

      for (const [id, opt] of destOptById) {
        const keep = systemPassesFilters(id) || pinnedSelect.has(id);
        opt.hidden = !keep;
      }
    } catch { /* never throw */ }
  }

  function hideItinerary() {
    itinerary.hidden = true;
    itinerary.setAttribute('aria-hidden', 'true');
    if (lastItinKey !== '') {
      clearChildren(itineraryList);
      lastItinKey = '';
    }
  }

  function paintItinerary() {
    try {
      const bag = navBag();
      if (!bag) {
        hideItinerary();
        return;
      }
      const st = typeof bag.status === 'string' ? bag.status : '';
      const path = Array.isArray(bag.path) ? bag.path : [];
      if (st !== 'plotted' || path.length < 2) {
        hideItinerary();
        return;
      }
      const parts = [];
      for (let i = 0; i < path.length - 1; i++) {
        if (!Object.hasOwn(path, i) || !Object.hasOwn(path, i + 1)) continue;
        const from = sanitizeSystemId(path[i]);
        const to = sanitizeSystemId(path[i + 1]);
        if (!from || !to) continue;
        const name = destLabel(to) || to;
        const faction = factionDisplayName(factionKeyOf(to));
        const rank = standingBandOf(to);
        const gate = gateTypeToken(from, to);
        const risk = knownRiskText(to);
        parts.push(`${name} — ${faction} — ${rank} — ${gate} — ${risk}`);
      }
      const key = `${st}|${path.join(',')}|${parts.join('\n')}`;
      if (key === lastItinKey) {
        itinerary.hidden = false;
        itinerary.setAttribute('aria-hidden', 'false');
        return;
      }
      lastItinKey = key;
      clearChildren(itineraryList);
      for (let i = 0; i < parts.length; i++) {
        const li = document.createElement('li');
        li.textContent = parts[i];
        itineraryList.appendChild(li);
      }
      itinerary.hidden = false;
      itinerary.setAttribute('aria-hidden', 'false');
    } catch {
      hideItinerary();
    }
  }

  function setOpen(next) {
    if (next) {
      try {
        if (canOpenPlayCard(ctx, 'chart') === false) return;
      } catch { /* skip mutex */ }
    }
    open = next;
    ctx.flags.chartOpen = next;
    root.classList.toggle('is-hidden', !next);
    root.setAttribute('aria-hidden', String(!next));
    if (next) {
      panDrag = null;
      panMovedThisGesture = false;
      plottedIdThisGesture = null;
      resetView();
      applyFilters();
      paintItinerary();
    } else {
      resetView();
      clearHover();
      try {
        const ae = typeof document !== 'undefined' ? document.activeElement : null;
        if (ae && typeof root.contains === 'function' && root.contains(ae) && typeof ae.blur === 'function') {
          ae.blur();
        }
      } catch { /* close still wins */ }
    }
  }

  function hitRadiusChart() {
    const { scale } = svgViewScale();
    if (!(scale > 0)) return NODE_R;
    return Math.max(NODE_R, (HIT_CSS_DIAMETER / 2) / scale);
  }

  function updateHitRadii() {
    const r = String(hitRadiusChart());
    for (const rec of nodesById.values()) {
      rec.hit.setAttribute('r', r);
    }
  }

  function plotIdentity() {
    const here = ctx.world && ctx.world.currentSystem;
    const bag = ctx.world && ctx.world.nav;
    if (!bag || typeof bag !== 'object' || Array.isArray(bag)) {
      return `idle|${here || ''}`;
    }
    const dest = typeof bag.dest === 'string' ? bag.dest : '';
    const st = typeof bag.status === 'string' ? bag.status : '';
    const path = Array.isArray(bag.path) ? bag.path.join(',') : '';
    const rem = typeof bag.remaining === 'number' ? bag.remaining : '';
    return `${here || ''}|${st}|${dest}|${path}|${rem}`;
  }

  function setStatusText(text) {
    const line = typeof text === 'string' ? text : '';
    status.textContent = line;
    status.classList.toggle('is-hidden', !line);
  }

  let lastPlotKey = '';
  function retargetPlot(force) {
    const key = plotIdentity();
    if (!force && key === lastPlotKey) {
      try { paintItinerary(); } catch { /* keep flying */ }
      return;
    }
    lastPlotKey = key;
    clearChildren(plotLayer);
    for (const rec of nodesById.values()) {
      rec.el.classList.remove('is-dest', 'is-hop', 'is-unreachable');
    }
    const bag = ctx.world && ctx.world.nav;
    if (!bag || typeof bag !== 'object' || Array.isArray(bag)) {
      setStatusText('');
      try { destSelect.value = ''; } catch { /* keep flying */ }
      try { paintItinerary(); applyFilters(); } catch { /* keep flying */ }
      return;
    }
    const dest = sanitizeSystemId(typeof bag.dest === 'string' ? bag.dest : '');
    const st = typeof bag.status === 'string' ? bag.status : '';
    const path = Array.isArray(bag.path) ? bag.path : [];
    const name = dest ? destLabel(dest) : '';
    try {
      destSelect.value = (st === 'plotted' || st === 'blocked') && dest ? dest : '';
    } catch { /* keep flying */ }

    if (st === 'plotted') {
      for (let i = 0; i < path.length; i++) {
        if (!Object.hasOwn(path, i)) continue;
        const id = sanitizeSystemId(path[i]);
        if (!id) continue;
        const rec = nodesById.get(id);
        if (rec) rec.el.classList.add('is-hop');
      }
      if (dest) {
        const drec = nodesById.get(dest);
        if (drec) {
          drec.el.classList.add('is-dest');
          const half = NODE_R + 6;
          plotLayer.appendChild(svgEl('rect', {
            class: 'rw-galaxy-plot-dest',
            x: drec.x - half,
            y: drec.y - half,
            width: half * 2,
            height: half * 2,
            fill: 'none',
          }));
        }
      }
      for (let i = 0; i < path.length - 1; i++) {
        if (!Object.hasOwn(path, i) || !Object.hasOwn(path, i + 1)) continue;
        const a = sanitizeSystemId(path[i]);
        const b = sanitizeSystemId(path[i + 1]);
        if (!a || !b) continue;
        const ra = nodesById.get(a);
        const rb = nodesById.get(b);
        if (!ra || !rb) continue;
        plotLayer.appendChild(svgEl('line', {
          class: 'rw-galaxy-plot',
          x1: ra.x, y1: ra.y,
          x2: rb.x, y2: rb.y,
        }));
      }
      const hops = typeof bag.remaining === 'number' && Number.isFinite(bag.remaining)
        ? Math.trunc(bag.remaining)
        : Math.max(0, path.length - 1);
      setStatusText(name ? `${name} · ${jumpPhrase(hops)}` : '');
      try { paintItinerary(); applyFilters(); } catch { /* keep flying */ }
      return;
    }

    if (st === 'blocked') {
      if (dest) {
        const drec = nodesById.get(dest);
        if (drec) {
          drec.el.classList.add('is-unreachable');
          const half = NODE_R + 6;
          plotLayer.appendChild(svgEl('rect', {
            class: 'rw-galaxy-plot-unreach',
            x: drec.x - half,
            y: drec.y - half,
            width: half * 2,
            height: half * 2,
            fill: 'none',
          }));
        }
      }
      setStatusText('No route from here.');
      try { paintItinerary(); applyFilters(); } catch { /* keep flying */ }
      return;
    }

    if (st === 'arrived') {
      if (dest) {
        const drec = nodesById.get(dest);
        if (drec) drec.el.classList.add('is-dest');
      }
      setStatusText(name ? `Arrived · ${name}` : '');
      try { paintItinerary(); applyFilters(); } catch { /* keep flying */ }
      return;
    }

    setStatusText('');
    try { paintItinerary(); applyFilters(); } catch { /* keep flying */ }
  }

  const AP_LIVE_LIFE = 4;
  let apLiveUntil = 0;

  function showApLive(text) {
    const line = typeof text === 'string' ? text : '';
    apLive.textContent = line;
    apLiveUntil = line ? ctx.elapsed + AP_LIVE_LIFE : 0;
  }

  function navHasRoute() {
    const bag = ctx.world && ctx.world.nav;
    if (!bag || typeof bag !== 'object' || Array.isArray(bag)) return false;
    const dest = typeof bag.dest === 'string' ? bag.dest : '';
    return !!(dest && Array.isArray(bag.path) && bag.path.length >= 1);
  }

  function apFlying() {
    const bag = ctx.world && ctx.world.nav;
    return !!(bag && bag.autopilot === true);
  }

  function syncApButton() {
    const flying = apFlying();
    const hasRoute = navHasRoute();
    const label = flying ? 'Cancel autopilot' : 'Autopilot';
    if (apBtn.textContent !== label) apBtn.textContent = label;
    if (!hasRoute) {
      apBtn.disabled = true;
      apBtn.removeAttribute('aria-disabled');
      apBtn.classList.remove('is-dim');
      apBtn.setAttribute('aria-label', 'Autopilot unavailable — plot a destination first.');
      return;
    }
    apBtn.disabled = false;
    apBtn.setAttribute('aria-label', label);
    if (flying) {
      apBtn.removeAttribute('aria-disabled');
      apBtn.classList.remove('is-dim');
      return;
    }
    const token = apRefuseToken(ctx);
    if (token) {
      apBtn.setAttribute('aria-disabled', 'true');
      apBtn.classList.add('is-dim');
    } else {
      apBtn.removeAttribute('aria-disabled');
      apBtn.classList.remove('is-dim');
    }
  }

  apBtn.addEventListener('click', () => {
    if (apBtn.disabled) return;
    if (apFlying()) {
      disengage(ctx, 'cancel');
      if (ctx.flags && ctx.flags.chartOpen === true) showApLive(apLine('cancel'));
      syncApButton();
      return;
    }
    const token = tryEngage(ctx);
    if (token) {
      const line = apLine(token);
      showApLive(line);
      if (line) ctx.emit('commLine', { text: line });
    } else {
      showApLive('');
      setOpen(false);
      try {
        const doc = typeof document !== 'undefined' ? document : null;
        if (doc) {
          const ae = doc.activeElement;
          if (ae && typeof root.contains === 'function' && root.contains(ae) && typeof ae.blur === 'function') {
            ae.blur();
          }
          const chip = typeof doc.querySelector === 'function'
            ? doc.querySelector('#hud .rw-autopilot-cancel')
            : null;
          const wrap = chip && typeof chip.closest === 'function' ? chip.closest('.rw-autopilot') : null;
          const visible = !!(wrap && wrap.classList && !wrap.classList.contains('is-hidden'));
          if (visible && typeof chip.focus === 'function') chip.focus();
        }
      } catch { /* close still wins; chip may still be is-hidden this frame */ }
    }
    syncApButton();
  });

  function activateSystem(id) {
    const sid = sanitizeSystemId(id);
    if (!sid) return;
    const here = sanitizeSystemId(ctx.world.currentSystem);
    if (sid === here) clearRoute(ctx);
    else plotRoute(ctx, sid);
    retargetPlot(true);
  }

  closeBtn.addEventListener('click', () => setOpen(false));
  clearBtn.addEventListener('click', () => {
    clearRoute(ctx);
    retargetPlot(true);
    syncApButton();
  });

  destSelect.addEventListener('change', () => {
    const v = destSelect.value;
    if (!v) return;
    activateSystem(v);
  });

  factionSelect.addEventListener('change', () => {
    try { applyFilters(); } catch { /* keep flying */ }
  });
  standingSelect.addEventListener('change', () => {
    try { applyFilters(); } catch { /* keep flying */ }
  });
  zoomInBtn.addEventListener('click', () => zoomTowardCenter(MAP_ZOOM_STEP));
  zoomOutBtn.addEventListener('click', () => zoomTowardCenter(1 / MAP_ZOOM_STEP));
  zoomResetBtn.addEventListener('click', () => resetView());

  function targetHidden(el) {
    if (!el || !el.classList) return false;
    return el.classList.contains('is-filter-hidden') || el.classList.contains('is-zoom-hidden');
  }

  function plotIdFromTarget(el) {
    if (!isPlotTarget(el) || targetHidden(el)) return null;
    return sanitizeSystemId(el.getAttribute('data-system-id'));
  }

  function plotFromGesture(sid) {
    if (!sid) return;
    if (plottedIdThisGesture === sid) return;
    plottedIdThisGesture = sid;
    activateSystem(sid);
  }

  function endPan(e) {
    if (!panDrag) return;
    const drag = panDrag;
    panDrag = null;
    try { svg.classList.remove('is-panning'); } catch { /* ignore */ }
    try {
      if (e && typeof svg.releasePointerCapture === 'function' && e.pointerId != null) {
        svg.releasePointerCapture(e.pointerId);
      }
    } catch { /* capture may already be gone */ }
    panMovedThisGesture = drag.moved === true;
    if (!drag.moved && drag.plotId) plotFromGesture(drag.plotId);
  }

  svg.addEventListener('pointerdown', (e) => {
    if (!open || !e || e.button !== 0) return;
    panMovedThisGesture = false;
    plottedIdThisGesture = null;
    const plotId = plotIdFromTarget(e.target);
    panDrag = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: camX,
      origY: camY,
      moved: false,
      plotId,
    };
    try {
      if (typeof svg.setPointerCapture === 'function') svg.setPointerCapture(e.pointerId);
    } catch { /* keep flying */ }
  });

  svg.addEventListener('pointermove', (e) => {
    if (!panDrag || !e || e.pointerId !== panDrag.pointerId) return;
    const dx = e.clientX - panDrag.startX;
    const dy = e.clientY - panDrag.startY;
    if (!panDrag.moved) {
      if (Math.hypot(dx, dy) < MAP_DRAG_PX) return;
      panDrag.moved = true;
      try { svg.classList.add('is-panning'); } catch { /* ignore */ }
    }
    try {
      const { scale } = svgViewScale();
      if (!(scale > 0)) return;
      camX = panDrag.origX - dx / scale;
      camY = panDrag.origY - dy / scale;
      applyView();
    } catch { /* fail closed */ }
  });

  svg.addEventListener('pointerup', (e) => {
    endPan(e);
  });
  svg.addEventListener('pointercancel', (e) => {
    endPan(e);
  });

  svg.addEventListener('click', (e) => {
    if (!open || !e) return;
    if (panMovedThisGesture) return;
    plotFromGesture(plotIdFromTarget(e.target));
  });

  svg.addEventListener('wheel', (e) => {
    if (!open || !e) return;
    const factor = e.deltaY < 0 ? MAP_WHEEL_STEP : 1 / MAP_WHEEL_STEP;
    zoomAt(e.clientX, e.clientY, factor);
  });

  svg.addEventListener('pointerover', (e) => {
    if (panDrag && panDrag.moved) return;
    const t = e && e.target;
    if (!isPlotTarget(t) || targetHidden(t)) return;
    applyHoverId(sanitizeSystemId(t.getAttribute('data-system-id')));
  });

  svg.addEventListener('pointerleave', () => {
    clearHover();
  });

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'KeyM') {
      // Do not intercept the event. While docked the station overlay owns
      // the screen, and while paused the origin pick or pause banner does —
      // only allow closing in those states.
      if (open) {
        let typing = false;
        try { typing = isTypingFocus() === true; } catch { typing = false; }
        if (!typing) {
          try {
            const ae = document.activeElement;
            typing = !!(ae && (
              ae.id === 'rw-galaxy-dest'
              || ae.id === 'rw-galaxy-filter-faction'
              || ae.id === 'rw-galaxy-filter-standing'
            ));
          } catch { /* close as live */ }
        }
        if (!typing) setOpen(false);
      }
      else if (!ctx.flags.docked && !ctx.flags.paused) {
        let blocked = false;
        try { blocked = playSurfaceBlocked(ctx) === true; } catch { blocked = false; }
        if (!blocked) setOpen(true);
      }
    } else if (e.code === 'Escape' && open) {
      setOpen(false);
    }
  });

  window.addEventListener('resize', () => {
    if (open) applyView();
  });

  // ---------- live current-system highlight ----------
  let currentId = null;
  let currentNode = null;

  function update() {
    if (open && ctx.flags.docked) setOpen(false); // station overlay owns the docked screen
    const id = ctx.world.currentSystem;
    if (id !== currentId) {
      if (currentNode) currentNode.classList.remove('is-current');
      currentId = id;
      const rec = nodesById.get(id);
      currentNode = rec ? rec.el : null;
      if (rec) {
        rec.el.classList.add('is-current');
        marker.setAttribute('cx', String(rec.x));
        marker.setAttribute('cy', String(rec.y));
        marker.classList.remove('is-hidden');
      } else {
        marker.classList.add('is-hidden');
      }
    }
    retargetPlot(false);
    syncApButton();
    if (apLiveUntil && ctx.elapsed >= apLiveUntil) showApLive('');
    if (ctx.flags && ctx.flags.chartOpen === true) {
      const evs = ctx.events;
      if (Array.isArray(evs)) {
        for (let i = 0; i < evs.length; i++) {
          const e = evs[i];
          if (!e || e.type !== 'autopilotDisengaged') continue;
          const reason = e.reason;
          if (!reason || reason === 'restore') continue;
          showApLive(apLine(reason));
        }
      }
    }
    if (open) {
      const scale = ctx.settings.textScale;
      if (scale !== appliedScale) {
        appliedScale = scale;
        root.style.setProperty('--rw-text-scale', String(scale));
      }
      try { applyFilters(); paintItinerary(); } catch { /* keep flying */ }
      if (hoverId) {
        const href = nodesById.get(hoverId);
        if (!href || (href.el && href.el.classList.contains('is-filter-hidden'))) clearHover();
        else applyHoverId(hoverId);
      }
    }
  }

  return { update };
}
