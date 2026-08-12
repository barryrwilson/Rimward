/**
 * Attachment audit — names every floating part in a built ship sculpt.
 *
 * The companion to scripts/measure-ships.mjs. `singleMass` cannot see a detached
 * greeble, and neither can a bounding-box test on its own — see
 * scripts/attachment.mjs for both blind spots. This runs the box test to NAME
 * offenders and the fixed fine-grid contact test to DECIDE connectivity, so a
 * failure carries both the geometry of the island and the source line that built
 * it.
 *
 * Usage: node scripts/attach-audit.mjs [faction ...]
 */

import { detailBuilder } from '../src/systems/station-detail.js';
import { FACTION_STYLE } from '../src/game/faction-style.js';
import { CLASS_ORDER, FACTION_REBUILD_ORDER, measureKindFor } from '../src/game/ship-scale.js';
import {
  analyseAttachment, analyseContact, blameIsland, TOUCH_EPS, CONTACT_CELL,
} from './attachment.mjs';

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
    const parts = b.parts();
    const r = analyseAttachment(parts, TOUCH_EPS);
    const geos = b.build();
    // The decisive test. Box overlap can be satisfied by two parts that merely
    // graze each other, so a sculpt counts as connected only when the fixed fine
    // grid agrees — that is the check that catches a vane rooted a hair short of
    // the plating, which is exactly what shipped on the Veridian light craft.
    const c = analyseContact(Object.values(geos), CONTACT_CELL);
    if (r.lonely > 0 || r.attachedPct < 100 || c.attachedPct < 100) failures++;

    console.log(`${faction.padEnd(13)} ${ck.padEnd(10)}`
      + ` parts=${String(r.total).padStart(5)}`
      + ` lonely=${String(r.lonely).padStart(4)}`
      + ` boxComps=${String(r.components).padStart(3)}`
      + ` contactComps=${String(c.components).padStart(3)}`
      + ` contact=${c.attachedPct.toFixed(1)}%`);
    for (const line of r.lonelyList) console.log(`      LONELY   ${line}`);
    for (const line of r.strayList) console.log(`      BOXSTRAY ${line}`);
    for (const isl of c.islands) {
      console.log(`      FLOATING ${isl.label}`);
      for (const line of blameIsland(parts, isl)) console.log(`               ${line}`);
    }
    for (const g of Object.values(geos)) g.dispose();
  }
}

console.log(failures === 0
  ? 'attach-audit: ALL PARTS ATTACHED'
  : `attach-audit: ${failures} SCULPTS WITH FLOATING PARTS`);
process.exitCode = failures === 0 ? 0 : 1;
