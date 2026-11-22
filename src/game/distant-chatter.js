/**
 * Distant-traffic comms — issue #341, system scale/population Phase 4.
 *
 * The larger population only reads as inhabited if the far lanes SPEAK. This
 * module voices short, rate-limited comm lines from MID/FAR abstract traffic
 * (records beyond the 900 u instantiation bubble, never a live hull) on the
 * existing comms/toast channel: ctx.emit('commLine', { text, from }). There is
 * no new HUD surface, no new key, no new mesh and no persistent field.
 *
 * Cadence is band-scaled through the authored BANDS[].chatterMult pacing table
 * (core 1.0, rim 0.05): the Hush and the Verge stay near-silent by design. A
 * line never repeats inside the ctx comm debounce and the module emits at most
 * one line per gap, so the five-toast cap and its dedupe window cannot flood.
 *
 * Determinism: every pick (speaker, gate reference, template, gap) comes from
 * an FNV/xorshift hash of the system id and a session line counter. The module
 * consumes ZERO global Math.random draws, so the boot harness's seeded stream
 * and its content fixtures stay byte-identical (same discipline as the #339
 * crowd records). The session counter and timer live in this closure only:
 * nothing is written to a record, ctx.world, ctx.flags or the save.
 *
 * Suppression: the lanes are quiet while the player is docked, in a berth
 * overlay, talking on a hail card, reading the chart, or mid-jump. The timer
 * retries shortly after the overlay closes instead of banking a burst.
 */
import { BANDS } from './state.js';
import { NEAR_RANGE } from './traffic-tiers.js';

/** Base seconds between ambient lines in the core (chatterMult 1.0). */
export const CHATTER_GAP = Object.freeze([26, 44]);
/** Base first-line delay after a fresh system load, before band scaling. */
export const CHATTER_FIRST_DELAY = Object.freeze([10, 20]);
/** Absolute floor: even a busy core lane never speaks more than this often. */
export const CHATTER_MIN_GAP = 12;

const TEMPLATES = Object.freeze({
  trader: Object.freeze([
    'Long run in from {neighbor}. {station} berth is stacked.',
    'Inbound to {station}; {neighbor} traffic behind us.',
    '{station} approach is slow tonight. Hold your lane.',
    'Outbound for {neighbor} once {station} clears us.',
    'Hauling staples through {station}. Lane reads quiet.',
    'Freighter heavy on the {station} lane. Give us room.',
  ]),
  pirate: Object.freeze([
    'Holding the lane off {station}. Cargo walks itself in.',
    'Gate run to {neighbor}. Plenty of hulls to tax.',
    '{station} approach is ours tonight. Mind the toll.',
    'Quiet lane out of {neighbor}. For now.',
    'Cutter on the {station} lane. Keep your holds full.',
  ]),
  patrol: Object.freeze([
    '{station} control, lane clear to {neighbor}.',
    'Patrol on the {station} approach. Give us room.',
    'Gate traffic nominal. {station} berth queue is long.',
    '{station} control, {neighbor} run is quiet.',
  ]),
  miner: Object.freeze([
    "Rock's thin. Heading in to {station} with a light hold.",
    "Field's picked over. Back to {station} for a new head.",
    'Ore run to {station}; {neighbor} side is picked clean.',
  ]),
  ace: Object.freeze([
    'The dark out of {neighbor} is mine tonight.',
    '{station} lane. Anyone with cargo is welcome to try.',
  ]),
  other: Object.freeze([
    '{station} lane is busy. Keep clear.',
    'Passing {neighbor} outbound. Long haul.',
    '{station} approach, {system} traffic in the queue.',
  ]),
});

/** FNV-1a — stable string hash (no Math.random: cadence stays deterministic). */
function hashString(text) {
  const s = typeof text === 'string' ? text : String(text ?? '');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Per-system seed: the same system always speaks the same way. */
function seedForSystem(systemId) {
  return hashString('distant-chatter:' + (systemId ?? ''));
}

/** Deterministic 0..1 draw from a seed + salt (xorshift-style avalanche). */
function unit(seed, salt) {
  let x = (seed ^ hashString(salt)) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 2246822507) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 3266489909) >>> 0;
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

