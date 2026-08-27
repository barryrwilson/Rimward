import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..', '..');
const hud136 = readFileSync(join(root, 'src/systems/hud.js'), 'utf8');
const css136 = readFileSync(join(root, 'src/ui/hud.css'), 'utf8');
const station136 = readFileSync(join(root, 'src/systems/station.js'), 'utf8');
const state136 = readFileSync(join(root, 'src/game/state.js'), 'utf8');
const controls136 = readFileSync(join(root, 'src/systems/controls.js'), 'utf8');
const agent136 = readFileSync(join(root, 'src/systems/agent-api.js'), 'utf8');

const w136dockapproach = {
  slowVerb: hud136.includes("const DOCK_SLOW_VERB = 'Dock · SLOW — approach under 20 u/s'"),
  slowSpeed: hud136.includes('const DOCK_SLOW_SPEED = 20'),
  localBand: hud136.includes('const DOCK_SLOW_RANGE_MULT = 3')
    && hud136.includes('U.DOCK_RANGE * DOCK_SLOW_RANGE_MULT'),
  promptKeyJ: hud136.includes("pKey = 'J'")
    && /pVerb = \(!skipSlow && Number\.isFinite\(dockSpd\) && dockSpd > DOCK_SLOW_SPEED\)/.test(hud136),
  promptDockFallback: hud136.includes("? DOCK_SLOW_VERB")
    && hud136.includes(": 'Dock';"),
  selfSlowNode: hud136.includes("el('span', 'rw-slow-lamp is-hidden', selfSpeedVal, 'SLOW')"),
  matchStays: hud136.includes("el('span', 'rw-match-lamp is-hidden', value, 'MATCH')"),
  tgtSpeedOnly: /tgtSpeed\.set\(targetSpeedNow\)/.test(hud136)
    && !/tgtSpeed\.set\([^)]*SLOW/.test(hud136),
  noMakeSpeedSlowDefault: !/function makeSpeed\([^)]*\)[\s\S]{0,500}rw-slow-lamp/.test(hud136),
  jumpCopyUntouched: hud136.includes("pVerb = 'Jump to ' + destName"),
  hideJumpOwns: hud136.includes('gate.inZone && !(station && station.inZone)'),
  hideHold: hud136.includes('flags.berthHold')
    && hud136.includes('ctx.flags.berthHold'),
  hideJumping: hud136.includes('gate.jumping'),
  homeInset: hud136.includes('const HOME_EDGE_INSET = 108')
    && hud136.includes('const EDGE_MARGIN = 84'),
  cssSlow: css136.includes('.rw-slow-lamp')
    && css136.includes('.rw-slow-lamp.is-hidden { display: none; }')
    && css136.includes('letter-spacing: 0.04em'),
  cssMatch: css136.includes('.rw-match-lamp')
    && /content:\s*'MATCH'|value, 'MATCH'/.test(hud136),
  hub80: css136.includes('.rw-reticle {')
    && /width:\s*80px/.test(css136.slice(css136.indexOf('.rw-reticle {'), css136.indexOf('.rw-reticle {') + 220)),
  noInnerHtml: !hud136.includes('innerHTML')
    && !hud136.includes('insertAdjacentHTML')
    && !hud136.includes('document.write'),
  noToastSlow: !/pushToast\([^)]*SLOW/.test(hud136),
  noPausedWrite: !/flags\.paused\s*=/.test(hud136),
  noStateWrite: state136.includes('DOCK_RANGE: 45')
    && !state136.includes('DOCK_SLOW'),
  noStationEdit: !station136.includes('rw-slow-lamp')
    && !station136.includes('DOCK_SLOW'),
  keyJStays: controls136.includes('pendingDock')
    && controls136.includes('dockPressed'),
};

const extra = {
  noAgentSlow: !agent136.includes('DOCK_SLOW') && !agent136.includes('rw-slow-lamp'),
  noControlsSlow: !controls136.includes('DOCK_SLOW') && !controls136.includes('rw-slow-lamp'),
  cssNoPulseOnSlow: !/\.rw-slow-lamp[\s\S]{0,400}animation:/.test(css136),
  emDash: hud136.includes('Dock · SLOW — approach under 20 u/s'),
  noSlowOnTgtSet: !hud136.includes('tgtSpeed.set(') || !/tgtSpeed\.set\([^;]*SLOW/.test(hud136),
};

const pins = { ...w136dockapproach, ...extra };
const failed = Object.entries(pins).filter(([, v]) => !v).map(([k]) => k);
const out = { ok: failed.length === 0, failed, pins };
mkdirSync(here, { recursive: true });
writeFileSync(join(here, 'static-pins.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
if (failed.length) process.exitCode = 2;
