// Headless Wave 102 BIO-02 PR1 career-label probe.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const { createShipState, SHIP_CLASSES } = await import('../../../src/game/state.js');
const { LIVING_STOCK, livingTrainDests } = await import('../../../src/game/shipyard.js');
const { DOCK_KEY_SERVICES } = await import('../../../src/systems/station.js');
const {
  CAREER_WORD,
  careerOfferLabel,
  careerWordFor,
  handleShipyardDigit,
  renderShipyardDesk,
  SHIPYARD_PANE_HANGAR,
} = await import('../../../src/systems/shipyard-desk.js');

const here = dirname(fileURLToPath(import.meta.url));
const src = (rel) => readFileSync(join(here, '../../..', rel), 'utf8');

const fails = [];
function ok(name, cond) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'ok' : 'FAIL'} ${name}`);
}

const LIVE_KEYS = ['light', 'heavy', 'freighter', 'ace', 'cutter', 'frigate'];
const STOCK_KEYS = ['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate'];
const WANT_WORD = Object.freeze({
  heavy: 'combat',
  ace: 'hunter',
  freighter: 'trade',
  light: 'explore',
  cutter: 'cutter',
  frigate: 'capital',
});
const EXTRA = {
  heavy: 'combat',
  ace: 'hunter',
  freighter: 'trade',
  light: 'explore',
  frigate: 'capital',
};

function eqList(got, want) {
  return Array.isArray(got) && got.length === want.length && want.every((k, i) => got[i] === k);
}

function shipCfg() {
  return {
    maxSpeed: 120,
    creep: 30,
    acceleration: 90,
    damping: 0.5,
    afterburner: { multiplier: 2, burnTime: 6, cooldown: 8 },
  };
}

function ctxOf(extra = {}) {
  const classKey = extra.classKey ?? 'light';
  const player = extra.player ?? createShipState(classKey, {
    name: 'Probe',
    faction: extra.playerFaction ?? 'independent',
  });
  player.hullKind = extra.hullKind ?? 'living';
  player.classKey = classKey;
  const hulls = extra.hulls ?? [{
    id: 'hull_starter',
    hullKind: extra.hullKind ?? 'living',
    classKey,
    faction: extra.rowFaction ?? 'independent',
    name: 'She',
    cargoCapacity: 30,
    cargo: [{ commodity: 'rawOre', units: 4 }],
    grafted: extra.grafted,
  }];
  return {
    flags: { docked: true, combat: false, paused: false },
    gate: { jumping: false },
    world: {
      currentSystem: extra.systemId ?? 'probe',
      credits: extra.credits ?? 120000,
      reputation: extra.reputation ?? { beautiful: extra.rep ?? 50 },
      hangar: extra.hangar ?? { mountedId: hulls[0].id, hulls },
    },
    systems: { [extra.systemId ?? 'probe']: { faction: extra.faction ?? 'beautiful' } },
    cargo: [{ commodity: 'rawOre', units: 4 }],
    cargoCapacity: 30,
    player,
    bio: { growth: 1, bond: 1, fedCount: 8 },
    config: { ship: extra.shipCfg ?? shipCfg() },
    settings: { reducedMotion: false },
    emit() {},
  };
}

function paintDesk(ctx, ui) {
  const nodes = [];
  const panel = { tag: 'div', cls: '', text: '', children: [] };
  function h(tag, cls, parent, text) {
    const n = { tag, cls, text: text ?? '', children: [], onClick: null };
    (parent?.children ?? nodes).push(n);
    nodes.push(n);
    return n;
  }
  function btn(parent, label, onClick, cls) {
    const n = { tag: 'button', cls: cls ?? '', text: label, children: [], onClick };
    (parent?.children ?? nodes).push(n);
    nodes.push(n);
    return n;
  }
  renderShipyardDesk(h, btn, panel, ctx, ui, () => {});
  return { panel, nodes };
}

function texts(nodes) {
  return nodes.map((n) => n.text).filter(Boolean);
}

const classKeys = Object.keys(SHIP_CLASSES);
ok('classes.six', eqList(classKeys, LIVE_KEYS) && classKeys.length === 6);
ok('classes.noCareerKeys', !classKeys.some((k) => ['combat', 'hunter', 'trade', 'explore', 'mining', 'stealth', 'support', 'capital'].includes(k)));
ok('stock.six', eqList(LIVING_STOCK, STOCK_KEYS) && LIVING_STOCK.includes('frigate'));
ok('stock.frigate', LIVING_STOCK[LIVING_STOCK.length - 1] === 'frigate');

ok('career.table.heavy', CAREER_WORD.heavy === WANT_WORD.heavy);
ok('career.table.ace', CAREER_WORD.ace === WANT_WORD.ace);
ok('career.table.freighter', CAREER_WORD.freighter === WANT_WORD.freighter);
ok('career.table.light', CAREER_WORD.light === WANT_WORD.light);
ok('career.table.cutter', CAREER_WORD.cutter === WANT_WORD.cutter);
ok('career.table.frigate', CAREER_WORD.frigate === WANT_WORD.frigate);
ok('career.table.keys', Object.keys(CAREER_WORD).length === 6
  && Object.keys(WANT_WORD).every((k) => CAREER_WORD[k] === WANT_WORD[k]));
ok('career.proto', careerWordFor('__proto__') === ''
  && careerWordFor('constructor') === ''
  && careerWordFor('prototype') === ''
  && careerOfferLabel('__proto__') === 'light'
  && !Object.prototype.hasOwnProperty.call(CAREER_WORD, '__proto__')
  && !Object.prototype.hasOwnProperty.call(CAREER_WORD, 'constructor'));
ok('career.unknown', careerWordFor('mining') === '' && careerOfferLabel('mining') === 'light');
ok('career.cutter.noFake', careerOfferLabel('cutter') === 'cutter');
ok('career.extra', careerOfferLabel('heavy') === 'heavy combat'
  && careerOfferLabel('ace') === 'ace hunter'
  && careerOfferLabel('freighter') === 'freighter trade'
  && careerOfferLabel('light') === 'light explore'
  && careerOfferLabel('frigate') === 'frigate capital');

const ctx = ctxOf();
const ui = { shipyardPane: SHIPYARD_PANE_HANGAR, notice: '', trainPending: null, graftPending: null };
const first = paintDesk(ctx, ui);
const firstText = texts(first.nodes);
ok('offer.hop.keys', firstText.some((t) => t === 'light → heavy combat')
  && firstText.some((t) => t === 'light → ace hunter')
  && firstText.some((t) => t === 'light → freighter trade')
  && firstText.some((t) => t === 'light → light explore') === false
  && firstText.some((t) => t === 'light → cutter')
  && firstText.some((t) => t === 'light → cutter cutter') === false
  && firstText.some((t) => t === 'light → frigate capital'));
ok('offer.btn.exact', first.nodes.some((n) => n.tag === 'button' && n.text === 'Offer heavy')
  && first.nodes.some((n) => n.tag === 'button' && n.text === 'Offer ace')
  && first.nodes.some((n) => n.tag === 'button' && n.text === 'Offer freighter')
  && first.nodes.some((n) => n.tag === 'button' && n.text === 'Offer cutter')
  && first.nodes.some((n) => n.tag === 'button' && n.text === 'Offer frigate')
  && !first.nodes.some((n) => n.tag === 'button' && n.text === 'Offer heavy combat')
  && !first.nodes.some((n) => n.tag === 'button' && n.text === 'Offer ace hunter')
  && !first.nodes.some((n) => n.tag === 'button' && n.text === 'Offer freighter trade')
  && !first.nodes.some((n) => n.tag === 'button' && n.text === 'Offer frigate capital')
  && !first.nodes.some((n) => n.tag === 'button' && n.text === 'Offer cutter cutter'));
ok('offer.no.markup', first.nodes.filter((n) => n.cls === 'shipyard-buy-name' || n.tag === 'button')
  .every((n) => !String(n.text).includes('<')));

for (const dest of ['heavy', 'ace', 'freighter', 'frigate']) {
  const word = EXTRA[dest];
  ok(`offer.copy.${dest}`, firstText.some((t) => t === `light → ${dest} ${word}`)
    && first.nodes.some((n) => n.tag === 'button' && n.text === `Offer ${dest}`));
}

const fromCutter = paintDesk(ctxOf({ classKey: 'cutter' }), {
  shipyardPane: SHIPYARD_PANE_HANGAR, notice: '', trainPending: null, graftPending: null,
});
const cutterText = texts(fromCutter.nodes);
ok('offer.copy.light', cutterText.some((t) => t === 'cutter → light explore')
  && fromCutter.nodes.some((n) => n.tag === 'button' && n.text === 'Offer light')
  && !fromCutter.nodes.some((n) => n.tag === 'button' && n.text === 'Offer light explore'));
ok('offer.cutter.stays', first.nodes.some((n) => n.tag === 'button' && n.text === 'Offer cutter')
  && !firstText.some((t) => t === 'Offer cutter cutter')
  && !cutterText.some((t) => t === 'Offer cutter cutter'));

const destsFromLight = livingTrainDests('light');
ok('dests.live', destsFromLight.includes('heavy') && destsFromLight.includes('cutter')
  && destsFromLight.includes('frigate') && !destsFromLight.includes('light'));

const offerHeavy = first.nodes.find((n) => n.tag === 'button' && n.text === 'Offer heavy');
ok('offer.btn.heavy', typeof offerHeavy?.onClick === 'function');
offerHeavy.onClick();
ok('pending.dest.key', ui.trainPending?.destClass === 'heavy'
  && ui.trainPending?.fromClass === 'light'
  && ui.trainPending?.destClass !== 'combat'
  && ui.trainPending?.destClass !== 'heavy combat');

const papers = paintDesk(ctx, ui);
const papersText = texts(papers.nodes);
ok('confirm.hop.keys', papersText.some((t) => t === 'light → heavy')
  && !papersText.some((t) => t === 'light → heavy combat')
  && !papersText.some((t) => t === 'light → combat'));
ok('confirm.btn', papersText.some((t) => t === 'Confirm papers'));

const deskSrc = src('src/systems/shipyard-desk.js');
const stationSrc = src('src/systems/station.js');
const shipyardSrc = src('src/game/shipyard.js');
ok('src.confirmTrain.destKey', /const dest = pending\.destClass[\s\S]*trainMounted\(ctx, dest\)/.test(deskSrc));
ok('src.setTrain.destKey', deskSrc.includes('setTrainPending(ui, ctx, offer.destClass)'));
ok('src.offer.btn.classLabel', deskSrc.includes('btn(trainCard, `Offer ${classLabel(offer.destClass)}`'));
ok('src.confirm.hop', deskSrc.includes('const hop = `${fromClass} → ${destClass}`'));
ok('src.noInner', !/innerHTML/.test(deskSrc));
ok('src.noCareerPending', !deskSrc.includes('careerPending'));
ok('src.livingStock', shipyardSrc.includes("['light', 'cutter', 'heavy', 'freighter', 'ace', 'frigate']"));
ok('digit0.import', DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1] === 'shipyard');
ok('digit0.src', stationSrc.includes("export const DOCK_KEY_SERVICES = Object.freeze(['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard'])"));
ok('digit.hangar.swallow', handleShipyardDigit(3, ctx, ui) === true && ui.trainPending != null);

const buyPaneSrc = deskSrc.slice(
  deskSrc.indexOf('function renderBuyPane'),
  deskSrc.indexOf('function renderHangarPane'),
);
ok('src.yard.classLabelOnly', buyPaneSrc.includes("h('div', 'shipyard-buy-name', copy, classLabel(pending.classKey))")
  && buyPaneSrc.includes("h('div', 'shipyard-buy-name', copy, classLabel(offer.classKey))")
  && !buyPaneSrc.includes('careerOfferLabel')
  && !buyPaneSrc.includes('CAREER_WORD'));

if (fails.length) {
  console.log('PROBE FAIL', fails.join(','));
  process.exit(1);
}
console.log('PROBE PASS');
