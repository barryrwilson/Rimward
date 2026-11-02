/**
 * Issue #270 — every generated record has a readable name.
 *
 * poolName used to fall back to `<Role> <sysId>-<n>` when a system's authored
 * name pool was short, and that debug label leaked into contract titles
 * ("Hunt Reaver redmarch-1") and scanner rows. This test generates every
 * authored AND generated system's real record bank and fails on any fallback
 * label, duplicate name, missing cast slot, or Q-ship cover, then checks that
 * the names are JSON-stable and that a restored bank is adopted instead of
 * regenerated.
 *
 * Run: npm run test:npc-names
 */
import assert from 'node:assert/strict';
import { SYSTEMS } from '../src/game/state.js';
import { ensureBank, minerCountForCast } from '../src/game/world.js';

const FALLBACK = /^(Reaver|Freighter|Patrol|Miner|Hauler) [a-z0-9_]+-\d+$/;

function expectedCount(cast) {
  const miners = minerCountForCast(cast);
  return (cast.traders | 0) + (cast.pirates | 0) + (cast.patrols | 0) + miners + (cast.ace ? 1 : 0);
}

const ctx = { world: { recordBanks: {} } };
const generated = {};
let checked = 0;
let covers = 0;

for (const [sysId, def] of Object.entries(SYSTEMS)) {
  const bank = ensureBank(ctx, sysId);
  generated[sysId] = bank;

  assert.equal(bank.length, expectedCount(def.cast), `${sysId}: bank covers every cast slot`);

  const byRole = { trader: 0, pirate: 0, patrol: 0, miner: 0, ace: 0 };
  const seen = new Set();
  let systemCovers = 0;

  for (const rec of bank) {
    assert.equal(typeof rec.name, 'string', `${sysId}/${rec.id}: name is a string`);
    assert.ok(rec.name.trim().length > 0, `${sysId}/${rec.id}: name is not blank`);
    assert.ok(rec.name.length <= 40, `${sysId}/${rec.id}: name fits the 40-char record limit`);
    assert.ok(!FALLBACK.test(rec.name), `${sysId}/${rec.id}: "${rec.name}" is not a fallback label`);
    assert.ok(!rec.name.includes(`${sysId}-`), `${sysId}/${rec.id}: "${rec.name}" carries no system id`);
    assert.ok(!seen.has(rec.name), `${sysId}: "${rec.name}" is unique in its system`);
    seen.add(rec.name);

    assert.ok(Object.hasOwn(byRole, rec.role), `${sysId}/${rec.id}: known role ${rec.role}`);
    byRole[rec.role]++;

    if (rec.qship) {
      assert.equal(typeof rec.coverName, 'string', `${sysId}/${rec.id}: Q-ship has a cover name`);
      assert.ok(!FALLBACK.test(rec.coverName), `${sysId}/${rec.id}: cover "${rec.coverName}" is readable`);
      assert.ok(!rec.coverName.includes(`${sysId}-`), `${sysId}/${rec.id}: cover carries no system id`);
      assert.ok(!seen.has(rec.coverName), `${sysId}: cover "${rec.coverName}" is unique in its system`);
      seen.add(rec.coverName);
      systemCovers++;
    }
  }

  assert.equal(byRole.trader, def.cast.traders | 0, `${sysId}: traders match cast`);
  assert.equal(byRole.pirate, def.cast.pirates | 0, `${sysId}: pirates match cast`);
  assert.equal(byRole.patrol, def.cast.patrols | 0, `${sysId}: patrols match cast`);
  assert.equal(byRole.miner, minerCountForCast(def.cast), `${sysId}: miners match cast`);
  assert.equal(byRole.ace, def.cast.ace ? 1 : 0, `${sysId}: ace matches cast`);
  assert.equal(systemCovers, (def.cast.pirates | 0) >> 1, `${sysId}: every disguised pirate has a cover`);

  checked += bank.length;
  covers += systemCovers;
}

assert.ok(Object.keys(SYSTEMS).length >= 100, 'authored and generated systems are all covered');
assert.ok(checked >= 500, `generated ${checked} records`);
assert.ok(covers >= 40, `generated ${covers} Q-ship covers`);
console.log(`ok ${Object.keys(SYSTEMS).length} systems: ${checked} records, ${covers} Q-ship covers, no fallback names`);

// Save/reload: names are plain strings in the persisted bank. A restored bank
// must be adopted as-is (ensureBank's existing-bank path), not regenerated.
const restoredBanks = JSON.parse(JSON.stringify(generated));
for (const [sysId, saved] of Object.entries(restoredBanks)) {
  const restoredCtx = { world: { recordBanks: restoredBanks } };
  const bank = ensureBank(restoredCtx, sysId);
  assert.equal(bank, restoredBanks[sysId], `${sysId}: restored bank is adopted by reference`);
  assert.deepEqual(bank.map((r) => r.name), saved.map((r) => r.name), `${sysId}: names survive save/reload`);
  assert.deepEqual(
    bank.filter((r) => r.qship).map((r) => r.coverName),
    saved.filter((r) => r.qship).map((r) => r.coverName),
    `${sysId}: cover names survive save/reload`,
  );
}
console.log('ok save/reload: every name and cover is stable');

console.log('issue-270 npc names: PASS');
