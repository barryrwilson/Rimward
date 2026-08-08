/**
 * Renders the 100-system SYSTEMS graph (src/game/state.js) as an SVG star chart.
 * Usage: node scripts/galaxy-map.mjs [out.svg]
 * Data-driven: nodes/edges/labels all derived from SYSTEMS + FACTIONS.
 * Layout uses each system's authored chart [x,y]; the render transform is fit
 * to the occupied bounding box (with margin), not the nominal chart box.
 */
import { writeFileSync } from 'node:fs';
import { SYSTEMS, FACTIONS } from '../src/game/state.js';

const hex = (n) => '#' + n.toString(16).padStart(6, '0');
// XML-escape any data string interpolated into SVG text content.
const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]
));

const AUTHORED = new Set(['freehold', 'veridian', 'redmarch', 'hollowreach', 'hush', 'verge']);
const NAMED_SPECIALS = new Set(['stolenwomb', 'lastbeacon', 'blackstation']);
const HUB_ROUTE_COLOR = '#ffd27a'; // Lamplighter amber
const GATE_COLOR = '#4d6f92'; // raised from #3d5a78 for legibility on the dark field
const GATE_WIDTH = 2;
const HALO = 'paint-order="stroke" stroke="#05080e" stroke-width="3" stroke-linejoin="round"';
// Label tints for faction colors too dark to read as small text on the field.
// Node glyphs keep the true faction color; only text uses these.
const LABEL_TINT = { redledger: '#d97a6a', hollow: '#c2b1d6' };

// --- Chart coords → SVG ---
const W = 1600, H = 1120;
// drawing area: below the title block, above the legend block
const AX = 80, AY = 110, AW = W - 2 * AX, AH = H - AY - 150;
const CHART_MARGIN = 90; // chart-unit padding around occupied space

// raw chart coords (fallback + warn for missing), then occupied bounding box
const raw = {};
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const id in SYSTEMS) {
  let c = SYSTEMS[id].chart;
  if (!c) {
    console.warn(`warning: system '${id}' has no chart coords — placed at chart center [1000,700]`);
    c = [1000, 700];
  }
  raw[id] = c;
  if (c[0] < minX) minX = c[0];
  if (c[0] > maxX) maxX = c[0];
  if (c[1] < minY) minY = c[1];
  if (c[1] > maxY) maxY = c[1];
}
minX -= CHART_MARGIN; minY -= CHART_MARGIN;
maxX += CHART_MARGIN; maxY += CHART_MARGIN;
const bw = maxX - minX, bh = maxY - minY;
const scale = Math.min(AW / bw, AH / bh);
const offX = AX + (AW - bw * scale) / 2;
const offY = AY + (AH - bh * scale) / 2;

const pos = {};
for (const id in raw) {
  pos[id] = { x: offX + (raw[id][0] - minX) * scale, y: offY + (raw[id][1] - minY) * scale };
}

// --- Physical gate edges (deduped; gates are symmetric by contract) ---
const gateEdges = [];
const seenGates = new Set();
for (const id in SYSTEMS) {
  for (const g of SYSTEMS[id].gates ?? []) {
    if (!SYSTEMS[g.to]) { console.warn(`warning: gate ${id} -> ${g.to} targets unknown system`); continue; }
    const key = [id, g.to].sort().join('|');
    if (!seenGates.has(key)) { seenGates.add(key); gateEdges.push([id, g.to]); }
  }
}

// --- Hub route edges (dashed amber; hub -> each routed system) ---
const routeEdges = [];
const seenRoutes = new Set();
for (const id in SYSTEMS) {
  const hub = SYSTEMS[id].hub;
  if (!hub) continue;
  for (const to of hub.routes ?? []) {
    if (!SYSTEMS[to]) { console.warn(`warning: hub route ${id} -> ${to} targets unknown system`); continue; }
    const key = [id, to].sort().join('|');
    if (!seenRoutes.has(key)) { seenRoutes.add(key); routeEdges.push([id, to]); }
  }
}

