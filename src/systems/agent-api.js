/**
 * Agent play handle v2. Owns ctx.agent (session; not persist; not a helm).
 * Does not write ctx.input, ship transform, credits, or flags.berthHold.
 * v2: full station-service parity (owner-authorized), the controls-owned
 * manual-control lease, capability discovery, and reqId/t outcome receipts.
 */

import { COMMODITIES } from '../game/state.js';
import { plotRoute, clearRoute, sanitizeSystemId } from '../game/nav.js';
import {
  tryEngage,
  tryApproachDock,
  disengage,
  apLine,
  dockApproachLine,
} from '../game/autopilot.js';
import { tryEngageAutomine, disengageAutomine, amLine } from '../game/automine.js';
import { tryEngageFlee } from '../game/agent-flee.js';
import { hailDigitsAllowed } from './overlay-policy.js';
import { agentPulse, agentSelectTarget, agentSetWeaponGroup, agentClearFullStop, agentControlSet, agentControlClear } from './controls.js';
import { buildObservation } from '../game/agent-observe.js';
import {
  VERSION,
  EVENT_CAP,
  emptyLastIntent,
  noCtxObservation,
  actResult,
  sanitizeEvent,
  pushRing,
  isForbiddenName,
  isDockService,
  isLiveCommand,
  reservedName,
  noteSessionEvent,
  str,
} from '../game/agent-schema.js';

const FEED_KINDS = new Set(['biomass', 'rock', 'tend']);
const PULSE_EDGES = new Set(['dock', 'hail', 'target', 'reticleLock']);
const DESK_NEED = Object.freeze({
  acceptJob: 'jobs',
  trade: 'market',
  repairAll: 'repair',
  feed: 'feed',
});

function hostWindow() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.window) return globalThis.window;
  } catch {
    /* ignore */
  }
  return typeof globalThis !== 'undefined' ? globalThis : null;
}

function queryOptIn() {
  try {
    const w = hostWindow();
    const loc = (typeof globalThis !== 'undefined' && globalThis.location)
      || (w && w.location)
      || null;
    if (!loc) return false;
    let search = '';
    if (typeof loc.search === 'string' && loc.search) search = loc.search;
    else if (typeof loc.href === 'string') {
      const href = loc.href;
      const q = href.indexOf('?');
      if (q >= 0) {
        const hash = href.indexOf('#', q);
        search = hash >= 0 ? href.slice(q, hash) : href.slice(q);
      }
    }
    if (!search) return false;
    const raw = search.charAt(0) === '?' ? search.slice(1) : search;
    const sp = new URLSearchParams(raw);
    return sp.get('agent') === '1';
  } catch {
    return false;
  }
}

function ensureAgent(ctx) {
  if (!ctx || typeof ctx !== 'object') return null;
  if (!ctx.agent || typeof ctx.agent !== 'object') {
    ctx.agent = { optIn: false, lastIntent: emptyLastIntent(), events: [] };
    return ctx.agent;
  }
  if (ctx.agent.optIn !== true) ctx.agent.optIn = false;
  if (!Array.isArray(ctx.agent.events)) ctx.agent.events = [];
  if (!ctx.agent.lastIntent || typeof ctx.agent.lastIntent !== 'object') {
    ctx.agent.lastIntent = emptyLastIntent();
  }
  return ctx.agent;
}

function harvest(ctx) {
  const agent = ensureAgent(ctx);
  if (!agent) return;
  const queue = ctx.events;
  if (!Array.isArray(queue)) return;
  for (let i = 0; i < queue.length; i++) {
    const row = sanitizeEvent(queue[i]);
    if (row) pushRing(agent.events, row, EVENT_CAP);
  }
}

/**
 * Job terminal watcher (v2): accepted contracts stay observable in flight and
 * their terminal transition lands on the session ring. station.js notes the
 * precise outcome at each terminal site (jobNoted marks those ids); this
 * watcher is the backstop for a state flip or removal without a note.
 * Session-only; never persists; never throws.
 */
