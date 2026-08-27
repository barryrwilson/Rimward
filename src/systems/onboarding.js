import { ORIGINS } from '../game/state.js';

/**
 * Onboarding hints (§25) — one-time contextual teaching lines.
 *
 * A module-local HINTS table is evaluated in order, one hint visible at a
 * time; each id is pushed into ctx.world.onboarding.seen the moment it is
 * SHOWN and never fires again (seen persists via save.js WORLD_FIELDS, so
 * hints survive save/load). Conditions are cheap field reads; once every
 * hint is seen the update loop early-outs.
 *
 * Display: one `.rw-onboard-hint` node (role=status, polite live region).
 * Created here; HUD init may reparent it onto `#hud` (not the reticle).
 * Tokens live in hud.css. Auto-dismisses after 8 s or on any keydown.
 *
 * Lesson (after authored world.origin): look → throttle → target → hail →
 * dock → chart, one at a time. Contextual gate/combat/mine/feed/repair/saved
 * keep their live `when`. Missing/unknown origin → no lesson (not a dump).
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
 * Fail closed: never throw from show/update/when; unknown id skip; seen
 * not an array → empty in memory. Paint is textContent only.
 *
 * update(dt) performs zero allocation: all DOM is built once at init, the
 * event scan reuses ctx.lastEvents, and hint state is plain module vars.
 */

const HINT_DURATION = 8; // s before auto-dismiss

// Module-scope hint flags (referenced by HINTS closures below; reset at init).
let repairPending = false; // hull low while docked — show on next undock
let repairReady = false;   // undock seen with repairPending — queued to show
let savedReady = false;    // first 'docked' event seen — queued to show

function originIsAuthored(ctx) {
  try {
    const id = ctx && ctx.world && ctx.world.origin;
    return typeof id === 'string' && id.length > 0 && Object.hasOwn(ORIGINS, id);
  } catch {
    return false;
  }
}

const HINTS = [
  { id: 'look',
    when: (ctx) => originIsAuthored(ctx),
    text: 'Mouse — look and turn toward the reticle' },
  { id: 'throttle',
    when: (ctx) => originIsAuthored(ctx),
    text: 'R/F — throttle · double-tap F — stop' },
  { id: 'target',
    when: (ctx) => originIsAuthored(ctx),
    text: 'T — cycle target' },
  { id: 'hail',
    when: (ctx) => originIsAuthored(ctx),
    text: 'H — hail the lock' },
  { id: 'dock',
    when: (ctx) => originIsAuthored(ctx),
    text: 'J — dock when the station is in range' },
  { id: 'chart',
    when: (ctx) => originIsAuthored(ctx),
    text: 'M — galaxy chart' },
  { id: 'gate',
    when: (ctx) => ctx.gate.inZone === true,
    text: 'J — jump the gate' },
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

const HINT_ID_SET = new Set();
for (let i = 0; i < HINTS.length; i++) {
  const id = HINTS[i] && HINTS[i].id;
  if (typeof id === 'string') HINT_ID_SET.add(id);
}

function isAuthoredHintId(id) {
  return typeof id === 'string' && HINT_ID_SET.has(id);
}

export function initOnboarding(ctx) {
  try {
    ctx.world.onboarding ??= { seen: [] };
  } catch {
    /* fail closed — seenNow() retries */
  }

  repairPending = false;
  repairReady = false;
  savedReady = false;

  const el = document.createElement('div');
  el.className = 'rw-onboard-hint';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  el.style.display = 'none';
  try {
    const ts = ctx.settings && ctx.settings.textScale;
    if (typeof ts === 'number' && Number.isFinite(ts) && ts > 0) {
      el.style.setProperty('--rw-text-scale', String(ts));
    }
  } catch {
    /* inherit later from #hud if present */
  }
  try {
    document.body.appendChild(el);
  } catch {
    /* no document.body — paint stays skipped */
  }

  let showing = null; // HINTS entry currently visible
  let shownAt = 0;    // ctx.elapsed when it appeared

  function seenNow() {
    try {
      if (!ctx.world || typeof ctx.world !== 'object') return [];
      let rec = ctx.world.onboarding;
      if (!rec || typeof rec !== 'object') {
        rec = { seen: [] };
        ctx.world.onboarding = rec;
      }
      if (!Array.isArray(rec.seen)) rec.seen = [];
      return rec.seen;
    } catch {
      return [];
    }
  }

  function hide() {
    try {
      if (!showing) return;
      showing = null;
      el.style.display = 'none';
    } catch {
      showing = null;
    }
  }

  function show(hint) {
    try {
      if (!hint || !isAuthoredHintId(hint.id)) return;
      showing = hint;
      shownAt = ctx.elapsed;
      el.textContent = typeof hint.text === 'string' ? hint.text : '';
      el.style.display = 'block';
      const seen = seenNow();
      if (Array.isArray(seen) && !seen.includes(hint.id)) seen.push(hint.id);
    } catch {
      /* never throw from hint paint */
    }
  }

  function whenHolds(hint) {
    try {
      return !!hint.when(ctx);
    } catch {
      return false;
    }
  }

  function seenHasAuthored(seen, id) {
    try {
      if (!isAuthoredHintId(id) || !Array.isArray(seen)) return false;
      return seen.includes(id);
    } catch {
      return false;
    }
  }

  function allAuthoredSeen(seen) {
    try {
      if (!Array.isArray(seen)) return false;
      for (let i = 0; i < HINTS.length; i++) {
        const id = HINTS[i] && HINTS[i].id;
        if (!isAuthoredHintId(id)) continue;
        if (!seen.includes(id)) return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // Any key dismisses the visible hint; the queue advances next frame.
  try {
    window.addEventListener('keydown', () => { try { hide(); } catch { /* skip */ } });
  } catch {
    /* no window */
  }

  function update(_dt) {
    try {
      const seen = seenNow();
      // Live settings read: toggled off mid-display hides immediately.
      if (ctx.settings.hints === false) { hide(); return; }
      if (ctx.gate.jumping) { hide(); return; }

      // Event arming — must run while docked too, since the dock/undock events
      // surface in lastEvents on a frame where the flag is already set.
      const evs = ctx.lastEvents;
      if (Array.isArray(evs)) {
        for (let i = 0; i < evs.length; i++) {
          const type = evs[i] && evs[i].type;
          if (type === 'undocked') {
            if (repairPending) {
              repairPending = false;
              if (!seenHasAuthored(seen, 'repair')) repairReady = true;
            }
          } else if (type === 'docked') {
            if (!seenHasAuthored(seen, 'saved')) savedReady = true;
          }
        }
      }

      if (ctx.flags.docked) {
        try {
          if (ctx.player && ctx.player.hull < ctx.player.hullMax * 0.8) repairPending = true;
        } catch {
          /* skip hull read */
        }
        hide(); // suppressed at the dock — deferred hints fire after undock
        return;
      }

      if (showing) {
        if (ctx.elapsed - shownAt >= HINT_DURATION) hide();
        else return; // one at a time — queue advances after dismiss
      }

      if (allAuthoredSeen(seen)) return;

      for (let i = 0; i < HINTS.length; i++) {
        const hint = HINTS[i];
        if (!hint || !isAuthoredHintId(hint.id)) continue;
        if (seenHasAuthored(seen, hint.id)) continue;
        if (whenHolds(hint)) {
          if (hint.id === 'repair') repairReady = false;
          else if (hint.id === 'saved') savedReady = false;
          show(hint);
          return;
        }
      }
    } catch {
      /* never throw from hint paint */
    }
  }

  return { update };
}
