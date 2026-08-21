// Wave 74 station: Digit 9 Standing explain + Archive desk (no UU) + priceOf 0.
// node --import ./scripts/with-css-stub.mjs out/w74/station/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RANK_LADDER } from '../../../src/game/state.js';
import {
  DOCK_KEY_SERVICES,
  priceOf,
  archiveDeskAllowed,
  standingLadderLines,
  standingLiveNotes,
  standingMoveNotes,
  renderArchiveDesk,
  confirmArchivePending,
  cancelDataPending,
  nextStandingRung,
} from '../../../src/systems/station.js';

const fails = [];
const results = {};
function pin(name, cond, extra = '') {
  results[name] = !!cond;
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' ' + extra : ''}`);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const stationSrc = readFileSync(join(root, 'src/systems/station.js'), 'utf8');

pin('dock.keys.10', DOCK_KEY_SERVICES.length === 10);
pin('dock.digit0.shipyard', DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1] === 'shipyard');
pin('dock.digit9.epics', DOCK_KEY_SERVICES[8] === 'epics');
pin('dock.noArchiveKey', !DOCK_KEY_SERVICES.includes('archive') && !DOCK_KEY_SERVICES.includes('data'));
pin('bio.graftPending', stationSrc.includes('graftPending') && stationSrc.includes('cancelGraftPending'));
pin('bio.noInnerHTML', !/innerHTML/.test(stationSrc));

const ladder = standingLadderLines();
const ladderText = ladder.join(' / ');
pin('ladder.sworn50', ladder.includes('Sworn 50'));
pin('ladder.trusted25', ladder.includes('Trusted 25'));
pin('ladder.known10', ladder.includes('Known 10'));
pin('ladder.stranger', ladder.some((l) => l.startsWith('Stranger') && l.includes('-10')));
pin('ladder.suspect', ladder.some((l) => l.startsWith('Suspect') && l.includes('-25')));
pin('ladder.marked', ladder.some((l) => l.startsWith('Marked') && l.includes('-1000')));
pin('ladder.fromRANK_LADDER', ladder.length === RANK_LADDER.length);

const live = standingLiveNotes().join(' | ');
const moves = standingMoveNotes().join(' | ');
pin('digit9.hunt', live.includes('hunt'));
pin('digit9.yard', live.includes('Yards refuse') && live.includes('below 0'));
pin('digit9.aceFrigate', live.includes('Ace') && live.includes('Frigate'));
pin('digit9.discount', live.includes('5/10/15%'));
pin('digit9.lockerMarked', live.includes('Marked') && live.includes('Suspect') && live.includes('-25'));
pin('digit9.graftCap', live.includes('min(current, -10)') && moves.includes('grafted row'));
pin('digit9.miningPatrol', live.includes('Mining') && live.includes('Patrol'));
pin('digit9.noPolice', !live.toLowerCase().includes('police') && !live.toLowerCase().includes('restitution'));
pin('nextRung.known', nextStandingRung(0)?.name === 'Known' && nextStandingRung(0)?.min === 10);

const stuffed = {
  world: { prices: { dataCube: 9999, dataCrystal: 8888, survivor: 7777 } },
};
pin('priceOf.dataCube.0', priceOf(stuffed, 'dataCube') === 0);
pin('priceOf.dataCrystal.0', priceOf(stuffed, 'dataCrystal') === 0);

pin('archive.assembly', archiveDeskAllowed('assembly') === true);
pin('archive.freehold', archiveDeskAllowed('freehold') === false);
pin('archive.gilded', archiveDeskAllowed('gilded') === false);
pin('archive.independent', archiveDeskAllowed('independent') === false);
pin('archive.hollow', archiveDeskAllowed('hollow') === false);
pin('archive.beautiful', archiveDeskAllowed('beautiful') === false);
pin('archive.unknowables', archiveDeskAllowed('unknowables') === false);
pin('archive.proto', archiveDeskAllowed('__proto__') === false);

function collectDesk(faction, ui, cargo) {
  const texts = [];
  const h = (_tag, _cls, parent, text) => {
    if (text !== undefined) texts.push(String(text));
    const node = { children: [] };
    if (parent && parent.children) parent.children.push(node);
    return node;
  };
  const btns = [];
  const btn = (parent, label, onClick) => {
    btns.push({ label, onClick });
    texts.push(String(label));
    return {};
  };
  const panel = { children: [] };
  const ctx = { cargo, settings: { reducedMotion: true }, world: { credits: 400 } };
  renderArchiveDesk(h, btn, panel, ctx, ui, faction, () => {});
  return { texts: texts.join('\n'), btns, ctx };
}

const uiAsm = { level: 2, service: 'market', dataPending: null, notice: '' };
const asm = collectDesk('assembly', uiAsm, []);
pin('desk.assembly.shows', asm.texts.includes('ARCHIVE') && asm.texts.includes('cube'));
pin('desk.assembly.noPay', asm.texts.includes('UU unset'));

const uiFh = { level: 2, service: 'market', dataPending: null, notice: '' };
const fh = collectDesk('freehold', uiFh, []);
pin('desk.freehold.hidden', !fh.texts.includes('ARCHIVE') && fh.btns.length === 0);

const uiWrong = { level: 1, service: 'market', dataPending: null, notice: '' };
const wrongLevel = collectDesk('assembly', uiWrong, []);
pin('desk.level2.gate', !wrongLevel.texts.includes('ARCHIVE'));

const uiPeople = { level: 2, service: 'people', dataPending: null, notice: '' };
const people = collectDesk('assembly', uiPeople, []);
pin('desk.notPeople', !people.texts.includes('ARCHIVE'));

const captured = {
  commodity: 'dataCube',
  units: 2,
  source: 'captured',
  originFaction: 'assembly',
};
const uiCap = { level: 2, service: 'market', dataPending: null, notice: '', dataBusy: false };
const cap = collectDesk('assembly', uiCap, [captured]);
pin('desk.illegal.refuse', cap.texts.includes('illegal in origin') && cap.texts.includes('Filing refused'));
pin('desk.illegal.noSellBtn', !cap.btns.some((b) => String(b.label).includes('File from the hold')));

const legal = {
  commodity: 'dataCube',
  units: 1,
  source: 'legal',
  originFaction: 'assembly',
};
const uiBuy = {
  level: 2,
  service: 'market',
  dataPending: { verb: 'buy', commodity: 'dataCube', source: 'legal', originFaction: 'assembly' },
  notice: '',
  dataBusy: false,
};
const buyCtx = {
  cargo: [JSON.parse(JSON.stringify(legal))],
  world: { credits: 500 },
};
const creditsBefore = buyCtx.world.credits;
const cargoBefore = JSON.stringify(buyCtx.cargo);
confirmArchivePending(buyCtx, uiBuy);
pin('confirm.noCredit', buyCtx.world.credits === creditsBefore);
pin('confirm.noCargo', JSON.stringify(buyCtx.cargo) === cargoBefore);
pin('confirm.uuNotice', typeof uiBuy.notice === 'string' && uiBuy.notice.includes('UU unset'));
pin('confirm.clearsPending', uiBuy.dataPending === null);

const uiIllegal = {
  level: 2,
  service: 'market',
  dataPending: { verb: 'sell', commodity: 'dataCube', source: 'captured', originFaction: 'assembly' },
  notice: '',
  dataBusy: false,
};
const illCtx = {
  cargo: [JSON.parse(JSON.stringify(captured))],
  world: { credits: 500 },
};
confirmArchivePending(illCtx, uiIllegal);
pin('illegal.noFlip', illCtx.cargo[0].source === 'captured' && illCtx.cargo[0].originFaction === 'assembly');
pin('illegal.noCredit', illCtx.world.credits === 500);
pin('illegal.unitsStay', illCtx.cargo[0].units === 2);

const uiCancel = { dataPending: { verb: 'buy', commodity: 'dataCube', source: 'legal', originFaction: 'assembly' }, notice: 'x' };
pin('cancel.dataPending', cancelDataPending(uiCancel) === true && uiCancel.dataPending === null);

pin('src.standingRead', stationSrc.includes('standingRead('));
pin('src.noReputationChanged', !stationSrc.includes("'reputationChanged'"));
const confirmBody = stationSrc.slice(
  stationSrc.indexOf('export function confirmArchivePending'),
  stationSrc.indexOf('export function renderArchiveDesk'),
);
pin('src.noTryTradeDataPay', !confirmBody.includes('tryTrade') && !confirmBody.includes('addCargo') && !confirmBody.includes('removeCargo') && !confirmBody.includes('holdUnits') && !confirmBody.includes('credits'));
pin('src.priceOfData', stationSrc.includes('isDataCommodity(key)') && stationSrc.includes('return 0'));

if (fails.length) {
  console.error(`FAIL ${fails.length}/${Object.keys(results).length}`);
  process.exitCode = 1;
} else {
  console.log(`OK ${Object.keys(results).length} pins`);
}
