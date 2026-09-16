import assert from 'node:assert/strict';
import { resolve } from 'node:path';
process.env.ISSUE74_OUT = process.env.ISSUE224_OUT || resolve('out/issue-224/live');
delete process.env.ISSUE74_RESUME_PROFILE;
delete process.env.ISSUE74_PORT;
const { runLive } = await import('./issue-74-live-harness.mjs');

await runLive('pirate-comms', async ({ c, result, checkpoint }) => {
  result.fixture = true;
  result.method = 'Disposable Chromium full game and real NPC/comm queue; explicit spawned hulls, berth flags and clock fixture. No natural-flight claim.';
  result.pins = await c.eval(`(async () => {
    const { runCommsPins } = await import('/scripts/lib/issue-224-comms-pins.mjs');
    const { primeShipAsset } = await import('/src/systems/ship-assets.js');
    await Promise.all([primeShipAsset('redledger', 'light', 'pirate'), primeShipAsset('freehold', 'light', 'trader')]);
    return runCommsPins(window.__ctx);
  })()`);
  assert.equal(result.pins.length, 16, 'all comm and NPC acceptance pins ran');
  await checkpoint('undocked-demand');
}, { seed: 224 });
