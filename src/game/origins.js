import {
  ORIGINS, COMMODITIES, SYSTEMS, JUMP, FACTIONS, rankFor,
  SHIP_CLASSES, MINING_LASERS,
} from './state.js';
import { disengage } from './autopilot.js';
import { disengageAutomine } from './automine.js';

/**
 * Origin selection (§25: origins create situations without imposing stories).
 *
 * On a FRESH boot (no save restored, no origin already chosen) a full-screen
 * overlay opens immediately at init and pauses the game. The player picks one
 * of the five ORIGINS by Digit1-5 or click; its effects are applied to the
 * live ctx, ctx.world.origin records the id (persisted via save.js
 * WORLD_FIELDS), and 'originChosen' {id, line} is emitted for the HUD toast.
 *
 * A restored save or an already-chosen origin means this module is inert:
 * no overlay, update() is a no-op.
 *
 * The drifter's startSystem mirrors save.js's restore path exactly: rebind
 * ctx.world.prices to the target system's market table (built from
 * COMMODITIES.base × SYSTEMS[sys].priceBase, same baseline as market.js
 * buildTable), park the ship off that system's station, then emit
 * 'systemLoaded' so world/station/solarsystem/asteroids rebuild.
 *
 * The keydown listener REMOVES itself on choice — later Digit presses
 * (weapon groups, station services) are untouched. Plain window keydown +
 * e.code, so a synthetic dispatchKey works exactly like a real keypress.
 * No per-frame work; everything happens at init and on the choice event.
 *
 * Wave 142 PR1: each origin row also paints derived hull / money / standings /
 * danger / experience sublines before that one-press confirm. Numbers come
 * from ORIGINS.effects + live defaults. No state.js preview table.
 */

/** Authored Digit1–5 map. Skip does not reindex remaining Digit labels. */
const ORIGIN_DIGIT_IDS = ['greenhand', 'ledgerDebt', 'marked', 'beautiful', 'drifter'];

const RESERVED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
/** Live ctx.js default credits. Do not invent UU. */
const DEFAULT_CREDITS = 350;
const DEFAULT_START_SYSTEM = 'freehold';
const DOT = ' · ';

function isReservedKey(id) {
  return typeof id !== 'string' || !id || RESERVED_KEYS.has(id);
}

function isValidOriginRecord(rec) {
  return !!rec && typeof rec === 'object'
    && typeof rec.name === 'string'
    && typeof rec.line === 'string'
    && rec.effects !== null && typeof rec.effects === 'object';
}

function isChoosableOrigin(id) {
  if (typeof id !== 'string' || isReservedKey(id)) return false;
  if (!Object.hasOwn(ORIGINS, id)) return false;
  return isValidOriginRecord(ORIGINS[id]);
}

/** Baseline price table for a system — replicates market.js buildTable. */
function buildBaselineTable(sys) {
  const table = {};
  const priceBase = SYSTEMS[sys].priceBase || {};
  for (const key of Object.keys(COMMODITIES)) {
    if (!Object.hasOwn(COMMODITIES, key)) continue;
    table[key] = Math.round(COMMODITIES[key].base * (priceBase[key] ?? 1));
  }
  return table;
}

/** Move the ship just off the target system's station, facing system center. */
function parkShip(ctx, sys) {
  try {
    if (!Object.hasOwn(SYSTEMS, sys)) return;
    const p = SYSTEMS[sys] && SYSTEMS[sys].station && SYSTEMS[sys].station.position;
    if (!p) return;
    const obj = ctx.ship.object;
    if (!obj) return;
    obj.position.set(p[0] + 40, p[1] + 10, p[2] + 60);
    obj.lookAt(0, 0, 0);
    ctx.ship.velocity.set(0, 0, 0);
    ctx.ship.speed = 0;
  } catch {
    /* fail closed */
  }
}

/**
 * Apply origin effects. Missing ORIGINS[id] → false (do not throw).
 * Vocabulary unchanged: setCredits / addCredits / setFear / reputation /
 * setBond / setHunger / addCargo / cluesFound / startSystem.
 */