function watchJobs(ctx) {
  const agent = ensureAgent(ctx);
  if (!agent) return;
  if (!agent.jobWatch || typeof agent.jobWatch !== 'object' || Array.isArray(agent.jobWatch)) {
    agent.jobWatch = {};
  }
  if (!agent.jobNoted || typeof agent.jobNoted !== 'object' || Array.isArray(agent.jobNoted)) {
    agent.jobNoted = {};
  }
  const watch = agent.jobWatch;
  const noted = agent.jobNoted;
  const list = ctx.world && Array.isArray(ctx.world.jobs) ? ctx.world.jobs : [];
  const live = {};
  for (let i = 0; i < list.length; i++) {
    const j = list[i];
    if (!j || typeof j.id !== 'string' || !j.id || reservedName(j.id)) continue;
    live[j.id] = {
      kind: typeof j.kind === 'string' ? j.kind : '',
      state: typeof j.state === 'string' ? j.state : '',
    };
  }
  for (const id of Object.keys(watch)) {
    const was = watch[id];
    if (!was || was.state !== 'accepted') continue;
    const cur = Object.hasOwn(live, id) ? live[id] : null;
    let outcome = '';
    let kind = was.kind;
    if (cur && cur.state === was.state) continue;
    if (cur && (cur.state === 'done' || cur.state === 'failed')) {
      outcome = cur.state;
      kind = cur.kind || kind;
    } else if (!cur) {
      outcome = 'closed';
    }
    if (!outcome) continue;
    if (noted[id] !== undefined) continue;
    noted[id] = outcome;
    try {
      noteSessionEvent(ctx, { type: 'jobState', id, kind, outcome });
    } catch {
      /* ring note is best-effort */
    }
  }
  agent.jobWatch = live;
}

function remember(ctx, result) {
  const agent = ensureAgent(ctx);
  if (!agent) return result;
  const t = ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
  const last = {
    name: str(result.name),
    ok: result.ok === true,
    error: str(result.error),
    token: str(result.token),
    t,
  };
  const status = str(result.status);
  if (status) last.status = status;
  agent.lastIntent = last;
  return result;
}

function fail(ctx, name, token, error) {
  return remember(ctx, actResult({ ok: false, error: error ?? token, name, token }));
}

function ok(ctx, name) {
  return remember(ctx, actResult({ ok: true, error: '', name, token: '' }));
}

function commandName(command) {
  if (!command || typeof command !== 'object') return '';
  const name = Object.hasOwn(command, 'name') ? command.name : '';
  return typeof name === 'string' ? name : '';
}

function commandArgs(command) {
  if (!command || typeof command !== 'object') return {};
  const args = Object.hasOwn(command, 'args') ? command.args : null;
  if (!args || typeof args !== 'object' || Array.isArray(args)) return {};
  return args;
}

function deskOf(ctx) {
  const desk = ctx && ctx.stationDesk;
  if (!desk || typeof desk !== 'object') return null;
  return desk;
}

function peekDeskService(desk) {
  if (!desk || typeof desk.peekService !== 'function') return null;
  try {
    const id = desk.peekService();
    return typeof id === 'string' && id ? id : null;
  } catch {
    return null;
  }
}
function refuseDesk(ctx, name, needService) {
  const desk = deskOf(ctx);
  if (!desk || typeof desk.peekService !== 'function') return fail(ctx, name, 'no-service');
  if (!ctx.flags || ctx.flags.docked !== true) return fail(ctx, name, 'no-service');
  if (!needService) return null;
  const service = peekDeskService(desk);
  if (service === needService) return null;
  return fail(ctx, name, 'no-service');
}

function deskNoticeToken(notice) {
  const n = typeof notice === 'string' ? notice : '';
  if (n.includes('Not enough UU')) return 'uu';
  if (n === 'Hold is full.' || n.startsWith('No room for the consignment')) return 'hold';
  if (/^No .+ in the hold/.test(n)) return 'hold';
  if (
    n === 'That posting is not valid.'
    || n === 'Dock first.'
    || n.includes('Take that contract')
    || n.includes('no longer on the board')
    || n.includes('That posting has no')
    || n.includes('That posting is not open')
  ) return 'not-offered';
  return 'notice';
}

function afterDesk(ctx, name, result) {
  if (result && result.ok === true) return ok(ctx, name);
  const notice = result && typeof result.notice === 'string' ? result.notice : '';
  const token = deskNoticeToken(notice);
  return fail(ctx, name, token, notice || token);
}

