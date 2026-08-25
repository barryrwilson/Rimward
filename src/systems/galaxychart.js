import { SYSTEMS, FACTIONS } from '../game/state.js';
import { clearRoute, plotRoute, sanitizeSystemId } from '../game/nav.js';
import { hoverModel } from '../game/chart-hover.js';
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
 * get a dashed ring. Labels are drawn only for the authored seven, hub
 * systems, and the pinned specials. Clue ids/text and landmark discovery
 * state are NEVER read here.
 *
 * Interaction: KeyM toggles (suppressed while docked — the station overlay
 * owns that screen), Escape or the close button closes. The chart does not
 * pause gameplay and does not intercept key or pointer events, so flight
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
  const cls = el.getAttribute('class') || '';
  const parts = cls.split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'rw-galaxy-hit' || parts[i] === 'rw-galaxy-label') return true;
  }
  return false;
}

function destLabel(id) {
  const sid = sanitizeSystemId(id);
  if (!sid || !Object.hasOwn(SYSTEMS, sid)) return '';
  const n = SYSTEMS[sid].name;
  return typeof n === 'string' && n ? n : sid;
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
  }
  destField.appendChild(destLbl);
  destField.appendChild(destSelect);

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
  for (const id of ids) {
    const from = SYSTEMS[id];
    if (!Array.isArray(from.chart)) continue;
    for (const gate of from.gates ?? []) {
      const to = SYSTEMS[gate.to];
      if (!to || !Array.isArray(to.chart)) continue;
      const key = id < gate.to ? `${id}|${gate.to}` : `${gate.to}|${id}`;
      if (seenEdges.has(key)) continue;
      seenEdges.add(key);
      gateLayer.appendChild(svgEl('line', {
        class: 'rw-galaxy-gate',
        x1: from.chart[0], y1: from.chart[1],
        x2: to.chart[0], y2: to.chart[1],
      }));
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
      routeLayer.appendChild(svgEl('line', {
        class: 'rw-galaxy-route',
        x1: from.chart[0], y1: from.chart[1],
        x2: to.chart[0], y2: to.chart[1],
      }));
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

    if (sys.hub) {
      nodeLayer.appendChild(svgEl('circle', {
        class: 'rw-galaxy-hub-ring',
        cx: x, cy: y, r: HUB_RING_R,
      }));
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
    nodesById.set(id, { el: node, x, y, hit });

    if (AUTHORED_IDS.has(id) || PINNED_IDS.has(id) || sys.hub) {
      const lid = sanitizeSystemId(id);
      const labelAttrs = {
        class: 'rw-galaxy-label',
        x, y: y + HUB_RING_R + 16,
        'text-anchor': 'middle',
      };
      if (lid) labelAttrs['data-system-id'] = lid;
      const label = svgEl('text', labelAttrs);
      label.textContent = sys.name ?? id;
      labelLayer.appendChild(label);
    }
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
    if (next) updateHitRadii();
    else {
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
    const rect = svg.getBoundingClientRect();
    const cssW = rect && rect.width;
    const cssH = rect && rect.height;
    const scale = Math.min(
      (typeof cssW === 'number' && cssW > 0 && viewW > 0) ? cssW / viewW : 0,
      (typeof cssH === 'number' && cssH > 0 && viewH > 0) ? cssH / viewH : 0,
    );
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
    if (!force && key === lastPlotKey) return;
    lastPlotKey = key;
    clearChildren(plotLayer);
    for (const rec of nodesById.values()) {
      rec.el.classList.remove('is-dest', 'is-hop', 'is-unreachable');
    }
    const bag = ctx.world && ctx.world.nav;
    if (!bag || typeof bag !== 'object' || Array.isArray(bag)) {
      setStatusText('');
      try { destSelect.value = ''; } catch { /* keep flying */ }
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
      return;
    }

    if (st === 'arrived') {
      if (dest) {
        const drec = nodesById.get(dest);
        if (drec) drec.el.classList.add('is-dest');
      }
      setStatusText(name ? `Arrived · ${name}` : '');
      return;
    }

    setStatusText('');
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

  svg.addEventListener('click', (e) => {
    const t = e && e.target;
    if (!isPlotTarget(t)) return;
    activateSystem(t.getAttribute('data-system-id'));
  });

  svg.addEventListener('pointerover', (e) => {
    const t = e && e.target;
    if (!isPlotTarget(t)) return;
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
            typing = !!(ae && ae.id === 'rw-galaxy-dest');
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
    if (open) updateHitRadii();
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
      if (hoverId) applyHoverId(hoverId);
    }
  }

  return { update };
}
