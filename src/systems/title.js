/**
 * Title screen system.
 *
 * OWNERSHIP:
 * - Sets ctx.flags.paused at boot when not skipped; clears it on CONTINUE.
 * - Owns the capture-phase keydown listener while open; swallows all input
 *   except KeyO (settings) and Escape (settings panel close), which must pass
 *   through to the settings system.
 * - Owns the title overlay DOM and its lifecycle (create/remove).
 * - Remount from in-run pause (titleApi.openFromPause) does not reload and
 *   does not set rimward-title-skip. Skip marker remains NEW GAME reload only.
 *
 * CONTRACTS:
 * - CONTINUE: closes the title screen and unpauses via ctx.setPaused when
 *   present (flag + pauseEl hide). Falls back to flags.paused = false.
 * - NEW GAME (no autosave): closes the title; ctx.flags.paused stays untouched
 *   because origins.js already paused and will unpause when the player picks.
 * - NEW GAME (with autosave): first activation arms a confirm that warns about
 *   erasing the autosave; second activation clears autosave, sets the skip
 *   marker, and reloads the page. A reload is the only way to guarantee a
 *   clean world state across world.js record banks, contacts, mystery, and
 *   epics — a partial in-place reset would be a bug farm.
 * - SETTINGS: dispatches a synthetic KeyO keydown event to every window
 *   listener so the settings panel opens; the title stays open behind it.
 * - MODELS: opens the models browser overlay via ctx.models.open(); the title
 *   stays open behind it (same as SETTINGS — the browser is a viewer, not a
 *   game start).
 * - Manual berth slots (rimward-save-v1-slot-1/2/3) survive NEW GAME; only the
 *   autosave key is cleared.
 *
 * WHY CAPTURE PHASE AND FIRST REGISTRATION:
 * - The title's keydown listener must fire before controls.js and origins.js
 *   listeners so it can swallow all input while the "door is shut" — the game
 *   is not playable until the player dismisses the title.
 * - KeyO and Escape are the only keys allowed through; everything else is
 *   swallowed with preventDefault and stopImmediatePropagation so the canvas
 *   never sees keyboard input while the title is open.
 *
 * WHY NEW GAME RELOADS:
 * - A reload is the only way to guarantee a clean world state. Resetting
 *   live state in-place would leave residual data across world.js record
 *   banks, contacts, mystery state, epics, and other subsystems.
 */

import { hasAutosave, clearAutosave } from '../game/save.js';
import { disengage } from '../game/autopilot.js';
import { disengageAutomine } from '../game/automine.js';

/**
 * Initialize the title screen.
 * Returns { update() {} } with no per-frame work.
 */