// --- SVG ---
const sysCount = Object.keys(SYSTEMS).length;
const p = [];
p.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="rwMapTitle rwMapDesc" font-family="'Segoe UI', system-ui, sans-serif">`);
p.push(`<title id="rwMapTitle">The Rim — gate network of the Ten Banners</title>`);
p.push(`<desc id="rwMapDesc">Star chart of ${sysCount} systems, ${gateEdges.length} physical gate links and ${routeEdges.length} hub routes across five bands. Node color marks the holding faction; node opacity fades from band 0 to band 4. Solid lines are physical gates; dashed amber lines are one-way hub routes.</desc>`);
p.push(`<rect width="${W}" height="${H}" fill="#05080e"/>`);

// starfield backdrop (deterministic LCG so output is stable). Opacity capped
// below the dimmest node band so backdrop stars never outshine band-4 nodes.
let seed = 1337;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
for (let i = 0; i < 420; i++) {
  const x = (rnd() * W).toFixed(1), y = (rnd() * H).toFixed(1);
  const r = (0.4 + rnd() * 1.1).toFixed(2), o = (0.10 + rnd() * 0.32).toFixed(2);
  p.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#aebdd4" opacity="${o}"/>`);
}

// title
p.push(`<text x="${AX}" y="56" fill="#d7e3f4" font-size="26" letter-spacing="6">THE RIM — GATE NETWORK OF THE TEN BANNERS</text>`);
p.push(`<text x="${AX}" y="82" fill="#6b7d94" font-size="12" letter-spacing="2.5">${sysCount} SYSTEMS · ${gateEdges.length} PHYSICAL GATES · ${routeEdges.length} HUB ROUTES · NODE OPACITY FADES FROM BAND 0 (COREWARD) TO BAND 4 (RIMWARD)</text>`);

// edges first, under the nodes
for (const [a, b] of gateEdges) {
  const A = pos[a], B = pos[b];
  p.push(`<line x1="${A.x.toFixed(1)}" y1="${A.y.toFixed(1)}" x2="${B.x.toFixed(1)}" y2="${B.y.toFixed(1)}" stroke="${GATE_COLOR}" stroke-width="${GATE_WIDTH}" opacity="0.85"/>`);
}
for (const [a, b] of routeEdges) {
  const A = pos[a], B = pos[b];
  p.push(`<line x1="${A.x.toFixed(1)}" y1="${A.y.toFixed(1)}" x2="${B.x.toFixed(1)}" y2="${B.y.toFixed(1)}" stroke="${HUB_ROUTE_COLOR}" stroke-width="1.4" stroke-dasharray="6 4" opacity="0.85"/>`);
}

// nodes — opacity falls off with band (coreward bright, rimward dim), floored
// at 0.6 so band-4 nodes stay legible over the backdrop
const bandOpacity = (band) => Math.max(0.6, 1 - (band ?? 0) * 0.1).toFixed(2);
const ids = Object.keys(SYSTEMS).sort((a, b) => (SYSTEMS[a].hub ? 1 : 0) - (SYSTEMS[b].hub ? 1 : 0)); // hubs drawn last, on top
for (const id of ids) {
  const def = SYSTEMS[id];
  const f = FACTIONS[def.faction];
  const col = hex(f?.color ?? 0x9aa7b8);
  const P = pos[id];
  const op = bandOpacity(def.band);
  if (def.hub) {
    p.push(`<circle cx="${P.x.toFixed(1)}" cy="${P.y.toFixed(1)}" r="12" fill="${col}" opacity="${(op * 0.25).toFixed(2)}"/>`);
    p.push(`<circle cx="${P.x.toFixed(1)}" cy="${P.y.toFixed(1)}" r="7" fill="${col}" opacity="${op}"/>`);
    p.push(`<circle cx="${P.x.toFixed(1)}" cy="${P.y.toFixed(1)}" r="10" fill="none" stroke="${col}" stroke-width="1.2" opacity="${op}"/>`);
  } else {
    p.push(`<circle cx="${P.x.toFixed(1)}" cy="${P.y.toFixed(1)}" r="3" fill="${col}" opacity="${op}"/>`);
  }
}

