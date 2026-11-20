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
 * Issue #339 adds the deterministic ambient crowd: every system must now hold
 * 25-50 records, crowd names must be unique/deterministic and consume no global
 * Math.random draws, and crowd pirates stay bounty-0 and classic (no Q-ship).
 *
 * Run: npm run test:npc-names
 */
import assert from 'node:assert/strict';
import { SYSTEMS } from '../src/game/state.js';
import { ensureBank, minerCountForCast } from '../src/game/world.js';

const FALLBACK = /^(Reaver|Freighter|Patrol|Miner|Hauler) [a-z0-9_]+-\d+$/;

function legacyCount(cast) {
  const miners = minerCountForCast(cast);
  return (cast.traders | 0) + (cast.pirates | 0) + (cast.patrols | 0) + miners + (cast.ace ? 1 : 0);
}

function crowdCount(crowd) {
  if (!crowd || typeof crowd !== 'object') return 0;
  return (crowd.traders | 0) + (crowd.pirates | 0) + (crowd.patrols | 0) + (crowd.miners | 0);
}

const ctx = { world: { recordBanks: {} } };
const generated = {};
let checked = 0;
let covers = 0;
let crowdChecked = 0;

for (const [sysId, def] of Object.entries(SYSTEMS)) {
  const bank = ensureBank(ctx, sysId);
  generated[sysId] = bank;

  const legacy = legacyCount(def.cast);
  const crowd = crowdCount(def.crowd);
  const expected = legacy + crowd;
  assert.equal(bank.length, expected, `${sysId}: bank covers every cast + crowd slot`);
  assert.ok(expected >= 25 && expected <= 50, `${sysId}: record total ${expected} in the 25-50 band`);

  const byRole = { trader: 0, pirate: 0, patrol: 0, miner: 0, ace: 0 };
  const seen = new Set();
  let systemCovers = 0;

  for (let index = 0; index < bank.length; index++) {
    const rec = bank[index];
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

    if (index >= legacy) {
      // Crowd records: deterministic, ambient, no Q-ship, no board bounty.
      crowdChecked++;
      assert.equal(rec.bounty, rec.role === 'pirate' ? 0 : rec.bounty, `${sysId}/${rec.id}: crowd pirate is bounty-0`);
      assert.ok(!rec.qship, `${sysId}/${rec.id}: crowd stays classic`);
    }
  }

  const crowdRoles = def.crowd ?? {};
  assert.equal(byRole.trader, (def.cast.traders | 0) + (crowdRoles.traders | 0), `${sysId}: traders match cast + crowd`);
  assert.equal(byRole.pirate, (def.cast.pirates | 0) + (crowdRoles.pirates | 0), `${sysId}: pirates match cast + crowd`);
  assert.equal(byRole.patrol, (def.cast.patrols | 0) + (crowdRoles.patrols | 0), `${sysId}: patrols match cast + crowd`);
  assert.equal(byRole.miner, minerCountForCast(def.cast) + (crowdRoles.miners | 0), `${sysId}: miners match cast + crowd`);
  assert.equal(byRole.ace, def.cast.ace ? 1 : 0, `${sysId}: ace matches cast`);
  assert.equal(systemCovers, (def.cast.pirates | 0) >> 1, `${sysId}: every disguised pirate has a cover`);

  checked += bank.length;
  covers += systemCovers;
}

assert.ok(Object.keys(SYSTEMS).length >= 100, 'authored and generated systems are all covered');
assert.ok(checked >= 3000, `generated ${checked} records`);
assert.ok(covers >= 40, `generated ${covers} Q-ship covers`);
assert.ok(crowdChecked >= 2500, `generated ${crowdChecked} crowd records`);
console.log(`ok ${Object.keys(SYSTEMS).length} systems: ${checked} records (${crowdChecked} crowd), ${covers} Q-ship covers, no fallback names`);

// Determinism: a second fresh generation must produce the same crowd names and
// crowd-only fields. Legacy fields legitimately draw the process Math.random,
// so only the crowd suffix (and every name) is compared byte-for-byte.
const ctx2 = { world: { recordBanks: {} } };
for (const [sysId, def] of Object.entries(SYSTEMS)) {
  const bank = generated[sysId];
  const bank2 = ensureBank(ctx2, sysId);
  assert.equal(bank2.length, bank.length, `${sysId}: deterministic crowd count`);
  assert.deepEqual(bank2.map((r) => r.name), bank.map((r) => r.name), `${sysId}: deterministic names`);
  const legacy = legacyCount(def.cast);
  const crowdA = bank.slice(legacy).map((r) => [r.name, r.role, r.route, r.legT, r.personality, r.resolveSeed, r.cargo]);
  const crowdB = bank2.slice(legacy).map((r) => [r.name, r.role, r.route, r.legT, r.personality, r.resolveSeed, r.cargo]);
  assert.deepEqual(crowdB, crowdA, `${sysId}: crowd records are deterministic`);
}
console.log('ok determinism: every name and every crowd record is reproducible');

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
