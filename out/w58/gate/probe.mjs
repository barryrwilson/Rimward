// Wave 58 gate ring collision probe. Node only. No browser.
import { PHY } from '../../../src/game/physics.js';
import {
  torusOverlap,
  collectBodies,
  resolveMover,
} from '../../../src/game/collision.js';
import { BORE_RADIUS, RING_TUBE } from '../../../src/game/gate-scale.js';
import { AUTHORED_SYSTEMS } from '../../../src/game/authored-systems.js';

const near = (a, b, e = 1e-3) => Number.isFinite(a) && Math.abs(a - b) < e;
const fails = [];

function line(name, ok, detail) {
  if (!ok) fails.push({ name, detail });
  console.log(`${ok ? 'CLEAN' : 'FAIL'} ${name}${detail ? ` ${detail}` : ''}`);
}

const out = { hit: false, nx: 0, ny: 1, nz: 0, overlap: 0 };
const pr = PHY.PLAYER_RADIUS;
const bore = PHY.GATE_BORE;
const tube = PHY.GATE_TUBE;

line('phy.GATE_BORE', PHY.GATE_BORE === BORE_RADIUS && BORE_RADIUS === 30, `${PHY.GATE_BORE}`);
line('phy.GATE_TUBE', PHY.GATE_TUBE === RING_TUBE && RING_TUBE === 2.2, `${PHY.GATE_TUBE}`);
line('phy.PLAYER_RADIUS', pr === 2.4, `${pr}`);
line('phy.frozen', Object.isFrozen(PHY), `frozen=${Object.isFrozen(PHY)}`);

// Gate at +Z so axis A = (0,0,-1). Perp in plane = +X.
const gx = 0;
const gy = 0;
const gz = 900;

torusOverlap(gx, gy, gz, pr, gx, gy, gz, bore, tube, out);
line(
  'bore.empty.player',
  out.hit === false,
  JSON.stringify(out),
);

torusOverlap(gx + bore, gy, gz, pr, gx, gy, gz, bore, tube, out);
line(
  'tube.centerline.player',
  out.hit === true && out.overlap > 0 && near(out.overlap, tube + pr),
  JSON.stringify(out),
);

torusOverlap(gx, gy, gz, 40, gx, gy, gz, bore, tube, out);
line(
  'bore.blocked.freighter',
  out.hit === true && near(out.overlap, 40 + tube - bore),
  JSON.stringify(out),
);

const nanOut = { hit: true, nx: 3, ny: 4, nz: 5, overlap: 9 };
let nanThrew = false;
try {
  torusOverlap(Number.NaN, 0, 0, pr, gx, gy, gz, bore, tube, nanOut);
} catch (err) {
  nanThrew = true;
}
line(
  'torus.nanSafe',
  !nanThrew && nanOut.hit === false && nanOut.overlap === 0,
  `threw=${nanThrew} ${JSON.stringify(nanOut)}`,
);

const dest = { count: 0, items: [] };
collectBodies({ world: { currentSystem: 'freehold' } }, dest);
const freehold = AUTHORED_SYSTEMS.freehold;
const authoredGates = freehold.gates.length;
const authoredHub = freehold.hub && freehold.hub.routes && freehold.hub.routes.length ? 1 : 0;
const expected = authoredGates + authoredHub;
const gateItems = [];
for (let i = 0; i < dest.count; i++) {
  if (dest.items[i] && dest.items[i].kind === 'gate') gateItems.push(dest.items[i]);
}
line(
  'collect.freehold.count',
  gateItems.length === expected && expected === 2,
  `got=${gateItems.length} expected=${expected}`,
);
line(
  'collect.freehold.slot0',
  gateItems[0]
    && gateItems[0].x === freehold.gates[0].position[0]
    && gateItems[0].y === freehold.gates[0].position[1]
    && gateItems[0].z === freehold.gates[0].position[2]
    && gateItems[0].r === BORE_RADIUS
    && gateItems[0].y0 === RING_TUBE
    && gateItems[0].y1 === 0
    && gateItems[0].id === 0,
  JSON.stringify(gateItems[0]),
);
line(
  'collect.freehold.hub',
  gateItems[1]
    && gateItems[1].x === freehold.hub.position[0]
    && gateItems[1].y === freehold.hub.position[1]
    && gateItems[1].z === freehold.hub.position[2]
    && gateItems[1].kind === 'gate'
    && gateItems[1].id === 1,
  JSON.stringify(gateItems[1]),
);

const hushDest = { count: 0, items: [] };
collectBodies({ world: { currentSystem: 'hush' } }, hushDest);
let hushGates = 0;
for (let i = 0; i < hushDest.count; i++) {
  if (hushDest.items[i] && hushDest.items[i].kind === 'gate') hushGates += 1;
}
line(
  'collect.hush.noHub',
  hushGates === AUTHORED_SYSTEMS.hush.gates.length,
  `got=${hushGates}`,
);

const emptyDest = { count: 99, items: [] };
collectBodies({}, emptyDest);
line('collect.empty', emptyDest.count === 0, `count=${emptyDest.count}`);

const reuseDest = dest;
const beforeLen = reuseDest.items.length;
collectBodies({ world: { currentSystem: 'freehold' } }, reuseDest);
line(
  'collect.reuseSlots',
  reuseDest.items.length === beforeLen,
  `len=${reuseDest.items.length} before=${beforeLen}`,
);

const gateBody = {
  kind: 'gate',
  x: gx, y: gy, z: gz,
  r: bore,
  y0: tube,
  y1: 0,
  id: 0,
};
const mvDest = { count: 1, items: [gateBody] };
const mv = {
  px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0,
  hit: false, kind: null, speed: 0, nx: 0, ny: 1, nz: 0, overlap: 0,
};

resolveMover(gx + bore, gy, gz, 0, 0, 0, pr, mvDest, 'player', -1, mv);
const slideAway = Math.hypot(mv.px - gx, mv.py - gy, mv.pz - gz);
line(
  'resolve.tube.slide',
  mv.hit === true
    && mv.kind === 'gate'
    && slideAway > bore
    && near(slideAway, bore + tube + pr, 0.05),
  JSON.stringify({ px: mv.px, py: mv.py, pz: mv.pz, kind: mv.kind, hit: mv.hit, r: slideAway }),
);

resolveMover(gx, gy, gz, 0, 0, -40, pr, mvDest, 'player', -1, mv);
line(
  'resolve.bore.pass',
  mv.hit === false
    && near(mv.px, gx)
    && near(mv.py, gy)
    && near(mv.pz, gz)
    && near(mv.vx, 0)
    && near(mv.vy, 0)
    && near(mv.vz, -40),
  JSON.stringify({ px: mv.px, py: mv.py, pz: mv.pz, vx: mv.vx, vy: mv.vy, vz: mv.vz, hit: mv.hit }),
);

const stDest = {
  count: 1,
  items: [{
    kind: 'station',
    x: 0, y: 0, z: 0,
    r: PHY.STATION_CYL_RADIUS,
    y0: PHY.STATION_CYL_Y0,
    y1: PHY.STATION_CYL_Y1,
    id: 0,
  }],
};
resolveMover(33, 0, 0, -10, 0, 0, 2, stDest, 'player', -1, mv);
line(
  'resolve.station.stillCylinder',
  mv.hit === true && mv.kind === 'station' && mv.vx > 0,
  JSON.stringify({ hit: mv.hit, kind: mv.kind, vx: mv.vx, px: mv.px }),
);

if (fails.length) {
  console.log(`FAIL ${fails.length}`);
  process.exit(1);
}
console.log('CLEAN all');
process.exit(0);
