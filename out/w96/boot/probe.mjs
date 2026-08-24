// Wave 96: veil is authored; galaxy is 101; generated landmarks stay safe.
import { SYSTEMS } from '../../../src/game/state.js';

const AUTHORED_IDS23 = [
  'freehold', 'veridian', 'redmarch', 'hollowreach', 'hush', 'verge', 'veil',
];
const dist23 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const generatedIds = Object.keys(SYSTEMS).filter((id) => !AUTHORED_IDS23.includes(id));

const lmSeparationOk23 = (id) => {
  const def = SYSTEMS[id];
  const p = def.landmarks?.[0]?.position;
  if (!p) return false;
  return dist23(p, def.station.position) >= 400
    && (def.gates ?? []).every((g) => dist23(p, g.position) >= 300)
    && dist23(p, def.field.center) >= def.field.radius + 200
    && (!def.hub || dist23(p, def.hub.position) >= 300)
    && Math.hypot(p[0], p[1], p[2]) <= 1000;
};

const hushIds = (SYSTEMS.hush?.landmarks ?? []).map((l) => l.id);
const checks = {
  systemCount101: Object.keys(SYSTEMS).length === 101,
  veilAuthored: AUTHORED_IDS23.includes('veil') && !generatedIds.includes('veil'),
  generatedCount94: generatedIds.length === 94,
  generatedLm0: generatedIds.every((id) => !!SYSTEMS[id]?.landmarks?.[0]),
  generatedSeparation: generatedIds.every(lmSeparationOk23),
  hushHasThVeil: hushIds.includes('th_veil'),
  veilLandmarksEmpty: (SYSTEMS.veil?.landmarks ?? []).length === 0,
};

let failed = 0;
for (const [name, ok] of Object.entries(checks)) {
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
}
if (failed === 0) {
  console.log('PASS');
  process.exit(0);
}
console.log(`FAIL ${failed}`);
process.exit(1);
