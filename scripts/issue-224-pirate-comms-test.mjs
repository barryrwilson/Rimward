import { seedBootRandom, installDomStubs, bootGameSystems } from './lib/boot-harness.mjs';
import { runCommsPins } from './lib/issue-224-comms-pins.mjs';

seedBootRandom();
const dom = installDomStubs();
const { ctx } = await bootGameSystems();
for (const node of dom.walkDom(document.body)) {
  if (node.dataset?.titleAction === 'new') { node.click(); break; }
}
dom.dispatchKey('Digit1');
for (const pin of runCommsPins(ctx)) console.log('ok', pin);
console.log('Issue #224 pirate comms PASS');