function afterControls(ctx, name, token, queued) {
  if (typeof token === 'string' && token) return fail(ctx, name, token);
  if (queued === true) {
    return remember(ctx, actResult({ ok: true, error: '', name, token: '', status: 'queued' }));
  }
  return ok(ctx, name);
}

function tradeQty(ctx, qty) {
  if (typeof qty !== 'number' || !Number.isInteger(qty)) return null;
  const cap = ctx && typeof ctx.cargoCapacity === 'number' && Number.isFinite(ctx.cargoCapacity)
    ? Math.floor(ctx.cargoCapacity)
    : 99;
  const max = Math.min(99, cap > 0 ? cap : 99);
  if (qty < 1 || qty > max) return null;
  return qty;
}

function actPlotRoute(ctx, name, args) {
  const dest = Object.hasOwn(args, 'dest') ? args.dest : '';
  if (typeof dest !== 'string' || !dest || reservedName(dest)) {
    return fail(ctx, name, 'noDest', apLine('noDest'));
  }
  const id = sanitizeSystemId(dest);
  if (!id) return fail(ctx, name, 'noDest', apLine('noDest'));
  plotRoute(ctx, dest);
  const nav = ctx.world && ctx.world.nav;
  if (!nav || typeof nav !== 'object' || Array.isArray(nav)) {
    return fail(ctx, name, 'noDest', apLine('noDest'));
  }
  const status = Object.hasOwn(nav, 'status') ? nav.status : '';
  if (nav.dest !== id || (status !== 'plotted' && status !== 'blocked')) {
    return fail(ctx, name, 'noDest', apLine('noDest'));
  }
  return ok(ctx, name);
}

/**
 * Issue #66 — optional `expectedConversationId`. Absent is the legacy call:
 * `bound` is false and the card is invoked with a single argument, so it can
 * never confuse "no token" with "a bad token". Present must be an OWN plain
 * non-empty token no longer than the envelope reqId bound, and never a
 * prototype-poisoning name. An `args` object with an unusual prototype, or a
 * token that is merely inherited, is `bad-args` as well: a guarded call must
 * never silently downgrade to an unguarded one.
 */
function expectedConversationArg(args) {
  if (!args || typeof args !== 'object') return { ok: true, bound: false, id: '' };
  const proto = Object.getPrototypeOf(args);
  if (proto !== Object.prototype && proto !== null) return { ok: false, bound: true, id: '' };
  if (!Object.hasOwn(args, 'expectedConversationId')) {
    if ('expectedConversationId' in args) return { ok: false, bound: true, id: '' };
    return { ok: true, bound: false, id: '' };
  }
  const raw = args.expectedConversationId;
  if (typeof raw !== 'string' || !raw || raw.length > 64 || reservedName(raw)) {
    return { ok: false, bound: true, id: '' };
  }
  return { ok: true, bound: true, id: raw };
}

function actHailResolve(ctx, name, args) {
  const api = ctx && ctx.hailApi;
  if (!api || typeof api.resolve !== 'function' || typeof api.peek !== 'function') {
    return fail(ctx, name, 'no-service');
  }
  let digitsOk = false;
  try {
    digitsOk = hailDigitsAllowed(ctx) !== false;
  } catch {
    digitsOk = false;
  }
  if (!digitsOk) return fail(ctx, name, 'no-service');
  let peek = { intents: [], open: false };
  try {
    peek = api.peek();
  } catch {
    peek = { intents: [], open: false };
  }
  const raw = peek && Array.isArray(peek.intents) ? peek.intents : [];
  const intents = [];
  for (let i = 0; i < raw.length; i++) {
    if (typeof raw[i] === 'string') intents.push(raw[i]);
  }
  const hailOpen = ctx.flags && ctx.flags.hailOpen === true;
  const cardOpen = peek && peek.open === true;
  if ((!hailOpen && !cardOpen) || intents.length === 0) {
    return fail(ctx, name, 'closed');
  }
  let intent = '';
  if (Object.hasOwn(args, 'intent') && typeof args.intent === 'string') {
    intent = args.intent;
  } else if (Object.hasOwn(args, 'index')) {
    const n = args.index;
    if (typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= intents.length) {
      intent = intents[n - 1];
    }
  }
  let onCard = false;
  for (let i = 0; i < intents.length; i++) {
    if (intents[i] === intent) {
      onCard = true;
      break;
    }
  }
  const expected = expectedConversationArg(args);
  if (!expected.ok) return fail(ctx, name, 'bad-args');
  // An unguarded caller is answered here. A guarded one is answered by the live
  // card itself, which reports 'stale' for a conversation that moved even when
  // the verb the caller remembers is no longer listed.
  if (!expected.bound && (!intent || !onCard)) return fail(ctx, name, 'no-service');
  // hail.js re-checks the token against the live card immediately before any
  // effect, so a card replaced between the peek above and this call refuses.
  const token = expected.bound ? api.resolve(intent, expected.id) : api.resolve(intent);
  if (typeof token === 'string' && token) return fail(ctx, name, token);
  return ok(ctx, name);
}

