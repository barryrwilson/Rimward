import { ORIGINS, COMMODITIES, SYSTEMS } from './state.js';

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
 */

const ORIGIN_IDS = Object.keys(ORIGINS);

/** Baseline price table for a system — replicates market.js buildTable. */
function buildBaselineTable(sys) {
  const table = {};
  const priceBase = SYSTEMS[sys].priceBase || {};
  for (const key of Object.keys(COMMODITIES)) {
    table[key] = Math.round(COMMODITIES[key].base * (priceBase[key] ?? 1));
  }
  return table;
}

/** Move the ship just off the target system's station, facing system center. */
function parkShip(ctx, sys) {
  const p = SYSTEMS[sys].station.position;
  const obj = ctx.ship.object;
  if (!obj) return;
  obj.position.set(p[0] + 40, p[1] + 10, p[2] + 60);
  obj.lookAt(0, 0, 0);
  ctx.ship.velocity.set(0, 0, 0);
  ctx.ship.speed = 0;
}

function applyEffects(ctx, id) {
  const fx = ORIGINS[id].effects;
  if (typeof fx.setCredits === 'number') ctx.world.credits = fx.setCredits;
  if (typeof fx.addCredits === 'number') ctx.world.credits += fx.addCredits;
  if (typeof fx.setFear === 'number') ctx.world.fear = fx.setFear;
  if (fx.reputation) {
    const rep = ctx.world.reputation;
    for (const faction of Object.keys(fx.reputation)) {
      rep[faction] = (rep[faction] ?? 0) + fx.reputation[faction];
    }
  }
  if (typeof fx.setBond === 'number') ctx.bio.bond = fx.setBond;
  if (typeof fx.setHunger === 'number') ctx.bio.hunger = fx.setHunger;
  if (fx.addCargo) {
    for (const c of fx.addCargo) ctx.cargo.push({ commodity: c.commodity, units: c.units });
  }
  if (fx.cluesFound) {
    const mystery = (ctx.world.mystery ??= { found: [], visited: [] });
    for (const clueId of fx.cluesFound) {
      if (!mystery.found.includes(clueId)) mystery.found.push(clueId);
    }
  }
  if (fx.startSystem && SYSTEMS[fx.startSystem]) {
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
}

export function initOrigins(ctx) {
  if (ctx.flags.saveRestored || ctx.world.origin) {
    return { update() {} };
  }

  ctx.flags.paused = true;

  const root = document.createElement('div');
  root.style.cssText =
    'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:60;' +
    'background:rgba(2,10,14,.92);' +
    "font-family:'Consolas','Menlo','Courier New',monospace;";
  // Clicks on the overlay must not reach the canvas (fire input).
  root.addEventListener('mousedown', (e) => e.stopPropagation());
  root.addEventListener('click', (e) => e.stopPropagation());

  const card = document.createElement('div');
  card.style.cssText =
    'width:620px;max-width:92vw;padding:16px 20px;background:rgba(4,18,22,.9);' +
    'border:1px solid rgba(111,242,224,.35);border-radius:2px;text-transform:uppercase;';
  root.appendChild(card);

  const title = document.createElement('div');
  title.style.cssText = 'font-size:14px;letter-spacing:.14em;color:#6ff2e0;margin-bottom:12px;';
  title.textContent = 'RIMWARD — who are you?';
  card.appendChild(title);

  function choose(id) {
    window.removeEventListener('keydown', onKey);
    applyEffects(ctx, id);
    ctx.world.origin = id;
    root.remove();
    ctx.flags.paused = false;
    ctx.emit('originChosen', { id, line: ORIGINS[id].line });
  }

  ORIGIN_IDS.forEach((id, i) => {
    const row = document.createElement('div');
    row.style.cssText =
      'font-size:12px;color:#d7e4ea;padding:7px 10px;margin:4px 0;cursor:pointer;' +
      'background:rgba(111,242,224,.06);border:1px solid rgba(111,242,224,.15);';
    row.textContent = `[${i + 1}] ${ORIGINS[id].name} — ${ORIGINS[id].line}`;
    row.addEventListener('mouseenter', () => { row.style.background = 'rgba(111,242,224,.18)'; });
    row.addEventListener('mouseleave', () => { row.style.background = 'rgba(111,242,224,.06)'; });
    row.addEventListener('click', () => choose(id));
    card.appendChild(row);
  });

  const footer = document.createElement('div');
  footer.style.cssText = 'font-size:10px;letter-spacing:.1em;color:rgba(111,242,224,.6);margin-top:10px;';
  footer.textContent = 'press 1-5 or click — this choice is permanent';
  card.appendChild(footer);

  function onKey(e) {
    if (!e.code || e.code.length !== 6 || !e.code.startsWith('Digit')) return;
    const n = e.code.charCodeAt(5) - 49; // '1' → 0
    if (n < 0 || n >= ORIGIN_IDS.length) return;
    choose(ORIGIN_IDS[n]);
  }
  window.addEventListener('keydown', onKey);
  document.body.appendChild(root);

  return { update() {} };
}