function bandMultFor(ctx, systemId) {
  const band = ctx?.systems?.[systemId]?.band;
  const mult = BANDS[Number.isFinite(band) ? band : 0]?.chatterMult;
  return Number.isFinite(mult) && mult > 0 ? mult : 1;
}

/**
 * Seconds until the next ambient line, band-scaled. Exported so the focused
 * regression can pin the cadence without running a clock.
 */
export function chatterGapForBand(band, roll = 0.5) {
  const mult = BANDS[Number.isFinite(band) ? band : 0]?.chatterMult;
  const m = Number.isFinite(mult) && mult > 0 ? mult : 1;
  const r = Number.isFinite(roll) ? Math.min(0.999999, Math.max(0, roll)) : 0.5;
  const base = CHATTER_GAP[0] + r * (CHATTER_GAP[1] - CHATTER_GAP[0]);
  return Math.max(CHATTER_MIN_GAP, base / m);
}

/** First-line delay after a fresh system load, band-scaled. */
export function chatterFirstDelayForBand(band, roll = 0.5) {
  const mult = BANDS[Number.isFinite(band) ? band : 0]?.chatterMult;
  const m = Number.isFinite(mult) && mult > 0 ? mult : 1;
  const r = Number.isFinite(roll) ? Math.min(0.999999, Math.max(0, roll)) : 0.5;
  const base = CHATTER_FIRST_DELAY[0] + r * (CHATTER_FIRST_DELAY[1] - CHATTER_FIRST_DELAY[0]);
  return Math.max(4, base / m);
}

/** True when a HUD overlay or the jump owns the screen: do not add noise. */
export function chatterSuppressed(ctx) {
  const flags = ctx?.flags ?? {};
  return flags.docked === true
    || flags.berthHold === true
    || flags.hailOpen === true
    || flags.chartOpen === true
    || ctx?.gate?.jumping === true;
}

function stationNameFor(ctx, systemId) {
  const def = ctx?.systems?.[systemId];
  const name = def?.station?.name;
  return typeof name === 'string' && name ? name : (def?.name ?? 'the station');
}

function systemNameFor(ctx, systemId) {
  const def = ctx?.systems?.[systemId];
  const name = def?.name;
  return typeof name === 'string' && name ? name : (systemId ?? 'the outer lane');
}

/**
 * Pick a distant place reference for the line: a real gate's destination
 * system (the lane beyond the player's bubble), plus the current station.
 * Returns null when the system has no usable gate (generated/authored data
 * always has at least one; the fallback keeps the line honest).
 */
function placeFor(ctx, systemId, roll) {
  const def = ctx?.systems?.[systemId];
  const gates = Array.isArray(def?.gates) ? def.gates : [];
  if (gates.length === 0) return { station: stationNameFor(ctx, systemId), neighbor: systemNameFor(ctx, systemId), system: systemNameFor(ctx, systemId), landmark: null };
  const idx = Math.min(gates.length - 1, Math.floor(roll * gates.length));
  const destId = gates[idx]?.to;
  return {
    station: stationNameFor(ctx, systemId),
    neighbor: systemNameFor(ctx, destId),
    system: systemNameFor(ctx, systemId),
    landmark: typeof def?.landmarks?.[0]?.name === 'string' ? def.landmarks[0].name : null,
  };
}

function fillTemplate(template, place) {
  return template
    .replaceAll('{station}', place.station)
    .replaceAll('{neighbor}', place.neighbor)
    .replaceAll('{system}', place.system)
    .replaceAll('{landmark}', place.landmark ?? place.station);
}

/**
 * Pick a speaker among non-live enroute records beyond the instantiation
 * bubble. Docked/near records are already visible; distant traffic is the
 * voice this module owns. Returns null when the lanes are empty.
 */