function actStartGame(ctx, name) {
  const api = ctx && ctx.titleApi;
  if (!api || typeof api.isOpen !== 'function' || typeof api.start !== 'function') {
    return fail(ctx, name, 'no-service');
  }
  let open = false;
  try {
    open = api.isOpen() === true;
  } catch {
    return fail(ctx, name, 'no-service');
  }
  if (!open) return ok(ctx, name);
  api.start();
  return ok(ctx, name);
}

function actChooseOrigin(ctx, name, args) {
  const api = ctx && ctx.originsApi;
  if (!api || typeof api.choose !== 'function' || typeof api.isOpen !== 'function') {
    return fail(ctx, name, 'no-service');
  }
  let open = false;
  try {
    open = api.isOpen() === true;
  } catch {
    return fail(ctx, name, 'no-service');
  }
  if (!open) return fail(ctx, name, 'no-service');
  const id = Object.hasOwn(args, 'id') ? args.id : '';
  if (typeof id !== 'string' || !id || reservedName(id)) {
    return fail(ctx, name, 'unknown');
  }
  let token = '';
  try {
    token = api.choose(id);
  } catch {
    return fail(ctx, name, 'no-service');
  }
  if (typeof token === 'string' && token) return fail(ctx, name, token);
  return ok(ctx, name);
}

/**
 * One launch verdict for every agent departure path (issue #65). `run` performs
 * the desk call. Departure clearance can hold the berth; the desk reports the
 * refusal, and a planner that ignored it would think it was flying while still
 * docked — so the token and the player-visible notice both propagate, a
 * still-docked ship is a failure whatever the desk claimed, and a desk that
 * throws fails closed.
 */
function actLaunch(ctx, name, run) {
  let result = null;
  try {
    result = run();
  } catch {
    return fail(ctx, name, 'refuse');
  }
  if (result && result.ok === false) {
    const token = str(result.token) || 'blocked';
    return fail(ctx, name, token, str(result.notice) || token);
  }
  if (ctx.flags.docked === true) return fail(ctx, name, 'blocked', 'Launch held.');
  return ok(ctx, name);
}

