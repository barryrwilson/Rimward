import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FACTIONS } from '../../../src/game/state.js';
import { trafficLots, applySurvivorSale, TRAFFIC_LIST_UU } from '../../../src/game/trafficking.js';
import {
  priceOf,
  DOCK_KEY_SERVICES,
  renderTrafficDesk,
  cancelTrafficPending,
} from '../../../src/systems/station.js';

const here = dirname(fileURLToPath(import.meta.url));
const stationSrc = readFileSync(join(here, '../../../src/systems/station.js'), 'utf8');

const results = {};

function row(faction, source, units, extra = {}) {
  return { commodity: 'survivor', faction, source, units, ...extra };
}

function makeCtx(opts = {}) {
  const events = [];
  const world = {
    credits: 100,
    fear: 0,
    reputation: { freehold: 0, gilded: 0 },
    milestones: [],
    prices: {},
    ...(opts.world ?? {}),
  };
  return {
    cargo: opts.cargo ?? [],
    cargoCapacity: opts.cargoCapacity ?? 20,
    settings: opts.settings ?? {},
    world,
    emit(type, payload) { events.push({ type, payload }); },
    events,
  };
}

function tree() {
  return { tag: 'div', cls: '', text: '', children: [] };
}

function h(tag, cls, parent, text) {
  const node = { tag, cls: cls || '', text: text ?? '', children: [] };
  if (parent) parent.children.push(node);
  return node;
}

function btn(parent, label, onClick, cls) {
  const node = h('button', cls || 'screen-btn', parent, label);
  node.onClick = onClick;
  return node;
}

function texts(node, acc = []) {
  if (node.text) acc.push(String(node.text));
  for (const c of node.children ?? []) texts(c, acc);
  return acc;
}

function buttons(node, acc = []) {
  if (node.tag === 'button') acc.push(node);
  for (const c of node.children ?? []) buttons(c, acc);
  return acc;
}

function draw(ctx, ui, dockFaction) {
  const panel = tree();
  renderTrafficDesk(h, btn, panel, ctx, ui, dockFaction, () => {});
  return panel;
}

const stuffed = { world: { prices: { survivor: 999, rawOre: 140 } } };
results.priceOfSurvivorZero = priceOf(stuffed, 'survivor') === 0;
results.priceOfSurvivorStuffed = stuffed.world.prices.survivor === 999
  && priceOf({ world: { prices: { survivor: 999 } } }, 'survivor') === 0;
results.priceOfOreUnchanged = priceOf(stuffed, 'rawOre') === 140;

results.dockKeyCount10 = DOCK_KEY_SERVICES.length === 10;
results.dockKeyLastShipyard = DOCK_KEY_SERVICES[9] === 'shipyard'
  && DOCK_KEY_SERVICES.at(-1) === 'shipyard';
results.dockKeyPeopleIndex6 = DOCK_KEY_SERVICES[6] === 'people';
results.dockKeyNoEleventh = !DOCK_KEY_SERVICES.includes('services')
  && DOCK_KEY_SERVICES.filter((k) => k === 'people').length === 1;

results.traffickingImport = typeof trafficLots === 'function'
  && typeof applySurvivorSale === 'function'
  && TRAFFIC_LIST_UU.other === 160
  && TRAFFIC_LIST_UU.playerKill === 240;

results.tryTradeRefuseStill = /key === 'survivor'/.test(stationSrc)
  && stationSrc.includes('This dock does not trade in people.');
