/**
 * BIO-04 psionic eligibility. Combat and HUD import this helper.
 * Duplicate the hangar own-key grafted test here — do not import that module.
 */

import { WEAPONS } from './state.js';

function graftedOwnTrue(obj) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, 'grafted') && obj.grafted === true;
}

/** Catalog row present with finite fire numbers. Missing row → group 5 is empty. */
export function psionicCatalogOk() {
  if (!Object.hasOwn(WEAPONS, 'psionic')) return false;
  const w = WEAPONS.psionic;
  if (!w) return false;
  return Number.isFinite(w.rof) && Number.isFinite(w.speed)
    && Number.isFinite(w.range) && Number.isFinite(w.heatPerShot);
}

/**
 * True for a living hull (including a starter with no hullKind yet) or an
 * own-key grafted === true player. ship.js treats unset hullKind as living
 * mesh; Digit 5 must match that. Built stays dry unless graftedOwnTrue.
 * Do not use faction-beauty or HUD family skin as the fire test.
 */
export function canFirePsionic(ctx) {
  const p = ctx && ctx.player;
  if (!p) return false;
  if (p.hullKind === 'built') return graftedOwnTrue(p);
  return true;
}