function applyEffects(ctx, id) {
  try {
    if (!isChoosableOrigin(id)) return false;
    const fx = ORIGINS[id].effects;
    if (typeof fx.setCredits === 'number') ctx.world.credits = fx.setCredits;
    if (typeof fx.addCredits === 'number') ctx.world.credits += fx.addCredits;
    if (typeof fx.setFear === 'number') ctx.world.fear = fx.setFear;
    if (fx.reputation && typeof fx.reputation === 'object') {
      const rep = ctx.world.reputation;
      for (const faction of Object.keys(fx.reputation)) {
        if (!Object.hasOwn(fx.reputation, faction) || isReservedKey(faction)) continue;
        const delta = fx.reputation[faction];
        if (typeof delta !== 'number' || !Number.isFinite(delta)) continue;
        rep[faction] = (rep[faction] ?? 0) + delta;
      }
    }
    if (typeof fx.setBond === 'number') ctx.bio.bond = fx.setBond;
    if (typeof fx.setHunger === 'number') ctx.bio.hunger = fx.setHunger;
    if (Array.isArray(fx.addCargo)) {
      for (const c of fx.addCargo) {
        if (!c || typeof c !== 'object') continue;
        if (typeof c.commodity !== 'string') continue;
        ctx.cargo.push({ commodity: c.commodity, units: c.units });
      }
    }
    if (Array.isArray(fx.cluesFound)) {
      const mystery = (ctx.world.mystery ??= { found: [], visited: [] });
      for (const clueId of fx.cluesFound) {
        if (typeof clueId !== 'string' || !clueId) continue;
        if (!mystery.found.includes(clueId)) mystery.found.push(clueId);
      }
    }
    if (typeof fx.startSystem === 'string' && Object.hasOwn(SYSTEMS, fx.startSystem)) {
      const sys = fx.startSystem;
      ctx.world.currentSystem = sys;
      // Mirror save.js rebindPrices: build the baseline table if missing,
      // then rebind the live prices reference to this system's table.
      const markets = (ctx.world.markets ??= {});
      if (!markets[sys]) markets[sys] = buildBaselineTable(sys);
      ctx.world.prices = markets[sys];
      parkShip(ctx, sys);
      ctx.emit('systemLoaded', { to: sys });
    }
    return true;
  } catch {
    return false;
  }
}

function closedOriginsApi() {
  return {
    isOpen() { return false; },
    choose() { return 'no-service'; },
  };
}

function previewCredits(fx) {
  let n = DEFAULT_CREDITS;
  if (typeof fx.setCredits === 'number') n = fx.setCredits;
  if (typeof fx.addCredits === 'number') n += fx.addCredits;
  return n;
}

function signedAmount(n) {
  if (n > 0) return `+${n}`;
  if (n < 0) return `\u2212${Math.abs(n)}`;
  return String(n);
}

function hullPreviewLine() {
  const light = SHIP_CLASSES.light;
  const hull = light && typeof light.hull === 'number' ? light.hull : 100;
  const hold = light && typeof light.cargo === 'number' ? light.cargo : 20;
  let mk = 'Mk I';
  const laser = Array.isArray(MINING_LASERS) ? MINING_LASERS[0] : null;
  if (laser && typeof laser.name === 'string') {
    const m = laser.name.match(/Mk\s*[IVXLCDM]+/i);
    if (m) mk = m[0];
  }
  return `Hull light ${hull}${DOT}${mk}${DOT}hold ${hold}`;
}

function moneyPreviewLine(credits) {
  if (credits < 0) return `Money \u2212${Math.abs(credits)} UU (debt)`;
  return `Money ${credits} UU`;
}

function factionPaintName(k) {
  if (!Object.hasOwn(FACTIONS, k)) return k;
  const name = FACTIONS[k] && FACTIONS[k].name;
  if (typeof name !== 'string' || !name) return k;
  if (name.endsWith(' Compact')) return name.slice(0, -' Compact'.length);
  return name;
}

function standingsPreviewLine(fx) {
  const blob = fx.reputation;
  if (!blob || typeof blob !== 'object') return 'Standings even';
  const parts = [];
  for (const k of Object.keys(blob)) {
    if (!Object.hasOwn(blob, k) || isReservedKey(k)) continue;
    const delta = blob[k];
    if (typeof delta !== 'number' || !Number.isFinite(delta) || delta === 0) continue;
    let rankName = '';
    try {
      const rung = rankFor(delta);
      rankName = rung && typeof rung.name === 'string' ? rung.name : '';
    } catch {
      rankName = '';
    }
    const rankBit = rankName ? ` (${rankName})` : '';
    parts.push(`${factionPaintName(k)} ${signedAmount(delta)}${rankBit}`);
  }
  if (!parts.length) return 'Standings even';
  return parts.join(DOT);
}

