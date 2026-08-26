import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { isLiveCommand, isPr1LiveCommand, isForbiddenName } from '../../../src/game/agent-schema.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const api = readFileSync(join(root, 'src/systems/agent-api.js'), 'utf8');
const controls = readFileSync(join(root, 'src/systems/controls.js'), 'utf8');

const pin = (name, ok) => {
  if (!ok) throw new Error(`fail: ${name}`);
  console.log('ok', name);
};

pin('live dock', isLiveCommand('dock') === true);
pin('live hail', isLiveCommand('hail') === true);
pin('live selectTarget', isLiveCommand('selectTarget') === true);
pin('live pulse', isLiveCommand('pulse') === true);
pin('live setWeaponGroup', isLiveCommand('setWeaponGroup') === true);
pin('pr1 ping', isPr1LiveCommand('ping') === true);
pin('pr1 not dock', isPr1LiveCommand('dock') === false);
pin('teleport forbidden', isForbiddenName('teleport') === true);
pin('api imports agentPulse', /import \{[^}]*agentPulse/.test(api));
pin('api imports agentSetWeaponGroup', /agentSetWeaponGroup/.test(api));
pin('api no ctx.input assign', !/ctx\.input\.[A-Za-z]+\s*=/.test(api) && !/ctx\.input\s*=/.test(api));
pin('api no berthHold write', !/flags\.berthHold\s*=(?!=)/.test(api));
pin('api no position write', !/ship\.object\.position/.test(api));
pin('four pulse edges', controls.includes("new Set(['dock', 'hail', 'target', 'reticleLock'])"));
pin('no camera pulse export', !/agentPulse\([^)]*'camera'/.test(controls));
pin('skip weapon helper used', /shouldSkipWeaponGroupDigits\(ctx\)/.test(controls.split('export function agentSetWeaponGroup')[1] || ''));
pin('KeyJ still pendingDock', /case 'KeyJ':\s*\n\s*if \(!shouldSkipDockPulse\(ctx\)\) pendingDock = true;/.test(controls));
pin('timing comment', controls.includes("act({ name:'dock' })") && controls.includes('pendingDock'));

const { agentPulse, agentSetWeaponGroup, agentSelectTarget } = await import('../../../src/systems/controls.js');

pin('bad edge', agentPulse({}, 'camera') === 'unknown');
pin('proto edge', agentPulse({}, '__proto__') === 'unknown');
pin('afterburner edge', agentPulse({}, 'afterburner') === 'unknown');
pin('target edge ok', agentPulse({}, 'target') === '');
pin('reticle edge ok', agentPulse({}, 'reticleLock') === '');

const hailBlock = { flags: { chartOpen: true } };
pin('hail overlay', agentPulse(hailBlock, 'hail') === 'no-service');

const wg = { flags: {}, input: { weaponGroup: 1 } };
pin('wg 3', agentSetWeaponGroup(wg, 3) === '' && wg.input.weaponGroup === 3);
pin('wg 0', agentSetWeaponGroup(wg, 0) === 'bad-qty');
pin('wg 1.5', agentSetWeaponGroup(wg, 1.5) === 'bad-qty');
pin('wg skip docked', agentSetWeaponGroup({ flags: { docked: true }, input: { weaponGroup: 1 } }, 2) === 'no-service');

const none = {
  flags: {},
  input: { weaponGroup: 1 },
  targets: { current: 'keep' },
  ship: { object: null },
  ships: [],
};
pin('none in range', agentSelectTarget(none) === 'no-service' && none.targets.current === 'keep');

console.log('pulse-probe pass');
