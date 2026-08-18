// Extra gate-torus cases. Node only. Does not change production source.
import { PHY } from '../../../src/game/physics.js';
import {
  torusOverlap,
  collectBodies,
  resolveMover,
} from '../../../src/game/collision.js';

const near = (a, b, e = 1e-3) => Number.isFinite(a) && Math.abs(a - b) < e;
const fails = [];
function line(name, ok, detail) {
  if (!ok) fails.push({ name, detail });
  console.log(`${ok ? 'CLEAN' : 'FAIL'} ${name}${detail ? ` ${detail}` : ''}`);
}

const pr = PHY.PLAYER_RADIUS;
const bore = PHY.GATE_BORE;
const tube = PHY.GATE_TUBE;
const out = { hit: false, nx: 0, ny: 1, nz: 0, overlap: 0 };
const mv = {
  px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0,
  hit: false, kind: null, speed: 0, nx: 0, ny: 1, nz: 0, overlap: 0,
};

// Far from origin: axis is toward origin (gate on +X → axis −X).
const fx = 5000;
const fy = 0;
const fz = 0;
// On tube in Y (perp to axis): must hit.
torusOverlap(fx, fy + bore, fz, pr, fx, fy, fz, bore, tube, out);
line('far.origin.tubeHit', out.hit === true && out.overlap > 0, JSON.stringify(out));
// Along world +X from gate: if axis is the origin line this is the hole, miss.
torusOverlap(fx + 30, fy, fz, pr, fx, fy, fz, bore, tube, out);
line('far.origin.alongAxisMiss', out.hit === false, JSON.stringify(out));
// If the axis were world +Y, (fx+30,0,0) would sit on the tube. Confirm hit
// when we place the player on the true ring (radial = bore, axial = 0).
torusOverlap(fx, fy, fz + bore, pr, fx, fy, fz, bore, tube, out);
line('far.origin.ringInYZ', out.hit === true, JSON.stringify(out));

// Thread the hole from axial −20 to +20 at radial 0. No bounce.
const gx = 0;
const gy = 0;
const gz = 900;
const gateBody = { kind: 'gate', x: gx, y: gy, z: gz, r: bore, y0: tube, y1: 0, id: 0 };
const dest = { count: 1, items: [gateBody] };
let threadHit = false;
let threadFail = null;
for (let s = -20; s <= 20; s += 2) {
  resolveMover(gx, gy, gz + s, 0, 0, 4, pr, dest, 'player', -1, mv);
  if (mv.hit) {
    threadHit = true;
    threadFail = { s, hit: mv.hit, kind: mv.kind, overlap: mv.overlap };
    break;
  }
  if (!near(mv.px, gx) || !near(mv.py, gy) || !near(mv.pz, gz + s) || !near(mv.vz, 4)) {
    threadHit = true;
    threadFail = { s, px: mv.px, py: mv.py, pz: mv.pz, vx: mv.vx, vy: mv.vy, vz: mv.vz };
    break;
  }
}
line('thread.axis.noBounce', threadHit === false, threadFail ? JSON.stringify(threadFail) : '');

// Sit on the tube. resolveMover must push the sphere off the solid.
resolveMover(gx + bore, gy, gz, 0, 0, 0, pr, dest, 'player', -1, mv);
const slideR = Math.hypot(mv.px - gx, mv.py - gy, mv.pz - gz);
line(
  'sit.tube.slideOut',
  mv.hit === true && mv.kind === 'gate' && slideR > bore && near(slideR, bore + tube + pr, 0.05),
  JSON.stringify({ hit: mv.hit, r: slideR, px: mv.px, py: mv.py, pz: mv.pz }),
);

