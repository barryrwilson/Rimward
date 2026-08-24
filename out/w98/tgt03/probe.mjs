/**
 * Wave 98 TGT-03 helper matrix probe. No DOM.
 */
import {
  npcFireToast,
  INCOMING_DART_TOAST,
  INCOMING_FIRE_TOAST,
  DART_TOAST_GAP,
  FIRE_TOAST_GAP,
} from '../../../src/game/npc-fire-toast.js';

const fly = { elapsed: 10, flags: { docked: false }, gate: { jumping: false } };

function row(name, e, ctx, mem, expect) {
  const t = npcFireToast(e, ctx, mem);
  const got = t ? t.text : null;
  const pass = got === expect;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}: got ${JSON.stringify(got)} expect ${JSON.stringify(expect)}`);
  return pass;
}

const fresh = () => ({ lastIncomingDartAt: -1e9, lastIncomingFireAt: -1e9 });
let fails = 0;
function pin(ok) { if (!ok) fails++; return ok; }

pin(row('missile+player', { weapon: 'missile', target: 'player' }, fly, fresh(), INCOMING_DART_TOAST));
pin(row('cannon+player', { weapon: 'cannon', target: 'player' }, fly, fresh(), INCOMING_FIRE_TOAST));
pin(row('cannon+omit', { weapon: 'cannon' }, fly, fresh(), INCOMING_FIRE_TOAST));
pin(row('cannon+null', { weapon: 'cannon', target: null }, fly, fresh(), INCOMING_FIRE_TOAST));
pin(row('cannon+ship', { weapon: 'cannon', target: { id: 'npc' } }, fly, fresh(), null));
pin(row('unknown weapon', { weapon: 'laser', target: 'player' }, fly, fresh(), null));
pin(row('missing weapon', { target: 'player' }, fly, fresh(), null));
pin(row('__proto__ weapon', { weapon: '__proto__', target: 'player' }, fly, fresh(), null));
pin(row('inherited weapon', Object.create({ weapon: 'cannon', target: 'player' }), fly, fresh(), null));
pin(row('empty weapon', { weapon: '', target: 'player' }, fly, fresh(), null));
pin(row('missile omit target', { weapon: 'missile' }, fly, fresh(), null));
pin(row('psionic no emit', { weapon: 'psionic', target: 'player' }, fly, fresh(), null));

const memPair = fresh();
pin(row('dart then fire (dart)', { weapon: 'missile', target: 'player' }, fly, memPair, INCOMING_DART_TOAST));
pin(row('dart then fire (fire)', { weapon: 'cannon', target: 'player' }, fly, memPair, INCOMING_FIRE_TOAST));

const memGap = fresh();
pin(row('fire first', { weapon: 'cannon', target: 'player' }, { ...fly, elapsed: 20 }, memGap, INCOMING_FIRE_TOAST));
pin(row('fire gap 1s', { weapon: 'cannon', target: 'player' }, { ...fly, elapsed: 21 }, memGap, null));
pin(row('fire gap 2.5s', { weapon: 'cannon', target: 'player' }, { ...fly, elapsed: 20 + FIRE_TOAST_GAP }, memGap, INCOMING_FIRE_TOAST));

const memDartGap = fresh();
pin(row('dart first', { weapon: 'missile', target: 'player' }, { ...fly, elapsed: 40 }, memDartGap, INCOMING_DART_TOAST));
pin(row('dart gap 1s', { weapon: 'missile', target: 'player' }, { ...fly, elapsed: 41 }, memDartGap, null));
pin(row('dart gap 2.5s', { weapon: 'missile', target: 'player' }, { ...fly, elapsed: 40 + DART_TOAST_GAP }, memDartGap, INCOMING_DART_TOAST));

pin(row('dock suppress fire', { weapon: 'cannon', target: 'player' }, { elapsed: 50, flags: { docked: true }, gate: {} }, fresh(), null));
pin(row('jump suppress fire', { weapon: 'cannon', target: 'player' }, { elapsed: 50, flags: {}, gate: { jumping: true } }, fresh(), null));
pin(row('dock dart unchanged', { weapon: 'missile', target: 'player' }, { elapsed: 50, flags: { docked: true }, gate: {} }, fresh(), INCOMING_DART_TOAST));

const t = npcFireToast({ weapon: 'cannon', target: 'player' }, fly, fresh());
const clsOk = t && t.cls === 'warn';
console.log(`${clsOk ? 'PASS' : 'FAIL'}  fire cls warn`);
pin(clsOk);

if (fails === 0) {
  console.log('WAVE98 helper matrix PASS');
  process.exit(0);
}
console.log(`WAVE98 helper matrix FAIL — ${fails}`);
process.exit(1);
