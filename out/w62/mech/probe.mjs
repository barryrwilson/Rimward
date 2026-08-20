// HUD-02 PR2 mech CSS contract. Headless source pins.
// Run: node --import ./scripts/with-css-stub.mjs out/w62/mech/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fails = [];
function ok(name, cond, extra) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra != null ? ` ${extra}` : ''}`);
}

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = join(here, '../../../src/ui/hud.css');
const hudJsPath = join(here, '../../../src/systems/hud.js');
const css = readFileSync(cssPath, 'utf8');
const hudJs = readFileSync(hudJsPath, 'utf8');

ok('mech.hook', css.includes('#hud[data-family="mech"]'));
const mechSectionStart = css.indexOf('#hud[data-family="mech"]');
const mechSectionEnd = css.indexOf('galaxy chart overlay');
const mechSection = mechSectionStart >= 0 && mechSectionEnd > mechSectionStart
  ? css.slice(mechSectionStart, mechSectionEnd)
  : '';
ok('no.live.token', mechSection.length > 0 && !/["']live["']/.test(mechSection));

const irisBlock = css.match(
  /#hud\[data-family="mech"\] \.rw-reticle-pupil,\s*#hud\[data-family="mech"\] \.rw-reticle-cilia\s*\{[^}]+\}/,
);
ok('iris.hidden', !!(irisBlock && /display:\s*none/.test(irisBlock[0])));

const afterStart = css.indexOf('#hud[data-family="mech"] .rw-reticle::after');
ok('after.restyle', afterStart >= 0);
const afterSlice = afterStart >= 0 ? css.slice(afterStart, afterStart + 900) : '';
ok('after.conic', afterSlice.includes('repeating-conic-gradient'));
ok('after.mask', /mask-image:\s*radial-gradient/.test(afterSlice));
ok('keepout.56', /keep-out 56px|56px diameter/.test(afterSlice));
ok('after.no.iris.spin', /animation:\s*none/.test(afterSlice));

const hubStart = css.indexOf('#hud[data-family="mech"] .rw-reticle-pupil');
const hubEnd = css.indexOf('#hud[data-family="mech"] .rw-petal');
const hub = hubStart >= 0 && hubEnd > hubStart ? css.slice(hubStart, hubEnd) : '';
ok('hub.block', hub.length > 80);
ok('hub.no.vein', !hub.includes('--vein'));
ok('hub.no.cilia.and.ticks', !/\.rw-reticle-cilia\s*\{[^}]*background/.test(hub));

ok('petals.square', /#hud\[data-family="mech"\] \.rw-petal\s*\{[^}]*border-radius:\s*0/.test(css)
  && /#hud\[data-family="mech"\] \.rw-petal\s*\{[^}]*transform:\s*none/.test(css));
ok('rails.unmoved', /top:\s*57%/.test(css) && /translate\(calc\(-100% - 78px\)/.test(css)
  && /translate\(78px, 0\)/.test(css));
ok('no.second.hud', !/#hud-mech/.test(css) && !/#hud-bio/.test(css));

ok('pr1.hudFamily', /export function hudFamily/.test(hudJs));
ok('pr1.tokens', /'mech'\s*\|\s*'bio'/.test(hudJs) || /=== 'mech' \|\| .+ === 'bio'/.test(hudJs));
ok('pr1.no.hull.write', !/hullKind\s*=(?!=)/.test(hudJs));
ok('pr1.no.innerHTML', !/innerHTML/.test(hudJs));

if (fails.length) {
  console.log(`PROBE FAIL — ${fails.length}: ${fails.join(', ')}`);
  process.exit(1);
}
console.log('PROBE PASS');
