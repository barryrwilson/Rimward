import { sanitizeHangar, switchTo, graftMounted } from '../game/hangar.js';
import {
  dockFactionOf,
  dockReputation,
  GRAFT_LIST_UU,
  listYardOffers,
  purchaseYardHull,
  yardPrice,
  yardStockFor,
} from '../game/shipyard.js';
import { FACTIONS, SHIP_CLASSES } from '../game/state.js';
import { requestAutosave } from '../game/save.js';

/** Desk panes. Digit 1 Hangar, Digit 2 Yard. Not dock services. */
export const SHIPYARD_PANE_HANGAR = 'hangar';
export const SHIPYARD_PANE_BUY = 'buy';

export const SWITCH_REFUSE_LINES = Object.freeze({
  'not-docked': 'Dock first to switch hulls.',
  combat: 'Cannot switch in combat.',
  jump: 'Cannot switch during a jump.',
  destroyed: 'That hull is gone.',
  paused: 'Cannot switch while paused.',
  missing: 'That hull is not in the hangar.',
  'already-mounted': 'That hull is already mounted.',
  failed: 'The yard could not remount that hull.',
});

export const BUY_REFUSE_LINES = Object.freeze({
  full: 'The hangar is full.',
  credits: 'Not enough credits.',
  reputation: 'No sale.',
  stock: 'This dock has no hull catalog. No sale.',
  dock: 'Dock first to buy a hull.',
  release: 'The yard cannot release this hull yet.',
  busy: 'Papers are already in flight.',
  invalid: 'The yard cannot release this hull yet.',
});

export function switchRefuseLine(reason) {
  return SWITCH_REFUSE_LINES[reason] ?? 'Cannot switch that hull.';
}

export function buyRefuseLine(reason) {
  return BUY_REFUSE_LINES[reason] ?? 'No sale.';
}

export const GRAFT_REFUSE_LINES = Object.freeze({
  dock: 'Dock first to graft this hull.',
  combat: 'Cannot graft in combat.',
  jump: 'Cannot graft during a jump.',
  destroyed: 'That hull is gone.',
  paused: 'Cannot graft while paused.',
  missing: 'That hull is not in the hangar.',
  living: 'Grafts fit plated hulls only.',
  already: 'This hull is already grafted.',
  banner: 'The Chain does not graft here.',
  reputation: 'No sale.',
  credits: 'Not enough credits.',
  busy: 'The graft is already in flight.',
});

export const GRAFT_WARN =
  'Beautiful Ones become immediate enemies. Patrols hunt at standing -10 or worse.';
export const GRAFT_WARN_REDUCED = 'Beautiful Ones become enemies.';

export function graftRefuseLine(reason) {
  return GRAFT_REFUSE_LINES[reason] ?? 'Cannot graft that hull.';
}

export function shipyardPaneOf(ui) {
  return ui?.shipyardPane === SHIPYARD_PANE_BUY ? SHIPYARD_PANE_BUY : SHIPYARD_PANE_HANGAR;
}

export function setShipyardPane(ui, pane) {
  if (!ui) return;
  ui.shipyardPane = pane === SHIPYARD_PANE_BUY ? SHIPYARD_PANE_BUY : SHIPYARD_PANE_HANGAR;
  if (ui.shipyardPane !== SHIPYARD_PANE_BUY) ui.yardPending = null;
  if (ui.shipyardPane !== SHIPYARD_PANE_HANGAR) ui.graftPending = null;
}

export function cancelYardPending(ui) {
  if (!ui?.yardPending) return false;
  ui.yardPending = null;
  ui.notice = '';
  return true;
}

export function cancelGraftPending(ui) {
  if (!ui?.graftPending) return false;
  ui.graftPending = null;
  ui.notice = '';
  return true;
}

function factionLabel(faction) {
  return FACTIONS[faction]?.name ?? faction ?? 'Independent';
}

function classLabel(classKey) {
  return Object.prototype.hasOwnProperty.call(SHIP_CLASSES, classKey) ? classKey : 'light';
}

function hullDigitLabel(index) {
  if (index === 7) return '0';
  return String(index + 3);
}

function hullIndexForDigit(n) {
  if (n === 0) return 7;
  if (n >= 3) return n - 3;
  return -1;
}

function offerAtDigit(ctx, n) {
  const idx = hullIndexForDigit(n);
  if (idx < 0) return null;
  return listYardOffers(ctx)[idx] ?? null;
}

function setYardPending(ui, classKey) {
  ui.yardPending = { classKey };
  ui.notice = '';
}

