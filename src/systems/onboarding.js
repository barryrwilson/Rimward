import { U, SYSTEMS } from '../game/state.js';

/**
 * Onboarding hints (§25) — one-time contextual teaching lines.
 *
 * A module-local HINTS table is evaluated in order, one hint visible at a
 * time; each id is pushed into ctx.world.onboarding.seen the moment it is
 * SHOWN and never fires again (seen persists via save.js WORLD_FIELDS, so
 * hints survive save/load). Conditions are cheap field reads; once every
 * hint is seen the update loop early-outs.
 *
 * Display: bottom-center translucent dark card, monospace teal, z-index 35
 * (below the station overlay). Auto-dismisses after 8 s or on any keydown,
 * then the queue advances to the next due hint.
 *
 * Suppression: nothing is evaluated or shown while ctx.settings.hints ===
 * false (live read — toggling off mid-display hides immediately), while
 * docked, or while ctx.gate.jumping. Two hints are event-deferred by design:
 * 'repair' arms while docked with a low hull and SHOWS on the next
 * 'undocked' event; 'saved' arms on the first 'docked' event and shows once
 * the player is back in space (both consumed from ctx.lastEvents, the same
 * pattern hud.js uses — by the frame the event is visible the docked flag
 * is already set, so without the deferral they could never show).
 *
 * update(dt) performs zero allocation: all DOM is built once at init, the
 * event scan reuses ctx.lastEvents, and hint state is plain module vars.
 */

const HINT_DURATION = 8; // s before auto-dismiss

// Module-scope hint flags (referenced by HINTS closures below; reset at init).
let repairPending = false; // hull low while docked — show on next undock
let repairReady = false;   // undock seen with repairPending — queued to show
let savedReady = false;    // first 'docked' event seen — queued to show

const HINTS = [
  { id: 'move',
    when: (ctx) => ctx.world.time > 20,
    text: 'R/F — throttle · mouse — steer · Shift — drift · Space — burn' },
  { id: 'dock',
    when: (ctx) => {
      const sys = SYSTEMS[ctx.world.currentSystem];
      const obj = ctx.ship.object;
      if (!sys || !obj) return false;
      const p = sys.station.position;
      const o = obj.position;
      const dx = o.x - p[0], dy = o.y - p[1], dz = o.z - p[2];
      return dx * dx + dy * dy + dz * dz <= U.DOCK_RANGE * U.DOCK_RANGE;
    },
    text: 'D — dock' },
  { id: 'gate',
    when: (ctx) => ctx.gate.inZone === true,
    text: 'D — jump the gate' },
  { id: 'combat',
    when: (ctx) => ctx.flags.combat === true,
    text: 'T — target · H — hail · a surrendered rival pays better than a dead one' },
  { id: 'mine',
    when: (ctx) => ctx.input.weaponGroup === 3,
    text: 'hold LMB near an asteroid to mine' },
  { id: 'feed',
    when: (ctx) => ctx.bio.hunger > 0.5,
    text: 'she is hungry — dock and feed her' },
  { id: 'repair',
    when: () => repairReady,
    text: 'the yard itemizes repairs — hull, screen, shell, engine' },
  { id: 'saved',
    when: () => savedReady,
    text: 'progress saves on dock and on jump' },
];

export function initOnboarding(ctx) {
  ctx.world.onboarding ??= { seen: [] };
  // Re-resolved on every use: save.js may swap ctx.world.onboarding wholesale
  // on load (same discipline as mystery.js).
  const seenNow = () => (ctx.world.onboarding ??= { seen: [] }).seen;

  repairPending = false;
  repairReady = false;
  savedReady = false;

  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;left:50%;bottom:6%;transform:translateX(-50%);display:none;z-index:35;' +
    'padding:6px 14px;background:rgba(4,18,22,.78);border:1px solid rgba(111,242,224,.25);' +
    'border-radius:2px;font-size:11px;letter-spacing:.08em;color:#6ff2e0;pointer-events:none;' +
    "font-family:'Consolas','Menlo','Courier New',monospace;";
  document.body.appendChild(el);

  let showing = null; // HINTS entry currently visible
  let shownAt = 0;    // ctx.elapsed when it appeared

  function hide() {
    if (!showing) return;
    showing = null;
    el.style.display = 'none';
  }

  function show(hint) {
    showing = hint;
    shownAt = ctx.elapsed;
    el.textContent = hint.text;
    el.style.display = 'block';
    seenNow().push(hint.id); // fires ONCE ever — consumed when SHOWN
  }

  // Any key dismisses the visible hint; the queue advances next frame.
  window.addEventListener('keydown', () => hide());

  function update(dt) {
    const seen = seenNow();
    // Live settings read: toggled off mid-display hides immediately.
    if (ctx.settings.hints === false) { hide(); return; }
    if (ctx.gate.jumping) { hide(); return; }

    // Event arming — must run while docked too, since the dock/undock events
    // surface in lastEvents on a frame where the flag is already set.
    const evs = ctx.lastEvents;
    for (let i = 0; i < evs.length; i++) {
      const type = evs[i].type;
      if (type === 'undocked') {
        if (repairPending) {
          repairPending = false;
          if (!seen.includes('repair')) repairReady = true;
        }
      } else if (type === 'docked') {
        if (!seen.includes('saved')) savedReady = true;
      }
    }

    if (ctx.flags.docked) {
      if (ctx.player && ctx.player.hull < ctx.player.hullMax * 0.8) repairPending = true;
      hide(); // suppressed at the dock — deferred hints fire after undock
      return;
    }

    if (showing) {
      if (ctx.elapsed - shownAt >= HINT_DURATION) hide();
      else return; // one at a time — queue advances after dismiss
    }

    // Early-out once every hint has been seen.
    if (seen.length >= HINTS.length) return;

    // First unseen hint whose condition holds, in table order.
    for (let i = 0; i < HINTS.length; i++) {
      const hint = HINTS[i];
      if (seen.includes(hint.id)) continue;
      if (hint.when(ctx)) {
        if (hint.id === 'repair') repairReady = false;
        else if (hint.id === 'saved') savedReady = false;
        show(hint);
        return;
      }
    }
  }

  return { update };
}
