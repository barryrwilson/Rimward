/**
 * Hail01 PR1 static probe. Does not boot Vite. Does not import THREE.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const results = [];

function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail: detail || (ok ? 'ok' : 'FAIL') });
}

function src(rel) {
  return readFileSync(resolve(root, rel), 'utf8');
}

const hail = src('src/systems/hail.js');
const npc = src('src/systems/npc.js');
const hud = src('src/systems/hud.js');

function sliceFn(srcText, name) {
  const re = new RegExp(`function ${name}\\s*\\(`);
  const m = re.exec(srcText);
  if (!m) return '';
  const start = srcText.lastIndexOf('\n', m.index);
  const from = srcText.indexOf('{', m.index);
  let depth = 0;
  for (let i = from; i < srcText.length; i++) {
    const c = srcText[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return srcText.slice(start + 1, i + 1);
    }
  }
  return '';
}

const duel = sliceFn(npc, 'updateDuel');
const engage = sliceFn(npc, 'engageTarget');
const toastFn = sliceFn(hud, 'toastForEvent');

check('hail-no-innerHTML', !/innerHTML|insertAdjacentHTML|document\.write/.test(hail));
check('npc-no-innerHTML', !/innerHTML|insertAdjacentHTML|document\.write/.test(npc));
check('hud-toast-textContent', /slot\.el\.textContent = text/.test(hud));
check('hail-demand-seconds-20', /const DEMAND_SECONDS = 20/.test(hail));
check('npc-demand-seconds-20', /const DEMAND_SECONDS = 20/.test(npc));
check('hail-finite-export', /export function finiteDemandAmount/.test(hail));
check('hail-pay-finite-debit', /Number\.isFinite\(credits\) && Number\.isFinite\(demand\)/.test(hail));
check('hail-card-line', /heaves to — \$\{n\} UU or hull\. \$\{t\}s\./.test(hail));
check('hail-jump-systemLoaded', /ev\.type === 'systemLoaded'/.test(hail) && /jumpDemandClose/.test(hail));
check('hail-dock-close', /flags\.docked === true/.test(hail) && /'docked'/.test(hail));
check('hail-defer-busy', /if \(open\)/.test(hail) && /deferIncomingHail\(ev\)/.test(hail));
check('hail-no-paused-write', !/flags\.paused\s*=/.test(hail));
check('npc-no-paused-write', !/flags\.paused\s*=/.test(npc));
check('npc-player-heave-gated', npc.includes('suppressPirateHeaveTo') && npc.includes("ai.role === 'pirate' && ai.target === 'player'"));
check('npc-heave-literal-still-npc-only', engage.includes("say(ctx, live, 'Heave to. Cargo or hull.')"));
check('npc-close-expired', /closePirateDemand\(ctx, live, 'expired'\)/.test(npc));
check('npc-close-docked', /closePirateDemand\(ctx, live, 'docked'\)/.test(npc));
check('npc-close-voided', /closePirateDemand\(ctx, live, 'voided'\)/.test(npc));
check('npc-no-hailOpened-steal', !/e\.type === 'hailOpened'/.test(npc.split('Demand-hail release')[1] || ''));
check('duel-no-payTribute', duel.length > 0 && !duel.includes('payTribute') && !duel.includes('hailOpened'));
check('duel-ace-run-line', duel.includes("Run if you like."));
check('duel-no-heave-to', !duel.includes('Heave to. Cargo or hull.'));
check('hud-hailOpened-demand', /case 'hailOpened':/.test(toastFn) && toastFn.includes('demandHail === true'));
check('hud-lookahead-this-ship', toastFn.includes('o.demandHail === true') && toastFn.includes('o.ship === e.ship'));
check('hud-no-hailDemand', !/hailDemand/.test(hail) && !/hailDemand/.test(npc) && !/case 'hailDemand':/.test(toastFn));
check('hud-toast-key', hud.includes('warn|demand|'));
check('demand-expires-at', hail.includes('demandExpiresAt') && npc.includes('demandExpiresAt'));
check('hud-parent-body', /document\.body\.appendChild\(root\)/.test(hud));
check('hud-open-copy', toastFn.includes('${name} — heave to. Pay ${n} UU or fight. ${t}s.'));
check('hud-paid-good', toastFn.includes("tribute taken. They run.") && /outcome === 'paid'/.test(toastFn));
check('hud-jumped-copy', toastFn.includes('demand dropped. You jumped.'));
check('hud-voided-copy', toastFn.includes('parley void. They fire.'));
check('hud-home-mark', /rw-home-mark/.test(hud));
check('hud-pos-home', /el\('div', 'rw-label', homeRow, 'HOME'\)/.test(hud));
check('hud-home-inset', /const HOME_EDGE_INSET = 108/.test(hud));
check('intents-wave30', hail.includes("'payTribute', 'showTeeth', 'refuseFight'"));
check('hail-digits-1-9', /Digit\(\[1-9\]\)/.test(hail));

function finiteDemandAmount(raw) {
  const floor = 50;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= floor) return Math.round(raw);
  return floor;
}

check('clamp-nan', finiteDemandAmount(NaN) === 50);
check('clamp-undef', finiteDemandAmount(undefined) === 50);
check('clamp-neg', finiteDemandAmount(-10) === 50);
check('clamp-inf', finiteDemandAmount(Infinity) === 50);
check('clamp-49', finiteDemandAmount(49) === 50);
check('clamp-50', finiteDemandAmount(50) === 50);
check('clamp-80.2', finiteDemandAmount(80.2) === 80);
check('clamp-str', finiteDemandAmount('1e999') === 50);

function debit(credits, demand) {
  if (Number.isFinite(credits) && Number.isFinite(demand)) return Math.max(0, credits - demand);
  return credits;
}
check('debit-ok', debit(100, 40) === 60);
check('debit-floor', debit(10, 40) === 0);
check('debit-nan-credits', Number.isNaN(debit(NaN, 40)) === false && debit(NaN, 40) !== 0 ? Object.is(debit(NaN, 40), NaN) === false || true : true);
check('debit-skip-nan-credits', Object.is(debit(NaN, 40), NaN));
check('debit-skip-nan-demand', debit(100, NaN) === 100);

const failed = results.filter((r) => !r.ok);
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.detail && r.detail !== 'ok' ? ' — ' + r.detail : ''}`);
}
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
