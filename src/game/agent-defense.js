/** Session-only defensive memory, inside the existing combat lease. */
import { REACTIVE_DEFENSE as T, HEAT, POWER, WEAPONS, U } from './state.js';
import { npcFireToast, INCOMING_DART_TOAST } from './npc-fire-toast.js';
import { collectBodies } from './collision.js';
import { PHY } from './physics.js';

const wall = () => performance.now();
const bodies = { count: 0, items: [] };
export function createDefense(ctx, stance) {
  return { stance, phase: 'idle', trigger: null, attackerId: null, direction: null,
    triggeredAt: null, reactedAt: null, cueWallMs: null, appliedWallMs: null,
    reason: '', baseReason: '', maneuver: 'idle', modeBlocked: '', grantedAt: ctx.world.time, completedAt: null, latestCue: null, side: 1, since: 0, lastCue: 0, resumeAt: 0,
    withdrawal: false, hot: false, nearby: false, toast: {}, burnAt: null,
    driftRequested: false, burnerRequested: false,
    seen: new WeakSet([...(ctx.lastEvents || []), ...(ctx.events || [])].filter(e => e && typeof e === 'object')) };
}
export function defenseView(d) {
  const { stance, phase, trigger, attackerId, direction, triggeredAt, reactedAt,
    cueWallMs, appliedWallMs, reason, completedAt, maneuver, modeBlocked } = d;
  return { stance, phase, trigger, attackerId, direction, triggeredAt, reactedAt,
    cueWallMs, appliedWallMs, reason, completedAt, maneuver, modeBlocked, latestCue: d.latestCue ? { ...d.latestCue } : null };
}
const fraction = (n, max) => Number.isFinite(n) && Number.isFinite(max) && max > 0 ? n / max : 0;
function critical(p) {
  if (fraction(p.hull, p.hullMax) <= T.hull) return 'hull';
  if (p.engineOut || fraction(p.engine, p.engineMax) <= T.engine) return 'engine';
  if (fraction(p.screen + p.shell, p.screenMax + p.shellMax) <= T.defenses) return 'defenses';
  return '';
}
export function defenseSense(ctx, c) {
  const d = c.defense, now = ctx.world.time;
  if (d.stance === 'off') return;
  let cue = null;
  const take = (priority, trigger, direction = 'unknown', id = null, e = null) => {
    if (!cue || priority > cue.priority) cue = { priority, trigger, direction, id,
      t: Number.isFinite(e?.t) ? e.t : now,
      wall: Number.isFinite(e?.wallMs) ? e.wallMs : wall() };
  };
  for (const e of ctx.lastEvents || []) {
    if (!e || typeof e !== 'object' || d.seen.has(e)) continue;
    d.seen.add(e);
    if (!Number.isFinite(e.t) || e.t > now || e.t < d.grantedAt || now - e.t > T.cueAge) continue;
    if (e.type === 'playerHit' && Number.isFinite(e.damage) && e.damage > 0
        && Object.values(WEAPONS).some(w => w.family === e.family) && e.family !== 'impact') {
      take(3, 'hit', typeof e.fromAft === 'boolean' ? (e.fromAft ? 'aft' : 'fore') : 'unknown', null, e);
    } else if (e.type === 'npcFire') {
      const warning = npcFireToast(e, { elapsed: now, flags: ctx.flags, gate: ctx.gate }, d.toast);
      if (warning) take(2, warning.text === INCOMING_DART_TOAST ? 'incoming-dart' : 'incoming-fire', 'unknown', null, e);
    } else if (e.type === 'hostileEnter') {
      take(1, 'nearby-threat', 'unknown', typeof e.id === 'string' ? e.id : null, e);
    }
  }
  if (ctx.flags.combat && !d.nearby) take(1, 'nearby-threat');
  d.nearby = !!ctx.flags.combat;
  if (ctx.player.overheated || ctx.player.heat >= HEAT.max * T.heatHigh) d.hot = true;
  else if (ctx.player.heat < HEAT.max * T.heatLow) d.hot = false;
  if (cue) {
    d.latestCue = { trigger: cue.trigger, direction: cue.direction, attackerId: cue.id,
      t: cue.t, cueWallMs: cue.wall, appliedWallMs: null };
    const remember = () => { d.trigger = cue.trigger; d.direction = cue.direction; d.attackerId = cue.id; };
    d.lastCue = now;
    const reason = critical(ctx.player);
    if (!d.withdrawal && (d.stance === 'break-off' || reason)) {
      remember(); d.withdrawal = true; d.phase = 'break-off'; d.reason = d.baseReason = reason || 'stance';
      d.triggeredAt = cue.t; d.cueWallMs = cue.wall; d.reactedAt = d.appliedWallMs = null;
    } else if (!d.withdrawal && d.phase !== 'evading' && (now >= d.resumeAt || cue.trigger === 'hit')) {
      remember(); d.phase = 'evading'; d.since = now; d.reason = d.baseReason = d.hot ? 'heat' : 'threat';
      d.side = c.side; d.triggeredAt = cue.t; d.cueWallMs = cue.wall;
      d.reactedAt = d.appliedWallMs = d.completedAt = null;
      d.burnAt = null; d.driftRequested = d.burnerRequested = false;
    }
  }
  if (d.phase === 'evading' && (now - d.since >= T.maxEpisode
      || (now - d.since >= T.minEpisode && now - d.lastCue >= T.quiet))) {
    d.phase = 'reengaging'; d.completedAt = now; d.resumeAt = now + T.reengage;
  }
}

