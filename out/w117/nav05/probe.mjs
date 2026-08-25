#!/usr/bin/env node
/** Wave 117 NAV-05 source probe. No Vite. No Chrome. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const ap = read('src/game/autopilot.js');
const gate = read('src/systems/gate.js');
const chart = read('src/systems/galaxychart.js');
const hud = read('src/systems/hud.js');
const ship = read('src/systems/ship.js');
const npc = read('src/systems/npc.js');
const boot = read('scripts/boot-test.mjs');

const emitJump = (s) => /emit\s*\(\s*['"]jumpRequested['"]/.test(s);
const expect = {
  missingHop: 'Autopilot refused — next hop is not on the route.',
  missingLookup: 'Autopilot refused — next gate is not in this system.',
  lookupFail: 'Autopilot cancelled — next gate is not in this system.',
  missingPath: 'Autopilot cancelled — approach path failed.',
  missingHub: 'Autopilot cancelled — hub does not list the next hop.',
  hubWrap: 'Autopilot cancelled — hub spoke cycle failed.',
  missingGate: 'Autopilot cancelled — next gate is missing.',
  arrive: 'Arrived — autopilot off.',
};
let linesOk = true;
for (const k of Object.keys(expect)) {
  if (!ap.includes(expect[k])) linesOk = false;
}
if (expect.missingHop === expect.missingGate) linesOk = false;

const pins = {
  jumpOnlyGate: emitJump(gate) && /to:\s*near\.to/.test(gate)
    && !emitJump(ap) && !emitJump(chart) && !emitJump(hud) && !emitJump(ship) && !emitJump(npc),
  wantJumpNear: ap.includes('nearTo === hop') && gate.includes('near.to === nextHop'),
  noDockPressedWrite: !ap.includes('dockPressed =') && !chart.includes('dockPressed'),
  noKeyJ: !ap.includes('KeyJ') && !chart.includes('KeyJ'),
  hopKind: gate.includes('export function lookupLiveNavHopKind') && ap.includes('lookupLiveNavHopKind'),
  ringNoCycle: gate.includes("!== 'ring'") && ap.includes("hopKind !== 'hub'"),
  tokens: ap.includes("'missingLookup'") && ap.includes("'lookupFail'")
    && ap.includes("'missingPath'") && ap.includes("'missingHub'") && ap.includes("'hubWrap'"),
  chartLive: chart.includes('showApLive(apLine(reason))')
    && chart.includes("showApLive(apLine('cancel'))")
    && chart.includes('apLive.textContent')
    && !chart.includes('innerHTML'),
  noInnerAp: !ap.includes('innerHTML'),
  wave117Pin: boot.includes('WAVE117 NAV-05') && boot.includes('liveRouteSeq'),
  wave85Stay: boot.includes('WAVE85 NAV AUTOPILOT FAIL') && boot.includes('WAVE88 AP PATH FAIL'),
  wave21Untouched: boot.includes("dispatchKey('KeyD')") && boot.includes("'D — dock'"),
  noWave87: !boot.includes('WAVE87'),
  linesSplit: linesOk && ap.includes(expect.missingHop) && ap.includes(expect.missingGate)
    && expect.missingHop !== expect.missingGate,
};

const fail = Object.entries(pins).filter(([, v]) => !v).map(([k]) => k);
console.log(JSON.stringify({ pins, fail }, null, 2));
if (fail.length) {
  console.log('WAVE117 NAV-05 PROBE FAIL');
  process.exit(1);
}
console.log('WAVE117 NAV-05 PROBE PASS');
