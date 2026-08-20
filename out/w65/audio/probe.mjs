// HUD-02 PR4 family audio. Headless CUES + hudFamily pins.
// Run: node --import ./scripts/with-css-stub.mjs out/w65/audio/probe.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hudFamily } from '../../../src/systems/hud.js';

const fails = [];
function ok(name, cond, extra) {
  if (!cond) fails.push(name);
  console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${extra != null ? ` ${extra}` : ''}`);
}

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const songSrc = readFileSync(join(root, 'src/systems/song.js'), 'utf8');
const hudSrc = readFileSync(join(root, 'src/systems/hud.js'), 'utf8');
const ctxSrc = readFileSync(join(root, 'src/core/ctx.js'), 'utf8');

const KEYS = ['hudMechRange', 'hudMechMatch', 'hudMechContact', 'hostileEnter', 'hullBand'];
const ROW = /\[['\"][a-z]+['\"],\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*[\d.]+\s*,\s*[\d.]+\]/g;

function cueRows(src, key) {
  const token = '\n  ' + key + ':';
  const i = src.indexOf(token);
  if (i < 0) return null;
  const after = src.slice(i + token.length);
  const lineEnd = after.indexOf('\n');
  const line = lineEnd >= 0 ? after.slice(0, lineEnd) : after.slice(0, 220);
  const rows = [];
  ROW.lastIndex = 0;
  let m;
  while ((m = ROW.exec(line))) rows.push({ duration: +m[1], gain: +m[2] });
  return rows;
}

ok('hudFamily.export.built', hudFamily({ player: { hullKind: 'built' } }) === 'mech');
ok('hudFamily.export.living', hudFamily({ player: { hullKind: 'living' } }) === 'bio');
ok('hudFamily.export.default', hudFamily({ player: {} }) === 'bio');

ok('song.no.playCue', !/\bplayCue\s*\(/.test(songSrc) && !/export\s+.*playCue/.test(songSrc));
ok('song.no.new.export', /^\s*export function initSong\(/m.test(songSrc)
  && (songSrc.match(/^export /gm) || []).length === 1);

ok('fx.playerFire', songSrc.includes("playerFire: [ // punchy gun bark")
  && songSrc.includes("['square', 300, 88, 0.06, 0.3, 1600, 0]"));
ok('fx.playerHit', songSrc.includes("['square', 90, 36, 0.07, 0.34, 240, 0]"));
ok('fx.npcHit', songSrc.includes("npcHit: [['triangle', 980, 640, 0.045, 0.08, 2600, 0]]"));
ok('fx.combatBed', songSrc.includes('const COMBAT_BED_GAIN = 0.05'));
ok('song.family.gate', songSrc.includes("document.getElementById('hud')?.dataset.family"));

for (const k of KEYS) {
  const rows = cueRows(songSrc, k);
  ok('cue.' + k + '.exists', !!(rows && rows.length === 1), rows ? String(rows.length) : 'missing');
  if (!rows || !rows.length) continue;
  ok('cue.' + k + '.dur', rows.every((r) => r.duration <= 0.35), JSON.stringify(rows));
  ok('cue.' + k + '.gain', rows.every((r) => r.gain <= 0.08), JSON.stringify(rows));
}

ok('ctx.hudMechRange', /\/\/ 'hudMechRange'/.test(ctxSrc));
ok('ctx.hudMechMatch', /\/\/ 'hudMechMatch'/.test(ctxSrc));
ok('ctx.hudMechContact', /\/\/ 'hudMechContact'/.test(ctxSrc));
ok('ctx.hostileEnter', /\/\/ 'hostileEnter'/.test(ctxSrc));
ok('ctx.hullBand', /\/\/ 'hullBand'/.test(ctxSrc));
ok('ctx.no.familySwap', !/familySwap|familyChanged|hudFamilyChanged/.test(ctxSrc));
ok('ctx.no.persist.event', !/persistFamily|familyPersist/.test(ctxSrc));

ok('hud.reducedMotion.gate', /emitFamilyTick[\s\S]*reducedMotion/.test(hudSrc)
  && hudSrc.includes("if (ctx.settings && ctx.settings.reducedMotion) return"));
ok('hud.range.rising', /if \(inRange\) emitFamilyTick\('mech', 'hudMechRange'/.test(hudSrc));
ok('hud.match.rising', /if \(matchOn\) emitFamilyTick\('mech', 'hudMechMatch'/.test(hudSrc));
ok('hud.contact.seen', /if \(fam === 'mech'\) ctx\.emit\('hudMechContact'/.test(hudSrc));
ok('hud.bio.hostile', /ctx\.emit\('hostileEnter'/.test(hudSrc) && hudSrc.includes('0.5'));
ok('hud.bio.hull', /emitFamilyTick\('bio', 'hullBand'/.test(hudSrc) && hudSrc.includes('lastHullBandAt'));
ok('hud.no.playCue', !/\bplayCue\s*\(/.test(hudSrc));
ok('hud.no.hullKind.write', !/hullKind\s*=(?!=)/.test(hudSrc));
ok('hud.no.throttle.write', !/input\.throttle\s*=/.test(hudSrc));
ok('hud.no.rejected.cues', !/bioMoodSting|tendrilWhoosh|heartbeatLoop/.test(hudSrc + songSrc));
ok('song.no.songShift.new', !/songShift.*family|family.*songShift/.test(songSrc));

if (fails.length) {
  console.log(`PROBE FAIL — ${fails.length}: ${fails.join(', ')}`);
  process.exit(1);
}
console.log('PROBE PASS');
console.log(JSON.stringify({ keys: KEYS, hudFamily: 'imported' }));
