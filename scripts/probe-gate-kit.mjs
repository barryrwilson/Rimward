// G0 smoke probe for the gate kit. Not a faction sculpt.
// node --import ./scripts/with-css-stub.mjs scripts/probe-gate-kit.mjs

import * as THREE from 'three';
import { JUMP } from '../src/game/state.js';
import { HUMAN } from '../src/game/ship-scale.js';
import {
  BORE_RADIUS,
  BORE_CLEAR_MIN,
  OUTLINE_BREAKER_MIN,
  ZONE,
  ARRIVAL_OFFSET,
  TUNNEL_COUNT,
  TUNNEL_DEPTH,
  MERGE_GEO_MAX,
  MERGE_MAT_MAX,
  GATE_REBUILD_ORDER,
  lampCountForRun,
} from '../src/game/gate-scale.js';
import {
  detailBuilder,
  fillTunnelArrays,
  seedFromParts,
  lampRun,
  attachHubLantern,
  probeKitSculpt,
} from '../src/systems/gate-detail.js';

const checks = {};
const fail = (name, ok, detail) => {
  checks[name] = !!ok;
  if (!ok) console.log('FAIL', name, detail ?? '');
};

fail('zoneMatchesJump', ZONE === JUMP.zone, `${ZONE} vs ${JUMP.zone}`);
fail('arrivalMatchesJump', ARRIVAL_OFFSET === JUMP.arrivalOffset);
fail('boreLane', BORE_RADIUS === 30 && BORE_CLEAR_MIN === 24);
fail('breakerNine', OUTLINE_BREAKER_MIN === 9);
fail('mergeBudget', MERGE_GEO_MAX === 6 && MERGE_MAT_MAX === 6);
fail('censusOrder12', GATE_REBUILD_ORDER.length === 12 && GATE_REBUILD_ORDER[0] === 'freehold');
fail('lampGapNotSize', HUMAN.lampGap > HUMAN.lampSize * 5);
fail('lampCount8u', lampCountForRun(8) === Math.max(2, Math.floor(8 / HUMAN.lampGap) + 1));

const a = new Float32Array(TUNNEL_COUNT * 2);
const z = new Float32Array(TUNNEL_COUNT);
const a2 = new Float32Array(TUNNEL_COUNT * 2);
const z2 = new Float32Array(TUNNEL_COUNT);
const seed = seedFromParts('tunnel', 'freehold', '0,0,0', 'veridian');
fillTunnelArrays(a, z, seed);
fillTunnelArrays(a2, z2, seed);
let same = true;
for (let i = 0; i < a.length; i++) if (a[i] !== a2[i]) same = false;
for (let i = 0; i < z.length; i++) if (z[i] !== z2[i]) same = false;
fail('tunnelDeterministic', same);

const a3 = new Float32Array(TUNNEL_COUNT * 2);
const z3 = new Float32Array(TUNNEL_COUNT);
fillTunnelArrays(a3, z3, seedFromParts('tunnel', 'ferrous', '0,0,0', 'x'));
let differ = false;
for (let i = 0; i < a.length; i++) if (a[i] !== a3[i]) differ = true;
fail('tunnelSeedDiffers', differ);
fail('tunnelDepth', TUNNEL_DEPTH === 24 && z.every((v) => v >= 0 && v <= TUNNEL_DEPTH));

let threw = false;
try {
  const b = detailBuilder();
  b.push(0, 0, 0);
  b.build();
} catch (e) {
  threw = /unclosed push/.test(String(e.message));
}
fail('unclosedPushThrows', threw);

const g1 = probeKitSculpt(1);
const g2 = probeKitSculpt(1);
fail('probeHasHull', !!g1.hull);
fail('probeHasGlow', !!g1.glow);
const v1 = g1.hull.attributes.position.count;
const v2 = g2.hull.attributes.position.count;
fail('probeDeterministic', v1 === v2 && v1 > 100);
const channels = Object.keys(g1);
fail('channelCap', channels.length <= MERGE_GEO_MAX);

const group = new THREE.Group();
const assembly = { group };
attachHubLantern(assembly, ['a', 'b', 'c'], { beaconMap: null });
fail('hubRouteCount', group.userData.routeCount === 3);
fail('hubLamps', assembly.lamps.length === 3 && assembly.lamps.every((l) => l.name === 'junction-arm-lamp'));
fail('hubHex', !!assembly.hexFrame);

// lampRun count matches lampCountForRun
const bLamps = detailBuilder();
lampRun(bLamps, 'glow', 0xffffff, { ax: 0, ay: 0, az: 0, bx: 12, by: 0, bz: 0 });
fail('lampRunUsesGap', bLamps.count('glow') === lampCountForRun(12));
bLamps.build();

console.log('g0 gate kit:', JSON.stringify(checks));
const errors = Object.values(checks).filter((v) => !v).length;
if (errors) {
  console.log(`G0 GATE KIT FAIL — ${errors}`);
  process.exit(1);
}
console.log('G0 GATE KIT PASS');
