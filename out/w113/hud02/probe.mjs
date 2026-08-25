// Wave 113 HUD-02 PR1 living facing class tokens.
// Run: node out/w113/hud02/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHIP_CLASSES } from '../../../src/game/state.js';

const fails = [];
function ok(name, cond, extra) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra != null ? ` ${extra}` : ''}`);
}

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const hudJs = readFileSync(join(root, 'src/systems/hud.js'), 'utf8');
const hudCss = readFileSync(join(root, 'src/ui/hud.css'), 'utf8');
const stateJs = readFileSync(join(root, 'src/game/state.js'), 'utf8');
const saveJs = readFileSync(join(root, 'src/game/save.js'), 'utf8');
const bootJs = readFileSync(join(root, 'scripts/boot-test.mjs'), 'utf8');

const allow = Object.keys(SHIP_CLASSES);
ok('allowlist.six', allow.length === 6
  && ['light', 'heavy', 'ace', 'cutter', 'frigate', 'freighter'].every((k) => allow.includes(k)));

function token(family, raw) {
  if (family !== 'bio') return '';
  if (typeof raw === 'string' && Object.prototype.hasOwnProperty.call(SHIP_CLASSES, raw)) return raw;
  return '';
}
ok('allowlist.heavy', token('bio', 'heavy') === 'heavy');
ok('allowlist.light', token('bio', 'light') === 'light');
ok('omit.unknown', token('bio', 'nope') === '');
ok('omit.empty', token('bio', '') === '');
ok('omit.proto', token('bio', '__proto__') === '');
ok('omit.constructor', token('bio', 'constructor') === '');
ok('omit.nonstring', token('bio', 1) === '');
ok('mech.omit.heavy', token('mech', 'heavy') === '');
ok('mech.omit.light', token('mech', 'light') === '');

ok('js.import.SHIP_CLASSES', /SHIP_CLASSES/.test(hudJs)
  && /from '\.\.\/game\/state\.js'/.test(hudJs));
ok('js.hasOwn', hudJs.includes('Object.prototype.hasOwnProperty.call(SHIP_CLASSES, raw)'));
ok('js.no.innerHTML', !/innerHTML|insertAdjacentHTML|document\.write/.test(hudJs));
ok('js.no.hullKind.write', !/hullKind\s*=(?!=)/.test(hudJs));
ok('js.no.player.classKey.write', !/player\.classKey\s*=/.test(hudJs)
  && !/p0\.classKey\s*=/.test(hudJs)
  && !/pFam\.classKey\s*=/.test(hudJs));
ok('js.no.hudFamily.classKey', !/classKey/.test(hudJs.slice(
  hudJs.indexOf('export function hudFamily'),
  hudJs.indexOf('function sessionHudFamilyOverride'),
)));
ok('js.class.outside.family.if', !/classKey/.test(hudJs.slice(
  hudJs.indexOf('if (kindNow !== last.kind || facNow !== last.faction || overNow !== last.hudOverride)'),
  hudJs.indexOf("tgtRail.classList.add('rw-hair-off')"),
)) && /applyClassKeyAttr\(root, last, classKeyToken\(ctx, last\.family\)\)/.test(hudJs.slice(
  hudJs.indexOf("tgtRail.classList.add('rw-hair-off')"),
  hudJs.indexOf('const tsNow = ctx.settings'),
)));
ok('js.init.write', /applyClassKeyAttr\(root, last, classKeyToken\(ctx, last\.family\)\)/.test(hudJs.slice(
  hudJs.indexOf('last.family = hudFamily(ctx)'),
  hudJs.indexOf("root.style.setProperty('--rw-bio-period'"),
)));
ok('js.family.tokens', hudJs.includes("/** @returns {'mech' | 'bio'} */"));
ok('js.no.persist.class', !/world\.hudClass|rw-hud-class/.test(hudJs));
ok('js.session.family.only', hudJs.includes("sessionStorage.getItem('rw-hud-family')")
  && !/sessionStorage\.(get|set)Item\('rw-hud-class'\)/.test(hudJs));

ok('css.heavy', hudCss.includes('#hud[data-family="bio"][data-class-key="heavy"] .rw-facing-body')
  && hudCss.includes('#hud[data-family="bio"][data-class-key="heavy"] .rw-facing-nose'));
ok('css.ace', hudCss.includes('#hud[data-family="bio"][data-class-key="ace"] .rw-facing-body'));
ok('css.cutter', hudCss.includes('#hud[data-family="bio"][data-class-key="cutter"] .rw-facing-body'));
ok('css.frigate', hudCss.includes('#hud[data-family="bio"][data-class-key="frigate"] .rw-facing-body'));
ok('css.freighter', hudCss.includes('#hud[data-family="bio"][data-class-key="freighter"] .rw-facing-body'));
ok('css.generic.bio', hudCss.includes("#hud[data-family='bio'] .rw-facing-body")
  && hudCss.includes('polygon(0% 32%, 20% 4%, 58% 0%, 100% 40%, 100% 60%, 58% 100%, 20% 96%, 0% 68%)'));
ok('css.sil.22x10', /#hud\[data-family=['"]bio['"]\] \.rw-facing-sil\s*\{[^}]*width:\s*22px/.test(hudCss)
  && /#hud\[data-family=['"]bio['"]\] \.rw-facing-sil\s*\{[^}]*height:\s*10px/.test(hudCss)
  && /\.rw-facing-sil\s*\{[^}]*width:\s*22px/.test(hudCss)
  && /\.rw-facing-sil\s*\{[^}]*height:\s*10px/.test(hudCss));
ok('css.no.sil.grow', !/#hud\[data-family="bio"\]\[data-class-key=[^\]]+\] \.rw-facing-sil/.test(hudCss));
ok('css.no.mech.class', !/#hud\[data-family=['"]mech['"]\]\[data-class-key/.test(hudCss));
ok('css.no.class.keyframes', !/@keyframes\s+rw-class/.test(hudCss)
  && !/#hud\[data-family="bio"\]\[data-class-key[^{]+\{[^}]*animation:/.test(hudCss));
ok('css.fore.aft', hudCss.includes('.rw-facing-end')
  && hudJs.includes("el('span', 'rw-facing-end rw-facing-fore', ends, 'FORE')")
  && hudJs.includes("el('span', 'rw-facing-end rw-facing-aft', ends, 'AFT')"));
ok('css.hub.80', /#?\.?rw-reticle\s*\{[^}]*width:\s*80px/.test(hudCss)
  && /#?\.?rw-reticle\s*\{[^}]*height:\s*80px/.test(hudCss));
ok('css.no.reticle.class.pip', !/\.rw-reticle[^{]*data-class-key/.test(hudCss)
  && !/\.rw-reticle\s+[^{]*class-pip/.test(hudCss));

const reticleBuild = hudJs.slice(
  hudJs.indexOf("const reticle = el('div', 'rw-reticle', root);"),
  hudJs.indexOf("const crosshair = el('div', 'rw-crosshair', root);"),
);
ok('hub.children.unchanged', reticleBuild.includes("el('div', 'rw-reticle-pupil', reticle)")
  && reticleBuild.includes("el('span', 'rw-reticle-cilia', reticle)")
  && reticleBuild.includes("el('div', 'rw-reticle-range', reticle, 'RANGE')")
  && (reticleBuild.match(/el\(/g) || []).length === 4
  && !/classKey|class-key/.test(reticleBuild));

ok('state.readonly.no.hud.field', !/hudClass|data-class-key/.test(stateJs));
ok('save.no.new.world.hudClass', !/hudClass/.test(saveJs.slice(
  saveJs.indexOf('export const WORLD_FIELDS'),
  saveJs.indexOf('const SURVIVOR'),
)));
ok('boot.wave113.pin', bootJs.includes('WAVE113: HUD-02 PR1 living facing class tokens'));
const wave113Block = bootJs.slice(
  bootJs.indexOf('WAVE113: HUD-02 PR1 living facing class tokens'),
  bootJs.indexOf('if (errors === 0)'),
);
ok('boot.wave113.dataset', wave113Block.includes("hudRoot113?.dataset?.classKey === 'heavy'")
  && wave113Block.includes('hudRoot113?.dataset?.family === \'bio\'')
  && wave113Block.includes('reticle113.children.length')
  && !wave113Block.includes('getAttribute')
  && !wave113Block.includes('childElementCount'));
ok('boot.wave62.stays', bootJs.includes('WAVE62: HUD-02 PR1 family hook'));
ok('boot.wave65.stays', bootJs.includes('WAVE65: yard catalog depth'));

if (fails.length) {
  console.log(`PROBE FAIL — ${fails.length}: ${fails.join(', ')}`);
  process.exit(1);
}
console.log('PROBE PASS');
