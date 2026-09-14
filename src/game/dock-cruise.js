/** Dock transit traffic geometry. Route AP and the near dock corridor keep
 * their own policies. Collected ship/asteroid spheres are normally skipped
 * by planApPath, so promote them only in this private planning bag. */
import { PHY } from './physics.js';
import { AP_KEEP_PAD, sphereChordHit } from './ap-path.js';

const finite3 = p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
const velocities = new Map();
const asteroidMotion = new WeakMap();

export function collectDockCruiseBodies(bodies, ships, speed, acceleration, out, asteroids, time, predictAsteroids = false) {
  if (!bodies?.items || !out?.items || !Number.isFinite(speed) || speed < 0
    || !Number.isFinite(acceleration) || acceleration <= 0) return null;
  velocities.clear();
  for (const ship of ships || []) {
    const v = ship?.ai?.velocity;
    if (finite3(v)) velocities.set(ship.id, v);
  }
  const horizon = speed / acceleration + 0.25;
  const predicted = out.predicted || (out.predicted = []);
  let predictedCount = 0;
  let n = 0;
  for (let i = 0; i < bodies.count; i++) {
    const body = bodies.items[i];
    if (body.kind !== 'ship' && body.kind !== 'asteroid') {
      out.items[n++] = body;
      continue;
    }
    const velocity = body.kind === 'ship' ? velocities.get(body.id) : null;
    let vx = velocity?.x || 0, vy = velocity?.y || 0, vz = velocity?.z || 0;
    const rock = body.kind === 'asteroid' && asteroids?.[body.id];
    if (rock && typeof rock === 'object' && Number.isFinite(time)) {
      // Public asteroid rows expose live positions, not private orbit data.
      // Warm motion samples during cruise so stage starts with velocity.
      // Weak keys discard old fields on system rebuild without ID aliasing.
      let sample = asteroidMotion.get(rock);
      if (!sample) {
        sample = { x: body.x, y: body.y, z: body.z, t: time, vx: 0, vy: 0, vz: 0 };
        asteroidMotion.set(rock, sample);
      } else if (time !== sample.t) {
        const elapsed = time - sample.t;
        const valid = elapsed > 0 && elapsed <= 0.25;
        sample.vx = valid ? (body.x - sample.x) / elapsed : 0;
        sample.vy = valid ? (body.y - sample.y) / elapsed : 0;
        sample.vz = valid ? (body.z - sample.z) / elapsed : 0;
        sample.x = body.x; sample.y = body.y; sample.z = body.z; sample.t = time;
      }
      if (predictAsteroids) { vx = sample.vx; vy = sample.vy; vz = sample.vz; }
    }
    // This sphere encloses both the current body and its predicted path
    // until the player could stop; a crossing ship cannot appear only after
    // the old fixed 40 u lookahead has become too short to brake.
    const entry = predicted[predictedCount] || (predicted[predictedCount] = {});
    predictedCount++;
    entry.kind = 'cruise-obstacle'; entry.id = body.id;
    entry.x = body.x + vx * horizon * 0.5;
    entry.y = body.y + vy * horizon * 0.5;
    entry.z = body.z + vz * horizon * 0.5;
    entry.r = body.r + Math.hypot(vx, vy, vz) * horizon * 0.5;
    entry.baseX = body.x; entry.baseY = body.y; entry.baseZ = body.z;
    entry.bodyRadius = body.r;
    entry.vx = vx; entry.vy = vy; entry.vz = vz;
    out.items[n++] = entry;
  }
  out.count = n;
  return out;
}

export function dockCruiseShouldBrake(position, velocity, acceleration, bodies) {
  if (!finite3(position) || !finite3(velocity) || !(acceleration > 0)) return true;
  const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
  if (speed < 1) return false;
  const stopTime = speed / acceleration;
  for (let i = 0; i < bodies.count; i++) {
    const body = bodies.items[i];
    if (body.kind !== 'cruise-obstacle') continue;
    const dx = body.baseX - position.x, dy = body.baseY - position.y, dz = body.baseZ - position.z;
    // An obstacle behind a separating hull should not arrest its escape.
    if (dx * (velocity.x - body.vx) + dy * (velocity.y - body.vy)
      + dz * (velocity.z - body.vz) <= 0) continue;
    // Check the decelerating player's sweep in the obstacle's moving frame.
    // Substeps retain crossing motion without treating a whole ship-sized
    // future capsule as occupied at every instant (which causes false stops).
    let x = position.x, y = position.y, z = position.z;
    for (let step = 1; step <= 4; step++) {
      const t = stopTime * step / 4;
      const travel = t - t * t / (2 * stopTime);
      const nx = position.x + velocity.x * travel - body.vx * t;
      const ny = position.y + velocity.y * travel - body.vy * t;
      const nz = position.z + velocity.z * travel - body.vz * t;
      const hit = sphereChordHit(x, y, z, nx, ny, nz,
        body.baseX, body.baseY, body.baseZ, body.bodyRadius + PHY.PLAYER_RADIUS + AP_KEEP_PAD);
      if (hit.hit) return true;
      x = nx; y = ny; z = nz;
    }
  }
  return false;
}
