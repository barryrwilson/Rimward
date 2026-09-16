/**
 * Issue #208 — repair costs scale with hull class and damage taken.
 *
 * Owner decision on the issue: "Repair should scale with Hull Class and damage
 * taken. Not cargo value." Damage severity is the amount of integrity missing,
 * which the existing bill already prices linearly; the change is an authored
 * hull-class multiplier applied BEFORE the per-channel rounding, so a minor
 * scrape stays cheap and a stripped hull is a real loss. Contract and exact
 * arithmetic: docs/Issue208RepairBalanceRecommendations.md.
 *
 * This is one real boot (scripts/lib/boot-harness.mjs): the player docks and
 * the REPAIR BAYS pane is read and clicked. The quote asserted is the rendered
 * pane text, and the payment asserted is the real `1 — Repair all` button.
 *
 * Covered:
 *   0  tuning lives in state.js; station.js defines no local rate table
 *   1  repairClassMultiplier: six authored keys, own-property lookup, light
 *      fallback for unknown / absent / prototype-shaped keys
 *   2  the rendered quote at modifier 1 equals rate x lack x class, ceiled per
 *      channel, for every one of the six classes
 *   3  the documented 62% hull / 70% engine table at a combined 0.9 modifier:
 *      89/76/127/117/164/566 before, 265/224/504/579/981/4524 after
 *   4  the class factor lands before rounding, not on the rounded total
 *   5  a channel less than one integrity down is still skipped and still free
 *   6  a corrupt channel is flagged, never billed, and is re-trued by the refit
 *   7  keeper compensation still zeroes every line and the total
 *   8  an unaffordable bill is refused and takes nothing
 *   9  quote/payment parity: the displayed total is what leaves the purse, she
 *      comes back whole, and a second repair charges nothing
 *  10  a living hull pays its class rate, identical to the built hull
 *  11  the bill does not read the hold — no cargo valuation
 *  12  an unauthored or prototype-shaped classKey is priced at light AND
 *      re-trued from the light baseline by the real refit — the payment path's
 *      own-property lookup, exercised through the button with corrupt maxima
 *
 * Run: npm run test:repair-balance
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { SHIP_CLASSES, REPAIR_RATES, REPAIR_CLASS_MULT, repairClassMultiplier, DEFENSE } from '../src/game/state.js';
import { epicEffects } from '../src/game/epics.js';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 600));
}

const here = dirname(fileURLToPath(import.meta.url));
const src = (rel) => readFileSync(join(here, '..', rel), 'utf8');
const CLASSES = ['light', 'cutter', 'heavy', 'ace', 'freighter', 'frigate'];

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

// ---- the damage fixture -----------------------------------------------------
// Authored maxima from the class row, then an explicit fraction knocked off the
// named channels. Whole-number maxima keep `lack` exact, so every expected UU
// below is closed-form arithmetic, not a tolerance.
function damage(classKey, { hullFrac = 0, screenFrac = 0, shellFrac = 0, engineFrac = 0, hullKind = 'built' } = {}) {
  const cls = SHIP_CLASSES[classKey];
  const screenMax = Math.round(cls.shield * DEFENSE.screenFraction);
  const p = ctx.player;
  p.classKey = classKey;
  p.hullKind = hullKind;
  p.hullMax = cls.hull; p.screenMax = screenMax; p.shellMax = cls.shield - screenMax; p.engineMax = cls.engine;
  p.hull = p.hullMax * (1 - hullFrac);
  p.screen = p.screenMax * (1 - screenFrac);
  p.shell = p.shellMax * (1 - shellFrac);
  p.engine = p.engineMax * (1 - engineFrac);
  p.engineOut = false; p.disabled = false;
  return p;
}
/** Re-open REPAIR so the pane is drawn fresh, then read the quote back. */
function quote() {
  ctx.stationDesk.selectService('repair');
  tick(1);
  const lines = texts();
  const total = lines.map((t) => /^Yard total: (\d+) UU\.$/.exec(t)).find(Boolean);
  const parts = {};
  for (const t of lines) {
    const m = /^(hull|screen|shell|engine) — (\d+) integrity down · (\d+) UU$/.exec(t);
    if (m) parts[m[1]] = { lack: Number(m[2]), cost: Number(m[3]) };
  }
  const btn = button((t) => /^1 — Repair all \((\d+) UU\)$/.test(t));
  return {
    total: total ? Number(total[1]) : null,
    button: btn ? Number(/\((\d+) UU\)/.exec(btn.textContent)[1]) : null,
    parts, lines, whole: lines.some((t) => t.includes('She reads whole on every channel.')),
    corrupt: lines.some((t) => t.includes('scrambled channels')),
    comped: lines.some((t) => t.includes('Comped by the keepers')),
  };
}
/** The contract's arithmetic, written out independently of the desk. */
function expectedItem(max, frac, key, mult, classMult) {
  const lack = max * frac;
  return lack < 1 ? 0 : Math.ceil(lack * REPAIR_RATES[key] * mult * classMult);
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
  pin('0a docked at the authored home berth', ctx.flags.docked === true, { docked: ctx.flags.docked, faction: homeFaction });
}

