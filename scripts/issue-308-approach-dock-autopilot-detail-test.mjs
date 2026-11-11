/**
 * Issue #308 — approachDock refusal copy when an autopilot already owns the
 * helm: the receipt detail names the engaged dock approach and the takeover
 * command instead of leaving a bare "autopilot is already on".
 *
 * Real boot (scripts/lib/boot-harness.mjs): the real installed autopilot, the
 * real station pose and the real public window.rimward act/observe pipeline.
 * No copied refusal logic and no synthetic autopilot state.
 *
 * Covered:
 *   1  an accepted approachDock engages autopilot mode dock; the accepted
 *      receipt carries no detail
 *   2  a repeat in the same frame keeps the unchanged token autopilot and the
 *      unchanged English error line (the #183/#185 semantics)
 *   3  the refusal detail names the engaged dock autopilot and cancelAutopilot
 *      as the takeover path; observe().lastIntent mirrors the detail
 *   4  the refusal receipt stays JSON-plain and only uses the existing
 *      actResult fields (no schema change)
 *
 * Run: node --import ./scripts/with-css-stub.mjs scripts/issue-308-approach-dock-autopilot-detail-test.mjs
 */
import assert from 'node:assert/strict';
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();

const DT = 1 / 60;
function tick(n = 1) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT;
    ctx.elapsed += DT;
    for (const [, sys] of systems) sys.update?.(DT);
    ctx.lastEvents = ctx.events;
    ctx.events = [];
  }
}

for (const node of dom.walkDom(document.body)) {
  if (node.dataset?.titleAction === 'new') { node.click(); break; }
}
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(2);

const api = globalThis.window.rimward;
assert.ok(api && typeof api.act === 'function', 'agent handle present');
ctx.agent.optIn = true;

let checks = 0;
function pin(name, run) { run(); checks++; console.log('PASS', name); }

const act = (name, args = {}) => api.act({ v: 2, name, args });
const REFUSAL_LINE = 'Dock approach refused — autopilot is already on.';
const TAKEOVER = 'cancelAutopilot to take over';

pin('an accepted approachDock engages the dock autopilot', () => {
  const first = act('approachDock');
  assert.equal(first.ok, true, JSON.stringify(first));
  assert.equal(Object.hasOwn(first, 'detail'), false, 'accepted receipt carries no detail');
  assert.equal(ctx.autopilot.engaged, true);
  assert.equal(ctx.autopilot.mode, 'dock');
});

let refusal;
pin('a repeat while the dock autopilot flies keeps the unchanged refusal', () => {
  refusal = act('approachDock');
  assert.equal(refusal.ok, false);
  assert.equal(refusal.token, 'autopilot');
  assert.equal(refusal.error, REFUSAL_LINE, 'the error line is unchanged');
  assert.equal(typeof refusal.detail, 'string', 'the detail is present');
  assert.match(refusal.detail, /autopilot is already taking the ship in/);
  assert.match(refusal.detail, /cancelAutopilot/);
  assert.match(refusal.detail, /take over/);
});

pin('observe().lastIntent mirrors the refusal detail', () => {
  const last = api.observe().lastIntent;
  assert.equal(last.ok, false);
  assert.equal(last.token, 'autopilot');
  assert.equal(last.error, REFUSAL_LINE);
  assert.equal(last.detail, refusal.detail);
});

pin('the refusal receipt stays JSON-plain with no new schema fields', () => {
  const round = JSON.parse(JSON.stringify(refusal));
  assert.deepEqual(round, refusal);
  assert.equal(typeof refusal.detail, 'string');
  const allowed = new Set(['v', 'ok', 'error', 'name', 'token', 'notice', 'status', 'detail', 'reqId', 't']);
  for (const key of Object.keys(refusal)) assert.ok(allowed.has(key), key);
  assert.equal(refusal.v, 2);
  assert.equal(refusal.name, 'approachDock');
});

console.log(`issue-308 approachDock autopilot detail: ${checks} groups passed`);