function confirmYardBuy(ctx, ui) {
  const classKey = ui.yardPending?.classKey;
  ui.yardPending = null;
  const result = purchaseYardHull(ctx, classKey);
  ui.notice = result.ok
    ? 'Papers filed. Hull stored in hangar.'
    : buyRefuseLine(result.reason);
  return result;
}

function mountedHangarRowOf(ctx) {
  const hangar = ctx?.world?.hangar;
  if (!hangar || !Array.isArray(hangar.hulls)) return null;
  return hangar.hulls.find((h) => h.id === hangar.mountedId) ?? null;
}

function graftOfferVisible(ctx) {
  if (dockFactionOf(ctx) !== 'gilded') return false;
  if (dockReputation(ctx, 'gilded') < 0) return false;
  const row = mountedHangarRowOf(ctx);
  if (!row) return false;
  if (row.hullKind !== 'built') return false;
  if (row.faction === 'unknowables') return false;
  if (row.grafted === true) return false;
  return true;
}

function setGraftPending(ui, ctx) {
  ui.graftPending = { mountedId: ctx?.world?.hangar?.mountedId ?? '' };
  ui.notice = '';
}

function confirmGraft(ctx, ui) {
  if (ui.graftBusy) return { ok: false, reason: 'busy' };
  const pending = ui.graftPending;
  if (!pending) return { ok: false, reason: 'missing' };
  ui.graftBusy = true;
  try {
    ui.graftPending = null;
    if (pending.mountedId && pending.mountedId !== ctx.world?.hangar?.mountedId) {
      ui.notice = graftRefuseLine('missing');
      return { ok: false, reason: 'missing' };
    }
    const result = graftMounted(ctx);
    if (result.ok) {
      ui.notice = 'Tissue sealed to the hull.';
      requestAutosave(ctx);
    } else {
      ui.notice = graftRefuseLine(result.reason);
    }
    return result;
  } finally {
    ui.graftBusy = false;
  }
}

function renderBuyPane(h, btn, panel, ctx, ui, redraw) {
  const yard = h('div', 'shipyard-buy', panel);
  h('div', 'screen-sub', yard, 'YARD');
  const faction = dockFactionOf(ctx);
  const stock = yardStockFor(faction);
  const offers = listYardOffers(ctx);
  if (stock.length === 0 || offers.length === 0) {
    h('div', 'screen-note shipyard-empty', yard, 'This dock has no hull catalog. No sale.');
    return;
  }

  const rep = dockReputation(ctx, faction);
  h('div', 'screen-note shipyard-buy-flag', yard, factionLabel(faction));

  const pendingKey = ui.yardPending?.classKey;
  const pending = pendingKey && offers.find((o) => o.classKey === pendingKey);
  if (pending) {
    const price = yardPrice(pending.classKey, rep);
    const box = h('div', 'shipyard-buy-row shipyard-confirm', yard);
    h('div', 'shipyard-buy-name', box, classLabel(pending.classKey));
    h('div', 'shipyard-buy-meta', box, `${price} UU · Confirm papers`);
    btn(box, 'Confirm papers', () => {
      confirmYardBuy(ctx, ui);
      redraw();
    }, 'screen-btn screen-btn-warm');
    btn(box, 'Esc — Cancel', () => {
      cancelYardPending(ui);
      redraw();
    });
    return;
  }

  if (rep < 0) {
    h('div', 'screen-note shipyard-empty', yard, 'No sale.');
  }

  offers.forEach((offer, i) => {
    if (i > 7) return;
    const price = yardPrice(offer.classKey, rep);
    const card = h('div', 'shipyard-buy-row', yard);
    h('div', 'shipyard-buy-name', card, classLabel(offer.classKey));
    h('div', 'shipyard-buy-meta', card, `${price} UU`);
    btn(card, `${hullDigitLabel(i)} — Papers`, () => {
      setYardPending(ui, offer.classKey);
      redraw();
    });
  });
}

