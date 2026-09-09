/**
 * Issue #61: short-lived tactical memory, owned and applied by controls.js.
 * Reads the selected hull's HUD sample and visible body geometry only. Never
 * writes input, transforms, velocity, weapons or another helm's channel.
 * #62 may replace a command inside this owner; it cannot renew authorization.
 */
import { WEAPONS, HEAT, U } from './state.js';
import { selectedWeaponKey } from './weapon-fit.js';
import { canFirePsionic } from './psionic.js';
import { localDir } from './agent-schema.js';
import { collectBodies } from './collision.js';
import { PHY } from './physics.js';
import { effectiveTurnRadius } from './ap-path.js';
import { hoverTurnRateFor } from './flight-feel.js';

const bodies = { count: 0, items: [] };
const clamp = (n, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, n));
const attack = intent => intent === 'engage' || intent === 'disable';
const vector = v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);

export function combatWeapon(ctx) {
  const key = selectedWeaponKey(ctx);
  if (!key || key === 'mining' || (key === 'psionic' && !canFirePsionic(ctx))) return null;
  if (key === 'missile' && !(ctx.world.missileAmmo > 0)) return null;
  return WEAPONS[key] || null;
}

/** Only a fresh, identity-bound HUD digest can authorize a firing correction. */
export function combatSample(ctx, target) {
  const a = ctx.targets?.aim;
  const age = ctx.world.time - a?.t;
  if (!a || a.targetId !== target.id || a.system !== ctx.world.currentSystem
      || a.weaponGroup !== ctx.input.weaponGroup
      || !(age >= 0 && age <= 0.25) || !vector(a.bearing)
      || !(a.dist > 0 && a.dist <= U.TARGET_RANGE)
      || !Number.isFinite(a.closing) || !Number.isFinite(a.speed)) return null;
  return a;
}

export function createCombat(ctx, target, intent) {
  return {
    target, record: target.record, system: ctx.world.currentSystem,
    targetId: target.id, intent, weaponGroup: ctx.input.weaponGroup,
    weapon: combatWeapon(ctx), phase: attack(intent) ? 'intercept' : intent,
    phaseAt: ctx.world.time, repositionAfter: 0, clearSince: null, side: 1,
    sampleAt: null, yaw: 0, pitch: 0, yawRate: 0, pitchRate: 0, motion: null,
    fireBlocked: 'alignment', movementBlocked: '', completedAt: null,
  };
}

export function combatView(c) {
  return {
    targetId: c.targetId, intent: c.intent, phase: c.phase,
    weaponGroup: c.weaponGroup, fireBlocked: c.fireBlocked,
    movementBlocked: c.movementBlocked, completedAt: c.completedAt,
  };
}

/** A bounded look ahead in current ship-local coordinates. No AI reads. */
function obstacle(ctx, speed) {
  collectBodies({ station: ctx.station, config: ctx.config, systems: ctx.systems,
    world: ctx.world, asteroids: ctx.asteroids }, bodies);
  const p = ctx.ship.object.position, q = ctx.ship.object.quaternion;
  const look = Math.max(60, speed * 2);
  let nearest = null;
  for (let i = 0; i < bodies.count; i++) {
    const b = bodies.items[i];
    // Hull avoidance below handles the explicitly selected opponent. Other
    // ships aren't sensed through an unbounded private traffic enumeration.
    if (b.kind === 'ship' || b.kind === 'player') continue;
    const dx = b.x - p.x, dy = b.y - p.y, dz = b.z - p.z;
    const dist = Math.hypot(dx, dy, dz);
    if (!(dist <= U.TARGET_RANGE)) continue;
    const r = (b.kind === 'station' ? Math.hypot(b.r, Math.max(Math.abs(b.y0), Math.abs(b.y1)))
      : b.kind === 'gate' ? b.r + b.y0 : b.r) + PHY.PLAYER_RADIUS + 12;
    const v = localDir(q, dx, dy, dz);
    if (!v) continue;
    const along = -v[2] * dist, lateral = Math.hypot(v[0], v[1]) * dist;
    if ((along > 0 && along < look + r && lateral < r)
        && (!nearest || dist - r < nearest.clearance)) {
      nearest = { x: v[0], y: v[1], clearance: dist - r };
    }
  }
  // The sun is a public scene body, but collectBodies intentionally omits it.
  const sun = ctx.config?.world?.sunPosition;
  const radius = ctx.systems?.[ctx.world.currentSystem]?.sunRadius || ctx.config?.world?.sunRadius;
  if (sun && radius > 0) {
    const dx = sun.x - p.x, dy = sun.y - p.y, dz = sun.z - p.z;
    const dist = Math.hypot(dx, dy, dz), r = radius * PHY.SUN_HEAT_MULT + 20;
    const v = localDir(q, dx, dy, dz);
    if (v && (-v[2] * dist > 0 && -v[2] * dist < look + r && Math.hypot(v[0], v[1]) * dist < r)
        && (!nearest || dist - r < nearest.clearance)) nearest = { x: v[0], y: v[1], clearance: dist - r };
  }
  return nearest;
}