function dispatchLive(ctx, name, args) {
  if (name === 'plotRoute') return actPlotRoute(ctx, name, args);
  if (name === 'clearRoute') {
    clearRoute(ctx);
    return ok(ctx, name);
  }
  if (name === 'engageAutopilot') {
    agentClearFullStop(ctx);
    const token = tryEngage(ctx);
    if (token) return fail(ctx, name, token, apLine(token) || token);
    return ok(ctx, name);
  }
  if (name === 'cancelAutopilot') {
    disengage(ctx, 'cancel');
    return ok(ctx, name);
  }
  if (name === 'approachDock') {
    const token = tryApproachDock(ctx);
    if (token) return fail(ctx, name, token, dockApproachLine(token) || token);
    agentClearFullStop(ctx);
    return ok(ctx, name);
  }
  if (name === 'engageAutomine') {
    agentClearFullStop(ctx);
    const token = tryEngageAutomine(ctx);
    if (token) return fail(ctx, name, token, amLine(token) || token);
    return ok(ctx, name);
  }
  if (name === 'cancelAutomine') {
    disengageAutomine(ctx, 'cancel');
    return ok(ctx, name);
  }
  if (name === 'hailResolve') return actHailResolve(ctx, name, args);
  if (name === 'openService') {
    const desk = deskOf(ctx);
    if (!desk || typeof desk.selectService !== 'function') return fail(ctx, name, 'no-service');
    if (!ctx.flags || ctx.flags.docked !== true) return fail(ctx, name, 'no-service');
    const id = Object.hasOwn(args, 'id') ? args.id : '';
    if (!isDockService(id)) return fail(ctx, name, 'no-service');
    // 'launch' opens no pane: it is the same departure the dedicated undock
    // runs, so it answers with the same launch verdict (issue #65 QA).
    if (id === 'launch') return actLaunch(ctx, name, () => desk.selectService(id));
    desk.selectService(id);
    return ok(ctx, name);
  }
  if (name === 'undock') {
    const desk = deskOf(ctx);
    if (!desk || typeof desk.undock !== 'function') return fail(ctx, name, 'no-service');
    if (!ctx.flags || ctx.flags.docked !== true) return fail(ctx, name, 'no-service');
    return actLaunch(ctx, name, () => desk.undock());
  }
  if (name === 'acceptJob') {
    const blocked = refuseDesk(ctx, name, DESK_NEED.acceptJob);
    if (blocked) return blocked;
    const desk = deskOf(ctx);
    if (!desk || typeof desk.acceptJob !== 'function') return fail(ctx, name, 'no-service');
    const id = Object.hasOwn(args, 'id') ? args.id : '';
    if (typeof id !== 'string' || !id) return fail(ctx, name, 'no-service');
    return afterDesk(ctx, name, desk.acceptJob({ id }));
  }
  if (name === 'trade') {
    const blocked = refuseDesk(ctx, name, DESK_NEED.trade);
    if (blocked) return blocked;
    const desk = deskOf(ctx);
    if (!desk || typeof desk.trade !== 'function') return fail(ctx, name, 'no-service');
    const commodity = Object.hasOwn(args, 'commodity') ? args.commodity : '';
    const side = Object.hasOwn(args, 'side') ? args.side : '';
    const qty = tradeQty(ctx, Object.hasOwn(args, 'qty') ? args.qty : undefined);
    if (typeof commodity !== 'string' || !commodity || !Object.hasOwn(COMMODITIES, commodity)) {
      return fail(ctx, name, 'bad-commodity');
    }
    if (qty === null) return fail(ctx, name, 'bad-qty');
    if (side !== 'buy' && side !== 'sell') return fail(ctx, name, 'bad-qty');
    return afterDesk(ctx, name, desk.trade({ commodity, qty, side }));
  }
  if (name === 'repairAll') {
    const blocked = refuseDesk(ctx, name, DESK_NEED.repairAll);
    if (blocked) return blocked;
    const desk = deskOf(ctx);
    if (!desk || typeof desk.repairAll !== 'function') return fail(ctx, name, 'no-service');
    return afterDesk(ctx, name, desk.repairAll());
  }
  if (name === 'feed') {
    const blocked = refuseDesk(ctx, name, DESK_NEED.feed);
    if (blocked) return blocked;
    const desk = deskOf(ctx);
    if (!desk || typeof desk.feed !== 'function') return fail(ctx, name, 'no-service');
    const kind = Object.hasOwn(args, 'kind') ? args.kind : '';
    if (typeof kind !== 'string' || !FEED_KINDS.has(kind)) return fail(ctx, name, 'no-service');
    return afterDesk(ctx, name, desk.feed({ kind }));
  }
  if (name === 'dock') {
    const st = ctx.station;
    if (!st || typeof st !== 'object' || st.inZone !== true) {
      return fail(ctx, name, 'range');
    }
    return afterControls(ctx, name, agentPulse(ctx, 'dock'), true);
  }
  if (name === 'hail') return afterControls(ctx, name, agentPulse(ctx, 'hail'), true);
  if (name === 'afterburner') {
    if (ctx.flags && ctx.flags.docked === true) return fail(ctx, name, 'docked');
    if (!ctx.input || typeof ctx.input !== 'object') return fail(ctx, name, 'no-service');
    agentClearFullStop(ctx);
    tryEngageFlee(ctx);
    return afterControls(ctx, name, agentPulse(ctx, 'afterburner'), true);
  }
  if (name === 'selectTarget') {
    if (ctx.flags && ctx.flags.docked === true) return fail(ctx, name, 'docked');
    if (Object.hasOwn(args, 'id')) {
      return afterControls(ctx, name, agentSelectTarget(ctx, args.id));
    }
    return afterControls(ctx, name, agentSelectTarget(ctx), true);
  }
  if (name === 'pulse') {
    if (!Object.hasOwn(args, 'edge')) return fail(ctx, name, 'unknown');
    const edge = args.edge;
    if (typeof edge !== 'string' || !PULSE_EDGES.has(edge)) return fail(ctx, name, 'unknown');
    if (edge === 'dock') {
      const st = ctx.station;
      if (!st || typeof st !== 'object' || st.inZone !== true) {
        return fail(ctx, name, 'range');
      }
    }
    return afterControls(ctx, name, agentPulse(ctx, edge), true);
  }
  if (name === 'startGame') return actStartGame(ctx, name);
  if (name === 'chooseOrigin') return actChooseOrigin(ctx, name, args);
  if (name === 'setWeaponGroup') {
    const n = Object.hasOwn(args, 'n') ? args.n : undefined;
    return afterControls(ctx, name, agentSetWeaponGroup(ctx, n));
  }
  if (name === 'setControl') {
    const token = agentControlSet(ctx, args);
    if (token) return fail(ctx, name, token);
    return remember(ctx, actResult({ ok: true, error: '', name, token: '', status: 'active' }));
  }
  if (name === 'clearControl') {
    agentControlClear(ctx);
    return remember(ctx, actResult({ ok: true, error: '', name, token: '', status: 'cleared' }));
  }
  if (name === 'stationAction') {
    const desk = deskOf(ctx);
    if (!desk || typeof desk.perform !== 'function') return fail(ctx, name, 'no-service');
    if (!ctx.flags || ctx.flags.docked !== true) return fail(ctx, name, 'no-service');
    const spec = { n: Object.hasOwn(args, 'n') ? args.n : undefined };
    if (Object.hasOwn(args, 'expect') && typeof args.expect === 'string') spec.expect = args.expect;
    const result = desk.perform(spec);
    const notice = result && typeof result.notice === 'string' ? result.notice : '';
    if (result && result.ok === true) {
      // Issue #64: the success line is feedback, not a refusal. It rides
      // `notice`; `error` stays empty so ok/error never disagree. Failures
      // below keep their classifier token and notice-as-error text.
      return remember(ctx, actResult({ ok: true, error: '', name, token: '', notice }));
    }
    const token = result && typeof result.token === 'string' && result.token
      ? result.token
      : deskNoticeToken(notice);
    return fail(ctx, name, token, notice || token);
  }
  if (name === 'recover') {
    const death = ctx && ctx.deathApi;
    if (!death || typeof death.isOpen !== 'function' || typeof death.recover !== 'function') {
      return fail(ctx, name, 'no-service');
    }
    let open = false;
    try {
      open = death.isOpen() === true;
    } catch {
      return fail(ctx, name, 'no-service');
    }
    if (!open) return fail(ctx, name, 'no-service');
    try {
      death.recover();
    } catch {
      return fail(ctx, name, 'no-service');
    }
    return ok(ctx, name);
  }
  return fail(ctx, name, 'unknown');
}
function readLiveCtx(fallback) {
  try {
    const w = hostWindow();
    const live = w && w.__ctx;
    if (live && typeof live === 'object') return live;
  } catch {
    /* ignore */
  }
  return fallback && typeof fallback === 'object' ? fallback : null;
}

