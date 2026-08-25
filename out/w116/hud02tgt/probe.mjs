// Wave 116 HUD-02 PR1 target facing class tokens.
// Run: node out/w116/hud02tgt/probe.mjs
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

function lockToken(target) {
  if (!target || !target.state) return '';
  const rec = target.record;
  const coverOn = !!(rec && rec.qship === true && rec.revealed !== true);
  const raw = coverOn
    ? (rec.coverClass ?? 'freighter')
    : (rec && rec.classKey) || (target.state && target.state.classKey);
  if (typeof raw === 'string' && Object.prototype.hasOwnProperty.call(SHIP_CLASSES, raw)) {
    return raw;
  }
  return '';
}

ok('lock.ship.heavy', lockToken({ state: { classKey: 'heavy' }, record: { classKey: 'heavy' } }) === 'heavy');
ok('lock.omit.none', lockToken(null) === '');
ok('lock.omit.nostate', lockToken({ record: { classKey: 'heavy' } }) === '');
ok('lock.omit.proto', lockToken({ state: { classKey: '__proto__' }, record: { classKey: '__proto__' } }) === '');
ok('lock.omit.constructor', lockToken({ state: { classKey: 'constructor' }, record: { classKey: 'constructor' } }) === '');
ok('lock.omit.unknown', lockToken({ state: { classKey: 'nope' }, record: { classKey: 'nope' } }) === '');
ok('lock.omit.empty', lockToken({ state: { classKey: '' }, record: { classKey: '' } }) === '');
ok('lock.qship.cover', lockToken({
  state: { classKey: 'cutter' },
  record: { qship: true, revealed: false, classKey: 'cutter', coverClass: 'freighter' },
}) === 'freighter');
ok('lock.qship.default.cover', lockToken({
  state: { classKey: 'cutter' },
  record: { qship: true, revealed: false, classKey: 'cutter' },
}) === 'freighter');
ok('lock.qship.revealed', lockToken({
  state: { classKey: 'cutter' },
  record: { qship: true, revealed: true, classKey: 'cutter', coverClass: 'freighter' },
}) === 'cutter');
ok('lock.qship.mk2.still.cover', lockToken({
  state: { classKey: 'cutter', name: 'Hidden' },
  record: { qship: true, revealed: false, classKey: 'cutter', coverClass: 'freighter', coverName: 'Cover' },
}) === 'freighter');
ok('lock.qship.bad.cover.omit', lockToken({
  state: { classKey: 'cutter' },
  record: { qship: true, revealed: false, classKey: 'cutter', coverClass: '__proto__' },
}) === '');

const tokFn = hudJs.slice(
  hudJs.indexOf('function classKeyToken'),
  hudJs.indexOf('function applyClassKeyAttr'),
);
const lockFn = hudJs.slice(
  hudJs.indexOf('function lockClassToken'),
  hudJs.indexOf('function applyTgtClassKeyAttr'),
);
const hideSlice = hudJs.slice(
  hudJs.indexOf("tgtRail.classList.toggle('is-hidden', !shipTgt)"),
  hudJs.indexOf('if (!targetPos || targetDead)'),
);

ok('js.lockClassToken', hudJs.includes('function lockClassToken') && lockFn.includes('coverClass'));
ok('js.applyTgtClassKeyAttr', hudJs.includes('function applyTgtClassKeyAttr'));
ok('js.hasOwn.lock', lockFn.includes('Object.prototype.hasOwnProperty.call(SHIP_CLASSES, raw)'));
ok('js.qship.coverOn', lockFn.includes('rec.qship === true') && lockFn.includes('rec.revealed !== true'));
ok('js.hide.omit', hideSlice.includes("applyTgtClassKeyAttr(tgtRail, last, '')"));
ok('js.one.root.writer', (hudJs.match(/function classKeyToken/g) || []).length === 1
  && (hudJs.match(/function applyClassKeyAttr/g) || []).length === 1);
ok('js.player.key.only', tokFn.includes('ctx.player') && !/lock|target/.test(tokFn));
ok('js.no.lock.on.hud', !/applyClassKeyAttr\(root, last, lockClassToken/.test(hudJs)
  && hudJs.includes('applyTgtClassKeyAttr(tgtRail, last,'));
ok('js.no.innerHTML', !/innerHTML|insertAdjacentHTML|document\.write/.test(hudJs));
ok('js.no.player.classKey.write', !/player\.classKey\s*=/.test(hudJs)
  && !/p0\.classKey\s*=/.test(hudJs)
  && !/pFam\.classKey\s*=/.test(hudJs));
ok('js.no.hudFamily.classKey', !/classKey/.test(hudJs.slice(
  hudJs.indexOf('export function hudFamily'),
  hudJs.indexOf('function sessionHudFamilyOverride'),
)));
ok('js.no.persist.class', !/world\.hudClass|world\.tgtClass|rw-hud-class/.test(hudJs));
ok('js.session.family.only', hudJs.includes("sessionStorage.getItem('rw-hud-family')")
  && !/sessionStorage\.(get|set)Item\('rw-hud-class'\)/.test(hudJs));
ok('js.no.forin.dataset', !/for\s*\([^)]+in[^)]+\)[^{]*dataset/.test(hudJs));