function systemPaintName(sysId) {
  if (typeof sysId !== 'string' || !Object.hasOwn(SYSTEMS, sysId)) return '';
  const rec = SYSTEMS[sysId];
  if (rec && typeof rec.name === 'string' && rec.name) return rec.name;
  return sysId;
}

function findClueLine(clueId) {
  if (typeof clueId !== 'string' || !clueId) return '';
  try {
    for (const sysId of Object.keys(SYSTEMS)) {
      if (!Object.hasOwn(SYSTEMS, sysId) || isReservedKey(sysId)) continue;
      const clues = SYSTEMS[sysId] && SYSTEMS[sysId].clues;
      if (!Array.isArray(clues)) continue;
      for (const c of clues) {
        if (!c || typeof c !== 'object') continue;
        if (c.id !== clueId) continue;
        if (typeof c.line === 'string' && c.line) return c.line;
      }
    }
  } catch {
    return '';
  }
  return '';
}

function clueCueFromLine(line) {
  if (typeof line !== 'string' || !line) return '';
  const tally = line.match(/tally-board/i);
  if (tally) return `clue ${tally[0].toLowerCase()}`;
  const trimmed = line.replace(/^(a|an|the)\s+/i, '');
  const phrase = trimmed.split(/[,.]/)[0].trim();
  if (phrase) return `clue ${phrase.length > 40 ? phrase.slice(0, 40) : phrase}`;
  return '';
}

function cargoDangerSuffix(fx) {
  if (!Object.hasOwn(fx, 'addCargo') || !Array.isArray(fx.addCargo)) return '';
  const bits = [];
  for (const c of fx.addCargo) {
    if (!c || typeof c !== 'object') continue;
    const cid = c.commodity;
    if (typeof cid !== 'string' || !Object.hasOwn(COMMODITIES, cid)) continue;
    const rec = COMMODITIES[cid];
    const name = rec && typeof rec.name === 'string' ? rec.name : '';
    if (!name) continue;
    const units = typeof c.units === 'number' ? c.units : 0;
    bits.push(`${name} \u00d7${units}`);
  }
  if (!bits.length) return '';
  return ` + cargo ${bits.join(DOT)}`;
}

function dangerPreviewLine(fx, credits) {
  const parts = [];
  let sysId = DEFAULT_START_SYSTEM;
  if (typeof fx.startSystem === 'string' && Object.hasOwn(SYSTEMS, fx.startSystem)) {
    sysId = fx.startSystem;
  }
  const sysName = systemPaintName(sysId) || sysId;
  parts.push(`Start ${sysName}`);
  if (Object.hasOwn(fx, 'setFear') && typeof fx.setFear === 'number') {
    parts.push(`fear ${fx.setFear}`);
  }
  if (credits < 0) parts.push('in debt');
  if (Object.hasOwn(fx, 'setBond') && typeof fx.setBond === 'number') {
    parts.push(`bond ${fx.setBond}`);
  }
  if (Object.hasOwn(fx, 'setHunger') && typeof fx.setHunger === 'number') {
    parts.push(`hunger ${fx.setHunger}`);
  }
  if (Array.isArray(fx.cluesFound)) {
    for (const clueId of fx.cluesFound) {
      if (typeof clueId !== 'string') continue;
      const cue = clueCueFromLine(findClueLine(clueId));
      if (cue) parts.push(cue);
    }
  }
  return parts.join(DOT) + cargoDangerSuffix(fx);
}

function hasNegativeStanding(fx) {
  const blob = fx.reputation;
  if (!blob || typeof blob !== 'object') return false;
  for (const k of Object.keys(blob)) {
    if (!Object.hasOwn(blob, k) || isReservedKey(k)) continue;
    if (typeof blob[k] === 'number' && blob[k] < 0) return true;
  }
  return false;
}

function experiencePreviewLine(fx, credits) {
  const living = Object.hasOwn(fx, 'setBond')
    || Object.hasOwn(fx, 'setHunger')
    || Object.hasOwn(fx, 'addCargo');
  const experienced = credits < 0
    || Object.hasOwn(fx, 'setFear')
    || Object.hasOwn(fx, 'startSystem')
    || hasNegativeStanding(fx);
  if (experienced) return 'Experienced';
  if (living) return 'New player \u2014 living-ship care';
  return 'New player';
}

function previewLinesFor(fx) {
  const credits = previewCredits(fx);
  return [
    hullPreviewLine(),
    moneyPreviewLine(credits),
    standingsPreviewLine(fx),
    dangerPreviewLine(fx, credits),
    experiencePreviewLine(fx, credits),
  ].filter((t) => typeof t === 'string' && t);
}

