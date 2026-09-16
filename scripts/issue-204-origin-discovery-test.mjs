/** Issue #204: origin ids are discoverable through observe().
 *
 * A playtester found `observe().session` was `{ phase: 'origin' }` and nothing
 * named the five rows the overlay paints, so `chooseOrigin` needed a guessed
 * id and answered a bare `unknown`. This exercises the real boot graph: the
 * live menu now rides the observation, the refusal names the same ids, and
 * nothing outside the origin phase changed.
 *
 * Per-origin acceptance runs in its own process, because choosing an origin
 * loads a system and mutates module state (same isolation rule as
 * scripts/starter-sun-drift-test.mjs).
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { ORIGINS } from '../src/game/state.js';
import { COMMAND_SPECS } from '../src/game/agent-schema.js';

let checks = 0;
function test(name, run) { run(); console.log('PASS', name); checks++; }

/** Boot to the origin overlay with the agent handle live. */
async function fixture() {
  const dom = installDomStubs();
  window.location.search = '?agent=1';
  const { ctx, systems } = await bootGameSystems();
  ctx.titleApi.start();
  const api = window.rimward;
  assert.equal(api.observe().session.phase, 'origin', 'startGame lands on the origin overlay');
  return { ctx, systems, dom, api };
}

const acceptId = process.argv[2];
if (acceptId) {
  // Sub-process case: the id the parent read out of observe() is selectable.
  const f = await fixture();
  const listed = f.api.observe().session.origins.map((row) => row.id);
  assert.ok(listed.includes(acceptId), `${acceptId} is still listed`);
  const r = f.api.act({ v: 2, name: 'chooseOrigin', args: { id: acceptId } });
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(f.ctx.world.origin, acceptId, 'the chosen origin is recorded');
  assert.equal(f.ctx.flags.paused, false, 'the overlay released the world');
  assert.equal(f.api.observe().session.phase, 'playing');
  console.log('PASS observe-listed origin is selectable:', acceptId);
} else {
  const f = await fixture();

  test('session.origins lists the live menu as {id,title,digit}', () => {
    const rows = f.api.observe().session.origins;
    assert.ok(Array.isArray(rows), 'origins is an array');
    assert.ok(rows.length > 0, 'the open overlay offers at least one origin');
    for (const row of rows) {
      assert.deepEqual(Object.keys(row).sort(), ['digit', 'id', 'title'], 'authored fields only');
      assert.equal(typeof row.id, 'string');
      assert.ok(row.id.length > 0);
      assert.equal(row.title, ORIGINS[row.id].name, 'the title is the authored origin name');
      assert.ok(Number.isInteger(row.digit) && row.digit >= 1, 'digit is the 1-based key label');
    }
    const digits = rows.map((r) => r.digit);
    assert.deepEqual([...new Set(digits)], digits, 'digits are unique');
    assert.deepEqual([...digits].sort((a, b) => a - b), digits, 'rows arrive in Digit order');
  });

  test('the listed rows are exactly the overlay rows the player reads', () => {
    const rows = f.api.observe().session.origins;
    const painted = [];
    for (const el of f.dom.walkDom(document.body)) {
      if (el.className === 'rw-origin-choice') painted.push(el.textContent);
    }
    assert.equal(painted.length, rows.length, 'one observed row per painted row');
    rows.forEach((row, i) => {
      assert.ok(
        painted[i].startsWith(`[${row.digit}] ${row.title} `),
        `painted row ${i} (${painted[i]}) matches ${row.digit}/${row.title}`,
      );
    });
  });

  test('an unknown id refuses without mutating state and names the valid ids', () => {
    const rows = f.api.observe().session.origins;
    const before = f.api.observe();
    const r = f.api.act({ v: 2, name: 'chooseOrigin', args: { id: 'nope' } });
    assert.equal(r.ok, false);
    assert.equal(r.token, 'unknown');
    assert.equal(r.error, 'unknown', 'the token stays the enum');
    assert.equal(typeof r.detail, 'string');
    for (const row of rows) assert.ok(r.detail.includes(row.id), `detail names ${row.id}`);
    assert.match(r.detail, /observe\(\)\.session\.origins/, 'detail points at the observation');
    assert.ok(!f.ctx.world.origin, 'no origin was recorded');
    assert.equal(f.ctx.flags.paused, true, 'the overlay still owns the screen');
    assert.equal(f.api.observe().session.phase, 'origin');
    assert.deepEqual(f.api.observe().session.origins, before.session.origins, 'the menu is unchanged');
  });

  test('reserved and malformed ids refuse unknown and change nothing', () => {
    for (const id of ['__proto__', 'constructor', 'prototype', '', 'Greenhand', 'greenhand ']) {
      const r = f.api.act({ v: 2, name: 'chooseOrigin', args: { id } });
      assert.equal(r.ok, false, `refused ${JSON.stringify(id)}`);
      assert.equal(r.token, 'unknown', `unknown for ${JSON.stringify(id)}`);
      assert.ok(!f.ctx.world.origin, `no origin recorded for ${JSON.stringify(id)}`);
    }
    for (const args of [{}, { id: 7 }, { id: null }, { id: ['greenhand'] }, { id: { id: 'greenhand' } }]) {
      const r = f.api.act({ v: 2, name: 'chooseOrigin', args });
      assert.equal(r.ok, false, `refused ${JSON.stringify(args)}`);
      assert.equal(r.token, 'unknown');
      assert.ok(!f.ctx.world.origin);
    }
    assert.equal(f.api.observe().session.phase, 'origin', 'the overlay survived every refusal');
    assert.equal(Object.hasOwn(Object.prototype, 'name'), false, 'no prototype was written');
  });

  test('the block is JSON-safe and every observe() call is a fresh copy', () => {
    const a = f.api.observe();
    const round = JSON.parse(JSON.stringify(a.session));
    assert.deepEqual(round, a.session, 'session survives a JSON round trip unchanged');
    a.session.origins.push({ id: 'injected', title: 'x', digit: 9 });
    a.session.origins[0].id = 'mutated';
    a.session.phase = 'playing';
    const b = f.api.observe();
    assert.equal(b.session.phase, 'origin');
    assert.equal(b.session.origins.length, round.origins.length, 'the caller could not grow the list');
    assert.deepEqual(b.session.origins, round.origins, 'the caller could not edit a row');
    assert.notEqual(b.session.origins, a.session.origins, 'a fresh array each call');
  });

  test('COMMAND_SPECS.chooseOrigin.args.id says where the ids come from', () => {
    const doc = COMMAND_SPECS.chooseOrigin.args.id;
    assert.equal(typeof doc, 'string');
    assert.match(doc, /observe\(\)\.session\.origins/);
    assert.match(doc, /origin/);
    // The same note reaches an agent through the live capability manifest.
    const manifest = f.api.observe().capabilities;
    assert.equal(manifest.commands.chooseOrigin.args.id, doc, 'the live manifest carries the note');
  });

  test('outside the origin phase the session block is unchanged', () => {
    const ids = f.api.observe().session.origins.map((row) => row.id);
    assert.equal(f.api.act({ v: 2, name: 'chooseOrigin', args: { id: ids[0] } }).ok, true);
    const after = f.api.observe().session;
    assert.equal(after.phase, 'playing');
    assert.equal(Object.hasOwn(after, 'origins'), false, 'no origins key once the overlay is gone');
    assert.deepEqual(Object.keys(after), ['phase'], 'the playing session block is phase only');
    // A second attempt on a closed overlay is a service refusal, not a guess prompt.
    const r = f.api.act({ v: 2, name: 'chooseOrigin', args: { id: ids[0] } });
    assert.equal(r.ok, false);
    assert.equal(r.token, 'no-service');
    assert.equal(f.ctx.world.origin, ids[0], 'the first choice stands');
  });

  // Every id the observation advertises really is selectable, each in a clean boot.
  const listed = ['greenhand', 'ledgerDebt', 'marked', 'beautiful', 'drifter'];
  for (const id of listed) {
    const r = spawnSync(
      process.execPath,
      ['--import', new URL('./with-css-stub.mjs', import.meta.url).href, fileURLToPath(import.meta.url), id],
      { stdio: 'inherit', windowsHide: true },
    );
    if (r.error || r.status !== 0) throw Error('Origin acceptance failed: ' + id);
    checks++;
  }

  console.log(`PASS issue-204 origin discovery (${checks} checks)`);
}
