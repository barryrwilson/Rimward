#!/usr/bin/env node
// Wave 117 CTL-01 static pins. Does not run boot-test.mjs.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

let fails = 0;
function pin(name, ok) {
  if (!ok) {
    fails++;
    console.log('FAIL', name);
  } else {
    console.log('ok', name);
  }
}

const controls = read('src/systems/controls.js');
pin('TRACKED has KeyJ', /'KeyK',\s*'KeyJ'/.test(controls) || controls.includes("'KeyJ'"));
pin('case KeyJ pendingDock', /case 'KeyJ':\s*\n\s*if \(!shouldSkipDockPulse\(ctx\)\) pendingDock = true;/.test(controls));
pin('KeyD does not set pendingDock', !/case 'KeyD':[\s\S]{0,80}pendingDock/.test(controls));
pin('strafeX still KeyD', /strafeX = \(has\('KeyD'\) \? 1 : 0\)/.test(controls));
pin('help A/D strafe', controls.includes("'A/D — lateral strafe (D = right)'"));
pin('help J dock', controls.includes("'H — hail · J — dock · C — camera"));
pin('skip helper', controls.includes('function shouldSkipDockPulse'));
pin('skip title attached helper', controls.includes('function titleOverlayAttached'));
pin('skip title parent checks', controls.includes('el.parentNode') && controls.includes('el.parent'));
pin('skip title getElementById', controls.includes("getElementById('rw-title')"));
pin('skip models', controls.includes('models?.isOpen'));
pin('no innerHTML controls', !controls.includes('innerHTML'));

const ctx = read('src/core/ctx.js');
pin('ctx dockPressed comment J', ctx.includes('edge: J (not D)'));
pin('ctx strafeX still D', ctx.includes('strafe right (D'));
pin('no jumpPressed field', !ctx.includes('jumpPressed'));

const hud = read('src/systems/hud.js');
pin('prompt dock J', hud.includes("pKey = 'J'; pVerb = 'Dock'"));
pin('prompt jump J', hud.includes("pKey = 'J'; pVerb = 'Jump to '"));
pin('hub G + J jump', hud.includes(" · J — Jump to "));
pin('hub pKey G', /nearHub\) \{\s*\n\s*\/\/[^\n]*\n\s*pKey = 'G';/.test(hud) || hud.includes("pKey = 'G';"));
pin('prompt textContent', hud.includes('promptKey.textContent') && hud.includes('promptVerb.textContent'));
pin('no innerHTML hud prompt block', !/promptKey\.innerHTML|promptVerb\.innerHTML/.test(hud));

const onb = read('src/systems/onboarding.js');
pin('onboarding J dock', onb.includes("'J — dock'"));
pin('onboarding J jump', onb.includes("'J — jump the gate'"));
pin('no D dock hint', !onb.includes("'D — dock'"));

const boot = read('scripts/boot-test.mjs');
pin('boot WAVE21 KeyJ jump', (boot.match(/dispatchKey\('KeyJ'\)/g) || []).length >= 2);
pin('boot no KeyD dispatch', !boot.includes("dispatchKey('KeyD')"));
pin('boot J dock string', boot.includes("hintCardVisible('J — dock')"));
pin('boot no D dock string', !boot.includes("hintCardVisible('D — dock')"));
pin('boot dock helper dockPressed', boot.includes('ctx.input.dockPressed = true'));
pin('boot KeyZ dismiss stays', boot.includes("dispatchKey('KeyZ')"));

console.log(fails ? `PROBE FAIL ${fails}` : 'PROBE OK');
process.exit(fails ? 1 : 0);
