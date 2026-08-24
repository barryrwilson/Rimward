// Wave 94 Unknowables origin dock — standalone pins (do not edit scripts/boot-test.mjs).
// node out/w94/unk/probe.mjs
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';

register(new URL('../../../scripts/css-hook.mjs', import.meta.url));

function makeEl(tag = 'div') {
  const node = {
    tagName: String(tag).toUpperCase(),
    children: [],
    parent: null,
    style: { setProperty() {}, width: '', display: '' },
    dataset: {},
    _attrs: {},
    classList: {
      _s: new Set(),
      add(...c) { c.forEach((x) => this._s.add(x)); node.className = [...this._s].join(' '); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); node.className = [...this._s].join(' '); },
      contains(c) { return this._s.has(c); },
    },
    appendChild(c) {
      c.parent = node;
      this.children.push(c);
      return c;
    },
    addEventListener() {},
    setAttribute(k, v) { this._attrs[k] = String(v); },
    getAttribute(k) { return Object.hasOwn(this._attrs, k) ? this._attrs[k] : null; },
    getContext() {
      const gradient = { addColorStop() {} };
      return {
        canvas: node,
        createRadialGradient: () => gradient,
        createLinearGradient: () => gradient,
        fillRect() {},
        fill() {},
        beginPath() {},
        arc() {},
        fillStyle: '',
      };
    },
  };
  let className = '';
  Object.defineProperty(node, 'className', {
    get() { return className; },
    set(v) { className = String(v); },
  });
  let text = '';
  Object.defineProperty(node, 'textContent', {
    get() { return text; },
    set(v) { text = String(v); },
  });
  return node;
}