// labels: hubs, named specials, and the authored six only. Text carries a dark
// halo (paint-order stroke) so it reads over edges and backdrop; hub labels
// are offset clear of the hub glyph ring (r=12 glow + r=10 ring).
for (const id of ids) {
  const def = SYSTEMS[id];
  if (!def.hub && !NAMED_SPECIALS.has(id) && !AUTHORED.has(id)) continue;
  const col = LABEL_TINT[def.faction] ?? hex(FACTIONS[def.faction]?.color ?? 0x9aa7b8);
  const P = pos[id];
  const dx = def.hub ? 16 : 9;
  const dy = def.hub ? -10 : -7;
  p.push(`<text x="${(P.x + dx).toFixed(1)}" y="${(P.y + dy).toFixed(1)}" fill="${col}" font-size="10" letter-spacing="1" ${HALO}>${esc(def.name.toUpperCase())}</text>`);
}

// legend: factions that actually hold systems (data-driven — a faction with
// zero systems drops out automatically), plus edge key
const heldFactions = new Set(Object.values(SYSTEMS).map((s) => s.faction));
const legendKeys = Object.keys(FACTIONS).filter((k) => heldFactions.has(k));
const colW = 240, rowH = 18, cols = 2;
const legendTop = H - 130;
p.push(`<text x="${AX}" y="${legendTop - 12}" fill="#6b7d94" font-size="10" letter-spacing="3">FACTIONS</text>`);
legendKeys.forEach((fk, i) => {
  const cx = AX + (i % cols) * colW;
  const cy = legendTop + Math.floor(i / cols) * rowH + 6;
  p.push(`<circle cx="${cx + 5}" cy="${cy}" r="4" fill="${hex(FACTIONS[fk].color)}"/>`);
  p.push(`<text x="${cx + 16}" y="${cy + 4}" fill="#9aa7b8" font-size="11" letter-spacing="0.5">${esc(FACTIONS[fk].name)}</text>`);
});
const keyX = AX + cols * colW + 40;
p.push(`<line x1="${keyX}" y1="${legendTop + 4}" x2="${keyX + 28}" y2="${legendTop + 4}" stroke="${GATE_COLOR}" stroke-width="${GATE_WIDTH}"/>`);
p.push(`<text x="${keyX + 36}" y="${legendTop + 8}" fill="#9aa7b8" font-size="11">Physical gate</text>`);
p.push(`<line x1="${keyX}" y1="${legendTop + 24}" x2="${keyX + 28}" y2="${legendTop + 24}" stroke="${HUB_ROUTE_COLOR}" stroke-width="1.4" stroke-dasharray="6 4"/>`);
p.push(`<text x="${keyX + 36}" y="${legendTop + 28}" fill="#9aa7b8" font-size="11">Hub route</text>`);
p.push(`<circle cx="${keyX + 14}" cy="${legendTop + 44}" r="7" fill="none" stroke="#9aa7b8" stroke-width="1.2"/>`);
p.push(`<circle cx="${keyX + 14}" cy="${legendTop + 44}" r="3.5" fill="#9aa7b8"/>`);
p.push(`<text x="${keyX + 36}" y="${legendTop + 48}" fill="#9aa7b8" font-size="11">Hub system · node opacity fades with band</text>`);

p.push('</svg>');
const out = process.argv[2] ?? 'galaxy-map.svg';
writeFileSync(out, p.join('\n'));
console.log(`wrote ${out} — ${sysCount} systems, ${gateEdges.length} gate links, ${routeEdges.length} hub routes`);
