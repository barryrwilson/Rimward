/**
 * Attachment audit — names every floating part in a built ship sculpt.
 *
 * The companion to scripts/measure-ships.mjs. `singleMass` cannot see a detached
 * greeble (see scripts/attachment.mjs for why), so this walks each sculpt's PARTS
 * and reports the ones that overlap nothing, plus any cluster that is not joined
 * to the main mass. Every failure it reports is real and carries the source line
 * that added it.
 *
 * Usage: node scripts/attach-audit.mjs [faction ...]
 */

import { detailBuilder } from '../src/systems/station-detail.js';
import { FACTION_STYLE } from '../src/game/faction-style.js';
import { CLASS_ORDER, FACTION_REBUILD_ORDER, measureKindFor } from '../src/game/ship-scale.js';
import { analyseAttachment, TOUCH_EPS } from './attachment.mjs';

const want = process.argv.slice(2);
const targets = (want.length > 0 ? want : FACTION_REBUILD_ORDER)
  .filter((f) => measureKindFor(f) === 'built');

let failures = 0;

for (const faction of targets) {
  let mod;
  try {
    mod = await import(`../src/systems/ships/${faction}.js`);
  } catch (err) {
    console.log(`${faction}: MODULE LOAD FAIL — ${err.message}`);
    failures++;
    continue;
  }
  const kit = mod[`${faction}Ship`];
  if (!kit) {
    console.log(`${faction}: no export named ${faction}Ship`);
    failures++;
    continue;
  }
  for (const ck of CLASS_ORDER) {
    const entry = kit[ck];
    if (!entry || typeof entry.build !== 'function') {
      console.log(`${faction} ${ck}: MISSING entry`);
      failures++;
      continue;
    }
    const b = detailBuilder({ track: true });
    try {
      entry.build(b, FACTION_STYLE[faction]);
    } catch (err) {
      console.log(`${faction} ${ck}: BUILD THREW — ${err.message}`);
      failures++;
      continue;
    }
    const r = analyseAttachment(b.parts(), TOUCH_EPS);
    const bad = r.lonely > 0 || r.attachedPct < 100;
    if (bad) failures++;
    console.log(`${faction.padEnd(13)} ${ck.padEnd(10)}`
      + ` parts=${String(r.total).padStart(5)}`
      + ` lonely=${String(r.lonely).padStart(4)}`
      + ` components=${String(r.components).padStart(4)}`
      + ` attached=${r.attachedPct.toFixed(1)}%`);
    for (const line of r.lonelyList) console.log(`      LONELY  ${line}`);
    for (const line of r.strayList) console.log(`      STRAY   ${line}`);
    for (const g of Object.values(b.build())) g.dispose();
  }
}

console.log(failures === 0
  ? 'attach-audit: ALL PARTS ATTACHED'
  : `attach-audit: ${failures} SCULPTS WITH FLOATING PARTS`);
process.exitCode = failures === 0 ? 0 : 1;