// 0 the tuning moved to the tuning owner
{
  const station = src('src/systems/station.js');
  const state = src('src/game/state.js');
  pin('0b station.js no longer authors its own rate table',
    !/^const REPAIR_RATES\s*=/m.test(station) && /REPAIR_RATES, repairClassMultiplier \} from '\.\.\/game\/state\.js'/.test(station), null);
  pin('0c state.js owns and freezes both tables',
    /export const REPAIR_RATES = Object\.freeze/.test(state) && /export const REPAIR_CLASS_MULT = Object\.freeze/.test(state)
    && Object.isFrozen(REPAIR_RATES) && Object.isFrozen(REPAIR_CLASS_MULT));
  pin('0d the rates are unchanged: hull .9, screen .3, shell .5, engine .6',
    REPAIR_RATES.hull === 0.9 && REPAIR_RATES.screen === 0.3 && REPAIR_RATES.shell === 0.5 && REPAIR_RATES.engine === 0.6
    && Object.keys(REPAIR_RATES).join(',') === 'hull,screen,shell,engine', REPAIR_RATES);
  pin('0e the owner-selected class table is 3/3/4/5/6/8',
    REPAIR_CLASS_MULT.light === 3 && REPAIR_CLASS_MULT.cutter === 3 && REPAIR_CLASS_MULT.heavy === 4
    && REPAIR_CLASS_MULT.ace === 5 && REPAIR_CLASS_MULT.freighter === 6 && REPAIR_CLASS_MULT.frigate === 8
    && Object.keys(REPAIR_CLASS_MULT).length === 6, REPAIR_CLASS_MULT);
  pin('0f every flyable class has an authored multiplier',
    Object.keys(SHIP_CLASSES).every((k) => Object.prototype.hasOwnProperty.call(REPAIR_CLASS_MULT, k)),
    Object.keys(SHIP_CLASSES));
  pin('0g the class factor lands before the ceil, inside the item',
    /Math\.ceil\(lack \* REPAIR_RATES\[key\] \* repairMult \* classMult\)/.test(station));
}

// 1 the lookup is safe
{
  for (const k of CLASSES) pin(`1a ${k} reads its authored multiplier`, repairClassMultiplier(k) === REPAIR_CLASS_MULT[k]);
  pin('1b an unknown class falls back to light',
    repairClassMultiplier('derelictHulk') === 3 && repairClassMultiplier('') === 3);
  pin('1c a missing class falls back to light',
    repairClassMultiplier(undefined) === 3 && repairClassMultiplier(null) === 3 && repairClassMultiplier(0) === 3);
  pin('1d inherited object keys never price a repair',
    repairClassMultiplier('__proto__') === 3 && repairClassMultiplier('constructor') === 3
    && repairClassMultiplier('toString') === 3 && repairClassMultiplier('hasOwnProperty') === 3,
    { proto: repairClassMultiplier('__proto__'), ctor: repairClassMultiplier('constructor') });
}

// 2 the rendered quote at an unmodified yard
{
  pin('2a the authored berth applies no faction yard rate and no epic yet',
    (epicEffects(ctx, homeFaction).repairMult ?? 1) === 1, epicEffects(ctx, homeFaction));
  for (const classKey of CLASSES) {
    const cls = SHIP_CLASSES[classKey];
    const screenMax = Math.round(cls.shield * DEFENSE.screenFraction);
    const m = REPAIR_CLASS_MULT[classKey];
    damage(classKey, { hullFrac: 0.5, screenFrac: 0.25, shellFrac: 0.25, engineFrac: 0.5 });
    const q = quote();
    const want = {
      hull: expectedItem(cls.hull, 0.5, 'hull', 1, m),
      screen: expectedItem(screenMax, 0.25, 'screen', 1, m),
      shell: expectedItem(cls.shield - screenMax, 0.25, 'shell', 1, m),
      engine: expectedItem(cls.engine, 0.5, 'engine', 1, m),
    };
    const sum = want.hull + want.screen + want.shell + want.engine;
    pin(`2b ${classKey}: every itemized line is rate x lack x class, ceiled`,
      CLASSES.length > 0 && Object.keys(want).every((k) => (q.parts[k]?.cost ?? 0) === want[k]), { want, got: q.parts });
    pin(`2c ${classKey}: the total and the button agree with the sum of the lines`,
      q.total === sum && q.button === sum, { total: q.total, button: q.button, sum });
  }
}

