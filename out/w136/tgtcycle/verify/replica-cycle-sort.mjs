/**
 * Replica of Wave 136 cycleTarget / isCycleHostile / collect-sort wrap.
 * Does not import src. Run: node out/w136/tgtcycle/verify/replica-cycle-sort.mjs
 */

function isCycleHostile(ref) {
  try {
    if (!ref || !ref.object || ref.lockKind) return false;
    if (!ref.state || ref.state.destroyed) return false;
    if (ref.ai && ref.ai.intent === true) return true;
    return false;
  } catch {
    return false;
  }
}

function sortCands(cands) {
  let gated = false;
  for (let i = 0; i < cands.length; i++) {
    if (isCycleHostile(cands[i] && cands[i].ref)) {
      gated = true;
      break;
    }
  }
  if (gated) {
    cands.sort((a, b) => {
      const ha = isCycleHostile(a && a.ref) ? 0 : 1;
      const hb = isCycleHostile(b && b.ref) ? 0 : 1;
      if (ha !== hb) return ha - hb;
      return a.d2 - b.d2;
    });
  } else {
    cands.sort((a, b) => a.d2 - b.d2);
  }
  return gated;
}

function cycleOnce(cands, current) {
  const gated = sortCands(cands);
  const idx = cands.findIndex((c) => c.ref === current);
  const next = cands[(idx + 1) % cands.length].ref;
  return { gated, next, idx, order: cands.map((c) => c.ref.id) };
}

function ship(id, d2, extra = {}) {
  return {
    ref: {
      id,
      object: extra.object === undefined ? { id } : extra.object,
      state: extra.state === undefined ? { destroyed: false } : extra.state,
      ai: extra.ai === undefined ? { intent: false } : extra.ai,
      lockKind: extra.lockKind,
      classKey: extra.classKey,
      coverClass: extra.coverClass,
    },
    d2,
  };
}

function rock(id, d2) {
  return { ref: { id, position: { x: 0 } }, d2 };
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail || '' });
}

{
  const hauler = ship('hauler', 20);
  const freighter = ship('freighter', 40);
  const ace = ship('ace', 59, { ai: { intent: true } });
  const cands = [hauler, freighter, ace];
  const r = cycleOnce(cands, null);
  check(
    'empty lock + d2 20/40/59 only 59 hostile → first is ace',
    r.gated === true && r.next.id === 'ace' && r.idx === -1 && r.order[0] === 'ace',
    JSON.stringify(r),
  );
}

{
  const a = ship('near', 20);
  const b = ship('mid', 40);
  const c = ship('far', 59);
  const r = cycleOnce([a, b, c], null);
  check(
    'no intent → nearest first',
    r.gated === false && r.next.id === 'near' && r.order.join(',') === 'near,mid,far',
    JSON.stringify(r),
  );
}

{
  const rck = rock('rock10', 10);
  const ace = ship('ace', 59, { ai: { intent: true } });
  const cands = [rck, ace];
  const r = cycleOnce(cands, null);
  check(
    'group-3 rock d2 10 + hostile 59 → first hostile; rock not hostile',
    r.gated === true && r.next.id === 'ace' && isCycleHostile(rck.ref) === false && r.order[1] === 'rock10',
    JSON.stringify({ r, rockHostile: isCycleHostile(rck.ref) }),
  );
}

{
  const q = ship('qship', 50, {
    ai: { intent: true },
    classKey: 'cutter',
    coverClass: 'hauler',
  });
  const friend = ship('friend', 10);
  const r = cycleOnce([friend, q], null);
  check(
    'Q-ship intent true ranks hostile; class unused',
    r.gated === true && r.next.id === 'qship' && isCycleHostile(q.ref) === true,
    JSON.stringify(r),
  );
}

