// Focused agent gameplay scenarios — waves 141 (agent play parity v2) and 142
// (mission-family parity) WITHOUT the full extended boot suite.
//
// This runner exists so gameplay-scenario work iterates in minutes, not tens
// of minutes: it shares the exact boot-harness initialization and the exact
// scenario bodies with scripts/boot-test.mjs (scripts/lib/boot-harness.mjs,
// scripts/lib/agent-parity-waves.mjs), then drives the same fresh-boot front
// door (title NEW GAME click → greenhand origin pick → boot idle) and stops.
// Nothing here weakens, skips, or rewrites an assertion: the same
// runAgentParityWave141/142 functions run, the same ledgers print, and a
// non-zero exit means the same failure the full boot would report.
//
// Coverage contract: this runner is ADDITIONAL. `npm run test:boot` (the full
// extended suite) still runs waves 141/142 in place; final QA runs BOTH.
//
// Usage:
//   node --import ./scripts/with-css-stub.mjs scripts/agent-gameplay-test.mjs [--only=141|142]
import {
  seedBootRandom, installDomStubs, bootGameSystems, makeTick, makeNavHelpers,
} from './lib/boot-harness.mjs';
import { runAgentParityWave141, runAgentParityWave142 } from './lib/agent-parity-waves.mjs';

const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);
const want141 = only !== '142';
const want142 = only !== '141';

seedBootRandom();
const { winListeners, dispatchKey, walkDom } = installDomStubs();
const boot = await bootGameSystems();
const { ctx, systems } = boot;
const { SYSTEMS } = boot.binds;

const dt = 1 / 60;
let frame = 0;
let errors = 0;
const tick = makeTick(ctx, systems, {
  get frame() { return frame; },
  set frame(v) { frame = v; },
}, dt, (e, frameNo, label) => {
  errors++;
  if (errors <= 5) console.log(`UPDATE ERR frame ${frameNo} (${label}): ${e.message}\n${e.stack?.split('\n')[1]?.trim() ?? ''}`);
});
const { undockStation, dockAtCurrentStation, travelTo } = makeNavHelpers({
  ctx, SYSTEMS, tick, dispatchKey,
  onRouteError: (msg) => { console.log(msg); errors++; },
});

// ---- Front door: same fresh-boot path as the full harness (wave 40 + wave 6)
// Title: a fresh boot opens the title overlay and pauses; dismiss by CLICKING
// [1] NEW GAME (the title's capture-phase listener eats a synthetic Digit1 in
// the real browser, so the harness clicks, exactly like boot-test wave 40).
for (const n of walkDom(document.body)) {
  if (n.dataset?.titleAction === 'new') { n.click(); break; }
}
// Origin: [1] Freehold Greenhand — empty effects, the same baseline the full
// boot's wave-6 pick starts from.
dispatchKey('Digit1');
const originOk = ctx.world.origin === 'greenhand' && ctx.flags.paused === false;
if (!originOk) {
  console.log(`FRONT DOOR FAIL — origin=${ctx.world.origin} paused=${ctx.flags.paused}`);
  process.exit(1);
}
tick(120, 'boot idle');
console.log(`after boot: system=${ctx.world.currentSystem} ships=${ctx.ships.length} records=${ctx.world.records.length} docked=${ctx.flags.docked}`);

let r141 = null;
let r142 = null;
if (want141) {
  console.log('--- wave 141: agent play parity v2 (focused run) ---');
  r141 = await runAgentParityWave141({ ctx, tick, winListeners, undockStation, dockAtCurrentStation });
  if (!r141.ok) { console.log('WAVE141 AGENT-PARITY FAIL'); errors++; }
}
if (want142) {
  console.log('--- wave 142: mission-family parity (focused run) ---');
  r142 = await runAgentParityWave142({ ctx, tick, winListeners, undockStation, dockAtCurrentStation, travelTo, SYSTEMS });
  if (!r142.ok) { console.log('WAVE142 MISSION-FAMILY FAIL'); errors++; }
}

if (errors === 0) {
  console.log('AGENT GAMEPLAY PASS — focused waves clean');
} else {
  console.log(`AGENT GAMEPLAY FAIL — ${errors} errors`);
}
process.exit(errors === 0 ? 0 : 1);
