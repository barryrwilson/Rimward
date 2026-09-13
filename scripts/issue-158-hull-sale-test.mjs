/**
 * Issue #158 — sell an owned hull from the hangar.
 *
 * Part A runs the sale against small synthetic docked contexts (the wave-72
 * buyCtx shape) so every quote, refusal and mirror pin is exact. Part B is a
 * real boot (scripts/lib/boot-harness.mjs): the player docks, opens the
 * shipyard desk, sees the Sell row on an unmounted hull, confirms the sale,
 * and the purse / hangar / save round trip agree.
 *
 * Covered:
 *   1  quotes: homeRate of the class list for the yard's own banner,
 *      foreignRate for another banner, hotHullFence × hullPrizeValue for a
 *      hot hull; a living hull quotes only at a living yard, a grafted hull
 *      only at the Gilded Chain, nothing at a dock with no catalog
 *   2  sale: the purse gains the quote, the row is gone, the mounted hull
 *      and its world mirrors are untouched, receipt hullSold + a comm line
 *   3  refusals change nothing and name the reason: mounted, missing,
 *      not docked, combat, paused, no catalog, living at a plated yard,
 *      grafted outside the Chain
 *   4  hot flag: allowlisted true-only on the row, survives park and a
 *      JSON round trip, a corrupt value is dropped
 *   5  live desk: Sell button, confirm box, Esc cancels, confirm sells,
 *      Digit keys are inert while papers are open, peekView reports pending,
 *      snapshot/restore keeps the sale; hullSold stays off the agent ring
 *
 * Run: npm run test:hull-sale
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { ECON, HULL_RESALE, createShipState } from '../src/game/state.js';
import {
  YARD_LIST_UU,
  hullResaleQuote,
  hullResaleRefusal,
  sellHangarHull,
  clampHotRate,
  purchaseYardHull,
  yardStockFor,
} from '../src/game/shipyard.js';
import { hullPrizeValue } from '../src/game/prize.js';
import { sanitizeHangar, sanitizeHangarRecord, parkMounted, removeHangarRow } from '../src/game/hangar.js';
import { EVENT_TYPES } from '../src/game/agent-schema.js';
import { SELL_REFUSE_LINES, renderShipyardDesk } from '../src/systems/shipyard-desk.js';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 600));
}

const here = dirname(fileURLToPath(import.meta.url));
const src = (rel) => readFileSync(join(here, '..', rel), 'utf8');

// ---------------------------------------------------------------- Part A
function row(id, extra = {}) {
  return { id, classKey: 'light', faction: 'freehold', hullKind: 'built', name: id, ...extra };
}
function deskCtx(faction, extra = {}) {
  const player = createShipState('light', { name: 'Pin158' });
  player.hullKind = 'living';
  const systemId = 'sys158';
  const events = [];
  return {
    flags: { docked: true, combat: false, paused: false, ...(extra.flags ?? {}) },
    world: {
      currentSystem: systemId,
      credits: extra.credits ?? 1000,
      reputation: { [faction]: 0 },
      launcher: 'L1', missileAmmo: 3, turret: 'T1', scanner: 1, miningLaser: 2, concealedMounts: false,
      hangar: extra.hangar ?? {
        mountedId: 'hull_starter',
        hulls: [
          { id: 'hull_starter', hullKind: 'living', classKey: 'light', faction: 'independent', name: 'She' },
          ...(extra.rows ?? []),
        ],
      },
    },
    systems: { [systemId]: faction ? { faction } : {} },
    cargo: extra.cargo ?? [{ commodity: 'ore', units: 3 }],
    cargoCapacity: 20,
    player,
    events,
    emit(type, payload) { events.push({ type, ...payload }); },
    ships: [],
    gate: { jumping: false },
  };
}
const list = YARD_LIST_UU.light;

// 1 quotes
{
  const home = deskCtx('freehold', { rows: [row('hull_a')] });
  const qa = hullResaleQuote(home, home.world.hangar.hulls[1]);
  pin('1a home banner quotes homeRate of the class list', qa && qa.kind === 'home' && qa.price === Math.round(list * HULL_RESALE.homeRate), qa);
  const away = deskCtx('veridian', { rows: [row('hull_a')] });
  const qb = hullResaleQuote(away, away.world.hangar.hulls[1]);
  pin('1b another banner quotes foreignRate', qb && qb.kind === 'foreign' && qb.price === Math.round(list * HULL_RESALE.foreignRate) && qb.price < qa.price, qb);
  const hot = deskCtx('veridian', { rows: [row('hull_h', { hot: true, classKey: 'heavy' })] });
  const hr = hot.world.hangar.hulls[1];
  const qh = hullResaleQuote(hot, hr, 0.4);
  pin('1c a hot hull quotes hotHullFence × hullPrizeValue at the supplied rate, whatever the banner', qh && qh.kind === 'hot' && qh.rate === 0.4 && qh.price === Math.round(hullPrizeValue('heavy') * 0.4), qh);
  const [lo, hi] = ECON.hotHullFence;
  pin('1d the hot rate is clamped into ECON.hotHullFence; a bad rate rolls inside it', clampHotRate(0) === lo && clampHotRate(9) === hi && (() => { const r = clampHotRate('x'); return r >= lo && r <= hi; })());
  const living = deskCtx('freehold', { rows: [row('hull_l', { hullKind: 'living', faction: 'beautiful' })] });
  pin('1e a living hull is refused at a plated yard', hullResaleRefusal(living, living.world.hangar.hulls[1]) === 'living' && hullResaleQuote(living, living.world.hangar.hulls[1]) === null);
  const livingOk = deskCtx('beautiful', { rows: [row('hull_l', { hullKind: 'living', faction: 'beautiful' })] });
  const ql = hullResaleQuote(livingOk, livingOk.world.hangar.hulls[1]);
  pin('1f a living hull quotes at a Beautiful Ones yard (home)', ql && ql.kind === 'home');
  const livingUnk = deskCtx('unknowables', { rows: [row('hull_l', { hullKind: 'living', faction: 'beautiful' })] });
  pin('1g and at an Unknowables yard (foreign)', hullResaleQuote(livingUnk, livingUnk.world.hangar.hulls[1])?.kind === 'foreign');
  const grafted = deskCtx('freehold', { rows: [row('hull_g', { grafted: true })] });
  pin('1h a grafted hull is refused outside the Chain', hullResaleRefusal(grafted, grafted.world.hangar.hulls[1]) === 'grafted');
  const graftedOk = deskCtx('gilded', { rows: [row('hull_g', { grafted: true })] });
  pin('1i a grafted hull quotes at a Gilded yard', hullResaleQuote(graftedOk, graftedOk.world.hangar.hulls[1])?.kind === 'foreign');
  const noYard = deskCtx('independent', { rows: [row('hull_a')] });
  pin('1j a dock with no hull catalog quotes nothing', yardStockFor('independent').length === 0 && hullResaleRefusal(noYard, noYard.world.hangar.hulls[1]) === 'stock');
  const noBanner = deskCtx('', { rows: [row('hull_a')] });
  pin('1k a dock with no banner quotes nothing', hullResaleRefusal(noBanner, noBanner.world.hangar.hulls[1]) === 'stock');
}

// 2 sale
{
  const c = deskCtx('freehold', { credits: 1000, rows: [row('hull_a', { launcher: 'L9', cargo: [{ commodity: 'ore', units: 5 }] })] });
  sanitizeHangar(c);
  const before = JSON.parse(JSON.stringify(c.world.hangar.hulls[0]));
  const mirrors = { launcher: c.world.launcher, missileAmmo: c.world.missileAmmo, turret: c.world.turret, scanner: c.world.scanner, hold: JSON.stringify(c.cargo) };
  const r = sellHangarHull(c, 'hull_a');
  const quote = Math.round(list * HULL_RESALE.homeRate);
  pin('2a the sale is accepted at the quote', r.ok === true && r.price === quote && r.kind === 'home', r);
  pin('2b the purse gains the quote', c.world.credits === 1000 + quote, c.world.credits);
  pin('2c the row is gone and the mounted row is unchanged', c.world.hangar.hulls.length === 1 && c.world.hangar.mountedId === 'hull_starter' && JSON.stringify(c.world.hangar.hulls[0]) === JSON.stringify(before), c.world.hangar);
  pin('2d the world mirrors and the live hold are untouched (the gear aboard the sold hull went with it)', c.world.launcher === mirrors.launcher && c.world.missileAmmo === mirrors.missileAmmo && c.world.turret === mirrors.turret && c.world.scanner === mirrors.scanner && JSON.stringify(c.cargo) === mirrors.hold);
  const sold = c.events.find((e) => e.type === 'hullSold');
  pin('2e receipt hullSold names the hull, the kind and the credits; a station comm line follows', !!sold && sold.hullId === 'hull_a' && sold.classKey === 'light' && sold.faction === 'freehold' && sold.kind === 'home' && sold.credits === quote && sold.hot === false && sold.system === 'sys158' && typeof sold.line === 'string'
    && c.events.some((e) => e.type === 'commLine' && e.text === sold.line), c.events);
  pin('2f hullSold is not on the agent ring', !EVENT_TYPES.includes('hullSold'));
  const again = sellHangarHull(c, 'hull_a');
  pin('2g selling it twice is refused: missing', again.ok === false && again.reason === 'missing' && c.world.credits === 1000 + quote);

  const hot = deskCtx('veridian', { credits: 0, rows: [row('hull_h', { hot: true, classKey: 'heavy', faction: 'freehold' })] });
  const rh = sellHangarHull(hot, 'hull_h', { hotRate: 0.3 });
  pin('2h a hot hull sells at the hot rate at a foreign yard', rh.ok === true && rh.kind === 'hot' && rh.price === Math.round(hullPrizeValue('heavy') * 0.3) && hot.world.credits === rh.price && hot.events.find((e) => e.type === 'hullSold')?.hot === true, rh);
  const hotHome = deskCtx('freehold', { credits: 0, rows: [row('hull_h', { hot: true, faction: 'freehold' })] });
  const rhh = sellHangarHull(hotHome, 'hull_h', { hotRate: 0.5 });
  pin('2i a hot hull pays the hot rate even under its own banner', rhh.ok === true && rhh.kind === 'hot' && rhh.price === Math.round(hullPrizeValue('light') * 0.5), rhh);
  const hotRolled = deskCtx('freehold', { credits: 0, rows: [row('hull_h', { hot: true })] });
  const rr = sellHangarHull(hotRolled, 'hull_h');
  const [lo, hi] = ECON.hotHullFence;
  pin('2j with no rate supplied the sale rolls inside hotHullFence', rr.ok === true && rr.price >= Math.round(hullPrizeValue('light') * lo) && rr.price <= Math.round(hullPrizeValue('light') * hi), rr);

  const bad = deskCtx('freehold', { credits: 'nope', rows: [row('hull_a')] });
  const rb = sellHangarHull(bad, 'hull_a');
  pin('2k a corrupt purse is treated as empty, then credited', rb.ok === true && bad.world.credits === quote, bad.world.credits);
}

// 3 refusals
{
  function unchanged(c, snapH, snapC) {
    return JSON.stringify(c.world.hangar) === snapH && c.world.credits === snapC && !c.events.some((e) => e.type === 'hullSold');
  }
  function refuse(name, c, id, want, opts) {
    sanitizeHangar(c);
    const snapH = JSON.stringify(c.world.hangar);
    const snapC = c.world.credits;
    const r = sellHangarHull(c, id, opts);
    pin(name, r.ok === false && r.reason === want && unchanged(c, snapH, snapC) && typeof SELL_REFUSE_LINES[want] === 'string', r);
  }
  refuse('3a the mounted hull is refused: mounted', deskCtx('freehold', { rows: [row('hull_a')] }), 'hull_starter', 'mounted');
  refuse('3b an unknown row is refused: missing', deskCtx('freehold', { rows: [row('hull_a')] }), 'hull_zzz', 'missing');
  refuse('3c a non-string id is refused: missing', deskCtx('freehold', { rows: [row('hull_a')] }), 7, 'missing');
  refuse('3d not docked: dock', deskCtx('freehold', { rows: [row('hull_a')], flags: { docked: false } }), 'hull_a', 'dock');
  refuse('3e in combat: combat', deskCtx('freehold', { rows: [row('hull_a')], flags: { combat: true } }), 'hull_a', 'combat');
  refuse('3f paused: paused', deskCtx('freehold', { rows: [row('hull_a')], flags: { paused: true } }), 'hull_a', 'paused');
  refuse('3g no catalog at this dock: stock', deskCtx('independent', { rows: [row('hull_a')] }), 'hull_a', 'stock');
  refuse('3h a living hull at a plated yard: living', deskCtx('freehold', { rows: [row('hull_l', { hullKind: 'living', faction: 'beautiful' })] }), 'hull_l', 'living');
  refuse('3i a grafted hull outside the Chain: grafted', deskCtx('beautiful', { rows: [row('hull_g', { grafted: true })] }), 'hull_g', 'grafted');
  const j = deskCtx('freehold', { rows: [row('hull_a')] });
  j.gate.jumping = true;
  refuse('3j mid-jump: jump', j, 'hull_a', 'jump');
  const d = deskCtx('freehold', { rows: [row('hull_a')] });
  d.player.destroyed = true;
  refuse('3k destroyed: destroyed', d, 'hull_a', 'destroyed');
  const m = deskCtx('freehold', { rows: [row('hull_a')] });
  pin('3l removeHangarRow never takes the mounted row', removeHangarRow(m, 'hull_starter').ok === false && m.world.hangar.hulls.length === 2);
}

// 4 hot flag
{
  const rec = sanitizeHangarRecord({ id: 'hull_x', classKey: 'light', hot: true });
  pin('4a hot: true is kept on a sanitized row', rec?.hot === true);
  const noHot = sanitizeHangarRecord({ id: 'hull_x', classKey: 'light', hot: 'yes' });
  pin('4b a corrupt hot value is dropped', noHot && !Object.hasOwn(noHot, 'hot'));
  const plain = sanitizeHangarRecord({ id: 'hull_x', classKey: 'light' });
  pin('4c an ordinary row has no hot field', plain && !Object.hasOwn(plain, 'hot'));
  const c = deskCtx('freehold', {
    hangar: { mountedId: 'hull_h', hulls: [{ id: 'hull_h', classKey: 'light', faction: 'freehold', hullKind: 'built', hot: true }] },
  });
  sanitizeHangar(c);
  parkMounted(c);
  pin('4d parking the mounted hull keeps its hot flag (the live player carries none)', c.world.hangar.hulls[0].hot === true && !Object.hasOwn(c.player, 'hot'));
  const clone = { world: JSON.parse(JSON.stringify(c.world)), player: c.player, cargo: [], cargoCapacity: 20 };
  sanitizeHangar(clone);
  pin('4e a JSON round trip keeps it', clone.world.hangar.hulls[0].hot === true);
}

// ---------------------------------------------------------------- Part B
seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const DT = 1 / 60;
const allEvents = [];
function tick(n) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, sys] of systems) sys.update?.(DT);
    allEvents.push(...ctx.events);
    ctx.lastEvents = ctx.events; ctx.events = [];
    for (let j = ctx.ships.length - 1; j >= 0; j--) {
      const s = ctx.ships[j];
      ctx.ships.splice(j, 1);
      binds.removeLiveShip(ctx, s);
      if (s.record) s.record.live = false;
    }
  }
}
const mark = () => allEvents.length;
const receiptsSince = (m, type) => allEvents.slice(m).filter((e) => e.type === type);

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
for (const live of [...ctx.ships]) binds.removeLiveShip(ctx, live);
ctx.ships.length = 0;
for (const rec of ctx.world.records) rec.live = false;

function overlay() {
  for (const n of dom.walkDom(document.body)) {
    if (typeof n.className === 'string' && n.className.includes('station-overlay')) return n;
  }
  return null;
}
function texts() {
  const ov = overlay();
  if (!ov) return [];
  return [...dom.walkDom(ov)].map((n) => n.textContent).filter((t) => typeof t === 'string');
}
function has(frag) { return texts().some((t) => t.includes(frag)); }
function button(pred) {
  const ov = overlay();
  if (!ov) return null;
  for (const n of dom.walkDom(ov)) {
    if (n.tagName === 'BUTTON' && typeof n.textContent === 'string' && pred(n.textContent)) return n;
  }
  return null;
}

{
  const SYS = ctx.world.currentSystem;
  const faction = ctx.systems?.[SYS]?.faction ?? '';
  const stp = ctx.systems[SYS].station.position;
  const near = new THREE.Vector3(stp[0] + 36, stp[1], stp[2]);
  ctx.ship.object.position.copy(near); ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
  ctx.flags.combat = false;
  tick(2);
  ctx.input.dockPressed = true; tick(3); ctx.input.dockPressed = false;
  pin('5a docked at the home yard', ctx.flags.docked === true && yardStockFor(faction).length > 0, { docked: ctx.flags.docked, faction });

  // Buy one stock hull so there is an unmounted row to sell.
  ctx.world.credits = 50000;
  const bought = purchaseYardHull(ctx, 'light');
  pin('5b an unmounted stock hull is in the hangar', bought.ok === true && ctx.world.hangar.hulls.length === 2 && ctx.world.hangar.mountedId !== bought.row.id, bought);
  const soldId = bought.row.id;
  const credits0 = ctx.world.credits;
  const quote = hullResaleQuote(ctx, bought.row);
  pin('5c the yard quotes the row at the home rate', quote && quote.kind === 'home' && quote.price === Math.round(list * HULL_RESALE.homeRate), quote);

  dom.dispatchKey('Digit0'); tick(2);
  if (!has('HANGAR')) { dom.dispatchKey('Digit1'); tick(1); }
  pin('5d the Hangar pane is open', has('HANGAR') && has('Sell on Hangar'));
  const sellBtn = button((t) => t === `Sell — ${quote.price} UU`);
  pin('5e exactly one Sell button, on the unmounted row, quoting the price', !!sellBtn && [...dom.walkDom(overlay())].filter((n) => n.tagName === 'BUTTON' && /^Sell — /.test(n.textContent ?? '')).length === 1, texts().filter((t) => /Sell/.test(t)));
  sellBtn?.click(); tick(1);
  pin('5f the confirm box is up and the note names what goes with the hull', has('Confirm sale') && has('Gear and hold aboard go with the hull.') && ctx.stationDesk.peekView()?.pending === true, texts());
  dom.dispatchKey('Digit3'); tick(1);
  pin('5g digits are inert while sale papers are open', ctx.world.hangar.mountedId !== soldId && ctx.world.hangar.hulls.length === 2);
  dom.dispatchKey('Escape'); tick(1);
  pin('5h Esc cancels the papers and nothing changed', !has('Confirm sale') && has('HANGAR') && ctx.world.hangar.hulls.length === 2 && ctx.world.credits === credits0 && ctx.stationDesk.peekView()?.pending === false, texts());

  button((t) => t === `Sell — ${quote.price} UU`)?.click(); tick(1);
  const m = mark();
  button((t) => t === 'Confirm sale')?.click(); tick(2);
  const sold = receiptsSince(m, 'hullSold');
  pin('5i Confirm sale: the purse gains the quote, the row is gone, the mounted hull stands', sold.length === 1 && sold[0].hullId === soldId && sold[0].credits === quote.price && ctx.world.credits === credits0 + quote.price
    && ctx.world.hangar.hulls.length === 1 && ctx.world.hangar.hulls[0].id === ctx.world.hangar.mountedId, { sold, credits: ctx.world.credits, credits0, hangar: ctx.world.hangar });
  pin('5j the desk notice reads the sale line and no Sell button remains', has(sold[0]?.line ?? ' ') && !button((t) => /^Sell — /.test(t)), texts());

  const snap = JSON.parse(JSON.stringify(binds.snapshot(ctx)));
  pin('5l the snapshot has one hull and the credited purse', snap.world.hangar.hulls.length === 1 && snap.world.credits === credits0 + quote.price && !snap.world.hangar.hulls.some((h) => h.id === soldId), snap.world.hangar);
  binds.restore(ctx, snap);
  pin('5m restore agrees', ctx.world.hangar.hulls.length === 1 && ctx.world.credits === credits0 + quote.price, ctx.world.hangar);

  // A hot row restores hot and is offered at the hot rate with the hot note.
  const hotSnap = JSON.parse(JSON.stringify(snap));
  hotSnap.world.hangar.hulls.push({ id: 'hull_hot_1', classKey: 'cutter', faction: 'veridian', hullKind: 'built', name: 'Stray Cutter', hot: true });
  binds.restore(ctx, hotSnap);
  const hotRow = ctx.world.hangar.hulls.find((h) => h.id === 'hull_hot_1');
  pin('5n a hot row survives restore with hot: true', hotRow?.hot === true, ctx.world.hangar.hulls);
  ctx.stationDesk.selectService?.('shipyard');
  tick(1);
  if (!has('HANGAR')) { dom.dispatchKey('Digit0'); tick(2); }
  if (!has('HANGAR')) { dom.dispatchKey('Digit1'); tick(1); }
  const hotBtn = button((t) => /^Sell — \d+ UU$/.test(t));
  const hotPrice = hotBtn ? Number(/(\d+) UU/.exec(hotBtn.textContent)[1]) : NaN;
  const [lo, hi] = ECON.hotHullFence;
  pin('5o the hot row is offered inside the hot-hull band and reads hot', has('· hot') && hotPrice >= Math.round(hullPrizeValue('cutter') * lo) && hotPrice <= Math.round(hullPrizeValue('cutter') * hi), { hotPrice, texts: texts().filter((t) => /Sell|hot/.test(t)) });
  const creditsH = ctx.world.credits;
  hotBtn?.click(); tick(1);
  pin('5p the hot confirm box names the laundering rate', has('Hot hull. The yard pays the laundering rate, no questions.'), texts());
  button((t) => t === 'Confirm sale')?.click(); tick(2);
  pin('5q the quote shown is the quote paid', ctx.world.credits === creditsH + hotPrice && !ctx.world.hangar.hulls.some((h) => h.id === 'hull_hot_1'), { credits: ctx.world.credits, creditsH, hotPrice });

  const desk = src('src/systems/shipyard-desk.js');
  pin('5r the desk writes text-safe DOM only', !/innerHTML/.test(desk) && !/insertAdjacentHTML/.test(desk));
  pin('5s ctx.js documents hullSold; the desk exposes a refusal line for every reason it can meet', /'hullSold'/.test(src('src/core/ctx.js')) && ['mounted', 'missing', 'stock', 'living', 'grafted', 'dock', 'combat', 'paused', 'jump', 'destroyed', 'busy'].every((k) => typeof SELL_REFUSE_LINES[k] === 'string'));
  pin('5t renderShipyardDesk is exported for the host', typeof renderShipyardDesk === 'function');
}

console.log(fails === 0 ? 'ISSUE 158 HULL SALE PASS' : `ISSUE 158 HULL SALE FAIL — ${fails} pins`);
process.exit(fails === 0 ? 0 : 1);
