/**
 * Issue #124 — the fence's marker is earned by piracy, not only by bounties.
 *
 * The defect: Quiet Hollis (fence · Freehold) banked a favor in exactly two
 * places — a bounty claim (station.js rewardJobContacts) and Callow's vouch —
 * so a working pirate answered "Call in a favor" with "You hold no marker
 * with me." forever.
 *
 * Real boot (scripts/lib/boot-harness.mjs): the REAL station system consumes
 * REAL npcSurrendered receipts off ctx.lastEvents, exactly as the patrol
 * contract does (issue #99 group 6 pattern). No pin writes favors directly.
 *
 * Covered:
 *   1  a player-caused ransom banks one marker with the local fence, with a
 *      commLine receipt that names the contact
 *   2  a player-caused hold spill (jettison, crewPods) banks one each
 *   3  fail-closed: a world-caused receipt, an unattributed receipt, a mere
 *      break-off, and a cut-engines yield bank nothing; two paying receipts
 *      in one frame bank two
 *   4  the marker is local — the same receipt in a system with no fence
 *      banks nothing anywhere, and the dockmaster is never touched
 *   5  the banked marker is spendable through the shared favor helper and
 *      the live roster row the People desk renders reads the same count
 *
 * Run: npm run test:fence-marker
 */
import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';

let fails = 0;
function pin(name, ok, detail) {
  if (ok) { console.log('ok', name); return; }
  fails++;
  console.log('FAIL', name, detail === undefined ? '' : JSON.stringify(detail).slice(0, 500));
}

seedBootRandom();
const dom = installDomStubs();
const { ctx, systems } = await bootGameSystems();
const { contactsForSystem, spendFavor } = await import('../src/game/contacts.js');

const DT = 1 / 60;
const allEvents = [];
function tick(n, selected = systems) {
  for (let i = 0; i < n; i++) {
    ctx.world.time += DT; ctx.elapsed += DT;
    for (const [, sys] of selected) sys.update?.(DT);
    allEvents.push(...ctx.events);
    ctx.lastEvents = ctx.events; ctx.events = [];
  }
}
const only = (...names) => systems.filter(([n]) => names.includes(n));
const STATION = only('station');
const mark = () => allEvents.length;
const commSince = (m) => allEvents.slice(m).filter((e) => e.type === 'commLine').map((e) => e.text);

for (const node of dom.walkDom(document.body)) if (node.dataset?.titleAction === 'new') { node.click(); break; }
dom.dispatchKey('Digit1');
ctx.flags.paused = false;
tick(30);
ctx.flags.docked = false;

const contact = (sysId, role) => contactsForSystem(ctx, sysId).find((c) => c.role === role) ?? null;
const fence = contact('freehold', 'fence');
const dockmaster = contact('freehold', 'dockmaster');
pin('fixture: a fence works the Freehold dock, with no marker banked',
  !!fence && fence.favors === 0 && ctx.world.currentSystem === 'freehold',
  { fence, system: ctx.world.currentSystem });

// A primitive stand-in, as issue #99 group 6: station.js reads the receipt's
// outcome and causer word only.
const hull = { role: 'trader', record: { role: 'trader', name: 'Claim Wren' } };
const receipt = (outcome, causer) => {
  const ev = { ship: hull, outcome };
  if (causer !== undefined) ev.causer = causer;
  ctx.emit('npcSurrendered', ev);
  const m = mark();
  tick(2, STATION);
  return commSince(m);
};

// ---- 1. a ransom taken banks a marker -------------------------------------
{
  const lines = receipt('ransom', 'player');
  pin('a player-caused ransom banks one marker with the fence', fence.favors === 1, fence.favors);
  pin('the receipt names the fence and the ransom',
    lines.some((t) => t.includes(fence.name) && t.includes('ransom')), lines);
}

// ---- 2. a hold spilled banks a marker ------------------------------------
{
  const lines = receipt('jettison', 'player');
  pin('a player-caused jettison banks one marker', fence.favors === 2, fence.favors);
  pin('the receipt says the hold was emptied',
    lines.some((t) => t.includes(fence.name) && t.includes('hold')), lines);
  receipt('crewPods', 'player');
  pin('a player-caused crewPods spill banks one marker', fence.favors === 3, fence.favors);
}

// ---- 3. fail closed -------------------------------------------------------
{
  const before = fence.favors;
  let lines = receipt('ransom', 'world');
  pin('a world-caused ransom banks nothing', fence.favors === before && lines.length === 0, { favors: fence.favors, lines });
  lines = receipt('jettison');
  pin('an unattributed receipt banks nothing', fence.favors === before && lines.length === 0, { favors: fence.favors, lines });
  lines = receipt('flee', 'player');
  pin('a mere break-off banks nothing', fence.favors === before && lines.length === 0, { favors: fence.favors, lines });
  lines = receipt('cutEngines', 'player');
  pin('a cut-engines yield that paid nothing banks nothing', fence.favors === before && lines.length === 0, { favors: fence.favors, lines });
  ctx.emit('npcSurrendered', { ship: hull, outcome: 'ransom', causer: 'player' });
  ctx.emit('npcSurrendered', { ship: hull, outcome: 'jettison', causer: 'player' });
  tick(2, STATION);
  pin('two paying receipts in one frame bank two markers', fence.favors === before + 2, fence.favors);
}

// ---- 4. the marker is local -----------------------------------------------
{
  const before = fence.favors;
  const dmBefore = dockmaster ? dockmaster.favors : null;
  ctx.world.currentSystem = 'veridian';
  const lines = receipt('ransom', 'player');
  pin('a ransom taken in a system with no fence banks nothing anywhere',
    fence.favors === before && lines.length === 0
      && contactsForSystem(ctx, 'veridian').every((c) => c.favors === 0),
    { favors: fence.favors, lines, veridian: contactsForSystem(ctx, 'veridian').map((c) => [c.role, c.favors]) });
  ctx.world.currentSystem = 'freehold';
  pin('the dockmaster is never touched by the fence rule',
    !dockmaster || dockmaster.favors === dmBefore, dockmaster);
}

// ---- 5. the marker spends ---------------------------------------------------
{
  const before = fence.favors;
  pin('the banked marker is spendable through the shared favor helper',
    spendFavor(ctx, fence) === true && fence.favors === before - 1, fence.favors);
  // The contact the People desk renders is the live roster row.
  pin('the live roster row reads the same count',
    contact('freehold', 'fence').favors === before - 1, contact('freehold', 'fence'));
}

if (fails) {
  console.log(`ISSUE-124 FENCE MARKER FAIL — ${fails}`);
  process.exit(1);
}
console.log('ISSUE-124 FENCE MARKER PASS');
