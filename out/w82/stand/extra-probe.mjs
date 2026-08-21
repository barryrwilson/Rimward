// Verifier extras: double debit, graftBusy, remount, trader/miner, cap leak.
import { createShipState } from '../../../src/game/state.js';
import {
  applyPlayerKillStanding,
  KILL_STANDING_DELTA,
} from '../../../src/game/kill-standing.js';
import { graftMounted, registerPlayerRemount } from '../../../src/game/hangar.js';
import { GRAFT_LIST_UU } from '../../../src/game/shipyard.js';
import {
  GRAFT_REFUSE_LINES,
  renderShipyardDesk,
} from '../../../src/systems/shipyard-desk.js';

const fails = [];
function pin(name, cond, extra = '') {
  if (!cond) fails.push(extra ? `${name}: ${extra}` : name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ` ${extra}` : ''}`);
}

function hull(extra = {}) {
  const role = extra.role ?? 'patrol';
  const faction = extra.faction ?? 'freehold';
  const lastAttacker = extra.lastAttacker ?? 'player';
  const classKey = extra.classKey ?? 'light';
  const state = { destroyed: extra.destroyed !== false, faction, classKey };
  if (extra.grafted === true) state.grafted = true;
  return {
    record: { role, faction, classKey },
    state,
    role,
    classKey,
    ai: { lastAttacker, role, deathHandled: true },
  };
}

function builtRow(id, extra = {}) {
  const row = {
    id,
    hullKind: extra.hullKind ?? 'built',
    classKey: extra.classKey ?? 'light',
    faction: extra.faction ?? 'gilded',
    name: extra.name ?? id,
    scanner: 0,
    miningLaser: 0,
    concealedMounts: false,
    cargoCapacity: 20,
    cargo: [],
  };
  if (extra.grafted === true) row.grafted = true;
  return row;
}

function mockDock(extra = {}) {
  const faction = extra.banner ?? 'gilded';
  const systemId = extra.systemId ?? `${faction}_dock`;
  const player = extra.player ?? createShipState('light', {
    name: 'probe',
    faction: extra.playerFaction ?? 'independent',
  });
  player.hullKind = extra.hullKind ?? 'built';
  if (extra.playerGrafted === true) player.grafted = true;
  return {
    flags: { docked: true, combat: false, paused: false, ...(extra.flags ?? {}) },
    world: {
      currentSystem: systemId,
      credits: Object.hasOwn(extra, 'credits') ? extra.credits : 5000,
      reputation: extra.reputation ?? { gilded: 0 },
      hangar: extra.hangar ?? { mountedId: 'hull_m', hulls: [builtRow('hull_m')] },
      shipName: 'probe',
      scanner: 0,
      miningLaser: 0,
      concealedMounts: false,
    },
    systems: extra.systems ?? { [systemId]: { faction } },
    cargo: [],
    cargoCapacity: 20,
    player,
    gate: extra.gate ?? { jumping: false },
    emit() {},
  };
}

function mounted(ctx) {
  const hangar = ctx.world?.hangar;
  return hangar?.hulls?.find((h) => h.id === hangar.mountedId) ?? null;
}

pin('const.killDelta', KILL_STANDING_DELTA === -5);
pin('const.graftUu', GRAFT_LIST_UU === 4000);
pin('const.creditsLine', GRAFT_REFUSE_LINES.credits === 'Not enough credits.');

{
  const ctx = {
    events: [],
    world: { reputation: { freehold: 10 } },
    emit(type, payload) { this.events.push({ type, ...payload }); },
  };
  applyPlayerKillStanding(ctx, hull({ role: 'trader' }));
  pin('kill.traderNeg5', ctx.world.reputation.freehold === 5);
}
{
  const ctx = {
    events: [],
    world: { reputation: { freehold: 10 } },
    emit(type, payload) { this.events.push({ type, ...payload }); },
  };
  applyPlayerKillStanding(ctx, hull({ role: 'miner' }));
  pin('kill.minerNeg5', ctx.world.reputation.freehold === 5);
}

{
  const ctx = {
    events: [],
    world: { reputation: { freehold: 10, beautiful: -10 } },
    emit() {},
  };
  ctx.world.hangar = { mountedId: 'h1', hulls: [{ id: 'h1', grafted: true, hullKind: 'built' }] };
  const res = applyPlayerKillStanding(ctx, hull({ role: 'patrol', grafted: true }));
  pin('abom.playerGrafted.killOk', res.ok === true);
  pin('abom.playerGrafted.victimNeg5', ctx.world.reputation.freehold === 5);
  pin('abom.playerGrafted.capLeak', ctx.world.reputation.beautiful === -10,
    String(ctx.world.reputation.beautiful));
}

{
  let remounts = 0;
  registerPlayerRemount(() => { remounts += 1; });
  const ctx = mockDock({ credits: 9000 });
  const first = graftMounted(ctx);
  const second = graftMounted(ctx);
  pin('double.firstOk', first.ok === true);
  pin('double.secondAlready', second.ok === false && second.reason === 'already', JSON.stringify(second));
  pin('double.oneDebit', ctx.world.credits === 5000, String(ctx.world.credits));
  pin('double.noRemount', remounts === 0, String(remounts));
  pin('double.flagOnce', mounted(ctx)?.grafted === true && ctx.player.grafted === true);
  registerPlayerRemount(null);
}

{
  const ctx = mockDock({ credits: 8000 });
  const ui = { shipyardPane: 'hangar', graftPending: { mountedId: 'hull_m' }, notice: '' };
  const clicks = [];
  function paint() {
    const root = { children: [] };
    clicks.length = 0;
    const h = (_tag, _cls, parent, text) => {
      const n = { text, children: [] };
      if (parent && parent.children) parent.children.push(n);
      return n;
    };
    const btn = (parent, label, fn) => {
      const n = { label, fn };
      clicks.push(n);
      if (parent && parent.children) parent.children.push(n);
      return n;
    };
    renderShipyardDesk(h, btn, root, ctx, ui, paint);
    return root;
  }
  paint();
  const confirm = clicks.find((b) => b.label === 'Confirm graft');
  pin('desk.confirmPresent', !!confirm);
  confirm.fn();
  pin('desk.firstDebit4000', ctx.world.credits === 4000, String(ctx.world.credits));
  pin('desk.firstGrafted', mounted(ctx)?.grafted === true);
  const beforeSecond = ctx.world.credits;
  confirm.fn();
  pin('desk.secondNoDebit', ctx.world.credits === beforeSecond);
  pin('desk.secondNoticeMissing', ui.notice === 'That hull is not in the hangar.'
    || ui.notice === GRAFT_REFUSE_LINES.missing
    || ui.graftPending == null);
}

{
  const ctx = mockDock({ credits: 8000 });
  const ui = {
    shipyardPane: 'hangar',
    graftPending: { mountedId: 'hull_m' },
    graftBusy: true,
    notice: '',
  };
  const clicks = [];
  const h = (_tag, _cls, parent, text) => {
    const n = { text, children: [] };
    if (parent && parent.children) parent.children.push(n);
    return n;
  };
  const btn = (parent, label, fn) => {
    clicks.push({ label, fn });
    return { label, fn };
  };
  renderShipyardDesk(h, btn, { children: [] }, ctx, ui, () => {});
  const confirm = clicks.find((b) => b.label === 'Confirm graft');
  pin('busy.confirmPresent', !!confirm);
  confirm.fn();
  pin('busy.noDebit', ctx.world.credits === 8000);
  pin('busy.noFlag', mounted(ctx)?.grafted !== true);
  pin('busy.pendingKept', ui.graftPending && ui.graftPending.mountedId === 'hull_m');
}

{
  const ctx = mockDock({ credits: 3999 });
  const ui = { shipyardPane: 'hangar', graftPending: { mountedId: 'hull_m' }, notice: '' };
  const clicks = [];
  const h = (_tag, _cls, parent) => {
    const n = { children: [] };
    if (parent && parent.children) parent.children.push(n);
    return n;
  };
  const btn = (parent, label, fn) => {
    clicks.push({ label, fn });
    return { label, fn };
  };
  renderShipyardDesk(h, btn, { children: [] }, ctx, ui, () => {});
  clicks.find((b) => b.label === 'Confirm graft').fn();
  pin('short.noticeCredits', ui.notice === GRAFT_REFUSE_LINES.credits, String(ui.notice));
  pin('short.creditsStay3999', ctx.world.credits === 3999);
}

if (fails.length) {
  console.log(`FAIL count=${fails.length}`);
  for (const f of fails) console.log(`  ${f}`);
  process.exitCode = 1;
} else {
  console.log('PASS extra all');
}