ok('css.player.self.mech', hudCss.includes('#hud[data-family="mech"][data-class-key="heavy"] .rw-combat-self .rw-facing-body'));
ok('css.player.self.bio', hudCss.includes('#hud[data-family="bio"][data-class-key="heavy"] .rw-combat-self .rw-facing-body'));
ok('css.player.no.tgt.leak.mech', !/#hud\[data-family="mech"\]\[data-class-key="heavy"\] \.rw-facing-body/.test(hudCss));
ok('css.player.no.tgt.leak.bio', !/#hud\[data-family="bio"\]\[data-class-key="heavy"\] \.rw-facing-body/.test(hudCss));
ok('css.tgt.mech.heavy', hudCss.includes('#hud[data-family="mech"] .rw-combat-target[data-class-key="heavy"] .rw-facing-body'));
ok('css.tgt.mech.ace', hudCss.includes('#hud[data-family="mech"] .rw-combat-target[data-class-key="ace"] .rw-facing-body'));
ok('css.tgt.mech.cutter', hudCss.includes('#hud[data-family="mech"] .rw-combat-target[data-class-key="cutter"] .rw-facing-body'));
ok('css.tgt.mech.frigate', hudCss.includes('#hud[data-family="mech"] .rw-combat-target[data-class-key="frigate"] .rw-facing-body'));
ok('css.tgt.mech.freighter', hudCss.includes('#hud[data-family="mech"] .rw-combat-target[data-class-key="freighter"] .rw-facing-body'));
ok('css.tgt.bio.heavy', hudCss.includes('#hud[data-family="bio"] .rw-combat-target[data-class-key="heavy"] .rw-facing-body'));
ok('css.tgt.bio.ace', hudCss.includes('#hud[data-family="bio"] .rw-combat-target[data-class-key="ace"] .rw-facing-body'));
ok('css.tgt.bio.cutter', hudCss.includes('#hud[data-family="bio"] .rw-combat-target[data-class-key="cutter"] .rw-facing-body'));
ok('css.tgt.bio.frigate', hudCss.includes('#hud[data-family="bio"] .rw-combat-target[data-class-key="frigate"] .rw-facing-body'));
ok('css.tgt.bio.freighter', hudCss.includes('#hud[data-family="bio"] .rw-combat-target[data-class-key="freighter"] .rw-facing-body'));
ok('css.light.keeps.generic', !/data-class-key="light"/.test(hudCss));
ok('css.sil.22x10', /\.rw-facing-sil\s*\{[^}]*width:\s*22px/.test(hudCss)
  && /\.rw-facing-sil\s*\{[^}]*height:\s*10px/.test(hudCss)
  && /\.rw-facing-sil\s*\{[^}]*flex:\s*0 0 22px/.test(hudCss));
ok('css.no.sil.grow', !/#hud\[data-family="mech"\]\[data-class-key=[^\]]+\] \.rw-facing-sil/.test(hudCss)
  && !/#hud\[data-family="bio"\]\[data-class-key=[^\]]+\] \.rw-facing-sil/.test(hudCss)
  && !/\.rw-combat-target\[data-class-key=[^\]]+\] \.rw-facing-sil/.test(hudCss));
ok('css.no.class.keyframes', !/@keyframes\s+rw-class/.test(hudCss));
ok('css.hub.80', /\.rw-reticle\s*\{[^}]*width:\s*80px/.test(hudCss)
  && /\.rw-reticle\s*\{[^}]*height:\s*80px/.test(hudCss));
ok('css.no.reticle.class.pip', !/\.rw-reticle[^{]*data-class-key/.test(hudCss));
ok('css.no.lock.family.attr', !/\.rw-combat-target\[data-family/.test(hudCss));

function block(sel) {
  const m = hudCss.match(new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]+)\\}`));
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}
const keys = ['heavy', 'ace', 'cutter', 'frigate', 'freighter'];
for (const key of keys) {
  const selfMech = block(`#hud[data-family="mech"][data-class-key="${key}"] .rw-combat-self .rw-facing-body`);
  const tgtMech = block(`#hud[data-family="mech"] .rw-combat-target[data-class-key="${key}"] .rw-facing-body`);
  ok(`css.cite.mech.body.${key}`, selfMech.length > 0 && selfMech === tgtMech, selfMech);
  const selfBio = block(`#hud[data-family="bio"][data-class-key="${key}"] .rw-combat-self .rw-facing-body`);
  const tgtBio = block(`#hud[data-family="bio"] .rw-combat-target[data-class-key="${key}"] .rw-facing-body`);
  ok(`css.cite.bio.body.${key}`, selfBio.length > 0 && selfBio === tgtBio);
}

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
ok('save.no.new.world.tgtClass', !/tgtClass|hudClass/.test(saveJs.slice(
  saveJs.indexOf('export const WORLD_FIELDS'),
  saveJs.indexOf('const SURVIVOR'),
)));
ok('digit0.shipyard', stationJs.includes("export const DOCK_KEY_SERVICES = Object.freeze(['market', 'jobs', 'bar', 'feed', 'repair', 'outfitting', 'people', 'launch', 'epics', 'shipyard'])")
  && stationJs.includes('if (d === 0)'));
ok('boot.wave116.pin', bootJs.includes('WAVE116: HUD-02 PR1 target facing class tokens')
  && bootJs.includes('WAVE116 HUD-02 TARGET CLASS FAIL'));
ok('boot.wave113.self.hygiene', bootJs.includes('#hud[data-family="bio"][data-class-key="heavy"] .rw-combat-self .rw-facing-body'));
ok('boot.wave114.self.hygiene', bootJs.includes('#hud[data-family="mech"][data-class-key="heavy"] .rw-combat-self .rw-facing-body'));

if (fails.length) {
  console.log(`PROBE FAIL ${fails.length}: ${fails.join(', ')}`);
  process.exit(1);
}
console.log('PROBE PASS');
