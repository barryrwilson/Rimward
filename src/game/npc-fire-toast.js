/**
 * npcFire toast matrix. Pure: no DOM, no WEAPONS index.
 * Missile vs player → Incoming dart. Cannon vs player (or ace omit) → Incoming fire.
 * Turret vs player (explicit target) → same Incoming fire. clock as cannon.
 * Unknown / reserved weapon keys fail closed.
 */

export const INCOMING_DART_TOAST = 'Incoming dart.';
export const INCOMING_FIRE_TOAST = 'Incoming fire.';
export const DART_TOAST_GAP = 2.5;
export const FIRE_TOAST_GAP = 2.5;

function ownKey(obj, key) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function ownWeapon(e) {
  if (!ownKey(e, 'weapon')) return null;
  const w = e.weapon;
  if (typeof w !== 'string' || !w) return null;
  if (w === '__proto__' || w === 'constructor' || w === 'prototype') return null;
  return w;
}

function parked(ctx) {
  if (!ctx) return false;
  if (ctx.flags && ctx.flags.docked) return true;
  if (ctx.gate && ctx.gate.jumping) return true;
  return false;
}

/**
 * @returns {{ text: string, cls: string } | null}
 */
export function npcFireToast(e, ctx, mem) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
  if (!mem || typeof mem !== 'object') return null;

  const weapon = ownWeapon(e);
  if (weapon !== 'missile' && weapon !== 'cannon' && weapon !== 'turret') return null;

  const elapsed = ctx && ctx.elapsed != null ? ctx.elapsed : 0;
  const hasTarget = ownKey(e, 'target');
  const target = hasTarget ? e.target : undefined;

  if (weapon === 'missile') {
    if (target !== 'player') return null;
    if (elapsed - (mem.lastIncomingDartAt ?? -1e9) < DART_TOAST_GAP) return null;
    mem.lastIncomingDartAt = elapsed;
    return { text: INCOMING_DART_TOAST, cls: 'warn' };
  }

  // cannon: player or omitted (ace). turret: player required (missing drops).
  // Live ship target is NPC-vs-NPC. Same Incoming fire. clock for cannon and turret.
  if (weapon === 'turret') {
    if (target !== 'player') return null;
  } else if (target != null && target !== 'player') {
    return null;
  }
  if (parked(ctx)) return null;
  if (elapsed - (mem.lastIncomingFireAt ?? -1e9) < FIRE_TOAST_GAP) return null;
  mem.lastIncomingFireAt = elapsed;
  return { text: INCOMING_FIRE_TOAST, cls: 'warn' };
}
