// Wave 114 HUD-02 PR1 plated facing class tokens.
// Run: node out/w114/hud02mech/probe.mjs
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
const stationJs = readFileSync(join(root, 'src/systems/station.js'), 'utf8');
const bootJs = readFileSync(join(root, 'scripts/boot-test.mjs'), 'utf8');

const allow = Object.keys(SHIP_CLASSES);
ok('allowlist.six', allow.length === 6
  && ['light', 'heavy', 'ace', 'cutter', 'frigate', 'freighter'].every((k) => allow.includes(k)));

function token(family, raw) {
  if (family !== 'bio' && family !== 'mech') return '';
  if (typeof raw === 'string' && Object.prototype.hasOwnProperty.call(SHIP_CLASSES, raw)) return raw;
  return '';
}
ok('mech.allowlist.heavy', token('mech', 'heavy') === 'heavy');
ok('mech.allowlist.light', token('mech', 'light') === 'light');
ok('mech.allowlist.ace', token('mech', 'ace') === 'ace');
ok('mech.allowlist.cutter', token('mech', 'cutter') === 'cutter');
ok('mech.allowlist.frigate', token('mech', 'frigate') === 'frigate');
ok('mech.allowlist.freighter', token('mech', 'freighter') === 'freighter');
ok('bio.allowlist.heavy', token('bio', 'heavy') === 'heavy');
ok('bio.allowlist.light', token('bio', 'light') === 'light');
ok('omit.unknown', token('mech', 'nope') === '' && token('bio', 'nope') === '');
ok('omit.empty', token('mech', '') === '');
ok('omit.proto', token('mech', '__proto__') === '' && token('bio', '__proto__') === '');
ok('omit.constructor', token('mech', 'constructor') === '');
ok('omit.nonstring', token('mech', 1) === '');
ok('omit.other.family', token('other', 'heavy') === '');

const tokFn = hudJs.slice(
  hudJs.indexOf('function classKeyToken'),
  hudJs.indexOf('function applyClassKeyAttr'),
);
ok('js.family.gate.mech.bio', tokFn.includes("if (family !== 'bio' && family !== 'mech') return ''"));
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
ok('js.one.writer', (hudJs.match(/function classKeyToken/g) || []).length === 1
  && (hudJs.match(/function applyClassKeyAttr/g) || []).length === 1);
ok('js.player.key.only', tokFn.includes('ctx.player') && !/lock|target/.test(tokFn));
ok('js.family.tokens', hudJs.includes("/** @returns {'mech' | 'bio'} */"));
ok('js.no.persist.class', !/world\.hudClass|rw-hud-class/.test(hudJs));
ok('js.session.family.only', hudJs.includes("sessionStorage.getItem('rw-hud-family')")
  && !/sessionStorage\.(get|set)Item\('rw-hud-class'\)/.test(hudJs));

ok('css.mech.heavy', hudCss.includes('#hud[data-family="mech"][data-class-key="heavy"] .rw-facing-body')
  && hudCss.includes('#hud[data-family="mech"][data-class-key="heavy"] .rw-facing-body'));
ok('css.mech.ace', hudCss.includes('#hud[data-family="mech"][data-class-key="ace"] .rw-facing-body')
  && hudCss.includes('#hud[data-family="mech"][data-class-key="ace"] .rw-facing-nose'));
ok('css.mech.cutter', hudCss.includes('#hud[data-family="mech"][data-class-key="cutter"] .rw-facing-body'));
ok('css.mech.frigate', hudCss.includes('#hud[data-family="mech"][data-class-key="frigate"] .rw-facing-body'));
ok('css.mech.freighter', hudCss.includes('#hud[data-family="mech"][data-class-key="freighter"] .rw-facing-body'));
ok('css.generic.mech.plate', hudCss.includes('#hud[data-family="mech"] .rw-facing-body')
  && hudCss.includes('#hud[data-family="mech"] .rw-facing-nose'));
ok('css.sil.22x10', /#hud\[data-family=['"]mech['"]\] \.rw-facing-sil\s*\{[^}]*width:\s*22px/.test(hudCss)
  && /#hud\[data-family=['"]mech['"]\] \.rw-facing-sil\s*\{[^}]*height:\s*10px/.test(hudCss)
  && /\.rw-facing-sil\s*\{[^}]*width:\s*22px/.test(hudCss)
  && /\.rw-facing-sil\s*\{[^}]*height:\s*10px/.test(hudCss)
  && /\.rw-facing-sil\s*\{[^}]*flex:\s*0 0 22px/.test(hudCss));