// 3 the documented table, at the combined 0.9 modifier
// Fixture: one achieved freehold epic stage, whose authored effect is the 0.9
// repair multiplier the recommendation document models. No new field.
{
  ctx.world.epics = { ...(ctx.world.epics ?? {}), [homeFaction]: 1 };
  pin('3a the fixture yields exactly the modeled 0.9 modifier',
    epicEffects(ctx, homeFaction).repairMult === 0.9, epicEffects(ctx, homeFaction));

  // class → [hull item, engine item, total before the class factor, total after]
  const TABLE = {
    light: [151, 114, 89, 265],
    cutter: [121, 103, 76, 224],
    heavy: [322, 182, 127, 504],
    ace: [352, 227, 117, 579],
    freighter: [663, 318, 164, 981],
    frigate: [3616, 908, 566, 4524],
  };
  for (const classKey of CLASSES) {
    const [hullItem, engineItem, before, after] = TABLE[classKey];
    const cls = SHIP_CLASSES[classKey];
    damage(classKey, { hullFrac: 0.62, engineFrac: 0.70 });
    const q = quote();
    pin(`3b ${classKey}: the documented hull and engine items are billed`,
      q.parts.hull?.cost === hullItem && q.parts.engine?.cost === engineItem, { want: [hullItem, engineItem], got: q.parts });
    pin(`3c ${classKey}: intact screen and shell are not billed at all`,
      q.parts.screen === undefined && q.parts.shell === undefined, q.parts);
    pin(`3d ${classKey}: the yard total is the documented ${after} UU`,
      q.total === after && q.button === after, { total: q.total, button: q.button, after });
    const old = Math.ceil(cls.hull * 0.62 * 0.9 * 0.9) + Math.ceil(cls.engine * 0.70 * 0.6 * 0.9);
    pin(`3e ${classKey}: the pre-change bill really was the documented ${before} UU`,
      old === before, { old, before });
    // The bill is the class multiple of the old one, to within the integrity
    // point each of the two channels can lose to its own ceil.
    const mult = REPAIR_CLASS_MULT[classKey];
    pin(`3f ${classKey}: the same damage now costs the class multiple, not a trivial sum`,
      q.total > old && Math.abs(q.total - old * mult) <= 2 * mult, { total: q.total, old, mult, modeled: old * mult });
  }

  // 4 rounding order
  {
    damage('light', { hullFrac: 0.62, engineFrac: 0.70 });
    const q = quote();
    pin('4a the light bill is 265 UU, the per-channel result, not 267',
      q.total === 265 && Math.ceil(89 * 3) === 267, { total: q.total });
    pin('4b the total is exactly the sum of the separately rounded lines',
      q.total === q.parts.hull.cost + q.parts.engine.cost, q.parts);
  }

  // 5 a scratch is still free
  {
    const p = damage('light', { engineFrac: 0.70 });
    p.hull = p.hullMax - 0.4; // 0.4 down: under one integrity even at 3x
    const q = quote();
    pin('5a a channel under one integrity down is skipped, not scaled into a bill',
      q.parts.hull === undefined && q.total === 114, { parts: q.parts, total: q.total });
    damage('light', {});
    const whole = quote();
    pin('5b an undamaged hull is quoted nothing and says so',
      whole.whole === true && whole.total === null, whole.lines);
    const p2 = damage('frigate', {});
    p2.hull = p2.hullMax - 0.9;
    const scratch = quote();
    pin('5c the same holds on the dearest class — no line, no total',
      scratch.whole === true && scratch.total === null, scratch.lines);
  }

  // 6 corrupt channels
  {
    const p = damage('heavy', { engineFrac: 0.70 });
    p.hullMax = NaN; p.hull = NaN;
    const q = quote();
    pin('6a a scrambled channel is flagged and never billed',
      q.corrupt === true && q.parts.hull === undefined, q.lines);
    pin('6b the sound channels are still billed at the class rate',
      q.parts.engine?.cost === 182 && q.total === 182, { parts: q.parts, total: q.total });
    ctx.world.credits = 10000;
    button((t) => /^1 — Repair all/.test(t)).click();
    tick(1);
    pin('6c the refit re-trues the scrambled channel from the class baseline and charges only the sound one',
      ctx.player.hullMax === SHIP_CLASSES.heavy.hull && ctx.player.hull === SHIP_CLASSES.heavy.hull
      && ctx.world.credits === 10000 - 182, { hullMax: ctx.player.hullMax, credits: ctx.world.credits });
  }

  // 7 the keepers still comp
  {
    ctx.station.keeperComp = true;
    for (const classKey of ['light', 'frigate']) {
      damage(classKey, { hullFrac: 0.62, engineFrac: 0.70 });
      const q = quote();
      pin(`7a ${classKey}: a comped berth zeroes every line and the total`,
        q.comped === true && q.total === 0 && q.button === 0
        && q.parts.hull.cost === 0 && q.parts.engine.cost === 0, { parts: q.parts, total: q.total });
    }
    const credits0 = ctx.world.credits;
    button((t) => /^1 — Repair all/.test(t)).click();
    tick(1);
    pin('7b a comped refit makes her whole and takes nothing',
      ctx.world.credits === credits0 && ctx.player.hull === ctx.player.hullMax
      && ctx.player.engine === ctx.player.engineMax, { credits: ctx.world.credits, credits0 });
    ctx.station.keeperComp = false;
  }

  // 8 an unaffordable bill
  {
    damage('freighter', { hullFrac: 0.62, engineFrac: 0.70 });
    const q = quote();
    const hull0 = ctx.player.hull;
    ctx.world.credits = q.total - 1;
    button((t) => /^1 — Repair all/.test(t)).click();
    tick(1);
    pin('8a one UU short refuses the refit and says why',
      has('Not enough UU for the yard.'), texts());
    pin('8b nothing leaves the purse and she is still down',
      ctx.world.credits === q.total - 1 && ctx.player.hull === hull0, { credits: ctx.world.credits, want: q.total - 1 });
  }

  // 9 quote / payment parity
  {
    damage('light', { hullFrac: 0.62, screenFrac: 0.5, shellFrac: 0.5, engineFrac: 0.70 });
    ctx.player.engineOut = true; ctx.player.disabled = true;
    const q = quote();
    ctx.world.credits = q.total; // exactly the quote: the boundary is affordable
    pin('9a the pane, the button and the itemized sum are one number',
      q.total === q.button && q.total === Object.values(q.parts).reduce((n, part) => n + part.cost, 0), q.parts);
    button((t) => /^1 — Repair all/.test(t)).click();
    tick(1);
    pin('9b exactly the displayed total leaves the purse', ctx.world.credits === 0, ctx.world.credits);
    const p = ctx.player;
    pin('9c she comes back whole on every channel and flies again',
      p.hull === p.hullMax && p.screen === p.screenMax && p.shell === p.shellMax && p.engine === p.engineMax
      && p.engineOut === false && p.disabled === false, { hull: p.hull, engine: p.engine });
    const again = quote();
    pin('9d a second refit is quoted nothing and charges nothing',
      again.whole === true && again.total === null && ctx.world.credits === 0, again.lines);
    button((t) => /^1 — Repair all/.test(t))?.click();
    tick(1);
    pin('9e and the button is gone rather than billing a whole hull',
      button((t) => /^1 — Repair all/.test(t)) === null && ctx.world.credits === 0);
  }

  // 10 living and built hulls of one class pay the same
  {
    damage('ace', { hullFrac: 0.62, engineFrac: 0.70, hullKind: 'built' });
    const built = quote();
    damage('ace', { hullFrac: 0.62, engineFrac: 0.70, hullKind: 'living' });
    const living = quote();
    pin('10a a living ace is billed exactly like a built ace',
      built.total === 579 && living.total === 579, { built: built.total, living: living.total });
    damage('light', { hullFrac: 0.62, engineFrac: 0.70 });
    ctx.player.classKey = 'derelictHulk'; // unauthored: never a free repair
    const unknown = quote();
    pin('10b an unauthored class on the player pays the light rate, not 1x',
      unknown.total === 265, unknown.total);
  }

  // 11 the bill never reads the hold
  {
    damage('freighter', { hullFrac: 0.62, engineFrac: 0.70 });
    const empty = quote();
    const cargo0 = ctx.cargo.slice();
    ctx.cargo.length = 0;
    ctx.cargo.push({ commodity: 'rareMetals', units: 120 }, { commodity: 'medicine', units: 40 });
    damage('freighter', { hullFrac: 0.62, engineFrac: 0.70 });
    const laden = quote();
    pin('11a a full hold of valuable cargo does not move the bill by one UU',
      empty.total === 981 && laden.total === 981, { empty: empty.total, laden: laden.total });
    ctx.cargo.length = 0;
    for (const row of cargo0) ctx.cargo.push(row);
    const station = src('src/systems/station.js');
    const repairSrc = /function repairCost\(\)[\s\S]*?\n  \}\n/.exec(station)?.[0] ?? '';
    pin('11b the quote reads no cargo, price or hold value',
      repairSrc.length > 0 && !/cargo|marketPrice|bookValue|value/i.test(repairSrc), repairSrc.slice(0, 200));
    pin('11c and adds no persisted field: the class factor is derived, never stored',
      !/repairClassMult|repairMultStored/.test(src('src/game/save.js')));
  }

  // 12 the unknown-class contract holds through the PAYMENT, not just the quote
  // Quinn: repairAll re-trues a scrambled channel from `SHIP_CLASSES[classKey]`.
  // A truthiness test accepts inherited keys, so a hull stamped 'constructor'
  // was billed at the light rate and then re-trued to NaN maxima. Every key
  // below is driven through the real button with a genuinely corrupt channel.
  {
    const LIGHT = SHIP_CLASSES.light;
    const LIGHT_SCREEN = Math.round(LIGHT.shield * DEFENSE.screenFraction);
    for (const classKey of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'derelictHulk']) {
      const p = damage('light', { hullFrac: 0.62, engineFrac: 0.70 });
      p.classKey = classKey;      // an unauthored or inherited-name hull
      p.screenMax = NaN; p.shell = NaN; // and a genuinely scrambled pair
      const q = quote();
      pin(`12a '${classKey}': quoted at the light rate, scrambled channels flagged not billed`,
        q.total === 265 && q.button === 265 && q.corrupt === true
        && q.parts.screen === undefined && q.parts.shell === undefined,
        { total: q.total, corrupt: q.corrupt, parts: q.parts });
      ctx.world.credits = q.total;
      button((t) => /^1 — Repair all/.test(t)).click();
      tick(1);
      pin(`12b '${classKey}': exactly the quote is taken`, ctx.world.credits === 0, ctx.world.credits);
      pin(`12c '${classKey}': every maximum is re-trued from the LIGHT baseline, none left NaN`,
        p.hullMax === LIGHT.hull && p.screenMax === LIGHT_SCREEN
        && p.shellMax === LIGHT.shield - LIGHT_SCREEN && p.engineMax === LIGHT.engine
        && [p.hullMax, p.screenMax, p.shellMax, p.engineMax].every(Number.isFinite),
        { hullMax: p.hullMax, screenMax: p.screenMax, shellMax: p.shellMax, engineMax: p.engineMax });
      pin(`12d '${classKey}': she reads whole and finite on every channel`,
        p.hull === p.hullMax && p.screen === p.screenMax && p.shell === p.shellMax && p.engine === p.engineMax
        && [p.hull, p.screen, p.shell, p.engine].every(Number.isFinite),
        { hull: p.hull, screen: p.screen, shell: p.shell, engine: p.engine });
      const again = quote();
      pin(`12e '${classKey}': the refit really ended the corruption — nothing left to fix, nothing left to bill`,
        again.whole === true && again.corrupt === false && again.total === null && ctx.world.credits === 0,
        again.lines);
    }
    pin('12f the payment path looks the class up by own property, not truthiness',
      /Object\.prototype\.hasOwnProperty\.call\(SHIP_CLASSES, p\.classKey\) \? p\.classKey : 'light'/
        .test(src('src/systems/station.js'))
      && !/createShipState\(SHIP_CLASSES\[p\.classKey\] \?/.test(src('src/systems/station.js')));
  }
}

console.log(fails === 0 ? 'ISSUE 208 REPAIR BALANCE PASS' : `ISSUE 208 REPAIR BALANCE FAIL — ${fails} pins`);
process.exit(fails === 0 ? 0 : 1);