function isPublicHandle(value) {
  return !!(
    value
    && typeof value === 'object'
    && value.version === VERSION
    && typeof value.observe === 'function'
    && typeof value.act === 'function'
  );
}

const BADGE_COPY = Object.freeze({
  title: 'Agent play',
  on: 'on',
  off: 'off',
  lastNone: 'Last: none',
  lastPrefix: 'Last: ',
  errorNone: '',
  errorPrefix: 'Error: ',
  enable: 'Enable agent play',
  disable: 'Stop agent play',
  hint: 'Stop does not cancel Autopilot.',
});

function hostDocument() {
  try {
    if (typeof globalThis !== 'undefined' && globalThis.document) return globalThis.document;
  } catch {
    /* ignore */
  }
  try {
    const w = hostWindow();
    if (w && w.document) return w.document;
  } catch {
    /* ignore */
  }
  return null;
}

function badgeName(value) {
  return typeof value === 'string' ? value : '';
}

function badgeError(value) {
  return typeof value === 'string' ? value : '';
}

let badgePaint = null;

function refreshBadge(ctx) {
  try {
    if (!badgePaint) return;
    badgePaint(ctx);
  } catch {
    /* never throw into the flight loop */
  }
}

function makeBadgeNode(doc, tag, className) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  return node;
}