/** Returns a terminal reason, or updates the ordinary normalized command. */
export function combatTick(ctx, lease) {
  const c = lease.combat, target = c.target, now = ctx.world.time;
  lease.fire = false;
  lease.drift = false;
  lease.roll = lease.strafeX = lease.strafeY = 0;
  c.fireBlocked = '';
  c.movementBlocked = '';
  if (c.system !== ctx.world.currentSystem) return 'jump';
  if (target.state?.destroyed) return 'target-destroyed';
  if (!ctx.ships.includes(target) || target.record !== c.record || target.id !== c.targetId) return 'target-lost';
  if (attack(c.intent) && target.state?.surrendered) return 'target-surrendered';
  if (attack(c.intent) && target.state?.disabled) return 'target-disabled';
  if (ctx.input.weaponGroup !== c.weaponGroup) return 'weapon-changed';
  if (ctx.flags.matchSpeed) return 'match-speed';
  if (!target.object?.position) return 'target-lost';
  const dist = ctx.ship.object.position.distanceTo(target.object.position);
  if (!Number.isFinite(dist)) return 'target-lost';
  if (!(dist <= U.TARGET_RANGE)) {
    if (c.intent === 'retreat') return 'retreated';
    if (c.intent === 'break-off' && c.clearSince !== null && now - c.clearSince >= 2) return 'disengaged';
    return 'target-lost';
  }
  if (ctx.targets.current !== target) return ctx.targets.current ? 'target-changed' : 'target-lost';
  const a = combatSample(ctx, target);
  if (!a) return 'target-lost';
  const w = c.weapon;
  const reach = w?.range || WEAPONS.cannon.range;
  const b = vector(a.leadBearing) ? a.leadBearing : a.bearing;
  const across = Math.hypot(b[0], b[1]);
  const angle = Math.atan2(across, -b[2]);
  // Shortest rotation from the nose, without the yaw discontinuity when a
  // crossing contact passes overhead. Ship.js still applies normal axes.
  let yaw = across > 0.02 ? b[0] / across * angle : (b[2] > 0 ? c.side * angle : 0);
  let pitch = across > 0.02 ? b[1] / across * angle : 0;
  // Stable side when a contact is directly aft; signed zero must not flip it.
  if (b[2] > 0 && Math.abs(b[0]) < 0.02) yaw = c.side * Math.abs(yaw);
  else if (Math.abs(yaw) > 0.2) c.side = Math.sign(yaw);
  if (c.sampleAt !== null && a.t > c.sampleAt) {
    const dt = a.t - c.sampleAt;
    const deltaYaw = Math.atan2(Math.sin(yaw - c.yaw), Math.cos(yaw - c.yaw));
    c.yawRate += (deltaYaw / dt - c.yawRate) * Math.min(1, dt * 8);
    c.pitchRate += ((pitch - c.pitch) / dt - c.pitchRate) * Math.min(1, dt * 8);
  }
  c.sampleAt = a.t; c.yaw = yaw; c.pitch = pitch;
  const aimError = Math.hypot(yaw, pitch);
  const speed = ctx.ship.speed;
  const turnRadius = effectiveTurnRadius(ctx.player.classKey, speed);
  // The visible mesh proxy includes a disguised hull's cover geometry. Never
  // use a concealed record/class or the combat system's private proxy cache.
  const proxy = target.object.userData?.proxy;
  const scale = target.object.scale;
  const meshRadius = proxy ? Math.hypot(proxy.rx, proxy.ry, proxy.halfLen)
    * Math.max(scale?.x || 1, scale?.y || 1, scale?.z || 1) : 0;
  const hullRadius = Number.isFinite(meshRadius) && meshRadius > 0 ? meshRadius : target.state.radius || 4;
  const hullClearance = hullRadius + PHY.PLAYER_RADIUS + 20;
  const minimum = Math.max(45, hullClearance,
    Math.min(reach * 0.35, turnRadius * 0.8));
  // HUD closing is d(range)/dt: NEGATIVE while approaching.
  // A nearby pursuer behind the ship is not a frontal collision. Reversing
  // every turn toward that pursuer traps us in an endless no-fire orbit.
  const lateral = Math.hypot(a.bearing[0], a.bearing[1]) * a.dist;
  const ahead = a.bearing[2] < -0.5;
  const closing = Math.max(0, -a.closing);
  // The return-to-aim cooldown cannot defer an imminent frontal collision.
  // Budget an ordinary 45-degree turn (with lateral thrust), rather than a
  // fixed 0.3 s that cannot move a slow ship's nose before a second crossing.
  const turnRate = hoverTurnRateFor(ctx.player.classKey, speed) * (ctx.bio?.turnFactor || 1);
  const responseTime = clamp((Math.PI / 4) / turnRate, 0.3, 2.5);
  // Relative WORLD motion keeps our own yaw out of the collision estimate.
  // Only the selected visible hull is sampled, at fresh increasing HUD times.
  const p = target.object.position, own = ctx.ship.object.position;
  const relative = [p.x - own.x, p.y - own.y, p.z - own.z];
  if (!c.motion || a.t > c.motion.t) {
    const dt = a.t - c.motion?.t;
    const velocity = dt > 0 && dt <= 0.25
      ? relative.map((n, i) => (n - c.motion.relative[i]) / dt) : null;
    const speedBound = a.speed + speed;
    // A discontinuity inconsistent with observed speeds is not usable motion.
    const plausible = velocity?.every(Number.isFinite)
      && Math.hypot(...velocity) <= Math.max(speedBound, c.motion?.speedBound || 0) * 1.25 + 1;
    c.motion = { t: a.t, relative, speedBound, velocity: plausible ? velocity : null };
  }
  const velocity = c.motion.t === a.t && now - c.motion.t <= 0.25 ? c.motion.velocity : null;
  const crosses = (radius, horizon) => {
    const squaredSpeed = velocity?.reduce((sum, n) => sum + n * n, 0);
    // Initial, stale or invalid motion retains the conservative old corridor.
    if (!(squaredSpeed > 1e-8) || !Number.isFinite(squaredSpeed)) return lateral < radius && a.dist < radius + closing * horizon;
    const dot = relative.reduce((sum, n, i) => sum + n * velocity[i], 0);
    const t = clamp(-dot / squaredSpeed, 0, horizon);
    return Math.hypot(...relative.map((n, i) => n + velocity[i] * t)) < radius;
  };
  const hardPass = dist < hullClearance || (ahead && crosses(hullClearance, responseTime));
  const closePass = ahead && crosses(minimum, 1.2);
  const phase = name => { if (c.phase !== name) { c.phase = name; c.phaseAt = now; } };
  if (attack(c.intent)) {
    if (c.phase !== 'reposition' && (hardPass || (now >= c.repositionAfter && closePass))) phase('reposition');
    else if (c.phase === 'reposition') {
      // Equal/faster pursuit may never permit the preferred separation.
      // Finish the egress, then allow a full ordinary turn back to the nose.
      if (!hardPass && (now - c.phaseAt >= 3 || (now - c.phaseAt >= 2 && a.dist > minimum * 1.6 && a.closing > -5))) {
        phase('intercept'); c.repositionAfter = now + 6;
      }
    } else if (a.dist < reach * 0.9 && aimError < 0.5) phase('pass');
    else phase('intercept');
  }
  // Convert desired angular correction into ordinary normalized steering.
  // Otherwise creep speed multiplies this response down again in ship.js,
  // leaving a crossing lead just outside the firing cone. The clamp retains
  // the hull's physical turn limit; no extra closing speed is required.
  lease.steerX = clamp((yaw * 2.7 + c.yawRate * 0.45) / turnRate);
  lease.steerY = clamp((pitch * 2.7 + c.pitchRate * 0.45) / turnRate);
  // Flight speed has a normal creep floor. Never ask for a stop just because
  // the outer planner hasn't refreshed, or because the target crossed aft.
  lease.throttle = clamp((a.dist - reach * 0.35) / reach - Math.max(0, -a.closing) / 350, 0.12, 0.9);
  // Normalized steering still cannot exceed the physical turn rate at creep.
  // Build ordinary turning speed while closing the lead error; imminent
  // collision, egress and obstruction handling retain their lower setpoints.
  if (attack(c.intent) && !hardPass && aimError > 0.12) lease.throttle = Math.max(lease.throttle, 0.5);
  // Close inside the firing envelope instead of matching a receding target
  // just beyond it. This remains the existing ordinary throttle cap.
  if (attack(c.intent) && !hardPass && a.dist > reach * 0.9) lease.throttle = 0.9;
  if (attack(c.intent) && aimError > 0.5) {
    // The ordinary turn law slows at creep speed. Keep enough thrust for a
    // turn back, with lateral clearance while the pursuer crosses the side.
    lease.throttle = Math.max(lease.throttle, 0.18);
    if (a.dist < minimum * 2.5) lease.strafeX = (a.bearing[0] > 0 ? -1 : 1) * 0.8;
  }
  if (c.phase === 'reposition' || !attack(c.intent)) {
    const away = a.bearing;
    const awayYaw = Math.atan2(-away[0], away[2]);
    lease.steerX = clamp((Math.abs(away[0]) < 0.02 && away[2] < 0 ? c.side * Math.PI : awayYaw) * 2);
    lease.steerY = clamp(Math.atan2(-away[1], Math.hypot(away[0], away[2])) * 2);
    lease.strafeX = (Math.abs(away[0]) > 0.1 ? -Math.sign(away[0]) : c.side) * 0.8;
    // Brake the forward approach while the nose is still on the opponent.
    // Lateral thrust keeps the normal turn law moving; accelerate away only
    // as the nose clears the target, without a burner or physics override.
    lease.throttle = 0.18 + 0.72 * clamp((away[2] + 0.3) / 0.6, 0, 1);
    c.fireBlocked = c.phase;
  }
  const block = obstacle(ctx, speed);
  if (block) {
    c.movementBlocked = 'obstructed'; c.fireBlocked = 'obstructed';
    lease.steerX = block.x >= 0 ? -1 : 1;
    lease.steerY = block.y >= 0 ? -0.5 : 0.5;
    lease.strafeX = lease.steerX;
    lease.throttle = block.clearance < speed * 0.7 + 8 ? 0 : 0.12;
  }
  if (!attack(c.intent)) {
    // Remain inside the public envelope long enough to measure separation.
    // Completion means this maneuver finished, never a global safety claim.
    const clear = !block && a.dist > Math.min(U.TARGET_RANGE * 0.65, Math.max(300, reach * 0.8)) && a.closing > 1;
    c.clearSince = clear ? (c.clearSince ?? now) : null;
    if (c.clearSince !== null && now - c.clearSince >= (c.intent === 'retreat' ? 5 : 2)) {
      return c.intent === 'retreat' ? 'retreated' : 'disengaged';
    }
  } else if (!c.fireBlocked) {
    const currentWeapon = combatWeapon(ctx);
    // Existing muzzle convergence is restricted to the direct forward cone;
    // require both a plausible lead correction and that ordinary cone.
    c.fireBlocked = !currentWeapon || currentWeapon !== w ? 'weapon'
      : a.dist > w.range * 0.95 ? 'range'
      : ctx.player.overheated || ctx.player.heat + w.heatPerShot > HEAT.max - 8 ? 'heat'
      : a.bearing[2] > -0.97 || b[2] >= 0 || Math.hypot(yaw, pitch) > 0.20 ? 'alignment' : '';
    lease.fire = c.fireBlocked === '';
  }
  return '';
}