function appendPreview(parent, fx) {
  const box = document.createElement('div');
  box.className = 'rw-origin-preview';
  for (const text of previewLinesFor(fx)) {
    const el = document.createElement('div');
    el.className = 'rw-origin-preview-line';
    el.textContent = text;
    box.appendChild(el);
  }
  parent.appendChild(box);
}

export function initOrigins(ctx) {
  if (ctx.flags.saveRestored || ctx.world.origin) {
    ctx.originsApi = closedOriginsApi();
    return { update() {} };
  }

  ctx.flags.paused = true;
  disengage(ctx, 'pause');
  disengageAutomine(ctx, 'pause');

  const root = document.createElement('div');
  root.style.cssText =
    'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:60;' +
    'background:rgba(2,10,14,.92);' +
    "font-family:'Consolas','Menlo','Courier New',monospace;";
  // Clicks on the overlay must not reach the canvas (fire input).
  root.addEventListener('mousedown', (e) => e.stopPropagation());
  root.addEventListener('click', (e) => e.stopPropagation());

  const card = document.createElement('div');
  card.className = 'rw-origin-card';
  card.style.cssText =
    'width:620px;max-width:92vw;padding:16px 20px;background:rgba(4,18,22,.9);' +
    'border:1px solid rgba(111,242,224,.35);border-radius:2px;text-transform:uppercase;';
  root.appendChild(card);

  const title = document.createElement('div');
  title.className = 'rw-origin-title';
  title.style.cssText = 'font-size:14px;letter-spacing:.14em;color:#6ff2e0;margin-bottom:12px;';
  title.textContent = 'RIMWARD — who are you?';
  card.appendChild(title);

  const list = document.createElement('div');
  list.className = 'rw-origin-list';
  card.appendChild(list);

  let overlayOpen = true;
  function choose(id) {
    if (!overlayOpen) return 'no-service';
    if (typeof id !== 'string' || !Object.hasOwn(ORIGINS, id) || !isChoosableOrigin(id)) {
      return 'unknown';
    }
    const applied = applyEffects(ctx, id);
    if (!applied) return 'unknown';
    window.removeEventListener('keydown', onKey);
    ctx.world.origin = id;
    ctx.world.jumpGraceUntil = (ctx.world.time || 0) + JUMP.graceSeconds;
    root.remove();
    overlayOpen = false;
    ctx.flags.paused = false;
    ctx.emit('originChosen', { id, line: ORIGINS[id].line });
    return '';
  }

  try {
    ORIGIN_DIGIT_IDS.forEach((id, i) => {
      try {
        if (!isChoosableOrigin(id)) return;
        const rec = ORIGINS[id];
        const row = document.createElement('div');
        row.className = 'rw-origin-row';
        const label = document.createElement('div');
        label.className = 'rw-origin-choice';
        label.textContent = `[${i + 1}] ${rec.name} — ${rec.line}`;
        row.appendChild(label);
        appendPreview(row, rec.effects);
        row.addEventListener('click', () => { choose(id); });
        list.appendChild(row);
      } catch {
        /* skip this origin; do not reindex remaining Digit labels */
      }
    });
  } catch {
    /* never throw from overlay paint */
  }

  const footer = document.createElement('div');
  footer.className = 'rw-origin-footer';
  footer.style.cssText = 'font-size:10px;letter-spacing:.1em;color:rgba(111,242,224,.6);margin-top:10px;';
  footer.textContent = 'press 1-5 or click — this choice is permanent';
  card.appendChild(footer);

  function onKey(e) {
    if (!e.code || e.code.length !== 6 || !e.code.startsWith('Digit')) return;
    const n = e.code.charCodeAt(5) - 49; // '1' → 0
    if (n < 0 || n >= ORIGIN_DIGIT_IDS.length) return;
    const id = ORIGIN_DIGIT_IDS[n];
    if (!isChoosableOrigin(id)) return;
    choose(id);
  }
  window.addEventListener('keydown', onKey);
  document.body.appendChild(root);

  ctx.originsApi = {
    isOpen() { return overlayOpen; },
    choose(id) {
      if (!overlayOpen) return 'no-service';
      if (typeof id !== 'string' || !id || !Object.hasOwn(ORIGINS, id)) return 'unknown';
      if (!isChoosableOrigin(id)) return 'unknown';
      return choose(id);
    },
  };

  return { update() {} };
}
