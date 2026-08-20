// HUD-02 PR3 living (bio) skin + AGEZ hide. Headless CSS/JS pins.
// Run: node --import ./scripts/with-css-stub.mjs out/w62/bio/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hairBoxForRail, agezHairOff } from '../../../src/systems/hud.js';

const fails = [];
function ok(name, cond, extra) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra != null ? ` ${extra}` : ''}`);
}

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '../../../src/ui/hud.css'), 'utf8');
const hudJs = readFileSync(join(here, '../../../src/systems/hud.js'), 'utf8');

ok('bio.hook', css.includes("#hud[data-family='bio']"));
ok('hair.self.inset', /#hud\[data-family='bio'\] \.rw-combat-self::before\s*\{[^}]*left:\s*52px/.test(css)
  && /#hud\[data-family='bio'\] \.rw-combat-self::after\s*\{[^}]*left:\s*52px/.test(css));
ok('hair.tgt.inset', /#hud\[data-family='bio'\] \.rw-combat-target::before\s*\{[^}]*right:\s*52px/.test(css)
  && /#hud\[data-family='bio'\] \.rw-combat-target::after\s*\{[^}]*right:\s*52px/.test(css));
ok('hair.career.18', /#hud\[data-family='bio'\] \.rw-combat-self::before,\s*#hud\[data-family='bio'\] \.rw-combat-self::after/.test(css)
  || css.includes('height: 18px'));
ok('hair.combat.10', /#hud\[data-family='bio'\]\.in-combat .rw-combat-target::before\s*\{[^}]*height:\s*10px/.test(css));
ok('hair.off.css', /#hud\[data-family='bio'\] \.rw-combat-rail\.rw-hair-off::before/.test(css)
  && /content:\s*none/.test(css));
ok('rm.hide.both', css.includes("body.rw-reduced-motion #hud[data-family='bio'] .rw-combat-rail::before")
  && css.includes("body.rw-reduced-motion #hud[data-family='mech'] .rw-combat-rail::before"));
ok('contacts.cap.round', /#hud\[data-family='bio'\] \.rw-contacts-stroke\s*\{[^}]*stroke-linecap:\s*round/.test(css));
ok('no.bio.corners', !/#hud\[data-family=['"]bio['"]\][^{]*\.rw-bio::/.test(css));
ok('no.contacts.extra', !/#hud\[data-family=['"]bio['"]\][^{]*\.rw-contacts::/.test(css));
ok('no.rail.overflow', !/\.rw-combat-rail\s*\{[^}]*overflow:\s*hidden/.test(css));
ok('rails.unmoved', /top:\s*57%/.test(css) && /translate\(calc\(-100% - 78px\)/.test(css)
  && /translate\(78px, 0\)/.test(css));
ok('no.second.hud', !/#hud-mech/.test(css) && !/#hud-bio/.test(css));
ok('colorblind.vein', /body\.rw-colorblind #hud\[data-family='bio'\]\s*\{[^}]*--vein:\s*var\(--rw-good\)/.test(css));
ok('bio.period.css', css.includes('--rw-bio-period'));
ok('pupil.rm.none', /body\.rw-reduced-motion #hud\[data-family='bio'\] \.rw-reticle-pupil\s*\{[^}]*animation:\s*none/.test(css));

const mechStart = css.indexOf('#hud[data-family="mech"]');
const bioStart = css.indexOf("#hud[data-family='bio']");
const galaxyStart = css.indexOf('galaxy chart overlay');
ok('mech.untouched.block', mechStart >= 0 && bioStart > mechStart && mechStart < galaxyStart);

const box = hairBoxForRail('self', 1600, 900, 220, 140, false);
ok('agez.h600.hide', agezHairOff(600, 513, false, 0, 0, box) === true, JSON.stringify(box));
ok('agez.h.missing', agezHairOff(NaN, 513, false, 0, 0, box) === true);
const far = hairBoxForRail('tgt', 1600, 900, 220, 140, false);
ok('agez.far.show', agezHairOff(800, 200, false, 0, 0, far) === false);

ok('js.period', /bioPeriodSec/.test(hudJs) && /--rw-bio-period/.test(hudJs));
ok('js.no.hull.write', !/hullKind\s*=(?!=)/.test(hudJs));
ok('js.no.innerHTML', !/innerHTML/.test(hudJs));
ok('js.no.throttle.write', !/input\.throttle\s*=/.test(hudJs));
const upd = hudJs.slice(hudJs.indexOf('update(dt)'));
ok('js.no.frame.rect', !upd.includes('getBoundingClientRect'));
ok('js.resize.init', /window\.addEventListener\(\s*['"]resize['"]/.test(hudJs));
ok('js.family.keeps.hair', /family === 'bio'/.test(hudJs) && /classList\.add\('rw-hair-off'\)/.test(hudJs));

if (fails.length) {
  console.log(`PROBE FAIL — ${fails.length}: ${fails.join(', ')}`);
  process.exit(1);
}
console.log('PROBE PASS');