function mountAgentBadge(ctx) {
  if (badgePaint) {
    refreshBadge(ctx);
    return;
  }
  const doc = hostDocument();
  const body = doc && doc.body;
  if (!doc || !body || typeof doc.createElement !== 'function' || typeof body.appendChild !== 'function') {
    return;
  }
  try {
    const root = makeBadgeNode(doc, 'div', 'rw-agent-badge');

    const status = makeBadgeNode(doc, 'div', 'rw-agent-badge-status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');

    const title = makeBadgeNode(doc, 'span', 'rw-agent-badge-title');
    title.textContent = BADGE_COPY.title;

    const state = makeBadgeNode(doc, 'span', 'rw-agent-badge-state');
    const last = makeBadgeNode(doc, 'span', 'rw-agent-badge-last');
    const err = makeBadgeNode(doc, 'span', 'rw-agent-badge-error');

    status.appendChild(title);
    status.appendChild(state);
    status.appendChild(last);
    status.appendChild(err);

    const actions = makeBadgeNode(doc, 'div', 'rw-agent-badge-actions');

    const enableBtn = makeBadgeNode(doc, 'button', 'rw-agent-badge-btn');
    enableBtn.type = 'button';
    enableBtn.setAttribute('type', 'button');
    enableBtn.textContent = BADGE_COPY.enable;

    const stopBtn = makeBadgeNode(doc, 'button', 'rw-agent-badge-btn');
    stopBtn.type = 'button';
    stopBtn.setAttribute('type', 'button');
    stopBtn.textContent = BADGE_COPY.disable;

    const hint = makeBadgeNode(doc, 'p', 'rw-agent-badge-hint');
    hint.textContent = BADGE_COPY.hint;

    actions.appendChild(enableBtn);
    actions.appendChild(stopBtn);
    root.appendChild(status);
    root.appendChild(actions);
    root.appendChild(hint);
    body.appendChild(root);

    badgePaint = (live) => {
      const agent = live && live.agent && typeof live.agent === 'object' ? live.agent : null;
      const on = !!(agent && agent.optIn === true);
      state.textContent = on ? BADGE_COPY.on : BADGE_COPY.off;
      root.classList.toggle('is-on', on);
      root.classList.toggle('is-off', !on);
      root.setAttribute('data-state', on ? BADGE_COPY.on : BADGE_COPY.off);
      const intent = agent && agent.lastIntent && typeof agent.lastIntent === 'object'
        ? agent.lastIntent
        : null;
      const name = intent ? badgeName(intent.name) : '';
      last.textContent = name ? BADGE_COPY.lastPrefix + name : BADGE_COPY.lastNone;
      const error = intent ? badgeError(intent.error) : '';
      err.textContent = error ? BADGE_COPY.errorPrefix + error : BADGE_COPY.errorNone;
    };

    enableBtn.addEventListener('click', (ev) => {
      try {
        const w = hostWindow();
        const api = w && w.rimward;
        if (api && typeof api.enable === 'function') api.enable(ev);
      } catch {
        /* ignore */
      }
    });
    stopBtn.addEventListener('click', () => {
      try {
        const w = hostWindow();
        const api = w && w.rimward;
        if (api && typeof api.disable === 'function') api.disable();
      } catch {
        /* ignore */
      }
    });

    refreshBadge(ctx);
  } catch {
    badgePaint = null;
  }
}

// v2 receipts: every act answers with a caller-provided or handle-issued
// request id and the simulation timestamp. reqId is envelope metadata on the
// command ({ v, name, args, reqId }) — never a gameplay arg, so strict arg
// validation (setControl LEASE_KEYS, desk specs) never sees it. Session
// counter only.
let issuedReq = 0;