results.removeCargoSurvivorNoop = /function removeCargo[\s\S]*?if \(commodity === 'survivor'\) return;/.test(stationSrc);
results.priceOfFirstLineSurvivor = /export function priceOf\(ctx, key\) \{\s*if \(key === 'survivor'\) return 0;/.test(stationSrc);
results.peopleHasNoDigitHandler = !/ui\.service === 'people'/.test(
  stationSrc.slice(stationSrc.indexOf("if (ui.service === 'jobs')")),
);
results.level1RescueOnly = /if \(ui\.level === 1\) \{[\s\S]*?renderRescue\(panel\);\s*h\('div', 'screen-legend'/.test(stationSrc);
results.renderPeopleCallsDeskAfterRescue = /function renderPeople\(panel\) \{[\s\S]*?renderRescue\(panel\);\s*renderTrafficDesk\(/.test(stationSrc);
results.noWorldFieldsAdd = !stationSrc.includes('WORLD_FIELDS');

{
  const ctx = makeCtx({
    cargo: [row('freehold', 'other', 2, { name: '<img src=x onerror=alert(1)>' })],
  });
  const ui = { level: 1, service: 'people', trafficPending: null, notice: '' };
  const panel = draw(ctx, ui, 'gilded');
  results.gateLevel1NoNodes = panel.children.length === 0;
}

{
  const ctx = makeCtx({ cargo: [row('freehold', 'other', 2)] });
  const ui = { level: 2, service: 'market', trafficPending: null, notice: '' };
  results.gateWrongService = draw(ctx, ui, 'gilded').children.length === 0;
}

{
  const ctx = makeCtx({ cargo: [row('freehold', 'other', 2)] });
  const ui = { level: 2, service: 'people', trafficPending: null, notice: '' };
  const panel = draw(ctx, ui, 'freehold');
  results.nonGildedNoChrome = panel.children.length === 0
    && !texts(panel).some((t) => t.includes('Offer') || t.includes('desk'));
}

{
  const ctx = makeCtx({ cargo: [] });
  const ui = { level: 2, service: 'people', trafficPending: null, notice: '' };
  results.emptyHoldNoChrome = draw(ctx, ui, 'gilded').children.length === 0;
}

{
  const ctx = makeCtx({
    cargo: [
      row('unknowables', 'other', 2),
      { commodity: 'survivor', units: 3, faction: '__proto__', source: 'other' },
    ],
  });
  const ui = { level: 2, service: 'people', trafficPending: null, notice: '' };
  const panel = draw(ctx, ui, 'gilded');
  const t = texts(panel);
  results.ineligibleRefuse = t.includes('The desk will not take them.')
    && !t.some((s) => s.includes('Offer'))
    && trafficLots(ctx).length === 0;
}

{
  const xss = '<img src=x onerror=alert(1)>';
  const ctx = makeCtx({
    cargo: [row('freehold', 'other', 2, { name: xss })],
  });
  const ui = { level: 2, service: 'people', trafficPending: null, notice: '' };
  const panel = draw(ctx, ui, 'gilded');
  const t = texts(panel);
  const fname = FACTIONS.freehold.name;
  results.offerLotLine = t.includes(`2 ${fname} · recovered · 160 UU each`);
  results.offerArmLabel = buttons(panel).some((b) => b.text === 'Offer to the Chain');
  results.blockNote = t.includes('The Chain keeps a transfer desk. They pay for people still in the hold.');
  results.noRowName = !t.some((s) => s.includes(xss) || s.includes('img') || s.includes('alert'));
  results.noRawFactionId = !t.some((s) => /\bfreehold\b/.test(s));
  results.noForbiddenCopy = !t.some((s) => /slave|meat|stock|bargain|special|debug/i.test(s));

  const offer = buttons(panel).find((b) => b.text === 'Offer to the Chain');
  offer.onClick();
  results.pendingAllowlist = ui.trafficPending
    && ui.trafficPending.faction === 'freehold'
    && ui.trafficPending.source === 'other'
    && Object.keys(ui.trafficPending).sort().join(',') === 'faction,source';

  const armed = draw(ctx, ui, 'gilded');
  const at = texts(armed);
  results.confirmMeta = at.includes('2 · 320 UU · Confirm transfer');
  results.confirmButton = buttons(armed).some((b) => b.text === 'Confirm transfer');
  results.cancelLabel = buttons(armed).some((b) => b.text === 'Esc — Cancel');

  const confirm = buttons(armed).find((b) => b.text === 'Confirm transfer');
  confirm.onClick();
  results.confirmPaysList = ctx.world.credits === 100 + 320
    && ctx.cargo.length === 0
    && ui.notice === 'The Chain takes them. 2 transferred. 320 UU.'
    && ui.trafficPending === null;
}

{
  const ctx = makeCtx({
    cargo: [row('freehold', 'playerKill', 1)],
    settings: { reducedMotion: true },
  });
  const ui = { level: 2, service: 'people', trafficPending: null, notice: '' };
  const panel = draw(ctx, ui, 'gilded');
  const t = texts(panel);
  results.reducedBlock = t.includes('Transfer desk.');
  results.reducedLot = t.includes('1 · 240 UU');
  results.reducedArm = buttons(panel).some((b) => b.text === 'Offer');
  const offer = buttons(panel).find((b) => b.text === 'Offer');
  offer.onClick();
  const armed = draw(ctx, ui, 'gilded');
  results.reducedConfirmMeta = texts(armed).includes('240 UU · Confirm');
}

{
  const ctx = makeCtx({ cargo: [row('gilded', 'other', 1)] });
  const ui = {
    level: 2,
    service: 'people',
    trafficPending: { faction: 'gilded', source: 'other' },
    notice: '',
  };
  const before = ctx.world.credits;
  const panel = draw(ctx, ui, 'freehold');
  results.liveDockNotPendingBuyer = panel.children.length === 0;
  const confirmUi = {
    level: 2,
    service: 'people',
    trafficPending: { faction: 'gilded', source: 'other' },
    notice: '',
    trafficBusy: false,
  };
  const armed = draw(ctx, confirmUi, 'gilded');
  const confirm = buttons(armed).find((b) => b.text === 'Confirm transfer');
  ctx.world.credits = before;
  confirm.onClick();
  results.confirmUsesLiveGilded = ctx.world.credits === before + 160;
}

{
  const ctx = makeCtx({ cargo: [row('freehold', 'other', 1)] });
  const ui = {
    level: 2,
    service: 'people',
    trafficPending: { faction: 'freehold', source: 'other' },
    notice: 'kept',
    trafficBusy: true,
  };
  const panel = draw(ctx, ui, 'gilded');
  const confirm = buttons(panel).find((b) => b.text === 'Confirm transfer');
  confirm.onClick();
  results.busyNoDebit = ctx.world.credits === 100
    && ctx.cargo.length === 1
    && ui.trafficPending?.faction === 'freehold'
    && ui.notice === 'kept';
}

{
  const ctx = makeCtx({ cargo: [] });
  const ui = {
    level: 2,
    service: 'people',
    trafficPending: { faction: 'freehold', source: 'other' },
    notice: '',
  };
  const panel = draw(ctx, ui, 'gilded');
  results.vanishedClearsPending = ui.trafficPending === null
    && ui.notice === 'They are no longer in the hold.'
    && !buttons(panel).some((b) => b.text === 'Confirm transfer');
}

{
  const ui = { trafficPending: { faction: 'freehold', source: 'other' }, notice: 'x' };
  results.cancelPending = cancelTrafficPending(ui) === true
    && ui.trafficPending === null
    && ui.notice === '';
  results.cancelEmpty = cancelTrafficPending(ui) === false;
}

{
  const ctx = makeCtx({ cargo: [row('freehold', 'other', 1)] });
  const ui = {
    level: 2,
    service: 'people',
    trafficPending: { __proto__: { faction: 'freehold' }, source: 'other' },
    notice: '',
  };
  const panel = draw(ctx, ui, 'gilded');
  results.protoPendingNoConfirm = !buttons(panel).some((b) => b.text === 'Confirm transfer')
    && ui.trafficPending === null;
}

{
  const ctx = makeCtx({ cargo: [row('freehold', 'other', 1)] });
  const ui = {
    level: 2,
    service: 'people',
    trafficPending: { faction: '__proto__', source: 'other' },
    notice: '',
  };
  draw(ctx, ui, 'gilded');
  results.protoFactionPendingDropped = ui.trafficPending === null;
}

{
  const ctx = makeCtx({ cargo: [row('freehold', 'other', 2)] });
  const ui = { level: 2, service: 'people', trafficPending: null, notice: '' };
  const panel = draw(ctx, ui, 'gilded');
  const offer = buttons(panel).find((b) => b.text === 'Offer to the Chain');
  offer.onClick();
  const armed = draw(ctx, ui, 'gilded');
  const confirm = buttons(armed).find((b) => b.text === 'Confirm transfer');
  confirm.onClick();
  const creditsAfter = ctx.world.credits;
  confirm.onClick();
  results.doubleClickNoSecondDebit = creditsAfter === 100 + 320
    && ctx.world.credits === creditsAfter
    && ctx.cargo.length === 0;
}

const failed = Object.entries(results).filter(([, v]) => v !== true);
console.log(JSON.stringify(results, null, 2));
if (failed.length) {
  console.error('FAIL', failed.map(([k]) => k).join(', '));
  process.exit(1);
}
console.log('pr3 probe all-true');
