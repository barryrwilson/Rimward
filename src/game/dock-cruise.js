/** Dock transit traffic geometry. Route AP and the near dock corridor keep
 * their own policies. Collected ship/asteroid spheres are normally skipped
 * by planApPath, so promote them only in this private planning bag. */
import { PHY } from './physics.js';
import { AP_KEEP_PAD, keepRadius, sphereChordHit } from './ap-path.js';

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
    let motionVx = vx, motionVy = vy, motionVz = vz;
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
      motionVx = sample.vx; motionVy = sample.vy; motionVz = sample.vz;
    }
    // This sphere encloses both the current body and its predicted path
    // until the player could stop; a crossing ship cannot appear only after
    // the old fixed 40 u lookahead has become too short to brake.
    const entry = predicted[predictedCount] || (predicted[predictedCount] = {});
    predictedCount++;
    entry.kind = 'cruise-obstacle'; entry.id = body.id;
    entry.motionVx = motionVx; entry.motionVy = motionVy; entry.motionVz = motionVz;
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

// A moving body can enter a stationary hold while the hull turns. Evaluate
// normal idle versus normal creep with the same acceleration/drag equations
// as ship.js. Steering is held only during an accepted creep step, so the
// proposed forward sweep is the motion the ship owner actually receives.
const HOLD_STEPS = 45;
const HOLD_DT = 1 / 30;
const HOLD_TIME = HOLD_STEPS * HOLD_DT;
const holdPath = new Float64Array((HOLD_STEPS + 1) * 3);
const advancePath = new Float64Array((HOLD_STEPS + 1) * 3);

function writeHoldPath(out, position, velocity, forward, speed, acceleration, damping) {
  let x = position.x, y = position.y, z = position.z;
  let vx = velocity.x, vy = velocity.y, vz = velocity.z;
  const drag = Math.exp(-damping * HOLD_DT);
  out[0] = x; out[1] = y; out[2] = z;
  for (let step = 1; step <= HOLD_STEPS; step++) {
    let dx = forward.x * speed - vx;
    let dy = forward.y * speed - vy;
    let dz = forward.z * speed - vz;
    const length = Math.hypot(dx, dy, dz), maxStep = acceleration * HOLD_DT;
    if (length > maxStep) { const k = maxStep / length; dx *= k; dy *= k; dz *= k; }
    vx = (vx + dx) * drag; vy = (vy + dy) * drag; vz = (vz + dz) * drag;
    x += vx * HOLD_DT; y += vy * HOLD_DT; z += vz * HOLD_DT;
    const index = step * 3;
    out[index] = x; out[index + 1] = y; out[index + 2] = z;
  }
}

function holdPathHits(path, x, y, z, vx, vy, vz, radius) {
  for (let step = 1; step <= HOLD_STEPS; step++) {
    const index = step * 3, before = index - 3;
    const t0 = (step - 1) * HOLD_DT, t1 = step * HOLD_DT;
    if (sphereChordHit(path[before] - vx * t0, path[before + 1] - vy * t0, path[before + 2] - vz * t0,
      path[index] - vx * t1, path[index + 1] - vy * t1, path[index + 2] - vz * t1,
      x, y, z, radius).hit) return true;
  }
  return false;
}

export function dockHoldCanAdvance(position, velocity, forward, acceleration, creep, damping, bodies) {
  if (!finite3(position) || !finite3(velocity) || !finite3(forward) || !bodies?.items
    || ![acceleration, creep, damping].every(Number.isFinite)
    || acceleration <= 0 || creep <= 0 || damping < 0) return false;
  const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
  // This is an escape from an idle/slow hold, never permission to keep
  // cruise-speed thrust while the ordinary braking check is active.
  if (speed > creep + 1) return false;
  writeHoldPath(holdPath, position, velocity, forward, 0, acceleration, damping);
  let threatened = false;
  for (let i = 0; i < bodies.count; i++) {
    const body = bodies.items[i];
    if (body.kind !== 'cruise-obstacle') continue;
    const vx = body.motionVx, vy = body.motionVy, vz = body.motionVz;
    const dx = body.baseX - position.x, dy = body.baseY - position.y, dz = body.baseZ - position.z;
    if (dx * vx + dy * vy + dz * vz >= 0) continue;
    // Require an actual contact threat with a small hull-sized margin;
    // entering the route planner's generous 12u pad alone is not a reason
    // to abandon a stationary hold and delay its ordinary turn.
    const radius = body.bodyRadius + PHY.PLAYER_RADIUS * 2;
    if (Math.hypot(dx, dy, dz) > radius + (Math.hypot(vx, vy, vz) + speed) * HOLD_TIME) continue;
    if (holdPathHits(holdPath, body.baseX, body.baseY, body.baseZ, vx, vy, vz, radius)) {
      threatened = true; break;
    }
  }
  if (!threatened) return false;
  writeHoldPath(advancePath, position, velocity, forward, creep, acceleration, damping);
  for (let i = 0; i < bodies.count; i++) {
    const body = bodies.items[i];
    if (body.kind === 'player') continue;
    const moving = body.kind === 'cruise-obstacle';
    const x = moving ? body.baseX : body.x, y = moving ? body.baseY : body.y, z = moving ? body.baseZ : body.z;
    const vx = moving ? body.motionVx : 0, vy = moving ? body.motionVy : 0, vz = moving ? body.motionVz : 0;
    const distance = Math.hypot(x - position.x, y - position.y, z - position.z);
    let radius;
    if (moving) {
      const physical = body.bodyRadius + PHY.PLAYER_RADIUS;
      // If another body already lies within the planning pad, still demand
      // positive swept hull clearance; do not trap a safe escape solely
      // because its starting pose is inside that conservative extra pad.
      radius = physical + Math.min(AP_KEEP_PAD, Math.max(0, distance - physical) * 0.5);
    } else {
      // Includes the station and sun's full keep-out envelopes. Gates have
      // no route-planner keep radius, but remain physical obstacles here.
      radius = keepRadius(body, PHY.PLAYER_RADIUS) || body.r + PHY.PLAYER_RADIUS + AP_KEEP_PAD;
    }
    if (!Number.isFinite(radius) || radius <= 0) return false;
    if (distance > radius + (Math.hypot(vx, vy, vz) + Math.max(speed, creep)) * HOLD_TIME) continue;
    if (holdPathHits(advancePath, x, y, z, vx, vy, vz, radius)) return false;
  }
  return true;
}