function requestId(command) {
  const raw = command && Object.hasOwn(command, 'reqId') ? command.reqId : '';
  if (typeof raw !== 'string' || !raw || raw.length > 64 || reservedName(raw)) return '';
  return raw;
}

function stampResult(ctx, result, reqId) {
  const out = result && typeof result === 'object'
    ? result
    : actResult({ ok: false, error: 'refuse', token: 'refuse' });
  out.t = ctx && ctx.world && Number.isFinite(ctx.world.time) ? ctx.world.time : 0;
  out.reqId = reqId || `r${++issuedReq}`;
  return out;
}

function dispatchAct(ctx, command) {
  const name = commandName(command);
  const args = commandArgs(command);
  const reqId = requestId(command);
  const result = dispatchGated(ctx, name, args);
  return stampResult(ctx, result, reqId);
}

function dispatchGated(ctx, name, args) {
  if (isForbiddenName(name)) {
    try { console.warn('rimward: forbidden act', name); } catch { /* ignore */ }
    return fail(ctx, name, 'forbidden');
  }

  const agent = ensureAgent(ctx);
  if (!agent || agent.optIn !== true) return fail(ctx, name, 'opt-in');

  if (name === 'ping') return ok(ctx, name);

  if (name === 'disable') {
    agent.optIn = false;
    try { agentControlClear(ctx); } catch { /* lease clear is best-effort */ }
    return ok(ctx, name);
  }

  const flags = ctx.flags && typeof ctx.flags === 'object' ? ctx.flags : {};
  const pauseOk = name === 'startGame' || name === 'chooseOrigin';
  if (flags.paused === true && !pauseOk) return fail(ctx, name, 'paused');
  if (flags.berthHold === true) return fail(ctx, name, 'held');

  if (!isLiveCommand(name)) return fail(ctx, name, 'unknown');
  return dispatchLive(ctx, name, args);
}

export function initAgentApi(ctx) {
  if (!ctx || typeof ctx !== 'object') {
    return { update() {} };
  }
  const agent = ensureAgent(ctx);
  if (agent && queryOptIn()) agent.optIn = true;

  const w = hostWindow();
  if (w && !isPublicHandle(w.rimward)) {
    function observe() {
      try {
        return buildObservation(readLiveCtx(ctx));
      } catch {
        return noCtxObservation();
      }
    }

    function act(command) {
      try {
        const live = readLiveCtx(ctx);
        const result = dispatchAct(live, command);
        refreshBadge(live);
        return result;
      } catch {
        const name = commandName(command);
        return actResult({ ok: false, error: 'refuse', name, token: 'refuse' });
      }
    }

    function enable(ev) {
      try {
        const live = readLiveCtx(ctx);
        const trusted = !!(ev && ev.isTrusted === true);
        if (!trusted) {
          const refused = fail(live, 'enable', 'opt-in');
          refreshBadge(live);
          return refused;
        }
        const bag = ensureAgent(live);
        if (bag) bag.optIn = true;
        const result = ok(live, 'enable');
        refreshBadge(live);
        return result;
      } catch {
        return actResult({ ok: false, error: 'refuse', name: 'enable', token: 'refuse' });
      }
    }

    function disable() {
      try {
        const live = readLiveCtx(ctx);
        const bag = ensureAgent(live);
        if (bag) bag.optIn = false;
        try { agentControlClear(live); } catch { /* lease clear is best-effort */ }
        const result = ok(live, 'disable');
        refreshBadge(live);
        return result;
      } catch {
        return actResult({ ok: false, error: 'refuse', name: 'disable', token: 'refuse' });
      }
    }

    const api = Object.freeze({
      version: VERSION,
      observe,
      act,
      enable,
      disable,
    });
    try { w.rimward = api; } catch { /* ignore */ }
  }

  mountAgentBadge(ctx);

  return {
    update(_dt, live) {
      try {
        const bag = live || ctx;
        harvest(bag);
        watchJobs(bag);
        refreshBadge(readLiveCtx(ctx) || bag);
      } catch {
        /* never throw into the flight loop */
      }
    },
  };
}