function renderHangarPane(h, btn, panel, ctx, ui, redraw) {
  sanitizeHangar(ctx);
  const hangar = ctx.world.hangar;
  const mountedId = hangar?.mountedId ?? '';
  const hulls = Array.isArray(hangar?.hulls) ? hangar.hulls : [];
  h('div', 'screen-sub', panel, 'HANGAR');
  h('div', 'screen-note shipyard-mounted', panel, `Mounted id ${mountedId}`);
  if (ui.graftPending) {
    const reduced = ctx?.settings?.reducedMotion === true;
    const box = h('div', 'shipyard-buy-row shipyard-confirm', panel);
    h('div', 'shipyard-buy-name', box, 'Graft tissue');
    h('div', 'shipyard-buy-meta', box,
      `${GRAFT_LIST_UU} UU · ${reduced ? GRAFT_WARN_REDUCED : GRAFT_WARN}`);
    btn(box, 'Confirm graft', () => {
      confirmGraft(ctx, ui);
      redraw();
    }, 'screen-btn screen-btn-warm');
    btn(box, 'Esc — Cancel', () => {
      cancelGraftPending(ui);
      redraw();
    });
    return;
  }
  hulls.forEach((row, i) => {
    const card = h('div', 'shipyard-hull', panel);
    const name = row.name || SHIP_CLASSES[row.classKey]?.role || 'hull';
    const mounted = row.id === mountedId ? ' · mounted' : '';
    h('div', 'shipyard-hull-name', card, name);
    h('div', 'shipyard-hull-meta', card,
      `${classLabel(row.classKey)} · ${factionLabel(row.faction)}${mounted}`);
    if (i > 7) return;
    btn(card, `${hullDigitLabel(i)} — Mount`, () => {
      const result = switchTo(ctx, row.id);
      ui.notice = result.ok ? `Mounted ${name}.` : switchRefuseLine(result.reason);
      redraw();
    });
  });
  if (!graftOfferVisible(ctx)) return;
  const card = h('div', 'shipyard-buy-row', panel);
  h('div', 'shipyard-buy-name', card, 'Graft tissue');
  h('div', 'shipyard-buy-meta', card, `${GRAFT_LIST_UU} UU · Mounted plated hull.`);
  btn(card, 'Offer graft', () => {
    setGraftPending(ui, ctx);
    redraw();
  });
}

/** Render Hangar + Yard panes. Host supplies h/btn and redraw. */
export function renderShipyardDesk(h, btn, panel, ctx, ui, redraw) {
  sanitizeHangar(ctx);
  const pane = shipyardPaneOf(ui);
  h('div', 'screen-sub', panel, 'SHIPYARD');
  h('div', 'screen-note', panel, 'Hangar at every dock. Yard sales wait on papers.');
  const tabs = h('div', 'screen-btnrow shipyard-tabs', panel);
  btn(tabs, '1 — Hangar', () => {
    setShipyardPane(ui, SHIPYARD_PANE_HANGAR);
    ui.notice = '';
    redraw();
  }, pane === SHIPYARD_PANE_HANGAR ? 'screen-btn screen-btn-warm' : 'screen-btn');
  btn(tabs, '2 — Yard', () => {
    setShipyardPane(ui, SHIPYARD_PANE_BUY);
    ui.notice = '';
    redraw();
  }, pane === SHIPYARD_PANE_BUY ? 'screen-btn screen-btn-warm' : 'screen-btn');
  if (pane === SHIPYARD_PANE_BUY) renderBuyPane(h, btn, panel, ctx, ui, redraw);
  else renderHangarPane(h, btn, panel, ctx, ui, redraw);
  h('div', 'screen-note shipyard-legend', panel,
    '1 Hangar · 2 Yard · 3+ hull on Hangar · 3+ papers on Yard · 0 last row · Esc back');
}

/**
 * Level-2 digits. Re-read the pane at keydown.
 * 1 Hangar, 2 Yard. 3+ (and 0 as row 8) index the active pane only.
 * Yard Digit 3+ selects papers. It does not debit. Confirm papers buys.
 */
export function handleShipyardDigit(n, ctx, ui) {
  if (n === 1) {
    setShipyardPane(ui, SHIPYARD_PANE_HANGAR);
    ui.notice = '';
    return true;
  }
  if (n === 2) {
    setShipyardPane(ui, SHIPYARD_PANE_BUY);
    ui.notice = '';
    return true;
  }
  if (shipyardPaneOf(ui) === SHIPYARD_PANE_BUY) {
    if (ui.yardPending) return true;
    const offer = offerAtDigit(ctx, n);
    if (!offer) return false;
    setYardPending(ui, offer.classKey);
    return true;
  }
  if (ui.graftPending) return true;
  const idx = hullIndexForDigit(n);
  if (idx < 0) return false;
  sanitizeHangar(ctx);
  const row = ctx.world?.hangar?.hulls?.[idx];
  if (!row) return false;
  const result = switchTo(ctx, row.id);
  const name = row.name || SHIP_CLASSES[row.classKey]?.role || 'hull';
  ui.notice = result.ok ? `Mounted ${name}.` : switchRefuseLine(result.reason);
  return true;
}