export function initTitle(ctx) {
  let titleOpen = false;
  let root = null;
  let onKey = null;
  let confirmArmed = false;
  let newBtn = null;
  let newIndex = 0;
  let startEntries = [];

  function closeTitle() {
    if (!titleOpen) return;
    titleOpen = false;
    try {
      if (root) root.remove();
    } catch { /* remove is best-effort */ }
    try {
      if (onKey) globalThis.window?.removeEventListener('keydown', onKey, true);
    } catch { /* listener drop is best-effort */ }
    root = null;
    onKey = null;
  }

  function continueRun() {
    closeTitle();
    try {
      if (typeof ctx.setPaused === 'function') ctx.setPaused(false);
      else ctx.flags.paused = false;
    } catch {
      try { ctx.flags.paused = false; } catch { /* never throw from CONTINUE */ }
    }
  }

  function mountTitle(fromPause) {
    if (titleOpen) return;

    confirmArmed = false;
    newBtn = null;
    newIndex = 0;

    const hasSave = hasAutosave();
    const showContinue = fromPause === true || hasSave;

    const entries = [
      {
        id: 'rw-title-continue',
        action: 'continue',
        label: 'CONTINUE',
        run: () => {
          continueRun();
        },
      },
      {
        id: 'rw-title-new',
        action: 'new',
        label: 'NEW GAME',
        run: () => {
          const liveSave = hasAutosave();
          if (!liveSave) {
            // No autosave: close title, don't touch pause (origins owns it).
            closeTitle();
            return;
          }
          if (!confirmArmed) {
            confirmArmed = true;
            if (newBtn) {
              newBtn.textContent = `[${newIndex}] NEW GAME — CONFIRM (ERASES AUTOSAVE)`;
              newBtn.classList.add('screen-btn-warm');
            }
          } else {
            // Second activation: clear autosave, set skip marker, reload.
            // Pause-from-title never writes this marker.
            clearAutosave();
            globalThis.sessionStorage?.setItem('rimward-title-skip', '1');
            globalThis.location?.reload?.();
          }
        },
      },
      {
        id: 'rw-title-models',
        action: 'models',
        label: 'MODELS',
        run: () => {
          ctx.models?.open?.();
        },
      },
      {
        id: 'rw-title-settings',
        action: 'settings',
        label: 'SETTINGS',
        run: () => {
          if (globalThis.KeyboardEvent) {
            const event = new KeyboardEvent('keydown', { code: 'KeyO' });
            globalThis.window.dispatchEvent(event);
          }
        },
      },
    ];
    const visibleEntries = showContinue
      ? entries
      : entries.filter((e) => e.action !== 'continue');
    startEntries = visibleEntries;

    const nextRoot = document.createElement('div');
    nextRoot.id = 'rw-title';
    nextRoot.className = 'screen-overlay title-overlay';
    nextRoot.setAttribute('role', 'dialog');
    nextRoot.setAttribute('aria-label', 'RIMWARD title screen');

    const menu = document.createElement('div');
    menu.className = 'title-menu';
    nextRoot.appendChild(menu);

    const tagline = document.createElement('div');
    tagline.className = 'title-tagline';
    tagline.textContent = 'A LIVING FRONTIER';
    menu.appendChild(tagline);

    // Buttons: labeled with 1-based index among visible entries. The click
    // listener binds to the element we just built — document.getElementById is
    // useless here under the headless boot harness, whose stub memoises a fresh
    // empty node for any id it has not already seen.
    visibleEntries.forEach((entry, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'screen-btn';
      btn.id = entry.id;
      btn.setAttribute('data-title-action', entry.action);
      btn.textContent = `[${index + 1}] ${entry.label}`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation?.();
        entry.run();
      });
      if (entry.action === 'new') {
        newBtn = btn;
        newIndex = index + 1;
      }
      menu.appendChild(btn);
    });

    const legend = document.createElement('div');
    legend.className = 'title-legend';
    legend.textContent = `PRESS 1-${visibleEntries.length} OR CLICK`;
    menu.appendChild(legend);

    const digitToEntry = {};
    visibleEntries.forEach((entry, index) => {
      if (index < 9) {
        digitToEntry[`Digit${index + 1}`] = entry;
      }
    });

    function onTitleKey(e) {
      // The models browser is a modal in FRONT of the title. Its own
      // capture-phase listener registers later than this one, so without this
      // early-out the title would swallow the browser's own keys before it ever
      // sees them (init order, not z-order, decides who runs first).
      if (ctx.models?.isOpen?.()) return;

      if (e.repeat) {
        e.preventDefault?.();
        e.stopImmediatePropagation?.();
        return;
      }

      // KeyO and Escape pass through to settings panel.
      if (e.code === 'KeyO' || e.code === 'Escape') {
        return;
      }

      if (digitToEntry[e.code]) {
        e.preventDefault?.();
        e.stopImmediatePropagation?.();
        digitToEntry[e.code].run();
        return;
      }

      if (e.code === 'Enter' && visibleEntries.length > 0) {
        e.preventDefault?.();
        e.stopImmediatePropagation?.();
        visibleEntries[0].run();
        return;
      }

      e.preventDefault?.();
      e.stopImmediatePropagation?.();
    }

    try {
      document.body.appendChild(nextRoot);
      nextRoot.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      nextRoot.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      globalThis.window?.addEventListener('keydown', onTitleKey, true);
      root = nextRoot;
      onKey = onTitleKey;
      titleOpen = true;
    } catch (err) {
      try { globalThis.window?.removeEventListener('keydown', onTitleKey, true); } catch { /* skip */ }
      try { nextRoot.remove(); } catch { /* skip */ }
      root = null;
      onKey = null;
      titleOpen = false;
      if (fromPause !== true) throw err;
    }
  }

  function openFromPause() {
    try {
      if (titleOpen) return;
      mountTitle(true);
    } catch { /* never throw from remount */ }
  }

  ctx.titleApi = {
    isOpen() { return titleOpen === true; },
    start() {
      if (!titleOpen) return;
      for (let i = 0; i < startEntries.length; i++) {
        if (startEntries[i].action === 'continue') {
          startEntries[i].run();
          return;
        }
      }
      for (let i = 0; i < startEntries.length; i++) {
        if (startEntries[i].action === 'new') {
          startEntries[i].run();
          return;
        }
      }
    },
    openFromPause,
  };

  // Skip marker check: if the player already saw the title, don't show it again.
  const skipMarker = globalThis.sessionStorage?.getItem('rimward-title-skip');
  if (skipMarker === '1') {
    globalThis.sessionStorage?.removeItem('rimward-title-skip');
    return { update() {} };
  }

  // Pause the simulation while the title is open.
  ctx.flags.paused = true;
  disengage(ctx, 'pause');
  disengageAutomine(ctx, 'pause');

  mountTitle(false);

  return {
    update() {},
  };
}