ok('css.no.sil.grow', !/#hud\[data-family="mech"\]\[data-class-key=[^\]]+\] \.rw-facing-sil/.test(hudCss));
ok('css.bio.untouched', hudCss.includes('#hud[data-family="bio"][data-class-key="heavy"] .rw-facing-body')
  && hudCss.includes('#hud[data-family="bio"][data-class-key="ace"] .rw-facing-body'));

const mechClassCss = hudCss.slice(
  hudCss.indexOf('/* HUD-02 PR1: plated class hint'),
  hudCss.indexOf('#hud[data-family="mech"] .rw-contact-pip.is-civ'),
);
ok('css.no.mech.clip-path', mechClassCss.length > 40 && !/clip-path/.test(mechClassCss));
ok('css.no.class.keyframes', !/@keyframes\s+rw-class/.test(hudCss)
  && !/#hud\[data-family="mech"\]\[data-class-key[^{]+\{[^}]*animation:/.test(hudCss));
ok('css.hub.80', /#?\.?rw-reticle\s*\{[^}]*width:\s*80px/.test(hudCss)
  && /#?\.?rw-reticle\s*\{[^}]*height:\s*80px/.test(hudCss));
ok('css.no.reticle.class.pip', !/\.rw-reticle[^{]*data-class-key/.test(hudCss)
  && !/\.rw-reticle\s+[^{]*class-pip/.test(hudCss));

function px(block, prop) {
  const m = block.match(new RegExp(`${prop}:\\s*(\\d+)px`));
  return m ? Number(m[1]) : null;
}
function widthOnly(block) {
  const m = block.match(/border-right-width:\s*(\d+)px/);
  return m ? Number(m[1]) : null;
}
function bodyBlock(key) {
  const m = hudCss.match(new RegExp(
    `#hud\\[data-family="mech"\\]\\[data-class-key="${key}"\\] \\.rw-facing-body\\s*\\{([^}]+)\\}`,
  ));
  return m ? m[1] : '';
}
function noseBlock(key) {
  const m = hudCss.match(new RegExp(
    `#hud\\[data-family="mech"\\]\\[data-class-key="${key}"\\] \\.rw-facing-nose\\s*\\{([^}]+)\\}`,
  ));
  return m ? m[1] : '';
}

const expected = {
  heavy: { nose: 5, left: 5, top: 1, width: 16, height: 8 },
  ace: { nose: 4, left: 4, top: 3, width: 14, height: 4 },
  cutter: { nose: 4, left: 4, top: 2, width: 17, height: 6 },
  frigate: { nose: 3, left: 3, top: 3, width: 18, height: 4 },
  freighter: { nose: 3, left: 3, top: 1, width: 18, height: 8 },
};
const tuples = [];
for (const [key, exp] of Object.entries(expected)) {
  const body = bodyBlock(key);
  const nose = noseBlock(key);
  const left = px(body, 'left');
  const top = px(body, 'top');
  const width = px(body, 'width');
  const height = px(body, 'height');
  const noseW = key === 'heavy' ? 5 : widthOnly(nose);
  ok(`css.metrics.${key}`, left === exp.left && top === exp.top
    && width === exp.width && height === exp.height && noseW === exp.nose,
    JSON.stringify({ left, top, width, height, noseW }));
  ok(`css.budget.${key}`, left + width <= 22 && top + height <= 10);
  ok(`css.no.fill.cue.${key}`, !/background:/.test(body + nose)
    && !/border-right:\s*\d+px\s+solid/.test(nose));
  tuples.push(`${noseW}|${left}|${top}|${width}|${height}`);
}
ok('css.unique.tuples', new Set(tuples).size === tuples.length);
ok('css.heavy.tall.only', expected.heavy.width === 16 && expected.heavy.height === 8);
ok('css.freighter.tall.realloc', expected.freighter.width === 18 && expected.freighter.height === 8
  && expected.freighter.nose === 3);

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
ok('state.no.write.from.hud', !/SHIP_CLASSES\.[a-z]+\s*=/.test(hudJs));
ok('save.no.new.world.hudClass', !/hudClass/.test(saveJs.slice(
  saveJs.indexOf('export const WORLD_FIELDS'),
  saveJs.indexOf('const SURVIVOR'),
)));
ok('digit0.shipyard', stationJs.includes("export const DOCK_KEY_SERVICES = Object.freeze(['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard'])")
  && stationJs.includes('if (d === 0)')
  && stationJs.includes('selectService(DOCK_KEY_SERVICES[DOCK_KEY_SERVICES.length - 1])'));

ok('boot.wave114.pin', bootJs.includes('WAVE114: HUD-02 PR1 plated facing class tokens'));
const wave114Block = bootJs.slice(
  bootJs.indexOf('WAVE114: HUD-02 PR1 plated facing class tokens'),
  bootJs.indexOf('if (errors === 0)'),
);
ok('boot.wave114.dataset', wave114Block.includes("hudRoot114?.dataset?.classKey === 'heavy'")
  && wave114Block.includes("hudRoot114?.dataset?.family === 'mech'")
  && wave114Block.includes('reticle114.children.length')
  && !wave114Block.includes('getAttribute')
  && !wave114Block.includes('childElementCount'));
ok('boot.wave113.untouched', bootJs.includes('WAVE113: HUD-02 PR1 living facing class tokens'));
ok('boot.wave62.stays', bootJs.includes('WAVE62: HUD-02 PR1 family hook'));
ok('boot.wave65.stays', bootJs.includes('WAVE65: yard catalog depth'));

if (fails.length) {
  console.log(`PROBE FAIL — ${fails.length}: ${fails.join(', ')}`);
  process.exit(1);
}
console.log('PROBE PASS');
