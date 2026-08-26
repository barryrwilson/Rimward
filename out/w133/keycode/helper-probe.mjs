/**
 * Verifier probe for decodeKeyCode (Wave 133 helper).
 * Does not import Vite or boot the game.
 */
import { readFileSync } from 'node:fs';
import { decodeKeyCode } from '../../../src/systems/key-code.js';

const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${name}${detail ? '  — ' + detail : ''}`);
}

function expectEq(name, got, want) {
  const pass = Object.is(got, want);
  record(name, pass, pass ? `got ${JSON.stringify(got)}` : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
}

const frozen = [
  [{ code: 'KeyW', key: 'p' }, 'KeyW'],
  [{ code: '', key: 'w' }, 'KeyW'],
  [{ code: '', key: 'W' }, 'KeyW'],
  [{ code: '', key: '1' }, 'Digit1'],
  [{ code: '', key: '0' }, 'Digit0'],
  [{ code: '', key: ' ' }, 'Space'],
  [{ code: '', key: 'Shift' }, 'ShiftLeft'],
  [{ code: '', key: 'Escape' }, 'Escape'],
  [{ code: '', key: '' }, ''],
  [{ code: '', key: '__proto__' }, ''],
  [null, ''],
];

for (const [input, want] of frozen) {
  const label = input == null ? 'null' : JSON.stringify(input);
  let threw = false;
  let got;
  try {
    got = decodeKeyCode(input);
  } catch (err) {
    threw = true;
    got = err && err.message;
  }
  if (threw) {
    record(`frozen ${label}`, false, `threw ${got}`);
  } else {
    expectEq(`frozen ${label}`, got, want);
  }
}

expectEq("{code:'Digit3', key:'w'}", decodeKeyCode({ code: 'Digit3', key: 'w' }), 'Digit3');

// Live KeyboardEvent-like: code/key are prototype getters, not own properties.
function KeyboardEventLike() {}
Object.defineProperty(KeyboardEventLike.prototype, 'code', {
  configurable: true,
  enumerable: true,
  get() {
    return this._code;
  },
});
Object.defineProperty(KeyboardEventLike.prototype, 'key', {
  configurable: true,
  enumerable: true,
  get() {
    return this._key;
  },
});

const live = new KeyboardEventLike();
live._code = 'KeyW';
live._key = 'p';
record(
  'proto getters not own',
  !Object.hasOwn(live, 'code') && !Object.hasOwn(live, 'key'),
  `hasOwn code=${Object.hasOwn(live, 'code')} key=${Object.hasOwn(live, 'key')}`,
);
expectEq('KeyboardEvent proto getter code KeyW', decodeKeyCode(live), 'KeyW');

const liveEmpty = new KeyboardEventLike();
liveEmpty._code = '';
liveEmpty._key = 'w';
expectEq('KeyboardEvent proto getter empty code maps key w', decodeKeyCode(liveEmpty), 'KeyW');

const liveDigit = new KeyboardEventLike();
liveDigit._code = '';
liveDigit._key = '1';
expectEq('KeyboardEvent proto getter empty code maps key 1', decodeKeyCode(liveDigit), 'Digit1');

// Host proto chain: instance -> KE -> UIEvent -> Event -> Object.prototype
const EventProto = Object.create(Object.prototype);
const UIEventProto = Object.create(EventProto);
const KEProto = Object.create(UIEventProto);
Object.defineProperty(KEProto, 'code', {
  configurable: true,
  get() {
    return 'KeyA';
  },
});
Object.defineProperty(KEProto, 'key', {
  configurable: true,
  get() {
    return 'a';
  },
});
const hostEv = Object.create(KEProto);
record(
  'host chain getters not own',
  !Object.hasOwn(hostEv, 'code') && !Object.hasOwn(hostEv, 'key'),
  '',
);
expectEq('host proto chain getter KeyA', decodeKeyCode(hostEv), 'KeyA');

// Object.prototype.code pollution must not fill {}
const prevCode = Object.getOwnPropertyDescriptor(Object.prototype, 'code');
const prevKey = Object.getOwnPropertyDescriptor(Object.prototype, 'key');
try {
  Object.defineProperty(Object.prototype, 'code', {
    configurable: true,
    enumerable: true,
    value: 'KeyHacked',
  });
  Object.defineProperty(Object.prototype, 'key', {
    configurable: true,
    enumerable: true,
    value: 'w',
  });
  expectEq('Object.prototype.code pollution on {}', decodeKeyCode({}), '');
  expectEq('pollution does not fill empty own code/key', decodeKeyCode({ code: '', key: '' }), '');
} finally {
  if (prevCode) Object.defineProperty(Object.prototype, 'code', prevCode);
  else delete Object.prototype.code;
  if (prevKey) Object.defineProperty(Object.prototype, 'key', prevKey);
  else delete Object.prototype.key;
}

// Never throw
const throwers = [
  undefined,
  0,
  'KeyW',
  [],
  { get code() { throw new Error('code'); } },
  Object.create({
    get code() {
      throw new Error('proto code');
    },
  }),
];
let throwFail = false;
for (const sample of throwers) {
  try {
    const out = decodeKeyCode(sample);
    if (typeof out !== 'string') {
      throwFail = true;
      record('never-throw type', false, `non-string ${typeof out}`);
    }
  } catch (err) {
    throwFail = true;
    record('never-throw', false, String(err && err.message));
  }
}
if (!throwFail) record('never-throw on bad hosts', true, '');

// TRACKED: Digit0/8/9 must stay out. Digit1-5 stay in.
const controlsSrc = readFileSync(new URL('../../../src/systems/controls.js', import.meta.url), 'utf8');
const trackedMatch = controlsSrc.match(/const TRACKED = new Set\(\[([\s\S]*?)\]\);/);
if (!trackedMatch) {
  record('TRACKED block present', false, 'regex miss');
} else {
  const body = trackedMatch[1];
  const tokens = [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  const set = new Set(tokens);
  record('TRACKED lacks Digit0', !set.has('Digit0'), tokens.join(','));
  record('TRACKED lacks Digit8', !set.has('Digit8'), '');
  record('TRACKED lacks Digit9', !set.has('Digit9'), '');
  record(
    'TRACKED has Digit1-5',
    set.has('Digit1') && set.has('Digit2') && set.has('Digit3') && set.has('Digit4') && set.has('Digit5'),
    '',
  );
}

const keydownOk =
  /window\.addEventListener\('keydown', \(e\) => \{\s*const code = decodeKeyCode\(e\);/.test(controlsSrc);
const keyupOk =
  /window\.addEventListener\('keyup', \(e\) => \{\s*const code = decodeKeyCode\(e\);/.test(controlsSrc);
const keydownOld = /TRACKED\.has\(e\.code\)/.test(controlsSrc);
const keyupOld = /pressed\.delete\(e\.code\)/.test(controlsSrc);
record('keydown uses decodeKeyCode', keydownOk, '');
record('keyup uses decodeKeyCode', keyupOk, '');
record('keydown does not use e.code for TRACKED', !keydownOld, '');
record('keyup does not delete e.code', !keyupOld, '');

const pulseMatch = controlsSrc.match(/export function agentPulse\(ctx, edge\) \{[\s\S]*?\n\}/);
if (!pulseMatch) {
  record('agentPulse present', false, '');
} else {
  const body = pulseMatch[0];
  record('agentPulse does not call decodeKeyCode', !body.includes('decodeKeyCode'), '');
  record(
    'agentPulse still docks/hails/target/reticleLock',
    body.includes("edge === 'dock'") &&
      body.includes("edge === 'hail'") &&
      body.includes("edge === 'target'") &&
      body.includes("edge === 'reticleLock'"),
    '',
  );
}

const src = readFileSync(new URL('../../../src/systems/key-code.js', import.meta.url), 'utf8');
record('key-code has no for-in', !/\bfor\s*\(\s*\w+\s+in\s+/.test(src), '');
record('key-code uses Object.hasOwn', src.includes('Object.hasOwn'), '');
record('key-code depth cap 8', src.includes('depth < 8'), '');
record('key-code stops at Object.prototype', src.includes('cur !== Object.prototype'), '');
record('key-code outer try/catch', /export function decodeKeyCode\(e\) \{\s*try \{/.test(src), '');

const failed = results.filter((r) => !r.pass);
console.log('---');
console.log(`total=${results.length} fail=${failed.length}`);
if (failed.length) {
  process.exitCode = 1;
}
