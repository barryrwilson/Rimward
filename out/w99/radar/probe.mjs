/**
 * Wave 99 TGT-03 contactsGate pins. No DOM.
 */
import { contactsGate, contactsScanner } from '../../../src/game/contacts-gate.js';

let fails = 0;
function pin(name, got, expect) {
  const pass = got === expect;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}: got ${JSON.stringify(got)} expect ${JSON.stringify(expect)}`);
  if (!pass) fails++;
  return pass;
}

pin('scanner 0 hide', contactsGate(0, false, false), false);
pin('missing scanner hide', contactsGate(undefined, false, false), false);
pin('null scanner hide', contactsGate(null, false, false), false);
pin('string 2 hide', contactsGate('2', false, false), false);
pin('99 hide', contactsGate(99, false, false), false);
pin('true hide', contactsGate(true, false, false), false);
pin('object scanner hide', contactsGate({ valueOf: () => 2 }, false, false), false);
pin('inherited object hide', contactsGate(Object.create({ scanner: 2 }), false, false), false);
pin('proto key hide', contactsGate('__proto__', false, false), false);

pin('docked hide Mk I', contactsGate(1, true, false), false);
pin('docked hide Mk II', contactsGate(2, true, false), false);
pin('jumping hide Mk I', contactsGate(1, false, true), false);
pin('jumping hide Mk II', contactsGate(2, false, true), false);
pin('docked+jumping hide', contactsGate(2, true, true), false);

pin('Mk I show in space', contactsGate(1, false, false), true);
pin('Mk II show in space', contactsGate(2, false, false), true);

const bag = { scanner: 2 };
pin('jump park hide', contactsGate(bag.scanner, false, true), false);
pin('jump does not clear scanner', bag.scanner, 2);
pin('dock does not clear scanner', contactsScanner(bag.scanner), 2);

pin('heal 0', contactsScanner(0), 0);
pin('heal 1', contactsScanner(1), 1);
pin('heal 2', contactsScanner(2), 2);
pin('heal garbage 99', contactsScanner(99), 0);
pin('heal string 1', contactsScanner('1'), 0);

if (fails === 0) {
  console.log('WAVE99 contactsGate PASS');
  process.exit(0);
}
console.log(`WAVE99 contactsGate FAIL — ${fails}`);
process.exit(1);
