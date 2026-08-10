/**
 * Title screen system.
 *
 * OWNERSHIP:
 * - Sets ctx.flags.paused at boot when not skipped; clears it on CONTINUE.
 * - Owns the capture-phase keydown listener while open; swallows all input
 *   except KeyO (settings) and Escape (settings panel close), which must pass
 *   through to the settings system.
 * - Owns the title overlay DOM and its lifecycle (create/remove).
 *
 * CONTRACTS:
 * - CONTINUE: closes the title screen and unpauses the simulation.
 * - NEW GAME (no autosave): closes the title; ctx.flags.paused stays untouched
 *   because origins.js already paused and will unpause when the player picks.
 * - NEW GAME (with autosave): first activation arms a confirm that warns about
 *   erasing the autosave; second activation clears autosave, sets the skip
 *   marker, and reloads the page. A reload is the only way to guarantee a
 *   clean world state across world.js record banks, contacts, mystery, and
 *   epics — a partial in-place reset would be a bug farm.
 * - SETTINGS: dispatches a synthetic KeyO keydown event to every window
 *   listener so the settings panel opens; the title stays open behind it.
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

/**
 * Initialize the title screen.
 * Returns { update() {} } with no per-frame work.
 */
export function initTitle(ctx) {
  // Skip marker check: if the player already saw the title, don't show it again.
  const skipMarker = globalThis.sessionStorage?.getItem('rimward-title-skip');
  if (skipMarker === '1') {
    globalThis.sessionStorage?.removeItem('rimward-title-skip');
    return { update() {} };
  }

  // Pause the simulation while the title is open.
  ctx.flags.paused = true;

  // Confirm arming + the rendered NEW GAME button. Both are declared before
  // the entry table because the table's run() closures capture them.
  let confirmArmed = false;
  let newBtn = null;
  let newIndex = 0;

  // Build entry list as data, then filter out 'continue' if no autosave exists.
  const hasSave = hasAutosave();
  const entries = [
    {
      id: 'rw-title-continue',
      action: 'continue',
      label: 'CONTINUE',
      run: () => {
        // CONTINUE: close title and unpause.
        closeTitle();
        ctx.flags.paused = false;
      },
    },
    {
      id: 'rw-title-new',
      action: 'new',
      label: 'NEW GAME',
      run: () => {
        if (!hasSave) {
          // No autosave: close title, don't touch pause (origins owns it).
          closeTitle();
          return;
        }
        // Autosave exists: arm the confirm state.
        if (!confirmArmed) {
          confirmArmed = true;
          if (newBtn) {
            newBtn.textContent = `[${newIndex}] NEW GAME — CONFIRM (ERASES AUTOSAVE)`;
            newBtn.classList.add('screen-btn-warm');
          }
        } else {
          // Second activation: clear autosave, set skip marker, reload.
          clearAutosave();
          globalThis.sessionStorage?.setItem('rimward-title-skip', '1');
          globalThis.location?.reload?.();
        }
      },
    },
    {
      id: 'rw-title-settings',
      action: 'settings',
      label: 'SETTINGS',
      run: () => {
        // SETTINGS: dispatch synthetic KeyO to open settings panel.
        // Title stays open behind the settings panel.
        if (globalThis.KeyboardEvent) {
          const event = new KeyboardEvent('keydown', { code: 'KeyO' });
          globalThis.window.dispatchEvent(event);
        }
      },
    },
  ];

  // Filter out 'continue' if no autosave.
  const visibleEntries = hasSave ? entries : entries.filter((e) => e.action !== 'continue');

  // Build the DOM.
  const root = document.createElement('div');
  root.id = 'rw-title';
  root.className = 'screen-overlay title-overlay';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'RIMWARD title screen');

  const menu = document.createElement('div');
  menu.className = 'title-menu';
  root.appendChild(menu);

  // Tagline.
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

  // Legend showing key shortcuts.
  const legend = document.createElement('div');
  legend.className = 'title-legend';
  legend.textContent = `PRESS 1-${visibleEntries.length} OR CLICK`;
  menu.appendChild(legend);

  document.body.appendChild(root);

  // Map of digit codes to visible entries.
  const digitToEntry = {};
  visibleEntries.forEach((entry, index) => {
    if (index < 9) {
      digitToEntry[`Digit${index + 1}`] = entry;
    }
  });

  // Capture-phase keydown listener: swallows all input except KeyO/Escape.
  function onKey(e) {
    if (e.repeat) {
      e.preventDefault?.();
      e.stopImmediatePropagation?.();
      return;
    }

    // KeyO and Escape pass through to settings panel.
    if (e.code === 'KeyO' || e.code === 'Escape') {
      return;
    }

    // Digit keys activate the corresponding entry.
    if (digitToEntry[e.code]) {
      e.preventDefault?.();
      e.stopImmediatePropagation?.();
      digitToEntry[e.code].run();
      return;
    }

    // Enter activates the first visible entry.
    if (e.code === 'Enter' && visibleEntries.length > 0) {
      e.preventDefault?.();
      e.stopImmediatePropagation?.();
      visibleEntries[0].run();
      return;
    }

    // Every other key is swallowed.
    e.preventDefault?.();
    e.stopImmediatePropagation?.();
  }

  // Prevent clicks on the root from reaching the canvas.
  root.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });
  root.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Register the capture-phase keydown listener.
  globalThis.window?.addEventListener('keydown', onKey, true);

  // Helper to close the title: remove DOM and listener.
  function closeTitle() {
    root.remove();
    globalThis.window?.removeEventListener('keydown', onKey, true);
  }

  // No per-frame work.
  return {
    update() {},
  };
}
