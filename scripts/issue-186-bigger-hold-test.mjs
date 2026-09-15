/**
 * Issue #186 — the larger cargo hull is visible once the racks are spent.
 *
 * Owner decision 2: no new hull, no new SKU, no tuning. The outfitter already
 * sells two hold racks; when they are full the note must point at the hull the
 * yard already sells, and the Yard pane must show what a hull carries before
 * the buyer signs papers. Text only — no navigation change.
 *
 * This is one real boot (scripts/lib/boot-harness.mjs): the player docks, opens
 * OUTFITTING, and the pane is read at each hold state.
 *
 * Covered:
 *   1  racks not yet spent: the maxed note and the guidance are both absent
 *   2  a maxed light (40 units) reads the maxed note plus a truthful hint that
 *      names the freighter's stock hold from cargoHoldFor and the Yard pane
 *   3  a dock whose faction stocks no freighter says so and sends the player
 *      to another dock — it never promises a sale here
 *   4  a maxed freighter (180 units) gets the maxed note and NO claim that a
 *      larger hold exists
 *   5  Yard pane: every card reads price + stock hold + hold with racks from
 *      cargoHoldFor/cargoHoldMax, and the confirm box repeats them with the
 *      price intact; prices, stock and standing are unchanged
 *
 * Run: npm run test:bigger-hold
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { cargoHoldFor, cargoHoldMax, HOLD_RACK_STEP, HOLD_RACK_MAX } from '../src/game/state.js';
import { dockFactionOf, yardStockFor, yardPrice, dockReputation, listYardOffers } from '../src/game/shipyard.js';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 600));
}

const here = dirname(fileURLToPath(import.meta.url));
const src = (rel) => readFileSync(join(here, '..', rel), 'utf8');

const BIG = cargoHoldFor('freighter');

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems, binds } = await bootGameSystems();
const DT = 1 / 60;
function tick(n) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, sys] of systems) sys.update?.(DT);
    ctx.lastEvents = ctx.events; ctx.events = [];
    for (let j = ctx.ships.length - 1; j >= 0; j--) {
      const s = ctx.ships[j];
      ctx.ships.splice(j, 1);
      binds.removeLiveShip(ctx, s);
      if (s.record) s.record.live = false;
    }
  }
}

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

// Re-open OUTFITTING at a given class / hold so the pane is drawn fresh.
function outfitAt(classKey, capacity) {
  ctx.player.classKey = classKey;
  ctx.cargoCapacity = capacity;
  ctx.stationDesk.selectService('outfitting');
  tick(1);
}

const SYS = ctx.world.currentSystem;
const homeFaction = ctx.systems?.[SYS]?.faction ?? '';

{
  const stp = ctx.systems[SYS].station.position;
  ctx.ship.object.position.copy(new THREE.Vector3(stp[0] + 36, stp[1], stp[2]));
  ctx.ship.velocity.set(0, 0, 0); ctx.ship.speed = 0;
  ctx.flags.combat = false;
  tick(2);
  ctx.input.dockPressed = true; tick(3); ctx.input.dockPressed = false;
  pin('0a docked at a yard that stocks a freighter',
    ctx.flags.docked === true && yardStockFor(homeFaction).includes('freighter'),
    { docked: ctx.flags.docked, faction: homeFaction, stock: yardStockFor(homeFaction) });
  pin('0b the class data still reads light 20 / freighter 160, two racks of ten',
    cargoHoldFor('light') === 20 && BIG === 160 && HOLD_RACK_STEP === 10 && HOLD_RACK_MAX === 2
    && cargoHoldMax('light') === 40 && cargoHoldMax('freighter') === 180,
    { light: cargoHoldFor('light'), big: BIG, max: cargoHoldMax('freighter') });
}

// 1 racks not yet spent
{
  outfitAt('light', cargoHoldFor('light'));
  pin('1a a stock light hold offers the rack and shows no maxed note',
    !!button((t) => /^1 — Expand hold \+10 /.test(t)) && !has('Hold racks maxed out'), texts());
  pin('1b and no bigger-hull guidance while a rack is still for sale',
    !has('A freighter hull carries'), texts());

  outfitAt('light', cargoHoldFor('light') + HOLD_RACK_STEP);
  pin('1c one rack fitted still offers the second and still says nothing about a freighter',
    !!button((t) => /^1 — Expand hold \+10 /.test(t)) && !has('Hold racks maxed out') && !has('A freighter hull carries'), texts());
}

// 2 a maxed light gets the truthful hint
{
  outfitAt('light', cargoHoldMax('light'));
  pin('2a the maxed note still reads the actual capacity and the rack button is gone',
    has('Hold racks maxed out at 40 units.') && !button((t) => /Expand hold/.test(t)), texts());
  pin('2b the guidance names the freighter stock hold from the class data',
    has(`A freighter hull carries ${BIG} units stock.`), texts());
  pin('2c and names the desk that sells it at this dock',
    has("This dock's yard has one: Shipyard, Yard pane."), texts());
  pin('2d the hint never claims more racks or a hold above the freighter stock',
    !has('Expand hold') && !texts().some((t) => /\b(1[89]\d|[2-9]\d\d)\s*units stock/.test(t)), texts());
}

// 3 a dock with no freighter in the catalog
{
  const saved = ctx.systems[SYS].faction;
  ctx.systems[SYS].faction = 'independent';
  pin('3a the swapped banner really stocks nothing',
    dockFactionOf(ctx) === 'independent' && yardStockFor('independent').length === 0);
  outfitAt('light', cargoHoldMax('light'));
  pin('3b the hint still names the freighter hold honestly',
    has(`A freighter hull carries ${BIG} units stock.`), texts());
  pin('3c but it says this yard has none and points at another dock',
    has('This yard does not stock one — look for a Shipyard Yard pane at another dock.')
    && !has("This dock's yard has one"), texts());
  ctx.systems[SYS].faction = saved;
  pin('3d the banner is restored', dockFactionOf(ctx) === homeFaction);
}

// 4 a maxed freighter is already the big hold
{
  outfitAt('freighter', cargoHoldMax('freighter'));
  pin('4a the maxed note reads 180 units',
    has('Hold racks maxed out at 180 units.') && !button((t) => /Expand hold/.test(t)), texts());
  pin('4b no larger-cargo claim is made to a maxed freighter',
    !has('A freighter hull carries') && !has('Shipyard, Yard pane') && !has('another dock'), texts());
}

// 5 the Yard pane shows the hold before the papers
{
  outfitAt('light', cargoHoldFor('light'));
  ctx.stationDesk.selectService('shipyard');
  tick(1);
  dom.dispatchKey('Digit2');
  tick(1);
  pin('5a the Yard pane is open', has('YARD'), texts());

  const rep = dockReputation(ctx, homeFaction);
  const offers = listYardOffers(ctx).slice(0, 8);
  pin('5b every yard card reads its price, its stock hold and its hold with racks',
    offers.length > 0 && offers.every((o) => has(`${yardPrice(o.classKey, rep)} UU · hold ${cargoHoldFor(o.classKey)} units · ${cargoHoldMax(o.classKey)} with racks`)),
    { offers: offers.map((o) => o.classKey), rows: texts().filter((t) => /UU · hold/.test(t)) });
  const freighter = offers.find((o) => o.classKey === 'freighter');
  const fPrice = yardPrice('freighter', rep);
  pin('5c the freighter card is the 160 / 180 row and keeps its list price',
    !!freighter && fPrice === 24000 && has(`${fPrice} UU · hold 160 units · 180 with racks`),
    { fPrice, rows: texts().filter((t) => /hold 160/.test(t)) });

  const credits0 = ctx.world.credits;
  const hulls0 = ctx.world.hangar.hulls.length;
  const idx = offers.findIndex((o) => o.classKey === 'freighter');
  const papers = [...dom.walkDom(overlay())].filter((n) => n.tagName === 'BUTTON' && / — Papers$/.test(n.textContent ?? ''));
  papers[idx]?.click();
  tick(1);
  pin('5d the confirm box repeats the price and the hold before the papers are signed',
    has(`${fPrice} UU · hold 160 units · 180 with racks · Confirm papers`) && !!button((t) => t === 'Confirm papers'), texts());
  pin('5e opening papers debits nothing and adds no hull',
    ctx.world.credits === credits0 && ctx.world.hangar.hulls.length === hulls0);
  dom.dispatchKey('Escape');
  tick(1);
  pin('5f Esc cancels and the purse and hangar still stand',
    !has('Confirm papers') && ctx.world.credits === credits0 && ctx.world.hangar.hulls.length === hulls0, texts());
}

// 6 the panes stay text-safe
{
  const station = src('src/systems/station.js');
  const desk = src('src/systems/shipyard-desk.js');
  pin('6a neither pane writes HTML',
    !/innerHTML/.test(station) && !/insertAdjacentHTML/.test(station)
    && !/innerHTML/.test(desk) && !/insertAdjacentHTML/.test(desk));
  pin('6b the guidance reads the hold from the class data, never an authored number',
    /cargoHoldFor\('freighter'\)/.test(station) && /cargoHoldFor\(classKey\)/.test(desk) && /cargoHoldMax\(classKey\)/.test(desk));
}

console.log(fails === 0 ? 'ISSUE 186 BIGGER HOLD PASS' : `ISSUE 186 BIGGER HOLD FAIL — ${fails} pins`);
process.exit(fails === 0 ? 0 : 1);