function pickSpeaker(ctx, positionOf, playerPos, roll) {
  const records = ctx?.world?.records;
  if (!Array.isArray(records) || records.length === 0) return null;
  if (!playerPos || !Number.isFinite(playerPos.x)) return null;
  const candidates = [];
  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    if (!rec || typeof rec !== 'object') continue;
    if (rec.live === true) continue;
    if (rec.state !== 'enroute') continue;
    const pos = positionOf(rec);
    if (!pos || !Number.isFinite(pos.x)) continue;
    const dx = pos.x - playerPos.x;
    const dy = pos.y - playerPos.y;
    const dz = pos.z - playerPos.z;
    const distance = Math.hypot(dx, dy, dz);
    if (!(distance > NEAR_RANGE)) continue;
    candidates.push(rec);
  }
  if (candidates.length === 0) return null;
  const idx = Math.min(candidates.length - 1, Math.floor(roll * candidates.length));
  return candidates[idx];
}

function templatesFor(rec) {
  const role = rec?.role;
  return TEMPLATES[role] ?? TEMPLATES.other;
}

/**
 * Issue #341 distant-traffic comms. Presentation-only: reads the current
 * record bank, the player position and the authored system data; writes only
 * its own session timer/counter and emits commLine events.
 *
 * Contract:
 *   initDistantChatter(ctx) -> { update(dt, positionOf) }
 *   - positionOf(record) must return a THREE-free {x,y,z} pose (world.js
 *     passes recordPosition).
 *   - one line per band-scaled gap, never more often than CHATTER_MIN_GAP.
 *   - speaker is a non-live enroute record beyond NEAR_RANGE; from = its name.
 *   - text names the current station and a gate destination system (a place
 *     beyond the player's bubble).
 *   - suppressed while docked/berth/hail/chart/jump; the timer retries.
 *   - a real system change resets the timer/counter and reseeds.
 */
export function initDistantChatter(ctx) {
  let builtSystem = ctx?.world?.currentSystem ?? null;
  let seed = seedForSystem(builtSystem);
  let nextAt = Number.isFinite(ctx?.world?.time) ? ctx.world.time : 0;
  let count = 0;
  let lastTime = nextAt;
  nextAt += chatterFirstDelayForBand(ctx?.systems?.[builtSystem]?.band ?? 0, unit(seed, 'first'));

  function resetFor(systemId, now) {
    builtSystem = systemId ?? null;
    seed = seedForSystem(builtSystem);
    count = 0;
    nextAt = now + chatterFirstDelayForBand(ctx?.systems?.[builtSystem]?.band ?? 0, unit(seed, 'first'));
  }

  return {
    update(dt, positionOf) {
      if (typeof positionOf !== 'function') return;
      const world = ctx?.world;
      const now = Number.isFinite(world?.time) ? world.time : 0;
      // A save rewind (death restore) moves world.time backwards; reset so a
      // stale future timer cannot silence the lanes for the rest of the run.
      if (now < lastTime - 1) resetFor(world?.currentSystem ?? null, now);
      lastTime = now;
      const systemId = world?.currentSystem ?? null;
      if (systemId !== builtSystem) resetFor(systemId, now);
      if (now < nextAt) return;
      if (chatterSuppressed(ctx)) {
        nextAt = now + 4; // retry shortly; do not bank a burst while docked
        return;
      }
      const playerPos = ctx?.ship?.object?.position ?? ctx?.camera?.position ?? null;
      const speaker = pickSpeaker(ctx, positionOf, playerPos, unit(seed, 'speaker:' + count));
      const band = ctx?.systems?.[systemId]?.band ?? 0;
      if (!speaker) {
        nextAt = now + chatterGapForBand(band, unit(seed, 'empty:' + count));
        return;
      }
      const place = placeFor(ctx, systemId, unit(seed, 'place:' + count));
      const templates = templatesFor(speaker);
      const template = templates[Math.min(templates.length - 1, Math.floor(unit(seed, 'line:' + count + ':' + speaker.id) * templates.length))];
      const line = fillTemplate(template, place);
      const name = typeof speaker.name === 'string' && speaker.name ? speaker.name : 'unknown hull';
      ctx.emit('commLine', { text: name + ': ' + line, from: name });
      count += 1;
      nextAt = now + chatterGapForBand(band, unit(seed, 'gap:' + count));
    },
  };
}
