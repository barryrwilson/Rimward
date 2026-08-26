/**
 * Play-card mutex for hail / galaxy chart / berth records.
 * Authored ids only. One session defer slot. Boolean reads — no per-frame DOM.
 * Never writes ctx.flags.paused. Never throws.
 */

export const OVERLAY_IDS = Object.freeze(['hail', 'chart', 'berth']);

/** @type {null | { ship: object, intents?: string[], line?: string, demand?: unknown, salvage?: boolean }} */
let deferredHail = null;

function flagsOf(ctx) {
  return ctx && ctx.flags;
}

export function overlayIsOpen(ctx, id) {
  try {
    const f = flagsOf(ctx);
    if (!f) return false;
    if (id === 'hail') return f.hailOpen === true;
    if (id === 'chart') return f.chartOpen === true;
    if (id === 'berth') return f.berthOpen === true;
    return false;
  } catch {
    return false;
  }
}

function bodyKids() {
  const body = typeof document !== 'undefined' ? document.body : null;
  return body && body.children ? body.children : null;
}

/** Title capture still owns keys while `#rw-title` is a body child. */
export function titleOwnsScreen() {
  try {
    const kids = bodyKids();
    if (!kids) return false;
    for (let i = 0; i < kids.length; i++) {
      if (kids[i] && kids[i].id === 'rw-title') return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Settings z-80 panel: body child, inner dialog labelled Settings. */
export function settingsOwnsScreen() {
  try {
    const kids = bodyKids();
    if (!kids) return false;
    for (let i = 0; i < kids.length; i++) {
      const root = kids[i];
      if (!root || !root.children) continue;
      const d = root.style && root.style.display;
      if (!d || d === 'none') continue;
      const inner = root.children;
      for (let j = 0; j < inner.length; j++) {
        const p = inner[j];
        if (p && typeof p.getAttribute === 'function' && p.getAttribute('aria-label') === 'Settings') {
          return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function isTypingFocus() {
  try {
    const focus = typeof document !== 'undefined' ? document.activeElement : null;
    if (!focus) return false;
    const tag = focus.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || !!focus.isContentEditable;
  } catch {
    return false;
  }
}

export function playSurfaceBlocked(ctx) {
  try {
    if (titleOwnsScreen()) return true;
    if (ctx && ctx.models && typeof ctx.models.isOpen === 'function' && ctx.models.isOpen()) return true;
    if (isTypingFocus()) return true;
    return false;
  } catch {
    return false;
  }
}

export function hailCalmOk(ctx, ship) {
  try {
    if (!ship || !ship.state || ship.state.destroyed) return false;
    const now = (ctx && ctx.world && typeof ctx.world.time === 'number') ? ctx.world.time : 0;
    const calm = (ship.ai && typeof ship.ai.calmUntil === 'number') ? ship.ai.calmUntil : 0;
    return now >= calm;
  } catch {
    return false;
  }
}

/**
 * @returns {true | false | 'defer'}
 */
export function canShowHail(ctx, ship) {
  try {
    if (!hailCalmOk(ctx, ship)) return false;
    if (overlayIsOpen(ctx, 'chart') || overlayIsOpen(ctx, 'berth')) return 'defer';
    return true;
  } catch {
    return false;
  }
}

export function canOpenPlayCard(ctx, id) {
  try {
    if (id !== 'hail' && id !== 'chart' && id !== 'berth') return false;
    if (id !== 'hail' && overlayIsOpen(ctx, 'hail')) return false;
    if (id !== 'chart' && overlayIsOpen(ctx, 'chart')) return false;
    if (id !== 'berth' && overlayIsOpen(ctx, 'berth')) return false;
    return true;
  } catch {
    return false;
  }
}

export function deferIncomingHail(ev) {
  try {
    if (!ev || !ev.ship) {
      deferredHail = null;
      return;
    }
    deferredHail = {
      ship: ev.ship,
      intents: ev.intents,
      line: ev.line,
      demand: ev.demand,
      salvage: ev.salvage,
    };
  } catch {
    deferredHail = null;
  }
}

export function dropDeferredHail(ship) {
  try {
    if (!deferredHail) return;
    if (!ship || deferredHail.ship === ship) deferredHail = null;
  } catch {
    deferredHail = null;
  }
}

/** Returns the slot only when chart/berth are closed and the hull is still hailable. */
export function takeDeferredHail(ctx) {
  try {
    const slot = deferredHail;
    if (!slot) return null;
    if (overlayIsOpen(ctx, 'chart') || overlayIsOpen(ctx, 'berth')) return null;
    deferredHail = null;
    const ship = slot.ship;
    if (!ship || !ship.state || ship.state.destroyed) return null;
    if (ctx && ctx.ships && !ctx.ships.includes(ship)) return null;
    if (!hailCalmOk(ctx, ship)) return null;
    return slot;
  } catch {
    deferredHail = null;
    return null;
  }
}

export function hailDigitsAllowed(ctx) {
  try {
    if (ctx && ctx.flags && ctx.flags.paused) return false;
    if (playSurfaceBlocked(ctx)) return false;
    if (settingsOwnsScreen()) return false;
    if (overlayIsOpen(ctx, 'chart') || overlayIsOpen(ctx, 'berth')) return false;
    return true;
  } catch {
    return false;
  }
}

/** Session berth hold. Missing flag / throw → false. Never reads as pause. */
export function berthHeld(ctx) {
  try {
    return !!(ctx && ctx.flags && ctx.flags.berthHold === true);
  } catch {
    return false;
  }
}

/** Session berth hold writer. Never writes flags.paused. Never throws. */
export function setBerthHold(ctx, next) {
  try {
    if (!ctx || !ctx.flags) return;
    ctx.flags.berthHold = next === true;
  } catch {
    /* skip hold write; never fall back to paused */
  }
}