globalThis.document = {
  createElement: (t) => makeEl(t),
  body: makeEl('body'),
  documentElement: { style: {} },
  addEventListener() {},
};
globalThis.window = {
  addEventListener() {},
  removeEventListener() {},
  innerWidth: 1280,
  innerHeight: 720,
};

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' ' + extra : ''}`);
}

const {
  AUTHORED_SYSTEMS,
} = await import('../../../src/game/authored-systems.js');
const { SYSTEMS, EPICS, U } = await import('../../../src/game/state.js');
const { LIVING_STOCK } = await import('../../../src/game/shipyard.js');
const { portraitFor } = await import('../../../src/game/portraits.js');
const { initContacts, contactsForSystem } = await import('../../../src/game/contacts.js');
const { MODEL_CATALOG } = await import('../../../src/game/model-catalog.js');
const {
  DATA_CUBE, DATA_CRYSTAL, ARCHIVE_OWN_UU, ARCHIVE_RIVAL_UU, archiveFilePrice,
} = await import('../../../src/game/data-trade.js');
const { assembleUnknowablesStation, UNKNOWABLES_STATION_PATH } = await import('../../../src/systems/stations/unknowables.js');
const {
  archiveDeskAllowed,
  confirmArchivePending,
  renderArchiveDesk,
  DOCK_KEY_SERVICES,
  buildStationModel,
} = await import('../../../src/systems/station.js');

const stationSrc = src('src/systems/station.js');
const authoredSrc = src('src/game/authored-systems.js');
const contactsSrc = src('src/game/contacts.js');
const catalogSrc = src('src/game/model-catalog.js');
const stateSrc = src('src/game/state.js');
const shipyardSrc = src('src/game/shipyard.js');
const unkSrc = src('src/systems/stations/unknowables.js');

const veil = AUTHORED_SYSTEMS.veil;
const hush = AUTHORED_SYSTEMS.hush;
pin('veil.id', veil?.id === 'veil' && SYSTEMS.veil?.id === 'veil');
pin('veil.name', veil?.name === 'The Veil');
pin('veil.faction', veil?.faction === 'unknowables' && SYSTEMS.veil?.faction === 'unknowables');
pin('veil.band', veil?.band === 3);
pin('veil.station', veil?.station?.name === 'The Quiet');
pin('veil.cast', veil?.cast?.traders === 0 && veil.cast.pirates === 0 && veil.cast.patrols === 0 && veil.cast.ace === false);
pin('veil.cluesEmpty', Array.isArray(veil?.clues) && veil.clues.length === 0);
pin('veil.gateToHush', Array.isArray(veil?.gates) && veil.gates.some((g) => g.to === 'hush'));
pin('hush.gateToVeil', Array.isArray(hush?.gates) && hush.gates.some((g) => g.to === 'veil'));
pin('hush.clues.2', Array.isArray(hush?.clues) && hush.clues.length === 2);
let clueCount = 0;
for (const id of Object.keys(AUTHORED_SYSTEMS)) {
  clueCount += (AUTHORED_SYSTEMS[id].clues ?? []).length;
}
pin('authored.clues.6', clueCount === 6, `count=${clueCount}`);
pin('hush.th_veil', (hush.landmarks ?? []).some((lm) => lm.id === 'th_veil' && lm.kind === 'anomaly'));

pin('detail.noUnknowables', !/unknowables:\s*unknowablesStation/.test(stationSrc)
  && !stationSrc.includes('unknowables: unknowablesStation'));
pin('dispatch.dedicated', stationSrc.includes('isUnknowable(def.faction)')
  && stationSrc.includes('buildUnknowablesStation')
  && stationSrc.includes("from './stations/unknowables.js'"));
pin('builder.path', UNKNOWABLES_STATION_PATH === true && unkSrc.includes('unknowables-station'));
pin('placeholder.notUsed', !stationSrc.includes("if (isUnknowable") === false);

pin('dock.digit0', DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1] === 'shipyard');
pin('living.stock', Array.isArray(LIVING_STOCK) && LIVING_STOCK.includes('frigate') && LIVING_STOCK.includes('ace'));
pin('living.unkUsesSame', shipyardSrc.includes('UNKNOWABLES_STOCK = LIVING_STOCK'));
pin('epics.omit', !Object.hasOwn(EPICS, 'unknowables') && !/unknowables:\s*\{/.test(stateSrc.slice(stateSrc.indexOf('export const EPICS'))));

pin('contacts.voice', contactsSrc.includes("veil: { dockmaster: 'Voice-Without' }")
  && contactsSrc.includes("veil: ['dockmaster']"));

const ctxContacts = { world: { contacts: [], currentSystem: 'veil', mystery: { visited: [], found: [], charted: [] } }, lastEvents: [], emit() {}, on() {} };
initContacts(ctxContacts);
const people = contactsForSystem(ctxContacts, 'veil');
pin('contacts.roster', people.length === 1 && people[0].name === 'Voice-Without' && people[0].role === 'dockmaster' && people[0].system === 'veil');

const portrait = portraitFor('unknowables', 'contact-veil-dockmaster');
pin('people.portrait', !!portrait && typeof portrait.src === 'string' && portrait.src.includes('unknowables') && (portrait.variant === 'a' || portrait.variant === 'b'));

pin('catalog.station', MODEL_CATALOG.some((e) => e.id === 'station:unknowables' && e.faction === 'unknowables'));
pin('catalog.src', catalogSrc.includes("id: 'station:unknowables'"));

pin('desk.assembly', archiveDeskAllowed('assembly') === true);
pin('desk.unknowables', archiveDeskAllowed('unknowables') === true);
pin('desk.freehold', archiveDeskAllowed('freehold') === false);
pin('desk.proto', archiveDeskAllowed('__proto__') === false);
pin('uu.own', ARCHIVE_OWN_UU === 400);
pin('uu.rival', ARCHIVE_RIVAL_UU === 900);
pin('assembly.price.buyCube', archiveFilePrice('buy', DATA_CUBE, 'legal', 'assembly') === 400);
pin('assembly.price.sellCrystal', archiveFilePrice('sell', DATA_CRYSTAL, 'captured', 'unknowables') === 900);
pin('assembly.price.noBuyCrystal', archiveFilePrice('buy', DATA_CRYSTAL, 'legal', 'unknowables') == null);

function archiveUi(pending) {
  return { dataPending: pending, dataBusy: false, notice: '' };
}

{
  const ctx = { cargo: [], cargoCapacity: 10, world: { credits: 500, reputation: { assembly: 0 } } };
  const ui = archiveUi({ verb: 'buy', commodity: DATA_CUBE, source: 'legal', originFaction: 'assembly' });
  confirmArchivePending(ctx, ui, 'assembly');
  pin('asm.buy.debit', ctx.world.credits === 100 && ctx.cargo[0]?.commodity === DATA_CUBE);
}
{
  const ctx = {
    cargo: [{ commodity: DATA_CRYSTAL, units: 1, source: 'captured', originFaction: 'unknowables' }],
    cargoCapacity: 10,
    world: { credits: 0, reputation: { assembly: 0 } },
  };
  const ui = archiveUi({ verb: 'sell', commodity: DATA_CRYSTAL, source: 'captured', originFaction: 'unknowables' });
  confirmArchivePending(ctx, ui, 'assembly');
  pin('asm.rival.900', ctx.world.credits === 900 && ctx.cargo.length === 0);
}
{
  const ctx = { cargo: [], cargoCapacity: 10, world: { credits: 5000, reputation: { assembly: -1 } } };
  const ui = archiveUi({ verb: 'buy', commodity: DATA_CUBE, source: 'legal', originFaction: 'assembly' });
  confirmArchivePending(ctx, ui, 'assembly');
  pin('asm.hostile', ctx.world.credits === 5000 && ui.notice === 'No sale.');
}

{
  const ctx = { cargo: [], cargoCapacity: 10, world: { credits: 500, reputation: { unknowables: 0 } } };
  const ui = archiveUi({ verb: 'buy', commodity: DATA_CRYSTAL, source: 'legal', originFaction: 'unknowables' });
  confirmArchivePending(ctx, ui, 'unknowables');
  pin('unk.buy.own400', ctx.world.credits === 100 && ctx.cargo[0]?.commodity === DATA_CRYSTAL && ctx.cargo[0]?.originFaction === 'unknowables');
}
{
  const ctx = {
    cargo: [{ commodity: DATA_CRYSTAL, units: 1, source: 'legal', originFaction: 'unknowables' }],
    cargoCapacity: 10,
    world: { credits: 0, reputation: { unknowables: 1 } },
  };
  const ui = archiveUi({ verb: 'sell', commodity: DATA_CRYSTAL, source: 'legal', originFaction: 'unknowables' });
  confirmArchivePending(ctx, ui, 'unknowables');
  pin('unk.sell.own400', ctx.world.credits === 400 && ctx.cargo.length === 0);
}
{
  const ctx = {
    cargo: [{ commodity: DATA_CUBE, units: 1, source: 'captured', originFaction: 'assembly' }],
    cargoCapacity: 10,
    world: { credits: 0, reputation: { unknowables: 0 } },
  };
  const ui = archiveUi({ verb: 'sell', commodity: DATA_CUBE, source: 'captured', originFaction: 'assembly' });
  confirmArchivePending(ctx, ui, 'unknowables');
  pin('unk.rival.900', ctx.world.credits === 900 && ctx.cargo.length === 0);
}
{
  const ctx = {
    cargo: [{ commodity: DATA_CRYSTAL, units: 2, source: 'captured', originFaction: 'unknowables' }],
    cargoCapacity: 10,
    world: { credits: 50, reputation: { unknowables: 0 } },
  };
  const ui = archiveUi({ verb: 'sell', commodity: DATA_CRYSTAL, source: 'captured', originFaction: 'unknowables' });
  confirmArchivePending(ctx, ui, 'unknowables');
  pin('unk.illegal.stay', ctx.world.credits === 50 && ctx.cargo[0]?.units === 2 && String(ui.notice).includes('illegal in origin'));
}
{
  const ctx = { cargo: [], cargoCapacity: 10, world: { credits: 5000, reputation: { unknowables: -1 } } };
  const ui = archiveUi({ verb: 'buy', commodity: DATA_CRYSTAL, source: 'legal', originFaction: 'unknowables' });
  confirmArchivePending(ctx, ui, 'unknowables');
  pin('unk.hostile', ctx.world.credits === 5000 && ctx.cargo.length === 0 && ui.notice === 'No sale.');
}
{
  const ctx = { cargo: [], cargoCapacity: 10, world: { credits: 5000, reputation: { assembly: -8, unknowables: 3 } } };
  const ui = archiveUi({ verb: 'buy', commodity: DATA_CRYSTAL, source: 'legal', originFaction: 'unknowables' });
  confirmArchivePending(ctx, ui, 'unknowables');
  pin('unk.hostile.notAssembly', ctx.world.credits === 4600 && ctx.cargo.length === 1);
}

pin('seed.chrome', stationSrc.includes('seedPending') && stationSrc.includes('renderSeedPapers')
  && stationSrc.includes('cancelSeedPending()') && stationSrc.includes('grantMarketSeed')
  && stationSrc.includes('ui.seedBusy') && /cancelSeedPending\(\)\s*\|\|\s*cancelDataPending/.test(stationSrc));
pin('no.innerHTML', !/innerHTML/.test(stationSrc) && !/innerHTML/.test(unkSrc) && !/innerHTML/.test(authoredSrc));
pin('aria.notice', stationSrc.includes("setAttribute('aria-live', 'polite')"));
pin('dock.range', U.DOCK_RANGE === 45);

const scheme = {
  dark: 0x141414, darkEmissive: 0x020202, light: 0x8aa0ff, beacon: 0xe8e8ff,
  accent: 0x6fd8e8, patch: [0x665fac, 0x6fd8e8],
};
const kit = assembleUnknowablesStation({ faction: 'unknowables', station: { position: [0, 0, 0], name: 'The Quiet' } }, scheme);
pin('sculpt.name', kit.group.name === 'unknowables-station');
pin('sculpt.ring', !!kit.ringGroup && kit.ringGroup.parent === kit.group);
pin('sculpt.sharedFree', (() => {
  let shared = false;
  kit.group.traverse((o) => {
    const mat = o.material;
    if (mat && mat.userData && mat.userData.shared) shared = true;
  });
  return !shared;
})());

function meshEnvelope(root) {
  const box = new THREE.Box3();
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const b = o.geometry.boundingBox.clone();
    b.applyMatrix4(o.matrixWorld);
    box.union(b);
  });
  return box;
}
const env = meshEnvelope(kit.group);
pin('envelope.xz', env.min.x >= -32 && env.max.x <= 32 && env.min.z >= -32 && env.max.z <= 32,
  `x=${env.min.x.toFixed(2)}..${env.max.x.toFixed(2)} z=${env.min.z.toFixed(2)}..${env.max.z.toFixed(2)}`);
pin('envelope.y', env.min.y >= -26 && env.max.y <= 33,
  `y=${env.min.y.toFixed(2)}..${env.max.y.toFixed(2)}`);

try {
  const model = buildStationModel('unknowables', 'veil');
  pin('model.group', model?.object?.name === 'unknowables-station');
  pin('model.update', typeof model?.update === 'function');
} catch (err) {
  pin('model.group', false, String(err && err.message));
  pin('model.update', false);
}

function collectDesk(faction, ui, cargo, reputation) {
  const texts = [];
  const buttons = [];
  const h = (_tag, _cls, parent, text) => {
    if (text !== undefined) texts.push(String(text));
    const node = { children: [], setAttribute() {}, className: _cls };
    if (parent && parent.children) parent.children.push(node);
    return node;
  };
  const btn = (parent, label) => {
    buttons.push(label);
    return { type: 'button' };
  };
  const panel = { children: [] };
  const ctx = {
    cargo: cargo ?? [],
    cargoCapacity: 10,
    world: { credits: 1000, reputation: reputation ?? { unknowables: 0, assembly: 0 } },
    settings: { reducedMotion: false },
  };
  renderArchiveDesk(h, btn, panel, ctx, ui, faction, () => {});
  return { texts, buttons };
}

const deskUnk = collectDesk('unknowables', { level: 2, service: 'market', dataPending: null }, []);
pin('ui.unk.header', deskUnk.texts.some((t) => t.includes('legal crystals') && t.includes('400') && t.includes('rival cubes') && t.includes('900')));
pin('ui.unk.buyBtn', deskUnk.buttons.includes('File a legal crystal'));
pin('ui.unk.noBuyCubes', deskUnk.texts.some((t) => t === 'The archive does not buy cubes.'));

const deskAsm = collectDesk('assembly', { level: 2, service: 'market', dataPending: null }, []);
pin('ui.asm.header', deskAsm.texts.some((t) => t.includes('legal cubes') && t.includes('400') && t.includes('rival crystals') && t.includes('900')));
pin('ui.asm.buyBtn', deskAsm.buttons.includes('File a legal cube'));

const deskHost = collectDesk('unknowables', { level: 2, service: 'market', dataPending: null }, [], { unknowables: -1 });
pin('ui.unk.noSale', deskHost.texts.includes('No sale.') && deskHost.buttons.length === 0);

if (fails.length) {
  console.log(`FAIL ${fails.length}`);
  for (const f of fails) console.log(`  ${f}`);
  process.exitCode = 1;
} else {
  console.log('PASS all');
}