{
  const dead = ship('dead', 5, { state: { destroyed: true }, ai: { intent: true } });
  const noAi = ship('noai', 8, { ai: undefined });
  const kind = ship('stn', 9, { lockKind: 'station', ai: { intent: true } });
  const missingObj = ship('ghost', 3, { object: null, ai: { intent: true } });
  check('destroyed not hostile', isCycleHostile(dead.ref) === false, '');
  check('missing ai not hostile', isCycleHostile(noAi.ref) === false, '');
  check('lockKind not hostile', isCycleHostile(kind.ref) === false, '');
  check('missing object not hostile', isCycleHostile(missingObj.ref) === false, '');
  check('null ref not hostile', isCycleHostile(null) === false, '');
}

{
  const throwy = {
    id: 'throwy',
    object: {},
    state: { destroyed: false },
    get ai() {
      throw new Error('ai boom');
    },
  };
  let threw = false;
  let val;
  try {
    val = isCycleHostile(throwy);
  } catch {
    threw = true;
  }
  check('throwy ai getter does not throw; not hostile', threw === false && val === false, String(val));
}

{
  const friend = ship('hauler', 20);
  const mid = ship('freighter', 40);
  const ace = ship('ace', 59, { ai: { intent: true } });
  const fromFriend = cycleOnce([friend, mid, ace], friend.ref);
  check(
    'current friendly stays in other bucket; next is next non-hostile not skip-to-ace',
    fromFriend.gated === true && fromFriend.next.id === 'freighter',
    JSON.stringify(fromFriend),
  );
}

{
  const a = ship('h50', 50, { ai: { intent: true } });
  const b = ship('h59', 59, { ai: { intent: true } });
  const f = ship('f20', 20);
  const r = cycleOnce([f, b, a], null);
  check(
    'two hostiles then others: nearest hostile first',
    r.order.join(',') === 'h50,h59,f20' && r.next.id === 'h50',
    JSON.stringify(r),
  );
}

{
  const combatFar = ship('bubble800', 700, { ai: { intent: false } });
  const near = ship('near', 20);
  combatFar.flagsCombat = true;
  const r = cycleOnce([near, combatFar], null);
  check(
    'no in-envelope intent → d2 only even if combat flag imagined',
    r.gated === false && r.next.id === 'near',
    JSON.stringify(r),
  );
}

{
  const farH = ship('farH', 500, { ai: { intent: true } });
  const near = ship('near', 20);
  const pair = [near, farH];
  const r0 = cycleOnce(pair, null);
  const r1 = cycleOnce(pair, r0.next);
  check(
    'wrap from nearest hostile to next (friendly) then wrap back',
    r0.next.id === 'farH' && r1.next.id === 'near',
    JSON.stringify({ r0, r1 }),
  );
}

{
  const cands = [ship('a', 10, { ai: { intent: true } })];
  const r = cycleOnce(cands, { id: 'not-in-list', object: {}, state: {} });
  check('idx -1 → first of sorted list', r.idx === -1 && r.next.id === 'a', JSON.stringify(r));
}

{
  const rolePirate = ship('pirate', 15, { ai: { intent: false } });
  rolePirate.ref.role = 'pirate';
  const ace = ship('ace', 59, { ai: { intent: true } });
  const r = cycleOnce([rolePirate, ace], null);
  check(
    'role pirate without intent is not hostile bucket',
    isCycleHostile(rolePirate.ref) === false && r.next.id === 'ace',
    JSON.stringify(r),
  );
}

{
  const hostileFalse = ship('saveBit', 12, { ai: { intent: false, hostile: true } });
  check('save.js ai.hostile without intent is not cycle hostile', isCycleHostile(hostileFalse.ref) === false, '');
}

{
  const truthy = ship('truthy', 5, { ai: { intent: 1 } });
  check('intent === 1 is not hostile (strict true)', isCycleHostile(truthy.ref) === false, '');
}

const failed = results.filter((x) => !x.ok);
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed }, null, 2));
for (const row of results) {
  console.log(`${row.ok ? 'PASS' : 'FAIL'} ${row.name}${row.detail ? ' :: ' + row.detail : ''}`);
}
if (failed.length) process.exit(1);
