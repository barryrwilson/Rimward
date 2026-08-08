import { SYSTEMS, FACTIONS } from '../game/state.js';
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
 * get a dashed ring. Labels are drawn only for the authored six, hub
 * systems, and the pinned specials. Clue ids/text and landmark discovery
 * state are NEVER read here.
 *
 * Interaction: KeyM toggles (suppressed while docked — the station overlay
 * owns that screen), Escape or the close button closes. The chart does not
 * pause gameplay and never calls preventDefault/stopPropagation, so flight
 * keys keep working; the close control is a real <button> in tab order.
 *
 * Per-frame cost: update() only diffs ctx.world.currentSystem against a
 * cached id — on change it moves .is-current between node elements and
 * repositions one pre-created marker ring. No SVG rebuild, no allocation
 * on the hot path. save.js swaps world records wholesale; currentSystem is
 * re-read from ctx.world every frame, so restores are picked up live.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const MARGIN = 80; // chart units of breathing room around the data bbox
const NODE_R = 8;
const HUB_RING_R = 15;
const MARKER_R = 22;

// Authored six (state.js AUTHORED_SYSTEMS is not exported; ids are stable
// and boot tests pin them). Pinned specials are wave-19 landmarks of the
// generated rim that the design doc calls out by name.
const AUTHORED_IDS = new Set(['freehold', 'veridian', 'redmarch', 'hollowreach', 'hush', 'verge']);
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

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'rw-galaxy-close';
  closeBtn.setAttribute('aria-label', 'Close galaxy chart');
  closeBtn.textContent = '×';

  header.appendChild(title);
  header.appendChild(closeBtn);

  const desc = document.createElement('p');
  desc.className = 'rw-galaxy-chart-desc';
  desc.id = 'rw-galaxy-chart-desc';
  desc.textContent = 'Names, factions, and gate routes of the known rim. Solid lines are two-way gates; dashed gold lines are one-way Lamplighter hub routes. M or Escape closes.';

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
  legend.appendChild(legendGate);
  legend.appendChild(legendRoute);
  legend.appendChild(legendHub);

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

  // Nodes (+ hub rings + labels). nodesById feeds the live current-system
  // highlight in update().
  const nodeLayer = svgEl('g', { class: 'rw-galaxy-nodes' });
  const labelLayer = svgEl('g', { class: 'rw-galaxy-labels' });
  const nodesById = new Map(); // id → { el, x, y }
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
    nodesById.set(id, { el: node, x, y });

    if (sys.hub) {
      nodeLayer.appendChild(svgEl('circle', {
        class: 'rw-galaxy-hub-ring',
        cx: x, cy: y, r: HUB_RING_R,
      }));
    }

    if (AUTHORED_IDS.has(id) || PINNED_IDS.has(id) || sys.hub) {
      const label = svgEl('text', {
        class: 'rw-galaxy-label',
        x, y: y + HUB_RING_R + 16,
        'text-anchor': 'middle',
      });
      label.textContent = sys.name ?? id;
      labelLayer.appendChild(label);
    }
  }
  svg.appendChild(nodeLayer);
  svg.appendChild(labelLayer);

  // Single reused current-system marker (dashed accent ring + center dot,
  // so "current" never relies on fill color alone, §18.4/§20).
  const marker = svgEl('circle', {
    class: 'rw-galaxy-current-marker is-hidden',
    cx: 0, cy: 0, r: MARKER_R,
  });
  svg.appendChild(marker);

  panel.appendChild(header);
  panel.appendChild(desc);
  panel.appendChild(svg);
  panel.appendChild(legend);
  root.appendChild(panel);
  document.body.appendChild(root);

  // ---------- open/close ----------
  let open = false;
  let appliedScale = 0; // forces first apply on open
  function setOpen(next) {
    open = next;
    root.classList.toggle('is-hidden', !next);
    root.setAttribute('aria-hidden', String(!next));
  }

  closeBtn.addEventListener('click', () => setOpen(false));

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'KeyM') {
      // Never intercept: no preventDefault/stopPropagation. While docked
      // the station overlay owns the screen, and while paused the origin
      // pick or pause banner does — only allow closing in those states.
      if (open) setOpen(false);
      else if (!ctx.flags.docked && !ctx.flags.paused) setOpen(true);
    } else if (e.code === 'Escape' && open) {
      setOpen(false);
    }
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
    if (open) {
      const scale = ctx.settings.textScale;
      if (scale !== appliedScale) {
        appliedScale = scale;
        root.style.setProperty('--rw-text-scale', String(scale));
      }
    }
  }

  return { update };
}