// A conservative swept-volume bound: an empty sphere encloses the complete
// straight hold, curved realignment and normal stopping path. Never extrapolate
// a maneuver beyond the public sensing envelope. Includes the selected hull.
function clearManeuver(ctx, c, speed, duration) {
  const cfg = ctx.config.ship, acceleration = cfg?.acceleration;
  if (!(acceleration > 0) || !Number.isFinite(speed)) return false;
  const radius = speed * duration + speed * speed / (2 * acceleration) + PHY.PLAYER_RADIUS + 20;
  if (radius > U.TARGET_RANGE) return false;
  const own = ctx.ship.object.position;
  const proxy = c.target.object.userData?.proxy;
  const hull = proxy ? Math.hypot(proxy.rx, proxy.ry, proxy.halfLen)
    * Math.max(c.target.object.scale.x, c.target.object.scale.y, c.target.object.scale.z) : c.target.state.radius || 4;
  if (own.distanceTo(c.target.object.position) < radius + hull) return false;
  collectBodies({ station: ctx.station, config: ctx.config, systems: ctx.systems,
    world: ctx.world, asteroids: ctx.asteroids }, bodies);
  for (let i = 0; i < bodies.count; i++) {
    const b = bodies.items[i];
    if (b.kind === 'ship' || b.kind === 'player') continue;
    const r = b.kind === 'station' ? Math.hypot(b.r, Math.max(Math.abs(b.y0), Math.abs(b.y1)))
      : b.kind === 'gate' ? b.r + b.y0 : b.r;
    if (Math.hypot(b.x-own.x, b.y-own.y, b.z-own.z) < radius + r) return false;
  }
  const sun = ctx.config.world?.sunPosition;
  const sunRadius = ctx.systems?.[ctx.world.currentSystem]?.sunRadius || ctx.config.world?.sunRadius;
  return !sun || !(sunRadius > 0) || Math.hypot(sun.x-own.x, sun.y-own.y, sun.z-own.z) > radius + sunRadius * PHY.SUN_HEAT_MULT;
}
export function defenseObstruction(ctx, c) {
  if (c.defense.stance === 'off' || (c.defense.phase !== 'evading' && !c.defense.withdrawal)) return false;
  // All-direction near-body bound protects lateral thrust and the first turn.
  // The longer optional-mode sweep below additionally covers stopping distance.
  collectBodies({ station: ctx.station, config: ctx.config, systems: ctx.systems,
    world: ctx.world, asteroids: ctx.asteroids }, bodies);
  const own = ctx.ship.object.position, speed = ctx.ship.speed;
  const radius = PHY.PLAYER_RADIUS + 20 + speed * 0.5 + speed*speed/(2*(ctx.config.ship?.acceleration || 48));
  for (let i = 0; i < bodies.count; i++) {
    const b = bodies.items[i];
    if (b.kind === 'ship' || b.kind === 'player') continue;
    const r = b.kind === 'station' ? Math.hypot(b.r, Math.max(Math.abs(b.y0), Math.abs(b.y1)))
      : b.kind === 'gate' ? b.r + b.y0 : b.r;
    if (Math.hypot(b.x-own.x,b.y-own.y,b.z-own.z) < radius+r) return true;
  }
  const sun = ctx.config.world?.sunPosition;
  const r = ctx.systems?.[ctx.world.currentSystem]?.sunRadius || ctx.config.world?.sunRadius;
  return !!(sun && r > 0 && Math.hypot(sun.x-own.x,sun.y-own.y,sun.z-own.z) < radius+r*PHY.SUN_HEAT_MULT);
}
export function defenseMove(ctx, lease, a, blocked) {
  const c = lease.combat, d = c.defense, now = ctx.world.time;
  if (d.stance === 'off') return;
  d.reason = d.baseReason; d.maneuver = d.withdrawal ? 'withdrawal' : d.phase; d.modeBlocked = '';
  if (ctx.player.engineOut) { d.modeBlocked = 'engine'; c.movementBlocked = 'engine'; }
  if (blocked) { if (d.phase === 'evading' || d.withdrawal) d.reason = 'obstructed';
    d.modeBlocked = 'obstructed'; d.maneuver = 'clearance'; return; }
  const cfg = ctx.config.ship, v = ctx.ship.velocity, speed = ctx.ship.speed;
  const remaining = Math.min(lease.expiresAt-now, lease.wallExpiresAt-wall()/1000);
  const delta = ctx.ship.object.position.clone().sub(c.target.object.position);
  const separating = v?.dot(delta) > 0;
  if (d.phase === 'evading' && !d.withdrawal && ['engage', 'disable'].includes(c.intent)) {
    lease.steerX = d.side * 0.85; lease.steerY = a.bearing[1] > 0.2 ? -0.3 : 0.3;
    lease.strafeX = d.side; lease.strafeY = 0.35; lease.throttle = 0.8;
    c.fireBlocked = 'defense';
    const duration = T.driftTime + (cfg?.drift?.realign || 0.8);
    d.modeBlocked = ctx.player.engineOut ? 'engine' : now-d.since >= T.driftTime ? 'duration'
      : speed < (cfg?.creep || 40) ? 'speed' : !separating ? 'alignment'
      : remaining <= duration ? 'authorization' : ctx.ship.burnerActive ? 'burner'
      : !(ctx.ship.driftActive || now >= ctx.ship.driftReadyAt) ? 'cooldown'
      : !clearManeuver(ctx, c, speed, duration) ? 'clearance' : '';
    lease.drift = !d.modeBlocked; d.maneuver = lease.drift ? 'drift' : 'strafe';
    d.driftRequested ||= lease.drift;
  }
  const boost = Math.max(speed, (cfg?.maxSpeed || Infinity) * (cfg?.afterburner?.multiplier || 2) * (ctx.bio?.speedFactor || 1));
  const stopTime = boost / cfg?.acceleration;
  const localVelocity = v?.clone().applyQuaternion(ctx.ship.object.quaternion.clone().invert());
  const aligned = localVelocity && -localVelocity.z > speed * 0.95;
  if (d.withdrawal) {
    d.modeBlocked = ctx.player.engineOut ? 'engine' : d.hot ? 'heat'
      : ctx.player.power < POWER.afterburnerMin ? 'power'
      : !(ctx.ship.burnerActive || now >= ctx.ship.burnerReadyAt) ? 'cooldown'
      : ctx.ship.driftActive || lease.drift ? 'drift'
      : !separating || !aligned || a.bearing[2] <= 0.8 ? 'alignment'
      : remaining <= T.burnTime+stopTime ? 'authorization'
      : !clearManeuver(ctx, c, boost, T.burnTime) ? 'clearance'
      : d.burnAt !== null && now-d.burnAt >= T.burnTime ? 'duration' : '';
    if (!d.modeBlocked) {
      if (d.burnAt === null) { d.burnAt = now; d.burnerRequested = true; lease.burnerEdge = true; }
      lease.burner = true; d.maneuver = 'burn';
    } else if (d.modeBlocked === 'clearance' && ctx.ship.burnerActive && d.burnerRequested) {
      lease.throttle = lease.steerX = lease.steerY = lease.strafeX = lease.strafeY = 0;
      c.movementBlocked = c.fireBlocked = d.reason = 'obstructed'; d.maneuver = 'stopped';
    }
  }
  if (d.hot) c.fireBlocked = 'heat';
}
export function defenseApplied(ctx, c) {
  const d = c.defense;
  if (d.latestCue && d.latestCue.appliedWallMs === null) {
    d.latestCue.appliedWallMs = wall(); d.latestCue.response = c.movementBlocked || d.phase;
  }
  if (d.stance !== 'off' && (d.phase === 'evading' || d.withdrawal) && d.reactedAt === null) {
    d.reactedAt = ctx.world.time; d.appliedWallMs = wall();
  }
}
