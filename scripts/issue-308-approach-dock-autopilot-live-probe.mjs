/**
 * Issue #308 live verification — approachDock refusal copy in a real browser.
 *
 * Disposable loopback Chromium (issue-169/issue-74 harness pattern), the real
 * application and the real agent handle. A fresh Greenhand start: the first
 * approachDock engages the real dock autopilot; a second same-frame
 * approachDock is refused. The token and English error line stay unchanged and
 * the receipt detail names the engaged dock approach and cancelAutopilot as
 * the takeover path. No pose writes, no copied refusal logic.
 *
 * Run: npm run test:approach-dock-autopilot-live
 */
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

process.env.ISSUE74_OUT = process.env.ISSUE308_OUT || resolve('out/issue-308-live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive } = await import('./issue-74-live-harness.mjs');

await runLive('approach-dock-autopilot-detail', async ({ result, act, observe, checkpoint }) => {
  result.fixture = false;
  result.method = 'Fresh Greenhand start; first approachDock accepted by the real dock autopilot; a second approachDock in the same frame refused. No pose writes.';

  const first = await act('approachDock');
  assert.equal(first.ok, true, 'first approachDock accepted: ' + JSON.stringify(first));
  assert.equal(Object.hasOwn(first, 'detail'), false, 'accepted receipt carries no detail');
  const engaged = await observe();
  assert.equal(engaged.autopilot.engaged, true, 'the dock autopilot is engaged');
  assert.equal(engaged.autopilot.mode, 'dock', 'and it owns the dock approach');
  result.first = first;
  result.engagedAutopilot = engaged.autopilot;

  const refused = await act('approachDock', {}, false);
  assert.equal(refused.ok, false, 'the repeat is refused');
  assert.equal(refused.token, 'autopilot', 'the refusal token is unchanged');
  assert.equal(refused.error, 'Dock approach refused — autopilot is already on.', 'the error line is unchanged');
  assert.equal(typeof refused.detail, 'string', 'the refusal detail is present');
  assert.match(refused.detail, /autopilot is already taking the ship in/, 'the detail names the engaged approach');
  assert.match(refused.detail, /cancelAutopilot to take over/, 'the detail names the takeover command');
  const last = (await observe()).lastIntent;
  assert.equal(last.detail, refused.detail, 'lastIntent mirrors the receipt detail');
  result.refused = refused;
  result.lastIntent = last;

  await checkpoint('autopilot-refusal');
});