// collectBodies: missing world / unknown system must not throw.
let threwMissing = false;
let threwUnknown = false;
const emptyA = { count: 7, items: [] };
const emptyB = { count: 7, items: [] };
try {
  collectBodies({ world: null }, emptyA);
} catch (err) {
  threwMissing = true;
}
try {
  collectBodies({ world: { currentSystem: 'no-such-system' } }, emptyB);
} catch (err) {
  threwUnknown = true;
}
line('collect.missingWorld', !threwMissing && emptyA.count === 0, `threw=${threwMissing} count=${emptyA.count}`);
line('collect.unknownSystem', !threwUnknown && emptyB.count === 0, `threw=${threwUnknown} count=${emptyB.count}`);

// Hub-only vs gate-only via ctx.systems override.
const gateOnly = {
  world: { currentSystem: 'solo' },
  systems: {
    solo: { gates: [{ position: [10, 20, 30], to: 'x' }] },
  },
};
const hubOnly = {
  world: { currentSystem: 'hubsys' },
  systems: {
    hubsys: {
      hub: { position: [40, 50, 60], routes: ['a'] },
    },
  },
};
const both = {
  world: { currentSystem: 'both' },
  systems: {
    both: {
      gates: [{ position: [1, 2, 3], to: 'x' }, { position: [4, 5, 6], to: 'y' }],
      hub: { position: [7, 8, 9], routes: ['a', 'b'] },
    },
  },
};
const hubNoRoutes = {
  world: { currentSystem: 'deadhub' },
  systems: {
    deadhub: { hub: { position: [1, 1, 1], routes: [] } },
  },
};

const d1 = { count: 0, items: [] };
collectBodies(gateOnly, d1);
const g1 = d1.items.filter((b, i) => i < d1.count && b.kind === 'gate');
line(
  'collect.gateOnly',
  g1.length === 1 && g1[0].x === 10 && g1[0].id === 0 && g1[0].r === bore && g1[0].y0 === tube && g1[0].y1 === 0,
  JSON.stringify(g1[0]),
);

const d2 = { count: 0, items: [] };
collectBodies(hubOnly, d2);
const g2 = d2.items.filter((b, i) => i < d2.count && b.kind === 'gate');
line(
  'collect.hubOnly',
  g2.length === 1 && g2[0].x === 40 && g2[0].id === 0 && g2[0].kind === 'gate',
  JSON.stringify(g2[0]),
);

const d3 = { count: 0, items: [] };
collectBodies(both, d3);
const g3 = [];
for (let i = 0; i < d3.count; i++) {
  if (d3.items[i] && d3.items[i].kind === 'gate') g3.push(d3.items[i]);
}
const ids = g3.map((b) => b.id);
const unique = new Set(ids).size === ids.length;
line(
  'collect.ids.unique',
  g3.length === 3 && unique && ids[0] === 0 && ids[1] === 1 && ids[2] === 2,
  JSON.stringify(ids),
);
line(
  'collect.both.positions',
  g3[0].x === 1 && g3[1].x === 4 && g3[2].x === 7,
  JSON.stringify(g3.map((b) => [b.x, b.y, b.z, b.id])),
);

const d4 = { count: 0, items: [] };
collectBodies(hubNoRoutes, d4);
let hubDead = 0;
for (let i = 0; i < d4.count; i++) if (d4.items[i] && d4.items[i].kind === 'gate') hubDead += 1;
line('collect.hubNoRoutes', hubDead === 0 && d4.count === 0, `gates=${hubDead} count=${d4.count}`);

// NaN in resolveMover must clear, not throw.
const nanMv = {
  px: 9, py: 9, pz: 9, vx: 9, vy: 9, vz: 9,
  hit: true, kind: 'gate', speed: 4, nx: 3, ny: 3, nz: 3, overlap: 9,
};
let nanThrew = false;
try {
  resolveMover(Number.NaN, 0, 0, 0, 0, 0, pr, dest, 'player', -1, nanMv);
} catch (err) {
  nanThrew = true;
}
line(
  'resolve.nanSafe',
  !nanThrew && nanMv.hit === false && nanMv.px === 0,
  `threw=${nanThrew} ${JSON.stringify(nanMv)}`,
);

if (fails.length) {
  console.log(`FAIL ${fails.length}`);
  process.exit(1);
}
console.log('CLEAN extra');
process.exit(0);
