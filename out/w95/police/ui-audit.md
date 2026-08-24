## UI Audit: police leave comm toast

### Summary
No HUD or CSS change. The leave line reuses the frozen `commLine` toast path. The toast stays readable. Reduced motion still shows the line (opacity 1, transitions off).

### What's done well
- One channel: `ctx.emit('commLine', { text: 'Leave this space.' })`. HUD `toastForEvent` maps `commLine` to `{ text, cls: 'comm' }`.
- Toast write is `slot.el.textContent = text` (`src/systems/hud.js` `pushToast`). No innerHTML. No hail card. No song sting.
- `.rw-toast` uses `--cyan` / `--white` tokens, `calc(11px * var(--rw-text-scale, 1))`, and a status live region (`role="status"`, `aria-live="polite"`).
- Copy is short (`Leave this space.`). Existing `white-space: nowrap` does not clip this line.
- Reduced motion: `body.rw-reduced-motion #hud * { animation: none; transition: none; }` and `.rw-toast.show { opacity: 1 }`. The toast appears at full opacity with no fade. No extra pulse.

### Findings

No 🔴 Blocker or 🟠 Major findings.

#### 💡 Suggestion: Existing uppercase treatment
**Location:** `src/ui/hud.css` `.rw-toast { text-transform: uppercase; }`
**Issue:** The player sees `LEAVE THIS SPACE.` The spoken/event copy stays `Leave this space.` as required.
**Fix:** Do not change HUD. All comm toasts already uppercase.

### Reduced motion
Still shows the toast. No extra pulse added. Pass.

### Re-review
HUD/CSS still unedited. `textContent` path and reduced-motion opacity hold. No Blocker/Major.
